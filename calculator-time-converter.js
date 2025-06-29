// calculator-time-converter.js

document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const direction = document.querySelector('input[name="direction"]:checked').value;
  const inputEl = document.getElementById('timeInput');
  const resultEl = document.getElementById('result');
  const value = parseFloat(inputEl.value);

  // בדיקת קלט תקין
  if (isNaN(value) || value < 0) {
    resultEl.textContent = 'אנא הזן ערך תקין (מספר חיובי).';
    return;
  }

  // המרה והצגת תוצאה
  if (direction === 'toHours') {
    // דקות לשעות
    const totalHours = value / 60;
    // ייצוג עשרוני
    const hoursDecimal = totalHours.toLocaleString('he-IL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    // ייצוג של שעות + דקות
    const wholeHours = Math.floor(totalHours);
    const remMinutes = Math.round((totalHours - wholeHours) * 60);

    resultEl.textContent = 
      `≈ ${hoursDecimal} שעות (${wholeHours} שעות ו‑${remMinutes} דקות)`;
  } else {
    // שעות לדקות
    const minutes = value * 60;
    const minutesStr = minutes.toLocaleString('he-IL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    resultEl.textContent = `${minutesStr} דקות`;
  }
});
