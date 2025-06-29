const STORAGE_KEY = 'salaryAppData';

let appData = {
  userSettings: {
    hourlyWage: 34.32,
    sector: "",
    startDay: 1,
    startDate: "",
    workRules: {}
  },
  taxSettings: {
    taxExempt: false,
    creditPoints: 2.25,
    hishtalmut: 0,
    pension: 6,
    severance: 8.33,
    jobOnly: true,
    noBituahLeumi: false,
    noHealthTax: false,
    enableSettlementDiscount: false,
    settlementDiscountPercent: 0,
    settlementAnnualLimit: 0
  },
  specialDaysSettings: {
    havraAmount: 418,
    milAmount: 300,
    sickDays: {
      day1: { percent: 0 },
      day2: { percent: 50 },
      day3: { percent: 75 },
      day4Plus: { percent: 100 }
    },
    vacation: {
      hours: 8,
      percent: 100
    }
  },
  additionalSalaryData: {
    bonusAmount: 0,
    carValue: 0,
    carIncludeInGross: false,
    carIncludeInTax: false,
    carIncludeInPension: false,
    mealValue: 0,
    travelRefund: 0,
    shiftAddition: 0,
    phoneAllowance: 0,
    globalOvertime: 0,
    giftValue: 0,
    mealsIncludeShortDays: false,
    havraaValue: 378,
    havraaPayments: []
  },
  manualAdjustments: [],
  deductions: {
    fixedTransactions: [],          // נשמרים לכל חודש
    monthlyTransactions: {}         // לפי מפתח: '2025-04': [array of transactions]
  },
  months: {}
};

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      appData = Object.assign({}, appData, parsed);

      appData.taxSettings = Object.assign({
        taxExempt: false,
        creditPoints: 2.25,
        hishtalmut: 0,
        pension: 6,
        severance: 8.33,
        jobOnly: true,
        noBituahLeumi: false,
        noHealthTax: false,
        enableSettlementDiscount: false,
        settlementDiscountPercent: 0,
        settlementAnnualLimit: 0
      }, parsed.taxSettings || {});

      appData.additionalSalaryData = Object.assign({
        bonusAmount: 0,
        carValue: 0,
        carIncludeInGross: false,
        carIncludeInTax: false,
        carIncludeInPension: false,
        mealValue: 0,
        travelRefund: 0,
        shiftAddition: 0,
        phoneAllowance: 0,
        globalOvertime: 0,
        giftValue: 0,
        mealsIncludeShortDays: false,
        havraaValue: 378,
        havraaPayments: []
      }, parsed.additionalSalaryData || {});

      appData.manualAdjustments = parsed.manualAdjustments || [];

      appData.deductions = Object.assign(
        {
          fixedTransactions: [],
          monthlyTransactions: {}
        },
        parsed.deductions || {}
      );

      appData.specialDaysSettings = Object.assign({
        havraAmount: 418,
        milAmount: 300,
        sickDays: {
          day1: { percent: 0 },
          day2: { percent: 50 },
          day3: { percent: 75 },
          day4Plus: { percent: 100 }
        },
        vacation: {
          hours: 8,
          percent: 100
        }
      }, parsed.specialDaysSettings || {});
    }
  } catch (e) {
    console.error('Error loading saved data:', e);
  }
}

function getMonthlyData(year, month) {
  const key = `${year}-${month}`;
  if (!appData.months[key]) {
    appData.months[key] = {
      year,
      month,
      timesheet: []
    };
  }
  return appData.months[key];
}

function getSalaryComponents(year, month) {
  loadData();
  const key = `${year}-${month}`;
  const monthData = appData.months[key] || { timesheet: [] };

  const timesheet = monthData.timesheet || [];
  const wage = appData.userSettings?.hourlyWage || 0;
  const workRules = appData.userSettings?.workRules || {};
  const additions = appData.additionalSalaryData || {};
  const includeShortDays = additions.mealsIncludeShortDays;

  const workHours = {
    regular: { hours: 0, amount: 0 },
    overtime: { hours: 0, amount: 0 },
    friday125: { hours: 0, amount: 0 },
    friday150: { hours: 0, amount: 0 },
    saturday: { hours: 0, amount: 0 },
    holiday: { hours: 0, amount: 0 }
  };

  const vacation = { days: 0, amount: 0 };
  const sick = { amount: 0 };
  const miluim = { days: 0, amount: 0 };

  let mealDays = 0;

  timesheet.forEach(entry => {
    const type = entry.dayType;
    const hours = entry.totalHours || 0;
    const amount = entry.amount || 0;
    const dateObj = new Date(entry.date);
    const dayOfWeek = dateObj.getDay();

    const isShortDay = dayOfWeek === 5 || entry.dayType === "ערב חג";
    const isWeekendOrHoliday = ["חג", "שבת"].includes(type) || dayOfWeek === 6;

    const isNonMealDay =
      type === "חופש" ||
      type === "מחלה" ||
      type === "מילואים" ||
      (!includeShortDays && isShortDay) ||
      isWeekendOrHoliday;

    if (!isNonMealDay) mealDays++;

    if (type === "חופש") {
      vacation.days += 1;
      vacation.amount += amount;
    } else if (type === "מחלה") {
      sick.amount += amount;
    } else if (type === "מילואים") {
      miluim.days += 1;
      miluim.amount += amount;
    } else if (type === "חג") {
      workHours.holiday.hours += hours;
      workHours.holiday.amount += amount;
    } else if (type === "שבת" || dayOfWeek === 6) {
      workHours.saturday.hours += hours;
      workHours.saturday.amount += amount;
    } else if (type === "שישי" || dayOfWeek === 5) {
      const isFiveDay = workRules.dailyHours === 8.6;
      if (!isShortDay && !additions.mealsIncludeShortDays) return;

      if (isFiveDay) {
        const extra125 = Math.min(hours, 2);
        const extra150 = Math.max(hours - 2, 0);
        workHours.friday125.hours += extra125;
        workHours.friday125.amount += extra125 * wage * 1.25;
        workHours.friday150.hours += extra150;
        workHours.friday150.amount += extra150 * wage * 1.5;
      } else {
        const regularH = Math.min(hours, 5);
        const extraH = Math.max(hours - 5, 0);
        const extra125 = Math.min(extraH, 2);
        const extra150 = Math.max(extraH - 2, 0);
        workHours.regular.hours += regularH;
        workHours.regular.amount += regularH * wage;
        workHours.friday125.hours += extra125;
        workHours.friday125.amount += extra125 * wage * 1.25;
        workHours.friday150.hours += extra150;
        workHours.friday150.amount += extra150 * wage * 1.5;
      }
    } else {
      const extra = entry.extraHours || 0;
      const regHours = Math.max(hours - extra, 0);
      workHours.regular.hours += regHours;
      workHours.regular.amount += wage * regHours;
      workHours.overtime.hours += extra;
      workHours.overtime.amount += amount - (wage * regHours);
    }
  });

  const pricePerMeal = additions.mealValue || 0;
  const mealDeduction = mealDays * pricePerMeal;

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const havraaList = additions.havraaPayments || [];
  const found = havraaList.find(h => h.month === monthStr);
  const havraa = found ? { days: found.count, amount: found.count * (additions.havraaValue || 378) } : { days: 0, amount: 0 };

  // שילוב כל העסקאות: קבועות + חד פעמיות לחודש הזה
  const fixed = appData.deductions.fixedTransactions || [];
  const monthly = appData.deductions.monthlyTransactions?.[monthStr] || [];
  const allTransactions = [...fixed, ...monthly];

  return {
    timesheet,
    workHours,
    specialDays: { vacation, sick, miluim },
    specialAdditions: { havraa },
    hourlyWage: wage,
    sector: appData.userSettings?.sector || "",
    startDate: appData.userSettings?.startDate || "",
    workRules,
    tax: appData.taxSettings || {},
    additions,
    deductions: allTransactions,
    mealDeduction,
    carValue: additions.carValue || 0
  };
}
