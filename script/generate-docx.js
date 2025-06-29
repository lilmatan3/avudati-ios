// generate-docx.js
async function generateDocxFromTemplate(data) {
  const loadFile = (url) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error("Failed to load template");
      return res.arrayBuffer();
    });

  const templatePath = "assets/templates/Classicpayslip.docx";
  const content = await loadFile(templatePath);
  const zip = new PizZip(content);

  let doc;
  try {
    doc = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  } catch (error) {
    console.error("Error loading docx template:", error);
    return;
  }

  doc.setData(data);

  try {
    doc.render();
  } catch (error) {
    console.error("Error rendering template:", error);
    return;
  }

  const out = doc.getZip().generate({ type: "blob" });
  saveAs(out, "תלוש שכר.docx");
}
