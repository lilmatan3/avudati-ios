import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/+esm';
import { amProjectsDictionary } from "./amProjectsDictionary.js";
import { payslipTypeTriggers } from "./payslipTypeTriggers.js";

// 🏷️ תרגום סוגים לתצוגה יפה עם אייקונים
const payslipDisplayNames = {
  "עובדי הוראה": "🧑‍🏫 עובד הוראה",
  "עובדי שירות": "🛎️ עובד שירות",
  "עובדי ציבור": "🧑‍💼 עובד ציבור",
  "AM PROJECTS": "🏗️ עובד פרויקט / קבלן"
};

// 🌐 מיפוי לעמודים לפי סוג התלוש
const payslipRedirectPages = {
  "עובדי הוראה": "education-employee.html",
  "עובדי שירות": "service-employee.html",
  "עובדי ציבור": "public-employee.html",
  "AM PROJECTS": "contractor-employee.html",
  "עובד הוראה": "education-employee.html",
  "עובד שירות": "service-employee.html",
  "עובד ציבור": "public-employee.html",
  "מוסד ציבורי / חילן": "public-employee.html"  // ✅ זה מה שהיה חסר
};


function normalize(text) {
  return text.replace(/["'׳״'.:/\\]+/g, '').replace(/\s+/g, '').toLowerCase();
}

function findMatchesInLineItems(items, dictionary) {
  const matches = new Set();
  for (const item of items) {
    const normText = normalize(item.text);
    if (!normText || normText.length < 2) continue;
    for (const entry of dictionary) {
      for (const syn of entry.synonyms) {
        if (normText === normalize(syn)) {
          matches.add(entry.label);
        }
      }
    }
  }
  return [...matches];
}

function groupByYLine(items) {
  const lines = {};
  for (const item of items) {
    const yKey = Math.round(item.y);
    if (!lines[yKey]) lines[yKey] = [];
    lines[yKey].push(item);
  }
  return Object.values(lines).map(line => ({
    text: line.map(i => i.text).join(" "),
    items: line
  }));
}

function detectPayslipType(foundLabels) {
  const normalizedLabels = Array.from(foundLabels).map(normalize);
  const matches = [];

  for (const typeGroup of payslipTypeTriggers) {
    let count = 0;
    for (const trigger of typeGroup.triggers) {
      if (normalizedLabels.includes(normalize(trigger))) {
        count++;
      }
    }
    if (count >= typeGroup.minMatches) {
      matches.push({ type: typeGroup.type, count, required: typeGroup.minMatches });
    }
  }

  return matches.sort((a, b) => b.count - a.count)[0] || null;
}

function displayExtractedData(labels, typeResult = null) {
  const container = document.getElementById("tables-container");
  container.innerHTML = "";
  container.style.display = "none";

  if (typeResult) {
    const displayName = payslipDisplayNames[typeResult.type] || typeResult.type;
    const div = document.createElement("div");
    div.innerHTML = `
      <h2>🚀 סוג תלוש שזוהה: ${displayName}</h2>
      <p>התאמות שנמצאו: ${typeResult.count} מתוך ${typeResult.required} נדרשות</p>
    `;
    container.appendChild(div);
  }

  const table = document.createElement("table");
  table.innerHTML = `<tr><th>רכיב</th></tr>`;
  labels.forEach(label => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${label}</td>`;
    table.appendChild(row);
  });
  container.appendChild(table);
}

async function extractTextItemsFromPDF(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const pdfjsLib = window["pdfjsLib"];
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  return content.items.map(item => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5]
  }));
}

async function extractTextItemsFromImage(blob) {
  const imageUrl = URL.createObjectURL(blob);
  const { data: ocr } = await Tesseract.recognize(imageUrl, 'heb');
  return ocr.words.map(word => ({
    text: word.text,
    x: word.bbox.x0,
    y: word.bbox.y0
  }));
}

function showPayslipTypePrompt(typeResult) {
  const box = document.getElementById("payslip-type-confirmation");
  const typeText = document.getElementById("type-detected-text");
  box.style.display = "block";

  const displayName = payslipDisplayNames[typeResult.type] || typeResult.type;
  typeText.textContent = `🧐 זוהה סוג תלוש: ${displayName}`;

  document.getElementById("confirm-yes").onclick = () => {
    const matchKey = Object.keys(payslipRedirectPages).find(key =>
      normalize(typeResult.type).includes(normalize(key))
    );
    const targetPage = matchKey ? payslipRedirectPages[matchKey] : null;

    if (targetPage) {
      window.location.href = targetPage;
    } else {
      alert("⚠️ לא נמצא עמוד מתאים לסוג התלוש.");
    }
  };

  document.getElementById("confirm-no").onclick = () => {
    document.getElementById("manual-type-options").style.display = "block";
  };

  document.querySelectorAll(".type-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosenType = btn.dataset.type;
      const targetPage = payslipRedirectPages[chosenType];
      if (targetPage) {
        window.location.href = targetPage;
      } else {
        alert("⚠️ לא נמצא עמוד מתאים לסוג התלוש.");
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("selectedPayslipId");
  const type = localStorage.getItem("selectedPayslipType");
  if (!id || !type) return alert("לא נבחר קובץ.");

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly").objectStore("payslips").get(Number(id));
  if (!item) return alert("תלוש לא נמצא במאגר.");

  const blob = new Blob([item.data], {
    type: item.mimeType || (type === "pdf" ? "application/pdf" : "image/png")
  });

  let items = [];
  if (type === "pdf") {
    items = await extractTextItemsFromPDF(blob);
  } else if (type === "image") {
    items = await extractTextItemsFromImage(blob);
  }

  const lines = groupByYLine(items);
  const foundLabels = new Set();

  for (const line of lines) {
    const matches = findMatchesInLineItems(line.items, amProjectsDictionary);
    matches.forEach(label => foundLabels.add(label));
  }

  const typeResult = detectPayslipType(foundLabels);

  if (typeResult) {
    showPayslipTypePrompt(typeResult);
  } else {
    const box = document.getElementById("payslip-type-confirmation");
    const typeText = document.getElementById("type-detected-text");
    box.style.display = "block";
    typeText.textContent = "❌ לא זוהה סוג התלוש. אנא בחר את סוג התלוש שלך:";

    document.querySelector(".confirm-buttons").style.display = "none";
    document.getElementById("manual-type-options").style.display = "block";

    document.querySelectorAll(".type-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const chosenType = btn.dataset.type;
        const targetPage = payslipRedirectPages[chosenType];
        if (targetPage) {
          window.location.href = targetPage;
        } else {
          alert("⚠️ לא נמצא עמוד מתאים לסוג התלוש.");
        }
      });
    });
  }

  displayExtractedData([...foundLabels], typeResult);
});
