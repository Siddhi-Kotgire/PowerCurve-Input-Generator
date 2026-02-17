import Icon from "./common/Icon";

const InstructionSteps = ({ filesCount, selectedCount }) => {
  const steps = [
    {
      number: 1,
      title: "Upload Folder",
      description: "Click the 'Upload Folder' button to select your .out files",
      completed: filesCount > 0,
    },
    {
      number: 2,
      title: "Select Files",
      description: "Choose the files you want to process from the sidebar",
      completed: selectedCount > 0,
    },
    {
      number: 3,
      title: "Generate Files",
      description: "Click 'Generate Files' to start processing",
      completed: false,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Get Started</h2>
        <p className="text-zinc-400">
          Follow these steps to generate your power curve
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`relative flex items-start space-x-4 p-4 rounded-lg transition-all ${
              step.completed
                ? "bg-zinc-800 border border-zinc-600"
                : "bg-zinc-800/50 border border-zinc-700"
            }`}
          >
            {index < steps.length - 1 && (
              <div
                className={`absolute left-8 top-16 w-0.5 h-8 ${
                  step.completed ? "bg-zinc-600" : "bg-zinc-700"
                }`}
              />
            )}

            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                step.completed
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {step.completed ? (
                <svg
                  className="w-6 h-6"
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
              ) : (
                step.number
              )}
            </div>

            <div className="flex-1 pt-1">
              <h3
                className={`text-lg font-semibold mb-1 ${
                  step.completed ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400">{step.description}</p>

              {step.number === 1 && filesCount > 0 && (
                <div className="mt-2 text-xs text-emerald-400 font-medium">
                  ✓ {filesCount} files loaded
                </div>
              )}
              {step.number === 2 && selectedCount > 0 && (
                <div className="mt-2 text-xs text-emerald-400 font-medium">
                  ✓ {selectedCount} files selected
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5"
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
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-1">
              Pro Tip
            </h4>
            <p className="text-xs text-zinc-400">
              You can use the &quot;Select All&quot; button in the sidebar to
              quickly select all uploaded files, or choose specific files for
              targeted analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionSteps;
