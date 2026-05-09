const content = document.getElementById('content');
const statusEl = document.getElementById('connection-status');
const dashboardLink = document.getElementById('open-dashboard');

// ─── Storage helpers (sync — shared with background.js) ────────
function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
}
function setStorage(obj) {
  return new Promise((resolve) => chrome.storage.sync.set(obj, resolve));
}

// ─── Init ──────────────────────────────────────────────────────
async function init() {
  const { dashboardUrl, jobData } = await getStorage(['dashboardUrl', 'jobData']);

  dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (dashboardUrl) chrome.tabs.create({ url: dashboardUrl });
  });

  if (!dashboardUrl) {
    renderSetup();
    return;
  }

  // Check connection
  try {
    const res = await fetch(`${dashboardUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      statusEl.textContent = '● Connected';
      statusEl.className = 'connected';
    } else {
      statusEl.textContent = '✗ Server error';
      statusEl.className = 'disconnected';
    }
  } catch {
    statusEl.textContent = '✗ Not reachable';
    statusEl.className = 'disconnected';
  }

  // Get badge count from background
  chrome.runtime.sendMessage({ type: 'GET_BADGE_COUNT' }, (res) => {
    if (res?.count > 0) {
      statusEl.textContent += ` · ${res.count} match${res.count > 1 ? 'es' : ''}`;
    }
  });

  // Get current tab job data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const extractedJob = await extractJobFromTab(tab);

  if (extractedJob) {
    renderScore(dashboardUrl, extractedJob);
  } else {
    renderNoJob(dashboardUrl);
  }
}

// ─── Extract job from content script ──────────────────────────
async function extractJobFromTab(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__jobAgentData,
    });
    return results?.[0]?.result ?? null;
  } catch {
    return null;
  }
}

// ─── Views ─────────────────────────────────────────────────────
function renderSetup() {
  content.innerHTML = `
    <div class="form-group">
      <label>Job Agent App URL</label>
      <input id="app-url" type="text" placeholder="http://localhost:3000" />
    </div>
    <div class="form-group">
      <label>Phone Number</label>
      <input id="phone-input" type="tel" placeholder="+1 555 000 0000" />
    </div>
    <div class="form-group">
      <label>Preferred Location</label>
      <input id="location-input" type="text" placeholder="San Francisco, CA" />
    </div>
    <button class="btn btn-primary" id="save-btn">Connect</button>
    <p style="font-size:11px;color:#64748b;margin-top:8px;text-align:center">
      Enter the URL where your Job Agent app is running
    </p>
  `;

  document.getElementById('save-btn').addEventListener('click', async () => {
    const url = document.getElementById('app-url').value.replace(/\/$/, '');
    if (!url) return;
    const phone = document.getElementById('phone-input').value.trim();
    const location = document.getElementById('location-input').value.trim();
    const profile = {};
    if (phone) profile.phone = phone;
    if (location) profile.location = location;
    await setStorage({ dashboardUrl: url, profile, autoSave: true });
    init();
  });
}

function renderNoJob(dashboardUrl) {
  content.innerHTML = `
    <div class="status status-loading">
      Navigate to a job posting on LinkedIn, Indeed, Greenhouse, or Lever to see your match score.
    </div>
    <button class="btn btn-outline" id="go-jobs">Browse Jobs on Dashboard</button>
    <button class="btn btn-outline" style="margin-top:6px" id="go-settings">⚙ Change App URL</button>
  `;

  document.getElementById('go-jobs').addEventListener('click', () => {
    chrome.tabs.create({ url: `${dashboardUrl}/jobs` });
  });
  document.getElementById('go-settings').addEventListener('click', async () => {
    await setStorage({ dashboardUrl: null });
    renderSetup();
  });
}

async function renderScore(dashboardUrl, job) {
  content.innerHTML = `<div class="status status-loading">🔍 Calculating match score...</div>`;

  try {
    // Route through background.js to avoid CORS issues
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_MATCH_SCORE', jobData: job }, (res) => {
        if (res?.success) resolve(res.data);
        else reject(new Error(res?.error ?? 'Match failed'));
      });
    });

    const data = result;
    const score = data.score ?? 0;
    const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-med' : 'score-low';
    const emoji = score >= 80 ? '🎯' : score >= 60 ? '👍' : '📊';

    const strengthTags = (data.strengths ?? []).slice(0, 3)
      .map((s) => `<span class="tag tag-strength">${s}</span>`).join('');
    const gapTags = (data.weaknesses ?? []).slice(0, 2)
      .map((g) => `<span class="tag tag-gap">${g}</span>`).join('');

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

        ${data.recommendation ? `<p style="font-size:11px;color:#94a3b8;margin-top:8px;line-height:1.5">${data.recommendation}</p>` : ''}
      </div>

      <div class="actions">
        <button class="btn btn-outline" id="save-job-btn">💾 Save Job</button>
        <button class="btn btn-primary" id="apply-btn">${emoji} Apply via Agent</button>
      </div>
      <button class="btn btn-outline" id="tailor-btn" style="margin-top:6px">✨ Tailor Resume for This Job</button>
    `;

    document.getElementById('save-job-btn').addEventListener('click', () => saveJob(job, data));
    document.getElementById('apply-btn').addEventListener('click', () => applyViaAgent(dashboardUrl, job));
    document.getElementById('tailor-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${dashboardUrl}/jobs` });
    });

  } catch {
    content.innerHTML = `
      <div class="status status-error">Could not calculate score. Is the app running?</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:10px">
        <b>Job detected:</b> ${job.title} at ${job.company}
      </div>
      <button class="btn btn-primary" id="save-only">💾 Save Job Without Score</button>
    `;
    document.getElementById('save-only').addEventListener('click', () => saveJob(job, {}));
  }
}

async function saveJob(job, matchData) {
  chrome.runtime.sendMessage({ type: 'SAVE_JOB', jobData: { ...job, matchData } }, (res) => {
    if (res?.success) {
      content.innerHTML = `<div class="status" style="background:rgba(16,185,129,0.1);color:#10b981">✅ Job saved to Job Agent!</div>`;
    } else {
      content.innerHTML = `<div class="status status-error">Failed to save job</div>`;
    }
  });
}

async function applyViaAgent(dashboardUrl, job) {
  chrome.tabs.create({ url: `${dashboardUrl}/search?autoApply=${encodeURIComponent(job.applyUrl || '')}` });
}

init();
