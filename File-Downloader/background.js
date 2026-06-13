/* jshint esversion: 11 */
/* jshint moz: true */
/* global chrome */
/* global console */

let totalDownloads = 0;
let completedDownloads = 0;
let cancelled = false;
let downloadQueue = [];
let maxConcurrentDownloads = 3;
let activeDownloads = 0;

chrome.action.onClicked.addListener(async (tab) => {
  "use strict";
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Yan panel açılamadı:', error);
  }
});

async function downloadFile(message) {
  "use strict";
    if (cancelled) {
      console.log("İndirme iptal edildi, işlem durduruluyor.");
      return;
    }

  if (message.url.startsWith("ftp://") || message.url.startsWith("sftp://")) {
    console.warn("FTP/SFTP desteklenmiyor:", message.url);
    processQueue();
    return;
  }

  try {

    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      conflictAction: "uniquify"
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error("İndirme hatası:", chrome.runtime.lastError.message);
        processQueue();
      } else {
        console.log("İndirme ID:", downloadId);

        chrome.downloads.onChanged.addListener(function deltaListener(delta) {
          if (delta.id === downloadId) {
            if (delta.state?.current === "complete") {
              activeDownloads--;
              completedDownloads++;
              chrome.runtime.sendMessage({
                action: "updateProgress",
                completed: completedDownloads,
                total: totalDownloads,
                percentage: Math.round((completedDownloads / totalDownloads) * 100)
              });
              processQueue();
              chrome.downloads.onChanged.removeListener(deltaListener);
              processQueue();
            } else if (delta.error) {
              chrome.downloads.onChanged.removeListener(deltaListener);
              processQueue();
            }
          }
        });
      }
    });
  } catch (err) {
    console.error("İndirme hatası:", err);
    processQueue();
  }
}

function processQueue() {
  "use strict";
  if (cancelled || downloadQueue.length === 0) {
    return;
  }

  while (activeDownloads < maxConcurrentDownloads && downloadQueue.length > 0) {
    const next = downloadQueue.shift();
    activeDownloads++;
    downloadFile(next);
  }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  "use strict";
  if (message.action === "enqueue") {
    cancelled = false;

    if (downloadQueue.length === 0) {
      completedDownloads = 0;
    }

    totalDownloads = message.totalDownloads;

    downloadQueue.push(message);
    processQueue();

    sendResponse({ success: true });
    return true;

  }
  if (message.action === "cancelAll") {
    cancelAllDownloads();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "resetCancel") {
    cancelled = false;
    sendResponse({ success: true });
    return true;
  }
});

function cancelAllDownloads() {
  "use strict";
  downloadQueue = [];
  cancelled = true;

  chrome.downloads.search({ state: "in_progress" }, results => {
    results.forEach(d => chrome.downloads.cancel(d.id));
  });

  chrome.runtime.sendMessage({ action: "cancelled" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  "use strict";
  if (message.action === "cancelAll") {
    cancelAllDownloads();
    sendResponse({ success: true });
    return true;
  }
});
