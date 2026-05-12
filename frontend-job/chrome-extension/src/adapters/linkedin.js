/**
 * adapters/linkedin.js — LinkedIn Easy Apply adapter
 * Works on: linkedin.com/jobs/view/* (when Easy Apply modal opens)
 *
 * LinkedIn Easy Apply is a multi-step modal wizard.
 * Each step has different fields — we handle them as they appear.
 * Steps typically: Contact Info → Resume → Questions → Review
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  window.__JobAgentAdapters.linkedin = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // LinkedIn Easy Apply modal selector
    const modal = document.querySelector(
      '.jobs-easy-apply-modal, [data-test-modal="easy-apply-modal"], .artdeco-modal'
    );
    if (!modal) {
      return [{ field: 'modal', status: 'not_found', note: 'Easy Apply modal not open. Click "Easy Apply" first.' }];
    }

    // Fill current visible step
    await fillCurrentStep(modal, profile, jdText, results, F);

    // Set up observer to fill subsequent steps when Next is clicked
    observeModalSteps(modal, profile, jdText, F);

    return results;
  };

  async function fillCurrentStep(modal, profile, jdText, results, F) {
    // ── Phone number (appears on first step) ────────────────────────────
    const phoneEl = modal.querySelector(
      'input[id*="phoneNumber"], input[name*="phone"], [data-test-form-element-id*="phone"] input'
    );
    if (phoneEl && !phoneEl.value && profile.phone) {
      await F.smartFill(phoneEl, profile.phone);
      results.push({ field: 'phone', value: profile.phone, status: 'filled', el: phoneEl });
    }

    // ── City (sometimes asked on first step) ─────────────────────────────
    const cityEl = modal.querySelector(
      'input[id*="city"], input[name*="city"], [data-test-form-element-id*="city"] input'
    );
    if (cityEl && !cityEl.value && profile.city) {
      await F.smartFill(cityEl, profile.city);
      results.push({ field: 'city', value: profile.city, status: 'filled', el: cityEl });
    }

    // ── Years of experience (numeric inputs / selects) ───────────────────
    const yoeSelects = modal.querySelectorAll('select');
    for (const sel of yoeSelects) {
      const label = window.getFieldLabel?.(sel) ?? '';
      if (/year|experience|exp/i.test(label) && profile.yearsExp) {
        await F.fillSelect(sel, profile.yearsExp);
        results.push({ field: 'yearsExp', value: profile.yearsExp, status: 'filled', el: sel });
        await F.delay(80);
      }
    }

    // ── Radio / checkbox groups (auth to work, etc.) ──────────────────────
    const fieldsets = modal.querySelectorAll('fieldset, [data-test-form-group]');
    for (const fieldset of fieldsets) {
      const legend = fieldset.querySelector('legend, [data-test-single-typeahead-entity-form-component]');
      const labelText = (legend?.textContent ?? '').toLowerCase();

      if (/authorized|eligible|legally allowed|right to work/.test(labelText)) {
        // Select "Yes" for work authorization
        const yesOpt = fieldset.querySelector('input[value="Yes"], input[value="yes"], label:first-of-type input');
        if (yesOpt) {
          yesOpt.checked = true;
          F.fireEvents(yesOpt, ['change', 'click']);
          results.push({ field: 'workAuth', status: 'filled', el: yesOpt });
        }
      } else if (/sponsor|visa sponsorship/.test(labelText)) {
        // Select "No" for sponsorship
        const noOpt = fieldset.querySelector('input[value="No"], input[value="no"]');
        if (noOpt) {
          noOpt.checked = true;
          F.fireEvents(noOpt, ['change', 'click']);
          results.push({ field: 'requireSponsorship', status: 'filled', el: noOpt });
        }
      }
    }

    // ── Custom questions (LinkedIn often has free-text screening questions) ─
    const textareas = modal.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (results.some(r => r.el === ta)) continue;
      const label = window.getFieldLabel?.(ta) ?? '';
      results.push({ field: 'custom', status: 'needs_gpt', el: ta, label: label || 'Screening question' });
    }

    // ── Dropdown screening questions ──────────────────────────────────────
    const selects = modal.querySelectorAll('select');
    for (const sel of selects) {
      if (results.some(r => r.el === sel)) continue;
      const label = window.getFieldLabel?.(sel) ?? '';
      const type = window.classifyField?.(sel);
      if (type && type !== 'unknown' && profile[type]) {
        await F.fillSelect(sel, profile[type]);
        results.push({ field: type, value: profile[type], status: 'filled', el: sel });
      } else {
        results.push({ field: 'custom', status: 'needs_gpt', el: sel, label: label || 'Dropdown question' });
      }
    }
  }

  // Observe modal for step transitions (LinkedIn reuses the modal DOM)
  function observeModalSteps(modal, profile, jdText, F) {
    const observer = new MutationObserver(async () => {
      // Small debounce to let React finish rendering
      clearTimeout(window.__linkedInFillTimer);
      window.__linkedInFillTimer = setTimeout(async () => {
        const tempResults = [];
        await fillCurrentStep(modal, profile, jdText, tempResults, F);

        // Notify the overlay of newly filled fields
        if (tempResults.length > 0) {
          window.dispatchEvent(new CustomEvent('jobagent:fields_filled', {
            detail: { results: tempResults, atsId: 'linkedin' },
          }));
        }
      }, 400);
    });

    observer.observe(modal, { childList: true, subtree: true, attributes: false });

    // Stop observing when modal closes
    const closeObserver = new MutationObserver(() => {
      if (!document.contains(modal)) {
        observer.disconnect();
        closeObserver.disconnect();
      }
    });
    closeObserver.observe(document.body, { childList: true });
  }

})();
