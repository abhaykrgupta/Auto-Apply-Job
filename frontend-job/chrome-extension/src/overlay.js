/**
 * overlay.js — Co-Pilot overlay UI
 *
 * Injects a shadow DOM panel into the page (isolated from page CSS).
 * Shows fill results, handles GPT questions, and EEOC review.
 * User always submits — we only fill.
 */
'use strict';

(function () {

  let overlayHost   = null;
  let shadowRoot    = null;
  let gpqQueue      = [];  // pending GPT / custom questions
  let eeocQueue     = [];  // pending EEOC fields
  let filledCount   = 0;
  let warningCount  = 0;

  // ── Inject shadow root ────────────────────────────────────────────────────

  function createOverlay() {
    if (overlayHost) return; // already exists

    overlayHost = document.createElement('div');
    overlayHost.id = 'job-agent-copilot-host';
    overlayHost.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;';
    document.body.appendChild(overlayHost);

    shadowRoot = overlayHost.attachShadow({ mode: 'open' });

    // Inject styles inside shadow DOM
    const style = document.createElement('style');
    style.textContent = getStyles();
    shadowRoot.appendChild(style);

    renderPanel();
  }

  function destroyOverlay() {
    overlayHost?.remove();
    overlayHost  = null;
    shadowRoot   = null;
    gpqQueue     = [];
    eeocQueue    = [];
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderPanel(results = [], state = 'idle') {
    if (!shadowRoot) return;

    // Remove existing panel
    shadowRoot.querySelector('.panel')?.remove();

    const panel = document.createElement('div');
    panel.className = 'panel';

    if (state === 'idle') {
      panel.innerHTML = idleHTML();
    } else if (state === 'filling') {
      panel.innerHTML = fillingHTML();
    } else if (state === 'done') {
      panel.innerHTML = doneHTML(results);
      setupDoneListeners(panel, results);
    } else if (state === 'review') {
      panel.innerHTML = reviewHTML();
      setupReviewListeners(panel);
    }

    shadowRoot.appendChild(panel);
  }

  function idleHTML() {
    return `
      <div class="header">
        <span class="logo">🤖</span>
        <div>
          <div class="title">Job Agent Co-Pilot</div>
          <div class="subtitle" id="ats-label">Detected ATS</div>
        </div>
        <button class="close-btn" id="close-btn">✕</button>
      </div>
      <div class="body">
        <button class="btn-fill" id="fill-btn">⚡ Fill Application</button>
        <p class="hint">You review &amp; submit — we fill.</p>
      </div>
    `;
  }

  function fillingHTML() {
    return `
      <div class="header">
        <span class="logo">🤖</span>
        <div>
          <div class="title">Filling…</div>
          <div class="subtitle">Please wait</div>
        </div>
      </div>
      <div class="body">
        <div class="spinner-row">
          <div class="spinner"></div>
          <span>Scanning and filling fields…</span>
        </div>
      </div>
    `;
  }

  function doneHTML(results) {
    const filled   = results.filter(r => r.status === 'filled');
    const needsGpt = results.filter(r => r.status === 'needs_gpt');
    const eeoc     = results.filter(r => r.status === 'eeoc_review');
    const noData   = results.filter(r => r.status === 'no_data');
    const manual   = results.filter(r => r.status === 'needs_manual');

    const fieldRows = filled.map(r => `
      <div class="field-row ok">
        <span class="dot dot-ok">✓</span>
        <span class="field-name">${friendlyName(r.field)}</span>
        <span class="field-val">${r.value ? truncate(String(r.value), 22) : '✓'}</span>
      </div>
    `).join('');

    const noDataRows = noData.map(r => `
      <div class="field-row warn">
        <span class="dot dot-warn">!</span>
        <span class="field-name">${friendlyName(r.field)}</span>
        <span class="field-val">Not in profile</span>
      </div>
    `).join('');

    const pendingBadge = (needsGpt.length + eeoc.length + manual.length) > 0
      ? `<div class="pending-badge">${needsGpt.length + eeoc.length + manual.length} need review</div>`
      : '';

    return `
      <div class="header">
        <span class="logo">🤖</span>
        <div>
          <div class="title">Filled ${filled.length} field${filled.length !== 1 ? 's' : ''}</div>
          <div class="subtitle">${pendingBadge || 'All done!'}</div>
        </div>
        <button class="close-btn" id="close-btn">✕</button>
      </div>
      <div class="body">
        <div class="field-list">
          ${fieldRows}
          ${noDataRows}
        </div>
        ${needsGpt.length > 0 ? `
          <div class="section-label">Questions needing your input</div>
          <div id="gpt-queue"></div>
        ` : ''}
        ${eeoc.length > 0 ? `
          <div class="section-label eeoc-label">⚠ EEOC — Please review</div>
          <div id="eeoc-queue"></div>
        ` : ''}
        ${manual.length > 0 ? `
          <div class="section-label">Manual upload needed</div>
          ${manual.map(r => `<div class="manual-row">${r.note ?? 'Upload your resume manually'}</div>`).join('')}
        ` : ''}
        <p class="hint final-hint">Review the form above, then click Submit on the page.</p>
      </div>
    `;
  }

  function reviewHTML() {
    return `
      <div class="header">
        <span class="logo">🤖</span>
        <div>
          <div class="title">Reviewing…</div>
        </div>
        <button class="close-btn" id="close-btn">✕</button>
      </div>
      <div class="body" id="review-body">
        <p class="hint">Loading questions…</p>
      </div>
    `;
  }

  // ── Done state listeners ───────────────────────────────────────────────────

  function setupDoneListeners(panel, results) {
    panel.querySelector('#close-btn')?.addEventListener('click', destroyOverlay);

    // Render GPT questions
    const gptQueue = results.filter(r => r.status === 'needs_gpt');
    const gptContainer = panel.querySelector('#gpt-queue');
    if (gptContainer && gptQueue.length > 0) {
      renderGptQuestions(gptContainer, gptQueue);
    }

    // Render EEOC review
    const eeocQueue = results.filter(r => r.status === 'eeoc_review');
    const eeocContainer = panel.querySelector('#eeoc-queue');
    if (eeocContainer && eeocQueue.length > 0) {
      renderEeocFields(eeocContainer, eeocQueue);
    }
  }

  function renderGptQuestions(container, questions) {
    for (const q of questions) {
      const label = q.label ?? 'Question';

      // Request GPT answer from background
      chrome.runtime.sendMessage({
        type: 'GET_GPT_ANSWER',
        question: label,
        context: {
          title:   window.__scrapeTitle?.()   ?? document.title,
          company: window.__scrapeCompany?.() ?? '',
          jd:      window.__scrapeJD?.()      ?? '',
        },
      }, (res) => {
        const draft = res?.answer ?? '';
        const qDiv  = document.createElement('div');
        qDiv.className = 'gpt-q';
        qDiv.innerHTML = `
          <div class="q-label">${truncate(label, 60)}</div>
          <textarea class="q-textarea" rows="3">${escHtml(draft)}</textarea>
          <div class="q-actions">
            <button class="q-btn q-accept" data-label="${escAttr(label)}">Accept</button>
            <button class="q-btn q-skip">Skip</button>
          </div>
        `;
        qDiv.querySelector('.q-accept').addEventListener('click', async () => {
          const text = qDiv.querySelector('.q-textarea').value;
          if (text && q.el) await window.JobAgentFiller?.fillText(q.el, text);
          qDiv.querySelector('.q-actions').innerHTML = '<span class="filled-badge">✓ Filled</span>';
        });
        qDiv.querySelector('.q-skip').addEventListener('click', () => {
          qDiv.querySelector('.q-actions').innerHTML = '<span class="skip-badge">Skipped</span>';
        });
        container.appendChild(qDiv);
      });
    }
  }

  function renderEeocFields(container, fields) {
    for (const f of fields) {
      const label = f.label ?? 'EEOC Question';
      const el    = f.el;
      const div   = document.createElement('div');
      div.className = 'eeoc-field';
      div.innerHTML = `
        <div class="q-label">${truncate(label, 60)}</div>
        <div class="q-actions">
          <button class="q-btn q-fill-eeoc">Fill with profile value</button>
          <button class="q-btn q-skip">Decline to self-identify</button>
        </div>
      `;
      div.querySelector('.q-fill-eeoc').addEventListener('click', async () => {
        if (el && f.value) await window.JobAgentFiller?.smartFill(el, f.value);
        div.querySelector('.q-actions').innerHTML = '<span class="filled-badge">✓ Filled</span>';
      });
      div.querySelector('.q-skip').addEventListener('click', async () => {
        if (el) await window.JobAgentFiller?.smartFill(el, 'decline');
        div.querySelector('.q-actions').innerHTML = '<span class="skip-badge">Declined</span>';
      });
      container.appendChild(div);
    }
  }

  function setupReviewListeners(panel) {
    panel.querySelector('#close-btn')?.addEventListener('click', destroyOverlay);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  window.JobAgentOverlay = {
    show(atsId) {
      createOverlay();
      renderPanel([], 'idle');
      // Update ATS label
      const lbl = shadowRoot?.querySelector('#ats-label');
      if (lbl) lbl.textContent = atsId ? `Detected: ${atsId}` : 'Application page';
      shadowRoot?.querySelector('#fill-btn')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('jobagent:trigger_fill'));
      });
      shadowRoot?.querySelector('#close-btn')?.addEventListener('click', destroyOverlay);
    },
    showFilling() {
      renderPanel([], 'filling');
    },
    showResults(results) {
      renderPanel(results, 'done');
    },
    hide: destroyOverlay,
    isVisible: () => !!overlayHost,
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  function getStyles() {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

      .panel {
        width: 320px;
        max-height: 520px;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-bottom: 1px solid #1e293b;
        flex-shrink: 0;
      }
      .logo { font-size: 20px; }
      .title { font-size: 13px; font-weight: 700; color: #f1f5f9; }
      .subtitle { font-size: 10px; color: #64748b; margin-top: 1px; }
      .close-btn {
        margin-left: auto; background: none; border: none;
        color: #475569; font-size: 13px; cursor: pointer; padding: 4px;
        border-radius: 4px;
      }
      .close-btn:hover { background: #1e293b; color: #f1f5f9; }

      .body { padding: 12px 14px; overflow-y: auto; flex: 1; }

      .btn-fill {
        width: 100%; padding: 10px;
        background: linear-gradient(135deg, #6366f1, #7c3aed);
        color: #fff; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: opacity 0.15s;
      }
      .btn-fill:hover { opacity: 0.88; }
      .hint { font-size: 11px; color: #475569; text-align: center; margin-top: 8px; }
      .final-hint { margin-top: 12px; }

      .spinner-row { display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 12px; }
      .spinner {
        width: 16px; height: 16px; border-radius: 50%;
        border: 2px solid #1e293b; border-top-color: #6366f1;
        animation: spin 0.7s linear infinite; flex-shrink: 0;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .field-list { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; }
      .field-row {
        display: flex; align-items: center; gap: 6px;
        padding: 5px 8px; border-radius: 6px; font-size: 11px;
      }
      .field-row.ok   { background: rgba(16,185,129,0.07); }
      .field-row.warn { background: rgba(245,158,11,0.07); }
      .dot { font-size: 11px; width: 14px; text-align: center; }
      .dot-ok   { color: #10b981; }
      .dot-warn { color: #f59e0b; }
      .field-name { flex: 1; color: #cbd5e1; font-weight: 500; }
      .field-val  { color: #64748b; font-size: 10px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .pending-badge {
        display: inline-block; background: rgba(245,158,11,0.12);
        color: #f59e0b; font-size: 10px; font-weight: 600;
        padding: 1px 6px; border-radius: 10px;
      }
      .section-label {
        font-size: 10px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.07em; color: #475569; margin: 10px 0 6px;
      }
      .eeoc-label { color: #f59e0b; }

      .gpt-q, .eeoc-field { margin-bottom: 10px; }
      .q-label { font-size: 11px; color: #94a3b8; margin-bottom: 5px; line-height: 1.4; }
      .q-textarea {
        width: 100%; padding: 6px 8px;
        background: #1e293b; border: 1px solid #334155;
        border-radius: 6px; color: #f1f5f9; font-size: 11px;
        resize: vertical; outline: none;
      }
      .q-textarea:focus { border-color: #6366f1; }
      .q-actions { display: flex; gap: 6px; margin-top: 5px; }
      .q-btn {
        flex: 1; padding: 5px 8px; border: none; border-radius: 5px;
        font-size: 11px; font-weight: 600; cursor: pointer;
        transition: opacity 0.15s;
      }
      .q-btn:hover { opacity: 0.85; }
      .q-accept { background: #6366f1; color: #fff; }
      .q-fill-eeoc { background: #6366f1; color: #fff; }
      .q-skip   { background: #1e293b; color: #64748b; }
      .filled-badge { font-size: 11px; color: #10b981; font-weight: 600; }
      .skip-badge   { font-size: 11px; color: #475569; }
      .manual-row   { font-size: 11px; color: #f59e0b; padding: 5px 0; }
    `;
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  const FRIENDLY = {
    firstName: 'First Name', lastName: 'Last Name', fullName: 'Full Name',
    email: 'Email', phone: 'Phone', city: 'City', state: 'State',
    country: 'Country', linkedIn: 'LinkedIn', github: 'GitHub',
    portfolio: 'Portfolio', resumeFile: 'Resume', coverLetter: 'Cover Letter',
    salary: 'Salary', workAuth: 'Work Auth', requireSponsorship: 'Sponsorship',
    relocate: 'Relocate', yearsExp: 'Years Exp', degree: 'Degree',
    startDate: 'Start Date', jobTitle: 'Job Title', currentCompany: 'Company',
  };
  function friendlyName(key) { return FRIENDLY[key] ?? key; }
  function truncate(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }
  function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return s.replace(/"/g,'&quot;'); }

})();
