import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import Tesseract       from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/+esm';

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

  const db   = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly")
                         .objectStore("payslips")
                         .get(Number(id));
  if (!item) return alert("לא נמצא קובץ תלוש");

  const loadImage = url => new Promise(res => {
    const img = new Image();
    img.src = url;
    img.onload = () => res(img);
  });

  if (item.isImage) {
    const blob     = new Blob([item.data], { type: "image/png" });
    const imageUrl = URL.createObjectURL(blob);
    const img      = await loadImage(imageUrl);
    await processImage(img);
    renderTables();

  } else {
    const pdfData = new Uint8Array(item.data);
    const pdf     = await pdfjsLib.getDocument({ data: pdfData }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page     = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 3.0 });

      const canvas  = document.createElement("canvas");
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      const ctx     = canvas.getContext("2d");

      await page.render({ canvasContext: ctx, viewport }).promise;
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
    { title: "💵 רכיבי שכר",      keywords: ["שכריסוד","נסיעות","תמורתחופשה","הבראה","חג","מחלה"] },
    { title: "🧍‍♂️ פרטים אישיים של העובד", keywords: ["זכויות","זכויותמשפחתי","זיכוי","דרגה","שנותותק","תחילתעבודה","קופג","קהל"] },
    { title: "💳 ניכויי חובה",     keywords: ["ביטוחלאומי","בריאות","פנסיה","קופג","ניכוי","הרחבה","קרן"] },
    { title: "💳 ניכויי רשות",    keywords: ["ניכויירשות","ניכוירשות","ניכויי","נכוי","רשות","ועד","הלוואה","תרומה","ביטוחים","אחרים"] },
    { title: "🧾 סיכום כללי / דוח כולל", keywords: ["שווהכסף","שכרשווהכסף","שכר שווה כסף","קופגמעביד","קה\"ל","פטורסעיף47","פטור","סעיף47","זיכוי אישי","מסהכנסה"] },
    { title: "🗓️ תקופת התשלום ומזהים כלליים", keywords: ["תלוששכר","חודש","שנתמס","תאריךהפקת","תקופתשכר"] },
    { title: "📋 נתוני מס / עזר", keywords: ["יחידותמס","סעיף","נקודותזיכוי","תושבישראל","שנתחישוב","שנתגביה"] },
    { title: "⏱️ משרות ושעות עבודה", keywords: ["שעותעבודה","היקףמשרה","שעותלתשלום","שעותבפועל","שעותשבת","שעותחוב","שעותכוננות"] },
    { title: "📅 יתרות, הבראה והיעדרויות", keywords: ["חופשה","מחלה","הבראה","יתרהחדשה","ניצול"] },
    { title: "💸 שכר נטו וסכום בבנק", keywords: ["שכרנטו","סכוםלתשלום","נטושלם","סכוםלהעברה","פרטיחשבוןבנק"] },
    { title: "✅ סכומים מסכמים", keywords: ["סהכלתשלומים","סהכניכויים","ברוטו","נטושולם"] }
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
  let blue = 0, total = mat.rows * mat.cols;
  for (let y=0; y<mat.rows; y++) {
    for (let x=0; x<mat.cols; x++) {
      const [r,g,b] = mat.ucharPtr(y, x);
      if (b > r + 30 && b > g + 30) blue++;
    }
  }
  return blue / total > 0.25;
}

function isMostlyBlack(mat) {
  let dark = 0, total = mat.rows * mat.cols;
  for (let y=0; y<mat.rows; y++) {
    for (let x=0; x<mat.cols; x++) {
      const [r,g,b] = mat.ucharPtr(y, x);
      const avg = (r + g + b) / 3;
      if (avg < 40) dark++;
    }
  }
  return dark / total > 0.4;
}

async function processImage(img) {
  const src = cv.imread(img);
  const gray    = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh  = new cv.Mat();
  const contours= new cv.MatVector();
  const hier    = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.medianBlur(gray, blurred, 3);
  cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 15, 10);
  cv.findContours(thresh, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i=0; i<contours.size(); i++) {
    const rect = cv.boundingRect(contours.get(i));
    if (rect.width < 40 || rect.height < 20) continue;
    const aspect = rect.width / rect.height;
    if (aspect>0.85 && aspect<1.15 && (rect.width<160 || rect.height<160)) continue;

    const roi    = src.roi(rect);
    const canvas = document.createElement("canvas");
    canvas.width  = roi.cols;
    canvas.height = roi.rows;
    cv.imshow(canvas, roi);

    const isSquareish = Math.abs(rect.width - rect.height) < 20;
    if (isMostlyBlue(roi) || (isMostlyBlack(roi) && isSquareish)) {
      roi.delete();
      continue;
    }

    const text  = await extractTextFromCanvas(canvas);
    const title = detectTableType(text);
    roi.delete();
    allTables.push({ title, canvas, top: rect.y });
  }

  gray.delete();
  blurred.delete();
  thresh.delete();
  contours.delete();
  hier.delete();
  src.delete();
}

function renderTables() {
  const container = document.getElementById("tables-container");
  container.innerHTML = "";

  allTables.sort((a, b) => a.top - b.top);
  const grouped = {};
  for (const { title, canvas } of allTables) {
    (grouped[title] ||= []).push(canvas);
  }

  const others = "🧩 נתונים נוספים";
  const keys = Object.keys(grouped).filter(t => t !== others).concat(others);

  for (const title of keys) {
    if (!grouped[title]) continue;
    const h3 = document.createElement("h3");
    h3.textContent = title;
    container.appendChild(h3);

    grouped[title].forEach(c => container.appendChild(c));

    // למצוא ולהצמיד הסברים אם קיימים
    const expls = document.querySelectorAll('#explanations [data-title]');
    let block = null;
    const normT = title.replace(/\W/g,'').trim();
    for (const e of expls) {
      const key = e.getAttribute('data-title').replace(/\W/g,'').trim();
      if (normT.includes(key)||key.includes(normT)) {
        block = e;
        break;
      }
    }
    if (block) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("explanation");
      const clone = block.cloneNode(true);
      clone.style.display = "flex";
      wrapper.appendChild(clone);
      container.appendChild(wrapper);
    }
  }

  document.getElementById("loading-message").style.display = "none";
}

// פופאפ טאנגלים
document.addEventListener("click", e => {
  const popup     = document.getElementById("popup-explanation");
  const closeBtn  = popup.querySelector(".popup-close");
  if (e.target === popup || e.target === closeBtn) {
    popup.style.display = "none";
    return;
  }
  if (e.target.classList.contains("tooltip")) {
    e.stopPropagation();
    const txt = e.target.querySelector(".tooltiptext");
    if (txt) {
      popup.querySelector(".popup-text").innerHTML = txt.innerHTML;
      popup.style.display = "flex";
    }
  }
});
