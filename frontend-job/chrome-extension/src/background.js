'use strict';

const KEEPALIVE_ALARM = 'keepalive';
const POLL_ALARM      = 'poll-matches';
const POLL_INTERVAL   = 30; // minutes
const PROFILE_KEY     = 'jobagent_profile';

// ── Install / startup ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ dashboardUrl: 'http://localhost:3000', autoSave: true });
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 }); // ~25s — prevents SW dormancy
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  chrome.contextMenus.create({
    id: 'save-job',
    title: 'Save this job to Job Agent',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'fill-application',
    title: 'Co-Pilot: Fill this application',
    contexts: ['page'],
  });
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarms();
});

function ensureAlarms() {
  chrome.alarms.get(KEEPALIVE_ALARM, (a) => {
    if (!a) chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 });
  });
  chrome.alarms.get(POLL_ALARM, (a) => {
    if (!a) chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  });
}

// ── Alarms ────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) return; // no-op ping — just wakes the SW
  if (alarm.name === POLL_ALARM) pollMatchCount();
});

// ── Match polling ─────────────────────────────────────────────────────────────

async function pollMatchCount() {
  try {
    const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
    if (!dashboardUrl) return;

    const res = await fetch(`${dashboardUrl}/api/jobs/matches?limit=100`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return;

    const data = await res.json();
    const matches = Array.isArray(data) ? data : (data.matches ?? []);
    const highMatches = matches.filter((m) => (m.score ?? 0) >= 75 && m.status === 'pending');
    const count = highMatches.length;

    await chrome.storage.local.set({ badgeCount: count });
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    const { notifiedJobIds } = await chrome.storage.local.get('notifiedJobIds');
    const prevNotified = new Set(notifiedJobIds ?? []);
    const newMatches = highMatches.filter((m) => !prevNotified.has(m.jobId ?? m.id));

    for (const match of newMatches.slice(0, 3)) {
      const jobId = match.jobId ?? match.id;
      chrome.notifications.create(`job-${jobId}`, {
        type: 'basic',
        iconUrl: '../icons/icon48.png',
        title: 'New High Match Job',
        message: `${match.job?.title ?? 'New Job'} at ${match.job?.company ?? 'Unknown'} — ${match.score}%`,
      });
    }

    const allNotified = [...prevNotified, ...newMatches.map((m) => m.jobId ?? m.id)];
    await chrome.storage.local.set({ notifiedJobIds: allNotified.slice(-200) });
  } catch {
    // Dashboard offline — fail silently
  }
}

pollMatchCount();

// ── Profile helpers ───────────────────────────────────────────────────────────

async function getProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROFILE_KEY, (r) => resolve(r[PROFILE_KEY] ?? null));
  });
}

async function saveProfile(partial) {
  const existing = (await getProfile()) ?? {};
  const merged = deepMerge(existing, partial);
  merged._syncedAt = new Date().toISOString();
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROFILE_KEY]: merged }, resolve);
  });
}

function deepMerge(base, override) {
  const result = Object.assign({}, base);
  for (const [key, val] of Object.entries(override)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key] ?? {}, val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ── Context menu ──────────────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'fill-application') {
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_COPILOT' });
    return;
  }

  if (info.menuItemId === 'save-job') {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__jobAgentData,
      });
      const jobData = results?.[0]?.result;
      if (!jobData) { notify('No job detected on this page.'); return; }

      const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
      const res = await fetch(`${dashboardUrl}/api/jobs/save-external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: jobData }),
      });
      notify(
        res.ok ? `"${jobData.title}" saved to Job Agent.` : 'Could not save job. Is the dashboard running?',
        res.ok ? 'Job Saved!' : 'Save Failed',
      );
    } catch {
      notify('Failed to save job.', 'Job Agent Error');
    }
  }
});

function notify(message, title = 'Job Agent') {
  chrome.notifications.create(`job-agent-${Date.now()}`, {
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title,
    message,
  });
}

// ── Notification click ────────────────────────────────────────────────────────

chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId);
  const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
  const url = dashboardUrl ?? 'http://localhost:3000';
  if (notificationId.startsWith('job-') && !notificationId.startsWith('job-agent-')) {
    chrome.tabs.create({ url: `${url}/jobs/${notificationId.replace('job-', '')}` });
  } else {
    chrome.tabs.create({ url: `${url}/matches` });
  }
});

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;
});

async function getAuthHeaders() {
  const { extensionToken } = await chrome.storage.local.get('extensionToken');
  return extensionToken
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${extensionToken}` }
    : { 'Content-Type': 'application/json' };
}

async function handleMessage(message, sendResponse) {
  const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
  const base = dashboardUrl ?? 'http://localhost:3000';

  try {
    switch (message.type) {

      // ── Existing: job matching & saving ──────────────────────────────────
      case 'GET_MATCH_SCORE': {
        const res = await fetch(`${base}/api/jobs/quick-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.jobData),
          signal: AbortSignal.timeout(15000),
        });
        sendResponse({ success: res.ok, data: await res.json() });
        break;
      }
      case 'SAVE_JOB': {
        const res = await fetch(`${base}/api/jobs/save-external`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job: message.jobData }),
          signal: AbortSignal.timeout(10000),
        });
        sendResponse({ success: res.ok, data: await res.json() });
        break;
      }
      case 'GET_BADGE_COUNT': {
        const { badgeCount } = await chrome.storage.local.get('badgeCount');
        sendResponse({ count: badgeCount ?? 0 });
        break;
      }
      case 'OPEN_DASHBOARD': {
        chrome.tabs.create({ url: `${base}${message.path ?? ''}` });
        sendResponse({ success: true });
        break;
      }

      // ── Phase 1: Profile ──────────────────────────────────────────────────
      case 'GET_PROFILE': {
        sendResponse({ success: true, profile: await getProfile() });
        break;
      }
      case 'SAVE_PROFILE': {
        await saveProfile(message.profile);
        sendResponse({ success: true });
        break;
      }
      case 'CLEAR_PROFILE': {
        await new Promise((r) => chrome.storage.local.remove(PROFILE_KEY, r));
        sendResponse({ success: true });
        break;
      }

      // Syncs profile from the Next.js dashboard (called on "Connect Extension")
      case 'SYNC_PROFILE': {
        // If a token was passed (first-time connect), save it first
        if (message.token) {
          await chrome.storage.local.set({ extensionToken: message.token });
        }
        const headers = await getAuthHeaders();
        const res = await fetch(`${base}/api/profile`, {
          headers,
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) { sendResponse({ success: false, error: 'Dashboard sync failed' }); break; }
        await saveProfile(await res.json());
        sendResponse({ success: true });
        break;
      }

      // Save token (called from popup after user pastes it)
      case 'SAVE_TOKEN': {
        await chrome.storage.local.set({ extensionToken: message.token });
        sendResponse({ success: true });
        break;
      }

      // ── Phase 1: Application tracking ────────────────────────────────────
      case 'APPLICATION_SUBMITTED': {
        const { applications = [] } = await chrome.storage.local.get('applications');
        const entry = { ...message.payload, id: `app-${Date.now()}` };
        applications.unshift(entry);
        await chrome.storage.local.set({ applications: applications.slice(0, 500) });

        // Best-effort POST to dashboard
        try {
          const headers = await getAuthHeaders();
          await fetch(`${base}/api/applications`, {
            method: 'POST',
            headers,
            body: JSON.stringify(entry),
            signal: AbortSignal.timeout(8000),
          });
        } catch { /* offline — will sync later */ }

        sendResponse({ success: true, entry });
        break;
      }

      // ── Phase 2: GPT answer for custom questions ──────────────────────────
      case 'GET_GPT_ANSWER': {
        const profile = await getProfile();
        const { question, context } = message;
        try {
          const res = await fetch(`${base}/api/copilot/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, context, profile }),
            signal: AbortSignal.timeout(15000),
          });
          const data = await res.json();
          sendResponse({ success: true, answer: data.answer ?? '' });
        } catch {
          // Dashboard offline — return empty so user fills manually
          sendResponse({ success: false, answer: '' });
        }
        break;
      }

      // ── Phase 3 stub: JIT PDF ─────────────────────────────────────────────
      case 'REQUEST_TAILORED_PDF': {
        const profile = await getProfile();
        sendResponse({ success: true, type: 'base', url: profile?.resumeUrl ?? null, base64: null });
        break;
      }

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err?.message ?? 'Unknown error' });
  }
}
