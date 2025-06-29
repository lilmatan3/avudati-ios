document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const initial = parseFloat(document.getElementById('initial').value) || 0;
  const monthly = parseFloat(document.getElementById('monthly').value) || 0;
  const rate = parseFloat(document.getElementById('rate').value) / 100 || 0;
  const years = parseFloat(document.getElementById('years').value) || 0;

  if (initial < 0 || monthly < 0 || rate < 0 || years <= 0) {
    document.getElementById('result').textContent =
      'אנא הזן/י ערכים תקינים בכל השדות.';
    return;
  }

  const months = years * 12;
  const monthlyRate = rate / 12;

  // סכום הפקדה כולל = קרן התחלתית + כל ההפקדות החודשיות
  const totalDeposits = initial + (monthly * months);

  // חישוב ערך עתידי כולל ריבית דריבית על הקרן והפקדות חודשיות:
  let futureValue = initial * Math.pow(1 + monthlyRate, months);

  for (let i = 1; i <= months; i++) {
    futureValue += monthly * Math.pow(1 + monthlyRate, months - i);
  }

  const totalInterest = futureValue - totalDeposits;

  document.getElementById('result').innerHTML = `
    <strong>💰 סכום ההפקדה הכולל:</strong><br>₪${totalDeposits.toLocaleString()}<br><br>
    <strong>📈 רווח מצטבר (ריבית):</strong><br>₪${totalInterest.toLocaleString()}<br><br>
    <strong>🏦 סכום חיסכון עתידי:</strong><br>₪${futureValue.toLocaleString()}
  `;
});
