import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";

export const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? {};
};

export const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.repayments)) return payload.repayments;
  return [];
};

export const valueOrDash = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  return String(value);
};

export const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function LmsPageShell({
  title,
  subtitle,
  badge,
  children,
  rightAction,
}) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/30" />
          <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                {badge || "LMS"}
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {title}
              </h1>

              <p className="mt-2 max-w-4xl text-sm font-semibold leading-relaxed text-white/90">
                {subtitle}
              </p>
            </div>

            {rightAction}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export function SummaryCard({ title, value, subtitle, tone = "blue" }) {
  const toneClass = {
    green: "text-emerald-700 bg-emerald-50 border-emerald-100",
    orange: "text-amber-700 bg-amber-50 border-amber-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    red: "text-rose-700 bg-rose-50 border-rose-100",
    slate: "text-slate-700 bg-slate-50 border-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
          toneClass[tone] || toneClass.blue
        }`}
      >
        {title}
      </div>

      <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>

      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

export function LmsDataTable({
  title,
  subtitle,
  rows,
  columns,
  loading,
  error,
  emptyText = "No records found.",
}) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return rows;

    return rows.filter((row) =>
      Object.values(row).join(" ").toLowerCase().includes(searchText),
    );
  }, [rows, search]);

  return (
    <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0f2942]">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {subtitle}
          </p>
          <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
        </div>

        <div className="relative w-full xl:w-[360px]">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[1100px] border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-blue-50 text-[11px] font-black uppercase tracking-wide text-blue-700">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableMessage colSpan={columns.length} message="Loading records..." />
            ) : error ? (
              <TableMessage colSpan={columns.length} message={error} error />
            ) : filteredRows.length === 0 ? (
              <TableMessage colSpan={columns.length} message={emptyText} />
            ) : (
              filteredRows.map((row, index) => (
                <tr
                  key={row.id || row.lan || index}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 font-semibold text-slate-700"
                    >
                      {column.render
                        ? column.render(row)
                        : valueOrDash(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableMessage({ colSpan, message, error = false }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`px-4 py-12 text-center text-sm font-black ${
          error ? "text-rose-600" : "text-slate-500"
        }`}
      >
        {message}
      </td>
    </tr>
  );
}

export function StatusPill({ children, tone = "blue" }) {
  const toneClass = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    orange: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    red: "border-rose-100 bg-rose-50 text-rose-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${
        toneClass[tone] || toneClass.blue
      }`}
    >
      {children}
    </span>
  );
}

export const statusTone = (status) => {
  const value = String(status || "").toUpperCase();

  if (
    value.includes("ACTIVE") ||
    value.includes("SUCCESS") ||
    value.includes("PAID") ||
    value.includes("COMPLETED") ||
    value.includes("APPROVED")
  ) {
    return "green";
  }

  if (
    value.includes("FAILED") ||
    value.includes("REJECTED") ||
    value.includes("OVERDUE")
  ) {
    return "red";
  }

  if (
    value.includes("PENDING") ||
    value.includes("DUE") ||
    value.includes("INITIATED")
  ) {
    return "orange";
  }

  return "blue";
};