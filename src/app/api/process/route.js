import { NextResponse } from "next/server";
import * as XLSX from "xlsx";


// Column mappings matching the Python script
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
  rtArea: "RtArea", // Add this
};

function parseOutFile(fileContent) {
  const lines = fileContent.split("\n");
  let headerIdx = -1;
  let dataStartIdx = -1;

  // Find header line containing "Time"
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(COLUMNS.time)) {
      headerIdx = i;
      dataStartIdx = i + 2; // Skip header and units row
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error("Could not find header row with Time column");
  }

  // Parse header
  const headers = lines[headerIdx].trim().split(/\s+/);

  // Parse data rows
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

function calculateMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function getGroupKey(fileName) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("_seed")) {
    return lowerName.split("_seed")[0];
  }
  return fileName.replace(/\.[^/.]+$/, ""); // Remove extension
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const airDensity = parseFloat(formData.get("airDensity")) || 1.225;
    const rotorArea = parseFloat(formData.get("rotorArea")) || 26830;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const allFileResults = [];

    for (const file of files) {
      try {
        const content = await file.text();
        const { headers, data } = parseOutFile(content);

        if (data.length === 0) {
          console.warn(`File ${file.name} is empty, skipping`);
          continue;
        }

        // Calculate resultant wind speed for each row
        const windSpeeds = data.map((row) =>
          Math.sqrt(
            Math.pow(row[COLUMNS.windX] || 0, 2) +
              Math.pow(row[COLUMNS.windY] || 0, 2) +
              Math.pow(row[COLUMNS.windZ] || 0, 2),
          ),
        );
        const meanWindSpeed = calculateMean(windSpeeds);

        if (meanWindSpeed === 0) {
          console.warn(`Mean wind speed for ${file.name} is 0, skipping`);
          continue;
        }

        // Extract column data
        const cpValues = data.map((row) => row[COLUMNS.cp] || 0);
        const ctValues = data.map((row) => row[COLUMNS.ct] || 0);
        const powerValues = data.map((row) => row[COLUMNS.genPwr] || 0);
        const torqueValues = data.map((row) => row[COLUMNS.torque] || 0);
        const rpmValues = data.map((row) => row[COLUMNS.rpm] || 0);
        const bladePitch1Values = data.map(
          (row) => row[COLUMNS.bladePitch1] || 0,
        );
        const bladePitch2Values = data.map(
          (row) => row[COLUMNS.bladePitch2] || 0,
        );
        const bladePitch3Values = data.map(
          (row) => row[COLUMNS.bladePitch3] || 0,
        );
        const rtAreaValues = data.map((row) => row[COLUMNS.rtArea] || 0); // Add this

        // Calculate averages
        const fileResult = {
          windSpeedGroup: getGroupKey(file.name),
          fileName: file.name,
          power: calculateMean(powerValues),
          torque: calculateMean(torqueValues),
          genSpeed: calculateMean(rpmValues),
          cp: calculateMean(cpValues),
          ct: calculateMean(ctValues),
          windSpeed: meanWindSpeed,
          bladePitch1: calculateMean(bladePitch1Values),
          bladePitch2: calculateMean(bladePitch2Values),
          bladePitch3: calculateMean(bladePitch3Values),
          "RtArea(m2)": calculateMean(rtAreaValues), // Add this
        };

        allFileResults.push(fileResult);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        continue;
      }
    }

    if (allFileResults.length === 0) {
      return NextResponse.json(
        { error: "No files were successfully processed" },
        { status: 400 },
      );
    }

    // Calculate global RtArea statistics
    const globalRtAreaMean = calculateMean(
      allFileResults.map((r) => r["RtArea(m2)"]),
    );
    const globalRtAreaMax = Math.max(
      ...allFileResults.map((r) => r["RtArea(m2)"]),
    );

    // Group by wind speed group and calculate averages
    const groups = {};
    allFileResults.forEach((result) => {
      if (!groups[result.windSpeedGroup]) {
        groups[result.windSpeedGroup] = [];
      }
      groups[result.windSpeedGroup].push(result);
    });

    const powerCurve = Object.entries(groups).map(([group, results]) => {
      const avgPower = calculateMean(results.map((r) => r.power));
      const avgTorque = calculateMean(results.map((r) => r.torque));
      const avgGenSpeed = calculateMean(results.map((r) => r.genSpeed));
      const avgCp = calculateMean(results.map((r) => r.cp));
      const avgCt = calculateMean(results.map((r) => r.ct));
      const avgWindSpeed = calculateMean(results.map((r) => r.windSpeed));
      const avgBladePitch1 = calculateMean(results.map((r) => r.bladePitch1));
      const avgBladePitch2 = calculateMean(results.map((r) => r.bladePitch2));
      const avgBladePitch3 = calculateMean(results.map((r) => r.bladePitch3));
      const avgRtArea = calculateMean(results.map((r) => r["RtArea(m2)"])); // Add this

      // Round wind speed to nearest 0.5
      const roundedWindSpeed = Math.round(avgWindSpeed * 2) / 2;

      return {
        group,
        windSpeed: roundedWindSpeed,
        power: avgPower,
        torque: avgTorque,
        genSpeed: avgGenSpeed,
        cp: avgCp,
        ct: avgCt,
        bladePitch1: avgBladePitch1,
        bladePitch2: avgBladePitch2,
        bladePitch3: avgBladePitch3,
        "RtArea(m2)": avgRtArea, // Add this
      };
    });

    // Sort by wind speed
    powerCurve.sort((a, b) => a.windSpeed - b.windSpeed);

    // Generate CSV for individual seeds
    const individualSeedsCSV = generateIndividualSeedsCSV(allFileResults);

    // Generate CSV for power curve
    const powerCurveCSV = generatePowerCurveCSV(powerCurve);

    return NextResponse.json({
      success: true,
      filesProcessed: allFileResults.length,
      powerCurve,
      individualSeedsCSV,
      powerCurveCSV,
      globalRtAreaMean, // Add this
      globalRtAreaMax, // Add this
    });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      { error: error.message || "Processing failed" },
      { status: 500 },
    );
  }
}

function generateIndividualSeedsCSV(results) {
  const headers = [
    "WindSpeedGroup",
    "FileName",
    "Power(kW)",
    "Torque(kNm)",
    "GenSpeed(RPM)",
    "Cp",
    "Ct",
    "Bladepitch1",
    "Bladepitch2",
    "Bladepitch3",
    "WindSpeed(ms)",
  ];

  let csv = headers.join(",") + "\n";

  results.forEach((result) => {
    const row = [
      result.windSpeedGroup,
      result.fileName,
      result.power.toFixed(6),
      result.torque.toFixed(6),
      result.genSpeed.toFixed(6),
      result.cp.toFixed(6),
      result.ct.toFixed(6),
      result.bladePitch1.toFixed(6),
      result.bladePitch2.toFixed(6),
      result.bladePitch3.toFixed(6),
      result.windSpeed.toFixed(6),
    ];
    csv += row.join(",") + "\n";
  });

  return csv;
}

function generatePowerCurveCSV(powerCurve) {
  const headers = [
    "WindSpeedGroup",
    "Power(kW)",
    "Torque(kNm)",
    "GenSpeed(RPM)",
    "Cp",
    "Ct",
    "Bladepitch1",
    "Bladepitch2",
    "Bladepitch3",
    "WindSpeed(ms)",
  ];

  let csv = headers.join(",") + "\n";

  powerCurve.forEach((result) => {
    const row = [
      result.group,
      result.power.toFixed(6),
      result.torque.toFixed(6),
      result.genSpeed.toFixed(6),
      result.cp.toFixed(6),
      result.ct.toFixed(6),
      result.bladePitch1.toFixed(6),
      result.bladePitch2.toFixed(6),
      result.bladePitch3.toFixed(6),
      result.windSpeed.toFixed(6),
    ];
    csv += row.join(",") + "\n";
  });

  return csv;
}
// ========== XLSX GENERATION ==========
function generateIndividualSeedsXLSX(results) {
  // Prepare data for Excel
  const excelData = results.map((result) => ({
    "Wind Speed Group": result.windSpeedGroup,
    "File Name": result.fileName,
    "Power (kW)": parseFloat(result.power.toFixed(6)),
    "Torque (kNm)": parseFloat(result.torque.toFixed(6)),
    "Gen Speed (RPM)": parseFloat(result.genSpeed.toFixed(6)),
    Cp: parseFloat(result.cp.toFixed(6)),
    Ct: parseFloat(result.ct.toFixed(6)),
    "Blade Pitch 1": parseFloat(result.bladePitch1.toFixed(6)),
    "Blade Pitch 2": parseFloat(result.bladePitch2.toFixed(6)),
    "Blade Pitch 3": parseFloat(result.bladePitch3.toFixed(6)),
    "Wind Speed (m/s)": parseFloat(result.windSpeed.toFixed(6)),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Wind Speed Group
    { wch: 30 }, // File Name
    { wch: 12 }, // Power
    { wch: 12 }, // Torque
    { wch: 15 }, // Gen Speed
    { wch: 10 }, // Cp
    { wch: 10 }, // Ct
    { wch: 15 }, // Blade Pitch 1
    { wch: 15 }, // Blade Pitch 2
    { wch: 15 }, // Blade Pitch 3
    { wch: 15 }, // Wind Speed
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Seed Averages");

  // Write to buffer and convert to base64
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer.toString("base64");
}

function generatePowerCurveXLSX(powerCurve) {
  // Prepare data for Excel
  const excelData = powerCurve.map((result) => ({
    "Wind Speed Group": result.group,
    "Power (kW)": parseFloat(result.power.toFixed(6)),
    "Torque (kNm)": parseFloat(result.torque.toFixed(6)),
    "Gen Speed (RPM)": parseFloat(result.genSpeed.toFixed(6)),
    Cp: parseFloat(result.cp.toFixed(6)),
    Ct: parseFloat(result.ct.toFixed(6)),
    "Blade Pitch 1": parseFloat(result.bladePitch1.toFixed(6)),
    "Blade Pitch 2": parseFloat(result.bladePitch2.toFixed(6)),
    "Blade Pitch 3": parseFloat(result.bladePitch3.toFixed(6)),
    "Wind Speed (m/s)": parseFloat(result.windSpeed.toFixed(6)),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Wind Speed Group
    { wch: 12 }, // Power
    { wch: 12 }, // Torque
    { wch: 15 }, // Gen Speed
    { wch: 10 }, // Cp
    { wch: 10 }, // Ct
    { wch: 15 }, // Blade Pitch 1
    { wch: 15 }, // Blade Pitch 2
    { wch: 15 }, // Blade Pitch 3
    { wch: 15 }, // Wind Speed
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Power Curve");

  // Write to buffer and convert to base64
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer.toString("base64");
}

// ========== FIXED WIDTH TEXT GENERATION ==========
function generateIndividualSeedsFW(results) {
  // Define column specifications
  const columns = [
    { key: "windSpeedGroup", header: "WindSpeedGroup", width: 18 },
    { key: "fileName", header: "FileName", width: 35 },
    { key: "power", header: "Power(kW)", width: 12, decimals: 6 },
    { key: "torque", header: "Torque(kNm)", width: 14, decimals: 6 },
    { key: "genSpeed", header: "GenSpeed(RPM)", width: 16, decimals: 6 },
    { key: "cp", header: "Cp", width: 12, decimals: 6 },
    { key: "ct", header: "Ct", width: 12, decimals: 6 },
    { key: "bladePitch1", header: "BladePitch1", width: 14, decimals: 6 },
    { key: "bladePitch2", header: "BladePitch2", width: 14, decimals: 6 },
    { key: "bladePitch3", header: "BladePitch3", width: 14, decimals: 6 },
    { key: "windSpeed", header: "WindSpeed(ms)", width: 15, decimals: 6 },
  ];

  let output = "";

  // Generate header
  output += columns.map((col) => col.header.padEnd(col.width)).join("") + "\n";
  output += columns.map((col) => "=".repeat(col.width)).join("") + "\n";

  // Generate data rows
  results.forEach((result) => {
    output +=
      columns
        .map((col) => {
          let value = result[col.key];
          if (typeof value === "number" && col.decimals !== undefined) {
            value = value.toFixed(col.decimals);
          }
          return String(value).padEnd(col.width);
        })
        .join("") + "\n";
  });

  return output;
}

function generatePowerCurveFW(powerCurve) {
  // Define column specifications
  const columns = [
    { key: "group", header: "WindSpeedGroup", width: 18 },
    { key: "power", header: "Power(kW)", width: 12, decimals: 6 },
    { key: "torque", header: "Torque(kNm)", width: 14, decimals: 6 },
    { key: "genSpeed", header: "GenSpeed(RPM)", width: 16, decimals: 6 },
    { key: "cp", header: "Cp", width: 12, decimals: 6 },
    { key: "ct", header: "Ct", width: 12, decimals: 6 },
    { key: "bladePitch1", header: "BladePitch1", width: 14, decimals: 6 },
    { key: "bladePitch2", header: "BladePitch2", width: 14, decimals: 6 },
    { key: "bladePitch3", header: "BladePitch3", width: 14, decimals: 6 },
    { key: "windSpeed", header: "WindSpeed(ms)", width: 15, decimals: 6 },
  ];

  let output = "";

  // Generate header
  output += columns.map((col) => col.header.padEnd(col.width)).join("") + "\n";
  output += columns.map((col) => "=".repeat(col.width)).join("") + "\n";

  // Generate data rows
  powerCurve.forEach((result) => {
    output +=
      columns
        .map((col) => {
          let value = result[col.key];
          if (typeof value === "number" && col.decimals !== undefined) {
            value = value.toFixed(col.decimals);
          }
          return String(value).padEnd(col.width);
        })
        .join("") + "\n";
  });

  return output;
}
