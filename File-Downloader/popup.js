/* jshint esversion: 11 */
/* jshint moz: true */
/* global chrome */
/* global console */

const translations = {
  tr: {
    langSwitch: "🌐 EN",
    contactBtn: "📩 İletişim",
    app_title: "Toplu Dosya İndirici",
    note_text: "Kopyala - Yapıştır işlemi kullanabilirsiniz. İndir butonuna bastıktan sonra indirmelerin tamamlanmasını bekleyin.",
    FilePathBtn: "Dosya Yolu",
    addRow: "Satır Ekle",
    clearTable: "Tümünü Temizle",
    downloadBtn: "İndir",
    col_1:"Klasör",
    col_2:"Dosya Adı",
    col_3:"Link",
    baseFolder:"ANA KLASÖR (Örnek: Indirmeler)",
    cancelBtn:"❌ İptal Et",
    downloadLabel:"İndirilen Dosyalar",
    status_started: "İndirme işlemi başladı",
    status_completed: "İndirme işlemi tamamlandı",
    status_cancelled: "İndirme işlemi iptal edildi"
  },

  en: {
    langSwitch: "🌐 TR",
    contactBtn: "📩 Contact",
    app_title: "Bulk File Downloader",
    note_text: "You can use Copy - Paste operation. After pressing the download button, wait for the downloads to complete.",
    FilePathBtn: "File Path",
    addRow: "Add Row",
    clearTable: "Clear All",
    downloadBtn: "Download",
    col_1:"Folder Name",
    col_2:"File Name",
    col_3:"Link",
    baseFolder:"MAIN FOLDER (E.g.: Downloads)",
    cancelBtn:"❌ Cancel",
    downloadLabel:"Downloaded Files",
    status_started: "Download started",
    status_completed: "Download completed",
    status_cancelled: "Download cancelled"

  }
};

function updateI18nTexts() {
  "use strict";
  const lang = localStorage.getItem("lang") || "tr";
  const dict = translations[lang];

  document.querySelectorAll(".i18n").forEach(el => {
    const key = el.getAttribute("data-msg");
    if (dict[key]) {
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", dict[key]);
      } else {
        el.textContent = dict[key];
      }
    }
  });
  const status = document.getElementById("statusMessage");
  if (status && status.dataset.msg) {
    status.textContent = dict[status.dataset.msg];
  }
}

function sanitizePart(part) {
  "use strict";
  return part.replace(/[<>:"/\\|?*]+/g, '').trim();
}

document.getElementById("downloadBtn").addEventListener("click", () => {
  "use strict";
  chrome.runtime.sendMessage({ action: "resetCancel" });
  disableButtons();
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressBar").textContent = "0%";
  updateStatus("status_started");
  document.getElementById("progressContainer").style.display = "block";
  const baseFolder = sanitizePart(document.getElementById("baseFolder").value.trim());
  const allRows = Array.from(document.querySelectorAll("#dataTable tbody tr"));

  const validRows = allRows.filter(row => {
    const cells = row.querySelectorAll("td");
    return cells.length >= 4 &&
      cells[1].innerText.trim() !== "" &&
      cells[2].innerText.trim() !== "" &&
      cells[3].innerText.trim() !== "";
  });
  let totalDownloads = validRows.length;

  document.getElementById("result").innerHTML = "";
  document.getElementById("progressContainer").style.display = "none";

  document.getElementById("totalCount").textContent = totalDownloads;

  validRows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const folder = sanitizePart(cells[1].innerText.trim());
    const filenameRaw = sanitizePart(cells[2].innerText.trim());
    const url = cells[3].innerText.trim();

    try {
      const _ = new URL(url);
    } catch (e) {
      document.getElementById("result").textContent = `Geçersiz URL: ${url}`;
      return;
    }

    const urlPath = new URL(url).pathname;
    const extension = urlPath.includes('.') ? urlPath.substring(urlPath.lastIndexOf('.')) : '';
    const filename = filenameRaw.endsWith(extension) ? filenameRaw : filenameRaw + extension;
    const fullPath = [baseFolder, folder, filename].filter(Boolean).join('/').replace(/\/{2}/g, '/');

    chrome.runtime.sendMessage({
      action: "enqueue",
      url,
      filename: fullPath,
      totalDownloads: totalDownloads
    }, response => {
      if (chrome.runtime.lastError) {
        console.warn("Yanıt alınamadı:", chrome.runtime.lastError.message);
        return;
      }

      if (response && response.success) {
        document.getElementById("progressContainer").style.display = "block";
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message) => {
  "use strict";
  if (message.action === "updateProgress") {
    const progressBar = document.getElementById("progressBar");
    const downloadedCount = document.getElementById("downloadedCount");
    const totalCount = document.getElementById("totalCount");

    if (progressBar && downloadedCount && totalCount) {
      progressBar.style.width = message.percentage + "%";
      progressBar.textContent = message.percentage + "%";
      downloadedCount.textContent = message.completed;
      totalCount.textContent = message.total;
    }

    if (message.completed === message.total) {
      updateStatus("status_completed");
      enableButtons();
    }
  }

  if (message.action === "cancelled") {
    updateStatus("status_cancelled");
    document.getElementById("clearTable").click();
    enableButtons();

    const progressBar = document.getElementById("progressBar");
    const downloadedCount = document.getElementById("downloadedCount");
    const totalCount = document.getElementById("totalCount");
    const result = document.getElementById("result");

    if (progressBar && downloadedCount && totalCount && result) {
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      downloadedCount.textContent = "0";
      totalCount.textContent = "0";
      document.getElementById("progressContainer").style.display = "none";
      result.innerHTML = "";
    }
  }
});

document.getElementById("addRow").addEventListener("click", () => {
  "use strict";
  const row = document.createElement("tr");

  const noCell = document.createElement("td");
  noCell.contentEditable = "false";
  row.appendChild(noCell);

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement("td");
    cell.contentEditable = "true";
    row.appendChild(cell);
  }

  document.getElementById("tableBody").appendChild(row);
  updateRowNumbers();
});

function updateRowNumbers() {
  "use strict";
  const rows = document.querySelectorAll("#tableBody tr");
  rows.forEach((row, index) => {
    const noCell = row.querySelector("td:first-child");
    if (noCell) {
      noCell.textContent = index + 1;
    }
  });
}

document.getElementById("clearTable").addEventListener("click", () => {
  "use strict";
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  const firstRow = document.createElement("tr");
  const noCell = document.createElement("td");
  noCell.contentEditable = "false";
  firstRow.appendChild(noCell);

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement("td");
    cell.contentEditable = "true";
    firstRow.appendChild(cell);
  }

  tbody.appendChild(firstRow);
  updateRowNumbers();
  document.getElementById("result").textContent = "";
});

document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const lang = localStorage.getItem("lang") || "tr";
  const theme = localStorage.getItem("theme") || "light";
  document.body.classList.add(theme);

  updateI18nTexts();

  document.getElementById("langSwitch").addEventListener("click", () => {
    const current = localStorage.getItem("lang") || "tr";
    const newLang = current === "tr" ? "en" : "tr";
    localStorage.setItem("lang", newLang);
    updateI18nTexts();
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    const current = document.body.classList.contains("dark") ? "dark" : "light";
    const newTheme = current === "dark" ? "light" : "dark";
    document.body.classList.remove(current);
    document.body.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  });

});

document.getElementById("dataTable").addEventListener("paste", function (e) {
  "use strict";
  e.preventDefault();

  const clipboardData = e.clipboardData.getData("text/plain");
  const rows = clipboardData.trim().split("\n").map(row => row.split("\t"));
  const tbody = document.getElementById("tableBody");

  const selection = window.getSelection();
  let currentCell = selection.anchorNode;
  while (currentCell && currentCell.nodeName !== "TD") {
    currentCell = currentCell.parentNode;
  }

  let currentRow = currentCell ? currentCell.parentNode : null;
  let startIndex = currentRow ? Array.from(tbody.children).indexOf(currentRow) : tbody.rows.length;

  rows.forEach((rowData, i) => {
    const newRow = document.createElement("tr");

    const noCell = document.createElement("td");
    noCell.contentEditable = "false";
    newRow.appendChild(noCell);

    rowData.forEach((val) => {
      const cell = document.createElement("td");
      cell.contentEditable = "true";
      cell.innerText = val.trim();
      newRow.appendChild(cell);
    });

    while (newRow.cells.length < 4) {
      const emptyCell = document.createElement("td");
      emptyCell.contentEditable = "true";
      newRow.appendChild(emptyCell);
    }

    if (tbody.rows[startIndex + i]) {
      tbody.replaceChild(newRow, tbody.rows[startIndex + i]);
    }
      else {
        tbody.appendChild(newRow);
      }
  });

  updateRowNumbers();

  const newRow = document.createElement("tr");
  const noCell = document.createElement("td");
  noCell.contentEditable = "false";
  newRow.appendChild(noCell);

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement("td");
    cell.contentEditable = "true";
    newRow.appendChild(cell);
  }

  tbody.appendChild(newRow);
  updateRowNumbers();
});


document.getElementById("contactBtn").addEventListener("click", () => {
  "use strict";
  const info = document.getElementById("contactInfo");
  info.style.display = info.style.display === "none" ? "inline" : "none";
});

document.getElementById("FilePathBtn").addEventListener("click", () => {
  "use strict";
  chrome.tabs.create({ url: "chrome://downloads/" });
});


function disableTableEditing() {
  "use strict";
  document.querySelectorAll("#dataTable td").forEach(cell => {
    cell.contentEditable = "false";
  });
}

function enableTableEditing() {
  "use strict";
  document.querySelectorAll("#dataTable td").forEach((cell, index) => {
    if (index % 4 !== 0) {
      cell.contentEditable = "true";
    }
  });
}

function disableButtons() {
  "use strict";
  document.getElementById("addRow").disabled = true;
  document.getElementById("clearTable").disabled = true;
  document.getElementById("downloadBtn").disabled = true;
  disableTableEditing();
}

function enableButtons() {
  "use strict";
  document.getElementById("addRow").disabled = false;
  document.getElementById("clearTable").disabled = false;
  document.getElementById("downloadBtn").disabled = false;
  enableTableEditing();
}

function updateStatus(key) {
  "use strict";
  const el = document.getElementById("statusMessage");
  const lang = localStorage.getItem("lang") || "tr";
  const dict = translations[lang];
  if (el && dict[key]) {
    el.textContent = dict[key];
    el.setAttribute("data-msg", key);
  }
}

document.getElementById("cancelBtn").addEventListener("click", () => {
  "use strict";
  chrome.runtime.sendMessage({ action: "cancelAll" });
});




