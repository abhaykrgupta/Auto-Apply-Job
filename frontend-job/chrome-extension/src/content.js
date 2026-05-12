/**
 * content.js — Main orchestrator
 * Loaded after: detector.js, classifier.js, filler.js, overlay.js, adapters/*.js
 *
 * Responsibilities:
 * 1. Extract job data and expose window.__jobAgentData
 * 2. Show floating badge on job listing pages
 * 3. Show Co-Pilot overlay on application pages (ATS detected)
 * 4. Handle TRIGGER_COPILOT message → run the correct adapter → show results
 */
(function () {
  'use strict';

  const atsId   = window.__ATS_ID__   ?? 'unknown';
  const atsMeta = window.__ATS_META__ ?? null;

  // ── 1. Extract job data ────────────────────────────────────────────────────

  function extractJob() {
    // If detector already set up scrapers, use them
    if (atsMeta) {
      const title   = window.__scrapeTitle?.()   ?? '';
      const company = window.__scrapeCompany?.() ?? '';
      const desc    = window.__scrapeJD?.()      ?? '';
      if (title) {
        return { title, company, description: desc, location: '', applyUrl: location.href };
      }
    }

    // Fallback selectors for non-ATS pages / unknown
    const url = location.href;
    let job = { title: '', company: '', description: '', location: '', applyUrl: url };

    if (url.includes('linkedin.com/jobs')) {
      job.title       = qs('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.trim() ?? '';
      job.company     = qs('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.trim() ?? '';
      job.location    = qs('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.trim() ?? '';
      job.description = qs('.jobs-description__content, .job-view-layout')?.trim()?.slice(0, 3000) ?? '';
    } else if (url.includes('indeed.com')) {
      job.title       = qs('[data-testid="jobsearch-JobInfoHeader-title"] span, h1.jobsearch-JobInfoHeader-title')?.trim() ?? '';
      job.company     = qs('[data-testid="inlineHeader-companyName"] a')?.trim() ?? '';
      job.location    = qs('[data-testid="job-location"]')?.trim() ?? '';
      job.description = qs('#jobDescriptionText, .jobsearch-jobDescriptionText')?.trim()?.slice(0, 3000) ?? '';
    } else if (url.includes('glassdoor.com')) {
      job.title       = qs('[data-test="job-title"]')?.trim() ?? '';
      job.company     = qs('[data-test="employer-name"]')?.trim() ?? '';
      job.description = qs('.jobDescriptionContent, [class*="JobDescription"]')?.trim()?.slice(0, 3000) ?? '';
    } else if (url.includes('wellfound.com') || url.includes('angel.co')) {
      job.title       = qs('h1, .job-title')?.trim() ?? '';
      job.company     = qs('.startup-link, [class*="company"]')?.trim() ?? '';
      job.description = qs('[class*="description"]')?.trim()?.slice(0, 3000) ?? '';
    }

    return job.title ? job : null;
  }

  function qs(selector) {
    return document.querySelector(selector)?.textContent ?? null;
  }

  const job = extractJob();
  if (job) window.__jobAgentData = job;

  // ── 2. Show floating badge on listing pages ────────────────────────────────

  const isApplicationPage = atsId !== 'unknown' && atsMeta?.applyPathPattern?.test(location.pathname);
  const isListingPage = job?.title && !isApplicationPage;

  if (isListingPage) {
    injectListingBadge(job);
  }

  // ── 3. Auto-show Co-Pilot overlay on application pages ───────────────────

  if (isApplicationPage) {
    // Small delay to let the page fully render
    setTimeout(() => {
      window.JobAgentOverlay?.show(atsId);
    }, 800);
  }

  // ── 4. Message listener ───────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'TRIGGER_COPILOT') {
      triggerCopilot().then(sendResponse);
      return true;
    }
  });

  // Also listen to the overlay's fill button click
  window.addEventListener('jobagent:trigger_fill', () => triggerCopilot());

  // ── 5. Main fill logic ────────────────────────────────────────────────────

  async function triggerCopilot() {
    // Show filling state
    window.JobAgentOverlay?.showFilling();
    if (!window.JobAgentOverlay?.isVisible()) {
      window.JobAgentOverlay?.show(atsId);
      window.JobAgentOverlay?.showFilling();
    }

    // Load profile from background
    const profileFlat = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (res) => {
        resolve(res?.profile ? flattenProfile(res.profile) : null);
      });
    });

    if (!profileFlat || !profileFlat.email) {
      window.JobAgentOverlay?.showResults([{
        field: 'profile',
        status: 'error',
        note: 'Profile not set up. Open the extension popup and click "Sync Profile".',
      }]);
      return { success: false, error: 'No profile' };
    }

    // Get job description text for JIT PDF and GPT answers
    const jdText = window.__scrapeJD?.() ?? document.body.innerText.slice(0, 4000);

    // Pick the right adapter
    const adapters = window.__JobAgentAdapters ?? {};
    const fillFn =
      adapters[atsId]     ??   // exact ATS match
      adapters.generic;        // universal fallback

    if (!fillFn) {
      window.JobAgentOverlay?.showResults([{ field: 'adapter', status: 'error', note: 'No adapter for this page.' }]);
      return { success: false, error: 'No adapter' };
    }

    // Run the adapter
    let results = [];
    try {
      results = await fillFn(profileFlat, jdText);
    } catch (err) {
      console.error('[Job Agent] Adapter error:', err);
      results = [{ field: 'error', status: 'error', note: err.message }];
    }

    // Show results in overlay
    window.JobAgentOverlay?.showResults(results);

    // Track to dashboard
    const filledCount = results.filter(r => r.status === 'filled').length;
    if (filledCount > 0) {
      chrome.runtime.sendMessage({
        type: 'APPLICATION_SUBMITTED',
        payload: {
          company:     job?.company ?? window.__scrapeCompany?.() ?? '',
          role:        job?.title   ?? window.__scrapeTitle?.() ?? document.title,
          atsId,
          url:         location.href,
          appliedAt:   new Date().toISOString(),
          status:      'in_progress',
          fieldsCount: filledCount,
        },
      });
    }

    return { success: true, filledCount };
  }

  // ── Profile flattener (mirrors profile.js getProfileFlat) ─────────────────

  function flattenProfile(profile) {
    const p   = profile.personal      ?? {};
    const w   = profile.work          ?? {};
    const c   = profile.compensation  ?? {};
    const a   = profile.workAuth      ?? {};
    const edu = (profile.education    ?? [])[0] ?? {};

    return {
      firstName:          p.firstName ?? '',
      lastName:           p.lastName ?? '',
      email:              p.email ?? '',
      phone:              p.phone ?? '',
      city:               p.city ?? '',
      state:              p.state ?? '',
      country:            p.country ?? '',
      linkedIn:           p.linkedIn ?? '',
      github:             p.github ?? '',
      portfolio:          p.portfolio ?? '',
      fullName:           [p.firstName, p.lastName].filter(Boolean).join(' '),
      jobTitle:           w.title ?? '',
      yearsExp:           String(w.yearsExp ?? ''),
      currentCompany:     w.currentCompany ?? '',
      summary:            w.summary ?? '',
      openToRelocate:     w.openToRelocate ? 'yes' : 'no',
      remoteOnly:         w.remoteOnly ? 'yes' : 'no',
      availableDate:      w.availableDate ?? '',
      desiredSalary:      String(c.desiredSalary ?? ''),
      currency:           c.currency ?? 'USD',
      workAuthStatus:     a.status ?? '',
      requireSponsorship: a.requireSponsorship ? 'yes' : 'no',
      degree:             edu.degree ?? '',
      educationField:     edu.field ?? '',
      school:             edu.school ?? '',
      graduationYear:     String(edu.graduationYear ?? ''),
      eeocGender:         profile.eeoc?.gender    ?? 'decline',
      eeocVeteran:        profile.eeoc?.veteran   ?? 'decline',
      eeocDisability:     profile.eeoc?.disability ?? 'decline',
      eeocRace:           profile.eeoc?.race       ?? 'decline',
      resumeUrl:          profile.resumeUrl ?? '',
      resumeVersion:      profile.resumeVersion ?? '',
    };
  }

  // ── Floating badge for job listing pages ──────────────────────────────────

  function injectListingBadge(job) {
    if (document.getElementById('job-agent-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'job-agent-badge';
    badge.innerHTML = `
      <div id="jab-inner" style="
        position:fixed;bottom:24px;right:24px;z-index:999999;
        background:linear-gradient(135deg,#6366f1,#7c3aed);color:white;
        border-radius:12px;padding:10px 16px;font-family:-apple-system,sans-serif;
        font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(99,102,241,0.4);
        cursor:pointer;display:flex;align-items:center;gap:8px;
        transition:transform 0.2s,opacity 0.3s;max-width:220px;
      ">
        🤖 <span>Job Agent — Check Match</span>
      </div>`;

    badge.addEventListener('mouseenter', () => {
      badge.querySelector('#jab-inner').style.transform = 'scale(1.04)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.querySelector('#jab-inner').style.transform = 'scale(1)';
    });
    badge.addEventListener('click', () => {
      chrome.storage.sync.get('dashboardUrl', ({ dashboardUrl }) => {
        window.open(`${dashboardUrl ?? 'http://localhost:3000'}/jobs`, '_blank');
      });
    });

    document.body.appendChild(badge);

    setTimeout(() => {
      const inner = badge.querySelector('#jab-inner');
      if (inner) inner.style.opacity = '0';
      setTimeout(() => badge.remove(), 500);
    }, 8000);
  }

  // ── Listen for fields_filled events from per-step adapters (LinkedIn) ────

  window.addEventListener('jobagent:fields_filled', (e) => {
    const { results } = e.detail ?? {};
    if (results?.length > 0) {
      window.JobAgentOverlay?.showResults(results);
    }
  });

})();
