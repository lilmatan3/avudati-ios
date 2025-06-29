import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';

window.cv = undefined;

window.Module = {
  onRuntimeInitialized() {
    main();
  }
};

async function main() {
  const id = localStorage.getItem("selectedPayslipId");
  if (!id) return alert("לא נבחר תלוש");

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly").objectStore("payslips").get(Number(id));
  if (!item) return alert("לא נמצא קובץ תלוש");

  if (item.isImage) {
    const blob = new Blob([item.data], { type: "image/png" });
    const imageUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      processImage(img);
    };
  } else {
    const pdfData = new Uint8Array(item.data);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    const img = new Image();
    img.src = canvas.toDataURL();
    img.onload = () => {
      processImage(img);
    };
  }
}

function processImage(img) {
  const src = cv.imread(img);
  const gray = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 15, 10);
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const tables = [];
  for (let i = 0; i < contours.size(); ++i) {
    const rect = cv.boundingRect(contours.get(i));
    if (rect.width < 50 || rect.height < 20) continue;

    const roi = src.roi(rect);
    const canvas = document.createElement("canvas");
    canvas.width = roi.cols;
    canvas.height = roi.rows;
    cv.imshow(canvas, roi);

    tables.push({ canvas, top: rect.y });
    roi.delete();
  }

  gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); src.delete();

  tables.sort((a, b) => a.top - b.top);
  const container = document.getElementById("tables-container");
  container.innerHTML = "";

  const sectionTitles = [
    "🏢 פרטי חברה",
    "🗓️ פרטי תאריכי התלוש",
    "🙋 פרטים אישיים",
    "📍 כתובת העובד",
    "💰 רכיבי השכר",
    "📉 ניכויי חובה",
    "📑 נתונים נוספים ומצטברים",
    "💵 שכר נטו לפני ניכויים",
    "💳 ניכויי רישות",
    "📤 לתשלום"
  ];

  let visibleIndex = 0;

  tables.forEach((t, i) => {
    if (i === 9) return;

    const label = document.createElement("h3");
    label.textContent = sectionTitles[visibleIndex] || `🕵️ טבלה לא מזוהה ${i + 1}`;
    container.appendChild(label);
    container.appendChild(t.canvas);

    const explanationRow = document.createElement("div");
    explanationRow.className = "explanation-row";

    const pop = (label, text) =>
      `<span>${label}</span><button class="info-circle" onclick="showPopup(\`${text}\`)">?</button>`;

    if (visibleIndex === 0) {
      explanationRow.innerHTML = `
        ${pop("פרטי החברה", "שם החברה, כתובת ויישוב בה היא רשומה.\n\n💡 טיפ: נתונים אלו יידרשו בתיאום מס או מכתבים רשמיים.")}
        ${pop("מספרי תיקים", "כולל תיק ניכויים למס הכנסה, מספר תאגיד ותיק ביטוח לאומי.\n\n💡 טיפ: חיוני לבירורים מול מס הכנסה וביטוח לאומי.")}
      `;
    } else if (visibleIndex === 1) {
      explanationRow.innerHTML = `
        ${pop("תאריכי התלוש", "התאריך שאליו שייך התלוש ותאריך הפקתו בפועל.\n\n💡 טיפ: התלוש מתייחס לחודש העבודה, לא לתאריך ההפקה.")}
      `;
    } else if (visibleIndex === 2) {
      explanationRow.innerHTML = `
        ${pop("נתוני זהות", "כולל תעודת זהות, תושבות ומצב משפחתי.\n\n💡 טיפ: מצב משפחתי משפיע על נקודות זיכוי במס – חשוב לבדוק!")}
        ${pop("נתוני עובד", "מספר עובד, דרגה, קוד משרה, יחידה.\n\n💡 טיפ: משפיע על השכר והזכויות – במיוחד במגזר ציבורי.")}
        ${pop("נתוני משרה", "אחוז משרה, סוג משרה, תאריך התחלה.\n\n💡 טיפ: משפיע על ימי חופשה, הבראה ופנסיה.")}
        ${pop("נתוני בנק", "מספר חשבון, בנק וסניף אליו מועבר השכר.\n\n💡 טיפ: ודא שהפרטים עדכניים – אחרת ייגרם עיכוב בתשלום.")}
      `;
    } else if (visibleIndex === 3) {
      explanationRow.innerHTML = `
        ${pop("כתובת העובד", "הכתובת כפי שנמסרה למעסיק.\n\n💡 טיפ: אם אתה גר ביישוב מזכה במס – ייתכן שמגיעות לך הנחות במס.")}
      `;
    } else if (visibleIndex === 4) {
      explanationRow.innerHTML = `
        ${pop("פירוט שעות", "כולל שכר רגיל, שעות נוספות, עבודה בשישי/חג.\n\n💡 טיפ: ודא ששעות נוספות מחושבות לפי החוק.")}
        ${pop("רכיבים נלווים", "כולל הבראה, מתנות, נסיעות, טלפון וכו'.\n\n💡 טיפ: לא כל רכיב מזכה בפנסיה – חשוב לבדוק.")}
        ${pop("מחיר לשעה", "השכר הכולל חלקי השעות – מראה את הערך האמיתי לשעה.\n\n💡 טיפ: טוב להשוואה מול שוק העבודה.")}
      `;
    } else if (visibleIndex === 5) {
      explanationRow.innerHTML = `
        ${pop("הורדות חובה", "כולל מס הכנסה, ביטוח לאומי, מס בריאות, פנסיה חובה.\n\n💡 טיפ: בדוק שהניכוי תואם להכנסה ונקודות הזיכוי שלך.")}
      `;
    } else if (visibleIndex === 6) {
      explanationRow.innerHTML = `
        ${pop("נתונים נוספים", "כולל ימי עבודה בפועל, ימי חופשה, ימי העדרות.\n\n💡 טיפ: חשוב להשוות מול רישומי הנוכחות שלך.")}
        ${pop("נתונים מצטברים", "מציין חישובים שנתיים – שעות, ימי עבודה, הבראה וכו'.\n\n💡 טיפ: שווה לעקוב כדי לראות צבירה לאורך זמן.")}
        ${pop("חשבון חופשה", "יתרות צבירה, ניצול ויתרה נוכחית של ימי חופש.\n\n💡 טיפ: נצל את החופשות בזמן – ימי חופשה לא תמיד נצברים לנצח.")}
        ${pop("חשבון מחלה", "יתרה נוכחית, ניצול וצבירה של ימי מחלה.\n\n💡 טיפ: צבירה מוגבלת – עקוב במיוחד בעבודה קבועה.")}
      `;
    } else if (visibleIndex === 7) {
      explanationRow.innerHTML = `
        ${pop("שכר נטו", "הסכום לאחר ניכויי חובה ולפני ניכויי רשות.\n\n💡 טיפ: זה הסכום שיעבור אליך בפועל – השווה מול העברה לבנק.")}
      `;
    } else if (visibleIndex === 8) {
      explanationRow.innerHTML = `
        ${pop("ניכויים משתנים", "הוצאות מרצון כגון מזון, קנסות, בגדים.\n\n💡 טיפ: בדוק שהניכויים מופיעים רק אם הסכמת להם מראש.")}
      `;
    } else if (visibleIndex === 9) {
      explanationRow.innerHTML = `
        ${pop("תשלום סופי", "הסכום הכולל לתשלום לאחר כל הניכויים.\n\n💡 טיפ: ודא שהוא תואם למה שהועבר בפועל – כל טעות קטנה עלולה להיגרם כאן.")}
      `;
    }

    if (explanationRow.innerHTML) {
      container.appendChild(explanationRow);
    }

    visibleIndex++;
  });
}

window.showPopup = function (text) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup-box";
  popup.innerHTML = `
    <button class="popup-close" onclick="this.parentElement.parentElement.remove()">❌</button>
    <p>${text}</p>
  `;

  overlay.appendChild(popup);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
};

function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return pixels.every((value, idx) => {
    const channel = idx % 4;
    return (channel < 3) ? value === 255 : true;
  });
}
