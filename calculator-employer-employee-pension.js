// calculator-employer-employee-pension.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const salary = parseFloat(document.getElementById('salary').value) || 0;
  const eRate  = (parseFloat(document.getElementById('employeeRate').value)  || 0) / 100;
  const erRate = (parseFloat(document.getElementById('employerRate').value)  || 0) / 100;

  if (salary <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י שכר חיובי.';
    return;
  }
  if (eRate < 0 || erRate < 0) {
    document.getElementById('result').textContent =
      'האחוזים חייבים להיות לא שליליים.';
    return;
  }

  const employeeContrib = salary * eRate;
  const employerContrib = salary * erRate;
  const totalContrib    = employeeContrib + employerContrib;

  document.getElementById('result').textContent =
    `הפקדת עובד: ₪${employeeContrib.toFixed(2)} • הפקדת מעסיק: ₪${employerContrib.toFixed(2)} • סה"כ: ₪${totalContrib.toFixed(2)}`;
});
