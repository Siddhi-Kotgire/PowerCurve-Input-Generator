import { useState, useRef, useEffect } from "react";
import Icon from "./common/Icon";

const FormatDropdown = ({
  selectedFormats,
  toggleFormat,
  onDownload,
  disabled,
  isOpen,
  setIsOpen,
}) => {
  const formats = [
    {
      key: "csv",
      label: "CSV",
      desc: "Comma-Separated Values",
      icon: "📊",
      available: true,
    },
    {
      key: "xlsx",
      label: "XLSX",
      desc: "Excel Workbook",
      icon: "📗",
      available: true,
    },
    {
      key: "fw.txt",
      label: "FW.TXT",
      desc: "Fixed-Width Text",
      icon: "📝",
      available: true,
    },
  ];

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/50"
      >
        <Icon path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        Download Files
        <Icon
          path={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          className="w-4 h-4 ml-1"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slideDown">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800 to-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Icon
                    path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    className="w-4 h-4 text-emerald-400"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Export Format
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Choose your preferred file format
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Format Options */}
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-3 space-y-2">
              {formats.map((format) => {
                const isSelected = selectedFormats.includes(format.key);
                const isAvailable = format.available;

                return (
                  <div
                    key={format.key}
                    className={`group rounded-lg border transition-all ${
                      !isAvailable
                        ? "bg-zinc-800/30 border-zinc-700/50 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 border-emerald-600/50 shadow-lg shadow-emerald-900/20"
                          : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer"
                    }`}
                  >
                    <button
                      onClick={() => isAvailable && toggleFormat(format.key)}
                      disabled={disabled || !isAvailable}
                      className="w-full flex items-center gap-3 p-3.5 transition-colors disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl">{format.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-100">
                            {format.label}
                          </span>
                          {!isAvailable && (
                            <span className="px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-[10px] font-medium rounded uppercase tracking-wide">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {format.desc}
                        </div>
                      </div>

                      {isAvailable && (
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500 shadow-sm"
                              : "border-zinc-600 group-hover:border-zinc-500"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </button>

                    {isSelected && isAvailable && (
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => {
                            onDownload(format.key);
                            setIsOpen(false);
                          }}
                          disabled={disabled}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50"
                        >
                          <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          Download {format.label}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="px-4 py-3 border-t border-zinc-700/50 bg-zinc-900/50">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon
                    path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    className="w-3 h-3 text-blue-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Each download includes{" "}
                    <span className="font-semibold text-zinc-100">
                      seed averages
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold text-zinc-100">
                      power curve
                    </span>{" "}
                    data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormatDropdown;
