/**
 * adapters/greenhouse.js — Greenhouse ATS adapter
 * Works on: boards.greenhouse.io, job-boards.greenhouse.io
 *
 * Greenhouse is a single-page React app with clean semantic field names.
 * Fields use name="first_name", name="last_name", name="email" etc.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.greenhouse = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // Greenhouse field name → profile flat key mapping
    const FIELD_MAP = {
      'first_name':     'firstName',
      'last_name':      'lastName',
      'email':          'email',
      'phone':          'phone',
      'location':       'city',
      // Custom application fields — fallback to classifier
    };

    // ── Direct-mapped fields ───────────────────────────────────────────────
    for (const [name, profileKey] of Object.entries(FIELD_MAP)) {
      const el = document.querySelector(
        `input[name="${name}"], input[id="${name}"], textarea[name="${name}"]`
      );
      if (!el) continue;
      const value = profile[profileKey];
      if (!value) { results.push({ field: profileKey, status: 'no_data', el }); continue; }
      const status = await F.smartFill(el, value);
      results.push({ field: profileKey, value, status, el });
      await F.delay(80 + Math.random() * 60);
    }

    // ── LinkedIn URL ──────────────────────────────────────────────────────
    const linkedInEl = document.querySelector(
      'input[name*="linkedin"], input[id*="linkedin"], input[placeholder*="linkedin" i]'
    );
    if (linkedInEl && profile.linkedIn) {
      await F.smartFill(linkedInEl, profile.linkedIn);
      results.push({ field: 'linkedIn', value: profile.linkedIn, status: 'filled', el: linkedInEl });
    }

    // ── GitHub URL ────────────────────────────────────────────────────────
    const githubEl = document.querySelector(
      'input[name*="github"], input[id*="github"], input[placeholder*="github" i]'
    );
    if (githubEl && profile.github) {
      await F.smartFill(githubEl, profile.github);
      results.push({ field: 'github', value: profile.github, status: 'filled', el: githubEl });
    }

    // ── Portfolio / Website ───────────────────────────────────────────────
    const portfolioEl = document.querySelector(
      'input[name*="website"], input[name*="portfolio"], input[id*="website"], input[id*="portfolio"]'
    );
    if (portfolioEl && profile.portfolio) {
      await F.smartFill(portfolioEl, profile.portfolio);
      results.push({ field: 'portfolio', value: profile.portfolio, status: 'filled', el: portfolioEl });
    }

    // ── Resume file ────────────────────────────────────────────────────────
    const resumeInput = document.querySelector('input[type="file"][name*="resume"], input[type="file"][id*="resume"]');
    if (resumeInput) {
      // Request tailored PDF from background
      const pdfResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
      });
      if (pdfResult?.base64) {
        F.injectFile(resumeInput, pdfResult.base64, 'resume.pdf');
        results.push({ field: 'resumeFile', status: 'filled', el: resumeInput });
      } else if (pdfResult?.url) {
        results.push({ field: 'resumeFile', status: 'needs_manual', note: 'Upload from: ' + pdfResult.url, el: resumeInput });
      }
    }

    // ── Cover letter textarea ──────────────────────────────────────────────
    const coverLetterEl = document.querySelector('textarea[name*="cover"], textarea[id*="cover"]');
    if (coverLetterEl) {
      results.push({ field: 'coverLetter', status: 'needs_gpt', el: coverLetterEl, label: 'Cover letter' });
    }

    // ── Custom questions — scan remaining unlabeled fields ─────────────────
    const allFields = window.scanFields?.(document) ?? [];
    for (const { el, type } of allFields) {
      // Skip already filled
      if (results.some(r => r.el === el)) continue;

      if (type === 'unknown' || type === 'coverLetter') {
        const label = window.getFieldLabel?.(el) ?? '';
        results.push({ field: 'custom', status: 'needs_gpt', el, label: label || 'Custom question' });
      } else if (profile[type]) {
        await F.smartFill(el, profile[type]);
        results.push({ field: type, value: profile[type], status: 'filled', el });
      }
    }

    // ── EEOC section (Diversity questions) ────────────────────────────────
    await fillEEOC(profile, results);

    return results;
  };

  async function fillEEOC(profile, results) {
    const F = window.JobAgentFiller;

    // Greenhouse EEOC selects have predictable IDs
    const eeocMap = {
      '#job_app_gender':      profile.eeocGender,
      '#job_app_race':        profile.eeocRace,
      '#job_app_veteran':     profile.eeocVeteran,
      '#job_app_disability':  profile.eeocDisability,
    };

    for (const [selector, value] of Object.entries(eeocMap)) {
      const el = document.querySelector(selector);
      if (!el || !value) continue;
      // Always flag EEOC for human review
      results.push({ field: 'eeoc', status: 'eeoc_review', el, label: window.getFieldLabel?.(el) ?? 'EEOC field', value });
    }
  }

})();
