export default function StatusChip({ status }) {
  const cls =
    status === "APPROVED"
      ? "bg-green-100 text-green-800 border-green-200"
      : status === "REJECTED"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {status}
    </span>
  );
}

