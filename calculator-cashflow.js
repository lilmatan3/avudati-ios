// calculator-cashflow.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const rateInput = parseFloat(document.getElementById('rate').value);
  const rate = isNaN(rateInput) ? 0 : rateInput / 100;
  const flowsStr = document.getElementById('flows').value.trim();

  if (rate < 0) {
    return document.getElementById('result').textContent =
      'אנא הכנס/י שיעור עדכון תקני.';
  }
  if (!flowsStr) {
    return document.getElementById('result').textContent =
      'אנא הכנס/י תזרים מזומנים אחד לפחות.';
  }

  const flows = flowsStr
    .split(',')
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));

  if (flows.length === 0) {
    return document.getElementById('result').textContent =
      'לא נמצא תזרים תקף. בדוק/י את הקלט.';
  }

  // חישוב NPV: סכום CF_t / (1+rate)^t
  let npv = 0;
  flows.forEach((cf, t) => {
    npv += cf / Math.pow(1 + rate, t);
  });

  document.getElementById('result').textContent =
    `NPV משוער: ₪${npv.toFixed(2)}`;
});
