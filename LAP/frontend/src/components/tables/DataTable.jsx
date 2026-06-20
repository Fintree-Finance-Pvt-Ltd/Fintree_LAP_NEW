export default function DataTable({ columns = [], rows = [] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-3 py-2 text-left font-bold text-slate-600"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-slate-100">
            {columns.map((column) => (
              <td key={column.key} className="px-3 py-2 text-slate-700">
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

