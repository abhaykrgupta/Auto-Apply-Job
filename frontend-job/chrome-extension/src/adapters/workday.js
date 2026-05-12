/**
 * adapters/workday.js — Workday ATS adapter
 * Works on: *.myworkdayjobs.com, wd3.myworkday.com, wd5.myworkday.com
 *
 * Workday is the most complex ATS: multi-page wizard, custom component system,
 * [data-automation-id] selectors throughout.
 *
 * Pages: My Information → My Experience → Application Questions → Self-Identify → Review
 * This adapter handles "My Information" (page 1) fully, and uses the universal
 * classifier for subsequent pages. Full XState machine is Phase 4.
 */
'use strict';

(function () {
  window.__JobAgentAdapters = window.__JobAgentAdapters || {};

  const AUTO = (id) => `[data-automation-id="${id}"]`;

  window.__JobAgentAdapters.workday = async function fillForm(profile, jdText) {
    const F = window.JobAgentFiller;
    const results = [];

    // Detect current Workday page
    const pageHeader = document.querySelector(AUTO('formSection') + ' h2, h1[data-automation-id]');
    const pageTitle  = pageHeader?.textContent?.toLowerCase() ?? '';

    if (/my information|personal information|contact/.test(pageTitle) || !pageTitle) {
      await fillMyInformation(profile, results, F);
    } else if (/my experience|work experience|resume/.test(pageTitle)) {
      await fillMyExperience(profile, jdText, results, F);
    } else if (/application questions|additional|screening/.test(pageTitle)) {
      await fillApplicationQuestions(profile, results, F);
    } else if (/self.?identify|diversity|equal opportunity/.test(pageTitle)) {
      await fillSelfIdentify(profile, results, F);
    } else {
      // Unknown page — use universal classifier
      await fillGenericPage(profile, results, F);
    }

    return results;
  };

  // ── Page 1: My Information ─────────────────────────────────────────────────

  async function fillMyInformation(profile, results, F) {

    // ── Legal name ─────────────────────────────────────────────────────────
    const firstNameEl = document.querySelector(
      AUTO('legalNameSection_firstName') + ' input, ' +
      AUTO('firstName') + ' input, ' +
      'input[data-automation-id="firstName"]'
    );
    if (firstNameEl && profile.firstName) {
      await F.smartFill(firstNameEl, profile.firstName);
      results.push({ field: 'firstName', value: profile.firstName, status: 'filled', el: firstNameEl });
    }

    const lastNameEl = document.querySelector(
      AUTO('legalNameSection_lastName') + ' input, ' +
      AUTO('lastName') + ' input, ' +
      'input[data-automation-id="lastName"]'
    );
    if (lastNameEl && profile.lastName) {
      await F.smartFill(lastNameEl, profile.lastName);
      results.push({ field: 'lastName', value: profile.lastName, status: 'filled', el: lastNameEl });
    }

    await F.delay(100);

    // ── Address / Location ─────────────────────────────────────────────────
    const addressLine1 = document.querySelector(AUTO('addressSection_addressLine1') + ' input');
    // Skip address line for now — requires street address

    const cityEl = document.querySelector(
      AUTO('addressSection_city') + ' input, ' +
      AUTO('city') + ' input'
    );
    if (cityEl && profile.city) {
      await F.smartFill(cityEl, profile.city);
      results.push({ field: 'city', value: profile.city, status: 'filled', el: cityEl });
      await F.delay(80);
    }

    // ── Phone ──────────────────────────────────────────────────────────────
    const phoneEl = document.querySelector(
      AUTO('phone-number') + ' input, ' +
      AUTO('phoneNumber') + ' input, ' +
      'input[data-automation-id*="phone"]'
    );
    if (phoneEl && profile.phone) {
      await F.smartFill(phoneEl, profile.phone);
      results.push({ field: 'phone', value: profile.phone, status: 'filled', el: phoneEl });
      await F.delay(80);
    }

    // ── Email ──────────────────────────────────────────────────────────────
    const emailEl = document.querySelector('input[data-automation-id*="email"], input[type="email"]');
    if (emailEl && profile.email && !emailEl.value) {
      await F.smartFill(emailEl, profile.email);
      results.push({ field: 'email', value: profile.email, status: 'filled', el: emailEl });
      await F.delay(80);
    }

    // ── Source (how did you hear about us?) — skip or "LinkedIn" ──────────
    const sourceSelect = document.querySelector(AUTO('source') + ' select, ' + AUTO('referredBy') + ' select');
    if (sourceSelect) {
      // Pick a neutral option
      const options = Array.from(sourceSelect.options);
      const linkedInOpt = options.find(o => /linkedin/i.test(o.text));
      const jobBoardOpt = options.find(o => /job board|internet|online/i.test(o.text));
      const target = linkedInOpt ?? jobBoardOpt;
      if (target) {
        await F.fillSelect(sourceSelect, target.value);
        results.push({ field: 'source', value: target.text, status: 'filled', el: sourceSelect });
      }
    }
  }

  // ── Page 2: My Experience ──────────────────────────────────────────────────

  async function fillMyExperience(profile, jdText, results, F) {
    // ── Resume upload ──────────────────────────────────────────────────────
    const resumeSection = document.querySelector(AUTO('resumeSection'), AUTO('file-upload-input'));
    const resumeInput   = document.querySelector('input[type="file"]');

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

    // ── LinkedIn URL ───────────────────────────────────────────────────────
    const linkedInEl = document.querySelector(
      'input[data-automation-id*="linkedIn"], input[placeholder*="linkedin" i]'
    );
    if (linkedInEl && profile.linkedIn) {
      await F.smartFill(linkedInEl, profile.linkedIn);
      results.push({ field: 'linkedIn', value: profile.linkedIn, status: 'filled', el: linkedInEl });
    }
  }

  // ── Page 3: Application Questions ─────────────────────────────────────────

  async function fillApplicationQuestions(profile, results, F) {
    // Use the universal classifier for all questions
    await fillGenericPage(profile, results, F);
  }

  // ── Page 4: Self Identify (EEOC) ──────────────────────────────────────────

  async function fillSelfIdentify(profile, results, F) {
    // Flag all EEOC fields for human review — never auto-fill
    const selects = document.querySelectorAll('select');
    for (const sel of selects) {
      const label = window.getFieldLabel?.(sel) ?? '';
      results.push({
        field: 'eeoc',
        status: 'eeoc_review',
        el: sel,
        label: label || 'EEOC / Self-identify question',
        value: profile['eeocGender'] ?? 'decline',
      });
    }
  }

  // ── Generic page fallback ─────────────────────────────────────────────────

  async function fillGenericPage(profile, results, F) {
    const allFields = window.scanFields?.(document) ?? [];
    for (const { el, type } of allFields) {
      if (results.some(r => r.el === el)) continue;
      if (type === 'unknown') {
        const label = window.getFieldLabel?.(el) ?? '';
        results.push({ field: 'custom', status: 'needs_gpt', el, label: label || 'Question' });
      } else if (/^eeoc/.test(type)) {
        results.push({ field: 'eeoc', status: 'eeoc_review', el, label: window.getFieldLabel?.(el), value: profile[type] });
      } else if (profile[type]) {
        const status = await F.smartFill(el, profile[type]);
        results.push({ field: type, value: profile[type], status, el });
        await F.delay(70);
      }
    }
  }

})();
