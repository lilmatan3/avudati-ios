// calculator-currency.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const rate   = parseFloat(document.getElementById('rate').value)   || 0;

  if (amount < 0 || rate < 0) {
    document.getElementById('result').textContent =
      'אנא הכנס/י ערכים חיוביים.';
    return;
  }

  const converted = amount * rate;
  document.getElementById('result').textContent =
    `תוצאה: ₪ ${converted.toFixed(2)}`;
});
