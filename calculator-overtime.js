// calculator-overtime.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const hourly = parseFloat(document.getElementById('hourlyRate').value) || 0;
  const h125   = parseFloat(document.getElementById('hours125').value)    || 0;
  const h150   = parseFloat(document.getElementById('hours150').value)    || 0;

  const pay125 = hourly * 1.25 * h125;
  const pay150 = hourly * 1.5  * h150;
  const total  = pay125 + pay150;

  document.getElementById('result').textContent =
    `סה"כ תשלום שעות נוספות: ₪${total.toFixed(2)} (125%: ₪${pay125.toFixed(2)}, 150%: ₪${pay150.toFixed(2)})`;
});
