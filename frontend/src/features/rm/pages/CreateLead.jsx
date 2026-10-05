import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import { getDocumentUrl } from "../../../utils/fileUrl.js";
import ScheduleFollowUpModal from "../components/ScheduleFollowUpModal.jsx";
import { rmApi } from "../rmApi.js";
import { buildWorkflowTimeline, PROPERTY_TYPE } from "../rmUtils.js";

// Extracted Constants & Utils
import {
  CONSENT_TEXT,
  emptyCoApplicantForm,
  emptyForm,
  NATURE_OF_BUSINESS_OPTIONS,
  STEPS,
} from "../components/create-lead/constants/createLeadConstants.js";

import {
  normalizePropertyCategory,
  normalizePropertyType,
  toBoolean,
  unwrapResponse,
} from "../components/create-lead/utils/createLeadUtils.js";

// Extracted UI & Step Components
import Step1BasicInfo from "../components/create-lead/steps/Step1BasicInfo.jsx";
import Step2AdditionalDetails from "../components/create-lead/steps/Step2AdditionalDetails.jsx";
import Step3CoApplicants from "../components/create-lead/steps/Step3CoApplicants.jsx";
import Step4CollateralDetails from "../components/create-lead/steps/Step4CollateralDetails.jsx";
import Step5Attachments from "../components/create-lead/steps/Step5Attachments.jsx";
import Step6ReviewSubmit from "../components/create-lead/steps/Step6ReviewSubmit.jsx";
import CreateLeadFooter from "../components/create-lead/ui/CreateLeadFooter.jsx";
import CreateLeadStepper from "../components/create-lead/ui/CreateLeadStepper.jsx";

export default function CreateLead() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  const { isWorkStarted, setShowStartModal } = useAttendance();
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    nextFollowUpDate: "",
    followUpTime: "10:00 AM",
    followUpNotes: "",
    followUpStatus: "PENDING",
  });

  const [customerPhotoFile, setCustomerPhotoFile] = useState(null);

  const [createdApplicationId, setCreatedApplicationId] = useState(null);

  const currentApplicationId = createdApplicationId ?? applicationId;
  const photoApplicationId = currentApplicationId;

  const aadhaarCooldownKey = currentApplicationId
    ? `aadhaar_link_cooldown_${currentApplicationId}`
    : null;

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
    return getDocumentUrl(document);
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

  const applicantPanDocument = useMemo(() => {
    const matchedPans = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return documentName.includes("PAN") || documentType.includes("PAN");
    });

    return matchedPans[0] || null;
  }, [uploadedDocuments]);

  const applicantPanUrl = getDocumentImageUrl(applicantPanDocument);
  const isApplicantPanUploaded = Boolean(applicantPanDocument);

  const handleViewApplicantPan = () => {
    if (!applicantPanUrl) {
      setMessageType("error");
      setMessage("PAN card file is not available.");
      return;
    }

    window.open(applicantPanUrl, "_blank", "noopener,noreferrer");
  };

  const applicantAadhaarDocument = useMemo(() => {
    const matchedAadhaars = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("AADHAAR") ||
        documentName.includes("AADHAR") ||
        documentType.includes("AADHAAR") ||
        documentType.includes("AADHAR")
      );
    });

    return matchedAadhaars[0] || null;
  }, [uploadedDocuments]);

  const applicantAadhaarUrl = getDocumentImageUrl(applicantAadhaarDocument);
  const isApplicantAadhaarUploaded = Boolean(applicantAadhaarDocument);

  const handleViewApplicantAadhaar = () => {
    if (!applicantAadhaarUrl) {
      setMessageType("error");
      setMessage("Aadhaar document file is not available.");
      return;
    }

    window.open(applicantAadhaarUrl, "_blank", "noopener,noreferrer");
  };

  const applicantUdyamDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("UDYAM") ||
        documentType.includes("UDYAM") ||
        documentName.includes("MSME") ||
        documentType.includes("MSME")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantUdyamUrl = getDocumentImageUrl(applicantUdyamDocument);
  const isApplicantUdyamUploaded = Boolean(applicantUdyamDocument);

  const handleViewApplicantUdyam = () => {
    if (!applicantUdyamUrl) {
      setMessageType("error");
      setMessage("UDYAM Certificate file is not available.");
      return;
    }

    window.open(applicantUdyamUrl, "_blank", "noopener,noreferrer");
  };

  const applicantBusinessLicenseDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("BUSINESS_LICENSE") ||
        documentType.includes("BUSINESS_LICENSE") ||
        documentName.includes("BUSINESS LICENSE") ||
        documentName.includes("BUSINESS_LICENCE") ||
        documentName.includes("BUSINESS LICENCE") ||
        documentName.includes("TRADE_LICENSE") ||
        documentName.includes("TRADE LICENSE") ||
        documentName.includes("SHOP_ACT") ||
        documentName.includes("SHOP ACT") ||
        documentName.includes("GUMASTA") ||
        documentName.includes("LICENSE") ||
        documentName.includes("LICENCE") ||
        documentType.includes("LICENSE") ||
        documentType.includes("LICENCE")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantBusinessLicenseUrl = getDocumentImageUrl(
    applicantBusinessLicenseDocument,
  );
  const isApplicantBusinessLicenseUploaded = Boolean(
    applicantBusinessLicenseDocument,
  );

  const handleViewApplicantBusinessLicense = () => {
    if (!applicantBusinessLicenseUrl) {
      setMessageType("error");
      setMessage("Business License file is not available.");
      return;
    }

    window.open(applicantBusinessLicenseUrl, "_blank", "noopener,noreferrer");
  };

  const applicantAddressProofDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("ADDRESS_PROOF") ||
        documentType.includes("ADDRESS_PROOF") ||
        documentName.includes("ADDRESS PROOF") ||
        documentType.includes("ADDRESS PROOF") ||
        documentName.includes("ELECTRICITY_BILL") ||
        documentName.includes("VOTER") ||
        documentName.includes("PASSPORT")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantAddressProofUrl = getDocumentImageUrl(
    applicantAddressProofDocument,
  );
  const isApplicantAddressProofUploaded = Boolean(
    applicantAddressProofDocument,
  );

  const handleViewApplicantAddressProof = () => {
    if (!applicantAddressProofUrl) {
      setMessageType("error");
      setMessage("Address Proof file is not available.");
      return;
    }

    window.open(applicantAddressProofUrl, "_blank", "noopener,noreferrer");
  };

  const applicantBankStatementDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("BANK_STATEMENT") ||
        documentType.includes("BANK_STATEMENT") ||
        documentName.includes("BANK STATEMENT") ||
        documentType.includes("BANK STATEMENT") ||
        documentName.includes("BANK_PASSBOOK") ||
        documentName.includes("PASSBOOK")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantBankStatementUrl = getDocumentImageUrl(
    applicantBankStatementDocument,
  );
  const isApplicantBankStatementUploaded = Boolean(
    applicantBankStatementDocument,
  );

  const handleViewApplicantBankStatement = () => {
    if (!applicantBankStatementUrl) {
      setMessageType("error");
      setMessage("Bank Statement file is not available.");
      return;
    }

    window.open(applicantBankStatementUrl, "_blank", "noopener,noreferrer");
  };

  const applicantIncomeProofDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("INCOME_PROOF") ||
        documentType.includes("INCOME_PROOF") ||
        documentName.includes("INCOME PROOF") ||
        documentType.includes("INCOME PROOF") ||
        documentName.includes("SALARY_SLIP") ||
        documentName.includes("SALARY SLIP") ||
        documentName.includes("ITR") ||
        documentType.includes("ITR") ||
        documentName.includes("FORM 16")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantIncomeProofUrl = getDocumentImageUrl(
    applicantIncomeProofDocument,
  );
  const isApplicantIncomeProofUploaded = Boolean(applicantIncomeProofDocument);

  const handleViewApplicantIncomeProof = () => {
    if (!applicantIncomeProofUrl) {
      setMessageType("error");
      setMessage("Income Proof file is not available.");
      return;
    }

    window.open(applicantIncomeProofUrl, "_blank", "noopener,noreferrer");
  };

  const applicantBusinessProofDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("BUSINESS_PROOF") ||
        documentType.includes("BUSINESS_PROOF") ||
        documentName.includes("BUSINESS PROOF") ||
        documentType.includes("BUSINESS PROOF") ||
        documentName.includes("BUSINESS_LICENSE") ||
        documentType.includes("BUSINESS_LICENSE") ||
        documentName.includes("GST_CERTIFICATE") ||
        documentName.includes("GST")
      );
    });

    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantBusinessProofUrl = getDocumentImageUrl(
    applicantBusinessProofDocument,
  );
  const isApplicantBusinessProofUploaded = Boolean(
    applicantBusinessProofDocument,
  );

  const handleViewApplicantBusinessProof = () => {
    if (!applicantBusinessProofUrl) {
      setMessageType("error");
      setMessage("Business Proof file is not available.");
      return;
    }

    window.open(applicantBusinessProofUrl, "_blank", "noopener,noreferrer");
  };

  const applicantSaleDeedDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("SALE_DEED") ||
        documentType.includes("SALE_DEED") ||
        documentName.includes("SALE DEED") ||
        documentName.includes("TITLE_DEED") ||
        documentName.includes("TITLE DEED")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantSaleDeedUrl = getDocumentImageUrl(applicantSaleDeedDocument);
  const isApplicantSaleDeedUploaded = Boolean(applicantSaleDeedDocument);

  const handleViewApplicantSaleDeed = () => {
    if (!applicantSaleDeedUrl) {
      setMessageType("error");
      setMessage("Sale Deed file is not available.");
      return;
    }
    window.open(applicantSaleDeedUrl, "_blank", "noopener,noreferrer");
  };

  const applicantPropertyTaxReceiptDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("PROPERTY_TAX") ||
        documentType.includes("PROPERTY_TAX") ||
        documentName.includes("PROPERTY TAX") ||
        documentName.includes("TAX_RECEIPT") ||
        documentName.includes("TAX RECEIPT")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantPropertyTaxReceiptUrl = getDocumentImageUrl(
    applicantPropertyTaxReceiptDocument,
  );
  const isApplicantPropertyTaxReceiptUploaded = Boolean(
    applicantPropertyTaxReceiptDocument,
  );

  const handleViewApplicantPropertyTaxReceipt = () => {
    if (!applicantPropertyTaxReceiptUrl) {
      setMessageType("error");
      setMessage("Property Tax Receipt file is not available.");
      return;
    }
    window.open(
      applicantPropertyTaxReceiptUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const applicantKhataCertificateDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("KHATA") ||
        documentType.includes("KHATA") ||
        documentName.includes("KHATA_CERTIFICATE") ||
        documentName.includes("KHATA CERTIFICATE")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantKhataCertificateUrl = getDocumentImageUrl(
    applicantKhataCertificateDocument,
  );
  const isApplicantKhataCertificateUploaded = Boolean(
    applicantKhataCertificateDocument,
  );

  const handleViewApplicantKhataCertificate = () => {
    if (!applicantKhataCertificateUrl) {
      setMessageType("error");
      setMessage("Khata Certificate file is not available.");
      return;
    }
    window.open(applicantKhataCertificateUrl, "_blank", "noopener,noreferrer");
  };

  const applicantSurveySketchDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("SURVEY_SKETCH") ||
        documentType.includes("SURVEY_SKETCH") ||
        documentName.includes("SURVEY SKETCH") ||
        documentName.includes("SURVEY") ||
        documentType.includes("SURVEY")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantSurveySketchUrl = getDocumentImageUrl(
    applicantSurveySketchDocument,
  );
  const isApplicantSurveySketchUploaded = Boolean(
    applicantSurveySketchDocument,
  );

  const handleViewApplicantSurveySketch = () => {
    if (!applicantSurveySketchUrl) {
      setMessageType("error");
      setMessage("Survey Sketch file is not available.");
      return;
    }
    window.open(applicantSurveySketchUrl, "_blank", "noopener,noreferrer");
  };

  const applicantEcCertificateDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("EC_CERTIFICATE") ||
        documentType.includes("EC_CERTIFICATE") ||
        documentName.includes("EC CERTIFICATE") ||
        documentName.includes("ENCUMBRANCE") ||
        documentType.includes("ENCUMBRANCE")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantEcCertificateUrl = getDocumentImageUrl(
    applicantEcCertificateDocument,
  );
  const isApplicantEcCertificateUploaded = Boolean(
    applicantEcCertificateDocument,
  );

  const handleViewApplicantEcCertificate = () => {
    if (!applicantEcCertificateUrl) {
      setMessageType("error");
      setMessage("EC Certificate file is not available.");
      return;
    }
    window.open(applicantEcCertificateUrl, "_blank", "noopener,noreferrer");
  };

  const applicantApprovalPlanDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(
        doc.documentName || doc.document_name,
      );
      const documentType = normalizeDocumentValue(
        doc.documentType || doc.document_type,
      );
      return (
        documentName.includes("APPROVAL_PLAN") ||
        documentType.includes("APPROVAL_PLAN") ||
        documentName.includes("APPROVAL PLAN") ||
        documentName.includes("SANCTION_PLAN") ||
        documentName.includes("BLUEPRINT")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantApprovalPlanUrl = getDocumentImageUrl(
    applicantApprovalPlanDocument,
  );
  const isApplicantApprovalPlanUploaded = Boolean(
    applicantApprovalPlanDocument,
  );

  const handleViewApplicantApprovalPlan = () => {
    if (!applicantApprovalPlanUrl) {
      setMessageType("error");
      setMessage("Approval Plan file is not available.");
      return;
    }
    window.open(applicantApprovalPlanUrl, "_blank", "noopener,noreferrer");
  };

  const [otpVerified, setOtpVerified] = useState(false);
  const [aadhaarCooldownUntil, setAadhaarCooldownUntil] = useState(0);
  const [aadhaarCooldownSeconds, setAadhaarCooldownSeconds] = useState(0);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [formData, setFormData] = useState(
    location?.state?.formData
      ? { ...emptyForm, ...location.state.formData }
      : emptyForm,
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [emailOtpModal, setEmailOtpModal] = useState({
    open: false,
    sentEmailMasked: "",
    resendAfterSeconds: 0,
    expiresInSeconds: 0,
  });

  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [bankStatementFile, setBankStatementFile] = useState(null);
  const [incomeProofFile, setIncomeProofFile] = useState(null);
  const [businessProofFile, setBusinessProofFile] = useState(null);
  const [saleDeedFile, setSaleDeedFile] = useState(null);
  const [propertyTaxReceiptFile, setPropertyTaxReceiptFile] = useState(null);
  const [khataCertificateFile, setKhataCertificateFile] = useState(null);
  const [surveySketchFile, setSurveySketchFile] = useState(null);
  const [ecCertificateFile, setEcCertificateFile] = useState(null);
  const [approvalPlanFile, setApprovalPlanFile] = useState(null);
  const [udyamFile, setUdyamFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [otpPopup, setOtpPopup] = useState({
    open: false,
    title: "",
    body: "",
    severity: "info",
  });
  const [coApplicantOtpModal, setCoApplicantOtpModal] = useState({
    open: false,
    index: null,
    channel: "mobile",
    destination: "",
    otp: "",
    consentAccepted: false,
    error: "",
    verifying: false,
  });

  useEffect(() => {
    if (!aadhaarCooldownKey) {
      setAadhaarCooldownUntil(0);
      setAadhaarCooldownSeconds(0);
      return;
    }

    const savedUntil = Number(localStorage.getItem(aadhaarCooldownKey) || 0);

    if (savedUntil > Date.now()) {
      setAadhaarCooldownUntil(savedUntil);
    } else {
      localStorage.removeItem(aadhaarCooldownKey);
      setAadhaarCooldownUntil(0);
      setAadhaarCooldownSeconds(0);
    }
  }, [aadhaarCooldownKey]);

  useEffect(() => {
    if (!aadhaarCooldownUntil) {
      setAadhaarCooldownSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((aadhaarCooldownUntil - Date.now()) / 1000),
      );

      setAadhaarCooldownSeconds(remaining);

      if (remaining <= 0) {
        setAadhaarCooldownUntil(0);

        if (aadhaarCooldownKey) {
          localStorage.removeItem(aadhaarCooldownKey);
        }
      }
    };

    updateRemaining();

    const interval = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [aadhaarCooldownUntil, aadhaarCooldownKey]);

  const propertyTypeOptions = PROPERTY_TYPE[formData.propertyCategory] || [];

  const buildPayload = (isPatchUpdate = false, customFollowUp = null) => {
    const activeFollowUp = customFollowUp || followUpData;
    const basePayload = {
      customerName: formData.customerName.trim() || undefined,
      customerType: formData.customerType || undefined,
      dob: formData.dob ? String(formData.dob).slice(0, 10) : undefined,
      gender: formData.gender || undefined,
      maritalStatus: formData.maritalStatus || undefined,
      nationality: formData.nationality || undefined,
      mobile: formData.mobileNumber.trim() || undefined,
      email: formData.emailId.trim() || undefined,
      pan: formData.panNumber.trim() || undefined,
      aadhaarNumber: formData.aadhaarNumber.trim() || undefined,
      occupationType: formData.occupation,
      constitution: formData.constitution || undefined,
      businessName: formData.businessName.trim() || undefined,
      gstNumber: formData.gstNumber.trim() || undefined,
      natureOfBusiness:
        formData.natureOfBusiness === "Other"
          ? formData.otherNatureOfBusiness?.trim() || "Other"
          : formData.natureOfBusiness || undefined,
      businessVintage: formData.businessVintage?.trim() || undefined,
      businessAddress: formData.businessAddress?.trim() || undefined,
      udyamNumber: formData.udyamNumber?.trim() || undefined,
      monthlyIncome:
        formData.monthlyIncome !== "" &&
        formData.monthlyIncome !== null &&
        formData.monthlyIncome !== undefined
          ? Number(formData.monthlyIncome)
          : undefined,
      monthlySales:
        formData.monthlySales !== "" &&
        formData.monthlySales !== null &&
        formData.monthlySales !== undefined
          ? Number(formData.monthlySales)
          : undefined,
      monthlyProfit:
        formData.monthlyProfit !== "" &&
        formData.monthlyProfit !== null &&
        formData.monthlyProfit !== undefined
          ? Number(formData.monthlyProfit)
          : undefined,
      residenceAddressLine1:
        formData.residenceAddressLine1?.trim() || undefined,
      residenceAddressLine2:
        formData.residenceAddressLine2?.trim() || undefined,
      residenceLandmark: formData.residenceLandmark?.trim() || undefined,
      residenceCity: formData.residenceCity?.trim() || undefined,
      residenceDistrict: formData.residenceDistrict?.trim() || undefined,
      residenceState: formData.residenceState?.trim() || undefined,
      residencePincode: formData.residencePincode?.trim() || undefined,
      gramPanchayatCorporation: formData.gramPanchayatCorporation || undefined,
      gramPanchayatOrCorporation:
        formData.gramPanchayatCorporation || undefined,
      residenceType: formData.residenceType || undefined,
      propertyOwnerName: formData.propertyOwnerName?.trim() || undefined,
      relationshipWithApplicant:
        formData.relationshipWithApplicant || undefined,
      plotSize: formData.plotSize?.trim() || undefined,
      areaSqFt: formData.areaSqFt?.trim() || undefined,
      governmentValue:
        formData.governmentValue !== "" &&
        formData.governmentValue !== null &&
        formData.governmentValue !== undefined
          ? Number(formData.governmentValue)
          : undefined,
      typeOfStructure: formData.typeOfStructure || undefined,
      plotDemarcated: formData.plotDemarcated || undefined,
      propertyUsageType: formData.propertyUsageType || undefined,
      premisesType: formData.premisesType || undefined,
      occupiedBy: formData.occupiedBy?.trim() || undefined,
      constructionStatus: formData.constructionStatus || undefined,
      propertyCategory: formData.propertyCategory || undefined,
      propertyType: formData.propertyType
        ? `${formData.propertyCategory} - ${formData.propertyType}`
        : undefined,
      requestedAmount: formData.propertyValue
        ? String(formData.propertyValue)
        : "0",
      marketValue: formData.propertyValue
        ? Number(formData.propertyValue)
        : undefined,
      propertyAddress: formData.propertyAddress.trim() || undefined,
      propertyCity: formData.city.trim() || undefined,
      propertyState: formData.state.trim() || undefined,
      propertyPincode: formData.pinCode.trim() || undefined,
      nextFollowUpDate: activeFollowUp?.nextFollowUpDate || undefined,
      followUpTime: activeFollowUp?.followUpTime || undefined,
      followUpNotes: activeFollowUp?.followUpNotes || undefined,
      followUpStatus: activeFollowUp?.followUpStatus || undefined,
    };

    if (isPatchUpdate) {
      const allowedPatchFields = [
        "customerName",
        "customerType",
        "constitution",
        "dob",
        "gender",
        "maritalStatus",
        "nationality",
        "mobile",
        "email",
        "pan",
        "aadhaarNumber",
        "occupationType",
        "businessName",
        "gstNumber",
        "natureOfBusiness",
        "businessVintage",
        "businessAddress",
        "udyamNumber",
        "monthlyIncome",
        "monthlySales",
        "monthlyProfit",
        "residenceAddressLine1",
        "residenceAddressLine2",
        "residenceLandmark",
        "residenceCity",
        "residenceDistrict",
        "residenceState",
        "residencePincode",
        "gramPanchayatCorporation",
        "gramPanchayatOrCorporation",
        "residenceType",
        "propertyOwnerName",
        "relationshipWithApplicant",
        "plotSize",
        "areaSqFt",
        "governmentValue",
        "typeOfStructure",
        "plotDemarcated",
        "propertyUsageType",
        "premisesType",
        "occupiedBy",
        "constructionStatus",
        "propertyCategory",
        "propertyType",
        "requestedAmount",
        "marketValue",
        "propertyAddress",
        "propertyCity",
        "propertyState",
        "propertyPincode",
        "nextFollowUpDate",
        "followUpTime",
        "followUpNotes",
        "followUpStatus",
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

  const uploadCustomerPhotoMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!customerPhotoFile) {
        throw new Error("Please select customer photo.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading photo.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "PHOTO");
      payload.append("documentName", "Applicant Photo");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", customerPhotoFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },

    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Customer photo uploaded successfully.");
      setCustomerPhotoFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
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

  const uploadPanDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!panFile) {
        throw new Error("Please select PAN card file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading PAN.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "PAN");
      payload.append("documentName", "PAN Card");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", panFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("PAN card uploaded successfully.");
      setPanFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload PAN card.",
      );
    },
  });

  const handlePanFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPanFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = fileNameLower.endsWith(".pdf");
    const allowedTypes = ["application/pdf"];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only PDF files are allowed for PAN Card.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("PAN card file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setPanFile(file);
  };

  const uploadAadhaarDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!aadhaarFile) {
        throw new Error("Please select Aadhaar / Udyam Aadhaar file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Aadhaar.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "AADHAAR");
      payload.append("documentName", "Aadhaar Card");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", aadhaarFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Aadhaar document uploaded successfully.");
      setAadhaarFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Aadhaar document.",
      );
    },
  });

  const handleAadhaarFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setAadhaarFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = fileNameLower.endsWith(".pdf");
    const allowedTypes = ["application/pdf"];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only PDF files are allowed for Aadhaar Card.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Aadhaar card file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setAadhaarFile(file);
  };

  const uploadUdyamDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!udyamFile) {
        throw new Error("Please select UDYAM certificate file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading UDYAM Certificate.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "UDYAM_CERTIFICATE");
      payload.append("documentName", "UDYAM Certificate");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", udyamFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("UDYAM Certificate uploaded successfully.");
      setUdyamFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload UDYAM Certificate.",
      );
    },
  });

  const handleUdyamFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUdyamFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF UDYAM certificate files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("UDYAM certificate file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setUdyamFile(file);
  };

  const uploadBusinessLicenseDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!businessLicenseFile) {
        throw new Error("Please select Business License file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Business License.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "BUSINESS_LICENSE");
      payload.append("documentName", "Business License");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", businessLicenseFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Business License uploaded successfully.");
      setBusinessLicenseFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Business License.",
      );
    },
  });

  const handleBusinessLicenseFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setBusinessLicenseFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Business License files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Business License file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setBusinessLicenseFile(file);
  };

  const uploadAddressProofDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!addressProofFile) {
        throw new Error("Please select Address Proof file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Address Proof.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "ADDRESS_PROOF");
      payload.append("documentName", "Address Proof");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", addressProofFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Address Proof uploaded successfully.");
      setAddressProofFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Address Proof.",
      );
    },
  });

  const handleAddressProofFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setAddressProofFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Address Proof files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Address Proof file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setAddressProofFile(file);
  };

  const uploadBankStatementDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!bankStatementFile) {
        throw new Error("Please select Bank Statement file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Bank Statement.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "BANK_STATEMENT");
      payload.append("documentName", "Bank Statement");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", bankStatementFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Bank Statement uploaded successfully.");
      setBankStatementFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Bank Statement.",
      );
    },
  });

  const handleBankStatementFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setBankStatementFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Bank Statement files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Bank Statement file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setBankStatementFile(file);
  };

  const uploadIncomeProofDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!incomeProofFile) {
        throw new Error("Please select Income Proof file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Income Proof.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "INCOME_PROOF");
      payload.append("documentName", "Income Proof");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", incomeProofFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Income Proof uploaded successfully.");
      setIncomeProofFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Income Proof.",
      );
    },
  });

  const handleIncomeProofFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setIncomeProofFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Income Proof files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Income Proof file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setIncomeProofFile(file);
  };

  const uploadBusinessProofDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;

      if (!businessProofFile) {
        throw new Error("Please select Business Proof file.");
      }

      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Business Proof.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "BUSINESS_PROOF");
      payload.append("documentName", "Business Proof");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", businessProofFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Business Proof uploaded successfully.");
      setBusinessProofFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-documents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", targetId],
        }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Business Proof.",
      );
    },
  });

  const handleBusinessProofFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setBusinessProofFile(null);
      return;
    }

    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Business Proof files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 15 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Business Proof file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }

    setBusinessProofFile(file);
  };

  const uploadSaleDeedDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!saleDeedFile) {
        throw new Error("Please select Sale Deed file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Sale Deed.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "SALE_DEED");
      payload.append("documentName", "Sale Deed");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", saleDeedFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Sale Deed uploaded successfully.");
      setSaleDeedFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Sale Deed.",
      );
    },
  });

  const handleSaleDeedFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSaleDeedFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Sale Deed files are allowed.");
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Sale Deed file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setSaleDeedFile(file);
  };

  const uploadPropertyTaxReceiptDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!propertyTaxReceiptFile) {
        throw new Error("Please select Property Tax Receipt file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Property Tax Receipt.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "PROPERTY_TAX_RECEIPT");
      payload.append("documentName", "Property Tax Receipt");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", propertyTaxReceiptFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Property Tax Receipt uploaded successfully.");
      setPropertyTaxReceiptFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Property Tax Receipt.",
      );
    },
  });

  const handlePropertyTaxReceiptFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setPropertyTaxReceiptFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage(
        "Only JPG, PNG and PDF Property Tax Receipt files are allowed.",
      );
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Property Tax Receipt file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setPropertyTaxReceiptFile(file);
  };

  const uploadKhataCertificateDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!khataCertificateFile) {
        throw new Error("Please select Khata Certificate file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Khata Certificate.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "KHATA_CERTIFICATE");
      payload.append("documentName", "Khata Certificate");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", khataCertificateFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Khata Certificate uploaded successfully.");
      setKhataCertificateFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Khata Certificate.",
      );
    },
  });

  const handleKhataCertificateFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setKhataCertificateFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Khata Certificate files are allowed.");
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Khata Certificate file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setKhataCertificateFile(file);
  };

  const uploadSurveySketchDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!surveySketchFile) {
        throw new Error("Please select Survey Sketch file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Survey Sketch.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "SURVEY_SKETCH");
      payload.append("documentName", "Survey Sketch");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", surveySketchFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Survey Sketch uploaded successfully.");
      setSurveySketchFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Survey Sketch.",
      );
    },
  });

  const handleSurveySketchFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSurveySketchFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Survey Sketch files are allowed.");
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Survey Sketch file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setSurveySketchFile(file);
  };

  const uploadEcCertificateDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!ecCertificateFile) {
        throw new Error("Please select EC Certificate file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading EC Certificate.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "EC_CERTIFICATE");
      payload.append("documentName", "EC Certificate");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", ecCertificateFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("EC Certificate uploaded successfully.");
      setEcCertificateFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload EC Certificate.",
      );
    },
  });

  const handleEcCertificateFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setEcCertificateFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF EC Certificate files are allowed.");
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("EC Certificate file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setEcCertificateFile(file);
  };

  const uploadApprovalPlanDocumentMutation = useMutation({
    mutationFn: async () => {
      let targetApplicationId = createdApplicationId ?? applicationId;
      if (!approvalPlanFile) {
        throw new Error("Please select Approval Plan file.");
      }
      if (!targetApplicationId) {
        if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
          throw new Error(
            "Please enter Customer Name and Mobile Number before uploading Approval Plan.",
          );
        }
        const draftRes = unwrapResponse(
          await rmApi.saveDraft(buildPayload(false)),
        );
        const draftData = draftRes?.data ?? draftRes;
        targetApplicationId =
          draftData?.id ||
          draftData?.applicationId ||
          draftData?.application?.id;
        if (!targetApplicationId) {
          throw new Error("Could not initialize lead draft.");
        }
        setCreatedApplicationId(Number(targetApplicationId));
      }

      const payload = new FormData();
      payload.append("applicationId", String(Number(targetApplicationId)));
      payload.append("documentType", "APPROVAL_PLAN");
      payload.append("documentName", "Approval Plan");
      payload.append("documentSource", "RM_PORTAL");
      payload.append("file", approvalPlanFile);

      const res = await rmApi.uploadDocument(payload);
      return { res, targetApplicationId: Number(targetApplicationId) };
    },
    onSuccess: async (data) => {
      const targetId =
        data?.targetApplicationId || createdApplicationId || applicationId;
      if (targetId && !createdApplicationId) {
        setCreatedApplicationId(Number(targetId));
      }
      setMessageType("success");
      setMessage("Approval Plan uploaded successfully.");
      setApprovalPlanFile(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["application", targetId] }),
      ]);
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload Approval Plan.",
      );
    },
  });

  const handleApprovalPlanFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setApprovalPlanFile(null);
      return;
    }
    const fileNameLower = String(file.name || "").toLowerCase();
    const isExtensionValid = [".jpg", ".jpeg", ".png", ".pdf"].some((ext) =>
      fileNameLower.endsWith(ext),
    );
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Approval Plan files are allowed.");
      event.target.value = "";
      return;
    }
    const maximumFileSize = 15 * 1024 * 1024;
    if (file.size > maximumFileSize) {
      setMessageType("error");
      setMessage("Approval Plan file size must not exceed 15 MB.");
      event.target.value = "";
      return;
    }
    setApprovalPlanFile(file);
  };

  const [coApplicants, setCoApplicants] = useState([]);

  // Handler to update specific fields inside a specific co-applicant's index
  const handleCoApplicantChange = (index, event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "panNumber" || name === "gstNumber"
        ? value.toUpperCase()
        : value;

    const resetVerification =
      name === "mobile"
        ? { mobileVerified: false, mobileOtpSent: false, mobileOtp: "" }
        : name === "email"
          ? { emailVerified: false, emailOtpSent: false, emailOtp: "" }
          : name === "panNumber"
            ? { panVerified: false }
            : {};
    setCoApplicants((prev) =>
      prev.map((coApp, idx) =>
        idx === index
          ? { ...coApp, [name]: nextValue, ...resetVerification }
          : coApp,
      ),
    );
  };

  const updateCoApplicant = (index, patch) => {
    setCoApplicants((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const ensureCoApplicantIsSaved = async (index) => {
    const current = coApplicants[index];
    if (current?.id) return Number(current.id);

    let targetApplicationId = createdApplicationId ?? applicationId;
    if (!targetApplicationId) {
      const draftResponse = unwrapResponse(
        await rmApi.saveDraft(buildPayload(false)),
      );
      const draft = draftResponse?.data ?? draftResponse;
      targetApplicationId =
        draft?.id || draft?.applicationId || draft?.application?.id;
      if (!targetApplicationId) {
        throw new Error(
          "The draft was saved but no application ID was returned.",
        );
      }
      setCreatedApplicationId(Number(targetApplicationId));
      navigate(`/create-lead/${targetApplicationId}`, { replace: true });
    }

    const payload = buildCoApplicantsPayload().map((item, itemIndex) => ({
      ...item,
      // The legal name is replaced immediately after PAN OCR. The database row
      // must exist first so phone/email verification can be linked to it.
      name: item.name || `Co-applicant ${itemIndex + 1} - PAN pending`,
    }));
    const saveResponse = unwrapResponse(
      await rmApi.saveCoApplicantsBulk(targetApplicationId, payload),
    );
    const savedRows = saveResponse?.data ?? saveResponse ?? [];
    const saved = Array.isArray(savedRows) ? savedRows[index] : null;
    const savedId = Number(saved?.id);
    if (!Number.isInteger(savedId) || savedId <= 0) {
      throw new Error(
        "Co-applicant was saved but no co-applicant ID was returned.",
      );
    }
    setCoApplicants((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, id: savedId }
          : {
              ...item,
              id: savedRows[itemIndex]?.id || item.id,
            },
      ),
    );
    return savedId;
  };

  const handleCoApplicantMobileOtp = async (
    index,
    verify = false,
    otpOverride = "",
    consentAccepted = false,
  ) => {
    const coApp = coApplicants[index];
    if (!/^[6-9]\d{9}$/.test(String(coApp.mobile || "").trim())) {
      setMessageType("error");
      setMessage("Enter a valid 10-digit co-applicant mobile number.");
      return;
    }
    const enteredOtp = otpOverride || coApp.mobileOtp;
    if (verify && !consentAccepted) {
      throw new Error("Please accept the consent before verifying the OTP.");
    }
    if (verify && !/^\d{6}$/.test(String(enteredOtp || ""))) {
      setMessageType("error");
      setMessage("Enter the 6-digit mobile OTP.");
      return;
    }
    try {
      const coApplicantId = await ensureCoApplicantIsSaved(index);
      if (verify) {
        await rmApi.verifyCoApplicantMobileOtp(coApplicantId, {
          mobile: coApp.mobile.trim(),
          otp: enteredOtp,
          consentGiven: true,
          consentText: CONSENT_TEXT,
        });
        updateCoApplicant(index, { mobileVerified: true });
        setMessage("Co-applicant mobile number verified successfully.");
      } else {
        await rmApi.sendCoApplicantMobileOtp(coApplicantId, {
          mobile: coApp.mobile.trim(),
        });
        updateCoApplicant(index, { mobileOtpSent: true, mobileOtp: "" });
        setCoApplicantOtpModal({
          open: true,
          index,
          channel: "mobile",
          destination: `mobile ending ${coApp.mobile.slice(-4)}`,
          otp: "",
          consentAccepted: false,
          error: "",
          verifying: false,
        });
        setMessage("OTP sent to the co-applicant's mobile number.");
      }
      setMessageType("success");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Mobile verification failed.",
      );
      if (verify) throw error;
    }
  };

  const handleCoApplicantEmailOtp = async (
    index,
    verify = false,
    otpOverride = "",
    consentAccepted = false,
  ) => {
    const coApp = coApplicants[index];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(coApp.email || "").trim())) {
      setMessageType("error");
      setMessage("Enter a valid co-applicant email address.");
      return;
    }
    const enteredOtp = otpOverride || coApp.emailOtp;
    if (verify && !consentAccepted) {
      throw new Error("Please accept the consent before verifying the OTP.");
    }
    if (verify && !/^\d{6}$/.test(String(enteredOtp || ""))) {
      setMessageType("error");
      setMessage("Enter the 6-digit email OTP.");
      return;
    }
    try {
      const coApplicantId = await ensureCoApplicantIsSaved(index);
      if (verify) {
        await rmApi.verifyCoApplicantEmailOtp(coApplicantId, {
          email: coApp.email.trim(),
          otp: enteredOtp,
          sessionId: coApp.emailOtpSessionId,
          consentGiven: true,
          consentText: CONSENT_TEXT,
        });
        updateCoApplicant(index, { emailVerified: true });
        setMessage("Co-applicant email address verified successfully.");
      } else {
        const response = unwrapResponse(
          await rmApi.sendCoApplicantEmailOtp(coApplicantId, {
            email: coApp.email.trim(),
          }),
        );
        updateCoApplicant(index, {
          emailOtpSent: true,
          emailOtp: "",
          emailOtpSessionId:
            response?.data?.sessionId || response?.sessionId || null,
        });
        setCoApplicantOtpModal({
          open: true,
          index,
          channel: "email",
          destination: coApp.email,
          otp: "",
          consentAccepted: false,
          error: "",
          verifying: false,
        });
        setMessage("OTP sent to the co-applicant's email address.");
      }
      setMessageType("success");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Email verification failed.",
      );
      if (verify) throw error;
    }
  };

  const handleVerifyCoApplicantOtpModal = async () => {
    const modal = coApplicantOtpModal;
    if (!modal.consentAccepted) {
      setCoApplicantOtpModal((previous) => ({
        ...previous,
        error: "Please accept the consent to continue.",
      }));
      return;
    }
    if (!/^\d{6}$/.test(modal.otp)) {
      setCoApplicantOtpModal((previous) => ({
        ...previous,
        error: "Enter the valid 6-digit OTP you received.",
      }));
      return;
    }
    setCoApplicantOtpModal((previous) => ({
      ...previous,
      verifying: true,
      error: "",
    }));
    try {
      if (modal.channel === "mobile") {
        await handleCoApplicantMobileOtp(modal.index, true, modal.otp, true);
      } else {
        await handleCoApplicantEmailOtp(modal.index, true, modal.otp, true);
      }
      setCoApplicantOtpModal((previous) => ({
        ...previous,
        open: false,
        verifying: false,
      }));
    } catch (error) {
      setCoApplicantOtpModal((previous) => ({
        ...previous,
        verifying: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "OTP verification failed.",
      }));
    }
  };

  const handleCoApplicantPanOcr = async (index) => {
    const coApp = coApplicants[index];
    if (!coApp.panFile) {
      setMessageType("error");
      setMessage("Upload a clear image or PDF of the co-applicant's PAN card.");
      return;
    }
    updateCoApplicant(index, { panOcrLoading: true, panOcrError: "" });
    try {
      const payload = new FormData();
      payload.append("imageUrl", coApp.panFile);
      payload.append("clientRefId", String(coApp.id || `CO-PAN-${Date.now()}`));
      const response = unwrapResponse(await rmApi.panOcr(payload));
      const extracted = response?.data ?? response;
      const panNumber = readPanOcrValue(extracted, [
        "panNumber",
        "pan",
        "pan_number",
        "idNumber",
        "documentNumber",
      ]);
      const name = readPanOcrValue(extracted, [
        "name",
        "fullName",
        "customerName",
        "applicantName",
        "nameOnPan",
      ]);
      if (
        !name ||
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(panNumber).toUpperCase())
      ) {
        throw new Error(
          "We could not clearly read the PAN card. Please re-upload a clearer, glare-free image with all four corners visible.",
        );
      }
      updateCoApplicant(index, {
        name: String(name).trim(),
        panNumber: String(panNumber).trim().toUpperCase(),
        panOcrLoading: false,
        panOcrError: "",
      });
      setMessageType("success");
      setMessage(
        "PAN read successfully. Co-Applicant Name has been auto-filled.",
      );
    } catch (error) {
      const errorMessage =
        error?.message ||
        "We could not clearly read the PAN card. Please re-upload a clearer image.";
      updateCoApplicant(index, {
        panOcrLoading: false,
        panOcrError: errorMessage,
      });
      setMessageType("error");
      setMessage(errorMessage);
    }
  };

  const handleCoApplicantIdentityLink = async (index) => {
    const coApp = coApplicants[index];
    if (!coApp.mobileVerified || (coApp.email && !coApp.emailVerified)) {
      setMessageType("error");
      setMessage(
        "Verify the co-applicant's mobile number and email before sending the identity link.",
      );
      return;
    }
    try {
      const coApplicantId = await ensureCoApplicantIsSaved(index);
      await rmApi.initCoApplicantAadhaar(coApplicantId, {
        channel: "DIGILOCKER",
      });
      updateCoApplicant(index, { identityStatus: "INITIATED" });
      setMessageType("success");
      setMessage(
        "Secure DigiLocker identity link sent directly to the co-applicant.",
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send the identity verification link.",
      );
    }
  };

  const handleCoApplicantPanVerify = async (index) => {
    const coApp = coApplicants[index];
    if (
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        String(coApp.panNumber || "")
          .trim()
          .toUpperCase(),
      )
    ) {
      setMessageType("error");
      setMessage("Enter or extract a valid 10-character PAN number.");
      return;
    }
    if (!String(coApp.name || "").trim()) {
      setMessageType("error");
      setMessage(
        "Upload a clear PAN card so the legal name can be extracted before verification.",
      );
      return;
    }
    try {
      const coApplicantId = await ensureCoApplicantIsSaved(index);
      await rmApi.verifyCoApplicantPan(coApplicantId, {
        panNumber: coApp.panNumber.trim().toUpperCase(),
        name: coApp.name.trim(),
      });
      updateCoApplicant(index, { panVerified: true });
      setMessageType("success");
      setMessage("Co-applicant PAN verified successfully.");
    } catch (error) {
      updateCoApplicant(index, { panVerified: false });
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "PAN verification failed.",
      );
    }
  };

  // Append a new empty co-applicant structure to the array
  const handleAddCoApplicant = () => {
    setCoApplicants((prev) => [
      ...prev,
      {
        ...emptyCoApplicantForm,
        relationship: "SPOUSE",
        occupation: "SELF_EMPLOYED",
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
      id: coApp.id || undefined,
      name: coApp.name.trim(),
      mobile: coApp.mobile.trim(),
      email: coApp.email?.trim() || undefined,
      panNumber: coApp.panNumber?.trim().toUpperCase() || undefined,
      relationship: coApp.relationship,
      occupation: coApp.occupation || undefined,
      monthlyIncome: coApp.monthlyIncome
        ? Number(coApp.monthlyIncome)
        : undefined,
    }));
  };

  // Handler to update specific fields inside a specific contact person's index
  const handleContactPersonChange = (index, event) => {
    const { name, value } = event.target;
    setContactPersons((prev) =>
      prev.map((contact, idx) =>
        idx === index ? { ...contact, [name]: value } : contact,
      ),
    );
  };

  const buildContactPersonsPayload = (targetApplicationId) => {
    return contactPersons
      .filter((contact) => {
        return (
          String(contact.name || "").trim() ||
          String(contact.mobile || "").trim() ||
          String(contact.referenceType || "").trim()
        );
      })
      .map((contact) => ({
        id: contact.id || null,
        applicationId: Number(targetApplicationId),
        name: String(contact.name || "").trim(),
        mobile: String(contact.mobile || "").trim(),
        referenceType: contact.referenceType || "Purchaser",
        relationship:
          contact.referenceType || contact.relationship || "Purchaser",
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
        referenceType: "Purchaser",
        relationship: "Purchaser",
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

  const [familyMembers, setFamilyMembers] = useState([]);

  // Handler to update specific fields inside a specific family member's index
  const handleFamilyMemberChange = (index, event) => {
    const { name, value } = event.target;
    setFamilyMembers((prev) =>
      prev.map((member, idx) =>
        idx === index ? { ...member, [name]: value } : member,
      ),
    );
  };

  const buildFamilyMembersPayload = (targetApplicationId) => {
    return familyMembers
      .filter((member) => {
        return (
          String(member.name || "").trim() ||
          String(member.relation || "").trim() ||
          String(member.age || "").trim() ||
          String(member.occupation || "").trim() ||
          String(member.income || "").trim()
        );
      })
      .map((member) => ({
        id: member.id || undefined,
        applicationId: Number(targetApplicationId),
        name: String(member.name || "").trim(),
        relation: member.relation || "Brother",
        age:
          member.age !== "" &&
          member.age !== undefined &&
          !isNaN(Number(member.age))
            ? Number(member.age)
            : undefined,
        occupation: member.occupation
          ? String(member.occupation).trim()
          : undefined,
        income:
          member.income !== "" &&
          member.income !== undefined &&
          !isNaN(Number(member.income))
            ? Number(member.income)
            : undefined,
      }));
  };

  // Append a new empty family member structure to the array
  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: null,
        name: "",
        relation: "Brother",
        age: "",
        occupation: "",
        income: "",
      },
    ]);
  };

  // Remove a specific family member card by index
  const handleRemoveFamilyMember = async (index) => {
    const member = familyMembers[index];

    if (member?.id) {
      try {
        await rmApi.deleteFamilyMember(member.id);
      } catch (error) {
        setMessageType("error");
        setMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to delete family member.",
        );
        return;
      }
    }

    setFamilyMembers((prev) => prev.filter((_, idx) => idx !== index));
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
      application.propertyType || profile.propertyType || "",
    )
      .split(" - ")[0]
      .trim();

    const propertyCategory = normalizePropertyCategory(
      application.propertyCategory ||
        profile.propertyCategory ||
        categoryFromType,
    );

    const propertyType = normalizePropertyType(
      application.propertyType || profile.propertyType,
      propertyCategory,
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

      customerType:
        application.customerType || profile.customerType || "INDIVIDUAL",

      dob:
        application.dob ||
        profile.dob ||
        (application.dateOfBirth
          ? String(application.dateOfBirth).slice(0, 10)
          : "") ||
        (profile.dob ? String(profile.dob).slice(0, 10) : "") ||
        "",

      gender: application.gender || profile.gender || "",

      maritalStatus: application.maritalStatus || profile.maritalStatus || "",

      nationality: application.nationality || profile.nationality || "INDIAN",

      mobileNumber:
        application.mobile || application.mobileNumber || profile.mobile || "",

      emailId: application.email || application.emailId || profile.email || "",

      panNumber:
        application.pan || application.panNumber || profile.panNumber || "",

      aadhaarNumber: application.aadhaarNumber || profile.aadhaarNumber || "",

      occupation:
        application.occupationType ||
        profile.occupationType ||
        application.occupation ||
        "SELF_EMPLOYED",

      constitution:
        application.constitution || profile.constitution || "INDIVIDUAL",

      businessName: application.businessName || profile.businessName || "",
      gstNumber:
        application.gstNumber ||
        application.gst_number ||
        profile.gstNumber ||
        profile.gst_number ||
        "",

      natureOfBusiness: (() => {
        const raw =
          application.natureOfBusiness ||
          profile.natureOfBusiness ||
          application.nature_of_business ||
          profile.nature_of_business ||
          "";
        if (!raw) return "";
        return NATURE_OF_BUSINESS_OPTIONS.includes(raw) ? raw : "Other";
      })(),

      otherNatureOfBusiness: (() => {
        const raw =
          application.natureOfBusiness ||
          profile.natureOfBusiness ||
          application.nature_of_business ||
          profile.nature_of_business ||
          "";
        if (!raw) return "";
        return NATURE_OF_BUSINESS_OPTIONS.includes(raw) ? "" : raw;
      })(),

      businessVintage:
        application.businessVintage ||
        profile.businessVintage ||
        application.business_vintage ||
        profile.business_vintage ||
        "",

      businessAddress:
        application.businessAddress ||
        profile.businessAddress ||
        application.business_address ||
        profile.business_address ||
        "",

      udyamNumber:
        application.udyamNumber ||
        profile.udyamNumber ||
        application.udyam_number ||
        profile.udyam_number ||
        "",

      monthlyIncome:
        application.monthlyIncome ??
        profile.monthlyIncome ??
        application.monthly_income ??
        profile.monthly_income ??
        "",

      monthlySales:
        application.monthlySales ??
        profile.monthlySales ??
        application.monthly_sales ??
        profile.monthly_sales ??
        "",

      monthlyProfit:
        application.monthlyProfit ??
        profile.monthlyProfit ??
        application.monthly_profit ??
        profile.monthly_profit ??
        "",

      residenceAddressLine1:
        application.residenceAddressLine1 ||
        profile.residenceAddressLine1 ||
        application.residence_address_line1 ||
        profile.residence_address_line1 ||
        profile.currentAddress ||
        "",

      residenceAddressLine2:
        application.residenceAddressLine2 ||
        profile.residenceAddressLine2 ||
        application.residence_address_line2 ||
        profile.residence_address_line2 ||
        "",

      residenceLandmark:
        application.residenceLandmark ||
        profile.residenceLandmark ||
        application.residence_landmark ||
        profile.residence_landmark ||
        "",

      residenceCity:
        application.residenceCity ||
        profile.residenceCity ||
        application.residence_city ||
        profile.residence_city ||
        profile.currentCity ||
        "",

      residenceDistrict:
        application.residenceDistrict ||
        profile.residenceDistrict ||
        application.residence_district ||
        profile.residence_district ||
        "",

      residenceState:
        application.residenceState ||
        profile.residenceState ||
        application.residence_state ||
        profile.residence_state ||
        profile.currentState ||
        "",

      residencePincode:
        application.residencePincode ||
        profile.residencePincode ||
        application.residence_pincode ||
        profile.residence_pincode ||
        profile.currentPincode ||
        "",

      gramPanchayatCorporation:
        application.gramPanchayatOrCorporation ||
        profile.gramPanchayatOrCorporation ||
        application.gram_panchayat_or_corporation ||
        profile.gram_panchayat_or_corporation ||
        "",

      residenceType:
        application.residenceType ||
        profile.residenceType ||
        application.residence_type ||
        profile.residence_type ||
        "",

      propertyOwnerName:
        application.propertyOwnerName ||
        profile.propertyOwnerName ||
        application.property_owner_name ||
        profile.property_owner_name ||
        "",

      relationshipWithApplicant:
        application.relationshipWithApplicant ||
        profile.relationshipWithApplicant ||
        application.relationship_with_applicant ||
        profile.relationship_with_applicant ||
        "",

      plotSize:
        application.plotSize ||
        profile.plotSize ||
        application.plot_size ||
        profile.plot_size ||
        "",

      areaSqFt:
        application.areaSqFt ||
        profile.areaSqFt ||
        application.area_sq_ft ||
        profile.area_sq_ft ||
        "",

      governmentValue:
        application.governmentValue ??
        profile.governmentValue ??
        application.government_value ??
        profile.government_value ??
        "",

      typeOfStructure:
        application.typeOfStructure ||
        profile.typeOfStructure ||
        application.type_of_structure ||
        profile.type_of_structure ||
        "",

      plotDemarcated:
        application.plotDemarcated ||
        profile.plotDemarcated ||
        application.plot_demarcated ||
        profile.plot_demarcated ||
        "",

      propertyUsageType:
        application.propertyUsageType ||
        profile.propertyUsageType ||
        application.property_usage_type ||
        profile.property_usage_type ||
        "",

      premisesType:
        application.premisesType ||
        profile.premisesType ||
        application.premises_type ||
        profile.premises_type ||
        "",

      occupiedBy:
        application.occupiedBy ||
        profile.occupiedBy ||
        application.occupied_by ||
        profile.occupied_by ||
        "",

      constructionStatus:
        application.constructionStatus ||
        profile.constructionStatus ||
        application.construction_status ||
        profile.construction_status ||
        "",

      propertyCategory,

      propertyType,

      propertyValue:
        application.marketValue ??
        application.propertyValue ??
        profile.marketValue ??
        "",

      propertyAddress:
        application.propertyAddress || profile.propertyAddress || "",

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
        toBoolean(profile.panVerified),
    );

    setOtpVerified(
      toBoolean(application.mobileVerified) ||
        toBoolean(application.customerProfile?.mobileVerified) ||
        toBoolean(profile.mobileVerified),
    );

    setEmailOtpVerified(
      toBoolean(application.emailVerified) ||
        toBoolean(application.customerProfile?.emailVerified) ||
        toBoolean(profile.emailVerified),
    );
  }, [applicationId, applicationQuery.data]);

  useEffect(() => {
    if (!emailOtpModal.open || emailOtpModal.resendAfterSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setEmailOtpModal((previous) => ({
        ...previous,
        resendAfterSeconds: Math.max(previous.resendAfterSeconds - 1, 0),
      }));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [emailOtpModal.open, emailOtpModal.resendAfterSeconds]);

  useEffect(() => {
    if (!applicationId) return;

    const applicationResponse = unwrapResponse(applicationQuery.data);
    const application = applicationResponse?.data ?? applicationResponse ?? {};

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
  }, [applicationId, applicationQuery.data, customerProfileQuery.data]);

  // Automatically load co-applicants from the DB for existing leads
  useEffect(() => {
    if (!applicationId) return;

    const fetchExistingCoApplicants = async () => {
      try {
        const response = await rmApi.getCoApplicants(applicationId);
        const result = unwrapResponse(response);
        const rows = result?.data ?? result ?? [];

        if (Array.isArray(rows) && rows.length > 0) {
          const statusRows = await Promise.all(
            rows.map(async (row) => {
              try {
                const statusResponse = unwrapResponse(
                  await rmApi.getCoApplicantAadhaarStatus(row.id),
                );
                return statusResponse?.data ?? statusResponse ?? {};
              } catch {
                return {};
              }
            }),
          );
          setCoApplicants(
            rows.map((row, rowIndex) => ({
              ...emptyCoApplicantForm,
              id: row.id,
              name: row.name || "",
              mobile: row.mobile || "",
              email: row.email || "",
              panNumber: row.panNumber || row.pan_number || "",
              relationship: row.relationship || "SPOUSE",
              occupation: row.occupation || "SELF_EMPLOYED",
              monthlyIncome: row.monthlyIncome ? String(row.monthlyIncome) : "",
              mobileVerified: statusRows[rowIndex]?.mobileStatus === "VERIFIED",
              emailVerified: statusRows[rowIndex]?.emailStatus === "VERIFIED",
              panVerified: statusRows[rowIndex]?.panStatus === "VERIFIED",
              identityStatus:
                statusRows[rowIndex]?.aadhaarStatus || "NOT_INITIATED",
            })),
          );
        }
      } catch (error) {
        console.error(
          "Failed to recover co-applicant dataset tracking lines:",
          error,
        );
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
              referenceType:
                row.referenceType ||
                row.reference_type ||
                row.relationship ||
                "Purchaser",
              relationship:
                row.referenceType ||
                row.reference_type ||
                row.relationship ||
                "Purchaser",
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load contact persons:", error);
      }
    };

    fetchExistingContactPersons();
  }, [applicationId]);

  // Family Members: Automatically load family members for existing leads
  useEffect(() => {
    if (!applicationId) return;

    const fetchExistingFamilyMembers = async () => {
      try {
        const response = await rmApi.getFamilyMembers(applicationId);
        const result = unwrapResponse(response);
        const rows = result?.data ?? result ?? [];

        if (Array.isArray(rows)) {
          setFamilyMembers(
            rows.map((row) => ({
              id: row.id,
              name: row.name || "",
              relation: row.relation || "Brother",
              age:
                row.age !== null && row.age !== undefined
                  ? String(row.age)
                  : "",
              occupation: row.occupation || "",
              income:
                row.income !== null && row.income !== undefined
                  ? String(row.income)
                  : "",
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load family members:", error);
      }
    };

    fetchExistingFamilyMembers();
  }, [applicationId]);

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

  const validateFullSubmission = () => {
    const errors = [];
    if (!formData.customerName.trim()) errors.push("Customer Name is required");
    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim()))
      errors.push("Valid Mobile number is required");
    if (!formData.occupation) errors.push("Occupation is required");
    if (!formData.propertyType?.trim())
      errors.push("Property Type is required");
    if (!formData.propertyValue) errors.push("Property Value is required");
    if (!formData.propertyAddress.trim())
      errors.push("Property Address is required");
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
        referenceType: contact.referenceType || "Purchaser",
        relationship:
          contact.referenceType || contact.relationship || "Purchaser",
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

  const saveFamilyMembersForApplication = async (targetApplicationId) => {
    if (!targetApplicationId) return;

    const payload = buildFamilyMembersPayload(targetApplicationId);

    for (const member of payload) {
      if (!member.name) continue;

      const finalPayload = {
        applicationId: Number(targetApplicationId),
        name: member.name,
        relation: member.relation || "Brother",
        age: member.age,
        occupation: member.occupation,
        income: member.income,
      };

      if (member.id) {
        await rmApi.updateFamilyMember(member.id, finalPayload);
      } else {
        await rmApi.createFamilyMember(finalPayload);
      }
    }
  };

  // =========================================================================
  // UPDATE 1: saveNewDraftMutation
  // =========================================================================
  const saveNewDraftMutation = useMutation({
    mutationFn: (customFollowUp) => {
      if (createdApplicationId != null) {
        return rmApi.updateApplication(
          createdApplicationId,
          buildPayload(true, customFollowUp),
        );
      }
      return rmApi.saveDraft(buildPayload(false, customFollowUp));
    },
    onSuccess: async (response) => {
      const result = unwrapResponse(response);
      const created = result?.data ?? result;
      const newApplicationId =
        created?.id || created?.applicationId || created?.application?.id;

      // --- FIXED INTEGRATION ROW ---
      const targetId =
        newApplicationId || createdApplicationId || applicationId;

      if (targetId) {
        try {
          await rmApi.saveCoApplicantsBulk(
            targetId,
            buildCoApplicantsPayload(),
          );
          await saveContactPersonsForApplication(targetId);
          await saveFamilyMembersForApplication(targetId);
        } catch (err) {
          console.error(
            "Co-applicant/contact person/family member synchronization failed during creation:",
            err,
          );
        }
      }
      // --- END FIXED INTEGRATION ---

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);

      setMessageType("success");
      setMessage("Draft entry and next follow-up saved successfully.");
      if (newApplicationId) {
        navigate(`/create-lead/${newApplicationId}`, { replace: true });
      } else {
        navigate("/my-leads", { replace: true });
      }
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message || "Failed running quick draft sync operation.",
      );
    },
  });

  // =========================================================================
  // UPDATE 2: updateDraftMutation
  // =========================================================================
  const updateDraftMutation = useMutation({
    mutationFn: (customFollowUp) =>
      rmApi.updateApplication(
        createdApplicationId ?? applicationId,
        buildPayload(true, customFollowUp),
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
          await rmApi.saveCoApplicantsBulk(
            targetId,
            buildCoApplicantsPayload(),
          );
          await saveContactPersonsForApplication(targetId);
          await saveFamilyMembersForApplication(targetId);
        } catch (err) {
          console.error(
            "Co-applicant/contact person/family member synchronization failed during update:",
            err,
          );
        }
      }
      // --- END FIXED INTEGRATION ---

      const idToInvalidate = createdApplicationId ?? applicationId;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["application", idToInvalidate],
        }),
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
      ]);
      setMessageType("success");
      setMessage("Draft and next follow-up updated successfully.");
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

      // Save co-applicants + contact persons + family members on final submit as well
      try {
        if (idToInvalidate) {
          await rmApi.saveCoApplicantsBulk(
            idToInvalidate,
            buildCoApplicantsPayload(),
          );
          await saveContactPersonsForApplication(idToInvalidate);
          await saveFamilyMembersForApplication(idToInvalidate);
        }
      } catch (err) {
        console.error(
          "Co-applicant/contact person/family member sync failed during submitDraft:",
          err,
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rm-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", idToInvalidate],
        }),
      ]);
      setMessageType("success");
      setMessage("✓ Submitted successfully.");
    },
    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.message ||
          "Submission returned structured validation exceptions.",
      );
    },
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "panNumber") {
      nextValue = value.toUpperCase();
      setPanVerified(false);
    } else if (name === "aadhaarNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 4);
    } else if (name === "gstNumber") {
      nextValue = value.toUpperCase();
    } else if (name === "residencePincode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
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

    if (!isWorkStarted) {
      setMessageType("error");
      setMessage(
        "You must start work / punch in before creating or updating leads.",
      );
      setShowStartModal(true);
      return;
    }

    if (!formData.customerName.trim()) {
      setMessageType("error");
      setMessage("Please enter Customer / Entity Name before saving draft.");
      return;
    }

    if (!formData.mobileNumber.trim()) {
      setMessageType("error");
      setMessage("Please enter Customer Mobile Number before saving draft.");
      return;
    }

    setFollowUpModalOpen(true);
  };

  const handleConfirmFollowUpAndSave = (scheduledData) => {
    setFollowUpData(scheduledData);
    setFollowUpModalOpen(false);

    if (createdApplicationId) {
      updateDraftMutation.mutate(scheduledData);
      return;
    }

    if (!applicationId) {
      saveNewDraftMutation.mutate(scheduledData);
    } else {
      updateDraftMutation.mutate(scheduledData);
    }
  };

  const handleSubmitForReview = () => {
    setMessage("");
    const idToSubmit = createdApplicationId ?? applicationId;

    if (!idToSubmit) {
      setMessageType("error");
      setMessage(
        "Please execute a 'Save Draft' sequence before invoking workflow evaluations.",
      );
      return;
    }
    if (!validateFullSubmission()) return;
    submitDraftMutation.mutate();
  };

  const isPending =
    saveNewDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    submitDraftMutation.isPending ||
    uploadPanDocumentMutation.isPending ||
    uploadAadhaarDocumentMutation.isPending ||
    uploadCustomerPhotoMutation.isPending;

  return (
    <div className="h-[calc(100vh-130px)] min-h-[520px] w-full bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden shadow-xs antialiased">
      {coApplicantOtpModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() =>
              !coApplicantOtpModal.verifying &&
              setCoApplicantOtpModal((previous) => ({
                ...previous,
                open: false,
              }))
            }
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Verify Co-Applicant{" "}
                    {coApplicantOtpModal.channel === "mobile"
                      ? "Mobile"
                      : "Email"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the OTP sent to {coApplicantOtpModal.destination}.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={coApplicantOtpModal.verifying}
                  onClick={() =>
                    setCoApplicantOtpModal((previous) => ({
                      ...previous,
                      open: false,
                    }))
                  }
                  className="text-xl text-slate-400 hover:text-slate-700 disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  6-digit OTP
                </label>
                <input
                  autoFocus
                  value={coApplicantOtpModal.otp}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCoApplicantOtpModal((previous) => ({
                      ...previous,
                      otp: event.target.value.replace(/\D/g, "").slice(0, 6),
                      error: "",
                    }))
                  }
                  placeholder="Enter OTP"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Co-Applicant Consent
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {CONSENT_TEXT}
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={coApplicantOtpModal.consentAccepted}
                    onChange={(event) =>
                      setCoApplicantOtpModal((previous) => ({
                        ...previous,
                        consentAccepted: event.target.checked,
                        error: "",
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  I have read and accept this consent for verification.
                </label>
              </div>
              {coApplicantOtpModal.error && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {coApplicantOtpModal.error}
                </div>
              )}
              <button
                type="button"
                onClick={handleVerifyCoApplicantOtpModal}
                disabled={
                  coApplicantOtpModal.verifying ||
                  !coApplicantOtpModal.consentAccepted ||
                  coApplicantOtpModal.otp.length !== 6
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {coApplicantOtpModal.verifying
                  ? "Verifying OTP..."
                  : "Verify OTP & Save Consent"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Server Errors Alert Popup Container */}
      {otpPopup.open /* && !otpModal.open */ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {otpPopup.title}
              </h3>
              <button
                type="button"
                onClick={() => setOtpPopup((p) => ({ ...p, open: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div
              className={`rounded-lg border p-4 text-sm ${otpPopup.severity === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}
            >
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

      {/* Follow-up Scheduling Modal on Save Draft */}
      <ScheduleFollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        onConfirm={handleConfirmFollowUpAndSave}
        customerName={formData.customerName}
        initialDate={followUpData.nextFollowUpDate}
        initialTime={followUpData.followUpTime}
        initialNotes={followUpData.followUpNotes}
        isSaving={
          saveNewDraftMutation.isPending || updateDraftMutation.isPending
        }
      />

      {/* Modern Lead Workspace Full-Page Layout */}
      <div className="w-full bg-white flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xs">
        {/* Fixed Page Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {applicationId ? "Modify Lead Workspace" : "Create Lead"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Add a new lead with complete details
            </p>
          </div>
        </div>

        {/* Global Notifications & Attendance Banner */}
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-3 space-y-2 empty:hidden">
          {!isWorkStarted && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Attendance Punch-In Required
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Please punch in your attendance before creating or saving
                    leads.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStartModal(true)}
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
              >
                Start Work Now ➔
              </button>
            </div>
          )}

          {message && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold shadow-xs ${
                messageType === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-rose-100 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Multi-Step Workspace Grid: Left Stepper Navigation + Right Form Content */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Vertical Stepper Navigation */}
          <CreateLeadStepper
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />

          {/* Right Column: Scrollable Step Form Content + Fixed Bottom Action Bar */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white overflow-hidden">
            {/* Scrollable Step Form Body */}
            <div
              id="create-lead-step-scroll-container"
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6"
            >
              {/* Step Section Header */}
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {STEPS[currentStep - 1]?.headerTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {STEPS[currentStep - 1]?.headerDesc}
                </p>
              </div>

              {/* STEP 1: BASIC INFORMATION & KYC */}
              {currentStep === 1 && (
                <Step1BasicInfo
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isApplicantPhotoUploaded={isApplicantPhotoUploaded}
                  handleViewApplicantPhoto={handleViewApplicantPhoto}
                  customerPhotoFile={customerPhotoFile}
                  handleCustomerPhotoChange={handleCustomerPhotoChange}
                  uploadCustomerPhotoMutation={uploadCustomerPhotoMutation}
                />
              )}

              {/* STEP 2: EMPLOYMENT, FINANCIALS & RESIDENCE */}
              {currentStep === 2 && (
                <Step2AdditionalDetails
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}

              {/* STEP 3: CO-APPLICANTS, REFERENCES & FAMILY */}
              {currentStep === 3 && (
                <Step3CoApplicants
                  coApplicants={coApplicants}
                  handleAddCoApplicant={handleAddCoApplicant}
                  handleCoApplicantChange={handleCoApplicantChange}
                  handleCoApplicantMobileOtp={handleCoApplicantMobileOtp}
                  handleCoApplicantEmailOtp={handleCoApplicantEmailOtp}
                  handleCoApplicantPanVerify={handleCoApplicantPanVerify}
                  updateCoApplicant={updateCoApplicant}
                  handleCoApplicantPanOcr={handleCoApplicantPanOcr}
                  handleCoApplicantIdentityLink={handleCoApplicantIdentityLink}
                  handleRemoveCoApplicant={handleRemoveCoApplicant}
                  contactPersons={contactPersons}
                  handleAddContactPerson={handleAddContactPerson}
                  handleContactPersonChange={handleContactPersonChange}
                  handleRemoveContactPerson={handleRemoveContactPerson}
                  familyMembers={familyMembers}
                  handleAddFamilyMember={handleAddFamilyMember}
                  handleFamilyMemberChange={handleFamilyMemberChange}
                  handleRemoveFamilyMember={handleRemoveFamilyMember}
                />
              )}

              {/* STEP 4: COLLATERAL PROPERTY DETAILS */}
              {currentStep === 4 && (
                <Step4CollateralDetails
                  formData={formData}
                  setFormData={setFormData}
                  handleInputChange={handleInputChange}
                  handleCategoryChange={handleCategoryChange}
                  propertyTypeOptions={propertyTypeOptions}
                />
              )}

              {/* STEP 5: ATTACHMENTS & DOCUMENTS */}
              {currentStep === 5 && (
                <Step5Attachments
                  isApplicantPanUploaded={isApplicantPanUploaded}
                  handleViewApplicantPan={handleViewApplicantPan}
                  panFile={panFile}
                  handlePanFileChange={handlePanFileChange}
                  uploadPanDocumentMutation={uploadPanDocumentMutation}
                  isApplicantAadhaarUploaded={isApplicantAadhaarUploaded}
                  handleViewApplicantAadhaar={handleViewApplicantAadhaar}
                  aadhaarFile={aadhaarFile}
                  handleAadhaarFileChange={handleAadhaarFileChange}
                  uploadAadhaarDocumentMutation={uploadAadhaarDocumentMutation}
                  isApplicantAddressProofUploaded={
                    isApplicantAddressProofUploaded
                  }
                  handleViewApplicantAddressProof={
                    handleViewApplicantAddressProof
                  }
                  addressProofFile={addressProofFile}
                  handleAddressProofFileChange={handleAddressProofFileChange}
                  uploadAddressProofDocumentMutation={
                    uploadAddressProofDocumentMutation
                  }
                  isApplicantUdyamUploaded={isApplicantUdyamUploaded}
                  handleViewApplicantUdyam={handleViewApplicantUdyam}
                  udyamFile={udyamFile}
                  handleUdyamFileChange={handleUdyamFileChange}
                  uploadUdyamDocumentMutation={uploadUdyamDocumentMutation}
                  isApplicantBusinessLicenseUploaded={
                    isApplicantBusinessLicenseUploaded
                  }
                  handleViewApplicantBusinessLicense={
                    handleViewApplicantBusinessLicense
                  }
                  businessLicenseFile={businessLicenseFile}
                  handleBusinessLicenseFileChange={
                    handleBusinessLicenseFileChange
                  }
                  uploadBusinessLicenseDocumentMutation={
                    uploadBusinessLicenseDocumentMutation
                  }
                  isApplicantBankStatementUploaded={
                    isApplicantBankStatementUploaded
                  }
                  handleViewApplicantBankStatement={
                    handleViewApplicantBankStatement
                  }
                  bankStatementFile={bankStatementFile}
                  handleBankStatementFileChange={handleBankStatementFileChange}
                  uploadBankStatementDocumentMutation={
                    uploadBankStatementDocumentMutation
                  }
                  isApplicantIncomeProofUploaded={
                    isApplicantIncomeProofUploaded
                  }
                  handleViewApplicantIncomeProof={
                    handleViewApplicantIncomeProof
                  }
                  incomeProofFile={incomeProofFile}
                  handleIncomeProofFileChange={handleIncomeProofFileChange}
                  uploadIncomeProofDocumentMutation={
                    uploadIncomeProofDocumentMutation
                  }
                  isApplicantBusinessProofUploaded={
                    isApplicantBusinessProofUploaded
                  }
                  handleViewApplicantBusinessProof={
                    handleViewApplicantBusinessProof
                  }
                  businessProofFile={businessProofFile}
                  handleBusinessProofFileChange={handleBusinessProofFileChange}
                  uploadBusinessProofDocumentMutation={
                    uploadBusinessProofDocumentMutation
                  }
                  isApplicantSaleDeedUploaded={isApplicantSaleDeedUploaded}
                  handleViewApplicantSaleDeed={handleViewApplicantSaleDeed}
                  saleDeedFile={saleDeedFile}
                  handleSaleDeedFileChange={handleSaleDeedFileChange}
                  uploadSaleDeedDocumentMutation={
                    uploadSaleDeedDocumentMutation
                  }
                  isApplicantPropertyTaxReceiptUploaded={
                    isApplicantPropertyTaxReceiptUploaded
                  }
                  handleViewApplicantPropertyTaxReceipt={
                    handleViewApplicantPropertyTaxReceipt
                  }
                  propertyTaxReceiptFile={propertyTaxReceiptFile}
                  handlePropertyTaxReceiptFileChange={
                    handlePropertyTaxReceiptFileChange
                  }
                  uploadPropertyTaxReceiptDocumentMutation={
                    uploadPropertyTaxReceiptDocumentMutation
                  }
                  isApplicantKhataCertificateUploaded={
                    isApplicantKhataCertificateUploaded
                  }
                  handleViewApplicantKhataCertificate={
                    handleViewApplicantKhataCertificate
                  }
                  khataCertificateFile={khataCertificateFile}
                  handleKhataCertificateFileChange={
                    handleKhataCertificateFileChange
                  }
                  uploadKhataCertificateDocumentMutation={
                    uploadKhataCertificateDocumentMutation
                  }
                  isApplicantSurveySketchUploaded={
                    isApplicantSurveySketchUploaded
                  }
                  handleViewApplicantSurveySketch={
                    handleViewApplicantSurveySketch
                  }
                  surveySketchFile={surveySketchFile}
                  handleSurveySketchFileChange={handleSurveySketchFileChange}
                  uploadSurveySketchDocumentMutation={
                    uploadSurveySketchDocumentMutation
                  }
                  isApplicantEcCertificateUploaded={
                    isApplicantEcCertificateUploaded
                  }
                  handleViewApplicantEcCertificate={
                    handleViewApplicantEcCertificate
                  }
                  ecCertificateFile={ecCertificateFile}
                  handleEcCertificateFileChange={handleEcCertificateFileChange}
                  uploadEcCertificateDocumentMutation={
                    uploadEcCertificateDocumentMutation
                  }
                  isApplicantApprovalPlanUploaded={
                    isApplicantApprovalPlanUploaded
                  }
                  handleViewApplicantApprovalPlan={
                    handleViewApplicantApprovalPlan
                  }
                  approvalPlanFile={approvalPlanFile}
                  handleApprovalPlanFileChange={handleApprovalPlanFileChange}
                  uploadApprovalPlanDocumentMutation={
                    uploadApprovalPlanDocumentMutation
                  }
                />
              )}

              {/* STEP 6: REVIEW & FINAL SUBMISSION */}
              {currentStep === 6 && (
                <Step6ReviewSubmit
                  formData={formData}
                  setCurrentStep={setCurrentStep}
                  coApplicants={coApplicants}
                  contactPersons={contactPersons}
                  familyMembers={familyMembers}
                  isApplicantPanUploaded={isApplicantPanUploaded}
                  isApplicantAadhaarUploaded={isApplicantAadhaarUploaded}
                  isApplicantPhotoUploaded={isApplicantPhotoUploaded}
                  isApplicantSaleDeedUploaded={isApplicantSaleDeedUploaded}
                  isApplicantPropertyTaxReceiptUploaded={
                    isApplicantPropertyTaxReceiptUploaded
                  }
                  isApplicantKhataCertificateUploaded={
                    isApplicantKhataCertificateUploaded
                  }
                  isApplicantApprovalPlanUploaded={
                    isApplicantApprovalPlanUploaded
                  }
                  isApplicantSurveySketchUploaded={
                    isApplicantSurveySketchUploaded
                  }
                  isApplicantEcCertificateUploaded={
                    isApplicantEcCertificateUploaded
                  }
                  isApplicantAddressProofUploaded={
                    isApplicantAddressProofUploaded
                  }
                  isApplicantBankStatementUploaded={
                    isApplicantBankStatementUploaded
                  }
                  isApplicantIncomeProofUploaded={
                    isApplicantIncomeProofUploaded
                  }
                  isApplicantBusinessProofUploaded={
                    isApplicantBusinessProofUploaded
                  }
                  isApplicantUdyamUploaded={isApplicantUdyamUploaded}
                  isApplicantBusinessLicenseUploaded={
                    isApplicantBusinessLicenseUploaded
                  }
                />
              )}
            </div>

            {/* Fixed Bottom Action Footer Bar */}
            <CreateLeadFooter
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              navigate={navigate}
              handleSaveDraft={handleSaveDraft}
              handleSubmitForReview={handleSubmitForReview}
              isPending={isPending}
              isWorkStarted={isWorkStarted}
              applicationId={applicationId}
              saveNewDraftMutation={saveNewDraftMutation}
              updateDraftMutation={updateDraftMutation}
              submitDraftMutation={submitDraftMutation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
