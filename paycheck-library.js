import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';

let editMode = false;
let renameModeId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const editBtn = document.getElementById("editBtn");
  const viewBtn = document.getElementById("viewBtn");

  uploadBtn.addEventListener("click", () => fileInput.click());

  editBtn.addEventListener("click", () => {
    editMode = !editMode;
    renameModeId = null;
    renderLibrary();
  });

  viewBtn.addEventListener("click", () => {
    window.location.href = "paycheck-dictionary.html";
  });

  fileInput.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      alert("ניתן להעלות רק תמונה או קובץ PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
      const arrayBuffer = event.target.result;
      const db = await openDB("PaycheckDB", 1);
      const tx = db.transaction("payslips", "readwrite");
      const store = tx.objectStore("payslips");

      const all = await store.getAll();
      const maxOrder = Math.max(0, ...all.map(p => p.order || 0));

      const url = URL.createObjectURL(file);
      const previewIcon = isImage ? "assets/Pngpix-PNG-Pic-Background.png" : "assets/pdf-icon.png";

      const payslip = {
        id: Date.now(),
        name: file.name,
        date: new Date().toISOString(),
        data: arrayBuffer,
        order: maxOrder + 1,
        isImage,
        url,
        previewIcon
      };

      await store.add(payslip);
      await tx.done;
      renderLibrary();
    };

    reader.readAsArrayBuffer(file);
  });

  renderLibrary();
});

async function openDBInstance() {
  return await openDB("PaycheckDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("payslips")) {
        db.createObjectStore("payslips", { keyPath: "id" });
      }
    }
  });
}

async function renderLibrary() {
  const db = await openDBInstance();
  const tx = db.transaction("payslips", "readonly");
  const store = tx.objectStore("payslips");
  let all = await store.getAll();

  all.sort((a, b) => (a.order || 0) - (b.order || 0));

  const container = document.getElementById("library");
  container.innerHTML = "";

  for (const item of all) {
    const div = document.createElement("div");
    div.className = "file-card";
    div.dataset.id = item.id;

    const uploadDate = new Date(item.date).toLocaleDateString("he-IL");
    const isRenaming = renameModeId === item.id;

    div.innerHTML = `
      <img src="${item.previewIcon}" alt="תמונה" style="width: 100px; height: 100px; object-fit: cover;" />
      <p>
        ${isRenaming ? ` 
          <input class="rename-input" value="${item.name}">
          <button class="save-rename" data-id="${item.id}">✔️</button>
        ` : `
          <span class="filename">${item.name}</span>
          ${editMode ? `<button class="rename-toggle" data-id="${item.id}">✏️</button>` : ''}
        `}
      </p>
      <p style="font-size: 12px; color: gray;">${uploadDate}</p>
      <button class="delete-btn" data-id="${item.id}" style="display: ${editMode ? "block" : "none"};">🗑️</button>
      ${editMode ? `<div class="drag-bar">↕️ להזזה</div>` : ''}
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn") || editMode) return;
      localStorage.setItem("selectedPayslipId", item.id);
      localStorage.setItem("selectedPayslipType", item.isImage ? "image" : "pdf");
      window.location.href = "paycheck-preview.html";
    });

    const deleteBtn = div.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`האם למחוק את \"${item.name}\"?`)) {
          const tx = db.transaction("payslips", "readwrite");
          const store = tx.objectStore("payslips");
          await store.delete(item.id);
          await tx.done;
          renderLibrary();
        }
      });
    }

    const renameBtn = div.querySelector(".rename-toggle");
    if (renameBtn) {
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        renameModeId = item.id;
        renderLibrary();
      });
    }

    const saveRename = div.querySelector(".save-rename");
    if (saveRename) {
      saveRename.addEventListener("click", async (e) => {
        e.stopPropagation();
        const newName = div.querySelector(".rename-input").value;
        const tx = db.transaction("payslips", "readwrite");
        const store = tx.objectStore("payslips");
        const current = await store.get(item.id);
        current.name = newName;
        await store.put(current);
        await tx.done;
        renameModeId = null;
        renderLibrary();
      });
    }

    // iPhone reset zoom
    const input = div.querySelector('.rename-input');
    if (input) {
      const isiPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      input.addEventListener('focus', () => {
        if (isiPhone) {
          const meta = document.querySelector('meta[name=viewport]');
          if (meta) {
            meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=10.0, user-scalable=yes, viewport-fit=cover");
          }
        }
      });

      input.addEventListener('blur', () => {
        if (isiPhone) {
          setTimeout(() => {
            const meta = document.querySelector('meta[name=viewport]');
            if (meta) {
              meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
            }
          }, 100);
        }
      });
    }

    container.appendChild(div);
  }

  if (editMode) {
    new Sortable(container, {
      animation: 150,
      handle: ".drag-bar", // ✅ רק אזור ההזזה בתחתית
      ghostClass: "sortable-ghost",
      fallbackOnBody: true,
      swapThreshold: 0.65,
      forceFallback: true,
      onEnd: async function () {
           const db = await openDBInstance();
        const tx = db.transaction("payslips", "readwrite");
        const store = tx.objectStore("payslips");

        const newOrder = Array.from(container.children).map((div, index) => ({
          id: Number(div.dataset.id),
          order: index + 1
        }));

        for (const { id, order } of newOrder) {
          const item = await store.get(id);
          if (item) {
            item.order = order;
            await store.put(item);
          }
        }

        await tx.done;
        console.log("סדר חדש נשמר:", newOrder);
      }
    });
  }
}
