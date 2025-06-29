// calculator-average-return.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const V0 = parseFloat(document.getElementById('start').value) || 0;
  const Vn = parseFloat(document.getElementById('end').value)   || 0;
  const t  = parseFloat(document.getElementById('years').value) || 0;

  if (V0 <= 0 || Vn <= 0 || t <= 0) {
    document.getElementById('result').textContent =
      'אנא הכנס/י ערכים חיוביים עבור כל השדות.';
    return;
  }

  // CAGR = (Vn / V0)^(1/t) - 1
  const cagr = Math.pow(Vn / V0, 1 / t) - 1;

  document.getElementById('result').textContent =
    `תשואה שנתית ממוצעת: ${(cagr * 100).toFixed(2)}%`;
});
