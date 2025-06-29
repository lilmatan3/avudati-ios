// calculator-income-tax.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const income       = parseFloat(document.getElementById('income').value)       || 0;
  const ratePercent  = parseFloat(document.getElementById('taxRate').value)     || 0;
  const points       = parseFloat(document.getElementById('creditPoints').value) || 0;
  const pointValue   = parseFloat(document.getElementById('pointValue').value)  || 0;

  if (income < 0 || ratePercent < 0 || ratePercent > 100 ||
      points < 0 || pointValue < 0) {
    document.getElementById('result').textContent =
      'אנא הכנס/י ערכים תקינים (לא שליליים, אחוז ≤ 100).';
    return;
  }

  const baseTax  = income * (ratePercent / 100);
  const creditDeduction = points * pointValue;
  let tax = baseTax - creditDeduction;
  if (tax < 0) tax = 0;

  document.getElementById('result').textContent =
    `מס לאחר נקודות זיכוי: ₪${tax.toFixed(2)} (בסיסי: ₪${baseTax.toFixed(2)}, זיכוי: ₪${creditDeduction.toFixed(2)})`;
});
