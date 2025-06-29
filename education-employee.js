import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/+esm';

window.cv = undefined;

window.Module = {
  onRuntimeInitialized() {
    main();
  }
};

const allTables = [];

async function main() {
  const id = localStorage.getItem("selectedPayslipId");
  if (!id) return alert("לא נבחר תלוש");

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly").objectStore("payslips").get(Number(id));
  if (!item) return alert("לא נמצא קובץ תלוש");

  const loadImage = (url) => new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
  });

  if (item.isImage) {
    const blob = new Blob([item.data], { type: "image/png" });
    const imageUrl = URL.createObjectURL(blob);
    const img = await loadImage(imageUrl);
    await processImage(img);
    renderTables();
  } else {
    const pdfData = new Uint8Array(item.data);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 3.0 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");

      await page.render({ canvasContext: context, viewport }).promise;

      const img = await loadImage(canvas.toDataURL());
      await processImage(img);
    }

    renderTables();
  }
}

function detectTableType(text) {
  const norm = text.replace(/\s+/g, "").toLowerCase();
  if (norm.includes("ישראל")) return "IGNORE";

  const categories = [
    { title: "🗓️ תקופת התשלום ומזהים כלליים", keywords: ["חודש", "תיק", "משכורת", "מספר"] },
    { title: "🏢 פרטי מוסד / מעסיק", keywords: ["מעסיק", "edu", "כתובת"] },
    { title: "🧍‍♂️ פרטים אישיים של העובד", keywords: ["זהות", "חשבון", "פרטים", "סניף"] },
    { title: "💵 רכיבי שכר", keywords: ["תשלומים", "שכר", "אופק", "משולב"] },
    { title: "📋 נתוני מס / עזר", keywords: ["קוד", "שעות", "סמל", "יחידה", "סה\"כ"] },
    { title: "🧾 נתוני מס / עזר", keywords: ["נקודות", "שולי", "מינימום", "יחידה", "ביטוח", "מצבמשפחתי", "זיכוי"] },
    { title: "💳 ניכויי חובה", keywords: ["ניכוי", "חובה", "ביטוחלאומי", "מסבריאות"] },
    { title: "💳 ניכויי גמל", keywords: ["ניכוי", "גמל", "קופג"] },
    { title: "⏱️ משרות ושעות עבודה", keywords: ["מקדמים", "שעות", "משרה"] },
    { title: "💸 שכר נטו וסכום בבנק", keywords: ["נטו", "בבנק", "לתשלום"] },
    { title: "✅ סכומים מסכמים", keywords: ["סהכ", "גמל", "חובה", "אחרים"] }
  ];

  for (const cat of categories) {
    const found = cat.keywords.filter(k => norm.includes(k));
    if (found.length >= 2) return cat.title;
  }

  return "🧩 נתונים נוספים";
}

async function extractTextFromCanvas(canvas) {
  const dataUrl = canvas.toDataURL();
  const { data: ocr } = await Tesseract.recognize(dataUrl, 'heb+eng');
  return ocr.text.trim();
}

function isMostlyBlue(mat) {
  const pixels = mat.rows * mat.cols;
  let bluePixels = 0;
  for (let y = 0; y < mat.rows; y++) {
    for (let x = 0; x < mat.cols; x++) {
      const [r, g, b] = mat.ucharPtr(y, x);
      if (b > 100 && b > r + 30 && b > g + 30) bluePixels++;
    }
  }
  return bluePixels / pixels > 0.25;
}

function isMostlyBlack(mat) {
  const pixels = mat.rows * mat.cols;
  let darkPixels = 0;
  for (let y = 0; y < mat.rows; y++) {
    for (let x = 0; x < mat.cols; x++) {
      const [r, g, b] = mat.ucharPtr(y, x);
      const brightness = (r + g + b) / 3;
      if (brightness < 40) darkPixels++;
    }
  }
  return darkPixels / pixels > 0.4;
}

async function processImage(img) {
  const src = cv.imread(img);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.medianBlur(gray, blurred, 3);
  cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 15, 10);
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    const rect = cv.boundingRect(contours.get(i));
    if (rect.width < 40 || rect.height < 20) continue;

    const aspect = rect.width / rect.height;
    if (aspect > 0.85 && aspect < 1.15 && (rect.width < 160 || rect.height < 160)) continue;

    const roi = src.roi(rect);
    const canvas = document.createElement("canvas");
    canvas.width = roi.cols;
    canvas.height = roi.rows;
    cv.imshow(canvas, roi);

    const isSquareish = Math.abs(rect.width - rect.height) < 20;
    if (isMostlyBlue(roi) || (isMostlyBlack(roi) && isSquareish)) {
      roi.delete();
      continue;
    }

    const text = await extractTextFromCanvas(canvas);
    const title = detectTableType(text);
    roi.delete();

    allTables.push({ title, canvas, top: rect.y });
  }

  gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); src.delete();
}

function renderTables() {
  const container = document.getElementById("tables-container");
  container.innerHTML = "";

  allTables.sort((a, b) => a.top - b.top);

  const grouped = {};
  for (const { title, canvas } of allTables) {
    if (!grouped[title]) grouped[title] = [];
    grouped[title].push(canvas);
  }

  const mainTitles = Object.keys(grouped).filter(t => t !== "🧩 נתונים נוספים");
  const titlesSorted = [...mainTitles, "🧩 נתונים נוספים"];

  for (const title of titlesSorted) {
    if (!grouped[title]) continue;

    const label = document.createElement("h3");
    label.textContent = title;
    container.appendChild(label);

    grouped[title].forEach(canvas => container.appendChild(canvas));

    // 🟣 חיפוש הסבר מתאים גם אם הטקסט לא תואם 1:1
    const explanations = document.querySelectorAll('#explanations [data-title]');
    let explanationBlock = null;

    for (const block of explanations) {
      const key = block.getAttribute('data-title').replace(/[^א-תA-Za-z0-9]/g, '').trim();
      const normalizedTitle = title.replace(/[^א-תA-Za-z0-9]/g, '').trim();
      if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        explanationBlock = block;
        break;
      }
    }

    if (explanationBlock) {
      const titleDiv = document.createElement("div");
      titleDiv.textContent = "❓ הסברים נוספים על רכיבי הטבלה:";
      titleDiv.style.fontWeight = "bold";
      titleDiv.style.margin = "10px 0 5px";
      container.appendChild(titleDiv);

      const clone = explanationBlock.cloneNode(true);
      clone.style.display = "flex";
      clone.classList.add("explanation");
      container.appendChild(clone);
    }
  }

  document.getElementById("loading-message").style.display = "none";
}

// 🟣 לוגיקת פופאפ טאנגלים
document.addEventListener("click", (e) => {
  const popup = document.getElementById("popup-explanation");
  const popupText = popup.querySelector(".popup-text");
  const closeBtn = popup.querySelector(".popup-close");

  if (e.target === popup || e.target === closeBtn) {
    popup.style.display = "none";
    return;
  }

  if (e.target.classList.contains("tooltip")) {
    e.stopPropagation();
    const textEl = e.target.querySelector(".tooltiptext");
    if (textEl) {
      popupText.innerHTML = textEl.innerHTML;
      popup.style.display = "flex";
    }
  }
});
