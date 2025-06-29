// calculator-leave-offset.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const hourlyRate    = parseFloat(document.getElementById('hourlyRate').value)    || 0;
  const vacationHours = parseFloat(document.getElementById('vacationHours').value) || 0;
  const sickHours     = parseFloat(document.getElementById('sickHours').value)     || 0;

  if (hourlyRate <= 0) {
    return document.getElementById('result').textContent =
      'אנא הכנס/י שכר לשעה חיובי.';
  }
  if (vacationHours < 0 || sickHours < 0) {
    return document.getElementById('result').textContent =
      'מספר השעות לא יכול להיות שלילי.';
  }

  const vacationDeduction = hourlyRate * vacationHours;
  const sickDeduction     = hourlyRate * sickHours;
  const totalDeduction    = vacationDeduction + sickDeduction;

  document.getElementById('result').textContent =
    `קיזוז חופשה: ₪${vacationDeduction.toFixed(2)}, קיזוז מחלה: ₪${sickDeduction.toFixed(2)} → סה"כ קיזוז: ₪${totalDeduction.toFixed(2)}`;
});
