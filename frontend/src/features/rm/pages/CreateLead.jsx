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

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

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
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1.5 bg-blue-600 rounded-full" />
          <h3 className="text-sm font-bold tracking-wide text-slate-900">
            {title}
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          {...props}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState(null);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [formData, setFormData] = useState(
    location?.state?.formData ? { ...emptyForm, ...location.state.formData } : emptyForm,
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [emailOtpCode, setEmailOtpCode] = useState(
  Array(6).fill(""),
);

const [emailOtpError, setEmailOtpError] = useState("");

const emailOtpInputRefs = useRef([]);

const [emailOtpModal, setEmailOtpModal] = useState({
  open: false,
  sentEmailMasked: "",
  resendAfterSeconds: 0,
  expiresInSeconds: 0,
});

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpSessionId, setEmailOtpSessionId] = useState(null);
  const [panVerified, setPanVerified] = useState(false);
  const [panFile, setPanFile] = useState(null);
  const [panOcrData, setPanOcrData] = useState(null);
  const [panOcrError, setPanOcrError] = useState("");
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
    setPanVerified(
      toBoolean(application.panVerified) ||
        toBoolean(application.customerProfile?.panVerified),
    );
  }, [applicationId, applicationQuery.data, hasPrefilledFromState]);
useEffect(() => {
  if (
    !emailOtpModal.open ||
    emailOtpModal.resendAfterSeconds <= 0
  ) {
    return;
  }

  const interval = window.setInterval(() => {
    setEmailOtpModal((previous) => ({
      ...previous,
      resendAfterSeconds: Math.max(
        previous.resendAfterSeconds - 1,
        0,
      ),
    }));
  }, 1000);

  return () => {
    window.clearInterval(interval);
  };
}, [
  emailOtpModal.open,
  emailOtpModal.resendAfterSeconds,
]);
  const sendOtpMutation = useMutation({
    mutationFn: () =>
      rmApi.sendOtp({
        mobile: formData.mobileNumber,
      }),
    onSuccess: (response) => {
      const result = unwrapResponse(response);
      setMessageType("success");
      setMessage(result.message || "OTP sent successfully.");

      setOtpModal({
        open: true,
        sentMobileMasked: formData.mobileNumber ? `XXXXXX${formData.mobileNumber.slice(-4)}` : "",
        resendAfterSeconds: 30,
        expiresInSeconds: 300,
      });
      setOtpCode(Array(6).fill(""));
      setOtpError("");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Failed to send OTP.";
      setMessageType("error");
      setMessage(msg);

      const friendly = String(msg).includes('MOBILE_OTP_TEMPLATE_ID')
        ? 'OTP provider is misconfigured on server. Please contact admin.'
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
    if (otpVerified) return;
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
        customerName: formData.customerName,
        mobile: formData.mobileNumber,
        otp: otpCode.join(""),
        consentText: consentAccepted ? CONSENT_TEXT : "",
      };
      return rmApi.verifyOtpAndCreate(payload);
    },
    onSuccess: async (res) => {
      const result = unwrapResponse(res);
      const created = result?.data ?? result;

      setMessageType("success");
      setMessage("✓ Lead created successfully");

      setOtpModal((p) => ({ ...p, open: false }));
      setConsentAccepted(false);
      setOtpCode(Array(6).fill(""));
      setOtpError("");

      const newId = created?.applicationId ?? created?.application?.id ?? created?.id;
      const newNumber = created?.applicationNumber;

      if (newId) {
        setCreatedApplicationId(newId);
        setApplicationNumber(newNumber || "");
        setOtpVerified(true);
        setMessageType("success");
        setMessage("✓ Mobile verified successfully.");
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Invalid OTP";
      setOtpError(msg);
    },
  });

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

    if (isPatchUpdate) {
      const allowedPatchFields = [
        "customerName",
        "mobile",
        "email",
        "pan",
        "aadhaarNumber",
        "occupationType",
        "businessName",
        "monthlyIncome",
        "monthlyObligations",
        "requestedAmount",
        "requestedTenure",
        "propertyCategory",
        "propertyType",
        "marketValue",
        "propertyAddress",
        "propertyCity",
        "propertyState",
        "propertyPincode",
        "foir",
        "emi",
        "roi",
        "tenure",
      ];
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
    if (!formData.customerName.trim()) errors.push("Customer Name is required");
    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) errors.push("Valid Mobile number is required");
    if (!formData.panNumber.trim()) errors.push("PAN Number is required");
    if (!formData.aadhaarNumber.trim()) errors.push("Aadhaar Number is required");
    if (!formData.requestedAmount) errors.push("Requested Amount is required");
    if (!formData.occupation) errors.push("Occupation is required");
    if (formData.monthlyIncome === "" || formData.monthlyIncome === undefined) errors.push("Monthly Income is required");
    if (!formData.propertyType?.trim()) errors.push("Property Type is required");
    if (!formData.propertyValue) errors.push("Property Value is required");
    if (!formData.propertyAddress.trim()) errors.push("Property Address is required");
    if (!formData.city.trim()) errors.push("City is required");
    if (!formData.state.trim()) errors.push("State is required");
    if (!formData.pinCode.trim()) errors.push("PIN Code is required");

    if (errors.length) {
      setMessageType("error");
      setMessage(errors.join(", "));
      return false;
    }
    return true;
  };

  const saveNewDraftMutation = useMutation({
    mutationFn: () => {
      // If OTP already created an application, update that created one.
      if (createdApplicationId != null) {
        return rmApi.updateApplication(createdApplicationId, buildPayload(true));
      }

      // Otherwise, create initial draft via POST /applications/draft.
      return rmApi.saveDraft(buildPayload(false));
    },
    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;
      const newApplicationId = created?.id || created?.applicationId || created?.application?.id;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);

      setMessageType("success");
      setMessage("Draft entry saved successfully.");
      if (newApplicationId) {
        navigate(`/create-lead/${newApplicationId}`, { replace: true });
      } else {
        navigate("/my-leads", { replace: true });
      }
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "Failed running quick draft sync operation.");
    },
  });

  const updateDraftMutation = useMutation({
    mutationFn: () =>
      rmApi.updateApplication(
        createdApplicationId ?? applicationId,
        buildPayload(true),
      ),
    onSuccess: async () => {
      const idToInvalidate = createdApplicationId ?? applicationId;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["application", idToInvalidate] }),
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);
      setMessageType("success");
      setMessage("Draft modified successfully.");
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "Failed executing partial draft update.");
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: () =>
      rmApi.submitDraft(
        Number(createdApplicationId ?? applicationId),
        buildPayload(false),
      ),
    onSuccess: async () => {
      const idToInvalidate = createdApplicationId ?? applicationId;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-workflow", idToInvalidate] }),
      ]);
      setMessageType("success");
      setMessage("✓ Submitted successfully.");
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(error?.message || "Submission returned structured validation exceptions.");
    },
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "panNumber" ? value.toUpperCase() : value;

    if (name === "panNumber") {
      setPanVerified(false);
    }

    setFormData((previous) => ({ ...previous, [name]: nextValue }));
  };

  const readPanOcrValue = (source, keys) => {
    if (!source || typeof source !== "object") return "";

    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }

    for (const value of Object.values(source)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const nestedValue = readPanOcrValue(item, keys);
          if (nestedValue) return nestedValue;
        }
      } else if (value && typeof value === "object") {
        const nestedValue = readPanOcrValue(value, keys);
        if (nestedValue) return nestedValue;
      }
    }

    return "";
  };

  const panOcrMutation = useMutation({
    mutationFn: async () => {
      if (!panFile) {
        throw new Error("Please upload PAN image or PDF.");
      }

      const payload = new FormData();
      payload.append("imageUrl", panFile);
      const clientRefId = createdApplicationId ?? applicationId ?? `PAN-${Date.now()}`;
      payload.append("clientRefId", String(clientRefId));

      return rmApi.panOcr(payload);
    },
    onSuccess: (response) => {
      const result = unwrapResponse(response);
      const data = result?.data ?? result;

      const extracted = data ?? {};
      const extractedPan = readPanOcrValue(extracted, [
        "panNumber",
        "pan",
        "pan_number",
        "idNumber",
        "documentNumber",
      ]);

      const extractedName = readPanOcrValue(extracted, [
        "name",
        "fullName",
        "customerName",
        "applicantName",
        "nameOnPan",
        "fatherName",
      ]);

      const nextPan = String(extractedPan || "").trim().toUpperCase();
      const nextName = String(extractedName || "").trim();

      if (!nextPan && !nextName) {
        setPanOcrData(extracted);
        setPanOcrError("PAN OCR completed, but no PAN number or name was found.");
        setMessageType("error");
        setMessage("PAN OCR completed, but no PAN number or name was found.");
        return;
      }

      setFormData((previous) => ({
        ...previous,
        panNumber: nextPan || previous.panNumber,
        customerName: nextName || previous.customerName,
      }));
      setPanVerified(false);
      setPanOcrData(extracted);
      setPanOcrError("");
      setMessageType("success");
      setMessage("PAN details extracted successfully. Please verify PAN.");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to extract details from PAN document.";

      setPanOcrError(Array.isArray(message) ? message.join(", ") : message);
      setMessageType("error");
      setMessage(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const verifyPanMutation = useMutation({
    mutationFn: () =>
      rmApi.verifyPan({
        panNumber: formData.panNumber.trim().toUpperCase(),
        name: formData.customerName.trim().toUpperCase(),
        applicationId: Number(createdApplicationId ?? applicationId),
      }),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);

      setPanVerified(true);
      setMessageType("success");
      setMessage(result?.message || "PAN verified successfully.");
    },
    onError: (error) => {
      setPanVerified(false);
      setMessageType("error");
      setMessage(error?.message || "Unable to verify PAN.");
    },
  });

  const handleVerifyPan = () => {
    const panNumber = formData.panNumber.trim().toUpperCase();
    const customerName = formData.customerName.trim();

    setMessage("");

    if (!customerName) {
      setMessageType("error");
      setMessage("Enter Customer / Entity Name before PAN verification.");
      return;
    }

    if (!panNumber) {
      setMessageType("error");
      setMessage("Enter PAN number before verification.");
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
      setMessageType("error");
      setMessage("Enter a valid PAN number.");
      return;
    }

    if (!(createdApplicationId ?? applicationId)) {
      setMessageType("error");
      setMessage("Save the lead before PAN verification so verification can be stored.");
      return;
    }

    verifyPanMutation.mutate();
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

    if (createdApplicationId) {
      updateDraftMutation.mutate();
      return;
    }

    if (!applicationId) {
      saveNewDraftMutation.mutate();
    } else {
      updateDraftMutation.mutate();
    }
  };

  const handleVerifyOtpSubmit = () => {
    setOtpError("");
    if (!consentAccepted) {
      setOtpError("Please read and accept the consent before continuing.");
      return;
    }
    const joined = otpCode.join("");
    if (!/^\d{6}$/.test(joined)) {
      setOtpError("Enter a valid 6-digit OTP configuration.");
      return;
    }
    verifyOtpAndCreateMutation.mutate();
  };

  const handleSubmitForReview = () => {
    setMessage("");
    const idToSubmit = createdApplicationId ?? applicationId;

    if (!idToSubmit) {
      setMessageType("error");
      setMessage("Please execute a 'Save Draft' sequence before invoking workflow evaluations.");
      return;
    }
    if (!validateFullSubmission()) return;
    submitDraftMutation.mutate();
  };

  //email
const sendEmailOtpMutation = useMutation({
  mutationFn: (payload) =>
    rmApi.sendEmailOtp(payload),

  onSuccess: (response) => {
    const result = unwrapResponse(response);
    const data = result?.data ?? result;

    const sessionId = data?.sessionId;

    if (!sessionId) {
      setMessageType("error");
      setMessage(
        "OTP session ID was not returned by the server.",
      );
      return;
    }

    const email = String(
      formData.emailId || "",
    ).trim();

    const [emailName, emailDomain] =
      email.split("@");

    const maskedEmail =
      emailName && emailDomain
        ? `${emailName.slice(0, 2)}${"*".repeat(
            Math.max(emailName.length - 2, 3),
          )}@${emailDomain}`
        : email;

    setEmailOtpSessionId(sessionId);
    setEmailOtpSent(true);
    setEmailOtpVerified(false);
    setEmailOtpCode(Array(6).fill(""));
    setEmailOtpError("");

    setEmailOtpModal({
      open: true,
      sentEmailMasked: maskedEmail,
      resendAfterSeconds: 30,
      expiresInSeconds:
        data?.expiresInSeconds ?? 300,
    });

    setMessageType("success");
    setMessage(
      result?.message ||
        "OTP sent successfully to email.",
    );

    window.setTimeout(() => {
      emailOtpInputRefs.current[0]?.focus();
    }, 100);
  },

  onError: (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to send email OTP.";

    setMessageType("error");
    setMessage(
      Array.isArray(message)
        ? message.join(", ")
        : message,
    );
  },
});

const verifyEmailOtpMutation = useMutation({
  mutationFn: (payload) =>
    rmApi.verifyEmailOtp(payload),

  onSuccess: (response) => {
    const result = unwrapResponse(response);
    const data = result?.data ?? result;

    setEmailOtpVerified(true);
    setEmailOtpSent(false);
    setEmailOtpError("");
    setEmailOtpCode(Array(6).fill(""));

    setEmailOtpModal((previous) => ({
      ...previous,
      open: false,
    }));

    if (data?.applicationNumber) {
      setApplicationNumber(
        data.applicationNumber,
      );
    }

    setMessageType("success");
    setMessage(
      result?.message ||
        "Email verified successfully.",
    );
  },

  onError: (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Email OTP verification failed.";

    setEmailOtpError(
      Array.isArray(message)
        ? message.join(", ")
        : message,
    );
  },
});


const handleVerifyEmailOtp = () => {
  const email = String(
    formData.emailId || "",
  )
    .trim()
    .toLowerCase();

  const otp = emailOtpCode.join("");

  setEmailOtpError("");

  if (!emailOtpSessionId) {
    setEmailOtpError(
      "OTP session not found. Please resend OTP.",
    );
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    setEmailOtpError(
      "Please enter a valid 6-digit OTP.",
    );
    return;
  }

  const currentApplicationId =
    createdApplicationId ?? applicationId;

  verifyEmailOtpMutation.mutate({
    email,
    otp,
    sessionId: emailOtpSessionId,
    applicationId: currentApplicationId
      ? Number(currentApplicationId)
      : undefined,
  });
};




const handleEmailChange = (event) => {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]: value,
  }));

  setEmailOtpCode(Array(6).fill(""));
  setEmailOtpSent(false);
  setEmailOtpVerified(false);
  setEmailOtpSessionId(null);
  setEmailOtpError("");

  setEmailOtpModal({
    open: false,
    sentEmailMasked: "",
    resendAfterSeconds: 0,
    expiresInSeconds: 0,
  });
};

const handleSendEmailOtp = () => {
  const email = String(
    formData.emailId || "",
  )
    .trim()
    .toLowerCase();

  if (!email) {
    setMessageType("error");
    setMessage("Please enter email ID.");
    return;
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setMessageType("error");
    setMessage(
      "Please enter a valid email ID.",
    );
    return;
  }

  const currentApplicationId =
    createdApplicationId ?? applicationId;

  sendEmailOtpMutation.mutate({
    email,
    applicationId: currentApplicationId
      ? Number(currentApplicationId)
      : undefined,
  });
};




  
  const isPending =
    saveNewDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitDraftMutation.isPending ||
    panOcrMutation.isPending ||
    verifyPanMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Top Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {applicationId ? "Modify Lead Workspace" : "New Loan Application"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in information parameters to initiate property loan underwriting creation rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveDraft}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveNewDraftMutation.isPending || updateDraftMutation.isPending ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={isPending || !applicationId}
            onClick={handleSubmitForReview}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {submitDraftMutation.isPending ? "Submitting..." : "Submit for Underwriting"}
          </button>
        </div>
      </div>

      {/* Workflow Timeline Status Tracker */}
      {applicationId && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Application Workflow Journey
            </h3>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Live Stage
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
                        className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${leadJourney[index + 1]?.completed ? "bg-emerald-500" : "bg-slate-100"
                          }`}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${item.completed
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

      {/* Redesigned Clean OTP Verification Modal */}
      {otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setOtpModal((p) => ({ ...p, open: false }))}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden border border-slate-200">
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">Verify Mobile Number</h3>
              <p className="text-slate-500 text-xs mt-1">
                An OTP has been sent to your registered device ending in <span className="font-semibold text-slate-700">{otpModal.sentMobileMasked || formData.mobileNumber.slice(-4)}</span>.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-2 justify-between">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
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
                      if (e.key === "Backspace" && !otpCode[idx]) {
                        const prevIndex = Math.max(idx - 1, 0);
                        otpInputRefs.current[prevIndex]?.focus();
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
                    className="w-12 h-12 rounded-lg border border-slate-300 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {otpError && (
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {otpError}
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-4">
                <span className="text-slate-500">
                  {timer.resendAfterSeconds > 0 ? `Resend in ${timer.resendAfterSeconds}s` : "Didn't get the code?"}
                </span>

                <button
                  type="button"
                  disabled={otpVerified || timer.resendAfterSeconds > 0}
                  onClick={() => {
                    if (otpVerified) return;
                    setOtpError("");
                    sendOtpMutation.mutate();
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {otpVerified ? "Verified" : "Resend OTP"}
                </button>
              </div>

              {/* Consent Block Integrated Fluidly inside the form container */}
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Customer Consent Note
                </h4>
                <div className="text-xs text-slate-600 leading-relaxed mb-3">
                  {CONSENT_TEXT}
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    I have read and agree to proceed with mobile verification.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOtpModal((p) => ({ ...p, open: false }))}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyOtpAndCreateMutation.isPending || !consentAccepted}
                  onClick={handleVerifyOtpSubmit}
                  className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-800 py-2.5 text-sm font-semibold text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyOtpAndCreateMutation.isPending ? "Verifying..." : "Verify & Authorize"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Server Errors Alert Popup Container */}
      {otpPopup.open && !otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setOtpPopup((p) => ({ ...p, open: false }))} />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{otpPopup.title}</h3>
              <button
                type="button"
                onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className={`rounded-lg border p-4 text-sm ${otpPopup.severity === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>
              {otpPopup.body}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {emailOtpModal.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
      onClick={() =>
        setEmailOtpModal((previous) => ({
          ...previous,
          open: false,
        }))
      }
      aria-hidden="true"
    />

    <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">
          Verify Email Address
        </h3>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          An OTP has been sent to{" "}
          <span className="font-bold text-slate-700">
            {emailOtpModal.sentEmailMasked}
          </span>
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex justify-between gap-2">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <input
                key={index}
                ref={(element) => {
                  emailOtpInputRefs.current[index] =
                    element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={emailOtpCode[index]}
                onChange={(event) => {
                  const rawValue =
                    event.target.value.replace(
                      /\D/g,
                      "",
                    );

                  if (!rawValue) {
                    setEmailOtpCode(
                      (previous) => {
                        const updated = [
                          ...previous,
                        ];

                        updated[index] = "";

                        return updated;
                      },
                    );

                    return;
                  }

                  const digit =
                    rawValue.slice(-1);

                  setEmailOtpCode(
                    (previous) => {
                      const updated = [
                        ...previous,
                      ];

                      updated[index] = digit;

                      return updated;
                    },
                  );

                  if (index < 5) {
                    emailOtpInputRefs.current[
                      index + 1
                    ]?.focus();
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    !emailOtpCode[index] &&
                    index > 0
                  ) {
                    emailOtpInputRefs.current[
                      index - 1
                    ]?.focus();
                  }
                }}
                onPaste={(event) => {
                  const pastedValue =
                    event.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  if (!pastedValue) {
                    return;
                  }

                  event.preventDefault();

                  const updatedCode =
                    Array(6).fill("");

                  pastedValue
                    .split("")
                    .forEach(
                      (digit, digitIndex) => {
                        updatedCode[digitIndex] =
                          digit;
                      },
                    );

                  setEmailOtpCode(updatedCode);

                  const focusIndex = Math.min(
                    pastedValue.length,
                    5,
                  );

                  emailOtpInputRefs.current[
                    focusIndex
                  ]?.focus();
                }}
                className="h-12 w-12 rounded-lg border border-slate-300 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                aria-label={`Email OTP digit ${
                  index + 1
                }`}
              />
            ),
          )}
        </div>

        {emailOtpError && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
            {emailOtpError}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs">
          <span className="text-slate-500">
            {emailOtpModal.resendAfterSeconds >
            0
              ? `Resend in ${emailOtpModal.resendAfterSeconds}s`
              : "Didn't receive the OTP?"}
          </span>

          <button
            type="button"
            disabled={
              emailOtpModal.resendAfterSeconds >
                0 ||
              sendEmailOtpMutation.isPending
            }
            onClick={() => {
              setEmailOtpError("");
              handleSendEmailOtp();
            }}
            className="font-bold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendEmailOtpMutation.isPending
              ? "Sending..."
              : "Resend OTP"}
          </button>
        </div>

        {/* No consent section for email OTP */}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              setEmailOtpModal(
                (previous) => ({
                  ...previous,
                  open: false,
                }),
              )
            }
            className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              verifyEmailOtpMutation.isPending ||
              emailOtpCode.join("").length !==
                6
            }
            onClick={handleVerifyEmailOtp}
            className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifyEmailOtpMutation.isPending
              ? "Verifying..."
              : "Verify Email"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Global Toast Alert Messages */}
      {message && (
        <div className={`rounded-lg border p-4 text-xs font-semibold shadow-xs ${messageType === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"
          }`}>
          {message}
        </div>
      )}

      {/* Main Core Form Inputs Viewport Layout matching image guidelines */}
      <div className="space-y-6">
        
        <Section title="Primary Applicant Information">
          <Field
            label="Customer / Entity Name *"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
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
                disabled={otpVerified}
                className={`flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${otpVerified ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""
                  }`}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpVerified || sendOtpMutation.isPending}
                className={`rounded-lg px-4 text-xs font-bold shadow-xs transition-all border ${otpVerified
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                  }`}
              >
                {otpVerified ? "✓ Verified" : sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </button>
            </div>

            {otpVerified && (
              <div className="mt-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Application Number</span>
                <span className="text-xs font-bold text-slate-900">{applicationNumber || "—"}</span>
              </div>
            )}
          </div>


     

      <div className="flex flex-col gap-1.5">
  <label className="text-xs font-semibold text-slate-700">
    Email Id *
  </label>

  <div className="flex gap-2">
    <input
      type="email"
      name="emailId"
      value={formData.emailId || ""}
      onChange={handleEmailChange}
      maxLength={255}
      autoComplete="email"
      placeholder="Enter email address"
      required
      disabled={emailOtpVerified}
      className={`flex-1 rounded-lg border px-3.5 py-2 text-sm shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${
        emailOtpVerified
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
          : "border-slate-300 bg-white text-slate-900"
      }`}
    />

    <button
      type="button"
      onClick={handleSendEmailOtp}
      disabled={
        emailOtpVerified ||
        sendEmailOtpMutation.isPending
      }
      className={`rounded-lg border px-4 text-xs font-bold shadow-xs transition-all ${
        emailOtpVerified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      }`}
    >
      {emailOtpVerified
        ? "✓ Verified"
        : sendEmailOtpMutation.isPending
          ? "Sending..."
          : emailOtpSent
            ? "Resend OTP"
            : "Send OTP"}
    </button>
  </div>

  {emailOtpVerified && (
    <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
      <span className="text-xs font-medium text-emerald-700">
        Email successfully verified
      </span>

      <span className="text-xs font-bold text-emerald-700">
        ✓ Verified
      </span>
    </div>
  )}
</div>


          {/* <Field
            label="Email ID Address"
            name="emailId"
            type="email"
            value={formData.emailId}
            onChange={handleInputChange}
          /> */}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              PAN Number *
            </label>

            <div className="flex gap-2">
              <input
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                maxLength={10}
                placeholder="ABCDE1234F"
                disabled={panVerified}
                className={`flex-1 rounded-lg border px-3.5 py-2 text-sm uppercase shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${
                  panVerified
                    ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              />

              {formData.panNumber.trim() && (
                <button
                  type="button"
                  onClick={handleVerifyPan}
                  disabled={panVerified || verifyPanMutation.isPending}
                  className={`rounded-lg border px-4 text-xs font-bold shadow-xs transition-all ${
                    panVerified
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  {panVerified
                    ? "Verified"
                    : verifyPanMutation.isPending
                      ? "Verifying..."
                      : "Verify"}
                </button>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-all hover:bg-slate-50">
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    disabled={panOcrMutation.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setPanFile(file);
                      setPanOcrData(null);
                      setPanOcrError("");
                      if (file) {
                        setPanVerified(false);
                      }
                    }}
                  />
                  <span className="block truncate">
                    {panFile ? panFile.name : "Upload PAN image or PDF"}
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!panFile || panOcrMutation.isPending}
                  onClick={() => {
                    setMessage("");
                    setPanOcrError("");
                    panOcrMutation.mutate();
                  }}
                  className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {panOcrMutation.isPending ? "Extracting..." : "Extract PAN"}
                </button>
              </div>

              {panOcrError && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  {panOcrError}
                </p>
              )}

              {panOcrData && !panOcrError && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  OCR details captured. Review the PAN and name before verification.
                </p>
              )}
            </div>

            {panVerified && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                <span className="text-xs font-medium text-emerald-700">
                  PAN successfully verified
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Verified
                </span>
              </div>
            )}
          </div>

          <Field
            label="Aadhaar / OVD Number *"
            name="aadhaarNumber"
            value={formData.aadhaarNumber}
            onChange={handleInputChange}
            maxLength={12}
            inputMode="numeric"
            placeholder="0000 0000 0000"
          />

          <Field label="Occupation / Constitution">
            <select
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="SELF_EMPLOYED">Self-employed</option>
              <option value="SALARIED">Salaried Sector</option>
              <option value="BUSINESS">Corporate Business</option>
              <option value="PROFESSIONAL">Licensed Professional</option>
            </select>
          </Field>

          <Field
            label="Employer / Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
          />
        </Section>

        <Section title="Loan & Underwriting Metrics Requirement">
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
            label="Requested Tenure (Months)"
            name="requestedTenure"
            type="number"
            min="1"
            value={formData.requestedTenure}
            onChange={handleInputChange}
          />

          {/* Indicators Box customized layout matching image values cleanly */}
          <div className="grid grid-cols-3 gap-4 bg-slate-900 rounded-xl border border-slate-950 p-4 md:col-span-2 shadow-inner text-white">
            <div className="flex flex-col justify-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Indicative EMI</span>
              <span className="mt-1 text-sm md:text-base font-extrabold text-blue-400 tracking-tight">
                {formatCurrency(calculated.emi)}
              </span>
            </div>
            <div className="flex flex-col justify-center border-x border-slate-800 px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FOIR Ratio</span>
              <span className={`mt-1 text-sm md:text-base font-extrabold tracking-tight ${calculated.foir > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                {calculated.foir.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col justify-center px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Indicative LTV</span>
              <span className="mt-1 text-sm md:text-base font-extrabold text-slate-100 tracking-tight">
                {calculated.ltv.toFixed(2)}%
              </span>
            </div>
          </div>
        </Section>

        <Section title="Collateral Property Information">
          <Field label="Property Category">
            <select
              name="propertyCategory"
              value={formData.propertyCategory}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {PROPERTY_CATEGORY.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field label="Property Type *">
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {propertyTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Approximate Property Value *"
            name="propertyValue"
            type="number"
            min="0"
            value={formData.propertyValue}
            onChange={handleInputChange}
          />

          <Field
            label="Property Address *"
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
