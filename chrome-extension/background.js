// Create context menu for checking selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'brandos-check',
    title: 'Check with brandos',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'brandos-check' && info.selectionText) {
    // Open popup with selected text
    // Store the selection temporarily
    await chrome.storage.local.set({ 
      pendingCheck: info.selectionText 
    });
    
    // Open popup
    chrome.action.openPopup();
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PENDING_CHECK') {
    chrome.storage.local.get(['pendingCheck'], (result) => {
      sendResponse({ text: result.pendingCheck || '' });
      // Clear after sending
      chrome.storage.local.remove('pendingCheck');
    });
    return true; // Keep channel open for async response
  }
});

