import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";

import { valuationApi } from "../valuationApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const unwrapList = (response) => {
  const data = unwrapPayload(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "Field Verification", status: "completed" },
  { id: 3, label: "BM Review", status: "completed" },
  { id: 4, label: "CM Screening", status: "completed" },
  { id: 5, label: "Credit", status: "completed" },
  { id: 6, label: "Valuation", status: "current" },
  { id: 7, label: "Legal", status: "pending" },
  { id: 8, label: "Sanction", status: "pending" },
  { id: 9, label: "Agreement", status: "pending" },
  { id: 10, label: "Disbursement", status: "pending" },
];

const comparableRows = [
  {
    comparable: "Comparable A",
    distance: "0.8 KM",
    area: "1,740",
    rate: "₹6,200",
    adjustedValue: "₹1,07,88,000",
  },
  {
    comparable: "Comparable B",
    distance: "1.4 KM",
    area: "1,900",
    rate: "₹5,900",
    adjustedValue: "₹1,12,10,000",
  },
  {
    comparable: "Comparable C",
    distance: "2.1 KM",
    area: "1,820",
    rate: "₹6,050",
    adjustedValue: "₹1,10,11,000",
  },
];

export default function ValuationPage() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    valuer: "Accurate Valuers Pvt Ltd",
    visitDate: "2026-06-19",
    propertyArea: "",
    occupancy: "Self-occupied",
    constructionQuality: "Good",
    residualLife: "",

    marketValue: "",
    distressValue: "",
    realisableValue: "",
    recommendedValue: "",
    requestedLoan: "",
    valuationStatus: "Positive",

    technicalRemarks:
      "Value supports the proposed facility within policy.",
    queryRemarks: "",
  });

  const queryClient = useQueryClient();

  const casesQuery = useQuery({
    queryKey: ["valuation-cases"],
    queryFn: () => valuationApi.cases(),
  });

  const valuationCases = useMemo(() => {
    return unwrapList(casesQuery.data);
  }, [casesQuery.data]);

  const applicationQuery = useQuery({
    queryKey: ["valuation-application", selectedId],
    queryFn: () => valuationApi.getApplication(selectedId),
    enabled: Boolean(selectedId),
  });

  const application = unwrapPayload(applicationQuery.data);

  const updateForm = (field, value) => {
    setMessage("");
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const autoFillFromApplication = () => {
    if (!application) return;

    const requestedAmount =
      application?.requestedAmount ||
      application?.loanAmount ||
      "";

    const propertyValue =
      application?.propertyValue ||
      application?.marketValue ||
      "";

    setForm((previous) => ({
      ...previous,
      propertyArea:
        previous.propertyArea ||
        valueOrEmpty(application?.propertyArea || application?.areaSqft),
      marketValue:
        previous.marketValue ||
        valueOrEmpty(propertyValue),
      distressValue:
        previous.distressValue ||
        valueOrEmpty(
          propertyValue ? Math.round(Number(propertyValue) * 0.82) : "",
        ),
      realisableValue:
        previous.realisableValue ||
        valueOrEmpty(
          propertyValue ? Math.round(Number(propertyValue) * 0.88) : "",
        ),
      recommendedValue:
        previous.recommendedValue ||
        valueOrEmpty(
          propertyValue ? Math.round(Number(propertyValue) * 0.95) : "",
        ),
      requestedLoan:
        previous.requestedLoan ||
        valueOrEmpty(requestedAmount),
    }));
  };

  const payload = {
    ...form,
    remarks: form.technicalRemarks,
    applicationId: selectedId,
  };

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      valuationApi.raiseQuery(selectedId, {
        ...payload,
        remarks:
          form.queryRemarks ||
          form.technicalRemarks ||
          "Technical valuation query raised.",
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Technical query raised successfully.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["valuation-cases"],
      });
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise technical query.",
      );
    },
  });

  const markNegativeMutation = useMutation({
    mutationFn: () =>
      valuationApi.markNegative(selectedId, {
        ...payload,
        remarks:
          form.technicalRemarks ||
          "Valuation marked negative.",
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application marked negative by Valuation.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["valuation-cases"],
      });
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to mark negative.",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      valuationApi.approveToLegal(selectedId, {
        ...payload,
        remarks:
          form.technicalRemarks ||
          "Valuation accepted and sent to Legal.",
      }),
    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Valuation accepted and case sent to Legal successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["valuation-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["valuation-application", selectedId],
        }),
      ]);
    },
    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to approve valuation.",
      );
    },
  });

  const validateSelection = () => {
    if (!selectedId) {
      setMessage("Please select valuation application first.");
      return false;
    }

    return true;
  };

  const handleRaiseQuery = () => {
    if (!validateSelection()) return;
    raiseQueryMutation.mutate();
  };

  const handleMarkNegative = () => {
    if (!validateSelection()) return;
    markNegativeMutation.mutate();
  };

  const handleApprove = () => {
    if (!validateSelection()) return;
    approveMutation.mutate();
  };

  const isSubmitting =
    raiseQueryMutation.isPending ||
    markNegativeMutation.isPending ||
    approveMutation.isPending;

  const requestedLoanNumber =
    Number(form.requestedLoan || application?.requestedAmount || 0);

  const recommendedValueNumber =
    Number(form.recommendedValue || form.marketValue || 0);

  const marketValueNumber =
    Number(form.marketValue || application?.propertyValue || 0);

  const indicativeLtv =
    marketValueNumber > 0
      ? ((requestedLoanNumber / marketValueNumber) * 100).toFixed(2)
      : "—";

  const ltvOnRecommended =
    recommendedValueNumber > 0
      ? ((requestedLoanNumber / recommendedValueNumber) * 100).toFixed(2)
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <b>Valuation initiation payment gate:</b> Technical / Valuation
              Fee ₹6,490
              <p className="mt-1 text-xs">
                Create and send an approved payment link before the stage is
                completed.
              </p>
            </div>

            <Link
              to={
                selectedId
                  ? `/payment-management/${selectedId}`
                  : "/payment-management"
              }
              className="w-fit rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-2.5 text-xs font-black text-cyan-700 shadow-sm transition-all hover:bg-cyan-100"
            >
              Create payment link
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#078b86] via-[#119c90] to-[#59c994] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-blue-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                ◈
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Technical Valuation
                </h1>

                <p className="mt-2 text-sm font-medium text-white/90">
                  {application?.applicationNumber || "Select Application"} ·
                  Property inspection, comparables, marketability and accepted
                  value.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRaiseQuery}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50 disabled:opacity-50"
              >
                Raise Technical Query
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleMarkNegative}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50 disabled:opacity-50"
              >
                Mark Negative
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-700 shadow-sm transition-all hover:bg-teal-50 disabled:opacity-50"
              >
                {approveMutation.isPending
                  ? "Sending..."
                  : "Accept & Send to Legal"}
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
                <option value="">Select Valuation Case</option>

                {valuationCases.map((item) => (
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
                placeholder="Selected valuation case details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={!application}
              onClick={autoFillFromApplication}
              className="h-12 rounded-xl bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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

        <WorkflowCard />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <InfoCard title="Assignment">
            <Field
              label="Valuer"
              value={form.valuer}
              onChange={(value) => updateForm("valuer", value)}
            />

            <Field
              label="Visit Date"
              type="date"
              value={form.visitDate}
              onChange={(value) => updateForm("visitDate", value)}
            />

            <Field
              label="Property Area (sq. ft.)"
              value={form.propertyArea}
              onChange={(value) => updateForm("propertyArea", value)}
            />

            <SelectField
              label="Occupancy"
              value={form.occupancy}
              options={["Self-occupied", "Tenant occupied", "Vacant"]}
              onChange={(value) => updateForm("occupancy", value)}
            />

            <SelectField
              label="Construction Quality"
              value={form.constructionQuality}
              options={["Excellent", "Good", "Average", "Poor"]}
              onChange={(value) =>
                updateForm("constructionQuality", value)
              }
            />

            <Field
              label="Residual Life (years)"
              value={form.residualLife}
              onChange={(value) => updateForm("residualLife", value)}
            />
          </InfoCard>

          <InfoCard title="Valuation values">
            <Field
              label="Market Value"
              value={form.marketValue}
              onChange={(value) => updateForm("marketValue", value)}
            />

            <Field
              label="Distress Value"
              value={form.distressValue}
              onChange={(value) => updateForm("distressValue", value)}
            />

            <Field
              label="Realisable Value"
              value={form.realisableValue}
              onChange={(value) => updateForm("realisableValue", value)}
            />

            <Field
              label="Recommended Value"
              value={form.recommendedValue}
              onChange={(value) => updateForm("recommendedValue", value)}
            />

            <Field
              label="Requested Loan"
              value={form.requestedLoan}
              onChange={(value) => updateForm("requestedLoan", value)}
            />

            <SelectField
              label="Valuation Status"
              value={form.valuationStatus}
              options={["Positive", "Query", "Negative"]}
              onChange={(value) => updateForm("valuationStatus", value)}
            />
          </InfoCard>

          <InfoCard title="Technical result">
            <DisplayRow label="Indicative LTV" value={`${indicativeLtv}%`} />
            <DisplayRow
              label="LTV on Recommended Value"
              value={`${ltvOnRecommended}%`}
            />
            <DisplayRow
              label="Marketability"
              value={
                <Badge color="green">
                  Good
                </Badge>
              }
            />
            <DisplayRow
              label="Construction Deviation"
              value={
                <Badge color="green">
                  None material
                </Badge>
              }
            />
            <DisplayRow label="Property Risk Grade" value="PR2" />

            <div className="mt-5 rounded-2xl border-l-4 border-emerald-600 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
              {form.technicalRemarks}
            </div>

            <TextArea
              label="Technical Remarks"
              value={form.technicalRemarks}
              onChange={(value) => updateForm("technicalRemarks", value)}
            />
          </InfoCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
            <h3 className="text-xl font-black text-slate-800">
              Comparable properties
            </h3>
            <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" />

            <div className="mt-6 overflow-hidden rounded-2xl border border-teal-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-teal-50 text-xs font-black uppercase tracking-wide text-teal-700">
                  <tr>
                    <th className="px-5 py-4">Comparable</th>
                    <th className="px-5 py-4">Distance</th>
                    <th className="px-5 py-4">Area</th>
                    <th className="px-5 py-4">Rate / Sq.Ft.</th>
                    <th className="px-5 py-4">Adjusted Value</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {comparableRows.map((row) => (
                    <tr key={row.comparable}>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {row.comparable}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.distance}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.area}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.rate}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {row.adjustedValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <InfoCard title="Visit evidence">
              <div className="rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/40 p-7 text-center">
                <div className="text-xl">🏠</div>
                <p className="mt-2 text-base font-bold text-slate-700">
                  12 geo-tagged photographs
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Boundary, frontage, interiors, access road and surroundings
                </p>
              </div>
            </InfoCard>

            <InfoCard title="Variance control">
              <p className="text-sm leading-6 text-slate-500">
                For configured high-value cases, two independent valuations are
                required. Variance above 15% routes to a senior technical
                reviewer.
              </p>

              <div className="mt-4">
                <Badge color="green">
                  Variance 7.3%
                </Badge>
              </div>
            </InfoCard>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-500">
          Final submit from this page moves the application to{" "}
          <b>LEGAL_PENDING</b>.
        </div>
      </div>
    </div>
  );
}

function WorkflowCard() {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between gap-6 overflow-x-auto">
        {workflowSteps.map((step, index) => {
          const completed = step.status === "completed";
          const current = step.status === "current";

          return (
            <div
              key={step.id}
              className="flex min-w-[125px] flex-1 flex-col items-center text-center"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                    completed
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : current
                        ? "bg-teal-600 text-white ring-8 ring-teal-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <FaCheck /> : step.id}
                </div>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden h-0.5 w-16 bg-teal-200 xl:block" />
                )}
              </div>

              <p
                className={`mt-3 text-xs font-black ${
                  current ? "text-teal-700" : "text-slate-700"
                }`}
              >
                {step.label}
              </p>

              <p className="mt-1 text-[11px] font-medium capitalize text-slate-500">
                {step.status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" />
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">{label}</label>

      <input
        type={type}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
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
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
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

function DisplayRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-800">
        {value || "—"}
      </span>
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
        className="mt-2 w-full resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function Badge({ children, color }) {
  const classes =
    color === "green"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${classes}`}>
      {children}
    </span>
  );
}