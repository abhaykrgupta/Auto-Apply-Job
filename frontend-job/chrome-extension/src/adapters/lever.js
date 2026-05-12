/**
 * adapters/lever.js — Lever ATS adapter
 * Works on: jobs.lever.co, *.lever.co/*/apply
 *
 * Lever is a React SPA. Fields use data-qa attributes.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.lever = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // Lever field data-qa → profile flat key
    const DATA_QA_MAP = {
      'name-input':              'fullName',
      'email-input':             'email',
      'phone-input':             'phone',
      'org-input':               'currentCompany',
      'urls[LinkedIn]':          'linkedIn',
      'urls[GitHub]':            'github',
      'urls[Portfolio]':         'portfolio',
      'urls[Twitter]':           'portfolio', // fallback
    };

    for (const [qa, profileKey] of Object.entries(DATA_QA_MAP)) {
      const el = document.querySelector(`[data-qa="${qa}"] input, [data-qa="${qa}"] textarea, input[name="${qa}"]`);
      if (!el) continue;
      const value = profile[profileKey];
      if (!value) { results.push({ field: profileKey, status: 'no_data' }); continue; }
      await F.smartFill(el, value);
      results.push({ field: profileKey, value, status: 'filled', el });
      await F.delay(70 + Math.random() * 80);
    }

    // ── Also try standard name attribute fallbacks ────────────────────────
    const fallbacks = [
      { sel: 'input[name="name"]',    key: 'fullName' },
      { sel: 'input[name="email"]',   key: 'email' },
      { sel: 'input[name="phone"]',   key: 'phone' },
      { sel: 'input[name="org"]',     key: 'currentCompany' },
    ];
    for (const { sel, key } of fallbacks) {
      const el = document.querySelector(sel);
      if (!el || el.value) continue; // skip if already filled above
      const value = profile[key];
      if (!value) continue;
      await F.smartFill(el, value);
      results.push({ field: key, value, status: 'filled', el });
      await F.delay(60);
    }

    // ── Resume file (Lever has a dropzone + file input) ───────────────────
    const resumeInput = document.querySelector(
      'input[type="file"][name*="resume"], input[type="file"][data-qa="resume-input"], input[type="file"]'
    );
    if (resumeInput) {
      const pdfResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
      });
      if (pdfResult?.base64) {
        F.injectFile(resumeInput, pdfResult.base64, 'resume.pdf');
        results.push({ field: 'resumeFile', status: 'filled', el: resumeInput });
      } else {
        results.push({ field: 'resumeFile', status: 'needs_manual', el: resumeInput });
      }
    }

    // ── Cover letter ─────────────────────────────────────────────────────
    const coverEl = document.querySelector(
      'textarea[name*="comments"], textarea[name*="cover"], [data-qa="cover-letter"] textarea'
    );
    if (coverEl) {
      results.push({ field: 'coverLetter', status: 'needs_gpt', el: coverEl, label: 'Cover letter / Additional comments' });
    }

    // ── Custom questions (Lever appends them as free fields) ──────────────
    const allFields = window.scanFields?.(document) ?? [];
    for (const { el, type } of allFields) {
      if (results.some(r => r.el === el)) continue;
      if (el.tagName === 'TEXTAREA' && type !== 'coverLetter') {
        const label = window.getFieldLabel?.(el) ?? '';
        results.push({ field: 'custom', status: 'needs_gpt', el, label: label || 'Custom question' });
      } else if (type !== 'unknown' && profile[type]) {
        await F.smartFill(el, profile[type]);
        results.push({ field: type, value: profile[type], status: 'filled', el });
      }
    }

    return results;
  };

})();
