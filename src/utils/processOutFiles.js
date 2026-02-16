import * as XLSX from "xlsx";

/* ================= COLUMN MAP ================= */

const COLUMNS = {
  time: "Time",
  genPwr: "GenPwr",
  torque: "GenTq",
  rpm: "GenSpeed",
  cp: "RtAeroCp",
  ct: "RtAeroCt",
  thrustForce: "YawBrFxp",
  bladePitch1: "BldPitch1",
  bladePitch2: "BldPitch2",
  bladePitch3: "BldPitch3",
  windX: "WindHubVelX",
  windY: "WindHubVelY",
  windZ: "WindHubVelZ",
  rtArea: "RtArea",
};

/* ================= CORE HELPERS ================= */

function calculateMean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function getGroupKey(fileName) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("_seed")) {
    return lowerName.split("_seed")[0];
  }
  return fileName.replace(/\.[^/.]+$/, "");
}

function parseOutFile(fileContent) {
  const lines = fileContent.split("\n");

  let headerIdx = -1;
  let dataStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(COLUMNS.time)) {
      headerIdx = i;
      dataStartIdx = i + 2;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error("Header with Time column not found");
  }

  const headers = lines[headerIdx].trim().split(/\s+/);
  const data = [];

  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/\s+/);
    if (values.length !== headers.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = parseFloat(values[idx]);
    });

    data.push(row);
  }

  return data;
}

/* ================= MAIN PROCESS FUNCTION ================= */

export async function processFilesInBrowser(files) {
  const allFileResults = [];

  for (const file of files) {
    try {
      const content = await file.text();
      const data = parseOutFile(content);

      if (!data.length) continue;

      const windSpeeds = data.map((row) =>
        Math.sqrt(
          Math.pow(row[COLUMNS.windX] || 0, 2) +
            Math.pow(row[COLUMNS.windY] || 0, 2) +
            Math.pow(row[COLUMNS.windZ] || 0, 2),
        ),
      );

      const meanWindSpeed = calculateMean(windSpeeds);
      if (meanWindSpeed === 0) continue;

      const result = {
        windSpeedGroup: getGroupKey(file.name),
        fileName: file.name,
        power: calculateMean(data.map((r) => r[COLUMNS.genPwr] || 0)),
        torque: calculateMean(data.map((r) => r[COLUMNS.torque] || 0)),
        genSpeed: calculateMean(data.map((r) => r[COLUMNS.rpm] || 0)),
        cp: calculateMean(data.map((r) => r[COLUMNS.cp] || 0)),
        ct: calculateMean(data.map((r) => r[COLUMNS.ct] || 0)),
        windSpeed: meanWindSpeed,
        bladePitch1: calculateMean(
          data.map((r) => r[COLUMNS.bladePitch1] || 0),
        ),
        bladePitch2: calculateMean(
          data.map((r) => r[COLUMNS.bladePitch2] || 0),
        ),
        bladePitch3: calculateMean(
          data.map((r) => r[COLUMNS.bladePitch3] || 0),
        ),
        "RtArea(m2)": calculateMean(data.map((r) => r[COLUMNS.rtArea] || 0)),
      };

      allFileResults.push(result);
    } catch (err) {
      console.error("Error processing", file.name, err);
    }
  }

  if (!allFileResults.length) {
    throw new Error("No files processed");
  }

  /* ========= GROUP POWER CURVE ========= */

  const groups = {};
  allFileResults.forEach((r) => {
    if (!groups[r.windSpeedGroup]) groups[r.windSpeedGroup] = [];
    groups[r.windSpeedGroup].push(r);
  });

  const powerCurve = Object.entries(groups).map(([group, results]) => {
    const avgWindSpeed =
      Math.round(calculateMean(results.map((r) => r.windSpeed)) * 2) / 2;

    return {
      group,
      windSpeed: avgWindSpeed,
      power: calculateMean(results.map((r) => r.power)),
      torque: calculateMean(results.map((r) => r.torque)),
      genSpeed: calculateMean(results.map((r) => r.genSpeed)),
      cp: calculateMean(results.map((r) => r.cp)),
      ct: calculateMean(results.map((r) => r.ct)),
      bladePitch1: calculateMean(results.map((r) => r.bladePitch1)),
      bladePitch2: calculateMean(results.map((r) => r.bladePitch2)),
      bladePitch3: calculateMean(results.map((r) => r.bladePitch3)),
      "RtArea(m2)": calculateMean(results.map((r) => r["RtArea(m2)"])),
    };
  });

  powerCurve.sort((a, b) => a.windSpeed - b.windSpeed);

  return { allFileResults, powerCurve };
}

/* ================= CSV DOWNLOAD ================= */

export function downloadCSV(filename, data) {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === "number" ? v.toFixed(6) : v))
      .join(","),
  );

  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= XLSX DOWNLOAD ================= */

export function downloadXLSX(filename, data, sheetName) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, filename);
}
