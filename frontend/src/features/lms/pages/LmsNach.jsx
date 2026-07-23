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

export default function LmsNach() {
  const query = useQuery({
    queryKey: ["lms-nach"],
    queryFn: () => lmsApi.nach({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const active = rows.filter((row) =>
    String(row.status || "").toUpperCase().includes("ACTIVE"),
  ).length;

  const pending = rows.filter((row) =>
    String(row.status || "").toUpperCase().includes("PENDING"),
  ).length;

  const columns = [
    { key: "lan", label: "LAN" },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => row.customerName || row.customer_name || "—",
    },
    {
      key: "mandateId",
      label: "Mandate ID",
      render: (row) => row.mandateId || row.mandate_id || "—",
    },
    {
      key: "amount",
      label: "Mandate Amount",
      render: (row) => formatCurrency(row.amount || row.mandateAmount),
    },
    {
      key: "bank",
      label: "Bank",
      render: (row) => row.bankName || row.bank || "—",
    },
    {
      key: "registeredAt",
      label: "Registered On",
      render: (row) => formatDate(row.registeredAt || row.createdAt),
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
      title="NACH / eNACH"
      subtitle="Track mandate registration, bank details and NACH status."
      badge="LMS NACH"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Mandates" value={rows.length} subtitle="Total mandates" />
        <SummaryCard title="Active" value={active} subtitle="Active mandates" tone="green" />
        <SummaryCard title="Pending" value={pending} subtitle="Pending registration" tone="orange" />
        <SummaryCard title="Failed" value="0" subtitle="Failed mandates" tone="red" />
      </div>

      <LmsDataTable
        title="Mandate List"
        subtitle="NACH and eNACH records."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load NACH records." : ""}
        emptyText="No NACH records found."
      />
    </LmsPageShell>
  );
}