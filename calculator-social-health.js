// calculator-social-health.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const income             = parseFloat(document.getElementById('income').value)    || 0;
  const niRatePercent      = parseFloat(document.getElementById('niRate').value)   || 0;
  const healthRatePercent  = parseFloat(document.getElementById('healthRate').value) || 0;
  const output             = document.getElementById('result');

  // ולידציה
  if (income <= 0) {
    output.textContent = 'אנא הכנס/י הכנסה חיובית.';
    return;
  }
  if (niRatePercent < 0 || niRatePercent > 100 ||
      healthRatePercent < 0 || healthRatePercent > 100) {
    output.textContent = 'אנא הכנס/י אחוזים תקינים (0–100).';
    return;
  }

  const niRate     = niRatePercent / 100;
  const healthRate = healthRatePercent / 100;

  const ni        = income * niRate;
  const health    = income * healthRate;
  const totalDed  = ni + health;
  const net       = income - totalDed;

  output.textContent =
    `ביטוח לאומי: ₪${ni.toFixed(2)} • מס בריאות: ₪${health.toFixed(2)} • ` +
    `סה"כ ניכויים: ₪${totalDed.toFixed(2)} → נטו לאחר ניכויים: ₪${net.toFixed(2)}`;
});
