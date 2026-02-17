import FormatDropdown from "./FormatDropdown";
import { TableHeader, TableCell, StatCard } from "./common/Table";

const formatNumber = (value, digits = 4) => {
  if (typeof value !== "number" || isNaN(value)) return "-";
  return value.toFixed(digits);
};

const ResultsView = ({ state, updateState, toggleFormat, handleDownload }) => {
  const renderConfigBanner = () => (
    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-zinc-700/50 rounded-lg">
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            Processing Configuration
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-3">
            {/* <StatCard
              label="Air Density"
              value={state.airDensity}
              unit="kg/m³"
            /> */}
            <StatCard
              label="RtArea Mean"
              value={state.results?.globalRtAreaMean?.toFixed(4) || "N/A"}
              unit="m²"
            />
            <StatCard
              label="RtArea Max"
              value={state.results?.globalRtAreaMax?.toFixed(4) || "N/A"}
              unit="m²"
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400 pt-3 border-t border-zinc-700/50">
            <span>{state.results?.filesProcessed} files processed</span>
            <span>{state.results?.powerCurve.length} wind speed groups</span>
            <span>
              Min Speed:{" "}
              {Math.min(
                ...state.results.powerCurve.map((r) => r.windSpeed),
              ).toFixed(4)}{" "}
              m/s
            </span>
            <span>
              Avg Speed:{" "}
              {(
                state.results.powerCurve.reduce(
                  (sum, r) => sum + r.windSpeed,
                  0,
                ) / state.results.powerCurve.length
              ).toFixed(4)}{" "}
              m/s
            </span>

            <span>
              Max Speed:{" "}
              {Math.max(
                ...state.results.powerCurve.map((r) => r.windSpeed),
              ).toFixed(4)}{" "}
              m/s
            </span>

            <span>
              Max Power:{" "}
              {Math.max(
                ...state.results.powerCurve.map((r) => r.power),
              ).toFixed(4)}{" "}
              kW
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
      <div className="px-6 py-4 border-b border-zinc-700 bg-zinc-900/50">
        <h3 className="text-lg font-semibold text-zinc-100">
          Final Power Curve
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Averaged results across all processed files
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/70 border-b border-zinc-700 sticky top-0 backdrop-blur-sm">
              <tr>
                <TableHeader>Wind Speed (m/s)</TableHeader>
                <TableHeader>Power (kW)</TableHeader>
                <TableHeader>Torque (kNm)</TableHeader>
                <TableHeader>Gen Speed (RPM)</TableHeader>
                <TableHeader>Cp</TableHeader>
                <TableHeader>Ct</TableHeader>
                <TableHeader>Bladepitch 1 (DEG)</TableHeader>
                <TableHeader>Bladepitch 2 (DEG)</TableHeader>
                <TableHeader>Bladepitch 3 (DEG)</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {state.results.powerCurve.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-zinc-700/30 transition-colors"
                >
                  <TableCell bold>{row.windSpeed.toFixed(4)}</TableCell>
                  <TableCell>{formatNumber(row.power, 4)}</TableCell>
                  <TableCell>{row.torque.toFixed(4)}</TableCell>
                  <TableCell>{row.genSpeed.toFixed(4)}</TableCell>
                  <TableCell>{row.cp.toFixed(4)}</TableCell>
                  <TableCell>{row.ct.toFixed(4)}</TableCell>
                  <TableCell>{row.bladePitch1.toFixed(4)}</TableCell>
                  <TableCell>{row.bladePitch2.toFixed(4)}</TableCell>
                  <TableCell>{row.bladePitch3.toFixed(4)}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-2">
            <svg
              className="w-7 h-7 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Processing Complete
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Select format and download your results
          </p>
        </div>

        <FormatDropdown
          selectedFormats={state.selectedFormats}
          toggleFormat={toggleFormat}
          onDownload={handleDownload}
          disabled={!state.results || state.processing}
          isOpen={state.showFormatDropdown}
          setIsOpen={(value) => updateState({ showFormatDropdown: value })}
        />
      </div>

      {renderConfigBanner()}
      {renderTable()}
    </div>
  );
};

export default ResultsView;
