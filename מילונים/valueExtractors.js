// valueExtractors.js (גרסה מבוססת גישה של ChatGPT ריזון O1)

export function extractValuesAmProjects(lines, selectedLabels) {
  const allItems = lines.flatMap(line => line.items);
  const results = [];

  for (const label of selectedLabels) {
    const normalizedLabel = label.replace(/\s+/g, '').toLowerCase();

    // חפש את ה-item שמכיל את שם הרכיב
    const labelItem = allItems.find(item =>
      item.text.replace(/\s+/g, '').toLowerCase().includes(normalizedLabel)
    );

    if (!labelItem) {
      results.push({ label, value: "" });
      console.warn(`⚠️ לא נמצא מונח תואם עבור "${label}"`);
      continue;
    }

    // חיפוש של מספר שנמצא בשורה "אופקית" עם הרכיב
    const candidates = allItems
      .filter(item => {
        const isLeft = item.x < labelItem.x;
        const deltaY = Math.abs(item.y - labelItem.y);
        const isCloseY = deltaY <= 2;
        const isNumeric = /^-?\d+(\.\d+)?$/.test(item.text.replace(/,/g, ''));
        return isLeft && isCloseY && isNumeric;
      })
      .sort((a, b) => b.x - a.x); // הקרוב ביותר מימין ← שמאלה

    if (candidates.length > 0) {
      const numberItem = candidates[0];
      results.push({ label, value: numberItem.text });
      console.log(`💰 "${label}" ← ${numberItem.text} (x=${numberItem.x}, y=${numberItem.y})`);
    } else {
      results.push({ label, value: "" });
      console.warn(`⚠️ לא נמצא ערך משמאל עבור "${label}"`);
    }
  }

  return results;
}
