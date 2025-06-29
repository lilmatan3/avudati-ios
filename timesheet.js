/* --- מצב גלובלי --- */
let selectedYear = 2025,
    selectedMonth = 8,
    editingRowId  = null;

/* --- כלי עזר --- */
function parseTimeStr(str) {
  if (!str) return 0;
  const [hh, mm] = str.split(":");
  return parseInt(hh || "0", 10) * 60 + parseInt(mm || "0", 10);
}

/* --- חישוב שעות יומיות --- */
function calcNormalDayHours(dayType, startVal, endVal, breakVal) {
  const workRules      = appData.userSettings?.workRules || {};
  const overtimeType   = workRules.overtimeType || "daily";
  const threshold      = workRules.dailyHours   || 8;
  const shortThreshold = workRules.shortDayHours|| 7;
  const wage           = appData.userSettings?.hourlyWage || 50;

  const startM = parseTimeStr(startVal);
  const endM   = parseTimeStr(endVal);
  let totalM   = endM - startM - breakVal;
  if (totalM < 0) totalM = 0;
  const totalH = totalM / 60;

  let regularH = 0, extraH1 = 0, extraH2 = 0, amount = 0, extraHours = 0;

  if (dayType === "חג") {
    amount = totalH * wage * 1.5;
    extraHours = totalH;

  } else if (dayType === "ערב חג") {
    if (totalH <= shortThreshold) {
      amount = totalH * wage;
    } else {
      const over = totalH - shortThreshold;
      extraH1 = Math.min(over, 2);
      extraH2 = Math.max(over - 2, 0);
      amount  = shortThreshold * wage +
                extraH1 * wage * 1.25 +
                extraH2 * wage * 1.5;
      extraHours = extraH1 + extraH2;
    }

  } else if (dayType === "שבת") {
    amount = totalH * wage * 1.5;
    extraHours = totalH;

  } else if (dayType === "שישי") {
    const isFiveDaySector = (workRules.dailyHours === 8.6);
    if (isFiveDaySector) {
      extraH1 = Math.min(totalH, 2);
      extraH2 = Math.max(totalH - 2, 0);
      amount  = extraH1 * wage * 1.25 + extraH2 * wage * 1.5;
      extraHours = totalH;
    } else {
      if (totalH <= 5) {
        amount = totalH * wage;
        regularH = totalH;
      } else {
        regularH = 5;
        const over = totalH - 5;
        extraH1 = Math.min(over, 2);
        extraH2 = Math.max(over - 2, 0);
        amount  = regularH * wage +
                  extraH1 * wage * 1.25 +
                  extraH2 * wage * 1.5;
        extraHours = extraH1 + extraH2;
      }
    }

  } else if (overtimeType === "daily") {
    if (totalH <= threshold) {
      regularH = totalH;
      amount = totalH * wage;
    } else {
      regularH = threshold;
      const over = totalH - threshold;
      extraH1 = Math.min(over, 2);
      extraH2 = Math.max(over - 2, 0);
      amount  = regularH * wage +
                extraH1 * wage * 1.25 +
                extraH2 * wage * 1.5;
      extraHours = extraH1 + extraH2;
    }

  } else {
    amount = totalH * wage;
  }

  return { totalHours: totalH, extraHours, amount };
}

/* --- רצף ימי מחלה --- */
function getSickDaySequence(dateVal) {
  const [yyyy, mm, dd] = dateVal.split("-").map(Number);
  let currentDate = new Date(yyyy, mm - 1, dd);
  let sequence = 1;

  while (true) {
    currentDate.setDate(currentDate.getDate() - 1);
    const y  = currentDate.getFullYear();
    const m  = currentDate.getMonth() + 1;
    const d  = String(currentDate.getDate()).padStart(2, "0");
    const mS = String(m).padStart(2, "0");
    const prevStr = `${y}-${mS}-${d}`;

    const monthly = getMonthlyData(y, m);
    const prevRow = monthly.timesheet.find(r => r.date === prevStr);
    if (!prevRow) break;
    if (prevRow.dayType === "מחלה") sequence++;
    else break;
  }
  return sequence;
}

/* --- חישובי יום מיוחד --- */
function calcSpecialDayPay(dayType, dateVal) {
  const s    = appData.specialDaysSettings || {};
  const wage = appData.userSettings?.hourlyWage || 50;

  if (dayType === "מילואים") return s.milAmount || 300;

  if (dayType === "חופש") {
    const vac = s.vacation || { hours: 8, percent: 100 };
    const h   = vac.hours   || 8;
    const p   = (vac.percent || 100) / 100;
    return h * p * wage;
  }

  if (dayType === "מחלה") {
    const sequence = getSickDaySequence(dateVal);
    const sd = s.sickDays || {};
    let percent = 0;

    if (sequence === 1) percent = sd.day1?.percent ?? 0;
    else if (sequence === 2) percent = sd.day2?.percent ?? 0;
    else if (sequence === 3) percent = sd.day3?.percent ?? 0;
    else percent = sd.day4Plus?.percent ?? 100;

    const hours = appData.userSettings?.workRules?.dailyHours || 8;
    return (percent / 100) * hours * wage;
  }
  return 0;
}

/* --- UI עזר: הסתרת שדות זמנים --- */
function onDayTypeChange(dayType) {
  const timeRows = document.querySelectorAll(".time-row");
  const breakRow = document.querySelector(".break-row");
  const hide = ["חופש", "מחלה", "מילואים"].includes(dayType);

  timeRows.forEach(r => {
    r.style.display = hide ? "none" : "flex";
    r.querySelectorAll("input").forEach(i => (i.disabled = hide));
  });
  breakRow.style.display = hide ? "none" : "flex";
  breakRow.querySelector("input").disabled = hide;
}

/* --- פתיחת/סגירת טופס יום חדש --- */
function openDayFormNew() {
  editingRowId = null;
  document.getElementById("dayFormTitle").textContent = "הוספת יום";
  document.getElementById("deleteBtn").style.display  = "none";

  const f = document.getElementById("dayForm");
  f.reset();
  f.querySelector('input[name="dailyBreak"]').value = 30;

  document.querySelectorAll(".time-row").forEach(r=>{
    r.style.display = "flex";
    r.querySelectorAll("input").forEach(i => (i.disabled = false));
  });
  const br = document.querySelector(".break-row");
  br.style.display = "flex";
  br.querySelector("input").disabled = false;

  document.getElementById("dayFormOverlay").classList.add("show");
}
function closeDayForm(){
  document.getElementById("dayFormOverlay").classList.remove("show");
}

/* --- עריכה/מחיקה --- */
function openEditForm(rowId) {
  editingRowId = rowId;
  document.getElementById("dayFormTitle").textContent = "עריכת יום";
  document.getElementById("deleteBtn").style.display  = "inline-block";

  const monthly = getMonthlyData(selectedYear, selectedMonth);
  const row     = monthly.timesheet.find(r => r.id === rowId);
  if (!row) return;

  const f = document.getElementById("dayForm");
  f.querySelector('input[type="date"]').value            = row.date   || "";
  f.querySelector('select[name="dayType"]').value        = row.dayType||"רגיל";
  f.querySelector('input[name="dailyBreak"]').value      = row.breakVal||30;
  f.querySelector('select[name="nightVal"]').value       = row.nightVal||"לא";
  f.querySelector('textarea[name="notes"]').value        = row.notes   || "";

  onDayTypeChange(row.dayType);

  if (row.start) f.querySelectorAll('input[type="time"]')[0].value = row.start;
  if (row.end)   f.querySelectorAll('input[type="time"]')[1].value = row.end;

  document.getElementById("dayFormOverlay").classList.add("show");
}

function handleDeleteDay() {
  if (!editingRowId) return;
  const monthly = getMonthlyData(selectedYear, selectedMonth);
  const idx = monthly.timesheet.findIndex(r => r.id === editingRowId);
  if (idx !== -1) {
    monthly.timesheet.splice(idx, 1);
    saveData();
  }
  redrawTable();
  closeDayForm();
}

/* --- שמירת טופס --- */
function handleDayFormSubmit(e) {
  e.preventDefault();
  const f = e.target;

  const dateVal = f.querySelector('input[type="date"]').value;
  if (!dateVal) return;

  const [yyStr, mmStr] = dateVal.split("-");
  const dayYear  = +yyStr;
  const dayMonth = +mmStr;

  let dayType = f.querySelector('select[name="dayType"]').value;
  const dayOfWeek = new Date(dateVal).getDay();
  if (dayOfWeek === 5) dayType = "שישי";
  else if (dayOfWeek === 6) dayType = "שבת";

  const breakVal = +f.querySelector('input[name="dailyBreak"]').value || 0;
  const nightVal = f.querySelector('select[name="nightVal"]').value   || "לא";
  const notesVal = f.querySelector('textarea[name="notes"]').value    || "";

  let totalHours = 0, extraHours = 0, amount = 0;

  if (["חופש","מחלה","מילואים"].includes(dayType)) {
    amount = calcSpecialDayPay(dayType, dateVal);
  } else {
    const startVal = f.querySelectorAll('input[type="time"]')[0].value || "";
    const endVal   = f.querySelectorAll('input[type="time"]')[1].value || "";
    const res = calcNormalDayHours(dayType, startVal, endVal, breakVal);
    totalHours = res.totalHours;
    extraHours = res.extraHours;
    amount     = res.amount;
  }

  const monthlyOld = getMonthlyData(selectedYear, selectedMonth);
  const monthlyNew = getMonthlyData(dayYear, dayMonth);

  if (!editingRowId) {
    const rowObj = {
      id: "day-" + Date.now(),
      date: dateVal, dayType, breakVal, nightVal, notes: notesVal,
      totalHours, extraHours, amount
    };
    if (!["חופש","מחלה","מילואים"].includes(dayType)) {
      rowObj.start = f.querySelectorAll('input[type="time"]')[0].value || "";
      rowObj.end   = f.querySelectorAll('input[type="time"]')[1].value || "";
    }
    /* הוספה לפי תאריך */
    const idx = monthlyNew.timesheet.findIndex(r => {
      if (r.date > rowObj.date) return true;
      if (r.date === rowObj.date) {
        const rStart = parseTimeStr(r.start || "00:00");
        const nStart = parseTimeStr(rowObj.start || "00:00");
        return nStart < rStart;
      }
      return false;
    });
    if (idx === -1) monthlyNew.timesheet.push(rowObj);
    else monthlyNew.timesheet.splice(idx, 0, rowObj);

  } else {
    const oldRow = monthlyOld.timesheet.find(r => r.id === editingRowId);
    if (oldRow) {
      const movingMonth = (dayYear !== selectedYear || dayMonth !== selectedMonth);
      if (movingMonth) {
        monthlyOld.timesheet = monthlyOld.timesheet.filter(r => r.id !== editingRowId);
        oldRow.date = dateVal; oldRow.dayType = dayType;
        oldRow.breakVal = breakVal; oldRow.nightVal = nightVal; oldRow.notes = notesVal;
        oldRow.totalHours = totalHours; oldRow.extraHours = extraHours; oldRow.amount = amount;
        if (!["חופש","מחלה","מילואים"].includes(dayType)) {
          oldRow.start = f.querySelectorAll('input[type="time"]')[0].value || "";
          oldRow.end   = f.querySelectorAll('input[type="time"]')[1].value || "";
        } else { oldRow.start = ""; oldRow.end = ""; }
        monthlyNew.timesheet.push(oldRow);
      } else {
        Object.assign(oldRow, {
          date: dateVal, dayType, breakVal, nightVal, notes: notesVal,
          totalHours, extraHours, amount
        });
        if (!["חופש","מחלה","מילואים"].includes(dayType)) {
          oldRow.start = f.querySelectorAll('input[type="time"]')[0].value || "";
          oldRow.end   = f.querySelectorAll('input[type="time"]')[1].value || "";
        } else { oldRow.start = ""; oldRow.end = ""; }
      }
    }
  }

  saveData();
  setCurrentMonth(dayYear, dayMonth);
  closeDayForm();
  localStorage.setItem("detailedYear",  dayYear);
  localStorage.setItem("detailedMonth", dayMonth);
}

/* --- ציור טבלה --- */
function redrawTable() {
  const monthly = getMonthlyData(selectedYear, selectedMonth);
  const body = document.getElementById("timesheetBody");
  body.innerHTML = "";

  let sumH = 0, sumAmt = 0;
  monthly.timesheet.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td><td>${r.start || ""}</td><td>${r.end || ""}</td>
      <td>${r.dayType || ""}</td><td>${r.breakVal || 0}</td><td>${r.nightVal || "לא"}</td>
      <td>${(r.totalHours || 0).toFixed(2)}</td><td>${(r.extraHours || 0).toFixed(2)}</td>
      <td>₪${(r.amount || 0).toFixed(2)}</td><td>${r.notes || ""}</td>`;
    tr.addEventListener("click", () => openEditForm(r.id));
    body.appendChild(tr);

    sumH   += r.totalHours || 0;
    sumAmt += r.amount     || 0;
  });
  document.getElementById("totalHours").textContent  = sumH.toFixed(2);
  document.getElementById("totalAmount").textContent = "₪" + sumAmt.toFixed(2);
}

/* --- ניווט חודשים --- */
function updateMonthYearDisplay() {
  const mName = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני",
                 "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  document.getElementById("monthYearDisplay").textContent =
    `${mName[selectedMonth-1]} ${selectedYear}`;
}
function prevMonth() {
  if (selectedMonth > 1) selectedMonth--;
  else { selectedMonth = 12; selectedYear--; }
  setCurrentMonth(selectedYear, selectedMonth);
}
function nextMonth() {
  if (selectedMonth < 12) selectedMonth++;
  else { selectedMonth = 1; selectedYear++; }
  setCurrentMonth(selectedYear, selectedMonth);
}
function setCurrentMonth(y, m) {
  selectedYear = y; selectedMonth = m;
  localStorage.setItem("detailedYear",  y);
  localStorage.setItem("detailedMonth", m);
  updateMonthYearDisplay();
  redrawTable();
}

function openExcelOverlay() {
    document.getElementById("excelOverlay").classList.add("show");
    document.getElementById("excelYear").value = selectedYear;
    document.getElementById("excelMonth").value = selectedMonth;
  }
  
  function closeExcelOverlay() {
    document.getElementById("excelOverlay").classList.remove("show");
  }
  
  async function handleExcelExport() {
    const y = +document.getElementById("excelYear").value;
    const m = +document.getElementById("excelMonth").value;
    const rows = getMonthlyData(y, m).timesheet;
    if (!rows.length) return alert("אין נתונים לחודש שבחרת!");
  
    let csv = "\uFEFF" + "תאריך,כניסה,יציאה,סוג יום,הפסקה,לילה/שבת,שעות מחושבות,שעות נוספות,סכום,הערות\n";
    rows.forEach(r => {
      csv += [
        r.date, r.start || "", r.end || "", r.dayType || "", r.breakVal || 0,
        r.nightVal || "לא", (r.totalHours || 0).toFixed(2), (r.extraHours || 0).toFixed(2),
        "₪" + (r.amount || 0).toFixed(2), (r.notes || "").replace(/,/g, " ")
      ].join(",") + "\n";
    });
  
    const fileName = `Timesheet_${y}-${m < 10 ? "0" + m : m}.csv`;
  
    try {
      if (!Capacitor?.isNativePlatform()) {
        // הורדה רגילה בדפדפן
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
  
      const { Filesystem, Directory, Browser } = Capacitor.Plugins;
  
      await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Documents,
        encoding: "utf8",
      });
  
      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents,
      });
  
      // במקום שיתוף – פתיחה בדפדפן הקבצים
      await Browser.open({ url: uri });
  
    } catch (err) {
      console.error("❌ שגיאה:", err);
      alert("⚠️ לא הצלחנו לפתוח את הקובץ. ודא שהרשאות מופעלות.");
    }
  }
  
  
  
/* --- INIT --- */
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const t = new Date();
  setCurrentMonth(t.getFullYear(), t.getMonth() + 1);

  /* תאריך/שעה בראש המסך */
  const refreshDateTime = () => {
    const now = new Date();
    document.getElementById("currentDate").textContent = now.toLocaleDateString("he-IL");
    document.getElementById("currentTime").textContent = now.toLocaleTimeString("he-IL");
  };
  refreshDateTime();
  setInterval(refreshDateTime, 1000);

  /* מאזינים */
  document.getElementById("prevMonth").addEventListener("click", prevMonth);
  document.getElementById("nextMonth").addEventListener("click", nextMonth);

  document.querySelectorAll(".month-button").forEach(btn => {
    btn.addEventListener("click", () => setCurrentMonth(selectedYear, +btn.dataset.month));
  });

  document.getElementById("monthYearDisplay").addEventListener("click", () => {
    const sel = document.getElementById("yearSelector");
    sel.style.display = sel.style.display === "inline-block" ? "none" : "inline-block";
  });

  document.getElementById("yearSelector").addEventListener("change", e => {
    selectedYear  = +e.target.value;
    selectedMonth = 1;
    setCurrentMonth(selectedYear, selectedMonth);
    e.target.style.display = "none";
  });

  document.getElementById("dayForm").addEventListener("submit", handleDayFormSubmit);
  document.getElementById("deleteBtn").addEventListener("click", handleDeleteDay);
  document.querySelector('select[name="dayType"]').addEventListener("change", e => onDayTypeChange(e.target.value));

  document.getElementById("excelCancelBtn").addEventListener("click", closeExcelOverlay);
  document.getElementById("excelExportBtn").addEventListener("click", handleExcelExport);
});

/* --- עדכון זמן בפינה גם אם העמוד נטען ללא DOMContentLoaded (גיבוי) --- */
function refreshDateTime(){
  const now=new Date();
  document.getElementById('currentDate').textContent = now.toLocaleDateString('he-IL');
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('he-IL');
}
setInterval(refreshDateTime, 1000);
const isCapacitor = !!window.Capacitor;
let Filesystem, Directory, Share;

if (isCapacitor) {
  Filesystem = Capacitor.Plugins.Filesystem;
  Directory = Capacitor.Plugins.FilesystemDirectory || Capacitor.Plugins.Directory;
  Share = Capacitor.Plugins.Share;
}
