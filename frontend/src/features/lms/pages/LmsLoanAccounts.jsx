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

export default function LmsLoanAccounts() {
  const query = useQuery({
    queryKey: ["lms-loan-accounts"],
    queryFn: () => lmsApi.loanAccounts({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const activeLoans = rows.filter((row) =>
    String(row.status || row.loanStatus || "").toUpperCase().includes("ACTIVE"),
  ).length;

  const closedLoans = rows.filter((row) =>
    String(row.status || row.loanStatus || "").toUpperCase().includes("CLOSED"),
  ).length;

  const totalPortfolio = rows.reduce(
    (sum, row) => sum + Number(row.sanctionedAmount || row.disbursedAmount || 0),
    0,
  );

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
      key: "sanctionedAmount",
      label: "Sanctioned",
      render: (row) =>
        formatCurrency(row.sanctionedAmount || row.approvedAmount),
    },
    {
      key: "disbursedAmount",
      label: "Disbursed",
      render: (row) =>
        formatCurrency(row.disbursedAmount || row.sanctionedAmount),
    },
    {
      key: "roi",
      label: "ROI",
      render: (row) => (row.roi ? `${row.roi}%` : "—"),
    },
    {
      key: "tenure",
      label: "Tenure",
      render: (row) =>
        row.tenureMonths || row.tenure
          ? `${row.tenureMonths || row.tenure} months`
          : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill tone={statusTone(row.status || row.loanStatus)}>
          {formatStatus(row.status || row.loanStatus)}
        </StatusPill>
      ),
    },
    {
      key: "createdAt",
      label: "Booked On",
      render: (row) => formatDate(row.createdAt || row.created_at),
    },
  ];

  return (
    <LmsPageShell
      title="Loan Accounts"
      subtitle="View all booked loan accounts, LAN details, borrower information and account status."
      badge="LMS Loan Accounts"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Total Accounts" value={rows.length} subtitle="Booked LAN records" />
        <SummaryCard title="Active Loans" value={activeLoans} subtitle="Currently active loans" tone="green" />
        <SummaryCard title="Closed Loans" value={closedLoans} subtitle="Fully closed accounts" tone="slate" />
        <SummaryCard title="Portfolio" value={formatCurrency(totalPortfolio)} subtitle="Total booked value" tone="blue" />
      </div>

      <LmsDataTable
        title="Loan Account List"
        subtitle="LAN-wise portfolio account view."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load loan accounts." : ""}
        emptyText="No loan accounts found."
      />
    </LmsPageShell>
  );
}