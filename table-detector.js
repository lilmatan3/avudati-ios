// table-detector.js (v1) - Cut tables from image
import cv from 'https://docs.opencv.org/4.x/opencv.js';

window.addEventListener('DOMContentLoaded', async () => {
  const id = localStorage.getItem("selectedPayslipId");
  if (!id) return alert("לא נבחר תלוש");

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly").objectStore("payslips").get(Number(id));
  if (!item || !item.isImage) return alert("⚠️ ניתן לנתח רק קובצי תמונה.");

  const blob = new Blob([item.data], { type: "image/png" });
  const imageUrl = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => processImage(img);
  img.src = imageUrl;
});

function processImage(image) {
  const container = document.getElementById("tables-container");
  container.innerHTML = "⌛ מנתח טבלאות...";

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let binary = new cv.Mat();
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 15, 10);

  cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let regions = [];
  for (let i = 0; i < contours.size(); ++i) {
    let rect = cv.boundingRect(contours.get(i));
    if (rect.width > 200 && rect.height > 50) {
      regions.push(rect);
    }
  }

  regions.sort((a, b) => a.y - b.y);
  container.innerHTML = "";
  regions.forEach((r, index) => {
    let cropped = src.roi(r);
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = r.width;
    tempCanvas.height = r.height;
    cv.imshow(tempCanvas, cropped);

    let div = document.createElement("div");
    div.innerHTML = `<h3>טבלה ${index + 1}</h3>`;
    div.appendChild(tempCanvas);
    container.appendChild(div);

    cropped.delete();
  });

  // ניקוי זיכרון
  src.delete(); gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
}
