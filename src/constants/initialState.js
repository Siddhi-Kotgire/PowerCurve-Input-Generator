export const INITIAL_STATE = {
  files: [],
  selectedFiles: [],
  activeFile: null,
  airDensity: 1.225,
  rotorArea: 26830,
  processing: false,
  progress: 0,
  currentStep: "",
  results: null,
  error: null,
  logs: [],
  showLogs: false,
  sidebarCollapsed: false,
  filesCollapsed: false,
  parametersCollapsed: false,
  selectedFormats: ["csv"], // Default format
  showFormatDropdown: false,
};
