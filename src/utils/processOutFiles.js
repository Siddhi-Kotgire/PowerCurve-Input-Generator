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
// function parseOutFile(fileContent) {
//   const lines = fileContent.split("\n");
//   let headerIdx = -1;
//   let dataStartIdx = -1;

//   for (let i = 0; i < lines.length; i++) {
//     if (lines[i].includes(COLUMNS.time)) {
//       headerIdx = i;
//       dataStartIdx = i + 2;
//       break;
//     }
//   }

//   if (headerIdx === -1) {
//     throw new Error("Could not find header row with Time column");
//   }

//   const headers = lines[headerIdx].trim().split(/\s+/);
//   const data = [];

//   for (let i = dataStartIdx; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;

//     const values = line.split(/\s+/);
//     if (values.length !== headers.length) continue;

//     const row = {};
//     headers.forEach((header, idx) => {
//       row[header] = parseFloat(values[idx]);
//     });

//     data.push(row);
//   }

//   return { headers, data };
// }

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
async function processSingleOutFileBuffered(file) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let headerFound = false;
  let indexMap = null;

  let count = 0;

  // Running sums
  let sumPower = 0;
  let sumTorque = 0;
  let sumRPM = 0;
  let sumCp = 0;
  let sumCt = 0;
  let sumPitch1 = 0;
  let sumPitch2 = 0;
  let sumPitch3 = 0;
  let sumRtArea = 0;
  let sumWindSpeed = 0;

  const resolveIndexMap = (headers) => ({
    genPwr: headers.indexOf(COLUMNS.genPwr),
    torque: headers.indexOf(COLUMNS.torque),
    rpm: headers.indexOf(COLUMNS.rpm),
    cp: headers.indexOf(COLUMNS.cp),
    ct: headers.indexOf(COLUMNS.ct),
    bladePitch1: headers.indexOf(COLUMNS.bladePitch1),
    bladePitch2: headers.indexOf(COLUMNS.bladePitch2),
    bladePitch3: headers.indexOf(COLUMNS.bladePitch3),
    windX: headers.indexOf(COLUMNS.windX),
    windY: headers.indexOf(COLUMNS.windY),
    windZ: headers.indexOf(COLUMNS.windZ),
    rtArea: headers.indexOf(COLUMNS.rtArea),
  });

  const parseValue = (values, idx) => {
    if (idx < 0 || idx >= values.length) return 0;
    const parsed = Number.parseFloat(values[idx]);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const processLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (!headerFound) {
      if (trimmed.includes(COLUMNS.time)) {
        const headers = trimmed.split(/\s+/);
        indexMap = resolveIndexMap(headers);
        headerFound = true;
      }
      return;
    }

    const values = trimmed.split(/\s+/);
    if (!indexMap) return;

    // Skip non-data rows (e.g., unit labels under header).
    const firstNumeric = Number.parseFloat(values[0]);
    if (!Number.isFinite(firstNumeric)) return;

    const wx = parseValue(values, indexMap.windX);
    const wy = parseValue(values, indexMap.windY);
    const wz = parseValue(values, indexMap.windZ);

    sumWindSpeed += Math.sqrt(wx * wx + wy * wy + wz * wz);
    sumPower += parseValue(values, indexMap.genPwr);
    sumTorque += parseValue(values, indexMap.torque);
    sumRPM += parseValue(values, indexMap.rpm);
    sumCp += parseValue(values, indexMap.cp);
    sumCt += parseValue(values, indexMap.ct);
    sumPitch1 += parseValue(values, indexMap.bladePitch1);
    sumPitch2 += parseValue(values, indexMap.bladePitch2);
    sumPitch3 += parseValue(values, indexMap.bladePitch3);
    sumRtArea += parseValue(values, indexMap.rtArea);

    count++;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep last partial line

    for (const line of lines) processLine(line);
  }

  if (buffer) processLine(buffer);

  if (count === 0) return null;

  return {
    power: sumPower / count,
    torque: sumTorque / count,
    genSpeed: sumRPM / count,
    cp: sumCp / count,
    ct: sumCt / count,
    bladePitch1: sumPitch1 / count,
    bladePitch2: sumPitch2 / count,
    bladePitch3: sumPitch3 / count,
    windSpeed: sumWindSpeed / count,
    rtArea: sumRtArea / count,
  };
}

// ===== MAIN PROCESSOR (BROWSER) =====
export async function processOutFiles(files, airDensity = 1.225, onProgress) {
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
      const aggregated = await processSingleOutFileBuffered(file);
      if (!aggregated) continue;

      // if (!data.length) continue;

      // const windSpeeds = data.map((row) =>
      //   Math.sqrt(
      //     Math.pow(row[COLUMNS.windX] || 0, 2) +
      //       Math.pow(row[COLUMNS.windY] || 0, 2) +
      //       Math.pow(row[COLUMNS.windZ] || 0, 2),
      //   ),
      // );

      // const meanWindSpeed = calculateMean(windSpeeds);
      // if (!meanWindSpeed) continue;

      const result = {
        windSpeedGroup: getGroupKey(file.name),
        fileName: file.name,
        power: aggregated.power,
        torque: aggregated.torque,
        genSpeed: aggregated.genSpeed,
        cp: aggregated.cp,
        ct: aggregated.ct,
        windSpeed: aggregated.windSpeed,
        bladePitch1: aggregated.bladePitch1,
        bladePitch2: aggregated.bladePitch2,
        bladePitch3: aggregated.bladePitch3,
        "RtArea(m2)": aggregated.rtArea,
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
