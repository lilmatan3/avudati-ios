document.addEventListener("DOMContentLoaded", () => {
  loadData(); // מתוך dataService.js
  populateFinalPaystub();
});

function populateFinalPaystub() {
  const month = parseInt(localStorage.getItem("detailedMonth") || (new Date().getMonth() + 1));
  const year = parseInt(localStorage.getItem("detailedYear") || new Date().getFullYear());

  const titleEl = document.getElementById("monthYearTitle");
  if (titleEl) {
    titleEl.textContent = `${String(month).padStart(2, '0')}/${year}`;
  }

  const salaryComponents = getSalaryComponents(year, month);
  const {
    workHours = {},
    tax = {},
    additions = {},
    specialDays = {},
    specialAdditions = {},
    mealDeduction = 0
  } = salaryComponents;

  const {
    regular = {}, overtime = {}, friday125 = {}, friday150 = {}, saturday = {}, holiday = {}
  } = workHours;

  const amountRegular = regular.amount || 0;
  const totalRegular = regular.hours || 0;

  const amountExtra = overtime.amount || 0;
  const totalExtra = overtime.hours || 0;

  const amountFriday125 = friday125.amount || 0;
  const totalFriday125 = friday125.hours || 0;

  const amountFriday150 = friday150.amount || 0;
  const totalFriday150 = friday150.hours || 0;

  const amountSaturday = saturday.amount || 0;
  const totalSaturday = saturday.hours || 0;

  const amountHoliday = holiday.amount || 0;
  const totalHoliday = holiday.hours || 0;

  const vacationDays = specialDays.vacation?.days || 0;
  const vacationAmount = specialDays.vacation?.amount || 0;
  const sickAmount = specialDays.sick?.amount || 0;
  const miluimDays = specialDays.miluim?.days || 0;
  const miluimAmount = specialDays.miluim?.amount || 0;
  const havraaDays = specialAdditions.havraa?.days || 0;
  const havraaAmount = specialAdditions.havraa?.amount || 0;

  const extraRows = [];
  const deductionRows = [];

  let baseBrutto =
    amountRegular + amountExtra + amountFriday125 + amountFriday150 + amountSaturday + amountHoliday +
    vacationAmount + sickAmount + miluimAmount + havraaAmount +
    (additions.bonusAmount || 0) +
    (additions.travelRefund || 0) +
    (additions.shiftAddition || 0) +
    (additions.phoneAllowance || 0) +
    (additions.globalOvertime || 0) +
    (additions.giftValue || 0);

  if (additions.carValue && additions.carIncludeInGross) {
    baseBrutto += additions.carValue;
  }

  const fixedAdditions = [
    { label: "בונוס חודשי קבוע", value: additions.bonusAmount },
    { label: "החזר נסיעות", value: additions.travelRefund },
    { label: "תוספת משמרות", value: additions.shiftAddition },
    { label: "אחזקת טלפון", value: additions.phoneAllowance },
    { label: "תוספת גלובלית לשעות נוספות", value: additions.globalOvertime },
    { label: "שווי מתנות", value: additions.giftValue },
  ];
  fixedAdditions.forEach(item => {
    if (item.value) extraRows.push(createRow(item.label, 1, formatShekel(item.value)));
  });

  if (additions.carValue && additions.carIncludeInGross) {
    extraRows.push(createRow("שווי שימוש ברכב", 1, formatShekel(additions.carValue)));
  }

  if (vacationDays > 0) extraRows.push(createRow("ימי חופשה", vacationDays, formatShekel(vacationAmount)));
  if (sickAmount > 0) extraRows.push(createRow("ימי מחלה", "-", formatShekel(sickAmount)));
  if (miluimDays > 0) extraRows.push(createRow("ימי מילואים", miluimDays, formatShekel(miluimAmount)));
  if (havraaDays > 0) extraRows.push(createRow("ימי הבראה", havraaDays, formatShekel(havraaAmount)));

  let totalManualAdditions = 0;
  let totalManualDeductions = 0;

  (appData.deductions?.transactions || []).forEach(t => {
    const name = `${t.category} (${t.source === 'net' ? 'נטו' : 'ברוטו'})`;
    if (t.type.includes("הוספה")) {
      extraRows.push(createRow(name, 1, formatShekel(t.amount)));
      if (t.source === "gross") baseBrutto += t.amount;
      else totalManualAdditions += t.amount;
    } else if (t.type.includes("הוצאה")) {
      deductionRows.push(createRow(name, null, formatShekel(Math.abs(t.amount))));
      if (t.source === "gross") baseBrutto -= Math.abs(t.amount);
      else totalManualDeductions += Math.abs(t.amount);
    }
  });

  const grossForGross = baseBrutto;
  const grossForTax = baseBrutto + (additions.carIncludeInTax ? (additions.carValue || 0) : 0);
  const grossForPension = baseBrutto + (additions.carIncludeInPension ? (additions.carValue || 0) : 0);

  const creditPoints = Number(tax?.creditPoints) || 2.25;
  const creditValue = creditPoints * 235;
  const baseTax = calcIncomeTax(grossForTax);

  let settlementDiscount = 0;
  if (tax?.enableSettlementDiscount) {
    const monthlyLimit = (tax.settlementAnnualLimit || 0) / 12;
    const cappedBrutto = Math.min(grossForTax, monthlyLimit);
    settlementDiscount = cappedBrutto * (tax.settlementDiscountPercent || 0) / 100;
  }

  const incomeTax = Math.max(baseTax - creditValue - settlementDiscount, 0);
  const bituah = tax?.noBituahLeumi ? 0 : grossForTax * 0.07;
  const health = tax?.noHealthTax ? 0 : grossForTax * 0.05;
  const pension = (Number(tax?.pension) || 0) / 100 * grossForPension;
  const hishtalmut = (Number(tax?.hishtalmut) || 0) / 100 * grossForTax;

  const grossDeductions = incomeTax + bituah + health + pension + hishtalmut + mealDeduction;
  const totalDeductions = grossDeductions + totalManualDeductions;
  const net = grossForTax - grossDeductions + totalManualAdditions;

  const finalNet = net;

  const employerPension = pension;
  const employerSeverance = (Number(tax?.severance) || 0) / 100 * grossForTax;
  const employerHishtalmut = hishtalmut;

  // 💼 רכיבי שכר
  updateRow(0, "שעות רגילות", totalRegular, amountRegular);
  updateRow(0, "שעות נוספות", totalExtra, amountExtra);
  updateRow(0, "שעות שישי 125%", totalFriday125, amountFriday125);
  updateRow(0, "שעות שישי 150%", totalFriday150, amountFriday150);
  updateRow(0, "שעות שבת", totalSaturday, amountSaturday);
  updateRow(0, "שעות חג", totalHoliday, amountHoliday);
  extraRows.forEach(row => document.querySelectorAll("table")[0].appendChild(row));
  updateTotalRow(0, "סה״כ ברוטו", grossForGross);

  // 📉 ניכויים
  updateSingleColumnRow(1, "מס הכנסה", incomeTax);
  updateSingleColumnRow(1, "ביטוח לאומי", bituah);
  updateSingleColumnRow(1, "ביטוח בריאות", health);
  updateSingleColumnRow(1, "פנסיה (עובד)", pension);
  updateSingleColumnRow(1, "השתלמות (עובד)", hishtalmut);
  updateSingleColumnRow(1, "הורדת שווי ארוחות", mealDeduction);
  deductionRows.forEach(row => document.querySelectorAll("table")[1].appendChild(row));
  updateTotalRow(1, "סה״כ ניכויים", totalDeductions);

  // 💰 שכר נטו
  updateSingleColumnRow(2, "סה״כ לתשלום", finalNet);

  // 🏦 הפרשות מעביד
  updateSingleColumnRow(3, "פנסיה (מעביד)", employerPension);
  updateSingleColumnRow(3, "השתלמות (מעביד)", employerHishtalmut);
  updateSingleColumnRow(3, "פיצויים", employerSeverance);
}

// פונקציות עזר
function updateRow(tableIndex, label, qty, amount) {
  const table = document.querySelectorAll("table")[tableIndex];
  table.querySelectorAll("tr").forEach(row => {
    if (row.children[0].textContent.trim() === label) {
      row.children[1].textContent = qty !== undefined ? qty.toFixed(2) : "---";
      row.children[2].textContent = formatShekel(amount);
    }
  });
}

function updateSingleColumnRow(tableIndex, label, amount) {
  const table = document.querySelectorAll("table")[tableIndex];
  table.querySelectorAll("tr").forEach(row => {
    if (row.children[0].textContent.trim() === label) {
      row.children[1].textContent = formatShekel(amount);
    }
  });
}

function updateTotalRow(tableIndex, label, value) {
  const table = document.querySelectorAll("table")[tableIndex];
  table.querySelectorAll("tr").forEach(row => {
    if (row.classList.contains("total-row") && row.children[0].textContent.includes(label)) {
      row.children[row.children.length - 1].textContent = formatShekel(value);
    }
  });
}

function createRow(name, qty, amount) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${name}</td><td>${qty !== null ? qty : "---"}</td><td>${amount}</td>`;
  return tr;
}

function formatShekel(val) {
  return `₪${Number(val).toFixed(2)}`;
}

function calcIncomeTax(amount) {
  const brackets = [
    { upTo: 6540, rate: 0.1 },
    { upTo: 9390, rate: 0.14 },
    { upTo: 14560, rate: 0.20 },
    { upTo: 20200, rate: 0.31 },
    { upTo: 42030, rate: 0.35 },
    { upTo: 54570, rate: 0.47 },
    { upTo: Infinity, rate: 0.50 }
  ];

  let tax = 0, prev = 0;
  for (let b of brackets) {
    let diff = Math.min(b.upTo, amount) - prev;
    if (diff > 0) {
      tax += diff * b.rate;
      prev = b.upTo;
    }
  }
  return tax;
}
