export const payslipTypeTriggers = [
  {
    type: "עובדי הוראה",
    minMatches: 1,
    triggers: ["משולב אופק חדש"]
  },
  {
    type: "עובד שירות",
    minMatches: 3,
    triggers: [
      "קופ\"ג מעביד",
      "קה\"ל מעביד",
      "שכר שווה כסף",
      "פטור ס 47'",
      "זיכוי משמרות"
    ]
  },
  {
    type: "AM PROJECTS",
    minMatches: 3,
    triggers: [
      "עבודה ביום שישי",
      "שעות נוספות 125%",
      "שעות נוספות 150%",
      "בסיס קרן השתלמות",
      "לפיצויים לא חייב במס",
      "חישוב מצטבר",
      "אופן תשלום"
    ]
  },
  {
    type: "מוסד ציבורי / חילן",
    minMatches: 2,
    triggers: [
      "ת.שעה",
      "גמל מעסיק"
    ]
  }
];
