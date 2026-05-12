/**
 * adapters/generic.js — Universal fallback adapter
 * Works on: any ATS not covered by a specific adapter.
 * Covers: BambooHR, JazzHR, Recruitee, Breezy, Teamtailor, Rippling,
 *         Pinpoint, iCIMS, Taleo, SuccessFactors, Wellfound, Dice, Builtin,
 *         ZipRecruiter, Handshake, and any custom ATS.
 *
 * Strategy: scan all visible fields → classify → fill from profile.
 * Unknown fields → flag for human or GPT.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.generic = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    const allFields = window.scanFields?.(document) ?? [];

    for (const { el, type } of allFields) {

      // ── File input ─────────────────────────────────────────────────────
      if (type === 'resumeFile') {
        const pdfResult = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'REQUEST_TAILORED_PDF', jdText }, resolve);
        });
        if (pdfResult?.base64) {
          F.injectFile(el, pdfResult.base64, 'resume.pdf');
          results.push({ field: 'resumeFile', status: 'filled', el });
        } else {
          results.push({ field: 'resumeFile', status: 'needs_manual', el });
        }
        continue;
      }

      // ── EEOC — always flag for human ───────────────────────────────────
      if (/^eeoc/.test(type)) {
        results.push({
          field: 'eeoc',
          status: 'eeoc_review',
          el,
          label: window.getFieldLabel?.(el) ?? 'EEOC question',
          value: profile[type] ?? 'decline',
        });
        continue;
      }

      // ── Cover letter — flag for GPT ────────────────────────────────────
      if (type === 'coverLetter') {
        results.push({
          field: 'coverLetter',
          status: 'needs_gpt',
          el,
          label: 'Cover letter',
        });
        continue;
      }

      // ── Unknown — flag for GPT if textarea, skip if input ─────────────
      if (type === 'unknown') {
        const label = window.getFieldLabel?.(el) ?? '';
        if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text' && label)) {
          results.push({ field: 'custom', status: 'needs_gpt', el, label: label || 'Question' });
        }
        continue;
      }

      // ── Known type: fill from profile ──────────────────────────────────
      const value = profile[type];
      if (!value) {
        results.push({ field: type, status: 'no_data', el });
        continue;
      }

      // For radio/checkbox containers, handle differently
      if (el.closest('fieldset') && ['workAuth', 'requireSponsorship', 'relocate'].includes(type)) {
        const fieldset = el.closest('fieldset');
        const ok = await F.fillRadioOrCheckbox(
          fieldset,
          type === 'workAuth' ? (profile.workAuthStatus ?? 'yes') : value,
        );
        results.push({ field: type, value, status: ok ? 'filled' : 'select_no_match', el });
        continue;
      }

      const status = await F.smartFill(el, value);
      results.push({ field: type, value, status, el });
      await F.delay(60 + Math.random() * 60);
    }

    return results;
  };

})();
