let isAutomationStopped = false; 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stop_automation") {
        isAutomationStopped = true;
        console.log("Durdurma emri alındı. İşlem kesiliyor.");
        return true; 
    }
});
async function waitForElement(xpath, maxTries = 10, delay = 500) {
 return new Promise((resolve, reject) => {
  let tries = 0;
  function search() {
   const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
   if (el) resolve(el);
   else if (++tries < maxTries) setTimeout(search, delay);
   else reject(`Element not found: ${xpath}`);
  }
  search();
 });
}

function sleep(ms) {
 return new Promise(resolve => setTimeout(resolve, ms));
}
function setStorage(data) {
 return new Promise((resolve) => {
  chrome.storage.local.set(data, () => resolve());
 });
}

function removeStorage(keys) {
 return new Promise((resolve) => {
  chrome.storage.local.remove(keys, () => resolve());
 });
}

function getStorageData(keys) {
 return new Promise((resolve) => {
  chrome.storage.local.get(keys, (result) => resolve(result));
 });
}

async function applyXPathActions(xpathCommands, startIndex = 0) {
  if (!Array.isArray(xpathCommands)) {
    console.error("applyXPathActions: XPath komut listesi geçersiz!", xpathCommands);
    return;
  }

  for (let i = startIndex; i < xpathCommands.length; i++) {
    if (isAutomationStopped) break; 
    const cmd = xpathCommands[i];
    let isClickCommand = false;
    try {
      chrome.runtime.sendMessage({
      type: "commandProgress",
      command: cmd,
      index: i});

      if (cmd.startsWith("*wait=")) {
        const sec = parseInt(cmd.replace("*wait=", "").trim());
        if (!isNaN(sec) && sec > 0) {
          await sleep(sec * 1000);
        }
      }

      else if (cmd.startsWith("*enter=")) {
        const xpath = cmd.replace("*enter=", "").trim();
        const el = await waitForElement(xpath);

        el.focus();
        ['keydown','keypress','keyup'].forEach(type => {
            el.dispatchEvent(new KeyboardEvent(type, { key: "Enter", bubbles: true }));
        });
        await setStorage({ commandIndex: i + 1 });
        const form = el.closest("form");
        if (form) {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            form.submit();
            
        }
      }

      else if (cmd.startsWith("*delete=")) {
        const xpath = cmd.replace("*delete=", "").trim();
        const el = await waitForElement(xpath);
        el.focus();
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }

      else if (cmd.includes("**=")) {
        const [xpath, value] = cmd.split("**=");
        const el = await waitForElement(xpath.trim());
        el.focus();
        el.value = value.trim();
        el.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(500);
      }

      else if (cmd === "*down") {
        window.scrollBy({
            top: 100, 
            behavior: "smooth"
        });
        await sleep(500);
      }

      else if (cmd === "*qdown") {
        for (let i = 0; i < 5; i++) {
          window.scrollBy({
              top: 100, 
              behavior: "smooth"
          });
          await sleep(100);
        }
      }

      else if (cmd === "*up") {
        window.scrollBy({
          top: -100,
          behavior: "smooth"
        });
        await sleep(500);
      }

      else if (cmd === "*right") {
        window.scrollBy({
          left: 100,
          behavior: "smooth"
        });
        await sleep(500);
      }

      else if (cmd === "*left") {
        window.scrollBy({
          left: -100,
          behavior: "smooth"
        });
        await sleep(500);
      }

      else {
        isClickCommand = true; 
        const el = await waitForElement(cmd.trim());
        el.scrollIntoView({ behavior: "smooth" });

        await setStorage({ commandIndex: i + 1 });
        chrome.runtime.sendMessage({ type: "commandDone", command: cmd, index: i });
        
        el.click();
        console.log(`Tıklandı: ${cmd}`);
        
        await sleep(1000);
      }

      if (isAutomationStopped) break;

      if (!isClickCommand) {
        chrome.runtime.sendMessage({
          type: "commandDone",
          command: cmd,
          index: i
        });
      }

    } catch (e) {
      chrome.runtime.sendMessage({
      type: "commandError",
      command: cmd,
      index: i  });
        
      isAutomationStopped = true;
      await removeStorage(['urls', 'xpaths', 'currentIndex', 'commandIndex']); 
    }
    
  }
  if (isAutomationStopped) {return;}
  await removeStorage(['commandIndex']); 
}

(async function () {
 try {
  const { urls, xpaths, currentIndex = 0, commandIndex = 0 } = await getStorageData(['urls', 'xpaths', 'currentIndex', 'commandIndex']);

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
   console.log("URL listesi boş veya tanımsız!");
   return;
  }

  if (!Array.isArray(xpaths) || xpaths.length === 0) {
   console.log("XPath listesi boş veya tanımsız!");
   return;
  }
  
  isAutomationStopped = false;
  chrome.runtime.sendMessage({
      type: "progress",
      current: currentIndex + 1,
      total: urls.length
    });

  await applyXPathActions(xpaths, commandIndex); 
  if (!isAutomationStopped) {
    if (currentIndex < urls.length - 1) {
    await setStorage({ currentIndex: currentIndex + 1 });
    window.location.href = urls[currentIndex + 1];
    } else {
    chrome.runtime.sendMessage({ type: "done" });
    await removeStorage(['urls', 'xpaths', 'currentIndex']);
    }
  }

 } catch (error) {
  console.error("Ana işlemde hata:", error);
  chrome.runtime.sendMessage({
    type: "error",
    message: error.toString(),
    currentIndex: currentIndex + 1,
    total: urls.length,
  });
 }

})();