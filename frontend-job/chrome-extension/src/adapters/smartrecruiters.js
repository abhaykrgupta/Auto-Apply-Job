/**
 * adapters/smartrecruiters.js — SmartRecruiters adapter
 * Works on: careers.smartrecruiters.com, jobs.smartrecruiters.com
 *
 * SmartRecruiters has a public REST API — we can POST the application directly.
 * Fallback: DOM-based fill if API fails or job uses custom form.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.smartrecruiters = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // Try to get the job ID from the URL (e.g., /jobs/a0n3z00000GEJy2AAH)
    const jobIdMatch = window.location.pathname.match(/\/jobs\/([A-Za-z0-9]+)/);
    const jobId = jobIdMatch?.[1];

    // SmartRecruiters field map — their form uses class and name conventions
    const fieldMap = [
      { sel: 'input[name="firstName"], #firstName',  key: 'firstName' },
      { sel: 'input[name="lastName"], #lastName',    key: 'lastName' },
      { sel: 'input[name="email"], #email',          key: 'email' },
      { sel: 'input[name="phone"], #phone',          key: 'phone' },
      { sel: 'input[name="location"], #city',        key: 'city' },
    ];

    for (const { sel, key } of fieldMap) {
      const el = document.querySelector(sel);
      if (!el || !profile[key]) { results.push({ field: key, status: el ? 'no_data' : 'not_found' }); continue; }
      await F.smartFill(el, profile[key]);
      results.push({ field: key, value: profile[key], status: 'filled', el });
      await F.delay(70);
    }

    // ── LinkedIn ─────────────────────────────────────────────────────────
    const linkedInEl = document.querySelector('input[name*="linkedin"], input[id*="linkedin"]');
    if (linkedInEl && profile.linkedIn) {
      await F.smartFill(linkedInEl, profile.linkedIn);
      results.push({ field: 'linkedIn', value: profile.linkedIn, status: 'filled', el: linkedInEl });
    }

    // ── Resume file ───────────────────────────────────────────────────────
    const resumeInput = document.querySelector('input[type="file"]');
    if (resumeInput) {
      const pdfResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
      });
      if (pdfResult?.base64) {
        F.injectFile(resumeInput, pdfResult.base64, 'resume.pdf');
        results.push({ field: 'resumeFile', status: 'filled', el: resumeInput });
      }
    }

    // ── Screening questions ───────────────────────────────────────────────
    const allFields = window.scanFields?.(document) ?? [];
    for (const { el, type } of allFields) {
      if (results.some(r => r.el === el)) continue;
      if (type === 'unknown') {
        const label = window.getFieldLabel?.(el) ?? '';
        results.push({ field: 'custom', status: 'needs_gpt', el, label });
      } else if (profile[type]) {
        await F.smartFill(el, profile[type]);
        results.push({ field: type, value: profile[type], status: 'filled', el });
      }
    }

    return results;
  };

})();
