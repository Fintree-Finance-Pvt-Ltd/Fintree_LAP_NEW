import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

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

const defaultForm = {
  lan: "",
  utr: "",
  paymentDate: "",
  bankDate: "",
  paymentMode: "NEFT",
  transferAmount: "",
};

export default function LmsUtrUpload() {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");

  const query = useQuery({
    queryKey: ["lms-utr-uploads"],
    queryFn: () => lmsApi.utrUploads({ page: 1, limit: 500 }),
    retry: false,
  });

  const rows = normalizeRows(unwrapPayload(query.data));

  const uploadMutation = useMutation({
    mutationFn: () =>
      lmsApi.uploadUtr({
        rows: [
          {
            lan: form.lan,
            utr: form.utr,
            payment_date: form.paymentDate,
            bank_date: form.bankDate || form.paymentDate,
            payment_mode: form.paymentMode,
            transfer_amount: Number(form.transferAmount),
          },
        ],
      }),

    onSuccess: (response) => {
      setMessage(response?.data?.message || "UTR uploaded successfully.");
      setForm(defaultForm);
      query.refetch();
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload UTR.",
      );
    },
  });

  const updateForm = (field, value) => {
    setMessage("");
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!form.lan || !form.utr || !form.paymentDate || !form.transferAmount) {
      setMessage("Please fill LAN, UTR, Payment Date and Amount.");
      return;
    }

    uploadMutation.mutate();
  };

  const columns = [
    { key: "lan", label: "LAN" },
    { key: "utr", label: "UTR" },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (row) => formatDate(row.payment_date || row.paymentDate),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) =>
        formatCurrency(row.transfer_amount || row.transferAmount || row.amount),
    },
    {
      key: "mode",
      label: "Mode",
      render: (row) => row.payment_mode || row.paymentMode || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill tone={statusTone(row.status)}>
          {formatStatus(row.status || "Uploaded")}
        </StatusPill>
      ),
    },
  ];

  return (
    <LmsPageShell
      title="UTR Upload"
      subtitle="Upload single repayment UTR and allocate payment against LAN."
      badge="LMS UTR"
    >
      <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-[#0f2942]">Upload UTR</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Enter repayment details received from bank or payment partner.
        </p>

        {message && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="LAN *" value={form.lan} onChange={(value) => updateForm("lan", value)} />
          <Field label="UTR *" value={form.utr} onChange={(value) => updateForm("utr", value)} />
          <Field label="Payment Date *" type="date" value={form.paymentDate} onChange={(value) => updateForm("paymentDate", value)} />
          <Field label="Bank Date" type="date" value={form.bankDate} onChange={(value) => updateForm("bankDate", value)} />
          <Field label="Payment Mode" value={form.paymentMode} onChange={(value) => updateForm("paymentMode", value)} />
          <Field label="Amount *" type="number" value={form.transferAmount} onChange={(value) => updateForm("transferAmount", value)} />
        </div>

        <button
          type="button"
          disabled={uploadMutation.isPending}
          onClick={handleSubmit}
          className="mt-5 rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-[#183d62] disabled:bg-slate-300"
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload UTR"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="Uploaded Records" value={rows.length} subtitle="UTR records available" />
        <SummaryCard title="Pending Allocation" value="0" subtitle="Pending UTR mapping" tone="orange" />
        <SummaryCard title="Allocated" value={rows.length} subtitle="Posted against LAN" tone="green" />
      </div>

      <LmsDataTable
        title="UTR Upload History"
        subtitle="Uploaded UTR records."
        rows={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.isError ? "Unable to load UTR upload history." : ""}
        emptyText="No UTR upload records found."
      />
    </LmsPageShell>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}