import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const unwrapResponse = (response) => {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response ?? {};
};

const normalizePropertyCategory = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

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

  const escapedCategory = String(category).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  return propertyType
    .replace(new RegExp(`^${escapedCategory}\\s*-\\s*`, "i"), "")
    .trim();
};

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

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

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        {...props}
        className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:bg-white"
      />
    </div>
  );
}

export default function CreateLead() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [otpPopupOpen, setOtpPopupOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpMobile, setOtpMobile] = useState("");

  /* =========================================================
     EXISTING APPLICATION
  ========================================================= */

  const applicationQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => rmApi.getApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!applicationId || !applicationQuery.data) {
      return;
    }

    const response = unwrapResponse(applicationQuery.data);
    const application = response?.data ?? response;

    if (!application || typeof application !== "object") {
      return;
    }

    const categoryFromType = String(application.propertyType || "")
      .split(" - ")[0]
      .trim();

    const propertyCategory = normalizePropertyCategory(
      application.propertyCategory || categoryFromType,
    );

    const propertyType = normalizePropertyType(
      application.propertyType,
      propertyCategory,
    );

    setFormData({
      customerName: application.customerName || "",
      mobileNumber:
        application.mobile ||
        application.mobileNumber ||
        "",
      emailId:
        application.email ||
        application.emailId ||
        "",
      panNumber:
        application.pan ||
        application.panNumber ||
        "",
      aadhaarNumber: application.aadhaarNumber || "",
      occupation:
        application.occupationType ||
        application.occupation ||
        "SELF_EMPLOYED",
      businessName: application.businessName || "",
      monthlyIncome: application.monthlyIncome ?? "",
      monthlyObligations:
        application.monthlyObligations ?? "",
      requestedAmount: application.requestedAmount ?? "",
      requestedTenure: String(
        application.requestedTenure ||
          application.tenure ||
          120,
      ),
      propertyCategory,
      propertyType,
      propertyValue:
        application.marketValue ??
        application.propertyValue ??
        "",
      propertyAddress:
        application.propertyAddress || "",
      city:
        application.propertyCity ||
        application.city ||
        "",
      state:
        application.propertyState ||
        application.state ||
        "",
      pinCode:
        application.propertyPincode ||
        application.pinCode ||
        "",
    });
  }, [applicationId, applicationQuery.data]);

  /* =========================================================
     WORKFLOW
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
     CALCULATIONS
  ========================================================= */

  const calculated = useMemo(() => {
    const income = Number(formData.monthlyIncome || 0);
    const obligations = Number(
      formData.monthlyObligations || 0,
    );
    const requested = Number(
      formData.requestedAmount || 0,
    );
    const propertyValue = Number(
      formData.propertyValue || 0,
    );

    const foir =
      income > 0 ? (obligations / income) * 100 : 0;

    const ltv =
      propertyValue > 0
        ? (requested / propertyValue) * 100
        : 0;

    const roi = 10.5;
    const tenure = Number(
      formData.requestedTenure || 120,
    );
    const monthlyRate = roi / 12 / 100;

    const power = Math.pow(
      1 + monthlyRate,
      tenure,
    );

    const emi =
      requested > 0 && tenure > 0
        ? (requested * monthlyRate * power) /
          (power - 1)
        : 0;

    return {
      foir,
      ltv,
      roi,
      tenure,
      emi: Number.isFinite(emi) ? emi : 0,
    };
  }, [formData]);

  const propertyTypeOptions =
    PROPERTY_TYPE[formData.propertyCategory] || [];

  /* =========================================================
     PAYLOAD AND VALIDATION
  ========================================================= */

  const buildPayload = () => ({
    customerName: formData.customerName.trim(),
    mobile: formData.mobileNumber.trim(),
    email: formData.emailId.trim() || undefined,
    pan: formData.panNumber.trim() || undefined,
    aadhaarNumber:
      formData.aadhaarNumber.trim() || undefined,
    occupationType: formData.occupation,
    businessName:
      formData.businessName.trim() || undefined,
    monthlyIncome: formData.monthlyIncome
      ? Number(formData.monthlyIncome)
      : undefined,
    monthlyObligations:
      formData.monthlyObligations
        ? Number(formData.monthlyObligations)
        : undefined,
    requestedAmount: formData.requestedAmount
      ? Number(formData.requestedAmount)
      : undefined,
    requestedTenure: formData.requestedTenure
      ? Number(formData.requestedTenure)
      : undefined,
    propertyCategory: formData.propertyCategory,
    propertyType: formData.propertyType
      ? `${formData.propertyCategory} - ${formData.propertyType}`
      : undefined,
    marketValue: formData.propertyValue
      ? Number(formData.propertyValue)
      : undefined,
    propertyAddress:
      formData.propertyAddress.trim() || undefined,
    propertyCity: formData.city.trim() || undefined,
    propertyState:
      formData.state.trim() || undefined,
    propertyPincode:
      formData.pinCode.trim() || undefined,
    foir: Number(calculated.foir.toFixed(2)),
    emi: Number(calculated.emi.toFixed(2)),
    roi: calculated.roi,
    tenure: calculated.tenure,
  });

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      setMessageType("error");
      setMessage(
        "Customer / Entity Name is required.",
      );
      return false;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        formData.mobileNumber.trim(),
      )
    ) {
      setMessageType("error");
      setMessage(
        "Enter a valid 10-digit mobile number.",
      );
      return false;
    }

    if (!formData.requestedAmount) {
      setMessageType("error");
      setMessage(
        "Requested Loan Amount is required.",
      );
      return false;
    }

    if (
      !formData.propertyCategory ||
      !formData.propertyType
    ) {
      setMessageType("error");
      setMessage(
        "Property Category and Property Type are required.",
      );
      return false;
    }

    return true;
  };

  /* =========================================================
     OTP FLOW FOR NEW LEAD
  ========================================================= */

  const sendOtpMutation = useMutation({
    mutationFn: (mobile) =>
      rmApi.sendMobileOtp({ mobile }),

    onSuccess: () => {
      setOtpValue("");
      setOtpPopupOpen(true);
      setMessageType("success");
      setMessage(
        `OTP sent successfully to ${otpMobile}.`,
      );
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message || "Unable to send OTP.",
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ mobile, otp }) =>
      rmApi.verifyMobileOtp({
        mobile,
        otp,
      }),
  });

  const createDraftMutation = useMutation({
    mutationFn: (verificationToken) =>
      rmApi.saveDraft({
        ...buildPayload(),
        verificationToken,
      }),

    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;

      const newApplicationId =
        created?.id ||
        created?.applicationId ||
        created?.application?.id;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-dashboard"],
        }),
      ]);

      setOtpPopupOpen(false);
      setOtpValue("");
      setMessageType("success");
      setMessage(
        "Lead draft created successfully.",
      );

      if (newApplicationId) {
        navigate(
          `/applications/${newApplicationId}`,
          { replace: true },
        );
      } else {
        navigate("/my-leads", {
          replace: true,
        });
      }
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message ||
          "Unable to create lead draft.",
      );
    },
  });

  const handleSendOtp = () => {
    setMessage("");

    if (!validateForm()) {
      return;
    }

    const mobile =
      formData.mobileNumber.trim();

    setOtpMobile(mobile);
    sendOtpMutation.mutate(mobile);
  };

  const handleVerifyOtp = async () => {
    setMessage("");

    const otp = otpValue.trim();

    if (!otp) {
      setMessageType("error");
      setMessage("OTP is required.");
      return;
    }

    try {
      const verifyResponse =
        await verifyOtpMutation.mutateAsync({
          mobile: otpMobile,
          otp,
        });

      const result =
        unwrapResponse(verifyResponse);

      const verificationToken =
        result?.verificationToken ||
        result?.data?.verificationToken;

      if (!verificationToken) {
        throw new Error(
          "OTP verified, but verificationToken was not returned.",
        );
      }

      await createDraftMutation.mutateAsync(
        verificationToken,
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error?.message ||
          "OTP verification failed.",
      );
    }
  };

  /* =========================================================
     EXISTING DRAFT UPDATE AND SUBMISSION
  ========================================================= */

  const updateDraftMutation = useMutation({
    mutationFn: () =>
      rmApi.updateApplication(
        applicationId,
        buildPayload(),
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["application", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-dashboard"],
        }),
      ]);

      setMessageType("success");
      setMessage(
        "Draft updated successfully.",
      );
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message ||
          "Unable to update draft.",
      );
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: () =>
      rmApi.submitDraft(
        applicationId,
        buildPayload(),
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-dashboard"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "rm-workflow",
            applicationId,
          ],
        }),
      ]);

      navigate("/my-leads", {
        replace: true,
      });
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message ||
          "Unable to submit application.",
      );
    },
  });

  /* =========================================================
     EVENT HANDLERS
  ========================================================= */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCategoryChange = (event) => {
    const selectedCategory =
      event.target.value;

    setFormData((previous) => ({
      ...previous,
      propertyCategory: selectedCategory,
      propertyType:
        PROPERTY_TYPE[selectedCategory]?.[0] ||
        "",
    }));
  };

  const handleSaveDraft = (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    if (!applicationId) {
      handleSendOtp();
      return;
    }

    updateDraftMutation.mutate();
  };

  const handleSubmitForReview = () => {
    setMessage("");

    if (!applicationId) {
      setMessageType("error");
      setMessage(
        "Verify mobile OTP and create the draft before submitting it for review.",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    submitDraftMutation.mutate();
  };

  const isPending =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitDraftMutation.isPending;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form
      onSubmit={handleSaveDraft}
      className="min-h-screen space-y-6 bg-slate-50 p-6 text-slate-800 antialiased lg:p-8"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-violet-800 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {applicationId
                ? "Update Lead"
                : "Lead & Application Capture"}
            </h2>

            <p className="mt-1 text-xs text-blue-100/80">
              {!applicationId
                ? "Mobile OTP verification is required before creating a lead draft."
                : `Editing application ${applicationId}.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendOtpMutation.isPending
                ? "Sending OTP..."
                : createDraftMutation.isPending
                  ? "Creating..."
                  : updateDraftMutation.isPending
                    ? "Saving..."
                    : applicationId
                      ? "Save Draft"
                      : "Verify Mobile & Save Draft"}
            </button>

            <button
              type="button"
              disabled={
                isPending || !applicationId
              }
              onClick={handleSubmitForReview}
              className="rounded-xl bg-blue-950 px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitDraftMutation.isPending
                ? "Submitting..."
                : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>

      {applicationId && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              RM Workflow Journey
            </h3>

            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Active Track
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[800px] items-center justify-between">
              {leadJourney.map(
                (item, index) => {
                  const firstPendingIndex =
                    leadJourney.findIndex(
                      (step) =>
                        !step.completed,
                    );

                  const isCurrent =
                    !item.completed &&
                    index === firstPendingIndex;

                  return (
                    <div
                      key={item.key || item.label}
                      className="relative flex flex-1 flex-col items-center text-center"
                    >
                      {index !==
                        leadJourney.length -
                          1 && (
                        <div
                          className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${
                            leadJourney[
                              index + 1
                            ]?.completed
                              ? "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          item.completed
                            ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                            : isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : "bg-white text-slate-400 ring-2 ring-slate-200"
                        }`}
                      >
                        {item.completed ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : isCurrent ? (
                          "●"
                        ) : (
                          index + 1
                        )}
                      </div>

                      <p
                        className={`mt-2.5 px-2 text-xs font-semibold ${
                          item.completed ||
                          isCurrent
                            ? "text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {applicationQuery.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {applicationQuery.error?.message ||
            "Unable to load application details."}
        </div>
      )}

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-8 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm lg:p-8">
        <Section title="Customer Identification & Identity">
          <Field
            label="Customer / Entity Name *"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />

          <Field
            label="Mobile Number *"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            maxLength={10}
            inputMode="numeric"
            required
          />

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

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Occupation / Constitution
            </label>

            <select
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white"
            >
              <option value="SELF_EMPLOYED">
                Self employed
              </option>
              <option value="SALARIED">
                Salaried
              </option>
              <option value="BUSINESS">
                Business
              </option>
              <option value="PROFESSIONAL">
                Professional
              </option>
            </select>
          </div>

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
            value={
              formData.monthlyObligations
            }
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
            value={
              formData.requestedTenure
            }
            onChange={handleInputChange}
          />

          <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200/50 bg-slate-50 p-4 md:col-span-2">
            <div className="text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Indicative EMI
              </span>
              <span className="mt-1 block text-base font-extrabold text-blue-700">
                {formatCurrency(
                  calculated.emi,
                )}
              </span>
            </div>

            <div className="border-x border-slate-200 px-4 text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                FOIR Ratio
              </span>
              <span
                className={`mt-1 block text-base font-extrabold ${
                  calculated.foir > 50
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {calculated.foir.toFixed(
                  2,
                )}
                %
              </span>
            </div>

            <div className="text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated LTV
              </span>
              <span className="mt-1 block text-base font-extrabold text-slate-700">
                {calculated.ltv.toFixed(2)}
                %
              </span>
            </div>
          </div>
        </Section>

        <Section title="Collateral & Property Specifics">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Property Category
            </label>

            <select
              name="propertyCategory"
              value={
                formData.propertyCategory
              }
              onChange={
                handleCategoryChange
              }
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white"
            >
              {PROPERTY_CATEGORY.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Property Type
            </label>

            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white"
            >
              {propertyTypeOptions.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </div>

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
            value={
              formData.propertyAddress
            }
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

      {otpPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Verify Mobile OTP
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                OTP was sent to{" "}
                <strong>{otpMobile}</strong>.
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={(event) =>
                setOtpValue(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                )
              }
              placeholder="Enter OTP"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-blue-500 focus:bg-white"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={
                  verifyOtpMutation.isPending ||
                  createDraftMutation.isPending
                }
                onClick={() => {
                  setOtpPopupOpen(false);
                  setOtpValue("");
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !otpValue ||
                  verifyOtpMutation.isPending ||
                  createDraftMutation.isPending
                }
                onClick={handleVerifyOtp}
                className="flex-1 rounded-xl bg-blue-700 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyOtpMutation.isPending
                  ? "Verifying..."
                  : createDraftMutation.isPending
                    ? "Creating..."
                    : "Verify & Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
