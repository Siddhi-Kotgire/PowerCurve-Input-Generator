import { useState } from "react";
import { downloadFile } from "../utils/fileUtils";

export const useFileProcessing = (initialState) => {
  const [state, setState] = useState(initialState);

  const updateState = (updates) =>
    setState((prev) => ({ ...prev, ...updates }));

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    updateState({ logs: [...state.logs, { message, type, timestamp }] });
  };

  const toggleFormat = (format) => {
    updateState({
      selectedFormats: state.selectedFormats.includes(format)
        ? state.selectedFormats.filter((f) => f !== format)
        : [...state.selectedFormats, format],
    });
  };

  const handleDownload = (format) => {
    if (!state.results) return;

    switch (format) {
      case "csv":
        downloadFile(
          state.results.individualSeedsCSV,
          `all_seed_averages_${state.results.processedAirDensity}.csv`,
          "csv",
        );
        downloadFile(
          state.results.powerCurveCSV,
          `final_power_curve_${state.results.processedAirDensity}.csv`,
          "csv",
        );
        addLog(`Downloaded CSV files`, "success");
        break;

      case "xlsx":
        downloadFile(
          state.results.individualSeedsXLSX,
          `all_seed_averages_${state.results.processedAirDensity}.xlsx`,
          "xlsx",
        );
        downloadFile(
          state.results.powerCurveXLSX,
          `final_power_curve_${state.results.processedAirDensity}.xlsx`,
          "xlsx",
        );
        addLog(`Downloaded XLSX files`, "success");
        break;

      case "fw.txt":
        downloadFile(
          state.results.individualSeedsFW,
          `all_seed_averages_${state.results.processedAirDensity}.fw.txt`,
          "fw",
        );
        downloadFile(
          state.results.powerCurveFW,
          `final_power_curve_${state.results.processedAirDensity}.fw.txt`,
          "fw",
        );
        addLog(`Downloaded FW.TXT files`, "success");
        break;
    }
  };

  const handleFolderUpload = (e) => {
    const outFiles = Array.from(e.target.files).filter((file) =>
      file.name.toLowerCase().endsWith(".out"),
    );

    updateState({
      files: outFiles,
      selectedFiles: [],
      activeFile: null,
      results: null,
      error: null,
      logs: [],
      progress: 0,
      currentStep: "",
    });

    addLog(`Loaded ${outFiles.length} .out files from folder`, "success");
  };

  const toggleFileSelection = (fileName) => {
    updateState({
      selectedFiles: state.selectedFiles.includes(fileName)
        ? state.selectedFiles.filter((f) => f !== fileName)
        : [...state.selectedFiles, fileName],
    });
  };

  const handleProcessFiles = async () => {
    if (state.selectedFiles.length === 0) {
      alert("Please select files to process");
      return;
    }

    updateState({
      processing: true,
      error: null,
      results: null,
      logs: [],
      progress: 0,
      showLogs: true,
      sidebarCollapsed: true,
    });

    try {
      addLog(
        `Starting processing of ${state.selectedFiles.length} files...`,
        "info",
      );
      updateState({ currentStep: "Preparing files...", progress: 5 });

      const formData = new FormData();
      state.files.forEach((file) => {
        if (state.selectedFiles.includes(file.name))
          formData.append("files", file);
      });

      formData.append("airDensity", state.airDensity);
      formData.append("rotorArea", state.rotorArea);

      addLog(`Air Density: ${state.airDensity} kg/m³`, "info");
      addLog(`Rotor Area: ${state.rotorArea} m²`, "info");
      updateState({
        progress: 15,
        currentStep: "Uploading and parsing files...",
      });

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      updateState({ progress: 60, currentStep: "Processing data..." });
      addLog(`Analyzing data and calculating averages...`, "info");

      const data = await response.json();
      updateState({ progress: 85 });

      if (!response.ok) throw new Error(data.error || "Processing failed");

      addLog(`Successfully processed ${data.filesProcessed} files`, "success");
      addLog(
        `Generated power curve with ${data.powerCurve.length} data points`,
        "success",
      );

      if (data.globalRtAreaMean !== undefined) {
        addLog(
          `Global RtArea Mean: ${data.globalRtAreaMean.toFixed(4)} m²`,
          "success",
        );
      }
      if (data.globalRtAreaMax !== undefined) {
        addLog(
          `Global RtArea Max: ${data.globalRtAreaMax.toFixed(4)} m²`,
          "success",
        );
      }

      if (data.powerCurve.length > 0) {
        const maxPower = Math.max(...data.powerCurve.map((r) => r.power));
        const avgCp = (
          data.powerCurve.reduce((sum, r) => sum + r.cp, 0) /
          data.powerCurve.length
        ).toFixed(4);
        addLog(`Maximum power: ${maxPower.toFixed(2)} kW`, "success");
        addLog(`Average Cp: ${avgCp}`, "success");
      }

      updateState({
        results: {
          ...data,
          processedAirDensity: state.airDensity,
          processedRotorArea: state.rotorArea,
        },
        progress: 100,
        currentStep: "Complete!",
      });

      addLog(`Processing complete! Results ready for download.`, "success");
    } catch (err) {
      updateState({ error: err.message, progress: 0, currentStep: "" });
      addLog(`Error: ${err.message}`, "error");
      console.error("Processing error:", err);
    } finally {
      setTimeout(() => updateState({ processing: false }), 500);
    }
  };

  return {
    state,
    updateState,
    addLog,
    toggleFormat,
    handleDownload,
    handleFolderUpload,
    toggleFileSelection,
    handleProcessFiles,
  };
};
