import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaChartLine,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileSignature,
  FaHome,
  FaPaperPlane,
  FaQuestionCircle,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaUserTie,
} from "react-icons/fa";
import { useParams } from "react-router-dom";

import { creditApi } from "../creditApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(2)}%`;
};

const calculateFoir = (income, obligations) => {
  const incomeNumber = numberValue(income);
  const obligationNumber = numberValue(obligations);

  if (incomeNumber <= 0) return "";

  return ((obligationNumber / incomeNumber) * 100).toFixed(2);
};

const calculateLtv = (loanAmount, propertyValue) => {
  const loan = numberValue(loanAmount);
  const property = numberValue(propertyValue);

  if (property <= 0) return "";

  return ((loan / property) * 100).toFixed(2);
};

const defaultMakerForm = {
  customerName: "",
  mobile: "",
  email: "",
  pan: "",
  occupationType: "",
  businessName: "",

  applicationNumber: "",
  requestedAmount: "",
  stage: "",
  status: "",

  propertyCategory: "",
  propertyType: "",
  propertyAddress: "",
  propertyCity: "",
  propertyState: "",
  propertyPincode: "",
  assessedPropertyValue: "",

  verifiedIncome: "",
  existingObligations: "",
  foir: "",
  indicativeLtv: "",

  bureauScore: "",
  currentDpd: "",
  dpd30In12m: "",
  writtenOffSettled: "None",
  recentEnquiries: "",
  commercialBureau: "Satisfactory",

  incomeMethod: "Banking + ITR",
  dpdProfile: "Clean",
  businessVintage: "",
  internalRiskGrade: "A3",
  fraudRisk: "Low",
  policyResult: "Conditional Pass",

  recommendedAmount: "",
  recommendedTenure: "",
  recommendedRoi: "",
  makerRiskGrade: "A3",
  makerRecommendation: "Recommend with Conditions",

  borrowerAssessment:
    "Borrower profile, vintage and repayment capacity are acceptable subject to final verification.",
  bankingAssessment:
    "Banking credits and average balances support assessed income and repayment ability.",
  propertyAssessment:
    "Collateral appears acceptable subject to technical valuation and legal clearance.",
  riskMitigants:
    "Property security, co-applicant strength and pre-disbursement conditions mitigate identified risks.",
  deviationJustification:
    "Minor deviation, if any, is recommended within delegated policy norms.",
  preDisbursementConditions:
    "Legal clearance, valuation report, updated banking and KYC documents to be completed before disbursement.",
  postDisbursementConditions:
    "Regular repayment monitoring and document deferral tracking as per policy.",
  makerRemarks:
    "Recommended for Credit Checker review subject to policy, legal and valuation conditions.",
};

const buildInitialForm = (application, creditAssessment) => {
  const requestedAmount =
    application?.requestedAmount ||
    application?.loanAmount ||
    creditAssessment?.requestedLoan ||
    "";

  const propertyValue =
    application?.marketValue ||
    application?.propertyValue ||
    application?.customerProfile?.marketValue ||
    creditAssessment?.propertyValue ||
    "";

  const verifiedIncome =
    creditAssessment?.verifiedIncome ||
    application?.verifiedIncome ||
    application?.monthlyIncome ||
    application?.customerProfile?.monthlyIncome ||
    "";

  const existingObligations =
    creditAssessment?.existingObligations ||
    application?.existingMonthlyObligations ||
    application?.monthlyObligations ||
    "";

  const recommendedAmount =
    creditAssessment?.makerRecommendedAmount ||
    creditAssessment?.cmRecommendedAmount ||
    requestedAmount ||
    "";

  const foir =
    creditAssessment?.foir ||
    calculateFoir(verifiedIncome, existingObligations);

  const indicativeLtv =
    creditAssessment?.indicativeLtv ||
    calculateLtv(recommendedAmount || requestedAmount, propertyValue);

  return {
    ...defaultMakerForm,

    customerName:
      application?.customerName ||
      application?.customerProfile?.customerName ||
      "",
    mobile:
      application?.mobile ||
      application?.mobileNumber ||
      application?.customerProfile?.mobile ||
      "",
    email:
      application?.email ||
      application?.emailId ||
      application?.customerProfile?.email ||
      "",
    pan:
      application?.pan ||
      application?.panNumber ||
      application?.customerProfile?.panNumber ||
      "",
    occupationType:
      application?.occupationType ||
      application?.occupation ||
      application?.customerProfile?.occupationType ||
      "",
    businessName:
      application?.businessName ||
      application?.customerProfile?.businessName ||
      "",

    applicationNumber: application?.applicationNumber || "",
    requestedAmount: valueOrEmpty(requestedAmount),
    stage: application?.stage || "",
    status: application?.status || "",

    propertyCategory:
      application?.propertyCategory ||
      application?.customerProfile?.propertyCategory ||
      "",
    propertyType:
      application?.propertyType ||
      application?.customerProfile?.propertyType ||
      "",
    propertyAddress:
      application?.propertyAddress ||
      application?.customerProfile?.propertyAddress ||
      "",
    propertyCity:
      application?.propertyCity ||
      application?.city ||
      application?.customerProfile?.propertyCity ||
      "",
    propertyState:
      application?.propertyState ||
      application?.state ||
      application?.customerProfile?.propertyState ||
      "",
    propertyPincode:
      application?.propertyPincode ||
      application?.pinCode ||
      application?.customerProfile?.propertyPincode ||
      "",
    assessedPropertyValue: valueOrEmpty(propertyValue),

    verifiedIncome: valueOrEmpty(verifiedIncome),
    existingObligations: valueOrEmpty(existingObligations),
    foir: valueOrEmpty(foir),
    indicativeLtv: valueOrEmpty(indicativeLtv),

    bureauScore:
      valueOrEmpty(
        creditAssessment?.bureauScore ||
          application?.bureauScore ||
          application?.cibilScore,
      ),
    currentDpd:
      valueOrEmpty(
        creditAssessment?.currentDpd ||
          application?.currentDpd ||
          0,
      ),
    dpd30In12m:
      valueOrEmpty(
        creditAssessment?.dpd30In12m ||
          application?.dpd30In12m ||
          0,
      ),
    writtenOffSettled:
      creditAssessment?.writtenOffSettled ||
      application?.writtenOffSettled ||
      "None",
    recentEnquiries:
      valueOrEmpty(
        creditAssessment?.recentEnquiries ||
          application?.recentEnquiries ||
          0,
      ),
    commercialBureau:
      creditAssessment?.commercialBureau ||
      application?.commercialBureau ||
      "Satisfactory",

    recommendedAmount: valueOrEmpty(recommendedAmount),
    recommendedTenure:
      valueOrEmpty(
        creditAssessment?.makerRecommendedTenure ||
          application?.requestedTenure ||
          application?.tenure,
      ),
    recommendedRoi:
      valueOrEmpty(
        creditAssessment?.makerRecommendedRoi ||
          application?.roi ||
          application?.interestRate,
      ),
    makerRiskGrade:
      creditAssessment?.makerRiskGrade ||
      defaultMakerForm.makerRiskGrade,
    makerRemarks:
      creditAssessment?.makerRemarks ||
      defaultMakerForm.makerRemarks,
  };
};

export default function CreditMakerProposal() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydratedApplicationId, setHydratedApplicationId] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(defaultMakerForm);

  const queryClient = useQueryClient();

  const makerCasesQuery = useQuery({
    queryKey: ["credit-maker-cases"],
    queryFn: () => creditApi.makerCases(),
    retry: false,
  });

  const creditMakerCases = useMemo(() => {
    const payload = unwrapPayload(makerCasesQuery.data);
    return normalizeRows(payload);
  }, [makerCasesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || creditMakerCases?.[0]?.id || "";

  const creditApplicationQuery = useQuery({
    queryKey: ["credit-maker-application", finalSelectedId],
    queryFn: () => creditApi.getCreditApplication(finalSelectedId),
    enabled: Boolean(finalSelectedId),
    retry: false,
  });

  const assessmentQuery = useQuery({
    queryKey: ["credit-assessment", finalSelectedId],
    queryFn: () => creditApi.getCreditAssessment(finalSelectedId),
    enabled: Boolean(finalSelectedId && creditApi.getCreditAssessment),
    retry: false,
  });

  const creditApplicationPayload = unwrapPayload(creditApplicationQuery.data);
  const assessmentPayload = unwrapPayload(assessmentQuery.data);

  const application =
    creditApplicationPayload?.application ||
    creditApplicationPayload ||
    {};

  const creditAssessment =
    creditApplicationPayload?.creditAssessment ||
    assessmentPayload?.creditAssessment ||
    assessmentPayload ||
    null;

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;

    if (String(hydratedApplicationId) === String(finalSelectedId)) {
      return;
    }

    setForm(buildInitialForm(application, creditAssessment));
    setHydratedApplicationId(String(finalSelectedId));
    setMessage("");
  }, [
    finalSelectedId,
    hydratedApplicationId,
    application?.id,
    creditAssessment?.id,
  ]);

  const updateForm = (field, value) => {
    setMessage("");

    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field === "verifiedIncome" ||
        field === "existingObligations"
      ) {
        updated.foir = calculateFoir(
          field === "verifiedIncome" ? value : updated.verifiedIncome,
          field === "existingObligations"
            ? value
            : updated.existingObligations,
        );
      }

      if (
        field === "recommendedAmount" ||
        field === "assessedPropertyValue" ||
        field === "requestedAmount"
      ) {
        updated.indicativeLtv = calculateLtv(
          field === "recommendedAmount"
            ? value
            : updated.recommendedAmount || updated.requestedAmount,
          field === "assessedPropertyValue"
            ? value
            : updated.assessedPropertyValue,
        );
      }

      return updated;
    });
  };

  const selectedCaseText = application?.id
    ? `${application?.customerName || form.customerName || ""} | ${
        application?.mobile || form.mobile || ""
      } | ${application?.pan || form.pan || ""}`
    : "";

  const buildPayload = (actionType) => {
    const decision =
      actionType === "QUERY"
        ? "HOLD_QUERY"
        : form.makerRecommendation === "Not Recommended"
          ? "REJECT"
          : "RECOMMEND";

    return {
      actionType,
      decision,
      makerDecision: decision,

      customerEditableSnapshot: {
        customerName: form.customerName,
        mobile: form.mobile,
        email: form.email,
        pan: form.pan,
        occupationType: form.occupationType,
        businessName: form.businessName,
      },

      propertyEditableSnapshot: {
        propertyCategory: form.propertyCategory,
        propertyType: form.propertyType,
        propertyAddress: form.propertyAddress,
        propertyCity: form.propertyCity,
        propertyState: form.propertyState,
        propertyPincode: form.propertyPincode,
        assessedPropertyValue: numberValue(form.assessedPropertyValue),
      },

      eligibilitySnapshot: {
        verifiedIncome: numberValue(form.verifiedIncome),
        existingObligations: numberValue(form.existingObligations),
        foir: numberValue(form.foir),
        indicativeLtv: numberValue(form.indicativeLtv),
        requestedAmount: numberValue(form.requestedAmount),
      },

      bureauSnapshot: {
        bureauScore: numberValue(form.bureauScore),
        currentDpd: numberValue(form.currentDpd),
        dpd30In12m: numberValue(form.dpd30In12m),
        writtenOffSettled: form.writtenOffSettled,
        recentEnquiries: numberValue(form.recentEnquiries),
        commercialBureau: form.commercialBureau,
        dpdProfile: form.dpdProfile,
      },

      recommendedAmount: numberValue(form.recommendedAmount),
      makerRecommendedAmount: numberValue(form.recommendedAmount),

      recommendedRoi: numberValue(form.recommendedRoi),
      makerRecommendedRoi: numberValue(form.recommendedRoi),
      roi: numberValue(form.recommendedRoi),

      recommendedTenure: numberValue(form.recommendedTenure),
      makerRecommendedTenure: numberValue(form.recommendedTenure),
      tenure: numberValue(form.recommendedTenure),

      riskGrade: form.makerRiskGrade,
      makerRiskGrade: form.makerRiskGrade,

      incomeMethod: form.incomeMethod,
      policyResult: form.policyResult,
      fraudRisk: form.fraudRisk,
      internalRiskGrade: form.internalRiskGrade,
      businessVintage: form.businessVintage,

      borrowerAssessment: form.borrowerAssessment,
      bankingAssessment: form.bankingAssessment,
      propertyAssessment: form.propertyAssessment,
      riskMitigants: form.riskMitigants,
      deviationJustification: form.deviationJustification,
      preDisbursementConditions: form.preDisbursementConditions,
      postDisbursementConditions: form.postDisbursementConditions,

      makerRecommendation: form.makerRecommendation,
      makerRemarks: form.makerRemarks,
      remarks:
        actionType === "QUERY"
          ? form.deviationJustification || form.makerRemarks
          : form.makerRemarks,
    };
  };

  const validateBeforeAction = (actionType) => {
    if (!finalSelectedId) {
      setMessage("Please select Credit Maker case first.");
      return false;
    }

    if (actionType === "SUBMIT") {
      const errors = [];

      if (!form.recommendedAmount) errors.push("Recommended Amount");
      if (!form.recommendedTenure) errors.push("Recommended Tenure");
      if (!form.recommendedRoi) errors.push("Recommended ROI");
      if (!form.makerRiskGrade) errors.push("Risk Grade");
      if (!form.makerRemarks) errors.push("Maker Remarks");

      if (errors.length) {
        setMessage(`Please fill required fields: ${errors.join(", ")}.`);
        return false;
      }
    }

    return true;
  };

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSaveDraft(
        finalSelectedId,
        buildPayload("DRAFT"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker draft saved successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save Credit Maker draft.",
      );
    },
  });

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerRaiseQuery(
        finalSelectedId,
        buildPayload("QUERY"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Credit Maker query raised successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise Credit Maker query.",
      );
    },
  });

  const submitToCheckerMutation = useMutation({
    mutationFn: () =>
      creditApi.creditMakerSubmitToChecker(
        finalSelectedId,
        buildPayload("SUBMIT"),
      ),

    onSuccess: async (response) => {
      setMessage(
        response?.data?.message ||
          "Application submitted to Credit Checker successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-assessment", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-maker-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["credit-manager-dashboard"],
        }),
      ]);
    },

    onError: (error) => {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit case to Credit Checker.",
      );
    },
  });

  const handleSaveDraft = () => {
    if (!validateBeforeAction("DRAFT")) return;
    saveDraftMutation.mutate();
  };

  const handleRaiseQuery = () => {
    if (!validateBeforeAction("QUERY")) return;
    raiseQueryMutation.mutate();
  };

  const handleSubmitToChecker = () => {
    if (!validateBeforeAction("SUBMIT")) return;
    submitToCheckerMutation.mutate();
  };

  const submitting =
    saveDraftMutation.isPending ||
    raiseQueryMutation.isPending ||
    submitToCheckerMutation.isPending;

  const scoreCards = [
    {
      label: "Requested Loan",
      value: formatCurrency(form.requestedAmount),
      icon: FaClipboardCheck,
    },
    {
      label: "Recommended",
      value: formatCurrency(form.recommendedAmount),
      icon: FaCheckCircle,
    },
    {
      label: "FOIR",
      value: formatPercent(form.foir),
      icon: FaChartLine,
    },
    {
      label: "LTV",
      value: formatPercent(form.indicativeLtv),
      icon: FaShieldAlt,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#0f2942] via-[#2563eb] to-[#22c7c7] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl shadow-inner backdrop-blur-md">
                  <FaUserTie />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    Credit Maker Workspace
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {form.applicationNumber || "Select Credit Case"} · Review full case details, edit credit inputs and prepare maker recommendation.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={`Stage: ${form.stage || "—"}`} />
                    <Badge value={`Status: ${form.status || "—"}`} />
                    <Badge value={`Assessment: ${creditAssessment?.assessmentStatus || "New Draft"}`} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton
                  variant="ghost"
                  disabled={submitting}
                  icon={FaSave}
                  onClick={handleSaveDraft}
                >
                  {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                </ActionButton>

                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaQuestionCircle}
                  onClick={handleRaiseQuery}
                >
                  Raise Query
                </ActionButton>

                <ActionButton
                  variant="white"
                  disabled={submitting}
                  icon={FaPaperPlane}
                  onClick={handleSubmitToChecker}
                >
                  {submitToCheckerMutation.isPending
                    ? "Submitting..."
                    : "Submit to Checker"}
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[420px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={makerCasesQuery.isLoading || creditMakerCases.length === 0}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydratedApplicationId("");
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {makerCasesQuery.isLoading ? (
                  <option value="">Loading Credit Maker cases...</option>
                ) : creditMakerCases.length === 0 ? (
                  <option value="">No Credit Maker cases available</option>
                ) : (
                  <>
                    <option value="">Select Credit Maker Case</option>
                    {creditMakerCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.applicationNumber} - {item.customerName}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                <FaChevronDown size={12} />
              </span>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <FaSearch size={14} />
              </span>

              <input
                readOnly
                value={selectedCaseText}
                placeholder="Selected case details"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Panel
              title="Customer & Application Details"
              subtitle="Editable credit snapshot for maker assessment."
              icon={FaUserTie}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Customer Name" value={form.customerName} onChange={(v) => updateForm("customerName", v)} />
                <Field label="Mobile" value={form.mobile} onChange={(v) => updateForm("mobile", v)} />
                <Field label="Email" value={form.email} onChange={(v) => updateForm("email", v)} />
                <Field label="PAN" value={form.pan} onChange={(v) => updateForm("pan", v.toUpperCase())} />
                <Field label="Occupation / Constitution" value={form.occupationType} onChange={(v) => updateForm("occupationType", v)} />
                <Field label="Business / Employer Name" value={form.businessName} onChange={(v) => updateForm("businessName", v)} />
              </div>
            </Panel>

            <Panel
              title="Property & Collateral Details"
              subtitle="Collateral details used for LTV and security assessment."
              icon={FaHome}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Property Category" value={form.propertyCategory} onChange={(v) => updateForm("propertyCategory", v)} />
                <Field label="Property Type" value={form.propertyType} onChange={(v) => updateForm("propertyType", v)} />
                <Field label="Assessed Property Value" type="number" value={form.assessedPropertyValue} onChange={(v) => updateForm("assessedPropertyValue", v)} />
                <Field label="City" value={form.propertyCity} onChange={(v) => updateForm("propertyCity", v)} />
                <Field label="State" value={form.propertyState} onChange={(v) => updateForm("propertyState", v)} />
                <Field label="Pincode" value={form.propertyPincode} onChange={(v) => updateForm("propertyPincode", v)} />
              </div>

              <TextArea
                label="Property Address"
                rows={3}
                value={form.propertyAddress}
                onChange={(v) => updateForm("propertyAddress", v)}
              />
            </Panel>

            <Panel
              title="Eligibility & Bureau Assessment"
              subtitle="Review and edit core underwriting numbers."
              icon={FaChartLine}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Verified Income" type="number" value={form.verifiedIncome} onChange={(v) => updateForm("verifiedIncome", v)} />
                <Field label="Existing Obligations" type="number" value={form.existingObligations} onChange={(v) => updateForm("existingObligations", v)} />
                <Field label="FOIR %" type="number" value={form.foir} onChange={(v) => updateForm("foir", v)} />
                <Field label="Indicative LTV %" type="number" value={form.indicativeLtv} onChange={(v) => updateForm("indicativeLtv", v)} />

                <Field label="Bureau Score" type="number" value={form.bureauScore} onChange={(v) => updateForm("bureauScore", v)} />
                <Field label="Current DPD" type="number" value={form.currentDpd} onChange={(v) => updateForm("currentDpd", v)} />
                <Field label="30+ DPD in 12M" type="number" value={form.dpd30In12m} onChange={(v) => updateForm("dpd30In12m", v)} />
                <Field label="Recent Enquiries" type="number" value={form.recentEnquiries} onChange={(v) => updateForm("recentEnquiries", v)} />

                <SelectField label="Written-off / Settled" value={form.writtenOffSettled} options={["None", "Settled", "Written-off", "Suit Filed"]} onChange={(v) => updateForm("writtenOffSettled", v)} />
                <SelectField label="Commercial Bureau" value={form.commercialBureau} options={["Satisfactory", "Average", "Negative", "Not Available"]} onChange={(v) => updateForm("commercialBureau", v)} />
                <SelectField label="DPD Profile" value={form.dpdProfile} options={["Clean", "Minor Delay", "Moderate Risk", "High Risk"]} onChange={(v) => updateForm("dpdProfile", v)} />
                <Field label="Business / Employment Vintage" value={form.businessVintage} onChange={(v) => updateForm("businessVintage", v)} />
              </div>
            </Panel>

            <Panel
              title="Maker Credit Memo"
              subtitle="Detailed note for Credit Checker review."
              icon={FaFileSignature}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SelectField
                  label="Income Assessment Method"
                  value={form.incomeMethod}
                  options={[
                    "Banking + ITR",
                    "Banking",
                    "ITR",
                    "GST",
                    "Manual Assessment",
                  ]}
                  onChange={(v) => updateForm("incomeMethod", v)}
                />

                <SelectField
                  label="Maker Recommendation"
                  value={form.makerRecommendation}
                  options={[
                    "Approve Subject to Legal & Valuation",
                    "Recommend with Conditions",
                    "Raise Query",
                    "Not Recommended",
                  ]}
                  onChange={(v) => updateForm("makerRecommendation", v)}
                />

                <SelectField
                  label="Policy Result"
                  value={form.policyResult}
                  options={[
                    "Pass",
                    "Conditional Pass",
                    "Deviation",
                    "Fail",
                  ]}
                  onChange={(v) => updateForm("policyResult", v)}
                />
              </div>

              <TextArea label="Borrower & Business Assessment" value={form.borrowerAssessment} onChange={(v) => updateForm("borrowerAssessment", v)} />
              <TextArea label="Banking / Cash Flow Assessment" value={form.bankingAssessment} onChange={(v) => updateForm("bankingAssessment", v)} />
              <TextArea label="Property / Collateral Assessment" value={form.propertyAssessment} onChange={(v) => updateForm("propertyAssessment", v)} />
              <TextArea label="Risk, Mitigants & Conditions" value={form.riskMitigants} onChange={(v) => updateForm("riskMitigants", v)} />
              <TextArea label="Deviation Justification / Query Remarks" value={form.deviationJustification} onChange={(v) => updateForm("deviationJustification", v)} />
            </Panel>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <Panel
                title="Recommendation"
                subtitle="Required before submit to checker."
                icon={FaClipboardCheck}
              >
                <div className="space-y-4">
                  <Field label="Requested Amount" type="number" value={form.requestedAmount} onChange={(v) => updateForm("requestedAmount", v)} />
                  <Field label="Recommended Amount *" type="number" value={form.recommendedAmount} onChange={(v) => updateForm("recommendedAmount", v)} />
                  <Field label="Recommended Tenure Months *" type="number" value={form.recommendedTenure} onChange={(v) => updateForm("recommendedTenure", v)} />
                  <Field label="Recommended ROI % *" type="number" value={form.recommendedRoi} onChange={(v) => updateForm("recommendedRoi", v)} />

                  <SelectField
                    label="Maker Risk Grade *"
                    value={form.makerRiskGrade}
                    options={["A1", "A2", "A3", "B1", "B2", "C1", "C2", "High Risk"]}
                    onChange={(v) => updateForm("makerRiskGrade", v)}
                  />

                  <SelectField
                    label="Fraud Risk"
                    value={form.fraudRisk}
                    options={["Low", "Medium", "High"]}
                    onChange={(v) => updateForm("fraudRisk", v)}
                  />

                  <TextArea
                    label="Final Maker Remarks *"
                    rows={5}
                    value={form.makerRemarks}
                    onChange={(v) => updateForm("makerRemarks", v)}
                  />
                </div>
              </Panel>

              <Panel
                title="Conditions"
                subtitle="Capture disbursement and monitoring conditions."
                icon={FaShieldAlt}
              >
                <TextArea
                  label="Pre-disbursement Conditions"
                  rows={4}
                  value={form.preDisbursementConditions}
                  onChange={(v) => updateForm("preDisbursementConditions", v)}
                />

                <TextArea
                  label="Post-disbursement Conditions"
                  rows={4}
                  value={form.postDisbursementConditions}
                  onChange={(v) => updateForm("postDisbursementConditions", v)}
                />
              </Panel>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
                <div className="mb-2 flex items-center gap-2 text-sm font-black">
                  <FaExclamationTriangle />
                  Maker Control
                </div>
                Credit Maker can prepare assessment, raise query and submit to checker. Final approval must be done by Credit Checker.
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveDraft}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleRaiseQuery}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                >
                  Raise Query
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitToChecker}
                  className="rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#183d62] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitToCheckerMutation.isPending
                    ? "Submitting..."
                    : "Submit to Credit Checker"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ value }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      {value}
    </span>
  );
}

function ActionButton({ children, icon: Icon, variant, disabled, onClick }) {
  const classes =
    variant === "ghost"
      ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
      : "bg-white text-indigo-700 hover:bg-indigo-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon />
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-[#0f2942]">
            {title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </div>
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
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="relative mt-2">
        <select
          value={valueOrEmpty(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          <FaChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <div className="mt-4">
      <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <textarea
        rows={rows}
        value={valueOrEmpty(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}