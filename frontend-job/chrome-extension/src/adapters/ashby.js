/**
 * adapters/ashby.js — Ashby ATS adapter
 * Works on: jobs.ashbyhq.com, app.ashbyhq.com
 *
 * Ashby is the cleanest ATS to automate — all fields have data-testid.
 * Single-page React app, standard form structure.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.ashby = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // Ashby data-testid → profile key map
    const TESTID_MAP = {
      'first-name-input':  'firstName',
      'last-name-input':   'lastName',
      'email-input':       'email',
      'phone-input':       'phone',
    };

    for (const [testId, profileKey] of Object.entries(TESTID_MAP)) {
      const el = document.querySelector(`[data-testid="${testId}"]`);
      if (!el) continue;
      const value = profile[profileKey];
      if (!value) { results.push({ field: profileKey, status: 'no_data' }); continue; }
      await F.smartFill(el, value);
      results.push({ field: profileKey, value, status: 'filled', el });
      await F.delay(80);
    }

    // ── Social links (Ashby groups them in a social section) ─────────────
    const socialFields = {
      'LinkedIn Profile':  'linkedIn',
      'GitHub Profile':    'github',
      'Portfolio':         'portfolio',
      'Website':           'portfolio',
    };
    const allInputs = document.querySelectorAll('input[type="text"], input[type="url"]');
    for (const el of allInputs) {
      const label = window.getFieldLabel?.(el) ?? '';
      const matchKey = Object.entries(socialFields).find(([k]) => label.toLowerCase().includes(k.toLowerCase()))?.[1];
      if (!matchKey || results.some(r => r.el === el)) continue;
      const value = profile[matchKey];
      if (!value) continue;
      await F.smartFill(el, value);
      results.push({ field: matchKey, value, status: 'filled', el });
      await F.delay(70);
    }

    // ── Resume file ───────────────────────────────────────────────────────
    const resumeInput = document.querySelector(
      'input[type="file"][data-testid*="resume"], input[type="file"][accept*="pdf"]'
    );
    if (!resumeInput) {
      // Ashby may use a drag-and-drop zone with a hidden input
      const hiddenInput = document.querySelector('input[type="file"]');
      if (hiddenInput) {
        const pdfResult = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
        });
        if (pdfResult?.base64) {
          F.injectFile(hiddenInput, pdfResult.base64, 'resume.pdf');
          results.push({ field: 'resumeFile', status: 'filled', el: hiddenInput });
        }
      }
    } else {
      const pdfResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
      });
      if (pdfResult?.base64) {
        F.injectFile(resumeInput, pdfResult.base64, 'resume.pdf');
        results.push({ field: 'resumeFile', status: 'filled', el: resumeInput });
      }
    }

    // ── Scan remaining fields via universal classifier ────────────────────
    const allFields = window.scanFields?.(document) ?? [];
    for (const { el, type } of allFields) {
      if (results.some(r => r.el === el)) continue;
      if (type === 'unknown') {
        const label = window.getFieldLabel?.(el) ?? '';
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          results.push({ field: 'custom', status: 'needs_gpt', el, label: label || 'Custom question' });
        }
      } else if (profile[type]) {
        await F.smartFill(el, profile[type]);
        results.push({ field: type, value: profile[type], status: 'filled', el });
        await F.delay(60);
      }
    }

    return results;
  };

})();
