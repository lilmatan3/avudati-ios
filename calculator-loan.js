// calculator-loan.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const P = parseFloat(document.getElementById('principal').value)   || 0;
  const annualRate = parseFloat(document.getElementById('annualRate').value) || 0;
  const years      = parseFloat(document.getElementById('termYears').value)  || 0;

  if (P <= 0 || annualRate < 0 || years <= 0) {
    document.getElementById('result').textContent =
      'אנא הכנס/י ערכים חיוביים תקינים בכל השדות.';
    return;
  }

  // r חודשית
  const rMonthly = (annualRate / 100) / 12;
  const n = years * 12;

  // תשלום חודשי: A = P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + rMonthly, n);
  const monthlyPayment = P * (rMonthly * factor) / (factor - 1);

  // ריבית אפקטיבית שנתית: (1 + rMonthly)^12 - 1
  const effectiveAnnual = Math.pow(1 + rMonthly, 12) - 1;

  document.getElementById('result').textContent =
    `תשלום חודשי: ₪${monthlyPayment.toFixed(2)} • ריבית אפקטיבית שנתית: ${(effectiveAnnual * 100).toFixed(2)}%`;
});
