const translations = {
    tr: {
        title:"Öğrenci Atama Sistemi",
        langSwitch: "🌐 EN",
        contactBtn: "İletişim 📩",
        studentUpload: "Öğrenci Verilerini Yapıştırınız",
        quotaUpload: "Kontenjan Verilerini Yapıştırınız",
        addColumn: "Tercih Sütunu Ekle",
        removeColumn: "Tercih Sütunu Sil",
        assign: "Atama Yap",
        assignResult: "Atama Sonuçları",
        download: "Sonuçları İndir",
        reset: "Sıfırla",
        student: "Öğrenci",
        studentNumber: "Öğrenci No",
        score: "Puan",
        preferences: "Tercihler",
        place: "Yer",
        quota: "Kontenjan",
        assignedPlace: "Atanan Yer",
        col_1: "Tercih 1",
        col_2: "Tercih 2",
        col_3: "Tercih 3",
        col_4: "Tercih 4",
        col_5: "Tercih 5",
        col_6: "Tercih 6",
        col_7: "Tercih 7",
        col_8: "Tercih 8",
        col_9: "Tercih 9",
        col_10: "Tercih 10"

    },
    en: {
        title: "Student Assigment System",
        langSwitch: "🌐 TR",
        contactBtn: "Contact 📩",
        studentUpload: "Paste Student Data",
        quotaUpload: "Paste Quota Data",
        addColumn: "Add Preference Column",
        removeColumn: "Delete Preference Column",
        assign: "Assign",
        assignResult: "Assignment Results",
        download: "Download Results",
        reset: "Reset",
        student: "Student",
        studentNumber: "Student ID",
        score: "Score",
        preferences: "Preferences",
        place: "Place",
        quota: "Quota",
        assignedPlace: "Assigned Place",
        col_1: "Preference 1",
        col_2: "Preference 2",
        col_3: "Preference 3",
        col_4: "Preference 4",
        col_5: "Preference 5",
        col_6: "Preference 6",
        col_7: "Preference 7",
        col_8: "Preference 8",
        col_9: "Preference 9",
        col_10: "Preference 10"
    }
};

let students = [];
let quotas = {};

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

document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem("lang") || "tr";
    const theme = localStorage.getItem("theme") || "light";

    document.body.classList.add(lang, theme);
    updateI18nTexts();

    document.getElementById("langSwitch").addEventListener("click", () => {
        const currentLang = localStorage.getItem("lang") || "tr";
        const newLang = currentLang === "tr" ? "en" : "tr";
        localStorage.setItem("lang", newLang);
        document.body.classList.replace(currentLang, newLang);
        updateI18nTexts();
        updatePreferenceHeaders();
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
        const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.body.classList.replace(currentTheme, newTheme);
        localStorage.setItem("theme", newTheme);
        document.getElementById("themeToggle").textContent = newTheme === "dark" ? "🌞" : "🌙";
    });

});

document.getElementById("dataTable").addEventListener("paste", function(event) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('Text');

    if (!pastedText.includes('\t')) {
        alert("⚠️ Veriler uygun formatta değil. Excel'den kopyalayarak yapıştırınız.");
        event.preventDefault();
        return;
    }

    const rows = pastedText.trim().split('\n');
    const studentTableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    studentTableBody.innerHTML = "";

    rows.forEach(row => {
        const columns = row.split('\t');
        const newRow = studentTableBody.insertRow();
        columns.forEach(column => {
            const newCell = newRow.insertCell();
            newCell.textContent = column;
            newCell.contentEditable = true;
        });
    });

    event.preventDefault();
});

document.getElementById("quotaInput").addEventListener("paste", function(event) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('Text');

    if (!pastedText.includes('\t')) {
        alert("⚠️ Kontenjan verileri uygun formatta değil. Excel'den kopyalayarak yapıştırınız.");
        event.preventDefault();
        return;
    }

    const rows = pastedText.trim().split('\n');
    const quotaTableBody = document.getElementById('quotaInput').getElementsByTagName('tbody')[0];
    quotaTableBody.innerHTML = "";

    quotas = {};
    rows.forEach(row => {
        const [place, countStr] = row.split('\t');
        const count = parseInt(countStr);
        if (place && !isNaN(count)) {
            quotas[place] = count;
            const newRow = quotaTableBody.insertRow();
            const cell1 = newRow.insertCell();
            cell1.textContent = place;
            cell1.contentEditable = true;
            const cell2 = newRow.insertCell();
            cell2.textContent = count;
            cell2.contentEditable = true;
        }
    });

    event.preventDefault();

    if (students.length > 0) {
        document.getElementById("tablesContainer").style.display = "block";
    }
});

document.getElementById("addColumn").addEventListener("click", () => {
  const headerRow = document.querySelector("#dataTable thead tr");
  const rows = document.querySelectorAll("#dataTable tbody tr");

  const currentPreferenceCount = headerRow.children.length - 2; 
  const newPreferenceNumber = currentPreferenceCount + 1;

  const lang = localStorage.getItem("lang") || "tr";

  const newHeaderCell = document.createElement("th");
  newHeaderCell.setAttribute("data-pref", newPreferenceNumber);
  newHeaderCell.textContent = lang === "en"
    ? `Preference ${newPreferenceNumber}`
    : `Tercih ${newPreferenceNumber}`;
  headerRow.appendChild(newHeaderCell);

  rows.forEach(row => {
    const newCell = document.createElement("td");
    newCell.contentEditable = "true";
    row.appendChild(newCell);
  });
});

function updatePreferenceHeaders() {
  const lang = localStorage.getItem("lang") || "tr";
  const headers = document.querySelectorAll("#dataTable thead th[data-pref]");
  headers.forEach(th => {
    const number = th.getAttribute("data-pref");
    th.textContent = lang === "en"
      ? `Preference ${number}`
      : `Tercih ${number}`;
  });
}

document.getElementById("clearTable").addEventListener("click", () => {
    students = [];
    quotas = [];

    const studentTableBody = document.querySelector("#dataTable tbody");
    studentTableBody.innerHTML = "";
    const studentHeaderCells = document.querySelectorAll("#dataTable thead th").length;
    const emptyStudentRow = studentTableBody.insertRow();
    for (let i = 0; i < studentHeaderCells; i++) {
        const cell = emptyStudentRow.insertCell();
        cell.contentEditable = true;
    }

    const quotaTableBody = document.querySelector("#quotaInput tbody");
    quotaTableBody.innerHTML = "";
    const emptyQuotaRow = quotaTableBody.insertRow();
    for (let i = 0; i < 2; i++) {
        const cell = emptyQuotaRow.insertCell();
        cell.contentEditable = true;
    }

    document.getElementById("studentInputContainer").style.display = "block";
    document.getElementById("quotaInputContainer").style.display = "block";
    results = [];
    const resultsTableBody = document.querySelector("#resultsTable tbody");
    resultsTableBody.innerHTML = "";
    document.getElementById("assignResultTittle").style.display = "none";
    document.getElementById("resultsTableContainer").style.display = "none";
    document.getElementById("downloadButton").style.display = "none";
});

document.getElementById("assignButton").addEventListener("click", assignStudents);
document.getElementById("downloadButton").addEventListener("click", downloadResult);
let results = [];
function assignStudents() {
    results = [];

    const quotasCopy = {};
    const quotaRows = document.querySelectorAll("#quotaInput tbody tr");
    quotaRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
            const place = cells[0].textContent.trim();
            const count = parseInt(cells[1].textContent.trim());
            if (place && !isNaN(count)) {
                quotasCopy[place] = count;
            }
        }
    });

    const studentRows = document.querySelectorAll("#dataTable tbody tr");
    studentRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 2) return;

        const name = cells[0].textContent.trim();
        const score = parseFloat(cells[1].textContent.trim());

        const preferences = [];
        for (let i = 2; i < cells.length; i++) {
            const pref = cells[i].textContent.trim();
            if (pref) preferences.push(pref);
        }

        if (name && !isNaN(score)) {
            students.push({ name, score, preferences });
        }
    });

    students.sort((a, b) => b.score - a.score);

    students.forEach(student => {
        let placed = false;
        for (const choice of student.preferences) {
            if (quotasCopy[choice] && quotasCopy[choice] > 0) {
                quotasCopy[choice]--;
                results.push([student.name, student.score, choice]);
                placed = true;
                break;
            }
        }
        if (!placed) {
            results.push([student.name, student.score, "Atama Yapılamadı"]);
        }
    });

    updateList("resultsTable", results);
    document.getElementById("assignResultTittle").style.display = "block";
    document.getElementById("resultsTableContainer").style.display = "block";
    document.getElementById("downloadButton").style.display = "inline-block";
}

function downloadResult() {
    if (results.length === 0) {
        alert("Önce atama yapmalısınız!");
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([["Ad", "Puan", "Atanan Yer"], ...results]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, "Atamalar");
    XLSX.writeFile(wb, "atama_sonuclari.xlsx");
}

function updateList(id, items) {
    const tableBody = document.getElementById(id).querySelector("tbody");
    tableBody.innerHTML = "";

    items.forEach(item => {
        const row = document.createElement("tr");
        item.forEach(cellData => {
            const td = document.createElement("td");
            td.textContent = cellData;
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}

function updateRowNumbers() {
  const rows = document.querySelectorAll("#tableBody tr");
  rows.forEach((row, index) => {
    const noCell = row.querySelector("td:first-child");
    if (noCell) {
      noCell.textContent = index + 1;
    }
  });
}

document.getElementById("contactBtn").addEventListener("click", () => {
    const info = document.getElementById("contactInfo");
    info.style.display = info.style.display === "none" ? "inline" : "none";
});

document.getElementById("removeColumn").addEventListener("click", () => {
    const table = document.getElementById("dataTable"); 
    const headerRow = table.querySelector("thead tr"); 

    const headerCells = headerRow.querySelectorAll("th");
    if (headerCells.length > 1) {  
        headerCells[headerCells.length - 1].remove(); 
    }

    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length > 1) { 
            cells[cells.length - 1].remove(); 
        }
    });
});

