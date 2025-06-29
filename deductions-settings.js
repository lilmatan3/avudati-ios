// deductions-settings.js מתוקן
let transactionId = 0;
let pendingTransaction = null;

const sectionSums = {
  'הוצאה קבועה': 0,
  'הוצאה חד פעמית': 0,
  'הוספה קבועה': 0,
  'הוספה חד פעמית': 0
};

function showSourcePopup(transactionData) {
  pendingTransaction = transactionData;
  const popup = document.getElementById('sourcePopup');
  popup.style.display = 'block';
}

function hideSourcePopup() {
  document.getElementById('sourcePopup').style.display = 'none';
}

function completeTransaction(sourceChoice) {
  if (!pendingTransaction) return;
  pendingTransaction.source = sourceChoice;
  addTransaction(pendingTransaction);
  pendingTransaction = null;
  hideSourcePopup();
}

function cancelTransaction() {
  pendingTransaction = null;
  hideSourcePopup();
}

function addTransaction(transactionData) {
  const id = 'tx-' + transactionId++;
  transactionData.id = id;

  if (transactionData.type.includes('הוצאה')) {
    transactionData.amount = -Math.abs(transactionData.amount);
  } else {
    transactionData.amount = Math.abs(transactionData.amount);
  }

  if (!transactionData.source) transactionData.source = 'gross';

  const isFixed = transactionData.type.includes('קבועה');

  if (isFixed) {
    if (!appData.deductions.fixedTransactions) {
      appData.deductions.fixedTransactions = [];
    }
    appData.deductions.fixedTransactions.push(transactionData);
  } else {
    const monthKey = new Date().toISOString().slice(0, 7);
    if (!appData.deductions.monthlyTransactions[monthKey]) {
      appData.deductions.monthlyTransactions[monthKey] = [];
    }
    appData.deductions.monthlyTransactions[monthKey].push(transactionData);
  }

  saveData();
  createRow(transactionData);
  sectionSums[transactionData.type] += transactionData.amount;
  updateSums();
}

function addToTable(type, category, amount) {
  if (!amount || isNaN(amount)) return;
  const val = parseFloat(amount);
  const transactionData = { type, category, amount: val };
  showSourcePopup(transactionData);
}

function createRow({ id, type, category, amount, source }) {
  const row = document.createElement('tr');
  row.setAttribute('data-id', id);
  row.innerHTML = `
    <td>${type}</td>
    <td>${category}</td>
    <td class="amount-cell">${amount.toFixed(2)} ₪</td>
    <td>${source === 'net' ? 'נטו' : 'ברוטו'}</td>
    <td><button class="remove-button" onclick="removeRow('${id}')">✖</button></td>
  `;
  document.querySelector('#transactionsTable tbody').appendChild(row);

  const el = document.createElement('div');
  el.className = 'row inline-item';
  el.setAttribute('data-id', id);
  el.innerHTML = `
    <span>${category} (${source === 'net' ? 'נטו' : 'ברוטו'}):</span>
    <span>${amount.toFixed(2)} ₪</span>
    <button class="remove-button" onclick="removeRow('${id}')">✖</button>
  `;
  const container = document.getElementById('list-' + type);
  container.appendChild(el);
}

function removeRow(id) {
  let found = false;
  
  ['fixedTransactions', 'monthlyTransactions'].forEach(type => {
    if (type === 'fixedTransactions') {
      const idx = appData.deductions.fixedTransactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        sectionSums[appData.deductions.fixedTransactions[idx].type] -= appData.deductions.fixedTransactions[idx].amount;
        appData.deductions.fixedTransactions.splice(idx, 1);
        found = true;
      }
    } else {
      for (const monthKey in appData.deductions.monthlyTransactions) {
        const idx = appData.deductions.monthlyTransactions[monthKey].findIndex(t => t.id === id);
        if (idx !== -1) {
          sectionSums[appData.deductions.monthlyTransactions[monthKey][idx].type] -= appData.deductions.monthlyTransactions[monthKey][idx].amount;
          appData.deductions.monthlyTransactions[monthKey].splice(idx, 1);
          found = true;
          break;
        }
      }
    }
  });

  if (found) {
    saveData();
    document.querySelectorAll(`[data-id="${id}"]`).forEach(el => el.remove());
    updateSums();
  }
}

function updateSums() {
  document.getElementById('tableTotal').textContent =
    Object.values(sectionSums).reduce((a, b) => a + b, 0).toFixed(2) + ' ₪';

  for (const key in sectionSums) {
    const el = document.getElementById('sum-' + key);
    if (el) el.textContent = sectionSums[key].toFixed(2) + ' ₪';
  }
}

function toggleHelp(icon) {
  const popup = icon.nextElementSibling;
  const open = popup.style.display === 'block';
  document.querySelectorAll('.help-popup').forEach(p => p.style.display = 'none');
  popup.style.display = open ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  const grossBtn = document.getElementById('btnGross');
  const netBtn = document.getElementById('btnNet');
  const cancelBtn = document.getElementById('btnCancel');

  grossBtn.onclick = () => completeTransaction('gross');
  netBtn.onclick = () => completeTransaction('net');
  cancelBtn.onclick = cancelTransaction;

  transactionId = 0;
  [...appData.deductions.fixedTransactions, ...Object.values(appData.deductions.monthlyTransactions).flat()]
    .forEach(t => {
      createRow(t);
      sectionSums[t.type] += t.amount;
      transactionId++;
    });

  updateSums();
});

document.addEventListener('click', e => {
  if (!e.target.classList.contains('help-icon') && !e.target.closest('.help-popup')) {
    document.querySelectorAll('.help-popup').forEach(p => p.style.display = 'none');
  }
});

window.completeTransaction = completeTransaction;
window.cancelTransaction = cancelTransaction;
window.addToTable = addToTable;
window.removeRow = removeRow;
window.toggleHelp = toggleHelp;
