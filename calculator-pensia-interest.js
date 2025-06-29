// calculator-pensia-interest.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const P = parseFloat(document.getElementById('principal').value) || 0;
  const r = (parseFloat(document.getElementById('rate').value) || 0) / 100;
  const n = parseInt(document.getElementById('times').value)       || 1;
  const t = parseFloat(document.getElementById('years').value)     || 0;

  const output = document.getElementById('result');
  if (P <= 0 || r < 0 || n < 1 || t <= 0) {
    output.textContent = 'אנא הכנס/י ערכים תקינים בכל השדות.';
    return;
  }

  // A = P * (1 + r/n)^(n*t)
  const A = P * Math.pow(1 + r / n, n * t);

  output.textContent =
    `ערך עתידי של קרן השתלמות: ₪${A.toFixed(2)}`;
});
