// calculator-workdays.js

document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const inputEl = document.getElementById('monthInput');
  const resultEl = document.getElementById('result');
  const monthValue = inputEl.value; // פורמט "YYYY-MM"
  
  if (!monthValue) {
    resultEl.textContent = 'אנא בחר חודש ושנה.';
    return;
  }

  const [yearStr, monthStr] = monthValue.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1; // 0 = ינואר

  if (isNaN(year) || isNaN(monthIndex)) {
    resultEl.textContent = 'קלט לא תקין. נסה שוב.';
    return;
  }

  // קבלת מספר הימים בחודש
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let workdayCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthIndex, d).getDay();
    // ב־JavaScript: 0=ראשון,1=שני,...,5=שישי,6=שבת
    // בעבודה בישראל: ימי עבודה הם ראשון–חמישי (0–4)
    if (dow >= 0 && dow <= 4) {
      workdayCount++;
    }
  }

  // הצגת תוצאה
  // פורמט תצוגה  "MM/YYYY"
  const displayMonth = (monthIndex + 1).toString().padStart(2, '0');
  resultEl.textContent = 
    `בחודש ${displayMonth}/${year} יש ${workdayCount} ימי עבודה.`;
});
