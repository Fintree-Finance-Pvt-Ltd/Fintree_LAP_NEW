import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import {
  buildWorkflowTimeline,
  formatCurrency,
  PROPERTY_CATEGORY,
  PROPERTY_TYPE,
} from "../rmUtils.js";

const emptyForm = {
  customerName: "",
  mobileNumber: "",
  emailId: "",
  panNumber: "",
  aadhaarNumber: "",
  occupation: "SELF_EMPLOYED",
  businessName: "",
  monthlyIncome: "",
  monthlyObligations: "",
  requestedAmount: "",
  requestedTenure: "120",
  propertyCategory: "Residential",
  propertyType: PROPERTY_TYPE.Residential?.[0] || "Independent House",
  propertyValue: "",
  propertyAddress: "",
  city: "",
  state: "",
  pinCode: "",
};
const CONSENT_TEXT =
  "I hereby provide my consent to Fintree Finance Private Limited to verify my mobile number and process my information for the loan application.";
const unwrapResponse = (response) => {
  if (response?.data !== undefined) {
    return response.data;
  }
  return response ?? {};
};

const normalizePropertyCategory = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  const categories = {
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial",
    "land / plot": "Land / Plot",
    "land/plot": "Land / Plot",
    land: "Land / Plot",
    plot: "Land / Plot",
  };
  return categories[normalized] || "Residential";
};

const normalizePropertyType = (value, category) => {
  const propertyType = String(value || "").trim();
  if (!propertyType) {
    return PROPERTY_TYPE[category]?.[0] || "";
  }
  const escapedCategory = String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return propertyType.replace(new RegExp(`^${escapedCategory}\\s*-\\s*`, "i"), "").trim();
};

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6 transition-all hover:border-slate-300/60">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <span className="h-3.5 w-1 bg-blue-600 rounded-full" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          {...props}
          className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
        />
      )}
    </div>
  );
}

export default function CreateLead() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [formData, setFormData] = useState(
    location?.state?.formData ? { ...emptyForm, ...location.state.formData } : emptyForm,
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [otpPopup, setOtpPopup] = useState({
    open: false,
    title: "",
    body: "",
    severity: "info",
  });

  const [otpModal, setOtpModal] = useState({
    open: false,
    sentMobileMasked: "",
    resendAfterSeconds: 0,
    expiresInSeconds: 0,
  });

  const [otpCode, setOtpCode] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef([]);

  const [timer, setTimer] = useState({
    resendAfterSeconds: 0,
  });

  const otpLoadingRef = useRef(false);



  /* =========================================================
     NESTJS GET SINGLE APPLICATION
     NOTE: For new lead flow (/create-lead) we must NOT create or fetch an application.
     For /applications/:applicationId we will prefer location.state.formData and only fetch if missing.
  ========================================================= */
  const applicationQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => rmApi.getApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  const hasPrefilledFromState = Boolean(location?.state?.formData);

  useEffect(() => {
    if (!applicationId || !applicationQuery.data) return;
    if (hasPrefilledFromState) return;

    const response = unwrapResponse(applicationQuery.data);
    const application = response?.data ?? response;

    if (!application || typeof application !== "object") return;

    const categoryFromType = String(application.propertyType || "").split(" - ")[0].trim();
    const propertyCategory = normalizePropertyCategory(application.propertyCategory || categoryFromType);
    const propertyType = normalizePropertyType(application.propertyType, propertyCategory);

    setFormData({
      customerName: application.customerName || "",
      mobileNumber: application.mobile || application.mobileNumber || "",
      emailId: application.email || application.emailId || "",
      panNumber: application.pan || application.panNumber || "",
      aadhaarNumber: application.aadhaarNumber || "",
      occupation: application.occupationType || application.occupation || "SELF_EMPLOYED",
      businessName: application.businessName || "",
      monthlyIncome: application.monthlyIncome ?? "",
      monthlyObligations: application.monthlyObligations ?? "",
      requestedAmount: application.requestedAmount ?? "",
      requestedTenure: String(application.requestedTenure || application.tenure || 120),
      propertyCategory,
      propertyType,
      propertyValue: application.marketValue ?? application.propertyValue ?? "",
      propertyAddress: application.propertyAddress || "",
      city: application.propertyCity || application.city || "",
      state: application.propertyState || application.state || "",
      pinCode: application.propertyPincode || application.pinCode || "",
    });
  }, [applicationId, applicationQuery.data, hasPrefilledFromState]);

const sendOtpMutation = useMutation({
  mutationFn: () =>
    rmApi.sendOtp({
      mobile: formData.mobileNumber,
    }),

  onSuccess: (response) => {
    const result = unwrapResponse(response);

    setMessageType("success");
    setMessage(result.message || "OTP sent successfully.");

    setOtpPopup({
      open: true,
      title: "OTP Sent",
      body: result.message || "OTP sent successfully.",
      severity: "success",
    });
  },

  onError: (error) => {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to send OTP.";

    setMessageType("error");
    setMessage(msg);

    // If backend fails due to missing template configuration, show clearer popup.
    const friendly = String(msg).includes('MOBILE_OTP_TEMPLATE_ID')
      ? 'OTP provider is misconfigured on server (MOBILE_OTP_TEMPLATE_ID missing). Please contact admin.'
      : msg;

    setOtpPopup({
      open: true,
      title: "OTP Failed",
      body: friendly,
      severity: "error",
    });
  },
});


const handleSendOtp = () => {


  if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
    setMessageType("error");
    setMessage("Enter a valid mobile number.");
    return;
  }

  sendOtpMutation.mutate();
};

  const verifyOtpAndCreateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...buildPayload(false),
        mobile: formData.mobileNumber,
        otp: otpCode.join(""),
        consentText:
          "I authorize Fintree Finance Private Limited to verify my mobile number and process my information for the loan application.",
        // backend expects pan and requestedAmount, both are inside buildPayload
        pan: formData.panNumber,
      };

      return rmApi.verifyOtpAndCreate(payload);
    },
    onSuccess: async (res) => {
      const result = unwrapResponse(res);
      const created = result?.data ?? result;

      setMessageType("success");
      setMessage("✓ Lead created successfully");

      setOtpModal((p) => ({ ...p, open: false }));
      const newId = created?.applicationId ?? created?.application?.id ?? created?.id;
      const newNumber = created?.applicationNumber ?? created?.applicationNumber;

      if (newId) {
        navigate(`/applications/${newId}`, {
          replace: true,
          state: {
            formData,
            applicationNumber: newNumber,
          },
        });
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Invalid OTP";
      setOtpError(msg);
    },
  });

  /* =========================================================
     WORKFLOW TIMELINE STATUS
  ========================================================= */
  const workflowQuery = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: () => rmApi.workflowStatus(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  });

  const leadJourney = useMemo(() => {
    const response = unwrapResponse(workflowQuery.data);
    return buildWorkflowTimeline(response?.data ?? response ?? {});
  }, [workflowQuery.data]);

  /* =========================================================
     REAL-TIME INTERMEDIARY METRICS
  ========================================================= */
  const calculated = useMemo(() => {
    const income = Number(formData.monthlyIncome || 0);
    const obligations = Number(formData.monthlyObligations || 0);
    const requested = Number(formData.requestedAmount || 0);
    const propertyValue = Number(formData.propertyValue || 0);

    const foir = income > 0 ? (obligations / income) * 100 : 0;
    const ltv = propertyValue > 0 ? (requested / propertyValue) * 100 : 0;

    const roi = 10.5;
    const tenure = Number(formData.requestedTenure || 120);
    const monthlyRate = roi / 12 / 100;
    const power = Math.pow(1 + monthlyRate, tenure);
    const emi = requested > 0 && tenure > 0 ? (requested * monthlyRate * power) / (power - 1) : 0;

    return {
      foir,
      ltv,
      roi,
      tenure,
      emi: Number.isFinite(emi) ? emi : 0,
    };
  }, [formData]);

  const propertyTypeOptions = PROPERTY_TYPE[formData.propertyCategory] || [];

  /* =========================================================
     CLEAN PAYLOAD DATA COMPLIANCE MAPPING
  ========================================================= */
  const buildPayload = (isPatchUpdate = false) => {
    const basePayload = {
      customerName: formData.customerName.trim() || undefined,
      mobile: formData.mobileNumber.trim() || undefined,
      email: formData.emailId.trim() || undefined,
      pan: formData.panNumber.trim() || undefined,
      aadhaarNumber: formData.aadhaarNumber.trim() || undefined,
      occupationType: formData.occupation,
      businessName: formData.businessName.trim() || undefined,
      monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined,
      monthlyObligations: formData.monthlyObligations ? Number(formData.monthlyObligations) : undefined,
      requestedAmount: formData.requestedAmount ? String(formData.requestedAmount) : undefined,
      requestedTenure: formData.requestedTenure ? Number(formData.requestedTenure) : undefined,
      propertyCategory: formData.propertyCategory || undefined,
      propertyType: formData.propertyType ? `${formData.propertyCategory} - ${formData.propertyType}` : undefined,
      marketValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
      propertyAddress: formData.propertyAddress.trim() || undefined,
      propertyCity: formData.city.trim() || undefined,
      propertyState: formData.state.trim() || undefined,
      propertyPincode: formData.pinCode.trim() || undefined,
      foir: Number(calculated.foir.toFixed(2)),
      emi: Number(calculated.emi.toFixed(2)),
      roi: calculated.roi,
      tenure: calculated.tenure,
    };

    // If making a PATCH update to /applications/:id, filter out properties your UpdateApplicationDto blocks
    if (isPatchUpdate) {
      const allowedPatchFields = ["customerName", "mobile", "pan", "requestedAmount", "monthlyIncome", "businessName"];
      const filteredPayload = {};
      allowedPatchFields.forEach((field) => {
        if (basePayload[field] !== undefined) {
          filteredPayload[field] = basePayload[field];
        }
      });
      return filteredPayload;
    }

    return basePayload;
  };

  const validateFullSubmission = () => {
    const errors = [];

    if (!formData.customerName.trim()) errors.push("customerName is required");

    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) errors.push("mobile is required");

    if (!formData.panNumber.trim()) errors.push("pan is required");

    if (!formData.aadhaarNumber.trim()) errors.push("aadhaarNumber is required");

    if (!formData.requestedAmount) errors.push("requestedAmount is required");

    if (!formData.occupation) errors.push("occupationType is required");

    if (formData.monthlyIncome === "" || formData.monthlyIncome === null || formData.monthlyIncome === undefined) {
      errors.push("monthlyIncome is required");
    }

    if (!formData.propertyType?.trim()) errors.push("propertyType is required");
    if (!formData.propertyValue) errors.push("marketValue is required");

    if (!formData.propertyAddress.trim()) errors.push("propertyAddress is required");
    if (!formData.city.trim()) errors.push("propertyCity is required");
    if (!formData.state.trim()) errors.push("propertyState is required");
    if (!formData.pinCode.trim()) errors.push("propertyPincode is required");

    if (errors.length) {
      setMessageType("error");
      setMessage(errors.join(", "));
      return false;
    }

    return true;
  };

  /* =========================================================
     API MUTATIONS (SYNCHRONIZED WITH YOUR NESTJS ENDPOINTS)
  ========================================================= */
  
  // POST /applications/draft -> For brand new entries
  const saveNewDraftMutation = useMutation({
    mutationFn: () => rmApi.saveDraft(buildPayload(false)),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;
      const newApplicationId = created?.id || created?.applicationId || created?.application?.id;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);

      setMessageType("success");
      setMessage("Draft entry written and saved directly into the database.");
      if (newApplicationId) {
        navigate(`/applications/${newApplicationId}`, { replace: true });
      } else {
        navigate("/my-leads", { replace: true });
      }
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "Failed running quick draft sync operation.");
    },
  });

  // PATCH /applications/:applicationId -> Automatically sanitizes fields to clear whitelist validation blocks
  const updateDraftMutation = useMutation({
    mutationFn: () => rmApi.updateApplication(applicationId, buildPayload(true)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["application", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);
      setMessageType("success");
      setMessage("Draft modified successfully directly in your system table.");
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "Failed executing partial draft mutation update.");
    },
  });

  // POST /applications/submit-draft -> Final processing verification
  const submitDraftMutation = useMutation({
    mutationFn: () => rmApi.submitDraft({ ...buildPayload(false), applicationId: Number(applicationId) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-workflow", applicationId] }),
      ]);
      navigate("/my-leads", { replace: true });
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "NestJS complete validation returned structured schema exceptions.");
    },
  });

  /* =========================================================
     EVENT HANDLERS
  ========================================================= */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCategoryChange = (event) => {
    const selectedCategory = event.target.value;
    setFormData((previous) => ({
      ...previous,
      propertyCategory: selectedCategory,
      propertyType: PROPERTY_TYPE[selectedCategory]?.[0] || "",
    }));
  };

  const handleSaveDraft = (event) => {
    if (event) event.preventDefault();
    setMessage("");

    if (!applicationId) {
      saveNewDraftMutation.mutate();
    } else {
      updateDraftMutation.mutate();
    }
  };

  const handleSubmitForReview = () => {
    setMessage("");

    if (!applicationId) {
      setMessageType("error");
      setMessage("Please execute a 'Save Draft' sequence before invoking workflow evaluations.");
      return;
    }
    if (!validateFullSubmission()) return;

    submitDraftMutation.mutate();
  };

  const isPending =
    saveNewDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitDraftMutation.isPending;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased p-6 md:p-8 space-y-6">
      
      {/* Upper Layout Header Control Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {applicationId ? "Modify Lead Workspace" : "Create Lead"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronizes active input attributes safely with your NestJS backend data tables.
          </p>
        </div>

        {/* Global Action Management Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveDraft}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveNewDraftMutation.isPending || updateDraftMutation.isPending
              ? "Persisting Changes..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={isPending || !applicationId}
            onClick={handleSubmitForReview}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            {submitDraftMutation.isPending ? "Submitting Work..." : "Submit for Review"}
          </button>
        </div>
      </div>

      {/* Workflow Tracker Layer */}
      {applicationId && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              RM Workflow Journey
            </h3>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Active Track
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[800px] items-center justify-between">
              {leadJourney.map((item, index) => {
                const firstPendingIndex = leadJourney.findIndex((step) => !step.completed);
                const isCurrent = !item.completed && index === firstPendingIndex;

                return (
                  <div key={item.key || item.label} className="relative flex flex-1 flex-col items-center text-center">
                    {index !== leadJourney.length - 1 && (
                      <div
                        className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${
                          leadJourney[index + 1]?.completed ? "bg-emerald-500" : "bg-slate-100"
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        item.completed
                          ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                          : isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-50"
                          : "bg-white text-slate-300 ring-2 ring-slate-100"
                      }`}
                    >
                      {item.completed ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        "●"
                      ) : (
                        index + 1
                      )}
                    </div>

                    <p className={`mt-2 px-2 text-xs font-medium ${item.completed || isCurrent ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModal.open && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOtpModal((p) => ({ ...p, open: false }))}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0b1329] to-[#0f3d66] px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-bold">Mobile Verification</h3>
                <button
                  type="button"
                  onClick={() => setOtpModal((p) => ({ ...p, open: false }))}
                  className="rounded-md border border-white/30 bg-white/10 px-2 py-1 text-sm font-bold text-white"
                  aria-label="Close OTP modal"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/80 text-xs mt-1">
                OTP sent to {otpModal.sentMobileMasked || formData.mobileNumber}
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-3">
                <div className="text-slate-700 text-xs font-semibold">
                  Enter the 6-digit OTP to verify your mobile number.
                </div>

                <div className="flex flex-wrap gap-2 justify-start">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode[idx]}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        if (raw.length === 0) {
                          setOtpCode((prev) => {
                            const next = [...prev];
                            next[idx] = "";
                            return next;
                          });
                          return;
                        }

                        const digits = raw.slice(-1);
                        setOtpCode((prev) => {
                          const next = [...prev];
                          next[idx] = digits;
                          return next;
                        });

                        const nextIndex = Math.min(idx + 1, 5);
                        otpInputRefs.current[nextIndex]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          if (!otpCode[idx]) {
                            const prevIndex = Math.max(idx - 1, 0);
                            otpInputRefs.current[prevIndex]?.focus();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
                        if (!pasted) return;
                        e.preventDefault();
                        const code = pasted.slice(0, 6).padEnd(6, " ").split("").slice(0, 6).map((c) => (c === " " ? "" : c));
                        setOtpCode(code);
                        otpInputRefs.current[5]?.focus();
                      }}
                      className="w-11 h-12 rounded-xl border border-slate-200 bg-slate-50/40 text-center text-lg font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
                      aria-label={`OTP digit ${idx + 1}`}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="text-xs font-semibold text-rose-600">
                    {otpError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    {timer.resendAfterSeconds > 0
                      ? `Resend OTP in ${timer.resendAfterSeconds}s`
                      : "Didn't receive?"}
                  </div>

                  <button
                    type="button"
                    disabled={timer.resendAfterSeconds > 0}
                    onClick={() => {
                      if (timer.resendAfterSeconds > 0) return;
                      setOtpError("");
                      sendOtpMutation.mutate();
                    }}
                    className="text-xs font-bold text-[#0f3d66] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOtpModal((p) => ({ ...p, open: false }))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyOtpAndCreateMutation.isPending}
                  onClick={() => {
                    setOtpError("");
                    const joined = otpCode.join("");
                    if (!/^\d{6}$/.test(joined)) {
                      setOtpError("Enter a valid 6-digit OTP.");
                      return;
                    }
                    verifyOtpAndCreateMutation.mutate(joined);
                  }}
                  className="rounded-xl bg-[#0f3d66] hover:bg-[#0b1329] px-5 py-2 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyOtpAndCreateMutation.isPending ? "Verifying..." : "Verify OTP"}
                </button>
              </div>

              <div className="mt-4 text-[11px] text-slate-500">
                By verifying, you authorize Fintree Finance to process your application.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy OTP popup (errors only) */}
      {otpPopup.open && !otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
          />
          <div className="relative w-full mx-4 max-w-lg rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-base font-bold text-slate-800">{otpPopup.title}</h3>
              <button
                type="button"
                onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm font-bold text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4">
              <div
                className={`rounded-xl border p-4 text-sm font-semibold ${
                  otpPopup.severity === "success"
                    ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
                    : "border-rose-100 bg-rose-50/50 text-rose-700"
                }`}
              >
                {otpPopup.body}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
                  className="rounded-md bg-[#0f3d66] px-4 py-2 text-sm font-bold text-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Operational Response Message Alerts */}
      {message && (
        <div className={`rounded-xl border p-4 text-xs font-semibold ${
          messageType === "success" ? "border-emerald-100 bg-emerald-50/50 text-emerald-600" : "border-rose-100 bg-rose-50/50 text-rose-600"
        }`}>
          {message}
        </div>
      )}

      {/* Core Input Form Workspaces */}
      <div className="space-y-6">

        <Section title="Customer Identification & Identity">
          <Field
            label="Customer / Entity Name *"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mobile Number *
            </label>
            <div className="flex gap-2">
              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                maxLength={10}
                inputMode="numeric"
                required
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
              />
<button
  type="button"
  onClick={handleSendOtp}
  disabled={sendOtpMutation.isPending}
  className="rounded-xl bg-[#0b1329] hover:bg-slate-800 px-5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98]"
>
  {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
</button>
            </div>
          </div>

          <Field
            label="Email ID"
            name="emailId"
            type="email"
            value={formData.emailId}
            onChange={handleInputChange}
          />

          <Field
            label="PAN Number"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleInputChange}
            maxLength={10}
          />

          <Field
            label="Aadhaar Number"
            name="aadhaarNumber"
            value={formData.aadhaarNumber}
            onChange={handleInputChange}
            maxLength={12}
            inputMode="numeric"
          />

          <Field label="Occupation / Constitution">
            <select
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
            >
              <option value="SELF_EMPLOYED">Self employed</option>
              <option value="SALARIED">Salaried</option>
              <option value="BUSINESS">Business</option>
              <option value="PROFESSIONAL">Professional</option>
            </select>
          </Field>

          <Field
            label="Employer / Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
          />
        </Section>

        <Section title="Financial Profiles & Request Framework">
          <Field
            label="Verified Monthly Income"
            name="monthlyIncome"
            type="number"
            min="0"
            value={formData.monthlyIncome}
            onChange={handleInputChange}
          />

          <Field
            label="Existing Monthly Obligations"
            name="monthlyObligations"
            type="number"
            min="0"
            value={formData.monthlyObligations}
            onChange={handleInputChange}
          />

          <Field
            label="Requested Loan Amount *"
            name="requestedAmount"
            type="number"
            min="0"
            value={formData.requestedAmount}
            onChange={handleInputChange}
            required
          />

          <Field
            label="Requested Tenure (months)"
            name="requestedTenure"
            type="number"
            min="1"
            value={formData.requestedTenure}
            onChange={handleInputChange}
          />

          <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-xl border border-slate-200 p-4 md:col-span-2 shadow-inner">
            <div className="flex flex-col justify-center px-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Indicative EMI</span>
              <span className="mt-1 text-sm md:text-base font-extrabold text-blue-600 tracking-tight">
                {formatCurrency(calculated.emi)}
              </span>
            </div>
            <div className="flex flex-col justify-center border-x border-slate-200 px-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">FOIR Ratio</span>
              <span className={`mt-1 text-sm md:text-base font-extrabold tracking-tight ${calculated.foir > 50 ? "text-amber-600" : "text-emerald-600"}`}>
                {calculated.foir.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col justify-center px-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Estimated LTV</span>
              <span className="mt-1 text-sm md:text-base font-extrabold text-slate-700 tracking-tight">
                {calculated.ltv.toFixed(2)}%
              </span>
            </div>
          </div>
        </Section>

        <Section title="Collateral & Property Specifics">
          <Field label="Property Category">
            <select
              name="propertyCategory"
              value={formData.propertyCategory}
              onChange={handleCategoryChange}
              className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
            >
              {PROPERTY_CATEGORY.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field label="Property Type">
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50"
            >
              {propertyTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Approximate Property Value"
            name="propertyValue"
            type="number"
            min="0"
            value={formData.propertyValue}
            onChange={handleInputChange}
          />

          <Field
            label="Property Address"
            name="propertyAddress"
            value={formData.propertyAddress}
            onChange={handleInputChange}
          />

          <Field
            label="City"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
          />

          <Field
            label="State"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
          />

          <Field
            label="PIN Code"
            name="pinCode"
            value={formData.pinCode}
            onChange={handleInputChange}
            maxLength={6}
            inputMode="numeric"
          />
        </Section>
      </div>
    </div>
  );
}