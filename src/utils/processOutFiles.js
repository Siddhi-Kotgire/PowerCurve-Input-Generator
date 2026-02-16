// ===== COLUMN MAP =====
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

// ===== PARSE FILE =====
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
    throw new Error("Could not find header row with Time column");
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

  return { headers, data };
}

// ===== UTIL =====
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

// ===== MAIN PROCESSOR (BROWSER) =====
export async function processOutFiles(
  files,
  airDensity = 1.225,
  onProgress,
) {
  const allFileResults = [];
  const outFiles = files.filter((file) =>
    file.name.toLowerCase().endsWith(".out"),
  );

  if (!outFiles.length) {
    throw new Error("No .out files uploaded");
  }

  for (let i = 0; i < outFiles.length; i++) {
    const file = outFiles[i];
    try {
      const content = await file.text();
      const { data } = parseOutFile(content);

      if (!data.length) continue;

      const windSpeeds = data.map((row) =>
        Math.sqrt(
          Math.pow(row[COLUMNS.windX] || 0, 2) +
            Math.pow(row[COLUMNS.windY] || 0, 2) +
            Math.pow(row[COLUMNS.windZ] || 0, 2),
        ),
      );

      const meanWindSpeed = calculateMean(windSpeeds);
      if (!meanWindSpeed) continue;

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
      if (onProgress) {
        const percent = Math.round(((i + 1) / outFiles.length) * 80);
        onProgress(i + 1, outFiles.length, percent, file.name);
      }
    } catch (err) {
      console.error("File processing error:", err);
    }
  }

  if (!allFileResults.length) {
    throw new Error("No files processed");
  }

  // ===== GLOBAL STATS =====
  const globalRtAreaMean = calculateMean(
    allFileResults.map((r) => r["RtArea(m2)"]),
  );

  const globalRtAreaMax = Math.max(
    ...allFileResults.map((r) => r["RtArea(m2)"]),
  );

  // ===== GROUPING =====
  const groups = {};
  allFileResults.forEach((result) => {
    if (!groups[result.windSpeedGroup]) {
      groups[result.windSpeedGroup] = [];
    }
    groups[result.windSpeedGroup].push(result);
  });

  const powerCurve = Object.entries(groups).map(([group, results]) => {
    const avgWindSpeed = calculateMean(results.map((r) => r.windSpeed));
    const roundedWindSpeed = Math.round(avgWindSpeed * 2) / 2;

    return {
      group,
      windSpeed: roundedWindSpeed,
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

  // Keep compatibility with UI that reads `row.Power`.
  const powerCurveWithLegacyKeys = powerCurve.map((row) => ({
    ...row,
    Power: row.power,
  }));

  if (onProgress) {
    onProgress(outFiles.length, outFiles.length, 100, "Complete");
  }

  return {
    filesProcessed: allFileResults.length,
    allFileResults,
    powerCurve: powerCurveWithLegacyKeys,
    results: allFileResults,
    stats: {
      globalRtAreaMean,
      globalRtAreaMax,
      filesProcessed: allFileResults.length,
    },
    globalRtAreaMean,
    globalRtAreaMax,
  };
}

export const processFilesInBrowser = processOutFiles;
