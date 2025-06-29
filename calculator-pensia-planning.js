// calculator-pensia-planning.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const FV    = parseFloat(document.getElementById('targetAmount').value) || 0;
  const rAnn  = parseFloat(document.getElementById('annualRate').value)   || 0;
  const years = parseFloat(document.getElementById('years').value)        || 0;

  const resultEl = document.getElementById('result');
  if (FV <= 0 || rAnn < 0 || years <= 0) {
    resultEl.textContent = 'אנא הכנס/י ערכים חיוביים תקינים בכל השדות.';
    return;
  }

  const rMonthly = (rAnn / 100) / 12;
  const n = Math.ceil(years * 12);

  // Pmt = FV * [r / ((1+r)^n - 1)]
  const factor = Math.pow(1 + rMonthly, n) - 1;
  const payment = rMonthly > 0
    ? FV * (rMonthly / factor)
    : FV / n;

  resultEl.textContent =
    `הפקדה חודשית נדרשת: ₪${payment.toFixed(2)} לאורך ${n} תשלומים.`;
});
