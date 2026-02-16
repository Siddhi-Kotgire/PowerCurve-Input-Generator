"use client";

import { useRef, useEffect } from "react";
import { useFileProcessing } from "../hooks/useFileProcessing";
import { INITIAL_STATE } from "../constants/initialState";

import Icon from "../components/common/Icon";
import Button from "../components/common/Button";
import InstructionSteps from "../components/InstructionSteps";
import FormatDropdown from "../components/FormatDropdown";
import FileList from "../components/FileList";
import ResultsView from "../components/ResultsView";

import "../styles/globals.css";

export default function Home() {
  const logsEndRef = useRef(null);

  const {
    state,
    updateState,
    addLog,
    toggleFormat,
    handleDownload,
    handleFolderUpload,
    toggleFileSelection,
    handleProcessFiles,
  } = useFileProcessing(INITIAL_STATE);

  /* Auto-scroll logs */
  useEffect(() => {
    if (state.showLogs) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.logs, state.showLogs]);

  /* Auto-hide logs panel after success */
  useEffect(() => {
    if (state.results && state.showLogs) {
      const timer = setTimeout(
        () => updateState({ showLogs: false }),
        2500
      );
      return () => clearTimeout(timer);
    }
  }, [state.results]);

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col overflow-hidden font-sans antialiased">

      {/* ================= HEADER ================= */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">

            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Power Curve Input Generator
            </h1>

            <div className="flex items-center gap-4">

              {/* Selected Count */}
              <div className="bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Selected:</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {state.selectedFiles.length}
                  </span>
                  <span className="text-xs text-zinc-500">
                    / {state.files.length}
                  </span>
                </div>
              </div>

              {/* Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  webkitdirectory="true"
                  directory=""
                  multiple
                  onChange={handleFolderUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 bg-blue-500 text-zinc-100 px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition shadow-lg">
                  <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  Upload Folder
                </span>
              </label>

              {/* Process Button */}
              <Button
                onClick={handleProcessFiles}
                disabled={
                  state.processing || state.selectedFiles.length === 0
                }
                className="px-6 py-3 font-semibold"
              >
                <Icon path="M13 10V3L4 14h7v7l9-11h-7z" />
                {state.processing ? "Processing..." : "Generate Files"}
              </Button>
            </div>
          </div>
        </div>

        {/* Progress */}
        {state.processing && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">
                {state.currentStep}
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {state.progress}%
              </span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/50"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ================= BODY ================= */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <FileList
          files={state.files}
          selectedFiles={state.selectedFiles}
          activeFile={state.activeFile}
          sidebarCollapsed={state.sidebarCollapsed}
          filesCollapsed={state.filesCollapsed}
          updateState={updateState}
          addLog={addLog}
          toggleFileSelection={toggleFileSelection}
        />

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-8">

            {/* Error */}
            {state.error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                <div className="font-semibold text-red-300 mb-1">
                  Processing Error
                </div>
                <div className="text-sm text-red-400">
                  {state.error}
                </div>
              </div>
            )}

            {/* Instructions */}
            {!state.results && !state.processing && (
              <InstructionSteps
                filesCount={state.files.length}
                selectedCount={state.selectedFiles.length}
              />
            )}

            {/* Results */}
            {state.results && (
              <ResultsView
                state={state}
                updateState={updateState}
                toggleFormat={toggleFormat}
                handleDownload={handleDownload}
              />
            )}

            {/* Preview */}
            {!state.results &&
              !state.processing &&
              state.activeFile && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-6">
                    File Preview
                  </h2>

                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
                    <div className="space-y-4">
                      <InfoRow label="File Name" value={state.activeFile.name} mono />
                      <InfoRow
                        label="File Size"
                        value={`${(state.activeFile.size / 1024).toFixed(2)} KB`}
                      />
                      <InfoRow
                        label="File Type"
                        value={state.activeFile.type || "application/octet-stream"}
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* ================= LOGS ================= */}
          {state.logs.length > 0 && (
            <div
              className={`border-t border-zinc-800 bg-zinc-900/50 flex flex-col transition-all duration-300 ${
                state.showLogs ? "h-64" : "h-12"
              }`}
            >
              <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase">
                  Processing Logs
                </h3>

                <button
                  onClick={() =>
                    updateState({ showLogs: !state.showLogs })
                  }
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <Icon
                    path="M19 9l-7 7-7-7"
                    className={`${state.showLogs ? "" : "rotate-180"}`}
                  />
                </button>
              </div>

              {state.showLogs && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
                  {state.logs.map((log, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded ${
                        log.type === "error"
                          ? "bg-red-500/10 text-red-300"
                          : log.type === "success"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      [{log.timestamp}] {log.message}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* Small helper component */
function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-700 last:border-0">
      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>
      <span
        className={`text-sm text-zinc-100 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
