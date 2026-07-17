import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { creditApi } from "../creditApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "Field Verification", status: "completed" },
  { id: 3, label: "BM Review", status: "completed" },
  { id: 4, label: "CM Screening", status: "current" },
  { id: 5, label: "Credit", status: "pending" },
  { id: 6, label: "Legal & Valuation", status: "pending" },
  { id: 7, label: "Sanction", status: "pending" },
  { id: 8, label: "Documentation", status: "pending" },
  { id: 9, label: "Disbursement", status: "pending" },
];

const valueOrEmpty = (value) => {
  return value === null || value === undefined ? "" : String(value);
};

export default function CMApplicationData() {
  const { applicationId: routeApplicationId } = useParams();
  const [selectedId, setSelectedId] = useState(routeApplicationId || "");

  const applicationsQuery = useQuery({
    queryKey: ["cm-application-data-list"],
    queryFn: () => creditApi.applications({ page: 1, limit: 100 }),
  });

  const cmApplications = useMemo(() => {
    const rows = applicationsQuery.data?.data ?? [];

    return rows.filter((item) => {
      const stage = String(item.stage || "").toUpperCase();
      const status = String(item.status || "").toUpperCase();

      return (
        stage === "CM" ||
        status === "CM_PENDING" ||
        status === "BM_APPROVED" ||
        status === "SUBMITTED_TO_CM"
      );
    });
  }, [applicationsQuery.data]);

  useEffect(() => {
    if (!selectedId && cmApplications.length) {
      setSelectedId(String(cmApplications[0].id));
    }
  }, [cmApplications, selectedId]);

  const applicationQuery = useQuery({
    queryKey: ["cm-application-data", selectedId],
    queryFn: () => creditApi.getApplication(selectedId),
    enabled: Boolean(selectedId),
  });

  const application = unwrapPayload(applicationQuery.data);

  const form = {
    sourceType: application?.sourceType || application?.source || "Direct",
    hub: application?.hub || application?.branch || "",
    spoke: application?.spoke || "",

    customerName: application?.customerName || "",
    mobile: application?.mobile || application?.mobileNumber || "",
    email: application?.email || application?.emailId || "",
    pan: application?.pan || application?.panNumber || "",
    aadhaar:
      application?.aadhaarNumber ||
      application?.aadharNumber ||
      application?.ovdNumber ||
      "",
    occupation:
      application?.occupationType ||
      application?.occupation ||
      application?.constitution ||
      "",

    businessName: application?.businessName || "",
    vintage:
      application?.businessVintage ||
      application?.employmentVintage ||
      application?.vintage ||
      "",
    monthlyIncome:
      application?.monthlyIncome ||
      application?.verifiedMonthlyIncome ||
      "",
    monthlyObligations:
      application?.existingMonthlyObligations ||
      application?.monthlyObligations ||
      "",

    requestedAmount:
      application?.requestedAmount ||
      application?.loanAmount ||
      "",
    loanPurpose:
      application?.loanPurpose ||
      application?.purpose ||
      "",
    tenure:
      application?.tenure ||
      application?.requestedTenure ||
      "",

    propertyType:
      application?.propertyType ||
      application?.propertyCategory ||
      "",
    propertyValue:
      application?.marketValue ||
      application?.propertyValue ||
      "",
    propertyAddress:
      application?.propertyAddress ||
      application?.address ||
      "",
    city:
      application?.propertyCity ||
      application?.city ||
      "",
    state:
      application?.propertyState ||
      application?.state ||
      "",
    pincode:
      application?.propertyPincode ||
      application?.pinCode ||
      application?.pincode ||
      "",

    foir: application?.foir || "",
    ltv: application?.ltv || application?.indicativeLtv || "",
    ruleVersion: application?.ruleVersion || "LIP-POLICY-2026.06-v1",
    rmNotes:
      application?.rmNotes ||
      application?.rmRecommendation ||
      application?.remarks ||
      "",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef7ff] p-6 text-slate-900 antialiased md:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#4857e8] via-[#2575fc] to-[#35c4c8] p-7 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/30" />
          <div className="absolute left-16 top-0 h-full w-72 bg-cyan-500/20" />
          <div className="absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-inner backdrop-blur-md">
                +
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Application Data
                </h1>
                <p className="mt-2 text-sm font-medium text-white/90">
                  {application?.applicationNumber || "Select Application"} · View applicant, loan and collateral details.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/20 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-md">
              CM View Only
            </div>
          </div>
        </div>

        {/* CASE SELECTOR */}
        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[420px_1fr]">
            <div className="relative">
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select CM Application</option>
                {cmApplications.map((item) => (
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
                    ? `${application.customerName || ""} | ${application.mobile || ""} | ${application.pan || ""}`
                    : ""
                }
                placeholder="Selected application details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* WORKFLOW */}
        {/* <div className="rounded-[26px] border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-6 overflow-x-auto">
            {workflowSteps.map((step, index) => {
              const completed = step.status === "completed";
              const current = step.status === "current";

              return (
                <div key={step.id} className="flex min-w-[135px] flex-1 flex-col items-center text-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${
                        completed
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : current
                            ? "bg-blue-600 text-white ring-8 ring-blue-100"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {completed ? <FaCheck /> : step.id}
                    </div>

                    {index < workflowSteps.length - 1 && (
                      <div className="hidden h-0.5 w-20 bg-blue-200 xl:block" />
                    )}
                  </div>

                  <p className={`mt-3 text-xs font-black ${current ? "text-blue-700" : "text-slate-700"}`}>
                    {step.label}
                  </p>

                  <p className="mt-1 text-[11px] font-medium capitalize text-slate-500">
                    {step.status}
                  </p>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* FORM DATA */}
        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
          <Section title="Lead sourcing" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ReadOnlyField label="Source Type" value={form.sourceType} />
            <ReadOnlyField label="Hub" value={form.hub} />
            <ReadOnlyField label="Spoke" value={form.spoke} />
          </div>

          <Section title="Primary applicant" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ReadOnlyField label="Customer / Entity Name" value={form.customerName} />
            <ReadOnlyField label="Mobile Number" value={form.mobile} />
            <ReadOnlyField label="Email ID" value={form.email} />
            <ReadOnlyField label="PAN Number" value={form.pan} />
            <ReadOnlyField label="Aadhaar / OVD Masked" value={form.aadhaar} />
            <ReadOnlyField label="Occupation / Constitution" value={form.occupation} />
            <ReadOnlyField label="Employer / Business Name" value={form.businessName} />
            <ReadOnlyField label="Employment / Business Vintage Years" value={form.vintage} />
            <ReadOnlyField label="Verified Monthly Income" value={form.monthlyIncome} />
            <ReadOnlyField label="Existing Monthly Obligations" value={form.monthlyObligations} />
          </div>

          <Section title="Loan requirement" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ReadOnlyField label="Requested Loan Amount" value={form.requestedAmount} />
            <ReadOnlyField label="Loan Purpose" value={form.loanPurpose} />
            <ReadOnlyField label="Requested Tenure Months" value={form.tenure} />
          </div>

          <Section title="Collateral property" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ReadOnlyField label="Property Type" value={form.propertyType} />
            <ReadOnlyField label="Approximate Property Value" value={form.propertyValue} />
            <ReadOnlyField label="Property Address" value={form.propertyAddress} />
            <ReadOnlyField label="City" value={form.city} />
            <ReadOnlyField label="State" value={form.state} />
            <ReadOnlyField label="PIN Code" value={form.pincode} />
          </div>

          <Section title="Indicative eligibility" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ReadOnlyField label="FOIR" value={form.foir} />
            <ReadOnlyField label="Indicative LTV" value={form.ltv} />
            <ReadOnlyField label="Rule Version" value={form.ruleVersion} />
          </div>

          <div className="mt-5">
            <label className="text-xs font-black text-slate-600">
              RM Notes
            </label>
            <textarea
              readOnly
              rows={4}
              value={valueOrEmpty(form.rmNotes)}
              className="mt-2 w-full resize-none rounded-xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Production control: full Aadhaar must not be displayed or logged. This page is view-only for CM role.
        </div>
      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div className="mb-5 mt-8 first:mt-0">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded bg-blue-600" />
        <h3 className="text-lg font-black text-slate-800">{title}</h3>
      </div>
      <div className="mt-3 h-px w-full bg-blue-100" />
      <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-600">
        {label}
      </label>
      <input
        readOnly
        value={valueOrEmpty(value)}
        className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none"
      />
    </div>
  );
}