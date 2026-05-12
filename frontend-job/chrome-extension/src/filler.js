/**
 * filler.js — React-safe form fill engine
 * Handles: regular inputs, React-controlled inputs, <select>, textarea,
 * role="combobox", contenteditable, and <input type="file"> injection.
 *
 * All fills use the native setter bypass so React state syncs correctly.
 */
'use strict';

(function () {

  // ── Native setter cache ────────────────────────────────────────────────────
  const inputSetter    = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  const selectSetter   = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  const filesSetter    = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set;

  /**
   * Fire a sequence of DOM events that React/Vue/Angular listen to.
   * Order matters: input → change → blur
   */
  function fireEvents(el, events = ['input', 'change', 'blur']) {
    for (const name of events) {
      el.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
    }
  }

  /**
   * Simulate human-like typing with small random delays.
   * Returns a promise that resolves when done.
   */
  async function humanType(el, value, minDelay = 30, maxDelay = 90) {
    el.focus();
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    // Select all existing content first
    el.select?.();

    // Use native setter to set full value at once (then fire events)
    // This is faster than character-by-character while still triggering React
    if (inputSetter) inputSetter.call(el, value);
    else if (textareaSetter) textareaSetter.call(el, value);
    else el.value = value;

    // Small delay simulating a fast typist
    await delay(minDelay + Math.random() * (maxDelay - minDelay));
    fireEvents(el);
  }

  /** Fill a plain <input> or <textarea> */
  async function fillText(el, value) {
    if (!value && value !== 0) return;
    const v = String(value);
    if (el.tagName === 'TEXTAREA') {
      if (textareaSetter) textareaSetter.call(el, v);
      else el.value = v;
    } else {
      if (inputSetter) inputSetter.call(el, v);
      else el.value = v;
    }
    await delay(50 + Math.random() * 60);
    fireEvents(el);
  }

  /** Fill a <select> by value, label text, or partial label match */
  async function fillSelect(el, value) {
    if (!value) return;
    const v = String(value).toLowerCase().trim();

    // Try exact value match first
    for (const opt of el.options) {
      if (opt.value.toLowerCase() === v) {
        if (selectSetter) selectSetter.call(el, opt.value);
        else el.value = opt.value;
        await delay(40);
        fireEvents(el);
        return true;
      }
    }
    // Try label text contains match
    for (const opt of el.options) {
      if (opt.text.toLowerCase().includes(v) || v.includes(opt.text.toLowerCase())) {
        if (selectSetter) selectSetter.call(el, opt.value);
        else el.value = opt.value;
        await delay(40);
        fireEvents(el);
        return true;
      }
    }
    return false; // no match found
  }

  /**
   * Fill a role="combobox" or custom dropdown (Workday, Lever, Ashby etc).
   * Strategy: click to open → wait for options → click matching option.
   */
  async function fillCombobox(el, value) {
    if (!value) return false;
    const v = String(value).toLowerCase().trim();

    el.focus();
    el.click();
    await delay(300);

    // Wait up to 1s for listbox/option elements to appear
    const listbox = await waitFor(
      () => document.querySelector('[role="listbox"], [role="option"], [data-automation-id="promptOption"]'),
      1000,
    );
    if (!listbox) return false;

    // Find options in listbox scope
    const optionEl = document.querySelector('[role="option"], li[role="option"], [data-automation-id="promptOption"]');
    if (!optionEl) return false;

    const allOptions = document.querySelectorAll('[role="option"], [data-automation-id="promptOption"]');
    for (const opt of allOptions) {
      if (opt.textContent.toLowerCase().includes(v) || v.includes(opt.textContent.toLowerCase().trim())) {
        opt.click();
        await delay(150);
        return true;
      }
    }
    // Dismiss if no match
    document.body.click();
    return false;
  }

  /**
   * Fill a contenteditable element (rare but used in some ATSs).
   */
  async function fillContentEditable(el, value) {
    el.focus();
    el.textContent = '';
    await delay(30);
    document.execCommand('insertText', false, String(value));
    if (!el.textContent) el.textContent = String(value); // fallback
    fireEvents(el);
  }

  /**
   * Smart fill: detects element type and uses the right strategy.
   * Returns 'filled' | 'select_no_match' | 'skipped'
   */
  async function smartFill(el, value) {
    if (!el || (!value && value !== 0)) return 'skipped';

    const tag  = el.tagName.toLowerCase();
    const role = el.getAttribute('role')?.toLowerCase();
    const type = (el.type ?? '').toLowerCase();

    if (tag === 'select') {
      const ok = await fillSelect(el, value);
      return ok ? 'filled' : 'select_no_match';
    }
    if (tag === 'textarea') {
      await fillText(el, value);
      return 'filled';
    }
    if (tag === 'input') {
      if (type === 'file') return 'skip'; // handled separately via injectFile
      await fillText(el, value);
      return 'filled';
    }
    if (role === 'combobox' || role === 'listbox') {
      const ok = await fillCombobox(el, value);
      return ok ? 'filled' : 'select_no_match';
    }
    if (el.contentEditable === 'true' || el.isContentEditable) {
      await fillContentEditable(el, value);
      return 'filled';
    }
    return 'skipped';
  }

  /**
   * Inject a PDF/file into an <input type="file"> element.
   * Works on React and non-React apps.
   *
   * @param {HTMLInputElement} el - the file input element
   * @param {string} base64 - base64-encoded file content
   * @param {string} filename - e.g. "resume.pdf"
   * @param {string} mimeType - e.g. "application/pdf"
   */
  function injectFile(el, base64, filename = 'resume.pdf', mimeType = 'application/pdf') {
    try {
      const binary = atob(base64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const file = new File([bytes], filename, { type: mimeType, lastModified: Date.now() });
      const dt   = new DataTransfer();
      dt.items.add(file);

      if (filesSetter) filesSetter.call(el, dt.files);
      else el.files = dt.files;

      fireEvents(el, ['change', 'input']);
      return true;
    } catch (err) {
      console.warn('[Job Agent] File injection failed:', err);
      return false;
    }
  }

  /**
   * Handle checkboxes and radio buttons for yes/no type fields.
   * @param {string} answer - 'yes' | 'no' | 'true' | 'false' | label text
   */
  async function fillRadioOrCheckbox(container, answer) {
    const a = answer.toLowerCase().trim();
    const isYes = /^(yes|true|1)$/.test(a);
    const isNo  = /^(no|false|0)$/.test(a);

    const inputs = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    for (const inp of inputs) {
      const label = (inp.getAttribute('value') ?? inp.parentElement?.textContent ?? '').toLowerCase().trim();
      if ((isYes && /yes|true|1/.test(label)) || (isNo && /no|false|0/.test(label)) || label === a) {
        inp.checked = true;
        fireEvents(inp, ['change', 'click']);
        await delay(60);
        return true;
      }
    }
    return false;
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Poll until selector returns a truthy element or timeout reached.
   */
  function waitFor(fn, timeout = 2000, interval = 100) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const result = fn();
        if (result) return resolve(result);
        if (Date.now() - start >= timeout) return resolve(null);
        setTimeout(check, interval);
      };
      check();
    });
  }

  /**
   * Wait for a DOM element to appear.
   */
  function waitForEl(selector, timeout = 3000) {
    return waitFor(() => document.querySelector(selector), timeout);
  }

  // ── Expose globally ──────────────────────────────────────────────────────────
  window.JobAgentFiller = {
    fillText,
    fillSelect,
    fillCombobox,
    fillContentEditable,
    fillRadioOrCheckbox,
    smartFill,
    injectFile,
    fireEvents,
    delay,
    waitFor,
    waitForEl,
  };

})();
