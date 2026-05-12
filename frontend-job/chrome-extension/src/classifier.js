/**
 * classifier.js — Universal field semantic classifier
 * Reads every possible signal from a form element and returns its type.
 * Loaded before adapters so all scripts can call window.classifyField().
 */
'use strict';

(function () {

  /**
   * Returns the visible label text for a given input element.
   * Checks: <label for="id">, aria-labelledby, aria-label, nearest preceding <label>.
   */
  function getLabel(el) {
    // 1. <label for="...">
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    // 2. aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const parts = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    // 3. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    // 4. placeholder
    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return placeholder.trim();
    // 5. Walk up DOM and look for a <label> or legend sibling
    let node = el.parentElement;
    for (let i = 0; i < 5 && node; i++) {
      const lbl = node.querySelector('label, legend');
      if (lbl && lbl.textContent.trim()) return lbl.textContent.trim();
      node = node.parentElement;
    }
    return '';
  }

  /**
   * Collects all signal strings from an element into a single lowercase string.
   */
  function signals(el) {
    return [
      el.getAttribute('name'),
      el.getAttribute('id'),
      el.getAttribute('autocomplete'),
      el.getAttribute('aria-label'),
      el.getAttribute('placeholder'),
      el.getAttribute('data-testid'),
      el.getAttribute('data-qa'),
      el.getAttribute('data-automation-id'),
      el.getAttribute('data-field-id'),
      getLabel(el),
    ].filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * classifyField(el) → field type string.
   *
   * Returned types and their meanings:
   *   firstName, lastName, email, phone,
   *   city, state, country, zipCode,
   *   linkedIn, github, portfolio,
   *   resumeFile,     ← <input type="file"> for resume/CV
   *   coverLetter,    ← <textarea> or <input> for cover letter
   *   salary,         ← desired salary (number input or select)
   *   workAuth,       ← work authorization status (select/radio)
   *   requireSponsorship, ← boolean yes/no
   *   relocate,       ← will you relocate (boolean)
   *   remoteOnly,     ← prefer remote (boolean)
   *   yearsExp,       ← years of experience (number/select)
   *   degree,         ← highest education degree (select)
   *   startDate,      ← available start date
   *   gender,         ← EEOC gender
   *   veteran,        ← EEOC veteran status
   *   disability,     ← EEOC disability
   *   race,           ← EEOC race/ethnicity
   *   unknown         ← needs human input or GPT
   */
  function classifyField(el) {
    const s = signals(el);
    const type = (el.type ?? '').toLowerCase();

    // ── File inputs ───────────────────────────────────────────────────────────
    if (type === 'file') {
      if (/resume|cv|curriculum/.test(s)) return 'resumeFile';
      if (/cover.?letter/.test(s))        return 'coverLetterFile';
      return 'fileUnknown';
    }

    // ── Hidden / submit / button → skip ──────────────────────────────────────
    if (['hidden', 'submit', 'button', 'image', 'reset', 'checkbox', 'radio'].includes(type)) {
      return 'skip';
    }

    // ── Personal ─────────────────────────────────────────────────────────────
    if (/\bfirst.?name\b|given.?name|fname/.test(s))           return 'firstName';
    if (/\blast.?name\b|family.?name|surname|lname/.test(s))   return 'lastName';
    if (/\bfull.?name\b|your.?name/.test(s))                   return 'fullName';
    if (/\bemail\b/.test(s))                                   return 'email';
    if (/\bphone\b|\bmobile\b|\btel\b|\bcell\b/.test(s))       return 'phone';

    // ── Location ─────────────────────────────────────────────────────────────
    if (/\bzip\b|postal.?code/.test(s))                        return 'zipCode';
    if (/\bcountry\b/.test(s))                                 return 'country';
    if (/\bstate\b|\bprovince\b|\bregion\b/.test(s))           return 'state';
    if (/\bcity\b|\blocation\b|\baddress\b/.test(s) &&
        !/street|line|suite|apt/.test(s))                      return 'city';

    // ── Social / Links ───────────────────────────────────────────────────────
    if (/\blinkedin\b/.test(s))                                return 'linkedIn';
    if (/\bgithub\b/.test(s))                                  return 'github';
    if (/\bportfolio\b|\bwebsite\b|\bpersonal.?site\b|\burl\b/.test(s) &&
        !/linkedin|github/.test(s))                            return 'portfolio';

    // ── Resume / Cover letter ────────────────────────────────────────────────
    if (/resume|curriculum.?vitae|\bcv\b/.test(s) && el.tagName !== 'TEXTAREA') return 'resumeText';
    if (/cover.?letter|covering.?letter/.test(s))              return 'coverLetter';

    // ── Compensation ─────────────────────────────────────────────────────────
    if (/salary|compensation|pay.?rate|expected.?pay/.test(s)) return 'salary';

    // ── Work authorization ────────────────────────────────────────────────────
    if (/work.?auth|authorized.?to.?work|legally.?eligible|visa.?status|right.?to.?work/.test(s)) return 'workAuth';
    if (/sponsor|require.?sponsor|need.?sponsor|visa.?sponsor/.test(s)) return 'requireSponsorship';

    // ── Work preferences ──────────────────────────────────────────────────────
    if (/relocat/.test(s))                                     return 'relocate';
    if (/remote|work.?from.?home|wfh/.test(s))                 return 'remoteOnly';
    if (/start.?date|earliest.?start|available.?date|when.?can.?you.?start/.test(s)) return 'startDate';

    // ── Experience / Education ────────────────────────────────────────────────
    if (/years?.?of.?exp|experience.?level|how.?many.?years/.test(s)) return 'yearsExp';
    if (/\bdegree\b|highest.?education|education.?level/.test(s)) return 'degree';
    if (/\bschool\b|\buniversity\b|\bcollege\b|\binstitution\b/.test(s)) return 'school';
    if (/graduation|grad.?year/.test(s))                       return 'graduationYear';

    // ── EEOC ─────────────────────────────────────────────────────────────────
    if (/\bgender\b|\bsex\b/.test(s))                          return 'eeocGender';
    if (/\bveteran\b|\bmilitary.?status\b/.test(s))            return 'eeocVeteran';
    if (/\bdisabilit/.test(s))                                 return 'eeocDisability';
    if (/\brace\b|\bethnicit/.test(s))                         return 'eeocRace';

    // ── Current company / title ───────────────────────────────────────────────
    if (/current.?company|employer|company.?name/.test(s))     return 'currentCompany';
    if (/current.?title|job.?title|position|role/.test(s) &&
        !/apply|applying|interested/.test(s))                  return 'jobTitle';

    return 'unknown';
  }

  /**
   * Scans all interactive form fields in a container (default: document).
   * Returns an array of { el, type } objects, skipping hidden/button types.
   */
  function scanFields(container = document) {
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"])',
      'textarea',
      'select',
      '[role="combobox"]',
      '[role="listbox"]',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selectors))
      .filter(el => {
        // Skip invisible elements
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
      })
      .map(el => ({ el, type: classifyField(el) }))
      .filter(({ type }) => type !== 'skip');
  }

  // ── Expose globally ──────────────────────────────────────────────────────────
  window.classifyField = classifyField;
  window.scanFields    = scanFields;
  window.getFieldLabel = getLabel;

})();
