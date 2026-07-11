const checkImport = async () => {
  try {
    const html2pdfModule = await import("html2pdf.js");
    console.log("Module keys:", Object.keys(html2pdfModule));
    console.log("Module type:", typeof html2pdfModule);
    console.log("default type:", typeof html2pdfModule.default);
    console.log("module content:", html2pdfModule);
  } catch (err) {
    console.error("Error importing:", err);
  }
};
checkImport();
