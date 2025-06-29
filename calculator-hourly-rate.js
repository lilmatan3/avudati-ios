// calculator-hourly-rate.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const salary = parseFloat(document.getElementById('monthlySalary').value) || 0;
  const hours  = parseFloat(document.getElementById('monthlyHours').value)  || 0;

  if (salary <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י שכר חודשי חיובי.';
    return;
  }
  if (hours <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י מספר שעות חודשי תקין (גדול מאפס).';
    return;
  }

  const ratePerHour = salary / hours;

  document.getElementById('result').textContent =
    `תעריף שעה משוער: ₪ ${ratePerHour.toFixed(2)}`;
});
