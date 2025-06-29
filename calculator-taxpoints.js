// calculator-taxpoints.js

document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const pointsInput = document.getElementById('creditPoints');
  const resultEl = document.getElementById('result');
  const points = parseFloat(pointsInput.value);

  if (isNaN(points) || points < 0) {
    resultEl.textContent = 'אנא הזן מספר נקודות זיכוי תקין (מספר חיובי).';
    return;
  }

  // הערך החודשי של נקודת זיכוי (ניתן לעדכן בהתאם לשנת המס)
  const VALUE_PER_POINT = 218.67; 

  // חישוב הפחתת מס חודשית ושנתית
  const monthlyReduction = points * VALUE_PER_POINT;
  const annualReduction = monthlyReduction * 12;

  // עיצוב הספרות לפי פורמט ישראלי
  const monthlyStr = monthlyReduction
    .toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const annualStr = annualReduction
    .toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  resultEl.textContent = 
    `הפחתת מס משוערת: ${monthlyStr} ₪ לחודש (${annualStr} ₪ לשנה)`;
});
