const translations = {
  tr: {
    title: "PDF Sayfa & Kelime Sayacı",
    note1: "Sayfa sayacı %100 doğrulukla çalışır.",
    note2: "Kelime sayacı %95 doğrulukla çalışır.",
    langSwitch: "🌐 EN",
    analyze: "📊 Analiz Et",
    download: "⬇️ Excel İndir",
    clear: "🧹 Temizle",
    counter: "Girilen Link: {total} | Analiz edilen: {analyzed}",
    loading: "Yükleniyor",
    error: "Hata",
    url: "PDF URL",
    pages: "Sayfa Sayısı",
    words: "Kelime Sayısı",
    pastePlaceholder: "Excel'den PDF URL'lerini buraya yapıştırın..."
  },
  en: {
    title: "PDF Page & Word Counter",
    note1: "The page counter is 100% accurate.",
    note2: "The word counter is 95% accurate.",
    langSwitch: "🌐 TR",
    analyze: "📊 Analyze",
    download: "⬇️ Download Excel",
    clear: "🧹 Clear",
    counter: "Total URLs: {total} | Analyzed: {analyzed}",
    loading: "Loading",
    error: "Error",
    url: "PDF URL",
    pages: "Page Count",
    words: "Word Count",
    pastePlaceholder: "Paste PDF URLs from Excel here..."
  }
};

document.addEventListener("DOMContentLoaded", () => {
    const pasteArea = document.getElementById("pasteArea");
    const analyzeButton = document.getElementById("analyzeButton");
    const downloadButton = document.getElementById("downloadButton");
    const clearButton = document.getElementById("clearButton"); 
    const resultsTable = document.getElementById("resultsTable").getElementsByTagName("tbody")[0];
    let results = [];

    function updateResultsInfo(total, analyzed) {
      const infoEl = document.getElementById("resultsInfo");
      const template = translations[currentLang].counter;
      infoEl.textContent = template
        .replace("{total}", total)
        .replace("{analyzed}", analyzed);
    }

    pasteArea.addEventListener("paste", (event) => {
      event.preventDefault();

      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData("Text");

      const newUrls = pastedText
        .split(/[\r\n]+/)
        .map(u => u.trim())
        .filter(u => u.startsWith("http"));

      if (newUrls.length === 0) return;

      const existingText = pasteArea.value.trim();
      const combinedText = [existingText, ...newUrls].filter(Boolean).join("\n");

      pasteArea.value = combinedText;

      analyzeButton.disabled = false;
      clearButton.disabled = false;
      downloadButton.disabled = true;
      updateResultsInfo(combinedText.split(/[\r\n]+/).filter(Boolean).length, 0);
    });



    analyzeButton.addEventListener("click", async () => {
      results = [];

      const urls = pasteArea.value
        .split(/[\r\n]+/)
        .map(u => u.trim())
        .filter(Boolean);

      while (resultsTable.firstChild) {
        resultsTable.removeChild(resultsTable.firstChild);
      }
      document.getElementById("resultsContainer").style.display = "block";

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          const row = resultsTable.insertRow();
          row.insertCell().textContent = url;

          if (!url.toLowerCase().match(/\.pdf(\?.*)?$/)) {
            row.insertCell().textContent = translations[currentLang].error;
            row.insertCell().textContent = translations[currentLang].error;
            row.style.color = "red";
            results.push([url, translations[currentLang].error, translations[currentLang].error]);
            updateResultsInfo(urls.length, i + 1);
            continue;
          }

          row.insertCell().textContent = translations[currentLang].loading;
          row.insertCell().textContent = "";

          try {
            const res = await fetch(url);
            if (!res.ok || res.status === 0) throw new Error(`HTTP ${res.status}`);

            const buf = await res.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

            const numPages = pdf.numPages;
            let textContent = "";

            for (let j = 1; j <= numPages; j++) {
              const page = await pdf.getPage(j);
              const content = await page.getTextContent();
              const pageText = content.items
                .map(item => item.str)
                .filter(Boolean)
                .join(" ");
              textContent += " " + pageText;
            }

            const cleanText = textContent
              .replace(/[\r\n]+/g, " ")
              .replace(/\s+/g, " ")
              .trim();

            const wordMatches = cleanText.match(/\b[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*\b/gu);
            const wordCount = wordMatches ? wordMatches.length : 0;

            row.cells[1].textContent = numPages;
            row.cells[2].textContent = wordCount;
            results.push([url, numPages, wordCount]);
          } catch (error) {
            console.error(`PDF işlenemedi: ${url}`, error);

            row.cells[1].textContent = translations[currentLang].error;
            row.cells[2].textContent = translations[currentLang].error;
            row.style.color = "red";
            results.push([url, translations[currentLang].error, translations[currentLang].error]);

            if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
              console.warn(`CORS veya ağ hatası olabilir: ${url}`);
            }
          }

          updateResultsInfo(urls.length, i + 1);
        }


      downloadButton.disabled = false;
    });

    downloadButton.addEventListener("click", () => {
      const headers = currentLang === "tr"
        ? ["Dosya URL", "Sayfa Sayısı", "Kelime Sayısı"]
        : ["Document URL", "Page Count", "Word Count"];
      const worksheet = XLSX.utils.aoa_to_sheet([
        headers,
        ...results
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet, "PDF Sayacı Raporu");
      const today = new Date().toISOString().split("T")[0];
      const filename = currentLang === "tr"
        ? `sayac_raporu_${today}.xlsx`
        : `counter_report_${today}.xlsx`;
      XLSX.writeFile(wb, filename);
    });


    clearButton.addEventListener("click", () => {
        pasteArea.value = "";

        while (resultsTable.firstChild) {
            resultsTable.removeChild(resultsTable.firstChild);
        }
        document.getElementById("resultsTable").getElementsByTagName("tbody")[0].innerHTML = "";
        document.getElementById("resultsContainer").style.display = "none";

        results = [];
        analyzeButton.disabled = true;
        downloadButton.disabled = true;
        clearButton.disabled = true;
        updateResultsInfo(0, 0);

    });
});

let currentLang = "tr";

function updateTexts() {
  const elements = document.querySelectorAll("[data-msg]");
  elements.forEach(el => {
    const key = el.getAttribute("data-msg");
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

    const counterEl = document.querySelector("[data-msg-dynamic='counter']");
  if (counterEl) {
    const currentText = counterEl.textContent;
    const countMatch = currentText.match(/\d+/);
    const count = countMatch ? countMatch[0] : "0";
    const newText = translations[currentLang]["counter"].replace("{total}", 0).replace("{analyzed}", 0);
    counterEl.textContent = newText;
  }

  const area = document.querySelector("[data-msg-placeholder]");
  if (area) {
    const key = area.getAttribute("data-msg-placeholder");
    area.placeholder = translations[currentLang][key];
  }
}

document.getElementById("langSwitch").addEventListener("click", () => {
  currentLang = currentLang === "tr" ? "en" : "tr";
  updateTexts();
});
