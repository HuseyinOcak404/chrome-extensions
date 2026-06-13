document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById("helpModal");
  const infoBtn = document.getElementById("infoButton");
  const closeBtn = modal.querySelector(".close");

  infoBtn.onclick = () => modal.style.display = "block";
  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
  }
  modal.querySelector(".modal-content").onclick = (e) => e.stopPropagation();

  const table = document.getElementById('urlPasteTable');
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach((row, rowIndex) => {
  const cell = row.cells[0];
  cell.addEventListener('paste', (event) => {
   event.preventDefault();
   const pastedText = (event.clipboardData || window.clipboardData).getData('text');
   const lines = pastedText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line);

   lines.forEach((line, i) => {
    if (rowIndex + i < rows.length) {
     rows[rowIndex + i].cells[0].textContent = line;
    } else {
     const newRow = table.insertRow();
     const newCell = newRow.insertCell();
     newCell.contentEditable = "true";
     newCell.textContent = line;
    }
   });
  });
 });

document.getElementById('runBtn').addEventListener('click', () => {
  const textarea = document.getElementById('xpathInput');
  const scheduleInput = document.getElementById('scheduleTime');
  const statusContainer = document.getElementById("xpathStatusContainer");
  statusContainer.innerHTML = ""; 

  const xpathList = textarea.value
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

  xpathList.forEach((cmd, index) => {
    const cleanedCmd = cmd.replace(/"/g, "'");
    const line = document.createElement("div");
    line.textContent = cmd;
    line.dataset.cmd = cleanedCmd;
    line.dataset.index = index;   
    line.style.padding = "2px 5px";
    statusContainer.appendChild(line);
  });

  const tableRows = document.querySelectorAll('#urlPasteTable tbody tr');
  const urlList = Array.from(tableRows)
  .map(row => row.cells[0].textContent.trim())
  .filter(url => url.length > 0);


  if (xpathList.length === 0) {
   alert('Lütfen en az bir XPath komutu girin.');
   return;
  }

  if (urlList.length === 0) {
   alert('Lütfen en az bir URL girin.');
   return;
  }

  const scheduleTime = scheduleInput.value;
  let delayInMs = 0; 

  if (scheduleTime) {
      const scheduledTime = new Date(scheduleTime);
      const now = new Date();
      delayInMs = scheduledTime.getTime() - now.getTime();

      if (delayInMs > 0) {
          alert(`XPath komutları ${scheduledTime.toLocaleString()} tarihinde uygulanacak.`);
      } else {
          alert('Girilen tarih/saat geçmişte. Komutlar hemen uygulanacak.');
          delayInMs = 0;
      }
  }

  chrome.storage.local.set({ 
      urls: urlList, 
      xpaths: xpathList, 
      currentIndex: 0 
  }, () => {
      
      if (delayInMs > 0) {
        const delayInMinutes = Math.ceil(delayInMs / (1000 * 60)); // Gecikmeyi Dakikaya yuvarla
        const scheduledTime = Date.now() + delayInMs; // Tam zamanı milisaniye cinsinden kaydet
        
        chrome.alarms.create('xpath_scheduler', {
            when: scheduledTime 
        });
      } else {
          chrome.tabs.create({ url: urlList[0] });
      }
  });
 });

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.alarms.clear('xpath_scheduler', (wasCleared) => {
      if (wasCleared) {
          console.log("Zamanlanmış alarm temizlendi.");
      }
  });

  chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
              action: "stop_automation" 
          }, (response) => {
                if (chrome.runtime.lastError) {
                }
          });
      });
  });

  chrome.storage.local.remove(['urls', 'xpaths', 'currentIndex'], () => {
  });
});

 chrome.runtime.onMessage.addListener((message) => {
  const progressSpan = document.getElementById("commandProgressStatus");
    if (!progressSpan) return; // Element yoksa fonksiyonu sonlandır

  const xpathContainer = document.getElementById("xpathStatusContainer");
  const totalCommands = xpathContainer ? xpathContainer.children.length : 0;
  if (message.type === "progress") {
    const statusBox = document.getElementById("statusBox");
    statusBox.textContent = `Link ${message.current}/${message.total} işleniyor`;
  }
  if (message.type === "done") {
    const statusBox = document.getElementById("statusBox");
    statusBox.textContent = "Tüm linkler işlendi";
  }
  if (message.type === "error") {
    const statusBox = document.getElementById("statusBox");
    statusBox.textContent = `Link ${message.current}/${message.total}<br>Hata: ${message.message}`;
  }
  if (message.type === "commandProgress") {
    highlightXPath(message.command, "running", message.index);
    progressSpan.textContent = `(${message.index + 1}/${totalCommands})`;
  }
  if (message.type === "commandError") {
    highlightXPath(message.command, "error", message.index);
    progressSpan.textContent = `(${message.index + 1}/${totalCommands})`;
  }
  if (message.type === "commandDone") {
    highlightXPath(message.command, "done", message.index);
    if (message.index < totalCommands - 1) {
             progressSpan.textContent = `(${message.index + 2}/${totalCommands})`;
        } else {
             progressSpan.textContent = ""; 
        }
  }
  if (message.action === "stop_automation" && isAutomationRunning) {
        const progressSpan = document.getElementById("commandProgressStatus");
        if (progressSpan) progressSpan.textContent = "DURDURULDU";
        
    }
});
 function highlightXPath(cmd, status, index) {
  const container = document.getElementById("xpathStatusContainer");
  const cleanedCmd = cmd.replace(/"/g, "'"); 
  const el = container.querySelector(`[data-cmd="${cleanedCmd}"][data-index="${index}"]`);

  if (!el) return;

  if (status === "running") {
    el.style.backgroundColor = "#ffeb3b"; 
    el.style.color = "#000";
  } else if (status === "error") {
    el.style.backgroundColor = "#f44336"; 
    el.style.color = "#fff";
  } else if (status === "done") {
    el.style.backgroundColor = "#4caf50"; 
    el.style.color = "#fff";
  }
}
});