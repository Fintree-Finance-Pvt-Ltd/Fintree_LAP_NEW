import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { rmApi } from "../rmApi.js";

export default function ChargesReceipts() {
  const { applicationId } = useParams();

  const [charges, setCharges] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editedIds, setEditedIds] = useState(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getPayload = (res) => {
    return res?.data?.data ?? res?.data ?? res;
  };

  const numberValue = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numberValue(value));
  };

  const calculateAmounts = (base, gstRate = 18) => {
    const baseAmount = numberValue(base);
    const gstPercent = numberValue(gstRate);
    const gstAmount = Number(((baseAmount * gstPercent) / 100).toFixed(2));
    const grossAmount = Number((baseAmount + gstAmount).toFixed(2));

    return {
      base: baseAmount,
      gstRate: gstPercent,
      gstAmount,
      grossAmount,
    };
  };

  const normalizeCharge = (charge) => {
    return {
      ...charge,
      base: numberValue(charge.base),
      gstRate: numberValue(charge.gstRate),
      gstAmount: numberValue(charge.gstAmount),
      grossAmount: numberValue(charge.grossAmount),
      paidAmount: numberValue(charge.paidAmount),
      waiverAmount: numberValue(charge.waiverAmount),
      refundAmount: numberValue(charge.refundAmount),
      collectionStatus: charge.collectionStatus || "pending",
      scheduleStatus: charge.scheduleStatus || "draft",
      noLink: Boolean(charge.noLink),
    };
  };

  const navigate = useNavigate();

  const selectedId = applicationId || "";

 const applicationListQuery = useQuery({
  queryKey: ["charge-receipt-application-list"],
  queryFn: () =>
    rmApi.getChargeReceiptApplications({
      page: 1,
      limit: 100,
    }),
  staleTime: 30000,
  retry: false,
});

  const applicationListResponse =
    applicationListQuery.data?.data ??
    applicationListQuery.data ??
    {};

  const applicationList = Array.isArray(applicationListResponse)
    ? applicationListResponse
    : Array.isArray(applicationListResponse?.data)
      ? applicationListResponse.data
      : [];

  const handleApplicationChange = (event) => {
    const nextApplicationId = event.target.value;

    if (!nextApplicationId) return;

    navigate(`/charges-receipts/${nextApplicationId}`);
  };


  const fetchSchedule = async () => {
    if (!applicationId) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

    const res = await rmApi.getChargeSchedule(applicationId);

      const data = getPayload(res);

      const list = Array.isArray(data?.charges) ? data.charges : [];

      setCharges(list.map(normalizeCharge));
      setScheduleStatus(data?.scheduleStatus || "draft");
      setEditedIds(new Set());
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Unable to load charges receipt schedule."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [applicationId]);

  const summary = useMemo(() => {
    const result = charges.reduce(
      (acc, item) => {
        acc.baseCharges += numberValue(item.base);
        acc.gstTax += numberValue(item.gstAmount);
        acc.totalApproved += numberValue(item.grossAmount);
        acc.customerPaid += numberValue(item.paidAmount);
        acc.waived += numberValue(item.waiverAmount);
        acc.refunded += numberValue(item.refundAmount);
        return acc;
      },
      {
        baseCharges: 0,
        gstTax: 0,
        totalApproved: 0,
        customerPaid: 0,
        waived: 0,
        refunded: 0,
        balanceDue: 0,
      }
    );

    result.balanceDue =
      result.totalApproved -
      result.customerPaid -
      result.waived +
      result.refunded;

    Object.keys(result).forEach((key) => {
      result[key] = Number(result[key].toFixed(2));
    });

    return result;
  }, [charges]);

  const hasCharges = charges.length > 0;
  const isSubmitted = scheduleStatus === "submitted";
  const isApproved = scheduleStatus === "approved";
  const isRejected = scheduleStatus === "rejected";

  const steps = [
    {
      id: 1,
      title: "Quote & disclose",
      desc: "Charges configured and mapped to KFS",
      completed: hasCharges,
    },
    {
      id: 2,
      title: "Customer consent",
      desc: "Customer accepts charge schedule",
      completed: isSubmitted || isApproved,
    },
    {
      id: 3,
      title: "Collect",
      desc: "NBFC account / approved mode",
      completed: summary.customerPaid > 0,
    },
    {
      id: 4,
      title: "Reconcile & receipt",
      desc: "Payment matched and receipt generated",
      completed: charges.some((x) => x.receiptNo),
    },
    {
      id: 5,
      title: "Checker approve",
      desc: "Independent verification before next gate",
      completed: isApproved,
    },
  ];

  const summaryCards = [
    {
      label: "BASE CHARGES",
      val: formatCurrency(summary.baseCharges),
      color: "from-indigo-500/10 to-transparent",
      text: "text-indigo-600",
    },
    {
      label: "GST / TAX",
      val: formatCurrency(summary.gstTax),
      color: "from-teal-500/10 to-transparent",
      text: "text-teal-600",
    },
    {
      label: "TOTAL APPROVED",
      val: formatCurrency(summary.totalApproved),
      color: "from-pink-500/10 to-transparent",
      text: "text-pink-600",
    },
    {
      label: "CUSTOMER PAID",
      val: formatCurrency(summary.customerPaid),
      color: "from-amber-500/10 to-transparent",
      text: "text-amber-600",
    },
    {
      label: "BALANCE DUE",
      val: formatCurrency(summary.balanceDue),
      color: "from-blue-500/10 to-transparent",
      text: "text-blue-600",
    },
  ];

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 2500);
  };

  const runAction = async (callback, message) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await callback();

      showSuccess(message);
      await fetchSchedule();
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

const createDefaultSchedule = () => {
  if (!applicationId) {
    setError("Please select customer application first.");
    return;
  }

  runAction(
    () => rmApi.createDefaultChargeSchedule(applicationId),
    "Default charge schedule created successfully."
  );
};

const submitSchedule = () => {
  if (!applicationId) {
    setError("Please select customer application first.");
    return;
  }

  runAction(
    () => rmApi.submitChargeSchedule(applicationId),
    "Charge schedule submitted successfully."
  );
};

const approveSchedule = () => {
  if (!applicationId) {
    setError("Please select customer application first.");
    return;
  }

  runAction(
    () => rmApi.approveChargeSchedule(applicationId),
    "Charge schedule approved successfully."
  );
};

const rejectSchedule = () => {
  if (!applicationId) {
    setError("Please select customer application first.");
    return;
  }

  runAction(
    () => rmApi.rejectChargeSchedule(applicationId),
    "Charge schedule rejected successfully."
  );
};

const saveRow = async (row) => {
  await runAction(
    () =>
      rmApi.updateChargeReceipt(row.id, {
        base: row.base,
        gstRate: row.gstRate,
      }),
    "Charge updated successfully."
  );
};

const saveEditedRows = async () => {
  const editedRows = charges.filter((row) => editedIds.has(row.id));

  if (!editedRows.length) {
    showSuccess("No changes to save.");
    return;
  }

  await runAction(async () => {
    for (const row of editedRows) {
      await rmApi.updateChargeReceipt(row.id, {
        base: row.base,
        gstRate: row.gstRate,
      });
    }
  }, "All edited charges saved successfully.");
};

const markPaid = async (row) => {
  const defaultAmount =
    numberValue(row.grossAmount) -
    numberValue(row.paidAmount) -
    numberValue(row.waiverAmount) +
    numberValue(row.refundAmount);

  const paidAmount = window.prompt(
    "Enter paid amount",
    String(defaultAmount > 0 ? defaultAmount : row.grossAmount)
  );

  if (paidAmount === null) return;

  const paymentMode = window.prompt("Enter payment mode", "UPI");
  if (paymentMode === null) return;

  const paymentReference = window.prompt("Enter payment reference", "");
  if (paymentReference === null) return;

  await runAction(
    () =>
      rmApi.markChargePaid(row.id, {
        paidAmount: numberValue(paidAmount),
        paymentMode,
        paymentReference,
      }),
    "Payment marked successfully."
  );
};

const waiveCharge = async (row) => {
  const waiverAmount = window.prompt(
    "Enter waiver amount",
    String(row.grossAmount)
  );

  if (waiverAmount === null) return;

  await runAction(
    () =>
      rmApi.waiveChargeReceipt(row.id, {
        waiverAmount: numberValue(waiverAmount),
      }),
    "Waiver updated successfully."
  );
};



const deleteCharge = async (row) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${row.name}"?`
  );

  if (!confirmed) return;

  await runAction(
    () => rmApi.deleteChargeReceipt(row.id),
    "Charge deleted successfully."
  );
};




  const handleBaseChange = (index, value) => {
    const updated = [...charges];
    const current = updated[index];

    const amounts = calculateAmounts(value, current.gstRate);

    updated[index] = {
      ...current,
      ...amounts,
    };

    setCharges(updated);

    if (current.id) {
      setEditedIds((prev) => new Set(prev).add(current.id));
    }
  };

  const handleGstRateChange = (index, value) => {
    const updated = [...charges];
    const current = updated[index];

    const amounts = calculateAmounts(current.base, value);

    updated[index] = {
      ...current,
      ...amounts,
    };

    setCharges(updated);

    if (current.id) {
      setEditedIds((prev) => new Set(prev).add(current.id));
    }
  };







  const refundCharge = async (row) => {
    const refundAmount = window.prompt("Enter refund amount", "0");

    if (refundAmount === null) return;

    await runAction(
      () =>
        apiClient.patch(`/charges-receipts/${row.id}/refund`, {
          refundAmount: numberValue(refundAmount),
        }),
      "Refund updated successfully."
    );
  };

  

  const createPaymentLink = () => {
    setError(
      "Payment link API is not connected yet. Once your backend route is ready, connect this button to that endpoint."
    );
  };

  const getStatusBadge = (status) => {
    const value = String(status || "pending").toLowerCase();

    const styles = {
      pending: "bg-amber-50 text-amber-600 border-amber-100",
      partial: "bg-blue-50 text-blue-600 border-blue-100",
      paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
      waived: "bg-purple-50 text-purple-600 border-purple-100",
      refunded: "bg-rose-50 text-rose-600 border-rose-100",
    };

    return styles[value] || styles.pending;
  };

  const getScheduleBadge = () => {
    const styles = {
      draft: "bg-amber-100 text-amber-800",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
    };

    return styles[scheduleStatus] || styles.draft;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Charge Schedule, Fee Approval & Collection Gates
              </h2>

              <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">
                Select customer application and manage charges, approval, collection and receipt status.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 xl:items-end">
              <select
                value={selectedId}
                onChange={handleApplicationChange}
                disabled={applicationListQuery.isLoading}
                className="min-w-[280px] rounded-xl border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-bold text-white outline-none backdrop-blur-md transition-all hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" className="text-slate-900">
                  {applicationListQuery.isLoading
                    ? "Loading applications..."
                    : "Select Customer Application"}
                </option>

                {applicationList.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="text-slate-900"
                  >
                    {item.applicationNumber} - {item.customerName}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <button
                  onClick={createDefaultSchedule}
                  disabled={actionLoading || !selectedId}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-60"
                >
                  Create Default Schedule
                </button>

                <button
                  onClick={saveEditedRows}
                  disabled={actionLoading || !editedIds.size}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-60"
                >
                  Save Schedule
                </button>

                <button
                  onClick={submitSchedule}
                  disabled={actionLoading || !hasCharges || isApproved}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#1a4cb0] shadow-md transition-all hover:bg-blue-50 disabled:opacity-60"
                >
                  Submit to Checker
                </button>

                <button
                  onClick={approveSchedule}
                  disabled={actionLoading || !hasCharges || isApproved}
                  className="rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/30 disabled:opacity-60"
                >
                  Checker Approve
                </button>

                <button
                  onClick={createPaymentLink}
                  disabled={actionLoading || !isApproved}
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-xs font-extrabold text-slate-900 shadow-sm transition-all hover:brightness-105 disabled:opacity-60"
                >
                  Manage Payment Links →
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              {step.completed ? (
                <FaCheckCircle
                  className="mt-0.5 shrink-0 text-emerald-500"
                  size={16}
                />
              ) : (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs font-bold text-amber-600">
                  {step.id}
                </span>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {step.title}
                </h4>
                <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-400">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${card.color} bg-white p-5 shadow-sm`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {card.label}
              </div>
              <div
                className={`mt-1 text-xl font-extrabold tracking-tight ${card.text}`}
              >
                {card.val}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50/30 p-4 text-xs font-medium leading-relaxed text-amber-900">
          <span className="mr-1 font-bold uppercase tracking-wide text-amber-900">
            Required sequence:
          </span>
          Fee Maker prepares the charge schedule → Checker approves → authorized
          person creates the payment link → customer pays → gateway webhook
          auto-updates payment, charge status and receipt. Schedule status:
          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-900">
            {scheduleStatus}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">
                Stage-wise approved charge schedule
              </h3>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                Amounts must match product policy, KFS and customer consent.
                Statutory charges are captured at actuals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isRejected && (
                <span className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
                  Schedule Rejected
                </span>
              )}

              <button
                onClick={rejectSchedule}
                disabled={actionLoading || !hasCharges || isApproved}
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60"
              >
                Reject
              </button>

              <button
                onClick={createPaymentLink}
                disabled={actionLoading || !isApproved}
                className="whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
              >
                Create Link for Unpaid Charges
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm font-semibold text-slate-500">
              <FaSpinner className="animate-spin" />
              Loading charge schedule...
            </div>
          ) : !charges.length ? (
            <div className="p-10 text-center">
              <h4 className="text-sm font-bold text-slate-800">
                No charges found for this application.
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Click “Create Default Schedule” to generate default LAP charges.
              </p>
              <button
                onClick={createDefaultSchedule}
                disabled={actionLoading}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
              >
                Create Default Schedule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="w-[25%] p-4 pl-6">Charge</th>
                    <th className="w-[15%] p-4">Required Stage</th>
                    <th className="w-[9%] p-4">Base</th>
                    <th className="w-[8%] p-4">GST %</th>
                    <th className="w-[10%] p-4">GST Amount</th>
                    <th className="w-[10%] p-4">Gross</th>
                    <th className="w-[13%] p-4">Paid / Waived / Refunded</th>
                    <th className="w-[10%] p-4">Status</th>
                    <th className="w-[20%] p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {charges.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className="transition-colors hover:bg-slate-50/30"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold leading-snug text-slate-900">
                          {row.name}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-400">
                          {row.sub || "-"}
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-500">
                        {row.stage}
                      </td>

                      <td className="p-4">
                        <input
                          type="number"
                          value={row.base}
                          onChange={(e) =>
                            handleBaseChange(index, e.target.value)
                          }
                          disabled={isApproved}
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1 text-center font-bold outline-none transition-all focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>

                      <td className="p-4">
                        <input
                          type="number"
                          value={row.gstRate}
                          onChange={(e) =>
                            handleGstRateChange(index, e.target.value)
                          }
                          disabled={isApproved}
                          className="w-16 rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1 text-center font-bold outline-none transition-all focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>

                      <td className="p-4 font-medium text-slate-600">
                        {formatCurrency(row.gstAmount)}
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        {formatCurrency(row.grossAmount)}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {formatCurrency(row.paidAmount)} paid
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {formatCurrency(row.waiverAmount)} waiver ·{" "}
                          {formatCurrency(row.refundAmount)} refund
                        </div>
                      </td>

                      <td className="p-4">
                        <div
                          className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(
                            row.collectionStatus
                          )}`}
                        >
                          {row.collectionStatus}
                        </div>

                        <div className="mt-0.5 text-[9px] font-medium text-slate-400">
                          {row.paymentReference || "No payment reference"}
                        </div>

                        {row.receiptNo && (
                          <div className="mt-0.5 text-[9px] font-bold text-slate-500">
                            Receipt: {row.receiptNo}
                          </div>
                        )}
                      </td>

                      <td className="p-4 pr-6">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {editedIds.has(row.id) && (
                            <button
                              onClick={() => saveRow(row)}
                              disabled={actionLoading}
                              className="rounded bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60"
                            >
                              Save
                            </button>
                          )}

                          {!row.noLink && (
                            <button
                              onClick={createPaymentLink}
                              disabled={!isApproved}
                              className="rounded bg-cyan-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-cyan-700 disabled:opacity-60"
                            >
                              Link
                            </button>
                          )}

                          <button
                            onClick={() => markPaid(row)}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-[#0f2942] shadow-sm transition-all hover:bg-slate-50"
                          >
                            Manual
                          </button>

                          <button
                            onClick={() => waiveCharge(row)}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600"
                          >
                            Waiver
                          </button>

                          <button
                            onClick={() => refundCharge(row)}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-rose-600"
                          >
                            Refund
                          </button>

                          <button
                            onClick={() => deleteCharge(row)}
                            className="rounded border border-red-100 px-2 py-1 text-[10px] font-bold text-red-500 shadow-sm transition-all hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="border-b border-slate-50 pb-2 text-sm font-extrabold tracking-wide text-[#0f2942]">
              Automatic payment path
            </h3>

            <ol className="list-none space-y-2 text-xs font-medium text-slate-600">
              {[
                "1. Approved demand and unique link created",
                "2. Link sent by SMS, WhatsApp and/or email",
                "3. Customer pays through gateway/UPI/VA",
                "4. Signed webhook is validated and deduplicated",
                "5. Payment is allocated to selected charges",
                "6. Status and receipt update automatically",
              ].map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="border-b border-slate-50 pb-2 text-sm font-extrabold tracking-wide text-[#0f2942]">
              Manual exception path
            </h3>

            <ul className="space-y-2 text-xs font-medium text-slate-600">
              {[
                "Cheque/cash and unmatched NEFT need maker entry",
                "Payment Checker verifies bank evidence",
                "Partial/excess amount enters reconciliation queue",
                "Refund, waiver, reversal and chargeback require checker",
                "All actions record user, time and old/new value",
              ].map((text, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="border-b border-slate-50 pb-2 text-sm font-extrabold tracking-wide text-[#0f2942]">
                Disbursement hard gate
              </h3>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">
                    Mandatory fees
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${summary.balanceDue <= 0
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-amber-100 bg-amber-50 text-amber-600"
                      }`}
                  >
                    {summary.balanceDue <= 0 ? "Cleared" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">
                    Schedule approval
                  </span>
                  <span className="font-bold capitalize text-slate-900">
                    {scheduleStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">
                    Pending customer amount
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(summary.balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={createPaymentLink}
              disabled={!isApproved}
              className="mt-6 w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-100/70 disabled:opacity-60"
            >
              Open Payment Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}