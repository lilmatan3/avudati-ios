// calculator-severance.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const salary = parseFloat(document.getElementById('monthlySalary').value)    || 0;
  const years  = parseFloat(document.getElementById('yearsOfService').value)   || 0;
  const output = document.getElementById('result');

  if (salary <= 0) {
    output.textContent = 'אנא הכנס/י שכר חודשי חיובי.';
    return;
  }
  if (years < 0) {
    output.textContent = 'אנא הכנס/י שנות ותק לא שליליות.';
    return;
  }

  // חישוב פיצויי פיטורין: שכר חודשי × שנות ותק
  const severancePay = salary * years;

  output.textContent =
    `פיצויי פיטורין משוערים: ₪${severancePay.toFixed(2)}`;
});
