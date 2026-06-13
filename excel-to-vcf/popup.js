const translations = {
  tr: {
    langSwitch: "🌐 EN",
    contactBtn: "📩 İletişim",
    app_title: "VCF Oluştur",
    note_text: "Sadece 'Görünen Ad' ve 'Mobil' bilgilerinin doldurulması yeterlidir.",
    fileName: "Dosya Adı",
    add_row: "Satır Ekle",
    clear_table: "Tümünü Temizle",
    expand: "Genişlet",
    shrink: "Daralt",
    generate: "VCF Oluştur",
    col_name: "Adı",
    col_surname: "Soyadı",
    col_display: "Görünen Ad",
    col_mobile: "Mobil",
    col_work: "İş Tel",
    col_home: "Ev Tel",
    col_fax: "Fax",
    col_email: "Mail",
    col_address: "Adres",
    col_company: "Firma",
    col_title: "Unvan",
    col_website: "Website"
  },
  en: {
    langSwitch: "🌐 TR",
    contactBtn: "📩 Contact",
    app_title: "Generate VCF",
    note_text: "Only 'Display Name' and 'Mobile' fields are required.",
    fileName: "File Name",
    add_row: "Add Row",
    clear_table: "Clear All",
    expand: "Expand",
    shrink: "Shrink",
    generate: "Generate VCF",
    col_name: "First Name",
    col_surname: "Last Name",
    col_display: "Display Name",
    col_mobile: "Mobile",
    col_work: "Work Phone",
    col_home: "Home Phone",
    col_fax: "Fax",
    col_email: "Email",
    col_address: "Address",
    col_company: "Company",
    col_title: "Title",
    col_website: "Website"
  }
};

document.addEventListener("DOMContentLoaded", () => {
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

document.getElementById("expandBtn").addEventListener("click", () => {
  document.body.style.width = "750px";
  document.body.style.height = "250";
});

document.getElementById("shrinkBtn").addEventListener("click", () => {
  document.body.style.width = "400px";
  document.body.style.height = "250";
});

  document.getElementById("addRow").addEventListener("click", () => {
    const row = document.createElement("tr");
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement("td");
      cell.contentEditable = "true";
      row.appendChild(cell);
    }
    document.getElementById("tableBody").appendChild(row);
  });

  document.getElementById("clearTable").addEventListener("click", () => {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    const firstRow = document.createElement("tr");
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement("td");
      cell.contentEditable = "true";
      firstRow.appendChild(cell);
    }
    tbody.appendChild(firstRow);
    document.getElementById("result").textContent = "";
  });

  document.getElementById("sendBtn").addEventListener("click", () => {
    const fileName = document.getElementById("fileName").value.trim() || `rehber_${new Date().toISOString().split("T")[0]}`;
    const rows = document.querySelectorAll("#tableBody tr");
    const tableData = [];

    rows.forEach(row => {
      const cells = Array.from(row.children);
      const rowData = cells.map(cell => cell.innerText.trim());
      if (rowData.some(val => val !== "")) {
        tableData.push(rowData);
      }
    });

    if (!tableData.length) {
      alert("Lütfen tabloya veri girin.");
      return;
    }

    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];
      if (!row[2] || !row[3]) {
        alert(`Satır ${i + 1}: 'Görünen Ad' ve 'Mobil' alanları zorunludur.`);
        return;
      }
    }

    const vcfContent = generateVCF(tableData);
    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.vcf`;
    a.click();
    URL.revokeObjectURL(url);

    document.getElementById("result").textContent = "VCF dosyası indirildi.";
  });

  document.getElementById("dataTable").addEventListener("paste", function (e) {
    const active = document.activeElement;
    if (active.tagName !== "TD") return;

    e.preventDefault();
    const clipboardData = e.clipboardData.getData("text/plain");

    const rows = clipboardData.trim().split("\n").map(row => row.split("\t"));
    const startRow = active.parentElement.rowIndex - 1;
    const startCol = active.cellIndex;

    const tbody = document.getElementById("tableBody");

    rows.forEach((rowData, i) => {
      let row = tbody.rows[startRow + i];
      if (!row) {
        row = document.createElement("tr");
        for (let j = 0; j < 12; j++) {
          const cell = document.createElement("td");
          cell.contentEditable = "true";
          row.appendChild(cell);
        }
        tbody.appendChild(row);
      }

      rowData.forEach((val, j) => {
        const cell = row.cells[startCol + j];
        if (cell) cell.innerText = val.trim();
      });
    });
  });
});

function updateI18nTexts() {
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
}
document.getElementById("contactBtn").addEventListener("click", () => {
  const info = document.getElementById("contactInfo");
  info.style.display = info.style.display === "none" ? "inline" : "none";
});

function generateVCF(data) {
  let vcfText = "";
  data.forEach(row => {
    vcfText += "BEGIN:VCARD\n";
    vcfText += "VERSION:3.0\n";
    vcfText += `N:${row[1] || ""};${row[0] || ""};;;\n`;
    vcfText += `FN:${row[2] || ""}\n`;
    vcfText += `TEL;TYPE=MOBILE:${row[3] || ""}\n`;
    vcfText += `TEL;TYPE=WORK:${row[4] || ""}\n`;
    vcfText += `TEL;TYPE=HOME:${row[5] || ""}\n`;
    vcfText += `TEL;TYPE=FAX:${row[6] || ""}\n`;
    vcfText += `EMAIL:${row[7] || ""}\n`;
    vcfText += `ADR:${row[8] || ""}\n`;
    vcfText += `ORG:${row[9] || ""}\n`;
    vcfText += `TITLE:${row[10] || ""}\n`;
    vcfText += `URL:${row[11] || ""}\n`;
    vcfText += "END:VCARD\n";
  });
  return vcfText;
}
