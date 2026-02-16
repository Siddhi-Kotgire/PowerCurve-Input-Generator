const TableHeader = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
    {children}
  </th>
);

const TableCell = ({ children, bold = false }) => (
  <td
    className={`px-6 py-4 text-zinc-300 ${bold ? "font-medium text-zinc-100" : ""}`}
  >
    {children}
  </td>
);

const StatCard = ({ label, value, unit }) => (
  <div>
    <div className="text-xs text-zinc-400 mb-1">{label}</div>
    <div className="text-sm font-medium text-zinc-100">
      {value} {unit && <span className="text-xs text-zinc-400">{unit}</span>}
    </div>
  </div>
);

export { TableHeader, TableCell, StatCard };
