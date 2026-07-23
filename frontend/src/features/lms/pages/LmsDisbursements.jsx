import { useQuery } from "@tanstack/react-query";

import { lmsApi } from "../lmsApi.js";
import {
  formatCurrency,
  formatDate,
  formatStatus,
  LmsDataTable,
  LmsPageShell,
  normalizeRows,
  StatusPill,
  statusTone,
  SummaryCard,
  unwrapPayload,
} from "./LmsShared.jsx";

export default function LmsDisbursements() {
  const query = useQuery({
    queryKey: ["lms-disbursements"],
    queryFn: () => lmsApi.disbursements({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.disbursedAmount || row.amount || 0),
    0,
  );

  const pendingCount = rows.filter((row) =>
    String(row.status || "").toUpperCase().includes("PENDING"),
  ).length;

  const completedCount = rows.filter((row) =>
    String(row.status || "").toUpperCase().includes("COMPLETED") ||
    String(row.status || "").toUpperCase().includes("DISBURSED"),
  ).length;

  const columns = [
    { key: "lan", label: "LAN" },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => row.customerName || row.customer_name || "—",
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => formatCurrency(row.disbursedAmount || row.amount),
    },
    {
      key: "disbursementDate",
      label: "Disbursed On",
      render: (row) => formatDate(row.disbursementDate || row.disbursedAt),
    },
    {
      key: "utr",
      label: "UTR",
      render: (row) => row.utr || row.utrNumber || "—",
    },
    {
      key: "bankName",
      label: "Bank",
      render: (row) => row.bankName || row.bank || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill tone={statusTone(row.status)}>
          {formatStatus(row.status)}
        </StatusPill>
      ),
    },
  ];

  return (
    <LmsPageShell
      title="Disbursements"
      subtitle="Track disbursement records, UTR references and disbursement status."
      badge="LMS Disbursements"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Total Records" value={rows.length} subtitle="Disbursement entries" />
        <SummaryCard title="Disbursed Amount" value={formatCurrency(totalAmount)} subtitle="Total disbursed value" tone="green" />
        <SummaryCard title="Completed" value={completedCount} subtitle="Disbursed successfully" tone="green" />
        <SummaryCard title="Pending" value={pendingCount} subtitle="Pending disbursement" tone="orange" />
      </div>

      <LmsDataTable
        title="Disbursement Records"
        subtitle="All disbursement transactions."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load disbursements." : ""}
        emptyText="No disbursement records found."
      />
    </LmsPageShell>
  );
}