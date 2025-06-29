import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/+esm';
import { amProjectsDictionary } from "./amProjectsDictionary.js";
import { cleaningPayslipDictionary } from "./cleaningPayslipDictionary.js";
import { teacherPayslipDictionary } from "./teacherPayslipDictionary.js";
import { extractValuesAmProjects } from "./valueExtractors.js";

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
          console.log(`🎯 זיהוי מדויק: "${entry.label}" מתוך "${item.text}"`);
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

function displayExtractedData(data) {
  const container = document.getElementById("tables-container");
  container.innerHTML = "";
  const table = document.createElement("table");
  table.innerHTML = `<tr><th>רכיב</th><th>ערך</th></tr>`;
  data.forEach(({ label, value }) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${label}</td><td>${value}</td>`;
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
  const img = new Image();
  img.src = imageUrl;

  await new Promise(resolve => img.onload = resolve);

  const { data: ocrData } = await Tesseract.recognize(img, 'heb');
  return ocrData.words.map(w => ({
    text: w.text,
    x: w.bbox.x0,
    y: w.bbox.y0
  }));
}

window.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("selectedPayslipId");
  const type = localStorage.getItem("selectedPayslipType");

  if (!id || (type !== "pdf" && type !== "image")) {
    return alert("לא נבחר קובץ חוקי (PDF או תמונה).");
  }

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly").objectStore("payslips").get(Number(id));
  if (!item) return alert("תלוש לא נמצא במאגר.");

  const blob = new Blob([item.data], { type: item.mimeType || (type === "pdf" ? "application/pdf" : "image/png") });

  const items = type === "pdf"
    ? await extractTextItemsFromPDF(blob)
    : await extractTextItemsFromImage(blob);

  const lines = groupByYLine(items);

  const dicts = [
    {
      name: "AM PROJECTS",
      dict: amProjectsDictionary,
      triggerLabels: ["קוד מהדורה", "חישוב מצטבר", "בסיס קרן השתלמות"]
    },
    {
      name: "Cleaning",
      dict: cleaningPayslipDictionary,
      triggerLabels: ["שכר שווה כסף", "זיכוי משמרות", "גמל 35%"]
    },
    {
      name: "Teacher",
      dict: teacherPayslipDictionary,
      triggerLabels: ["אופק חדש", "דרגת אופק", "ותק בהוראה"]
    }
  ];

  const detectedLabelsByDict = [];

  for (const { name, dict, triggerLabels } of dicts) {
    const foundLabels = new Set();
    for (const line of lines) {
      const matches = findMatchesInLineItems(line.items, dict);
      matches.forEach(label => foundLabels.add(label));
    }
    const triggerFound = triggerLabels.some(label => foundLabels.has(label));
    detectedLabelsByDict.push({ name, dict, count: foundLabels.size, triggerFound, triggerLabels, foundLabels });
    console.log(`🔍 ${name}: נמצאו ${foundLabels.size} רכיבים`);
  }

  let selected = null;
  for (const dictData of detectedLabelsByDict) {
    if (dictData.triggerFound) {
      const triggeredBy = dictData.triggerLabels.find(label =>
        dictData.foundLabels.has(label)
      );
      selected = dictData;
      console.log(`🚀 נבחר מילון לפי טריגר: ${dictData.name} (trigger: "${triggeredBy || "לא ידוע"}")`);
      break;
    }
  }

  if (!selected) {
    selected = detectedLabelsByDict
      .filter(d => d.dict.length <= 130)
      .sort((a, b) => b.count - a.count)[0];

    if (selected) {
      console.log(`📊 נבחר מילון לפי כמות התאמות: ${selected.name} (${selected.count} התאמות)`);
    }
  }

  if (!selected) {
    alert("לא נמצאה התאמה במילונים.");
    return;
  }

  console.log(`✅ נבחר מילון: ${selected.name} (${selected.count} התאמות)`);

  let results = [];

  if (selected.name === "AM PROJECTS") {
    results = extractValuesAmProjects(lines, [...selected.foundLabels]);
  } else {
    results = [...selected.foundLabels].map(label => ({ label, value: "" }));
  }

  console.log(`✅ נמצאו ${results.length} רכיבים מתוך ${lines.length} שורות`);
  displayExtractedData(results);
});
