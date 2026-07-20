import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth.js";
import { creditApi } from "../creditApi.js";

const ROLE_LABELS = {
  ADMIN: "Admin View",
  CM: "CM View Only",
  CREDIT_MAKER: "Credit Maker View Only",
  CREDIT_CHECKER: "Credit Checker View Only",
  VALUATION: "Valuation View Only",
  LEGAL: "Legal View Only",
  SANCTION: "Sanction View Only",
  RM: "RM View Only",
  BM: "BM View Only",
};

const ROLE_PRIORITY = [
  "ADMIN",
  "CM",
  "CREDIT_MAKER",
  "CREDIT_CHECKER",
  "VALUATION",
  "LEGAL",
  "SANCTION",
  "BM",
  "RM",
];

const BASE_WORKFLOW_STEPS = [
  { id: 1, key: "LEAD", label: "Lead" },
  { id: 2, key: "FIELD", label: "Field Verification" },
  { id: 3, key: "BM", label: "BM Review" },
  { id: 4, key: "CM", label: "CM Screening" },
  { id: 5, key: "CREDIT_MAKER", label: "Credit Maker" },
  { id: 6, key: "CREDIT_CHECKER", label: "Credit Checker" },
  { id: 7, key: "VALUATION", label: "Valuation" },
  { id: 8, key: "LEGAL", label: "Legal" },
  { id: 9, key: "SANCTION", label: "Sanction" },
  { id: 10, key: "AGREEMENT", label: "Agreement" },
  { id: 11, key: "DISBURSEMENT", label: "Disbursement" },
];

const CM_VISIBLE_STATUSES = [
  "BM_APPROVED",
  "SUBMITTED_TO_CM",
  "CM_PENDING",
  "CM_QUERY",
  "CM_APPROVED",
  "CM_REJECTED",
];

const CREDIT_MAKER_VISIBLE_STATUSES = [
  "CM_APPROVED",
  "CREDIT_MAKER_PENDING",
  "CREDIT_MAKER_QUERY",
  "CREDIT_MAKER_RECOMMENDED",
  "CREDIT_MAKER_REJECTED",
  "SUBMITTED_TO_CREDIT_CHECKER",
  "CREDIT_CHECKER_PENDING",
  "CREDIT_CHECKER_QUERY",
  "CREDIT_CHECKER_APPROVED",
];

const CREDIT_CHECKER_VISIBLE_STATUSES = [
  "CM_APPROVED",
  "CREDIT_MAKER_PENDING",
  "CREDIT_MAKER_QUERY",
  "CREDIT_MAKER_RECOMMENDED",
  "SUBMITTED_TO_CREDIT_CHECKER",
  "CREDIT_CHECKER_PENDING",
  "CREDIT_CHECKER_QUERY",
  "CREDIT_CHECKER_APPROVED",
  "CREDIT_CHECKER_REJECTED",
];

const VALUATION_VISIBLE_STATUSES = [
  "CREDIT_CHECKER_APPROVED",
  "VALUATION_PENDING",
  "VALUATION_QUERY",
  "VALUATION_APPROVED",
  "VALUATION_REJECTED",
];

const LEGAL_VISIBLE_STATUSES = [
  "VALUATION_APPROVED",
  "LEGAL_PENDING",
  "LEGAL_QUERY",
  "LEGAL_APPROVED",
  "LEGAL_REJECTED",
];

const SANCTION_VISIBLE_STATUSES = [
  "LEGAL_APPROVED",
  "SANCTION_PENDING",
  "SANCTION_APPROVED",
  "SANCTION_REJECTED",
];

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const unwrapArray = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;

  return [];
};

const valueOrEmpty = (value) => {
  return value === null || value === undefined ? "" : String(value);
};

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeRoles = (user) => {
  const roles = user?.roles;

  if (!roles) return [];

  return Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase())
    : [String(roles).toUpperCase()];
};

const getActiveRole = (roles) => {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) || "CM";
};

const includesStatus = (status, list) => {
  return list.includes(String(status || "").toUpperCase());
};

const filterApplicationsByRole = (rows, activeRole, roles) => {
  if (roles.includes("ADMIN")) {
    return rows;
  }

  return rows.filter((item) => {
    const stage = String(item.stage || "").toUpperCase();
    const status = String(item.status || "").toUpperCase();

    if (activeRole === "CM") {
      return (
        stage === "CM" ||
        includesStatus(status, CM_VISIBLE_STATUSES)
      );
    }

    if (activeRole === "CREDIT_MAKER") {
      return (
        stage === "CREDIT" ||
        includesStatus(status, CREDIT_MAKER_VISIBLE_STATUSES)
      );
    }

    if (activeRole === "CREDIT_CHECKER") {
      return (
        stage === "CREDIT" ||
        includesStatus(status, CREDIT_CHECKER_VISIBLE_STATUSES)
      );
    }

    if (activeRole === "VALUATION") {
      return (
        stage === "VALUATION" ||
        includesStatus(status, VALUATION_VISIBLE_STATUSES)
      );
    }

    if (activeRole === "LEGAL") {
      return (
        stage === "LEGAL" ||
        includesStatus(status, LEGAL_VISIBLE_STATUSES)
      );
    }

    if (activeRole === "SANCTION") {
      return (
        stage === "SANCTION" ||
        includesStatus(status, SANCTION_VISIBLE_STATUSES)
      );
    }

    return true;
  });
};

const fetchApplicationList = (activeRole) => {
  if (typeof creditApi.applications === "function") {
    return creditApi.applications({
      page: 1,
      limit: 500,
    });
  }

  if (
    activeRole === "CREDIT_MAKER" &&
    typeof creditApi.makerCases === "function"
  ) {
    return creditApi.makerCases();
  }

  if (
    activeRole === "CREDIT_CHECKER" &&
    typeof creditApi.checkerCases === "function"
  ) {
    return creditApi.checkerCases();
  }

  throw new Error(
    "creditApi.applications is required for common application data screen.",
  );
};

const fetchApplicationById = (applicationId) => {
  if (typeof creditApi.getApplication === "function") {
    return creditApi.getApplication(applicationId);
  }

  if (typeof creditApi.getCreditApplication === "function") {
    return creditApi.getCreditApplication(applicationId);
  }

  throw new Error(
    "creditApi.getApplication or creditApi.getCreditApplication is required.",
  );
};

const getCurrentWorkflowIndex = (application) => {
  const stage = String(application?.stage || "").toUpperCase();
  const status = String(application?.status || "").toUpperCase();

  if (!application) return -1;

  if (stage === "DISBURSEMENT" || status.includes("DISBURSEMENT")) return 10;
  if (stage === "AGREEMENT" || status.includes("AGREEMENT")) return 9;
  if (stage === "SANCTION" || status.includes("SANCTION")) return 8;
  if (stage === "LEGAL" || status.includes("LEGAL")) return 7;
  if (stage === "VALUATION" || status.includes("VALUATION")) return 6;
  if (status.includes("CREDIT_CHECKER")) return 5;
  if (status.includes("CREDIT_MAKER")) return 4;
  if (stage === "CREDIT") return 4;
  if (stage === "CM" || status.includes("CM")) return 3;
  if (stage === "BM" || status.includes("BM")) return 2;
  if (stage === "RM") return 1;

  return 0;
};

const buildWorkflowSteps = (application) => {
  const currentIndex = getCurrentWorkflowIndex(application);

  return BASE_WORKFLOW_STEPS.map((step, index) => {
    if (currentIndex === -1) {
      return {
        ...step,
        status: "pending",
      };
    }

    if (index < currentIndex) {
      return {
        ...step,
        status: "completed",
      };
    }

    if (index === currentIndex) {
      return {
        ...step,
        status: "current",
      };
    }

    return {
      ...step,
      status: "pending",
    };
  });
};

export default function CMApplicationData() {
  const { user } = useAuth();
  const roles = normalizeRoles(user);
  const activeRole = getActiveRole(roles);

  const { applicationId: routeApplicationId } = useParams();
  const [selectedId, setSelectedId] = useState(routeApplicationId || "");

  useEffect(() => {
    setSelectedId(routeApplicationId || "");
  }, [routeApplicationId]);

  const applicationsQuery = useQuery({
    queryKey: ["common-application-data-list", activeRole],
    queryFn: () => fetchApplicationList(activeRole),
    retry: false,
  });

  const applicationList = useMemo(() => {
    const rows = unwrapArray(applicationsQuery.data);

    return filterApplicationsByRole(rows, activeRole, roles);
  }, [applicationsQuery.data, activeRole, roles]);

  const applicationQuery = useQuery({
    queryKey: ["common-application-data", selectedId],
    queryFn: () => fetchApplicationById(selectedId),
    enabled: Boolean(selectedId),
    retry: false,
  });

  const application = unwrapPayload(applicationQuery.data);

  const workflowSteps = useMemo(() => {
    return buildWorkflowSteps(application);
  }, [application]);

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
                  {application?.applicationNumber || "Select Application"} ·
                  View applicant, loan and collateral details.
                </p>

                {application && (
                  <p className="mt-1 text-xs font-bold text-white/80">
                    Stage: {formatStatus(application.stage)} · Status:{" "}
                    {formatStatus(application.status)}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/20 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-md">
              {ROLE_LABELS[activeRole] || "View Only"}
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white/95 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[500px_1fr]">
            <div className="relative">
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  {applicationsQuery.isLoading
                    ? "Loading applications..."
                    : `Select Application (${ROLE_LABELS[activeRole] || activeRole})`}
                </option>

                {applicationList.map((item) => (
                  <option key={item.id} value={item.id}>
                    ID: {item.id} |{" "}
                    {item.applicationNumber || `APP-${item.id}`} -{" "}
                    {item.customerName || "No Name"} -{" "}
                    {formatStatus(item.status)}
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
                placeholder="Selected application details"
                className="h-12 w-full rounded-xl border border-blue-100 bg-slate-50 px-4 pl-11 text-sm font-medium text-slate-700 outline-none"
              />
            </div>
          </div>

          {!applicationsQuery.isLoading && applicationList.length === 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              No applications found for {ROLE_LABELS[activeRole] || activeRole}.
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-6 overflow-x-auto">
            {workflowSteps.map((step, index) => {
              const completed = step.status === "completed";
              const current = step.status === "current";

              return (
                <div
                  key={step.id}
                  className="flex min-w-[135px] flex-1 flex-col items-center text-center"
                >
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

                  <p
                    className={`mt-3 text-xs font-black ${
                      current ? "text-blue-700" : "text-slate-700"
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

        {!selectedId && (
          <div className="rounded-[26px] border border-blue-100 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-slate-800">
              Select application to load case details
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              The dropdown will show cases based on the logged-in role and
              current workflow status.
            </p>
          </div>
        )}

        {selectedId && applicationQuery.isLoading && (
          <div className="rounded-[26px] border border-blue-100 bg-white p-10 text-center text-sm font-black text-slate-500 shadow-sm">
            Loading selected application details...
          </div>
        )}

        {selectedId && application && (
          <>
            <div className="rounded-[26px] border border-blue-100 bg-white/95 p-7 shadow-sm">
              <Section title="Lead sourcing" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadOnlyField label="Source Type" value={form.sourceType} />
                <ReadOnlyField label="Hub" value={form.hub} />
                <ReadOnlyField label="Spoke" value={form.spoke} />
              </div>

              <Section title="Primary applicant" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadOnlyField
                  label="Customer / Entity Name"
                  value={form.customerName}
                />
                <ReadOnlyField label="Mobile Number" value={form.mobile} />
                <ReadOnlyField label="Email ID" value={form.email} />
                <ReadOnlyField label="PAN Number" value={form.pan} />
                <ReadOnlyField
                  label="Aadhaar / OVD Masked"
                  value={form.aadhaar}
                />
                <ReadOnlyField
                  label="Occupation / Constitution"
                  value={form.occupation}
                />
                <ReadOnlyField
                  label="Employer / Business Name"
                  value={form.businessName}
                />
                <ReadOnlyField
                  label="Employment / Business Vintage Years"
                  value={form.vintage}
                />
                <ReadOnlyField
                  label="Verified Monthly Income"
                  value={form.monthlyIncome}
                />
                <ReadOnlyField
                  label="Existing Monthly Obligations"
                  value={form.monthlyObligations}
                />
              </div>

              <Section title="Loan requirement" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadOnlyField
                  label="Requested Loan Amount"
                  value={form.requestedAmount}
                />
                <ReadOnlyField label="Loan Purpose" value={form.loanPurpose} />
                <ReadOnlyField
                  label="Requested Tenure Months"
                  value={form.tenure}
                />
              </div>

              <Section title="Collateral property" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadOnlyField label="Property Type" value={form.propertyType} />
                <ReadOnlyField
                  label="Approximate Property Value"
                  value={form.propertyValue}
                />
                <ReadOnlyField
                  label="Property Address"
                  value={form.propertyAddress}
                />
                <ReadOnlyField label="City" value={form.city} />
                <ReadOnlyField label="State" value={form.state} />
                <ReadOnlyField label="PIN Code" value={form.pincode} />
              </div>

              <Section title="Indicative eligibility" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadOnlyField label="FOIR" value={form.foir} />
                <ReadOnlyField label="Indicative LTV" value={form.ltv} />
                <ReadOnlyField
                  label="Rule Version"
                  value={form.ruleVersion}
                />
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
              Production control: full Aadhaar must not be displayed or logged.
              This page is common view-only Application Data for CM, Credit
              Maker, Credit Checker and further workflow teams.
            </div>
          </>
        )}
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