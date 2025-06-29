const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadToDeviceBtn = document.getElementById("downloadToDeviceBtn");
const retryBtn = document.getElementById("retryBtn");
const actions = document.getElementById("actions");

const editBtn = document.getElementById("editBtn");
const editor = document.getElementById("editor");
const contrastSlider = document.getElementById("contrastSlider");
const brightnessSlider = document.getElementById("brightnessSlider");
const applyEditBtn = document.getElementById("applyEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const cropBtn = document.getElementById("cropBtn");
const cropControls = document.getElementById("cropControls");
const applyCropBtn = document.getElementById("applyCropBtn");
const cancelCropBtn = document.getElementById("cancelCropBtn");

let stream = null;
let db = null;
let originalImageData = null;
let cropping = false, startX = 0, startY = 0, endX = 0, endY = 0;
let originalCanvasData = null;

/* === מצלמה === */
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.style.display = "block";
    canvas.style.display = "none";
    preview.style.display = "none";
    startBtn.style.display = "none";
    captureBtn.style.display = "inline-block";
    actions.style.display = "none";
  } catch (err) {
    alert("שגיאה בהפעלת המצלמה: " + err.message);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function captureImage() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const contrast = 1.25, midpoint = 128;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    const adjusted = (gray - midpoint) * contrast + midpoint;
    const finalGray = Math.max(0, Math.min(255, adjusted));
    data[i] = data[i + 1] = data[i + 2] = finalGray;
  }

  ctx.putImageData(imageData, 0, 0);
  preview.src = canvas.toDataURL("image/jpeg");

  preview.style.display = "block";
  video.style.display = "none";
  canvas.style.display = "none";
  captureBtn.style.display = "none";
  actions.style.display = "block";

  stopCamera();
}

/* === צלם מחדש === */
async function retakePhoto() {
  preview.style.display = "none";
  actions.style.display = "none";
  captureBtn.style.display = "inline-block";
  video.style.display = "block";
  await startCamera();
}

/* === עריכה === */
editBtn.onclick = () => {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    preview.style.display = "none";
    canvas.style.display = "block";
    editor.style.display = "block";
    actions.style.display = "none";
  };
  img.src = preview.src;
};

function applyLiveEdit() {
  const ctx = canvas.getContext("2d");
  const edited = new ImageData(new Uint8ClampedArray(originalImageData.data), canvas.width, canvas.height);
  const data = edited.data;
  const contrast = parseFloat(contrastSlider.value);
  const brightness = parseInt(brightnessSlider.value);
  const midpoint = 128;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    const adjusted = (gray - midpoint) * contrast + midpoint + brightness;
    const finalGray = Math.max(0, Math.min(255, adjusted));
    data[i] = data[i + 1] = data[i + 2] = finalGray;
  }

  ctx.putImageData(edited, 0, 0);
}
contrastSlider.oninput = applyLiveEdit;
brightnessSlider.oninput = applyLiveEdit;

applyEditBtn.onclick = () => {
  preview.src = canvas.toDataURL("image/jpeg");
  preview.style.display = "block";
  canvas.style.display = "none";
  editor.style.display = "none";
  actions.style.display = "block";
};

cancelEditBtn.onclick = () => {
  preview.style.display = "block";
  canvas.style.display = "none";
  editor.style.display = "none";
  actions.style.display = "block";
};

/* === חיתוך === */
cropBtn.onclick = () => {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    preview.style.display = "none";
    canvas.style.display = "block";
    actions.style.display = "none";
    cropControls.style.display = "block";
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  img.src = preview.src;
};

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function onPointerDown(evt) {
  cropping = true;
  const p = canvasPos(evt);
  startX = endX = p.x;
  startY = endY = p.y;
  drawCropRect();
}

function onPointerMove(evt) {
  if (!cropping) return;
  const p = canvasPos(evt);
  endX = p.x;
  endY = p.y;
  drawCropRect();
}

function onPointerUp() {
  cropping = false;
}

function drawCropRect() {
  const ctx = canvas.getContext("2d");
  ctx.putImageData(originalCanvasData, 0, 0);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);
  if (w && h) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,0,0,0.25)";
    ctx.fillRect(x, y, w, h);
  }
}

function exitCropMode() {
  cropControls.style.display = "none";
  actions.style.display = "block";
  preview.style.display = "block";
  canvas.style.display = "none";
  canvas.style.cursor = "default";
  canvas.removeEventListener("pointerdown", onPointerDown);
  canvas.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
}

applyCropBtn.onclick = () => {
  const x = Math.round(Math.min(startX, endX));
  const y = Math.round(Math.min(startY, endY));
  const w = Math.round(Math.abs(endX - startX));
  const h = Math.round(Math.abs(endY - startY));
  if (w === 0 || h === 0) return exitCropMode();

  const croppedData = originalCanvasData;
  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = w;
  croppedCanvas.height = h;
  const tmpCtx = croppedCanvas.getContext("2d");

  const croppedImageData = tmpCtx.createImageData(w, h);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcIndex = ((y + row) * croppedData.width + (x + col)) * 4;
      const dstIndex = (row * w + col) * 4;
      for (let i = 0; i < 4; i++) {
        croppedImageData.data[dstIndex + i] = croppedData.data[srcIndex + i];
      }
    }
  }

  tmpCtx.putImageData(croppedImageData, 0, 0);
  preview.src = croppedCanvas.toDataURL("image/jpeg");
  exitCropMode();
};
/* === שמירה === */
async function saveImage() {
  const blob = await (await fetch(preview.src)).blob();
  const buffer = await blob.arrayBuffer();
  await saveToIndexedDB("סריקה", buffer, "image/png");
}

async function saveToIndexedDB(name, buffer, mimeType) {
  const tx = db.transaction(["payslips"], "readwrite");
  const store = tx.objectStore("payslips");

  const allRequest = store.getAll();
  const all = await new Promise((resolve, reject) => {
    allRequest.onsuccess = () => resolve(allRequest.result);
    allRequest.onerror = () => reject(allRequest.error);
  });

  const maxOrder = Math.max(0, ...all.map(p => p.order || 0));
  const payslip = {
    id: Date.now(),
    name: `${name}_${new Date().toLocaleDateString('he-IL')}.png`,
    date: new Date().toISOString(),
    data: buffer,
    order: maxOrder + 1,
    isImage: true,
    url: URL.createObjectURL(new Blob([buffer], { type: mimeType })),
    previewIcon: "assets/Pngpix-PNG-Pic-Background.png"
  };

  const addRequest = store.add(payslip);
  addRequest.onsuccess = () => {
    alert("✅ נשמר כתמונה לספרייה");
    window.location.href = "paycheck-library.html";
  };
  addRequest.onerror = () => alert("❌ שגיאה בשמירה.");
}


async function saveToDevice() {
  const a = document.createElement("a");
  a.href = preview.src;
  a.download = `סריקה_${new Date().toLocaleDateString('he-IL')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* === IndexedDB === */
const request = indexedDB.open("PaycheckDB", 1);
request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("payslips")) {
    db.createObjectStore("payslips", { keyPath: "id" });
  }
};
request.onsuccess = function (event) {
  db = event.target.result;
};

/* === אירועים === */
startBtn.onclick = startCamera;
captureBtn.onclick = captureImage;
retryBtn.onclick = retakePhoto;
saveBtn.onclick = saveImage;
downloadToDeviceBtn.onclick = saveToDevice;
