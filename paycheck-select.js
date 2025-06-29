import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  const db = await openDB("PaycheckDB", 1);
  const tx = db.transaction("payslips", "readonly");
  const store = tx.objectStore("payslips");
  const all = await store.getAll();

  const container = document.getElementById("select-library");
  container.innerHTML = "";

  if (!all.length) {
    container.innerHTML = "<p style='text-align:center;'>לא נמצאו תלושים</p>";
    return;
  }

  for (const item of all) {
    const div = document.createElement("div");
    div.className = "file-card";
    div.dataset.id = item.id;

    const uploadDate = new Date(item.date).toLocaleDateString("he-IL");
    const isImage = item.isImage === true;

    div.innerHTML = `
      <img src="${item.previewIcon || (isImage ? 'assets/Pngpix-PNG-Pic-Background.png' : 'assets/pdf-icon.png')}" alt="${isImage ? 'תמונה' : 'PDF'}" />
      <p>${item.name}</p>
      <p style="font-size: 12px; color: gray;">${uploadDate}</p>
    `;

    div.addEventListener("click", () => {
      localStorage.setItem("selectedPayslipId", item.id);
      localStorage.setItem("selectedPayslipType", isImage ? "image" : "pdf");

      // ✅ תמיד נשלח לעמוד האחיד
      window.location.href = "paycheck-details-pdf.html";
    });

    container.appendChild(div);
  }
});
