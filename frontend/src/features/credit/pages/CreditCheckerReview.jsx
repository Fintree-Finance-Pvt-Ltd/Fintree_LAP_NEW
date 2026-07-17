import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { creditApi } from "../creditApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const checkerSteps = [
  { id: 1, label: "Credit Maker", status: "completed" },
  { id: 2, label: "Credit Checker", status: "current" },
  { id: 3, label: "Valuation", status: "pending" },
  { id: 4, label: "Legal", status: "pending" },
  { id: 5, label: "Sanction", status: "pending" },
];

export default function CreditCheckerReview() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [message, setMessage] = useState("");

  const [review, setReview] = useState({
    checkerDecision: "Approve and Send to Valuation",
    approvedAmount: "",
    approvedTenure: "",
    approvedRoi: "",
    checkerRemarks:
      "Credit maker assessment reviewed. Case is acceptable for valuation initiation.",
    conditions:
      "Subject to satisfactory valuation, legal clearance and final sanction terms.",
  });

  const queryClient = useQueryClient();

  const checkerCasesQuery = useQuery({
    queryKey: ["credit-checker-cases"],
    queryFn: () => creditApi.checkerCases(),
  });

  const checkerCases = useMemo(() => {
    const rows = checkerCasesQuery.data?.data?.data ?? checkerCasesQuery.data?.data ?? [];

    return Array.isArray(rows) ? rows : [];
  }, [checkerCasesQuery.data]);

  const applicationQuery = useQuery({
    queryKey: ["credit-checker-application", selectedId],
    queryFn: () => creditApi.getCreditApplication(selectedId),
    enabled: Boolean(selectedId),
  });

  const application = unwrapPayload(applicationQuery.data);

  const updateReview = (field, value) => {
    setMessage("");
    setReview((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const autofillFromApplication = () => {
    if (!application) return;

    setReview((previous) => ({
      ...previous,
      approvedAmount:
        previous.approvedAmount ||
        valueOrEmpty(application?.requestedAmount || application?.loanAmount),
      approvedTenure:
        previous.approvedTenure ||
        valueOrEmpty(application?.tenure || application?.requestedTenure),
      approvedRoi:
        previous.approvedRoi ||
        valueOrEmpty(application?.interestRate || application?.roi),
    }));
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerApprove(selectedId, {
        ...review,
        remarks: review.checkerRemarks,
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application approved and sent to Valuation successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["credit-checker-cases"] }),
        queryClient.invalidateQueries({
          queryKey: ["credit-checker-application", selectedId],
        }),
      ]);
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to approve case.",
      );
    },
  });

  const returnMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerReturnToMaker(selectedId, {
        ...review,
        remarks: review.checkerRemarks,
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application returned to Credit Maker successfully.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["credit-checker-cases"],
      });
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to return case.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      creditApi.creditCheckerReject(selectedId, {
        ...review,
        remarks: review.checkerRemarks,
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application rejected by Credit Checker.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["credit-checker-cases"],
      });
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to reject case.",
      );
    },
  });

  const validateSelection = () => {
    if (!selectedId) {
      setMessage("Please select application first.");
      return false;
    }

    return true;
  };

  const submitting =
    approveMutation.isPending ||
    returnMutation.isPending ||
    rejectMutation.isPending;

  const handleApprove = () => {
    if (!validateSelection()) return;
    approveMutation.mutate();
  };

  const handleReturn = () => {
    if (!validateSelection()) return;
    returnMutation.mutate();
  };

  const handleReject = () => {
    if (!validateSelection()) return;
    rejectMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#243b9f] via-[#3759dc] to-[#6b5de8] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                ✓
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Credit Checker Review
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  {application?.applicationNumber || "Select Application"} ·
                  Review maker proposal and approve for valuation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleReturn}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                Return to Maker
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleReject}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-red-600 shadow-sm transition-all hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleApprove}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-50"
              >
                {approveMutation.isPending
                  ? "Approving..."
                  : "Approve & Send to Valuation"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[420px_1fr_180px]">
            <div className="relative">
              <select
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select Credit Checker Case</option>

                {checkerCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.applicationNumber} - {item.customerName}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <FaChevronDown size={12} />
              </span>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                readOnly
                value={
                  application
                    ? `${application.customerName || ""} | ${
                        application.mobile || ""
                      } | ${application.pan || ""}`
                    : ""
                }
                placeholder="Selected case details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={!application}
              onClick={autofillFromApplication}
              className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Auto Fill
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {checkerSteps.map((step) => {
            const completed = step.status === "completed";
            const current = step.status === "current";

            return (
              <div
                key={step.id}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                      completed
                        ? "bg-emerald-500 text-white"
                        : current
                          ? "bg-indigo-600 text-amber-300"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completed ? <FaCheck /> : step.id}
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                      {step.status}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <b>Checker control:</b> Credit Checker may approve, return to maker,
          or reject. Approval sends the case to Valuation.
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <InfoCard title="Application summary">
            <DisplayRow label="Applicant" value={application?.customerName} />
            <DisplayRow label="Mobile" value={application?.mobile} />
            <DisplayRow label="PAN" value={application?.pan} />
            <DisplayRow label="Requested Amount" value={application?.requestedAmount} />
            <DisplayRow label="Stage" value={application?.stage} />
            <DisplayRow label="Status" value={application?.status} />
          </InfoCard>

          <InfoCard title="Checker decision">
            <SelectField
              label="Checker Decision"
              value={review.checkerDecision}
              options={[
                "Approve and Send to Valuation",
                "Return to Credit Maker",
                "Reject",
              ]}
              onChange={(value) => updateReview("checkerDecision", value)}
            />

            <Field
              label="Approved Amount"
              value={review.approvedAmount}
              onChange={(value) => updateReview("approvedAmount", value)}
            />

            <Field
              label="Approved Tenure"
              value={review.approvedTenure}
              onChange={(value) => updateReview("approvedTenure", value)}
            />

            <Field
              label="Approved ROI %"
              value={review.approvedRoi}
              onChange={(value) => updateReview("approvedRoi", value)}
            />
          </InfoCard>

          <InfoCard title="Policy checks">
            <DisplayRow label="Maker Memo" value="Reviewed" />
            <DisplayRow label="Income Assessment" value="Acceptable" />
            <DisplayRow label="Bureau" value="Acceptable" />
            <DisplayRow label="Collateral" value="Pending Valuation" />
            <DisplayRow label="Next Stage" value="Valuation" />
          </InfoCard>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
          <h3 className="text-xl font-black text-slate-800">
            Checker remarks
          </h3>

          <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />

          <TextArea
            label="Checker Remarks"
            value={review.checkerRemarks}
            onChange={(value) => updateReview("checkerRemarks", value)}
          />

          <TextArea
            label="Conditions"
            value={review.conditions}
            onChange={(value) => updateReview("conditions", value)}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>
      <input
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function DisplayRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-800">
        {valueOrEmpty(value) || "—"}
      </span>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>

      <div className="relative mt-2">
        <select
          value={valueOrEmpty(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
          <FaChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="mt-5">
      <label className="text-xs font-black text-slate-600">{label}</label>

      <textarea
        rows={4}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}