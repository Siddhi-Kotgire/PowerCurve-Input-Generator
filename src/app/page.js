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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.logs]);

  useEffect(() => {
    if (state.results && state.showLogs) {
      const timer = setTimeout(() => updateState({ showLogs: false }), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.results, state.showLogs]);

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col overflow-hidden font-sans antialiased">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 shadow-2xl">
        <div className="px-4 py-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Power Curve Input Generator
            </h1>

            <div className="flex items-center gap-4">
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

              <label className="cursor-pointer">
                <input
                  type="file"
                  webkitdirectory="true"
                  directory=""
                  multiple
                  onChange={handleFolderUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 bg-blue-500 text-zinc-100 px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all shadow-lg">
                  <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  Upload Folder
                </span>
              </label>

              <Button
                onClick={handleProcessFiles}
                disabled={state.processing || state.selectedFiles.length === 0}
                className="px-6 py-3 font-semibold"
              >
                <Icon path="M13 10V3L4 14h7v7l9-11h-7z" />
                {state.processing ? "Processing..." : "Generate Files"}
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {state.processing && (
          <div className="px-8 pb-6">
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
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/50 relative overflow-hidden"
                style={{ width: `${state.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Body */}
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

        {/* Main Panel */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-8">
            {state.error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-red-300 mb-1">
                      Processing Error
                    </div>
                    <div className="text-sm text-red-400">{state.error}</div>
                  </div>
                </div>
              </div>
            )}

            {!state.results && !state.processing && (
              <InstructionSteps
                filesCount={state.files.length}
                selectedCount={state.selectedFiles.length}
              />
            )}

            {state.results ? (
              <ResultsView
                state={state}
                updateState={updateState}
                toggleFormat={toggleFormat}
                handleDownload={handleDownload}
              />
            ) : state.activeFile ? (
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-6">
                  File Preview
                </h2>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                  <div className="space-y-4">
                    {[
                      {
                        label: "File Name",
                        value: state.activeFile.name,
                        mono: true,
                      },
                      {
                        label: "File Size",
                        value: `${(state.activeFile.size / 1024).toFixed(2)} KB`,
                      },
                      {
                        label: "File Type",
                        value:
                          state.activeFile.type || "application/octet-stream",
                      },
                    ].map(({ label, value, mono }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-3 border-b border-zinc-700 last:border-0"
                      >
                        <span className="text-sm font-medium text-zinc-300">
                          {label}
                        </span>
                        <span
                          className={`text-sm text-zinc-100 ${mono ? "font-mono" : ""}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Icon
                    path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    className="w-20 h-20 mx-auto text-zinc-700 mb-4"
                  />
                  <p className="text-zinc-400 text-lg font-medium mb-2">
                    {state.files.length === 0
                      ? "Upload a folder to get started"
                      : "Configure parameters and process your files"}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    Advanced wind turbine performance analysis
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logs Panel */}
          {state.logs.length > 0 && (
            <div
              className={`border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col transition-all duration-300 ${
                state.showLogs ? "h-64" : "h-12"
              } flex-shrink-0`}
            >
              <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                  Processing Logs {!state.showLogs && `(${state.logs.length})`}
                </h3>
                <div className="flex items-center gap-2">
                  {state.showLogs && (
                    <button
                      onClick={() => updateState({ logs: [] })}
                      className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-all font-medium shadow-lg"
                    >
                      Clear Logs
                    </button>
                  )}
                  <button
                    onClick={() => updateState({ showLogs: !state.showLogs })}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-zinc-400 hover:text-zinc-200"
                  >
                    <Icon
                      path="M19 9l-7 7-7-7"
                      className={`transition-transform ${state.showLogs ? "" : "rotate-180"}`}
                    />
                  </button>
                </div>
              </div>

              {state.showLogs && (
                <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
                  {state.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 px-3 py-2 rounded-lg ${
                        log.type === "error"
                          ? "bg-red-500/10 text-red-300 border border-red-500/20"
                          : log.type === "success"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50"
                      }`}
                    >
                      <span className="text-zinc-500">[{log.timestamp}]</span>
                      <span className="flex-1">{log.message}</span>
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
