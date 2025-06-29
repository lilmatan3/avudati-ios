// calculator-neto-bruto.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const net    = parseFloat(document.getElementById('net').value)   || 0;
  const tax    = (parseFloat(document.getElementById('taxRate').value)  || 0) / 100;
  const ni     = (parseFloat(document.getElementById('niRate').value)   || 0) / 100;
  const health = (parseFloat(document.getElementById('healthRate').value) || 0) / 100;

  const totalRate = tax + ni + health;

  if (totalRate >= 1) {
    document.getElementById('result').textContent = 
      'שגיאה: סכום אחוזי הניכויים חייב להיות קטן מ‑100%.';
    return;
  }
  
  // נטו = ברוטו * (1 - totalRate)
  // ⇒ ברוטו = נטו / (1 - totalRate)
  const bruto = net / (1 - totalRate);

  document.getElementById('result').textContent =
    `שכר ברוטו משוער: ₪${bruto.toFixed(2)}`;
});
