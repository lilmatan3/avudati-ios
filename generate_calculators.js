const fs = require('fs');
const path = require('path');

// רשימת המחשבונים עם סלאג וכותרת
const calculators = [
  { slug: 'bruto-neto', title: 'המרת ברוטו → נטו' },
  { slug: 'neto-bruto', title: 'המרת נטו → ברוטו' },
  { slug: 'overtime', title: 'חישוב שעות נוספות (125%, 150%)' },
  { slug: 'leave-offset', title: 'קיזוז שעות חופשה/מחלה' },
  { slug: 'severance', title: 'חישוב פיצויי פיטורין' },
  { slug: 'taxpoints', title: 'מחשבון נקודות זיכוי' },
  { slug: 'settlement-discount', title: 'הנחת מס יישוב מזכה' },

  { slug: 'income-tax', title: 'מס הכנסה (כולל נקודות זיכוי)' },
  { slug: 'social-health', title: 'ביטוח לאומי ומס בריאות' },
  { slug: 'pensia-interest', title: 'חישוב פקמ (קרן השתלמות) וריבית דריבית' },
  { slug: 'pensia-planning', title: 'תכנון הפקדות לקרן השתלמות' },

  { slug: 'compound-interest', title: 'ריבית דריבית (קבועה/משתנה)' },
  { slug: 'average-return', title: 'תשואה שנתית ממוצעת' },
  { slug: 'loan', title: 'הלוואה: תשלום חודשי וריבית אפקטיבית' },
  { slug: 'mortgage', title: 'משכנתא: טבלת שפיצר / גרייס' },
  { slug: 'cashflow', title: 'תזרים מזומנים לפרוייקט השקעה' },
  { slug: 'dividend', title: 'חישוב שיעור דיבידנד' },

  { slug: 'pension-estimate', title: 'חישוב קצבת זקנה משוערת' },
  { slug: 'pension-contrib', title: 'הפקדה חודשית לקבלת קצבה רצויה' },
  { slug: 'employer-employee-pension', title: 'השוואת הפקדה: מעסיק מול עובד' },

  { slug: 'workdays', title: 'מספר ימי עבודה בחודש' },
  { slug: 'hourly-rate', title: 'תעריף שעה לפי שכר חודשי' },
  { slug: 'optimal-hours', title: 'שעות עבודה אופטימליות להכנסה יעד' },
  { slug: 'time-converter', title: 'המרת זמן (דקות ↔ שעות)' },

  { slug: 'currency', title: 'המרת מטבע' },
  { slug: 'inflation', title: 'מדד המחירים לצרכן (אינפלציה)' },
  { slug: 'effective-tax-rate', title: 'חישוב שיעור מס ממוצע' },
  { slug: 'recurring-net', title: 'נטו בתשלום חוזר' }
];

// תוכן קובץ CSS משותף לכל המחשבונים
const cssContent = `/* calculator.css */
body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; background: #f9f9f9; }
h1 { text-align: center; color: #0047ab; }
form { max-width: 400px; margin: 20px auto; display: flex; flex-direction: column; gap: 10px; }
input, button { padding: 10px; font-size: 1em; border: 1px solid #ccc; border-radius: 5px; }
button { background: #0047ab; color: #fff; cursor: pointer; }
#result { max-width: 400px; margin: 20px auto; font-size: 1.2em; color: #333; }
`;

// תבנית HTML לכל מחשבון
function htmlTemplate({ slug, title }) {
  return `<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>מחשבון ${title}</title>
  <link rel="stylesheet" href="calculator.css">
</head>
<body>
  <h1>${title}</h1>
  <form id="form">
    <!-- שדות קלט -->
    <!-- דוגמה: <input type="number" id="input1" placeholder="ערך 1" required> -->
    <button type="submit">חשב</button>
  </form>
  <div id="result"></div>
  <script src="calculator-${slug}.js"></script>
</body>
</html>`;
}

// תבנית JS לכל מחשבון (סטאב) 
function jsTemplate({ slug }) {
  return `// calculator-${slug}.js
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  // TODO: מימוש חישוב
  document.getElementById('result').textContent = 'תוצאה תוצג כאן';
});`;
}

// יצירת התיקיה אם לא קיימת
const dir = __dirname;
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// כתיבת קובץ CSS
fs.writeFileSync(path.join(dir, 'calculator.css'), cssContent);

// יצירת כל קבצי HTML ו-JS
calculators.forEach(calc => {
  const html = htmlTemplate(calc);
  const js = jsTemplate(calc);
  fs.writeFileSync(path.join(dir, `calculator-${calc.slug}.html`), html);
  fs.writeFileSync(path.join(dir, `calculator-${calc.slug}.js`), js);
});

console.log('כל קבצי המחשבונים נוצרו בהצלחה!');
