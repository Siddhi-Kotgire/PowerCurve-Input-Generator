import Icon from "./common/Icon";
import Button from "./common/Button";

const FileList = ({
  files,
  selectedFiles,
  activeFile,
  sidebarCollapsed,
  filesCollapsed,
  updateState,
  addLog,
  toggleFileSelection,
}) => {
  const renderFileItem = (file, index) => {
    const isSelected = selectedFiles.some((f) => f.name === file.name);
    const isActive = activeFile?.name === file.name;

    return (
      <div
        key={index}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
          isActive
            ? "bg-zinc-800 border-zinc-700 shadow-lg ring-2 ring-emerald-500/50"
            : isSelected
              ? "bg-emerald-500/10 border-emerald-500/30 shadow-md"
              : "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800"
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleFileSelection(file)}
          className="w-4 h-4 text-emerald-500 bg-zinc-700 border-zinc-600 rounded focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
        />

        <div
          className="flex-1 truncate text-sm"
          onClick={() => updateState({ activeFile: file })}
          title={file.name}
        >
          <span
            className={
              isSelected ? "text-emerald-300 font-medium" : "text-zinc-300"
            }
          >
            {file.name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-85"
      }`}
    >
      <div className="px-4 py-1 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        {!sidebarCollapsed && (
          <h2 className="text-sm text-zinc-200 uppercase tracking-wide">
            File Manager
          </h2>
        )}
        <button
          onClick={() => updateState({ sidebarCollapsed: !sidebarCollapsed })}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-all text-zinc-400 hover:text-zinc-200"
        >
          <Icon
            path="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            className={`w-5 h-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {!sidebarCollapsed ? (
        <div
          className={`flex flex-col border-b border-zinc-800 transition-all duration-300 ${
            filesCollapsed ? "flex-shrink-0" : "flex-1 min-h-0"
          }`}
        >
          <div className="px-4 py-1 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/30 flex-shrink-0">
            <h3 className="text-sm text-zinc-200 uppercase tracking-wide">
              Output Files {files.length > 0 && `(${files.length})`}
            </h3>
            <button
              onClick={() => updateState({ filesCollapsed: !filesCollapsed })}
              className="p-1.5 hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-zinc-200"
            >
              <Icon
                path="M19 9l-7 7-7-7"
                className={`transition-transform ${filesCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {!filesCollapsed && (
            <>
              {files.length > 0 && (
                <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                  <Button
                    onClick={() => {
                      const allSelected = selectedFiles.length === files.length;
                      updateState({
                        selectedFiles: allSelected ? [] : files,
                      });
                      addLog(
                        allSelected
                          ? "Deselected all files"
                          : `Selected all ${files.length} files`,
                        "info",
                      );
                    }}
                    variant="ghost"
                    className="w-full text-xs"
                  >
                    {selectedFiles.length === files.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {files.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon
                      path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      className="w-12 h-12 mx-auto text-zinc-700 mb-3"
                    />
                    <p className="text-xs text-zinc-400 font-medium">
                      No folder selected
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Upload to get started
                    </p>
                  </div>
                ) : (
                  files.map(renderFileItem)
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Icon
              path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              className="w-8 h-8 mx-auto text-zinc-600 mb-2"
            />
            <p className="text-xs text-zinc-500 transform rotate-90 whitespace-nowrap mt-4">
              {files.length} files
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default FileList;
