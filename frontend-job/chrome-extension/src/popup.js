'use strict';

const content    = document.getElementById('content');
const statusEl   = document.getElementById('connection-status');
const dashLink   = document.getElementById('open-dashboard');

// ── Storage helpers ───────────────────────────────────────────────────────────
const syncGet  = (keys) => new Promise((r) => chrome.storage.sync.get(keys, r));
const syncSet  = (obj)  => new Promise((r) => chrome.storage.sync.set(obj, r));
const localGet = (keys) => new Promise((r) => chrome.storage.local.get(keys, r));

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const { dashboardUrl } = await syncGet(['dashboardUrl']);

  dashLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: dashboardUrl ?? 'http://localhost:3000' });
  });

  if (!dashboardUrl) {
    renderSetup();
    return;
  }

  // Check dashboard reachability
  try {
    const res = await fetch(`${dashboardUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
    statusEl.textContent = res.ok ? '● Connected' : '✗ Server error';
    statusEl.className   = res.ok ? 'connected' : 'disconnected';
  } catch {
    statusEl.textContent = '✗ Not reachable';
    statusEl.className   = 'disconnected';
  }

  // Show match badge count
  chrome.runtime.sendMessage({ type: 'GET_BADGE_COUNT' }, (res) => {
    if (res?.count > 0) {
      statusEl.textContent += ` · ${res.count} match${res.count > 1 ? 'es' : ''}`;
    }
  });

  // Get profile from local storage
  const { jobagent_profile: profile } = await localGet('jobagent_profile');

  // Get active tab job data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const atsId = await getAtsIdFromTab(tab);
  const job   = await extractJobFromTab(tab);

  if (atsId && atsId !== 'unknown') {
    renderCopilot(dashboardUrl, job, atsId, profile);
  } else if (job) {
    renderScore(dashboardUrl, job, profile);
  } else {
    renderNoJob(dashboardUrl, profile);
  }
}

async function getAtsIdFromTab(tab) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__ATS_ID__,
    });
    return res?.[0]?.result ?? null;
  } catch { return null; }
}

async function extractJobFromTab(tab) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__jobAgentData,
    });
    return res?.[0]?.result ?? null;
  } catch { return null; }
}

// ── Views ─────────────────────────────────────────────────────────────────────

function renderSetup() {
  content.innerHTML = `
    <div style="margin-bottom:16px">
      <p style="font-size:12px;color:#94a3b8;line-height:1.6">
        Connect Job Agent to your dashboard to auto-fill applications on any job site.
      </p>
    </div>
    <div class="form-group">
      <label>Dashboard URL</label>
      <input id="app-url" type="text" placeholder="http://localhost:3000" value="http://localhost:3000" />
    </div>
    <button class="btn btn-primary" id="save-btn">Connect Dashboard</button>
    <p style="font-size:11px;color:#475569;margin-top:10px;text-align:center;line-height:1.5">
      Your profile will be synced automatically once connected.
    </p>
  `;
  document.getElementById('save-btn').addEventListener('click', async () => {
    const url = document.getElementById('app-url').value.replace(/\/$/, '');
    if (!url) return;
    await syncSet({ dashboardUrl: url, autoSave: true });
    init();
  });
}

function renderNoJob(dashboardUrl, profile) {
  const profileOk = !!profile?.personal?.email;
  content.innerHTML = `
    <div class="status status-loading" style="margin-bottom:12px">
      Navigate to a job application page on Greenhouse, Lever, Workday, Ashby, LinkedIn and 15+ more to activate Co-Pilot.
    </div>
    ${profileBanner(profile)}
    <button class="btn btn-outline" id="go-jobs">Browse Jobs on Dashboard</button>
    ${!profileOk ? `<button class="btn btn-outline" style="margin-top:6px" id="sync-btn">⟳ Sync Profile from Dashboard</button>` : ''}
    <button class="btn btn-outline" style="margin-top:6px" id="go-settings">⚙ Change App URL</button>
  `;

  document.getElementById('go-jobs').addEventListener('click', () => {
    chrome.tabs.create({ url: `${dashboardUrl}/jobs` });
  });
  document.getElementById('go-settings')?.addEventListener('click', async () => {
    await syncSet({ dashboardUrl: null });
    renderSetup();
  });
  document.getElementById('sync-btn')?.addEventListener('click', () => syncProfile(dashboardUrl));
}

function renderCopilot(dashboardUrl, job, atsId, profile) {
  const profileOk = !!profile?.personal?.email;
  const atsLabel  = atsId.charAt(0).toUpperCase() + atsId.slice(1);

  content.innerHTML = `
    <div style="
      display:flex;align-items:center;gap:8px;
      background:#1e293b;border-radius:8px;padding:10px 12px;margin-bottom:12px;
    ">
      <span style="font-size:18px">🤖</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:#f1f5f9">Co-Pilot Active</div>
        <div style="font-size:11px;color:#10b981">Detected: ${atsLabel}</div>
      </div>
      <div style="margin-left:auto;font-size:10px;color:#64748b;text-align:right">
        ${job?.title ? `<div style="color:#cbd5e1;font-weight:500">${job.title}</div>` : ''}
        ${job?.company ? `<div>${job.company}</div>` : ''}
      </div>
    </div>

    ${profileBanner(profile)}

    ${profileOk ? `
      <button class="btn btn-primary" id="fill-btn">⚡ Fill Application</button>
      <p style="font-size:11px;color:#475569;margin-top:6px;text-align:center">
        You review & submit — we fill.
      </p>
    ` : `
      <div class="status status-error" style="margin-bottom:10px">
        Profile not synced. Sync it to enable auto-fill.
      </div>
    `}

    <button class="btn btn-outline" id="sync-btn" style="margin-top:6px">⟳ Sync Profile</button>
    ${job ? `<button class="btn btn-outline" id="save-job-btn" style="margin-top:6px">💾 Save Job</button>` : ''}
  `;

  document.getElementById('fill-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_COPILOT' });
    window.close();
  });
  document.getElementById('sync-btn')?.addEventListener('click', () => syncProfile(dashboardUrl));
  document.getElementById('save-job-btn')?.addEventListener('click', () => {
    if (job) chrome.runtime.sendMessage({ type: 'SAVE_JOB', jobData: job });
  });
}

async function renderScore(dashboardUrl, job, profile) {
  content.innerHTML = `<div class="status status-loading">🔍 Calculating match score...</div>`;

  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_MATCH_SCORE', jobData: job }, (res) => {
        if (res?.success) resolve(res.data);
        else reject(new Error(res?.error ?? 'Match failed'));
      });
    });

    const score      = result.score ?? 0;
    const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-med' : 'score-low';
    const emoji      = score >= 80 ? '🎯' : score >= 60 ? '👍' : '📊';
    const strengthTags = (result.strengths ?? []).slice(0, 3).map((s) => `<span class="tag tag-strength">${s}</span>`).join('');
    const gapTags      = (result.weaknesses ?? []).slice(0, 2).map((g) => `<span class="tag tag-gap">${g}</span>`).join('');

    content.innerHTML = `
      <div class="score-card">
        <div class="score-header">
          <div class="job-info">
            <div class="job-title">${job.title || 'Job'}</div>
            <div class="job-company">${job.company || ''}</div>
          </div>
          <div class="score-circle ${scoreClass}">
            <span class="num">${score}</span>
            <span class="pct">%</span>
          </div>
        </div>
        ${strengthTags || gapTags ? `<div class="tags">${strengthTags}${gapTags}</div>` : ''}
        ${result.recommendation ? `<p style="font-size:11px;color:#94a3b8;margin-top:8px;line-height:1.5">${result.recommendation}</p>` : ''}
      </div>
      <div class="actions">
        <button class="btn btn-outline" id="save-job-btn">💾 Save</button>
        <button class="btn btn-primary" id="apply-btn">${emoji} Apply via Agent</button>
      </div>
      <button class="btn btn-outline" id="tailor-btn" style="margin-top:6px">✨ Tailor Resume</button>
    `;

    document.getElementById('save-job-btn').addEventListener('click', () => saveJob(job, result));
    document.getElementById('apply-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${dashboardUrl}/search?autoApply=${encodeURIComponent(job.applyUrl || '')}` });
    });
    document.getElementById('tailor-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${dashboardUrl}/resume-builder` });
    });
  } catch {
    content.innerHTML = `
      <div class="status status-error">Could not calculate score. Is the app running?</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:10px"><b>Job:</b> ${job.title} at ${job.company}</div>
      <button class="btn btn-primary" id="save-only">💾 Save Job</button>
    `;
    document.getElementById('save-only').addEventListener('click', () => saveJob(job, {}));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function profileBanner(profile) {
  if (!profile?.personal?.email) {
    return `
      <div style="
        display:flex;align-items:center;gap:8px;
        background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);
        border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:11px;color:#f59e0b;
      ">
        ⚠ Profile not synced — sync from dashboard to enable autofill.
      </div>`;
  }
  const p = profile.personal;
  return `
    <div style="
      display:flex;align-items:center;gap:8px;
      background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);
      border-radius:8px;padding:8px 10px;margin-bottom:10px;
    ">
      <span style="font-size:14px">✅</span>
      <div style="font-size:11px">
        <div style="color:#10b981;font-weight:600">Profile ready</div>
        <div style="color:#64748b">${p.firstName} ${p.lastName} · ${p.email}</div>
      </div>
    </div>`;
}

async function syncProfile(dashboardUrl) {
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.textContent = '⟳ Syncing...'; btn.disabled = true; }

  chrome.runtime.sendMessage({ type: 'SYNC_PROFILE' }, (res) => {
    if (res?.success) {
      init(); // re-render with new profile
    } else {
      if (btn) { btn.textContent = '⟳ Sync Profile'; btn.disabled = false; }
      alert('Sync failed. Make sure dashboard is running and you are logged in.');
    }
  });
}

function saveJob(job, matchData) {
  chrome.runtime.sendMessage({ type: 'SAVE_JOB', jobData: { ...job, matchData } }, (res) => {
    if (res?.success) {
      content.innerHTML = `<div class="status" style="background:rgba(16,185,129,0.1);color:#10b981">✅ Job saved to Job Agent!</div>`;
    } else {
      content.innerHTML = `<div class="status status-error">Failed to save job</div>`;
    }
  });
}

init();
