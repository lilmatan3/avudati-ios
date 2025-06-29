// calculator-bruto-neto.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const bruto   = parseFloat(document.getElementById('gross').value)     || 0;
  const tax     = parseFloat(document.getElementById('taxRate').value)  / 100 || 0;
  const ni      = parseFloat(document.getElementById('niRate').value)   / 100 || 0;
  const health  = parseFloat(document.getElementById('healthRate').value) / 100 || 0;

  // אם רוצים גם הודעת שגיאה לערכים לא תקינים:
  if (bruto <= 0) {
    return document.getElementById('result').textContent = 'הכנס/י שכר ברוטו תקני.';
  }

  // חישוב ניכויים ושכר נטו
  const deductions = bruto * (tax + ni + health);
  const net = bruto - deductions;

  document.getElementById('result').textContent =
    `שכר נטו משוער: ₪ ${net.toFixed(2)}`;
});
