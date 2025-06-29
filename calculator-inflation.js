// calculator-inflation.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const cpiStart = parseFloat(document.getElementById('cpiStart').value) || 0;
  const cpiEnd   = parseFloat(document.getElementById('cpiEnd').value)   || 0;

  if (cpiStart <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י מדד התחלתי גדול מאפס.';
    return;
  }
  if (cpiEnd <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י מדד סופי גדול מאפס.';
    return;
  }

  // שיעור אינפלציה = ((CPI_end / CPI_start) - 1) * 100
  const inflationRate = (cpiEnd / cpiStart - 1) * 100;

  document.getElementById('result').textContent =
    `שיעור אינפלציה: ${inflationRate.toFixed(2)}%`;
});
