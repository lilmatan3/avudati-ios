// calculator-settlement-discount.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const amount   = parseFloat(document.getElementById('taxAmount').value)    || 0;
  const discount = parseFloat(document.getElementById('discountRate').value) || 0;
  const output   = document.getElementById('result');

  if (amount < 0 || discount < 0 || discount > 100) {
    output.textContent = 'אנא הזן/י ערכים תקינים: סכום ≥ 0, 0 ≤ אחוז ≤ 100.';
    return;
  }

  const discountValue = amount * (discount / 100);
  const netTax         = amount - discountValue;

  output.textContent =
    `הנחת מס: ₪${discountValue.toFixed(2)}, ` +
    `מס לאחר הנחה: ₪${netTax.toFixed(2)}`;
});
