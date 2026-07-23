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

export default function LmsCollections() {
  const query = useQuery({
    queryKey: ["lms-collections"],
    queryFn: () => lmsApi.collections({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const overdueAmount = rows.reduce(
    (sum, row) => sum + Number(row.overdueAmount || row.dueAmount || 0),
    0,
  );

  const highDpd = rows.filter((row) => Number(row.dpd || 0) > 30).length;

  const columns = [
    { key: "lan", label: "LAN" },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => row.customerName || row.customer_name || "—",
    },
    {
      key: "mobile",
      label: "Mobile",
      render: (row) => row.mobile || row.mobileNumber || "—",
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row) => formatDate(row.dueDate || row.due_date),
    },
    {
      key: "overdueAmount",
      label: "Overdue",
      render: (row) => formatCurrency(row.overdueAmount || row.dueAmount),
    },
    {
      key: "dpd",
      label: "DPD",
      render: (row) => row.dpd || 0,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill tone={statusTone(row.status || "OVERDUE")}>
          {formatStatus(row.status || "OVERDUE")}
        </StatusPill>
      ),
    },
  ];

  return (
    <LmsPageShell
      title="Collections"
      subtitle="Track overdue cases, DPD and collection follow-up queue."
      badge="LMS Collections"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Overdue Cases" value={rows.length} subtitle="Collection queue" tone="red" />
        <SummaryCard title="Overdue Amount" value={formatCurrency(overdueAmount)} subtitle="Total overdue" tone="red" />
        <SummaryCard title="30+ DPD" value={highDpd} subtitle="High priority cases" tone="orange" />
        <SummaryCard title="Follow-up Pending" value={rows.length} subtitle="Pending action" tone="blue" />
      </div>

      <LmsDataTable
        title="Collection Queue"
        subtitle="DPD-wise overdue records."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load collections." : ""}
        emptyText="No collection cases found."
      />
    </LmsPageShell>
  );
}