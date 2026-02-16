export const downloadFile = (data, filename, type) => {
  let blob;

  if (type === "xlsx") {
    // Convert base64 to blob for XLSX
    const binaryString = window.atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } else if (type === "fw") {
    blob = new Blob([data], { type: "text/plain" });
  } else {
    // CSV
    blob = new Blob([data], { type: "text/csv" });
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
