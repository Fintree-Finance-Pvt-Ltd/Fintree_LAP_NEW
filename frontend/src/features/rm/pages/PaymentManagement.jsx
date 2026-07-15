import { useMemo, useState } from "react";
import { useQuery,   useQueryClient, useMutation,
 } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { FaDownload, FaPlus } from "react-icons/fa";

import { rmApi } from "../rmApi.js";

const unwrapResponse = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? {};
};

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue(value));

const getOutstanding = (charge) =>
  Math.max(
    numberValue(charge.grossAmount) -
    numberValue(charge.paidAmount) -
    numberValue(charge.waiverAmount) +
    numberValue(charge.refundAmount),
    0,
  );

export default function PaymentManagement() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
const [message, setMessage] = useState("");

  const selectedId = applicationId || "";

  const [linkLoading, setLinkLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const applicationListQuery = useQuery({
    queryKey: ["payment-management-application-list"],
    queryFn: () =>
      rmApi.getChargeReceiptApplications({
        page: 1,
        limit: 100,
      }),
    staleTime: 30000,
    retry: false,
  });

  const applicationQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => rmApi.getApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  const chargeScheduleQuery = useQuery({
    queryKey: ["payment-charge-schedule", applicationId],
    queryFn: () => rmApi.getChargeSchedule(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  const applicationListPayload = unwrapResponse(applicationListQuery.data);

  const applicationList = Array.isArray(applicationListPayload)
    ? applicationListPayload
    : Array.isArray(applicationListPayload?.data)
      ? applicationListPayload.data
      : [];

  const applicationPayload = unwrapResponse(applicationQuery.data);
  const application = applicationPayload?.data ?? applicationPayload ?? {};

  const schedulePayload = unwrapResponse(chargeScheduleQuery.data);
  const charges = Array.isArray(schedulePayload?.charges)
    ? schedulePayload.charges
    : [];

  const selectedApplicationLabel = application?.applicationNumber
    ? `${application.applicationNumber} - ${application.customerName || ""}`
    : "No customer selected";

  const summary = useMemo(() => {
    const result = charges.reduce(
      (acc, charge) => {
        const grossAmount = numberValue(charge.grossAmount);
        const paidAmount = numberValue(charge.paidAmount);
        const outstanding = getOutstanding(charge);

        acc.paymentDemands += 1;
        acc.totalDemanded += grossAmount;
        acc.customerPaid += paidAmount;
        acc.demandPending += outstanding;

        if (outstanding > 0) {
          acc.unsettled += outstanding;
        }

        return acc;
      },
      {
        paymentDemands: 0,
        totalDemanded: 0,
        customerPaid: 0,
        demandPending: 0,
        unsettled: 0,
      },
    );

    return result;
  }, [charges]);

  const scheduleStatus = String(
    schedulePayload?.scheduleStatus ||
    charges?.[0]?.scheduleStatus ||
    "draft",
  ).toLowerCase();

  const activeCharges = charges.filter((charge) => getOutstanding(charge) > 0);

  const paidTransactions = charges.filter(
    (charge) => numberValue(charge.paidAmount) > 0,
  );

  const isScheduleApproved = scheduleStatus === "approved";

  const canCreatePaymentLink =
    Boolean(applicationId) &&
    isScheduleApproved &&
    activeCharges.length > 0 &&
    !linkLoading;

  const steps = [
    { id: 1, title: "Approved charge demand" },
    { id: 2, title: "Link generated" },
    { id: 3, title: "SMS / WhatsApp / Email sent" },
    { id: 4, title: "Customer opened link" },
    { id: 5, title: "Gateway payment received" },
    { id: 6, title: "Webhook auto-matched" },
    { id: 7, title: "Receipt & settlement" },
  ];

  const summaryCards = [
    {
      label: "PAYMENT DEMANDS",
      val: summary.paymentDemands,
      text: "text-slate-900",
    },
    {
      label: "TOTAL DEMANDED",
      val: formatCurrency(summary.totalDemanded),
      text: "text-teal-600",
    },
    {
      label: "CUSTOMER PAID",
      val: formatCurrency(summary.customerPaid),
      text: "text-pink-600",
    },
    {
      label: "DEMAND PENDING",
      val: formatCurrency(summary.demandPending),
      text: "text-amber-600",
    },
    {
      label: "UNSETTLED",
      val: formatCurrency(summary.unsettled),
      text: "text-rose-600",
    },
  ];

  const lapFlowData = [
    {
      seq: 1,
      stage: "Application Login",
      charges: "Login / Application Fee",
      owner: "RM / Fee Desk",
      gate: "Before login processing when policy requires",
      preCollection: "Payment Link / UPI / Virtual Account",
    },
    {
      seq: 2,
      stage: "Legal Initiation",
      charges: "Legal Verification Fee",
      owner: "Legal Coordinator / Fee Desk",
      gate: "Before assigning the legal vendor",
      preCollection: "Payment Link / UPI / Virtual Account",
    },
    {
      seq: 3,
      stage: "Valuation Initiation",
      charges: "Technical / Valuation Fee",
      owner: "Valuation Coordinator / Fee Desk",
      gate: "Before assigning the technical valuer",
      preCollection: "Payment Link / UPI / Virtual Account",
    },
    {
      seq: 4,
      stage: "Sanction Acceptance",
      charges: "Processing Fee",
      owner: "Sanction Ops / Fee Desk",
      gate: "After KFS disclosure and before disbursement",
      preCollection: "Payment Link / UPI / Virtual Account",
    },
    {
      seq: 5,
      stage: "Agreement & Mortgage",
      charges: "Documentation Fee \nStamp Duty / eStamp \nMODT / Mortgage Registration",
      owner: "Operations Maker",
      gate: "Before agreement/mortgage completion; statutory charges at actuals",
      preCollection: "Payment Link / Virtual Account / Approved Net-off",
    },
    {
      seq: 6,
      stage: "Pre-Disbursement",
      charges:
        "CERSAI Registration Charge \nNACH / eMandate Setup Fee \nInsurance Premium Optional \nBroken Period Interest / Advance EMI",
      owner: "Operations Maker",
      gate: "Before payout where applicable; insurance only after explicit opt-in",
      preCollection: "Payment Link / Approved Net-off",
    },
  ];



  const createPaymentLink = useMutation({
  mutationFn: () => {
    if (!selectedId) {
      throw new Error(
        "Please select application first.",
      );
    }

    return rmApi.createLapPaymentLink(selectedId, {
      // amount: 2500,
            amount: 1,

      purpose: "LOGIN_FEE",
    });
  },

  onSuccess: (response) => {
    setMessage(
      response?.data?.message ||
        "Payment link created and sent to customer.",
    );
  },

  onError: (error) => {
    setMessage(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to create payment link.",
    );
  },
});
  const handleApplicationChange = (event) => {
    const nextApplicationId = event.target.value;

    if (!nextApplicationId) return;

    navigate(`/payment-management/${nextApplicationId}`);
  };

  const openChargeMaster = () => {
    if (!applicationId) return;
    navigate(`/charges-receipts/${applicationId}`);
  };

  // const createPaymentLink = async () => {
  //   if (!applicationId) {
  //     setPageError("Please select customer application first.");
  //     return;
  //   }

  //   if (!isScheduleApproved) {
  //     setPageError(
  //       "Charge schedule is not approved. Payment link can be sent only after Checker Approval.",
  //     );
  //     return;
  //   }

  //   if (!activeCharges.length) {
  //     setPageError("No pending charge demand found for this application.");
  //     return;
  //   }

  //   try {
  //     setLinkLoading(true);
  //     setPageError("");
  //     setPageSuccess("");

  //     const response = await rmApi.createEasebuzzPaymentLink(applicationId);
  //     const data = unwrapResponse(response);

  //     setPageSuccess(
  //       data?.paymentLink
  //         ? `Payment link created successfully: ${data.paymentLink}`
  //         : "Payment link created and sent successfully.",
  //     );

  //     await chargeScheduleQuery.refetch();
  //   } catch (error) {
  //     setPageError(
  //       error?.response?.data?.message ||
  //       error?.message ||
  //       "Unable to create payment link.",
  //     );
  //   } finally {
  //     setLinkLoading(false);
  //   }
  // };

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased selection:bg-blue-500 selection:text-white">

      {pageError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {pageError}
        </div>
      )}

      {pageSuccess && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {pageSuccess}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Charge Schedule Status
          </div>
          <div className="mt-1 text-sm font-bold capitalize text-slate-800">
            {scheduleStatus}
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${isScheduleApproved
              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
              : "border-amber-100 bg-amber-50 text-amber-600"
            }`}
        >
          {isScheduleApproved ? "Ready for Payment Link" : "Approval Pending"}
        </span>
      </div>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Payment Link & Collection Management
            </h2>

            <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">
              Create demand → send secure link → customer pays → webhook auto-updates → receipt and reconciliation.
            </p>

            <p className="mt-2 text-[11px] font-bold text-white/80">
              {selectedApplicationLabel}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 xl:items-end">
            <select
              value={selectedId}
              disabled={applicationListQuery.isLoading}
              onChange={handleApplicationChange}
              className="min-w-[300px] rounded-xl border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-bold text-white outline-none backdrop-blur-md transition-all hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="text-slate-900">
                {applicationListQuery.isLoading
                  ? "Loading applications..."
                  : "Select Customer Application"}
              </option>

              {applicationList.map((item) => (
                <option key={item.id} value={item.id} className="text-slate-900">
                  {item.applicationNumber} - {item.customerName}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20"
              >
                <FaDownload size={10} />
                Export CSV
              </button>

              <button
                type="button"
                onClick={openChargeMaster}
                disabled={!applicationId}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-pink-50 px-4 py-2 text-xs font-semibold text-pink-600 ring-1 ring-inset ring-pink-200/60 transition-all hover:bg-pink-100 hover:text-pink-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                Open Charge Master
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Process Steps */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {steps.map((step) => (
          <div
            key={step.id}
            className="relative flex min-h-[72px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm"
          >
            <span className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-600">
              {step.id}
            </span>

            <h4 className="text-[10px] font-bold leading-tight tracking-tight text-slate-700">
              {step.title}
            </h4>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white bg-gradient-to-br from-slate-50/50 to-transparent p-5 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {card.label}
            </div>

            <div className={`mt-1 text-2xl font-extrabold tracking-tight ${card.text}`}>
              {card.val}
            </div>
          </div>
        ))}
      </div>

      {/* Active Demand Links */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
              Customer payment links and demands
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Each demand has item-level allocation, expiry, delivery evidence, payer activity and current outstanding amount.
            </p>
          </div>

          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {activeCharges.length} active
          </span>
        </div>

        {chargeScheduleQuery.isLoading ? (
          <div className="border-b border-slate-50 bg-slate-50/10 p-8 text-center text-xs font-medium text-slate-400">
            Loading payment demands...
          </div>
        ) : activeCharges.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Charge</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Pending</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {activeCharges.map((charge) => (
                  <tr key={charge.id} className="transition-colors hover:bg-slate-50/40">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-800">
                        {charge.name}
                      </div>
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {charge.sub || "Charge demand"}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-700">
                      {formatCurrency(charge.grossAmount)}
                    </td>

                    <td className="p-4 font-semibold text-emerald-600">
                      {formatCurrency(charge.paidAmount)}
                    </td>

                    <td className="p-4 font-bold text-amber-600">
                      {formatCurrency(getOutstanding(charge))}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                        {charge.collectionStatus || "pending"}
                      </span>
                    </td>

                    <td className="p-4 pr-6">
                      <div className="flex justify-end">
                        <button
  type="button"
  disabled={!selectedId || createPaymentLink.isPending}
  onClick={() => createPaymentLink.mutate()}
  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {createPaymentLink.isPending
    ? "Creating Link..."
    : "Create Payment Link"}
</button>
                        {/* <button
                          type="button"
                          onClick={createPaymentLink}
                          disabled={!canCreatePaymentLink}
                          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-[10px] font-extrabold text-white shadow-md transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FaPlus size={10} />
                          {linkLoading ? "Creating..." : "Create & Send Link"}
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-b border-slate-50 bg-slate-50/10 p-8 text-center text-xs font-medium text-slate-400">
            No payment demand exists. Create an approved payment link to begin collection.
          </div>
        )}
      </div>
      {/* Transactions Ledger */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
              All customer payment transactions
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Gateway, UPI, net-banking, card and virtual-account collections with immutable provider references.
            </p>
          </div>

          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            0 exceptions / unsettled
          </span>
        </div>

        {paidTransactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Charge</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4 pr-6">Receipt</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {paidTransactions.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4 pl-6 font-bold text-slate-800">{item.name}</td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(item.paidAmount)}</td>
                    <td className="p-4">{item.paymentMode || "-"}</td>
                    <td className="p-4">{item.paymentReference || "-"}</td>
                    <td className="p-4 pr-6">{item.receiptNo || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-b border-slate-50 bg-slate-50/10 p-8 text-center text-xs font-medium text-slate-400">
            No customer payment transaction recorded.
          </div>
        )}
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-5">
        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
              Refund, reversal and chargeback queue
            </h3>
            <p className="text-[10px] font-medium text-slate-400">
              Maker creates; independent checker approves and the system posts the reversal.
            </p>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/30 p-6 text-center text-xs font-medium text-slate-400">
              No refund or reversal request.
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-3">
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
              Webhook and payment event monitor
            </h3>
            <p className="text-[10px] font-medium text-slate-400">
              Idempotent events, signature validation and processing result.
            </p>
          </div>

          <div className="flex items-start gap-4 pt-2">
            <span className="mt-1 block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-400" />
            <div>
              <div className="text-xs font-bold text-slate-800">No events</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-400">
                Create and send a payment link.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}