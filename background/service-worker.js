/**
 * service-worker.js - Background service worker
 * Kaynak: v2/src/background/
 *
 * Görevler:
 * - Ayarlar yönetimi (chrome.storage)
 * - Message routing
 */

console.log('[UYAP-EXT] Background service worker started');

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[UYAP-EXT] Message handler error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Async response
});

async function handleMessage(message, sender) {
  console.log('[UYAP-EXT] Background received:', message.type);

  switch (message.type) {
    case 'GET_SETTINGS':
      return await getSettings();

    case 'SET_SETTINGS':
      return await setSettings(message.payload);

    default:
      console.warn('[UYAP-EXT] Unknown message type:', message.type);
      return { success: false, error: 'Unknown message type' };
  }
}

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get('uyap-settings', result => {
      resolve(result['uyap-settings'] || null);
    });
  });
}

async function setSettings(settings) {
  return new Promise(resolve => {
    chrome.storage.local.set({ 'uyap-settings': settings }, () => {
      resolve({ success: true });
    });
  });
}

// Extension kurulum/güncelleme
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('[UYAP-EXT] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[UYAP-EXT] Extension updated to', chrome.runtime.getManifest().version);
  }
});
