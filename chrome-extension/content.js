// Content script for brandos Chrome Extension
// This runs on all web pages

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SELECTION') {
    const selection = window.getSelection().toString();
    sendResponse({ selection });
  }
  return true;
});

// Optional: Add keyboard shortcut to check selection
document.addEventListener('keydown', (e) => {
  // Alt + Shift + B to check selection
  if (e.altKey && e.shiftKey && e.key === 'B') {
    const selection = window.getSelection().toString();
    if (selection) {
      chrome.runtime.sendMessage({
        type: 'CHECK_SELECTION',
        text: selection
      });
    }
  }
});

