import { useState } from "react";
import { downloadFile } from "../utils/fileUtils";
import { processFilesInBrowser } from "../utils/processOutFiles";

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

 const toggleFileSelection = (file) => {
   updateState({
     selectedFiles: state.selectedFiles.includes(file)
       ? state.selectedFiles.filter((f) => f !== file)
       : [...state.selectedFiles, file],
   });
 };


  const handleProcessFiles = async () => {
    if (!state.selectedFiles.length) {
      updateState({ error: "No files selected" });
      return;
    }

    try {
      updateState({
        processing: true,
        progress: 10,
        currentStep: "Reading files...",
        error: null,
      });

      const { allFileResults, powerCurve } = await processFilesInBrowser(
        state.selectedFiles,
      );

      updateState({
        progress: 80,
        currentStep: "Finalizing results...",
      });

      updateState({
        results: {
          individualSeeds: allFileResults,
          powerCurve,
        },
        processing: false,
        progress: 100,
        currentStep: "Complete",
      });
    } catch (err) {
      updateState({
        error: err.message,
        processing: false,
        progress: 0,
      });
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
