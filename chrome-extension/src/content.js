// Content script — runs on job pages and extracts job data
(function () {
  'use strict';

  function extractJob() {
    const url = window.location.href;
    let job = { title: '', company: '', description: '', location: '', applyUrl: url };

    // ── LinkedIn ────────────────────────────────────────────────
    if (url.includes('linkedin.com/jobs')) {
      job.title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.textContent?.trim() ?? '';
      job.company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.textContent?.trim() ?? '';
      job.location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim() ?? '';
      job.description = document.querySelector('.jobs-description__content, .job-view-layout')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    // ── Indeed ─────────────────────────────────────────────────
    else if (url.includes('indeed.com')) {
      job.title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span, h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() ?? '';
      job.company = document.querySelector('[data-testid="inlineHeader-companyName"] a, .jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim() ?? '';
      job.location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle div')?.textContent?.trim() ?? '';
      job.description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    // ── Greenhouse ──────────────────────────────────────────────
    else if (url.includes('boards.greenhouse.io') || url.includes('greenhouse.io/embed')) {
      job.title = document.querySelector('h1.app-title, .opening h1, #header h1')?.textContent?.trim() ?? '';
      job.company = document.querySelector('#header .company-name, .company-name')?.textContent?.trim() ?? url.split('/')[4] ?? '';
      job.location = document.querySelector('.location, .job-location')?.textContent?.trim() ?? '';
      job.description = document.querySelector('#content, .job-description')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    // ── Lever ───────────────────────────────────────────────────
    else if (url.includes('jobs.lever.co')) {
      job.title = document.querySelector('h2, .posting-header h2')?.textContent?.trim() ?? '';
      job.company = document.querySelector('.main-header-logo img')?.getAttribute('alt') ?? url.split('/')[3] ?? '';
      job.location = document.querySelector('.posting-category.location, .sort-by-location')?.textContent?.trim() ?? '';
      job.description = document.querySelector('.posting-requirements, .section-wrapper')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    // ── Glassdoor ───────────────────────────────────────────────
    else if (url.includes('glassdoor.com')) {
      job.title = document.querySelector('[data-test="job-title"], .e1tk4kwz4')?.textContent?.trim() ?? '';
      job.company = document.querySelector('[data-test="employer-name"], .e1tk4kwz2')?.textContent?.trim() ?? '';
      job.location = document.querySelector('[data-test="location"]')?.textContent?.trim() ?? '';
      job.description = document.querySelector('.jobDescriptionContent, [class*="JobDescription"]')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    // ── Wellfound / AngelList ────────────────────────────────────
    else if (url.includes('wellfound.com') || url.includes('angel.co')) {
      job.title = document.querySelector('h1, .job-title')?.textContent?.trim() ?? '';
      job.company = document.querySelector('.startup-link, [class*="company"]')?.textContent?.trim() ?? '';
      job.description = document.querySelector('[class*="description"], [class*="job-description"]')?.textContent?.trim()?.substring(0, 3000) ?? '';
    }

    if (!job.title) return null;
    return job;
  }

  // Expose data for popup
  const job = extractJob();
  if (job) {
    window.__jobAgentData = job;
  }

  // Inject floating badge if job detected
  if (job?.title) {
    injectBadge(job);
  }

  function injectBadge(job) {
    // Don't inject twice
    if (document.getElementById('job-agent-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'job-agent-badge';
    badge.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 12px;
        padding: 10px 16px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(102,126,234,0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s;
        max-width: 220px;
      " onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'" id="job-agent-inner">
        🤖 <span>Job Agent — Check Match</span>
      </div>
    `;

    badge.addEventListener('click', () => {
      chrome.storage.sync.get('dashboardUrl', ({ dashboardUrl }) => {
        window.open(`${dashboardUrl ?? 'http://localhost:3000'}/jobs`, '_blank');
      });
    });

    document.body.appendChild(badge);

    // Auto-hide after 8s
    setTimeout(() => {
      if (badge.parentNode) badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 500);
    }, 8000);
  }
})();

// ── LinkedIn Easy Apply Bot ──────────────────────────────────
function initLinkedInEasyApply() {
  if (!window.location.href.includes('linkedin.com/jobs')) return;

  // Watch for Easy Apply modal to open
  const observer = new MutationObserver(() => {
    const modal = document.querySelector('.jobs-easy-apply-modal, [data-test-modal="easy-apply-modal"]');
    if (modal && !modal.dataset.jobAgentProcessed) {
      modal.dataset.jobAgentProcessed = 'true';
      handleEasyApplyModal(modal);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleEasyApplyModal(modal) {
  // Get stored profile from chrome storage
  chrome.storage.local.get(['profile', 'apiUrl'], (data) => {
    if (!data.profile) return;
    const profile = data.profile;

    // Fill phone number if field exists
    const phoneField = modal.querySelector('input[id*="phoneNumber"], input[name*="phone"]');
    if (phoneField && profile.phone && !phoneField.value) {
      phoneField.value = profile.phone;
      phoneField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Fill city/location if field exists
    const cityField = modal.querySelector('input[id*="city"], input[name*="location"]');
    if (cityField && profile.location && !cityField.value) {
      cityField.value = profile.location;
      cityField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Handle radio buttons for common questions (yes/no)
    const radioGroups = modal.querySelectorAll('fieldset');
    radioGroups.forEach((group) => {
      const label = group.querySelector('legend, label')?.textContent?.toLowerCase() ?? '';
      // Auto-select "Yes" for authorization/eligible to work questions
      if (label.includes('authorized') || label.includes('eligible') || label.includes('legally')) {
        const yesRadio = group.querySelector('input[value="Yes"], input[value="true"]');
        if (yesRadio) { yesRadio.checked = true; yesRadio.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      // Auto-select "No" for sponsorship questions
      if (label.includes('sponsorship') || label.includes('visa')) {
        const noRadio = group.querySelector('input[value="No"], input[value="false"]');
        if (noRadio) { noRadio.checked = true; noRadio.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    });

    // Inject floating hint badge
    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:8px;right:48px;background:#4f46e5;color:white;font-size:11px;padding:3px 8px;border-radius:20px;z-index:9999;font-family:sans-serif;';
    badge.textContent = '🤖 Job Agent filled';
    modal.style.position = 'relative';
    modal.appendChild(badge);
    setTimeout(() => badge.remove(), 3000);
  });
}

// Init on page load
initLinkedInEasyApply();
