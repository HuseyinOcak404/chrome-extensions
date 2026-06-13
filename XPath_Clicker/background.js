chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "main.html",
    enabled: true
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("XPath Clicker yüklendi.");
});
chrome.alarms.onAlarm.addListener((alarm) => {
    // Sadece bizim oluşturduğumuz 'xpath_scheduler' alarmını kontrol et
    if (alarm.name === 'xpath_scheduler') {
        
        console.log("Alarm çaldı, işlemleri başlatılıyor...");

        // Kayıtlı verileri storage'dan al
        chrome.storage.local.get(['urls'], (data) => {
            const urlList = data.urls;
            
            if (urlList && urlList.length > 0) {
                // İşlemi başlatmak için ilk URL'yi yeni sekmede aç
                chrome.tabs.create({ url: urlList[0] });
            } else {
                console.error("Zamanlanan işlem başlatılamadı: URL listesi boş.");
            }
        });
    }
});