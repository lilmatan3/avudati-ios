// calculator-dividend.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const D = parseFloat(document.getElementById('dividend').value) || 0;
  const P = parseFloat(document.getElementById('price').value)    || 0;

  if (D < 0 || P <= 0) {
    document.getElementById('result').textContent =
      'אנא הכנס/י ערכים חיוביים; מחיר המניה חייב להיות גדול מאפס.';
    return;
  }

  // Dividend yield = (D / P) * 100
  const yieldPercent = (D / P) * 100;

  document.getElementById('result').textContent =
    `שיעור דיבידנד: ${yieldPercent.toFixed(2)}%`;
});
