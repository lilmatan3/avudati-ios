document.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderPaystub();
  renderTaxExplanation();
});

function renderTaxExplanation() {
  const section = document.querySelector("#taxExplanation");
  if (!section) return;

  section.innerHTML = `
    <div class="section">
      <h2>ℹ️ הסבר על חישוב מס הכנסה</h2>
      <p>חישוב מס הכנסה מבוסס על מדרגות מס חודשיות שמצטברות לאורך החודש. המשמעות היא שבתחילת החודש ייתכן והמס יהיה נמוך מאוד, אך יעלה ככל שיצטבר שכר.</p>
      <p>למשל, אם מעסיק מפיק תלוש באמצע החודש – המס עשוי להיות נמוך יותר מאשר בסוף החודש, גם אם השכר החודשי בפועל זהה.</p>
      <p>כמו כן, התחשיב כולל הפחתה לפי מספר נקודות זיכוי שמגיעות לך לפי חוק (למשל, חייל משוחרר, תושב ישראל, הורה לילד קטן וכו').</p>
    </div>
  `;
}

function renderPaystub() {
  // מנקה תצוגה קודמת אם קיימת
  document.querySelector(".paystub-sections")?.remove();

  const container = document.createElement("div");
  container.className = "paystub-container";

  const month = localStorage.getItem("detailedMonth") || (new Date().getMonth() + 1);
  const year = localStorage.getItem("detailedYear") || new Date().getFullYear();
  const monthly = getMonthlyData(year, month);

  const wage = appData.userSettings?.hourlyWage || 50;
  const totalHours = monthly.timesheet.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalAmount = monthly.timesheet.reduce((sum, r) => sum + (r.amount || 0), 0);

  // ברוטו
  const bruttoSection = createSection("שכר ברוטו", [
    { label: "סה״כ שעות", value: totalHours.toFixed(2) },
    { label: "שכר שעתי", value: `₪${wage.toFixed(2)}` },
    { label: "שכר בסיס + שעות נוספות", value: `₪${totalAmount.toFixed(2)}` }
  ]);

  // ניכויים
  const tax = calculateIncomeTax(totalAmount);
  const bituah = calculateBituahLeumi(totalAmount);
  const health = calculateHealthTax(totalAmount);
  const pension = (appData.taxSettings?.pension || 0) / 100 * totalAmount;
  const hishtalmut = (appData.taxSettings?.hishtalmut || 0) / 100 * totalAmount;

  const deductionsSection = createSection("ניכויים", [
    { label: "מס הכנסה", value: `₪${tax.toFixed(2)}` },
    { label: "ביטוח לאומי", value: `₪${bituah.toFixed(2)}` },
    { label: "ביטוח בריאות", value: `₪${health.toFixed(2)}` },
    { label: "פנסיה (עובד)", value: `₪${pension.toFixed(2)}` },
    { label: "השתלמות (עובד)", value: `₪${hishtalmut.toFixed(2)}` }
  ]);

  // נטו
  const totalDeductions = tax + bituah + health + pension + hishtalmut;
  const neto = totalAmount - totalDeductions;

  const netoSection = createSection("שכר נטו", [
    { label: "סה״כ לתשלום", value: `₪${neto.toFixed(2)}` }
  ]);

  // הפרשות מעביד
  const employerPension = pension;
  const employerSeverance = (appData.taxSettings?.severance || 0) / 100 * totalAmount;
  const employerHishtalmut = hishtalmut;

  const employerSection = createSection("הפרשות המעסיק", [
    { label: "פנסיה", value: `₪${employerPension.toFixed(2)}` },
    { label: "פיצויים", value: `₪${employerSeverance.toFixed(2)}` },
    { label: "השתלמות", value: `₪${employerHishtalmut.toFixed(2)}` }
  ]);

  // פרטים כלליים גנריים
  const generalSection = createSection("פרטי עובד", [
    { label: "שם העובד", value: "___ ___" },
    { label: "מספר עובד", value: "123456" },
    { label: "חודש", value: `${month}/${year}` },
    { label: "שם המעסיק", value: "___ בע\"מ" },
    { label: "מספר תיק ניכויים", value: "999999999" }
  ]);

  // הצגה
  const main = document.createElement("div");
  main.className = "paystub-sections";
  main.append(generalSection, bruttoSection, deductionsSection, netoSection, employerSection);

  document.body.appendChild(main);
}

function createSection(title, rows) {
  const section = document.createElement("div");
  section.className = "paystub-section";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  section.appendChild(h2);

  rows.forEach(row => {
    const div = document.createElement("div");
    div.className = "paystub-row";
    div.innerHTML = `<span>${row.label}</span><span>${row.value}</span>`;
    section.appendChild(div);
  });

  return section;
}

function calculateIncomeTax(gross) {
  if (appData.taxSettings?.taxExempt) return 0;

  const creditPoints = appData.taxSettings?.creditPoints || 2.25;
  const creditValue = creditPoints * 235;

  // הנחת יישוב מזכה
  let settlementDiscount = 0;
  if (appData.taxSettings?.enableSettlementDiscount) {
    const limit = appData.taxSettings.settlementAnnualLimit || 0;
    const percent = appData.taxSettings.settlementDiscountPercent || 0;
    const monthlyLimit = limit / 12;
    const cappedGross = Math.min(gross, monthlyLimit);
    settlementDiscount = cappedGross * (percent / 100);
  }

  const baseTax = calcIncomeTax(gross);
  return Math.max(0, baseTax - creditValue - settlementDiscount);
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

  let tax = 0;
  let prevLimit = 0;

  for (let bracket of brackets) {
    const taxable = Math.min(amount, bracket.upTo) - prevLimit;
    if (taxable > 0) {
      tax += taxable * bracket.rate;
      prevLimit = bracket.upTo;
    } else {
      break;
    }
  }

  return tax;
}

function calculateBituahLeumi(gross) {
  return appData.taxSettings?.noBituahLeumi ? 0 : gross * 0.07;
}

function calculateHealthTax(gross) {
  return appData.taxSettings?.noHealthTax ? 0 : gross * 0.05;
}
