'use strict';

const POLL_ALARM = 'poll-matches';
const POLL_INTERVAL = 30; // minutes

// ── Install / startup ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ dashboardUrl: 'http://localhost:3000', autoSave: true });
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  chrome.contextMenus.create({
    id: 'save-job',
    title: 'Save this job to Job Agent',
    contexts: ['page'],
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get(POLL_ALARM, (alarm) => {
    if (!alarm) chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL });
  });
});

// ── Polling alarm ─────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) pollMatchCount();
});

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

    // Notify for new matches not previously notified
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
    await chrome.storage.local.set({ notifiedJobIds: allNotified.slice(-100) });
  } catch {
    // Dashboard may be offline — fail silently
  }
}

// Run once on load
pollMatchCount();

// ── Context menu ──────────────────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-job' || !tab?.id) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__jobAgentData,
    });
    const jobData = results?.[0]?.result;

    if (!jobData) {
      chrome.notifications.create(`job-agent-${Date.now()}`, {
        type: 'basic',
        iconUrl: '../icons/icon48.png',
        title: 'Job Agent',
        message: 'No job detected on this page.',
      });
      return;
    }

    const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
    const res = await fetch(`${dashboardUrl}/api/jobs/save-external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job: jobData }),
    });

    chrome.notifications.create(`job-agent-${Date.now()}`, {
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: res.ok ? 'Job Saved!' : 'Save Failed',
      message: res.ok
        ? `"${jobData.title}" at ${jobData.company} saved to Job Agent.`
        : 'Could not save job. Is the dashboard running?',
    });
  } catch {
    chrome.notifications.create(`job-agent-${Date.now()}`, {
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: 'Job Agent Error',
      message: 'Failed to save job.',
    });
  }
});

// ── Notification click → open dashboard ───────────────────────────────────────

chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId);
  const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
  const url = dashboardUrl ?? 'http://localhost:3000';

  if (notificationId.startsWith('job-') && !notificationId.startsWith('job-agent-')) {
    const jobId = notificationId.replace('job-', '');
    chrome.tabs.create({ url: `${url}/jobs/${jobId}` });
  } else {
    chrome.tabs.create({ url: `${url}/matches` });
  }
});

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true; // keep channel open for async
});

async function handleMessage(message, sendResponse) {
  const { dashboardUrl } = await chrome.storage.sync.get('dashboardUrl');
  const base = dashboardUrl ?? 'http://localhost:3000';

  try {
    switch (message.type) {
      case 'GET_MATCH_SCORE': {
        const res = await fetch(`${base}/api/jobs/quick-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.jobData),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();
        sendResponse({ success: res.ok, data });
        break;
      }
      case 'SAVE_JOB': {
        const res = await fetch(`${base}/api/jobs/save-external`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job: message.jobData }),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        sendResponse({ success: res.ok, data });
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
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err?.message ?? 'Unknown error' });
  }
}
