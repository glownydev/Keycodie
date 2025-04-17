// Background script for Keycodie extension

// Listen for messages from settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePopupState') {
    chrome.storage.sync.set({
      keycodiePopupEnabled: message.enabled
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Keycodie AI Assistant installed');
});
