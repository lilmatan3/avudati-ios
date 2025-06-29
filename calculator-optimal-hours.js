// calculator-optimal-hours.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const income = parseFloat(document.getElementById('targetIncome').value) || 0;
  const rate   = parseFloat(document.getElementById('hourlyRate').value)  || 0;

  const resultEl = document.getElementById('result');
  if (income <= 0 || rate <= 0) {
    resultEl.textContent = 'אנא הכנס/י ערכים חיוביים בכל השדות.';
    return;
  }

  // חישוב שעות דרושות
  const hoursDecimal = income / rate;
  const hoursInt = Math.floor(hoursDecimal);
  const minutes = Math.round((hoursDecimal - hoursInt) * 60);

  resultEl.textContent =
    `כדי להגיע להכנסה של ₪${income.toFixed(2)}, יש לעבוד כ־` +
    `${hoursInt} שעות ו־${minutes} דקות (` +
    `≈ ${hoursDecimal.toFixed(2)} שעות).`;
});
