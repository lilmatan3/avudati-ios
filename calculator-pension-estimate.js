// calculator-pension-estimate.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  const avgSalary   = parseFloat(document.getElementById('avgSalary').value)   || 0;
  const years       = parseFloat(document.getElementById('years').value)       || 0;
  const accrualRate = parseFloat(document.getElementById('accrualRate').value) / 100 || 0;
  const resultEl    = document.getElementById('result');

  if (avgSalary <= 0 || years <= 0 || accrualRate <= 0) {
    resultEl.textContent = 'אנא ודא/י שהכנסת ערכים חיוביים בכל השדות.';
    return;
  }

  // נוסחת הצבירה: קצבה חודשית משוערת = שכר ממוצע × שנות ותק × אחוז הצבירה השנתי
  let pension = avgSalary * years * accrualRate;

  // אופציונלי: אם ותק מעל 35 שנים, מקסימום ותק לפנסיה
  if (years > 35) {
    pension = avgSalary * 35 * accrualRate;
  }

  resultEl.textContent = 
    `קצבה חודשית משוערת: ₪${pension.toFixed(2)}` +
    (years > 35 
      ? ' (הוגבל לחישוב על 35 שנות ותק).' 
      : ''
    );
});
