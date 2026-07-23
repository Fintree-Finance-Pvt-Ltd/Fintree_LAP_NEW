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

export default function LmsRepayments() {
  const query = useQuery({
    queryKey: ["lms-repayments"],
    queryFn: () => lmsApi.repayments({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const collectedAmount = rows.reduce(
    (sum, row) => sum + Number(row.transfer_amount || row.amount || row.transferAmount || 0),
    0,
  );

  const columns = [
    { key: "lan", label: "LAN" },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (row) => formatDate(row.payment_date || row.paymentDate),
    },
    {
      key: "bankDate",
      label: "Bank Date",
      render: (row) => formatDate(row.bank_date || row.bankDate),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) =>
        formatCurrency(row.transfer_amount || row.transferAmount || row.amount),
    },
    {
      key: "utr",
      label: "UTR",
      render: (row) => row.utr || row.utrNumber || "—",
    },
    {
      key: "paymentMode",
      label: "Mode",
      render: (row) => row.payment_mode || row.paymentMode || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill tone={statusTone(row.status)}>
          {formatStatus(row.status || "Posted")}
        </StatusPill>
      ),
    },
  ];

  return (
    <LmsPageShell
      title="Repayments"
      subtitle="View repayment transactions, UTR details, allocation and collection status."
      badge="LMS Repayments"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Transactions" value={rows.length} subtitle="Repayment records" />
        <SummaryCard title="Collected" value={formatCurrency(collectedAmount)} subtitle="Total collection value" tone="green" />
        <SummaryCard title="Posted" value={rows.length} subtitle="Records in system" tone="blue" />
        <SummaryCard title="Exceptions" value="0" subtitle="Pending correction" tone="orange" />
      </div>

      <LmsDataTable
        title="Repayment Records"
        subtitle="LAN-wise repayment transactions."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load repayments." : ""}
        emptyText="No repayments found."
      />
    </LmsPageShell>
  );
}