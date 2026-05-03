// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Agent extension installed');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    chrome.storage.local.get(['appUrl'], (result) => {
      sendResponse({ appUrl: result.appUrl });
    });
    return true; // async response
  }
});
