# Power Curve Input Generator

A browser-based Next.js app for processing FAST/OpenFAST-style `.out` files and generating power-curve deliverables in `CSV`, `XLSX`, and fixed-width text (`.fw.txt`) formats.

## What This Project Does

The app lets you upload a folder of simulation output files, select which files to include, and compute:

- Per-file averaged metrics ("all seed averages")
- Grouped and averaged power-curve rows

Exports are generated client-side and downloaded directly in the browser.

## Core Features

- Folder upload and automatic `.out` filtering
- Multi-file selection with select-all / deselect-all controls
- Streaming file processing in the browser for large text files
- Progress and processing logs UI
- Aggregated outputs:
  - Individual seed averages
  - Final grouped power curve
- Export formats:
  - `CSV`
  - `XLSX`
  - `FW.TXT` (fixed-width text)

## Data Processing Logic

Processing is implemented in `src/utils/processOutFiles.js`.

### Required/used columns

The parser looks for these headers in `.out` files:

- `Time`
- `GenPwr`
- `GenTq`
- `GenSpeed`
- `RtAeroCp`
- `RtAeroCt`
- `BldPitch1`
- `BldPitch2`
- `BldPitch3`
- `WindHubVelX`
- `WindHubVelY`
- `WindHubVelZ`
- `RtArea`

### How values are computed

- Each selected file is read as a stream and averaged row-by-row.
- Wind speed is computed as vector magnitude:
  `sqrt(WindHubVelX^2 + WindHubVelY^2 + WindHubVelZ^2)`
- Files are grouped by filename prefix:
  - If a name includes `_seed`, grouping key is everything before `_seed`.
  - Otherwise, grouping key is the filename without extension.
- Group wind speed is rounded to nearest `0.5`.
- Group rows are sorted by wind speed.

## Output Files

When downloading a format, two files are generated:

- `all_seed_averages_YYYY-MM-DD.<ext>`
- `final_power_curve_YYYY-MM-DD.<ext>`

Where `<ext>` is one of:

- `csv`
- `xlsx`
- `fw.txt`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- `xlsx` for workbook generation
- ESLint 9

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
src/
  app/
    page.js                  # Main UI composition
  hooks/
    useFileProcessing.js     # State + orchestration for upload/process/export
  utils/
    processOutFiles.js       # Streaming parser + aggregation logic
    generateExports.js       # CSV/XLSX/fixed-width generation
    fileUtils.js             # Browser download helper
  components/
    FileList.jsx
    ResultsView.jsx
    FormatDropdown.jsx
    InstructionSteps.jsx
```

## Deployment

Netlify is preconfigured:

- Build command: `npm run build`
- Plugin: `@netlify/plugin-nextjs`

See `netlify.toml`.

## Notes and Limitations

- Folder upload depends on browser support for directory selection (`webkitdirectory`).
- Processing is fully client-side, so browser memory/CPU limits apply for very large batches.
- Current export sanitization removes rotor area columns from exported datasets.

## License

Private project (no open-source license declared).
