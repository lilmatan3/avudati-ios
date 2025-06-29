document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("autoExport") === "1") {
    await generatePayslipDocx();
  }
});

async function generatePayslipDocx() {
  await loadData();
  const month = parseInt(localStorage.getItem("detailedMonth") || (new Date().getMonth() + 1));
  const year = parseInt(localStorage.getItem("detailedYear") || new Date().getFullYear());
  const salary = getSalaryComponents(year, month);

  const data = {
    monthYear: `${String(month).padStart(2, '0')}/${year}`,
    regularHours: salary.workHours?.regular?.hours || 0,
    regularAmount: salary.workHours?.regular?.amount || 0,
    overtimeHours: salary.workHours?.overtime?.hours || 0,
    overtimeAmount: salary.workHours?.overtime?.amount || 0,
    friday125Hours: salary.workHours?.friday125?.hours || 0,
    friday125Amount: salary.workHours?.friday125?.amount || 0,
    friday150Hours: salary.workHours?.friday150?.hours || 0,
    friday150Amount: salary.workHours?.friday150?.amount || 0,
    saturdayHours: salary.workHours?.saturday?.hours || 0,
    saturdayAmount: salary.workHours?.saturday?.amount || 0,
    holidayHours: salary.workHours?.holiday?.hours || 0,
    holidayAmount: salary.workHours?.holiday?.amount || 0,
    vacationAmount: salary.specialDays?.vacation?.amount || 0,
    sickAmount: salary.specialDays?.sick?.amount || 0,
    miluimAmount: salary.specialDays?.miluim?.amount || 0,
    havraaAmount: salary.specialAdditions?.havraa?.amount || 0,
    netSalary: "₪" + calcNetSalary(salary).toFixed(2)
  };

  try {
    const content = await fetch("assets/templates/Classicpayslip.docx").then(res => res.arrayBuffer());
    const zip = new PizZip(content);
    const doc = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.setData(data);
    doc.render();

    const blob = doc.getZip().generate({ type: "blob" });

    const pdfOptions = {
      margin: 0.3,
      filename: 'תלוש_שכר.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    // הורדה כ-PDF באמצעות html2pdf
    const tempDiv = document.createElement("div");
    tempDiv.innerText = "התלוש מוכן – אנא המתן ליצירת PDF...";
    document.body.appendChild(tempDiv);

    const reader = new FileReader();
    reader.onload = () => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const docBlob = new Blob([reader.result], { type: 'application/msword' });
      const docUrl = URL.createObjectURL(docBlob);

      html2pdf().set(pdfOptions).from(iframe).save();
    };
    reader.readAsArrayBuffer(blob);
  } catch (err) {
    console.error("שגיאה ביצירת הקובץ:", err);
  }
}

function calcNetSalary(salary) {
  const gross = salary.workHours?.regular?.amount +
    salary.workHours?.overtime?.amount +
    salary.workHours?.friday125?.amount +
    salary.workHours?.friday150?.amount +
    salary.workHours?.saturday?.amount +
    salary.workHours?.holiday?.amount +
    (salary.specialDays?.vacation?.amount || 0) +
    (salary.specialDays?.sick?.amount || 0) +
    (salary.specialDays?.miluim?.amount || 0) +
    (salary.specialAdditions?.havraa?.amount || 0);

  const tax = 0.05 * gross;
  return gross - tax;
}
