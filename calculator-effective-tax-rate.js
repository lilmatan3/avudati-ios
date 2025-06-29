// calculator-effective-tax-rate.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const income   = parseFloat(document.getElementById('income').value)   || 0;
  const taxPaid  = parseFloat(document.getElementById('taxPaid').value)  || 0;

  if (income <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י הכנסה תקינה (גדולה מאפס).';
    return;
  }
  if (taxPaid < 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י סכום מס תקין (לא שלילי).';
    return;
  }
  if (taxPaid > income) {
    document.getElementById('result').textContent =
      'סך המס אינו יכול להיות גבוה מההכנסה.';
    return;
  }

  // שיעור מס ממוצע = (סך מס / הכנסה) * 100
  const ratePercent = (taxPaid / income) * 100;

  document.getElementById('result').textContent =
    `שיעור מס ממוצע: ${ratePercent.toFixed(2)}%`;
});
