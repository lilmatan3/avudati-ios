let holidaysData = [];

async function loadHolidays() {
  const res = await fetch('holidays_2025_2035.json');
  holidaysData = await res.json();
}

function getHolidayType(dateStr) {
  const holiday = holidaysData.find(h => h.date === dateStr);
  if (!holiday) return null;

  if (holiday.name.includes("כיפור")) return "כיפור";
  if (holiday.type === "חג") return "חג";
  if (holiday.type === "ערב חג") return "ערב חג";
  return null;
}

// טעינה ראשונית
document.addEventListener('DOMContentLoaded', loadHolidays);
