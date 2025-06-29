// pdf-analyzer.js

export async function extractTextFromPdfBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();

  // טוען את PDF.js הגלובלי (לא ESM)
  const pdfjsLib = window['pdfjsLib'];
  if (!pdfjsLib || !pdfjsLib.getDocument) {
    throw new Error("pdfjsLib לא נטען כראוי");
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join("\n") + "\n";
  }

  return fullText;
}
