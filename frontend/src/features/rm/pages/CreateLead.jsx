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
  gstNumber: "",
  propertyCategory: "Residential",
  propertyType: PROPERTY_TYPE.Residential?.[0] || "Independent House",
  propertyValue: "",
  propertyAddress: "",
  city: "",
  state: "",
  pinCode: "",
};

const emptyCoApplicantForm = {
  name: "",
  mobile: "",
  email: "",
  panNumber: "",
  aadhaarNumber: "",
  relationship: "",
  occupation: "",
  monthlyIncome: "",
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

  const [customerPhotoFile, setCustomerPhotoFile] = useState(null);

  const [createdApplicationId, setCreatedApplicationId] = useState(null);

  const photoApplicationId = createdApplicationId ?? applicationId;

  const applicantDocumentsQuery = useQuery({
    queryKey: ["rm-documents", photoApplicationId],
    queryFn: () => rmApi.documents(photoApplicationId),
    enabled: Boolean(photoApplicationId),
    retry: false,
  });

  const uploadedDocuments = useMemo(() => {
    const payload =
      applicantDocumentsQuery.data?.data?.data ??
      applicantDocumentsQuery.data?.data ??
      applicantDocumentsQuery.data ??
      [];

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.documents)) {
      return payload.documents;
    }

    return [];
  }, [applicantDocumentsQuery.data]);

  const normalizeDocumentValue = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/&/g, "AND")
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const applicantPhotoDocument = useMemo(() => {
    const matchedPhotos = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );

      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );

      const documentSource = normalizeDocumentValue(
        doc.documentSource || doc.document_source,
      );

      // Do not pick field visit photos like BUSINESS_FRONTAGE / PROPERTY_FRONTAGE
      if (documentSource === "FIELD_VISIT") {
        return false;
      }

      return (
        documentName === "APPLICANT_PHOTO" ||
        documentName === "CUSTOMER_PHOTO" ||
        documentName === "PHOTOGRAPH" ||
        documentType === "PHOTO"
      );
    });

    return (
      matchedPhotos.find(
        (doc) =>
          normalizeDocumentValue(doc.documentName || doc.document_name) ===
          "APPLICANT_PHOTO",
      ) ||
      matchedPhotos.find(
        (doc) =>
          normalizeDocumentValue(doc.documentName || doc.document_name) ===
          "CUSTOMER_PHOTO",
      ) ||
      matchedPhotos[0] ||
      null
    );
  }, [uploadedDocuments]);

  const getDocumentImageUrl = (document) => {
    if (!document) return "";

    const directUrl =
      document.fileUrl ||
      document.documentUrl ||
      document.url;

    if (directUrl) {
      return directUrl;
    }

    const rawPath =
      document.filePath ||
      document.file_path ||
      document.fileName ||
      document.file_name ||
      "";

    if (!rawPath) {
      return "";
    }

    const normalizedPath = String(rawPath).replace(/\\/g, "/");

    if (normalizedPath.startsWith("http")) {
      return normalizedPath;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    let uploadBaseUrl = "";

    try {
      uploadBaseUrl = apiBaseUrl ? new URL(apiBaseUrl).origin : "";
    } catch {
      uploadBaseUrl = "";
    }

    if (!uploadBaseUrl) {
      uploadBaseUrl = "http://localhost:9000";
    }

    const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");

    if (uploadsIndex >= 0) {
      return `${uploadBaseUrl}/${normalizedPath.slice(uploadsIndex)}`;
    }

    return `${uploadBaseUrl}/uploads/documents/${normalizedPath.replace(/^\/+/, "")}`;
  };

  const applicantPhotoUrl = getDocumentImageUrl(applicantPhotoDocument);

  const isApplicantPhotoUploaded = Boolean(applicantPhotoDocument);

  const handleViewApplicantPhoto = () => {
    if (!applicantPhotoUrl) {
      setMessageType("error");
      setMessage("Applicant photo file is not available.");
      return;
    }

    window.open(applicantPhotoUrl, "_blank", "noopener,noreferrer");
  };
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
const [aadhaarLinkSending, setAadhaarLinkSending] = useState(false);
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
  const [gstVerified, setGstVerified] = useState(false);
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



  const uploadCustomerPhotoMutation = useMutation({
    mutationFn: async () => {
      const targetApplicationId = createdApplicationId ?? applicationId;

      if (!targetApplicationId) {
        throw new Error("Please save draft before uploading customer photo.");
      }

      if (!customerPhotoFile) {
        throw new Error("Please select customer photo.");
      }

      const payload = new FormData();

      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "PHOTO");
      payload.append("documentName", "Applicant Photo");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", customerPhotoFile);

      return rmApi.uploadDocument(payload);
    },

    onSuccess: async () => {
      setMessageType("success");
      setMessage("Customer photo uploaded successfully.");

      setCustomerPhotoFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents", photoApplicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", createdApplicationId ?? applicationId],
        }),
      ]);
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to upload customer photo.",
      );
    },
  });

  const handleCustomerPhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setCustomerPhotoFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setMessageType("error");
      setMessage("Only JPG and PNG applicant photos are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Applicant photo size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setCustomerPhotoFile(file);
  };

  const [coApplicants, setCoApplicants] = useState([]);

  // Handler to update specific fields inside a specific co-applicant's index
  const handleCoApplicantChange = (index, event) => {
    const { name, value } = event.target;
   const nextValue =
  name === "panNumber" || name === "gstNumber"
    ? value.toUpperCase()
    : value;

if (name === "gstNumber") {
  setGstVerified(false);
}
    setCoApplicants((prev) =>
      prev.map((coApp, idx) =>
        idx === index ? { ...coApp, [name]: nextValue } : coApp
      )
    );
  };

  // Append a new empty co-applicant structure to the array
  const handleAddCoApplicant = () => {
    setCoApplicants((prev) => [
      ...prev,
      {
        name: "",
        mobile: "",
        email: "",
        panNumber: "",
        aadhaarNumber: "",
        relationship: "SPOUSE",
        occupation: "SELF_EMPLOYED",
        monthlyIncome: "",
      },
    ]);
  };

  // Remove a specific co-applicant card by index
  const handleRemoveCoApplicant = (index) => {
    setCoApplicants((prev) => prev.filter((_, idx) => idx !== index));
  };


  const [contactPersons, setContactPersons] = useState([]);


  const buildCoApplicantsPayload = () => {
    return coApplicants.map((coApp) => ({
      name: coApp.name.trim(),
      mobile: coApp.mobile.trim(),
      email: coApp.email?.trim() || undefined,
      panNumber: coApp.panNumber?.trim().toUpperCase() || undefined,
      aadhaarNumber: coApp.aadhaarNumber?.trim() || undefined,
      relationship: coApp.relationship,
      occupation: coApp.occupation || undefined,
      monthlyIncome: coApp.monthlyIncome ? Number(coApp.monthlyIncome) : undefined,
    }));
  };

  // Handler to update specific fields inside a specific contact person's index
  const handleContactPersonChange = (index, event) => {
    const { name, value } = event.target;
    setContactPersons((prev) =>
      prev.map((contact, idx) =>
        idx === index ? { ...contact, [name]: value } : contact
      )
    );
  };

  const buildContactPersonsPayload = (targetApplicationId) => {
    return contactPersons
      .filter((contact) => {
        return (
          String(contact.name || "").trim() ||
          String(contact.mobile || "").trim() ||
          String(contact.email || "").trim() ||
          String(contact.designation || "").trim()
        );
      })
      .map((contact) => ({
        id: contact.id || null,
        applicationId: Number(targetApplicationId),
        name: String(contact.name || "").trim(),
        mobile: String(contact.mobile || "").trim(),
        email: String(contact.email || "").trim() || undefined,
        designation: String(contact.designation || "").trim() || undefined,
        relationship: contact.relationship || "BUSINESS_ASSOCIATE",
      }));
  };


  // Append a new empty contact person structure to the array
  const handleAddContactPerson = () => {
    setContactPersons((prev) => [
      ...prev,
      {
        id: null,
        name: "",
        mobile: "",
        email: "",
        designation: "",
        relationship: "BUSINESS_ASSOCIATE",
      },
    ]);
  };

  // Remove a specific contact person card by index
  const handleRemoveContactPerson = async (index) => {
    const contact = contactPersons[index];

    if (contact?.id) {
      try {
        await rmApi.deleteContactPerson(contact.id);
      } catch (error) {
        setMessageType("error");
        setMessage(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to delete contact person.",
        );
        return;
      }
    }

    setContactPersons((prev) => prev.filter((_, idx) => idx !== index));
  };





  const applicationQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => rmApi.getApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  const customerProfileQuery = useQuery({
    queryKey: ["customer-profile", applicationId],
    queryFn: () => rmApi.getCustomerProfile(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!applicationId || !applicationQuery.data) return;

    const response = unwrapResponse(applicationQuery.data);
    const application = response?.data ?? response;

    if (!application || typeof application !== "object") return;

    const profile = application.customerProfile || {};

    const categoryFromType = String(
      application.propertyType ||
      profile.propertyType ||
      ""
    )
      .split(" - ")[0]
      .trim();

    const propertyCategory = normalizePropertyCategory(
      application.propertyCategory ||
      profile.propertyCategory ||
      categoryFromType
    );

    const propertyType = normalizePropertyType(
      application.propertyType ||
      profile.propertyType,
      propertyCategory
    );

    setCreatedApplicationId(Number(application.id || applicationId));
    setApplicationNumber(application.applicationNumber || "");

    setFormData((previous) => ({
      ...previous,

      customerName:
        application.customerName ||
        `${profile.firstName || ""} ${profile.middleName || ""} ${profile.lastName || ""}`
          .replace(/\s+/g, " ")
          .trim() ||
        "",

      mobileNumber:
        application.mobile ||
        application.mobileNumber ||
        profile.mobile ||
        "",

      emailId:
        application.email ||
        application.emailId ||
        profile.email ||
        "",

      panNumber:
        application.pan ||
        application.panNumber ||
        profile.panNumber ||
        "",

      aadhaarNumber:
        application.aadhaarNumber ||
        profile.aadhaarNumber ||
        "",

      occupation:
        application.occupationType ||
        profile.occupationType ||
        application.occupation ||
        "SELF_EMPLOYED",

      businessName:
        application.businessName ||
        profile.businessName ||
        "",
      gstNumber:
        application.gstNumber ||
        application.gst_number ||
        profile.gstNumber ||
        profile.gst_number ||
        "",

      propertyCategory,

      propertyType,

      propertyValue:
        application.marketValue ??
        application.propertyValue ??
        profile.marketValue ??
        "",

      propertyAddress:
        application.propertyAddress ||
        profile.propertyAddress ||
        "",

      city:
        application.propertyCity ||
        application.city ||
        profile.propertyCity ||
        "",

      state:
        application.propertyState ||
        application.state ||
        profile.propertyState ||
        "",

      pinCode:
        application.propertyPincode ||
        application.pinCode ||
        profile.propertyPincode ||
        "",
    }));

    setPanVerified(
      toBoolean(application.panVerified) ||
      toBoolean(application.customerProfile?.panVerified) ||
      toBoolean(profile.panVerified)
    );

    setOtpVerified(
      toBoolean(application.mobileVerified) ||
      toBoolean(application.customerProfile?.mobileVerified) ||
      toBoolean(profile.mobileVerified)
    );

    setEmailOtpVerified(
      toBoolean(application.emailVerified) ||
      toBoolean(application.customerProfile?.emailVerified) ||
      toBoolean(profile.emailVerified)
    );
  }, [applicationId, applicationQuery.data]);


  const hasPrefilledFromState = Boolean(location?.state?.formData);

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

  useEffect(() => {
    if (!applicationId) return;

    const applicationResponse = unwrapResponse(applicationQuery.data);
    const application =
      applicationResponse?.data ??
      applicationResponse ??
      {};

    const profileResponse = unwrapResponse(customerProfileQuery.data);
    const profile = profileResponse?.data ?? profileResponse ?? {};

    const mobileIsVerified =
      toBoolean(application.mobileVerified) ||
      toBoolean(application.customerProfile?.mobileVerified) ||
      toBoolean(profile.mobileVerified) ||
      toBoolean(profile.mobile_verified);

    const emailIsVerified =
      toBoolean(application.emailVerified) ||
      toBoolean(application.customerProfile?.emailVerified) ||
      toBoolean(profile.emailVerified) ||
      toBoolean(profile.email_verified);

    setOtpVerified(mobileIsVerified);
    setEmailOtpVerified(emailIsVerified);
  }, [
    applicationId,
    applicationQuery.data,
    customerProfileQuery.data,
  ]);

  // Automatically load co-applicants from the DB for existing leads
  useEffect(() => {
    if (!applicationId) return;

    const fetchExistingCoApplicants = async () => {
      try {
        const response = await rmApi.getCoApplicants(applicationId);
        const result = unwrapResponse(response);
        const rows = result?.data ?? result ?? [];

        if (Array.isArray(rows) && rows.length > 0) {
          setCoApplicants(
            rows.map((row) => ({
              name: row.name || "",
              mobile: row.mobile || "",
              email: row.email || "",
              panNumber: row.panNumber || row.pan_number || "",
              aadhaarNumber: row.aadhaarNumber || row.aadhaar_number || "",
              relationship: row.relationship || "SPOUSE",
              occupation: row.occupation || "SELF_EMPLOYED",
              monthlyIncome: row.monthlyIncome ? String(row.monthlyIncome) : "",
            }))
          );
        }
      } catch (error) {
        console.error("Failed to recover co-applicant dataset tracking lines:", error);
      }
    };

    fetchExistingCoApplicants();
  }, [applicationId]);

  // Contact Persons Automatically load contact persons from the existing leads

  useEffect(() => {
    if (!applicationId) return;

    const fetchExistingContactPersons = async () => {
      try {
        const response = await rmApi.getContactPersons(applicationId);
        const result = unwrapResponse(response);
        const rows = result?.data ?? result ?? [];

        if (Array.isArray(rows)) {
          setContactPersons(
            rows.map((row) => ({
              id: row.id,
              name: row.name || "",
              mobile: row.mobile || "",
              email: row.email || "",
              designation: row.designation || "",
              relationship: row.relationship || "BUSINESS_ASSOCIATE",
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load contact persons:", error);
      }
    };

    fetchExistingContactPersons();
  }, [applicationId]);



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

  const invalidateVerificationQueries = async (id) => {
    if (!id) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["customer-profile", String(id)],
      }),
      queryClient.invalidateQueries({
        queryKey: ["customer-profile", Number(id)],
      }),
      queryClient.invalidateQueries({
        queryKey: ["application", String(id)],
      }),
      queryClient.invalidateQueries({
        queryKey: ["application", Number(id)],
      }),
    ]);
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

      const newId =
        created?.applicationId ??
        created?.application?.id ??
        created?.id;

      const newNumber = created?.applicationNumber;

      if (newId) {
        setCreatedApplicationId(newId);
        setApplicationNumber(newNumber || "");
        setOtpVerified(true);

        await invalidateVerificationQueries(newId);

        setMessageType("success");
        setMessage("✓ Mobile verified successfully.");

        if (!applicationId) {
          // Stay on the same CreateLead page by re-loading it with the newly created applicationId
          navigate(`/create-lead/${newId}`, {
            replace: true,
          });
          return;
        }
      }
    },

    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid OTP";

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

  // const calculated = useMemo(() => {
  //   const income = Number(formData.monthlyIncome || 0);
  //   const obligations = Number(formData.monthlyObligations || 0);
  //   const requested = Number(formData.requestedAmount || 0);
  //   const propertyValue = Number(formData.propertyValue || 0);

  //   const foir = income > 0 ? (obligations / income) * 100 : 0;
  //   const ltv = propertyValue > 0 ? (requested / propertyValue) * 100 : 0;

  //   const roi = 10.5;
  //   const tenure = Number(formData.requestedTenure || 120);
  //   const monthlyRate = roi / 12 / 100;
  //   const power = Math.pow(1 + monthlyRate, tenure);
  //   const emi = requested > 0 && tenure > 0 ? (requested * monthlyRate * power) / (power - 1) : 0;

  //   return {
  //     foir,
  //     ltv,
  //     roi,
  //     tenure,
  //     emi: Number.isFinite(emi) ? emi : 0,
  //   };
  // }, [formData]);

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
      gstNumber: formData.gstNumber.trim() || undefined,
      propertyCategory: formData.propertyCategory || undefined,
      propertyType: formData.propertyType ? `${formData.propertyCategory} - ${formData.propertyType}` : undefined,
      marketValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
      propertyAddress: formData.propertyAddress.trim() || undefined,
      propertyCity: formData.city.trim() || undefined,
      propertyState: formData.state.trim() || undefined,
      propertyPincode: formData.pinCode.trim() || undefined,
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
        "propertyCategory",
        "propertyType",
        "marketValue",
        "propertyAddress",
        "propertyCity",
        "propertyState",
        "propertyPincode",

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
    if (!formData.occupation) errors.push("Occupation is required");
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



  const saveContactPersonsForApplication = async (targetApplicationId) => {
    if (!targetApplicationId) return;

    const payload = buildContactPersonsPayload(targetApplicationId);

    for (const contact of payload) {
      const finalPayload = {
        applicationId: Number(targetApplicationId),
        name: contact.name,
        mobile: contact.mobile,
        email: contact.email,
        designation: contact.designation,
        relationship: contact.relationship,
      };

      if (!finalPayload.name || !finalPayload.mobile) {
        continue;
      }

      if (contact.id) {
        await rmApi.updateContactPerson(contact.id, finalPayload);
      } else {
        await rmApi.createContactPerson(finalPayload);
      }
    }
  };



  // =========================================================================
  // UPDATE 1: saveNewDraftMutation
  // =========================================================================
  const saveNewDraftMutation = useMutation({
    mutationFn: () => {
      if (createdApplicationId != null) {
        return rmApi.updateApplication(createdApplicationId, buildPayload(true));
      }
      return rmApi.saveDraft(buildPayload(false));
    },
    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;
      const newApplicationId = created?.id || created?.applicationId || created?.application?.id;

      // --- FIXED INTEGRATION ROW ---
      const targetId = newApplicationId || createdApplicationId || applicationId;

      if (targetId) {
        try {
          await rmApi.saveCoApplicantsBulk(targetId, buildCoApplicantsPayload());
          await saveContactPersonsForApplication(targetId);
        } catch (err) {
          console.error("Co-applicant/contact person synchronization failed during creation:", err);
        }
      }
      // --- END FIXED INTEGRATION ---

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

  // =========================================================================
  // UPDATE 2: updateDraftMutation
  // =========================================================================
  const updateDraftMutation = useMutation({
    mutationFn: () =>
      rmApi.updateApplication(
        createdApplicationId ?? applicationId,
        buildPayload(true),
      ),
    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;

      // --- FIXED INTEGRATION ROW ---
      const targetId =
        created?.id ||
        created?.applicationId ||
        createdApplicationId ||
        applicationId;

      if (targetId) {
        try {
          await rmApi.saveCoApplicantsBulk(targetId, buildCoApplicantsPayload());
          await saveContactPersonsForApplication(targetId);
        } catch (err) {
          console.error("Co-applicant/contact person synchronization failed during update:", err);
        }
      }
      // --- END FIXED INTEGRATION ---

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

      // Save co-applicants + contact persons on final submit as well
      try {
        if (idToInvalidate) {
          await rmApi.saveCoApplicantsBulk(idToInvalidate, buildCoApplicantsPayload());
          await saveContactPersonsForApplication(idToInvalidate);
        }
      } catch (err) {
        console.error("Co-applicant/contact person sync failed during submitDraft:", err);
      }

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
const verifyGstMutation = useMutation({
  mutationFn: () =>
rmApi.verifyGst({
  gstNumber: formData.gstNumber.trim().toUpperCase(),
  applicationId: Number(createdApplicationId ?? applicationId),
}),

  onSuccess: async (response) => {
    const result = unwrapResponse(response);

    setGstVerified(true);
    setMessageType("success");
    setMessage(result?.message || "GST verified successfully.");

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["customer-profile", createdApplicationId ?? applicationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["application", createdApplicationId ?? applicationId],
      }),
    ]);
  },

  onError: (error) => {
    setGstVerified(false);
    setMessageType("error");
    setMessage(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to verify GST.",
    );
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

const handleVerifyGst = () => {
  const gstNumber = formData.gstNumber.trim().toUpperCase();

  setMessage("");

  if (!gstNumber) {
    setMessageType("error");
    setMessage("Enter GST number before verification.");
    return;
  }

  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
    setMessageType("error");
    setMessage("Enter a valid GST number.");
    return;
  }

  if (!(createdApplicationId ?? applicationId)) {
    setMessageType("error");
    setMessage("Save the lead before GST verification so verification can be stored.");
    return;
  }

  verifyGstMutation.mutate();
};


const handleInitAadhaar = async () => {
  const targetApplicationId = createdApplicationId ?? applicationId;

  if (!targetApplicationId) {
    setMessageType("error");
    setMessage("Save the lead before sending Aadhaar KYC link.");
    return;
  }

  try {
    setAadhaarLinkSending(true);
    setMessage("");

    const response = await rmApi.initAadhaarKyc({
      applicationId: Number(targetApplicationId),
    });

    const result = unwrapResponse(response);
    const payload = result?.data ?? result;
    const kycUrl = payload?.kycUrl || payload?.data?.kycUrl;

    setMessageType("success");
    setMessage(result?.message || "Aadhaar KYC link generated successfully.");

    if (kycUrl) {
      window.open(kycUrl, "_blank", "noopener,noreferrer");
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["customer-profile", targetApplicationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["application", targetApplicationId],
      }),
    ]);
  } catch (error) {
    setMessageType("error");
    setMessage(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to send Aadhaar KYC link.",
    );
  } finally {
    setAadhaarLinkSending(false);
  }
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
    mutationFn: (payload) => rmApi.verifyEmailOtp(payload),

    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const data = result?.data ?? result;

      const idToInvalidate =
        data?.applicationId ??
        createdApplicationId ??
        applicationId;

      setEmailOtpVerified(true);
      setEmailOtpSent(false);
      setEmailOtpError("");
      setEmailOtpCode(Array(6).fill(""));

      setEmailOtpModal((previous) => ({
        ...previous,
        open: false,
      }));

      if (data?.applicationNumber) {
        setApplicationNumber(data.applicationNumber);
      }

      await invalidateVerificationQueries(idToInvalidate);

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
    verifyPanMutation.isPending ||
    verifyGstMutation.isPending;
      aadhaarLinkSending;

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
                      aria-label={`Email OTP digit ${index + 1
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
  {/* Row 1: Legal Name */}
  <div className="col-span-full">
    <Field
      label="Customer / Entity Name *"
      name="customerName"
      value={formData.customerName}
      onChange={handleInputChange}
      required
      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
    />
  </div>

  {/* Row 2: Contact Validations Grid */}
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 col-span-full">
    {/* Mobile Number Block */}
    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Mobile Number *
      </label>
      <div className="flex gap-2.5">
        <input
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleInputChange}
          maxLength={10}
          inputMode="numeric"
          required
          disabled={otpVerified}
          placeholder="Enter 10-digit number"
          className={`flex-1 rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
            otpVerified ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" : ""
          }`}
        />
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={otpVerified || sendOtpMutation.isPending}
          className={`rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider transition-all border whitespace-nowrap shadow-2xs ${
            otpVerified
              ? "bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed"
              : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 active:scale-98"
          }`}
        >
          {otpVerified ? "✓ Verified" : sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
        </button>
      </div>

      {otpVerified && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
          <span className="text-xs font-semibold text-slate-400">Application ID</span>
          <span className="text-xs font-bold tracking-wide text-slate-700">{applicationNumber || "—"}</span>
        </div>
      )}
    </div>

    {/* Email Block */}
    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Email Id *
      </label>
      <div className="flex gap-2.5">
        <input
          type="email"
          name="emailId"
          value={formData.emailId || ""}
          onChange={handleEmailChange}
          maxLength={255}
          autoComplete="email"
          placeholder="name@domain.com"
          required
          disabled={emailOtpVerified}
          className={`flex-1 rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
            emailOtpVerified ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : ""
          }`}
        />
        <button
          type="button"
          onClick={handleSendEmailOtp}
          disabled={emailOtpVerified || sendEmailOtpMutation.isPending}
          className={`rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider transition-all border whitespace-nowrap shadow-2xs ${
            emailOtpVerified
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed"
              : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 active:scale-98"
          }`}
        >
          {emailOtpVerified ? "✓ Verified" : sendEmailOtpMutation.isPending ? "Sending..." : emailOtpSent ? "Resend OTP" : "Send OTP"}
        </button>
      </div>

      {emailOtpVerified && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50/50 px-3.5 py-2.5 border border-emerald-100/60 text-emerald-700">
          <span className="text-xs font-bold">✓ Email address verified successfully</span>
        </div>
      )}
    </div>
  </div>

  {/* Row 3: Identity Verification (PAN & Aadhaar + Compact Photo Block) */}
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 col-span-full">
    {/* Left Side Column: PAN Block */}
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          PAN Number *
        </label>
        <div className="flex gap-2.5 mt-1.5">
          <input
            name="panNumber"
            value={formData.panNumber}
            onChange={handleInputChange}
            maxLength={10}
            placeholder="ABCDE1234F"
            disabled={panVerified}
            className={`flex-1 rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm uppercase font-bold tracking-wider text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
              panVerified ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-600" : ""
            }`}
          />
          {formData.panNumber.trim() && (
            <button
              type="button"
              onClick={handleVerifyPan}
              disabled={panVerified || verifyPanMutation.isPending}
              className={`rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider border transition-all shadow-2xs ${
                panVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed"
                  : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 active:scale-98"
              }`}
            >
              {panVerified ? "Verified" : verifyPanMutation.isPending ? "Verifying..." : "Verify"}
            </button>
          )}
        </div>
      </div>

      {/* PAN Scan / Extraction Area */}
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-3xs hover:bg-slate-50 transition-colors">
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
                if (file) setPanVerified(false);
              }}
            />
            <span className="block truncate max-w-[200px]">
              {panFile ? panFile.name : "Attach card image or PDF"}
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
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
          >
            {panOcrMutation.isPending ? "Extracting..." : "Auto-Fill"}
          </button>
        </div>
        {panOcrError && <p className="mt-2 text-[11px] font-semibold text-rose-500">{panOcrError}</p>}
        {panOcrData && !panOcrError && <p className="mt-2 text-[11px] font-medium text-emerald-600">Scan successful. Review mapped data.</p>}
      </div>

      {panVerified && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 px-3.5 py-2 border border-emerald-100/60 text-emerald-700">
          <span className="text-xs font-semibold">Document matches registered identity</span>
          <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
        </div>
      )}
    </div>

    {/* Right Side Column: Aadhaar Box + Compact Photo Block */}
    <div className="flex flex-col gap-4 self-start">
      {/* Aadhaar KYC Link Dispatcher Box */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/50 p-3.5 shadow-2xs flex flex-row items-center justify-between gap-4 h-fit">
        <div className="flex flex-col gap-1">
          <span className="inline-flex self-start rounded-md bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            DigiLocker KYC
          </span>
          <h4 className="text-sm font-bold text-slate-800">Aadhaar Verification Link</h4>
        </div>

        <div className="shrink-0 min-w-[160px]">
          <button
            type="button"
            onClick={handleInitAadhaar}
            disabled={aadhaarLinkSending || !(createdApplicationId ?? applicationId)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-lg focus:ring-4 focus:ring-blue-100 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {aadhaarLinkSending ? (
              "Sending..."
            ) : !(createdApplicationId ?? applicationId) ? (
              "Save Draft First"
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v7.5A2.25 2.25 0 005.25 18h13.5A2.25 2.25 0 0021 15.75v-4.5M13.5 6L21 3m0 0v7.5M21 3l-7.5 7.5" />
                </svg>
                Send Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compact Profile Photo Management Panel */}
      <div className="rounded-2xl border border-slate-300 bg-white p-3.5 shadow-2xs flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-3xs">
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
              IMG
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold text-slate-800">Biometric Photo</h4>
            <div className="flex items-center gap-1.5">
              {isApplicantPhotoUploaded ? (
                <>
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantPhoto}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View Photo
                  </button>
                </>
              ) : (
                <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[210px]">
          <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors whitespace-nowrap">
            {customerPhotoFile ? "Change" : "Choose File"}
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleCustomerPhotoChange}
            />
          </label>

          <button
            type="button"
            disabled={!customerPhotoFile || uploadCustomerPhotoMutation.isPending || !(createdApplicationId ?? applicationId)}
            onClick={() => uploadCustomerPhotoMutation.mutate()}
            className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-all active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 whitespace-nowrap"
          >
            {uploadCustomerPhotoMutation.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
      
      {customerPhotoFile && (
        <div className="rounded-xl bg-blue-50/50 px-3 py-1.5 border border-blue-100 text-[11px] font-medium text-blue-700 truncate max-w-sm">
          Staged: <span className="font-bold">{customerPhotoFile.name}</span>
        </div>
      )}
    </div>
  </div>

  {/* Row 4: Professional & Corporate Details Grid */}
  <div className="grid grid-cols-1 gap-5 md:grid-cols-3 col-span-full">
    <Field label="Occupation / Constitution">
      <select
        name="occupation"
        value={formData.occupation}
        onChange={handleInputChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
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
      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
    />

    {/* GST Identification Block */}
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        GST Number
      </label>
      <div className="flex gap-2.5">
        <input
          name="gstNumber"
          value={formData.gstNumber}
          onChange={handleInputChange}
          maxLength={15}
          placeholder="22AAAAA0000A1Z5"
          disabled={gstVerified}
          className={`flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm uppercase font-semibold tracking-wider text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
            gstVerified ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-600" : ""
          }`}
        />

        {formData.gstNumber.trim() && (
          <button
            type="button"
            onClick={handleVerifyGst}
            disabled={gstVerified || verifyGstMutation.isPending}
            className={`rounded-xl px-4 text-xs font-extrabold uppercase tracking-wider border transition-all shadow-2xs ${
              gstVerified
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed"
                : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 active:scale-98"
            }`}
          >
            {gstVerified ? "Verified" : verifyGstMutation.isPending ? "Verifying..." : "Verify"}
          </button>
        )}
      </div>

      {gstVerified && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50/50 px-3.5 py-2 border border-emerald-100/60 text-emerald-700">
          <span className="text-xs font-semibold">GSTIN validated successfully</span>
          <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
        </div>
      )}
    </div>
  </div>
</Section>


        {/* Co-Applicants Multi-Card Management Workspace */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mt-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Co-Applicant Details
              </h4>
              <p className="text-xs text-slate-500">
                Add up to 3 joint/co-signing applicants to distribute collateral risk parameters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCoApplicant}
              disabled={coApplicants.length >= 3}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Co-Applicant
            </button>
          </div>

          {coApplicants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
              No co-applicants added. Click the button above to add financial profile verification cards.
            </div>
          ) : (
            coApplicants.map((coApp, index) => (
              <div key={index} className="relative group">
                <Section title={`Co-Applicant Details ${index + 1}`}>
                  <Field
                    label="Co-Applicant Name *"
                    name="name"
                    value={coApp.name}
                    onChange={(e) => handleCoApplicantChange(index, e)}
                    placeholder="Enter full legal name"
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </label>
                    <input
                      name="mobile"
                      value={coApp.mobile}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="Enter 10-digit mobile"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <Field
                    label="Email Id"
                    type="email"
                    name="email"
                    value={coApp.email}
                    onChange={(e) => handleCoApplicantChange(index, e)}
                    placeholder="name@domain.com"
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      PAN Number
                    </label>
                    <input
                      name="panNumber"
                      value={coApp.panNumber}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm uppercase text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Aadhaar / OVD Number
                    </label>
                    <input
                      name="aadhaarNumber"
                      value={coApp.aadhaarNumber}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                      maxLength={12}
                      inputMode="numeric"
                      placeholder="0000 0000 0000"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <Field label="Relationship Matrix *">
                    <select
                      name="relationship"
                      value={coApp.relationship}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="SPOUSE">Spouse</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="SON">Son</option>
                      <option value="SIBLING">Sibling</option>
                    </select>
                  </Field>

                  <Field label="Occupation Type">
                    <select
                      name="occupation"
                      value={coApp.occupation}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="SELF_EMPLOYED">Self-employed</option>
                      <option value="SALARIED">Salaried Sector</option>
                      <option value="BUSINESS">Corporate Business</option>
                      <option value="PROFESSIONAL">Licensed Professional</option>
                    </select>
                  </Field>

                  <Field
                    label="Verified Monthly Income"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    value={coApp.monthlyIncome}
                    onChange={(e) => handleCoApplicantChange(index, e)}
                    placeholder="e.g. 50000"
                  />

                  {/* Action Row containing structural removal handlers */}
                  <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveCoApplicant(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove CoApplicant: {index + 1}
                    </button>
                  </div>
                </Section>
              </div>
            ))
          )}
        </div>

        {/* Contact Persons Multi-Card Management Workspace */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mt-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Reference / Contact Persons
              </h4>
              <p className="text-xs text-slate-500">
                Add primary organizational or personal references associated with this account lead.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddContactPerson}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Contact Person
            </button>
          </div>

          {contactPersons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
              No contact persons added. Click the button above to add verification reference lines.
            </div>
          ) : (
            contactPersons.map((contact, index) => (
              <div key={index} className="relative group">
                <Section title={`Contact Person Reference ${index + 1}`}>
                  <Field
                    label="Full Name *"
                    name="name"
                    value={contact.name}
                    onChange={(e) => handleContactPersonChange(index, e)}
                    placeholder="Enter contact name"
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </label>
                    <input
                      name="mobile"
                      value={contact.mobile}
                      onChange={(e) => handleContactPersonChange(index, e)}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="Enter 10-digit mobile"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <Field
                    label="Email Id"
                    type="email"
                    name="email"
                    value={contact.email}
                    onChange={(e) => handleContactPersonChange(index, e)}
                    placeholder="contact@domain.com"
                  />

                  <Field
                    label="Designation / Role"
                    name="designation"
                    value={contact.designation}
                    onChange={(e) => handleContactPersonChange(index, e)}
                    placeholder="e.g. Manager, Director, Partner"
                  />

                  <Field label="Relationship Matrix *">
                    <select
                      name="relationship"
                      value={contact.relationship}
                      onChange={(e) => handleContactPersonChange(index, e)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="BUSINESS_ASSOCIATE">Business Associate</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="COLLEAGUE">Colleague</option>
                      <option value="FRIEND">Friend</option>
                      <option value="RELATIVE">Relative</option>
                    </select>
                  </Field>

                  {/* Action Row containing layout removal button */}
                  <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveContactPerson(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Reference
                    </button>
                  </div>
                </Section>
              </div>
            ))
          )}
        </div>
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
