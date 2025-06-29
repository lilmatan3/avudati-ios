import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/+esm';
import {
  getDocument,
  GlobalWorkerOptions
} from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.mjs';

GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

async function runBasicOcr(canvas) {
  const container = document.getElementById("tables-container");
  container.innerHTML = "🔍 מריץ OCR, נא להמתין...";

  const result = await Tesseract.recognize(canvas, 'heb+eng', {
    logger: m => console.log("📡 OCR:", m)
  });

  const textLines = result.data.text.split("\n").map(l => l.trim()).filter(l => l.length);
  console.log("📄 שורות שזוהו:");
  textLines.forEach((line, i) => console.log(`[${i + 1}] ${line}`));

  container.innerHTML = "<pre style='direction: rtl;'>" + textLines.join("\n") + "</pre>";
}

async function renderPdfToImage(blob) {
  const loadingTask = getDocument({ data: await blob.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  await runBasicOcr(canvas);
}

window.addEventListener('DOMContentLoaded', async () => {
  const id = localStorage.getItem("selectedPayslipId");
  const type = localStorage.getItem("selectedPayslipType");
  if (!id || !type || type !== "pdf") return alert("יש לבחור קובץ PDF מהספרייה.");

  const db = await openDB("PaycheckDB", 1);
  const item = await db.transaction("payslips", "readonly")
    .objectStore("payslips").get(Number(id));

  if (!item) return alert("התלוש לא נמצא במאגר.");

  const blob = new Blob([item.data], {
    type: item.mimeType || "application/pdf"
  });

  await renderPdfToImage(blob);
});
