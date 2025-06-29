document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();

  const principalEl = document.getElementById('principal');
  const annualRateEl = document.getElementById('annualRate');
  const yearsEl = document.getElementById('termYears');
  const typeEl = document.getElementById('calcType');
  const resultEl = document.getElementById('result');

  const P = parseFloat(principalEl.value);
  const annualRate = parseFloat(annualRateEl.value);
  const years = parseFloat(yearsEl.value);
  const type = typeEl.value;

  // בדיקת תקינות ערכים
  if (isNaN(P) || isNaN(annualRate) || isNaN(years) || P <= 0 || annualRate < 0 || years <= 0) {
    resultEl.innerHTML = 'אנא הכנס/י ערכים חיוביים לכל השדות.';
    return;
  }

  const rMonthly = (annualRate / 100) / 12;
  const n = Math.ceil(years * 12);

  // חישוב שפיצר
  const factor = Math.pow(1 + rMonthly, n);
  const paymentShapitzer = P * (rMonthly * factor) / (factor - 1);

  // חישוב גרייס (ריבית בלבד)
  const paymentGrace = P * rMonthly;

  let output = '';
  if (type === 'shapitzer' || type === 'both') {
    output += `שפיצר – תשלום חודשי קבוע: ₪${paymentShapitzer.toFixed(2)}<br>`;
  }
  if (type === 'grace' || type === 'both') {
    output += `גרייס – ריבית חודשית בלבד: ₪${paymentGrace.toFixed(2)}`;
  }

  resultEl.innerHTML = output.trim();
});
