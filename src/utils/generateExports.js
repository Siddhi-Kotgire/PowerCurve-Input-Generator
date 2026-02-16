import * as XLSX from "xlsx";

export const generateExports = ({
  allFileResults = [],
  powerCurve = [],
  processedAirDensity,
}) => {
  const individualSeedsCSV = convertToCSV(allFileResults);
  const powerCurveCSV = convertToCSV(powerCurve);

  const individualSeedsFW = convertToFixedWidth(allFileResults);
  const powerCurveFW = convertToFixedWidth(powerCurve);

  const individualSeedsXLSX = generateXLSXBase64(allFileResults, "All Seeds");
  const powerCurveXLSX = generateXLSXBase64(powerCurve, "Power Curve");

  return {
    processedAirDensity,
    individualSeedsCSV,
    powerCurveCSV,
    individualSeedsFW,
    powerCurveFW,
    individualSeedsXLSX,
    powerCurveXLSX,
  };
};

const convertToCSV = (data) => {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
};

const convertToFixedWidth = (data) => {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => String(row[header] ?? "")).map((v) => v.trim()),
  );

  const columnWidths = headers.map((header, idx) => {
    const longestCell = Math.max(...rows.map((row) => row[idx].length), 0);
    return Math.max(header.length, longestCell) + 2;
  });

  const headerLine = headers
    .map((header, idx) => header.padEnd(columnWidths[idx], " "))
    .join("");
  const separatorLine = columnWidths.map((width) => "-".repeat(width)).join("");
  const bodyLines = rows.map((row) =>
    row.map((cell, idx) => cell.padEnd(columnWidths[idx], " ")).join(""),
  );

  return [headerLine, separatorLine, ...bodyLines].join("\n");
};

const generateXLSXBase64 = (data, sheetName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
};
