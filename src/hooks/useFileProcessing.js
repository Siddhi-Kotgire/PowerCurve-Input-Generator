import { useCallback, useState } from "react";
import { downloadFile } from "../utils/fileUtils";
import { generateExports } from "@/utils/generateExports";
import { processOutFiles } from "@/utils/processOutFiles";

export const useFileProcessing = (initialState) => {
  const [state, setState] = useState(initialState);

  const updateState = useCallback(
    (updates) => setState((prev) => ({ ...prev, ...updates })),
    [],
  );

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, { message, type, timestamp }],
      showLogs: true,
    }));
  };

  const toggleFormat = (format) => {
    setState((prev) => ({
      ...prev,
      selectedFormats: prev.selectedFormats.includes(format)
        ? prev.selectedFormats.filter((f) => f !== format)
        : [...prev.selectedFormats, format],
    }));
  };

  const now = new Date();
  const formattedDate = now.toISOString().split("T")[0];

  const handleDownload = (format) => {
    if (!state.results) return;

    const { exports } = state.results;

    switch (format) {
      case "csv":
        downloadFile(
          exports.individualSeedsCSV,
          `all_seed_averages_${formattedDate}.csv`,
          "text/csv;charset=utf-8",
        );
        downloadFile(
          exports.powerCurveCSV,
          `final_power_curve_${formattedDate}.csv`,
          "text/csv;charset=utf-8",
        );
        addLog("Downloaded CSV files", "success");
        break;

      case "xlsx":
        downloadFile(
          exports.individualSeedsXLSX,
          `all_seed_averages_${formattedDate}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        downloadFile(
          exports.powerCurveXLSX,
          `final_power_curve_${formattedDate}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        addLog("Downloaded XLSX files", "success");
        break;

      case "fw":
      case "fw.txt":
        downloadFile(
          exports.individualSeedsFW,
          `all_seed_averages_${formattedDate}.fw.txt`,
          "text/plain;charset=utf-8",
        );
        downloadFile(
          exports.powerCurveFW,
          `final_power_curve_${formattedDate}.fw.txt`,
          "text/plain;charset=utf-8",
        );
        addLog("Downloaded FW files", "success");
        break;

      default:
        break;
    }
  };

  const handleFolderUpload = (e) => {
    const outFiles = Array.from(e.target.files).filter((file) =>
      file.name.toLowerCase().endsWith(".out"),
    );

    setState((prev) => ({
      ...prev,
      files: outFiles,
      selectedFiles: [],
      activeFile: null,
      results: null,
      error: null,
      logs: [],
      progress: 0,
      currentStep: "",
    }));

    addLog(`Loaded ${outFiles.length} .out files from folder`, "success");
  };

  const toggleFileSelection = (file) => {
    setState((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(file)
        ? prev.selectedFiles.filter((f) => f !== file)
        : [...prev.selectedFiles, file],
    }));
  };

  const handleProcessFiles = async () => {
    if (!state.selectedFiles.length) {
      updateState({ error: "No files selected" });
      return;
    }

    try {
      updateState({
        processing: true,
        progress: 0,
        currentStep: `Processing 0/${state.selectedFiles.length}`,
        error: null,
      });

      addLog("Started processing files");

      // const result = await processOutFiles(
      //   state.selectedFiles,
      //   // state.airDensity,
      //   (processed, total, percent, fileName) => {
      //     updateState({
      //       progress: percent,
      //       currentStep: fileName
      //         ? `Processing ${processed}/${total}: ${fileName}`
      //         : `Processing ${processed}/${total}`,
      //     });
      //   },
      // );

      const result = await processOutFiles(
        state.selectedFiles,
        undefined, // or state.airDensity / 1.225
        (processed, total, percent, fileName) => {
          updateState({
            progress: percent,
            currentStep: fileName
              ? `Processing ${processed}/${total}: ${fileName}`
              : `Processing ${processed}/${total}`,
          });
        },
      );

      updateState({
        progress: 100,
        currentStep: "Generating export files...",
      });

      // Generate CSV / XLSX / FW from utility
      const exports = generateExports({
        allFileResults: result.allFileResults,
        powerCurve: result.powerCurve,
        // processedAirDensity: state.airDensity,
      });

      updateState({
        results: {
          individualSeeds: result.allFileResults,
          powerCurve: result.powerCurve,
          stats: result.stats,
          filesProcessed: result.filesProcessed,
          globalRtAreaMean: result.globalRtAreaMean,
          globalRtAreaMax: result.globalRtAreaMax,
          // processedAirDensity: state.airDensity,
          exports,
        },
        processing: false,
        progress: 100,
        currentStep: "Complete",
      });

      addLog("Processing completed successfully", "success");
    } catch (err) {
      updateState({
        error: err.message,
        processing: false,
        progress: 0,
      });

      addLog(`Error: ${err.message}`, "error");
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
