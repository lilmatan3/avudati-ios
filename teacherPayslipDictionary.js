// teacherPayslipDictionary.js

export const teacherPayslipDictionary = [
  // פרטי עובד
  { label: "שם עובד",               synonyms: ["שם עובד"],                    matchType: "partial" },
  { label: "מספר עובד",             synonyms: ["מספר עובד"],                  matchType: "partial" },
  { label: "תעודת זהות",            synonyms: ["ת.ז", "ת\"ז", "תעודת זהות"],  matchType: "partial" },
  { label: "כתובת",                 synonyms: ["כתובת"],                     matchType: "partial" },
  { label: "טלפון",                 synonyms: ["טלפון"],                     matchType: "partial" },

  // פרטי העסקה
  { label: "תאריך תחילת עבודה",     synonyms: ["תאריך תחילת עבודה"],         matchType: "partial" },
  { label: "דרגת אופק",             synonyms: ["דרגת אופק"],                  matchType: "partial" },
  { label: "שלב בדרגה",             synonyms: ["שלב בדרגה"],                  matchType: "partial" },
  { label: "אחוז משרה",             synonyms: ["אחוז משרה"],                  matchType: "partial" },
  { label: "שכר משוקלל למשרה מלאה", synonyms: ["שכר משוקלל למשרה מלאה"],      matchType: "partial" },
  { label: "שכר מינימום לשעה",      synonyms: ["שכר מינימום לשעה"],           matchType: "partial" },

  // רכיבי שכר / תשלומים
  { label: "משולב אופק חדש",        synonyms: ["משולב אופק חדש"],            matchType: "partial" },
  { label: "שקלול יתרות",           synonyms: ["שקלול יתרות"],               matchType: "partial" },
  { label: "תוספת אופק חדש",        synonyms: ["תוספת אופק חדש"],            matchType: "partial" },
  { label: "החזר נסיעות",           synonyms: ["החזר נסיעות"],               matchType: "partial" },
  { label: "גמול חינוך מיוחד",      synonyms: ["גמול חינוך מיוחד"],           matchType: "partial" },
  { label: "קצובת ביגוד",           synonyms: ["קצובת ביגוד"],               matchType: "partial" },
  { label: "קצובה",                 synonyms: ["קצובה"],                     matchType: "partial" },
  { label: "תוספת עידוד",           synonyms: ["תוספת עידוד"],               matchType: "partial" },

  // ניכויי חובה
  { label: "מס הכנסה",              synonyms: ["מס הכנסה"],                  matchType: "partial" },
  { label: "ביטוח לאומי",           synonyms: ["ביטוח לאומי"],               matchType: "partial" },
  { label: "הפרש ביטוח לאומי",      synonyms: ["הפרש ביטוח לאומי"],          matchType: "partial" },
  { label: "ביטוח בריאות",          synonyms: ["ביטוח בריאות"],              matchType: "partial" },
  { label: "הפרש ביטוח בריאות",     synonyms: ["הפרש ביטוח בריאות"],         matchType: "partial" },

  // ניכויי גמל
  { label: "קופ\"ח",                synonyms: ["קופ\"ח"],                   matchType: "partial" },
  { label: "קרן השתלמות",           synonyms: ["קרן השתלמות", "קה\"ש"],       matchType: "partial" },
  { label: "מנורה מבטחים",          synonyms: ["מנורה מבטחים"],              matchType: "partial" },
  { label: "מנורה פנסיה",           synonyms: ["מנורה פנסיה"],               matchType: "partial" },
  { label: "אלטשולר שחם",          synonyms: ["אלטשולר שחם"],              matchType: "partial" },

  // סיכומים
  { label: "סה\"כ תשלומים",         synonyms: ["סה\"כ תשלומים"],             matchType: "partial" },
  { label: "סה\"כ ניכויי חובה",      synonyms: ["סה\"כ ניכויי חובה"],          matchType: "partial" },
  { label: "סה\"כ ניכויי גמל",       synonyms: ["סה\"כ ניכויי גמל"],           matchType: "partial" },
  { label: "סה\"כ ניכויים אחרים",    synonyms: ["סה\"כ ניכויים אחרים"],        matchType: "partial" },
  { label: "נטו לתשלום",            synonyms: ["נטו לתשלום", "סכום בבנק"],     matchType: "partial" },
  { label: "נטו שלילי",             synonyms: ["נטו שלילי"],                 matchType: "partial" },

  // טריגר ייחודי
  { label: "אופק חדש",              synonyms: ["אופק חדש"],                  matchType: "partial" }
];
