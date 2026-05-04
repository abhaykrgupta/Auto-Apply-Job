const content = document.getElementById('content');
const statusEl = document.getElementById('connection-status');
const dashboardLink = document.getElementById('open-dashboard');

// ─── Storage helpers ───────────────────────────────────────────
function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function setStorage(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

// ─── Init ──────────────────────────────────────────────────────
async function init() {
  const { appUrl, jobData } = await getStorage(['appUrl', 'jobData']);

  dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (appUrl) chrome.tabs.create({ url: appUrl });
  });

  if (!appUrl) {
    renderSetup();
    return;
  }

  // Check connection
  try {
    const res = await fetch(`${appUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
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

  // Get current tab job data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const extractedJob = await extractJobFromTab(tab);

  if (extractedJob) {
    renderScore(appUrl, extractedJob);
  } else {
    renderNoJob(appUrl);
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
    await setStorage({ appUrl: url, profile });
    init();
  });
}

function renderNoJob(appUrl) {
  content.innerHTML = `
    <div class="status status-loading">
      Navigate to a job posting on LinkedIn, Indeed, Greenhouse, or Lever to see your match score.
    </div>
    <button class="btn btn-outline" id="go-jobs">Browse Jobs on Dashboard</button>
    <button class="btn btn-outline" style="margin-top:6px" id="go-settings">⚙ Change App URL</button>
  `;

  document.getElementById('go-jobs').addEventListener('click', () => {
    chrome.tabs.create({ url: `${appUrl}/jobs` });
  });
  document.getElementById('go-settings').addEventListener('click', async () => {
    await setStorage({ appUrl: null });
    renderSetup();
  });
}

async function renderScore(appUrl, job) {
  content.innerHTML = `<div class="status status-loading">🔍 Calculating match score...</div>`;

  try {
    const res = await fetch(`${appUrl}/api/jobs/quick-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error('Match API failed');
    const data = await res.json();

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

    document.getElementById('save-job-btn').addEventListener('click', () => saveJob(appUrl, job, data));
    document.getElementById('apply-btn').addEventListener('click', () => applyViaAgent(appUrl, job));
    document.getElementById('tailor-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${appUrl}/jobs` });
    });

  } catch (err) {
    content.innerHTML = `
      <div class="status status-error">Could not calculate score. Is the app running?</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:10px">
        <b>Job detected:</b> ${job.title} at ${job.company}
      </div>
      <button class="btn btn-primary" id="save-only">💾 Save Job Without Score</button>
    `;
    document.getElementById('save-only').addEventListener('click', () => saveJob(appUrl, job, {}));
  }
}

async function saveJob(appUrl, job, matchData) {
  try {
    const res = await fetch(`${appUrl}/api/jobs/save-external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job, matchData }),
    });
    if (res.ok) {
      content.innerHTML = `<div class="status" style="background:rgba(16,185,129,0.1);color:#10b981">✅ Job saved to Job Agent!</div>`;
    }
  } catch {
    content.innerHTML = `<div class="status status-error">Failed to save job</div>`;
  }
}

async function applyViaAgent(appUrl, job) {
  chrome.tabs.create({ url: `${appUrl}/search?autoApply=${encodeURIComponent(job.applyUrl || '')}` });
}

init();
