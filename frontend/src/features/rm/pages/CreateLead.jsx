import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { rmApi } from "../rmApi.js";
import {
  buildWorkflowTimeline,
  PROPERTY_CATEGORY,
  PROPERTY_TYPE,
} from "../rmUtils.js";
import { useAttendance } from "../../../context/AttendanceContext.jsx";
import ScheduleFollowUpModal from "../components/ScheduleFollowUpModal.jsx";
import PropertyAddressAutocomplete from "../components/PropertyAddressAutocomplete.jsx";

const NATURE_OF_BUSINESS_OPTIONS = [
  "Trading",
  "Manufacturing",
  "Services",
  "Retail",
  "Wholesale",
  "Professional Services",
  "Construction / Real Estate",
  "Transport / Logistics",
  "Agriculture / Allied Activities",
  "Hospitality / Restaurant",
  "Healthcare / Medical",
  "Education / Training",
  "IT / Software / Technology",
  "Financial Services",
  "Automobile / Dealership",
  "Textile / Garments",
  "FMCG / Consumer Goods",
  "E-commerce",
  "Import / Export",
  "Contractor",
  "Other",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const LOCAL_BODY_OPTIONS = [
  "Gram Panchayat",
  "Municipal Corporation",
  "Municipality / Municipal Council",
  "Town Panchayat / Cantonment Board",
];

const RESIDENCE_TYPE_OPTIONS = [
  "Owned",
  "Rented",
  "Family Owned",
  "Company Provided",
];

const REFERENCE_TYPE_OPTIONS = [
  "Purchaser",
  "Supplier",
  "Seller",
  "Customer",
  "Neighbour",
];

const FAMILY_RELATION_OPTIONS = [
  "Brother",
  "Sister",
  "Partner",
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
];

const PROPERTY_OWNER_RELATION_OPTIONS = [
  "Self",
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Partner",
  "Other",
];

const STRUCTURE_TYPE_OPTIONS = [
  "RCC",
  "Stone",
  "BB",
  "GI Sheet",
  "Plot",
  "Load Bearing",
  "Mangalore Tiles",
];

const PLOT_DEMARCATED_OPTIONS = ["Yes", "No"];

const PROPERTY_USAGE_TYPE_OPTIONS = [
  "SOCP",
  "Rented Residential",
  "Self Commercial",
  "Industrial Shed",
  "Vacant Land",
  "Residential",
];

const PREMISES_TYPE_OPTIONS = [
  "Raw House",
  "Flat",
  "Bungalow",
  "Shop",
  "Industrial",
  "Plot",
  "Office",
];

const CONSTRUCTION_STATUS_OPTIONS = ["Under Construction", "Completed"];

const emptyForm = {
  customerName: "",
  customerType: "INDIVIDUAL",
  dob: "",
  gender: "",
  maritalStatus: "",
  nationality: "INDIAN",
  mobileNumber: "",
  emailId: "",
  panNumber: "",
  aadhaarNumber: "",
  occupation: "SELF_EMPLOYED",
  constitution: "INDIVIDUAL",
  businessName: "",
  natureOfBusiness: "",
  otherNatureOfBusiness: "",
  businessVintage: "",
  businessAddress: "",
  udyamNumber: "",
  monthlyIncome: "",
  monthlySales: "",
  monthlyProfit: "",
  gstNumber: "",
  // 5. Address Details - Residence Address
  residenceAddressLine1: "",
  residenceAddressLine2: "",
  residenceLandmark: "",
  residenceCity: "",
  residenceDistrict: "",
  residenceState: "",
  residencePincode: "",
  gramPanchayatCorporation: "",
  residenceType: "",
  // 8. Property Details (LAP / Mortgage)
  propertyOwnerName: "",
  relationshipWithApplicant: "",
  plotSize: "",
  areaSqFt: "",
  governmentValue: "",
  // 9. Type of Structure
  typeOfStructure: "",
  // 10. Plot Demarcated
  plotDemarcated: "",
  // 11. Type of Usage of Entire Property
  propertyUsageType: "",
  // 12. Type of Premises
  premisesType: "",
  // 13. Property Occupancy
  occupiedBy: "",
  // 14. Construction Details
  constructionStatus: "",
  // Collateral Property
  propertyCategory: "Residential",
  propertyType: PROPERTY_TYPE.Residential?.[0] || "Independent House",
  propertyValue: "",
  propertyAddress: "",
  city: "",
  state: "",
  pinCode: "",
};

const emptyCoApplicantForm = {
  id: null,
  name: "",
  mobile: "",
  email: "",
  panNumber: "",
  aadhaarNumber: "",
  relationship: "",
  occupation: "",
  monthlyIncome: "",
  mobileOtp: "",
  mobileOtpSent: false,
  mobileVerified: false,
  emailOtp: "",
  emailOtpSent: false,
  emailVerified: false,
  panFile: null,
  panOcrLoading: false,
  panOcrError: "",
  identityStatus: "NOT_INITIATED",
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

function Field({
  label,
  children,
  containerClassName = "",
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children ? (
        children
      ) : (
        <input
          {...props}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${className}`}
        />
      )}
    </div>
  );
}

function Select({
  name,
  value,
  onChange,
  children,
  placeholder = "Select option",
  disabled = false,
  className = "",
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse children options
  const options = useMemo(() => {
    if (!children) return [];
    const childArray = Array.isArray(children) ? children : [children];
    return childArray
      .flat(Infinity)
      .filter((child) => child && child.props)
      .map((child) => ({
        value: child.props.value,
        label: child.props.children || child.props.label || String(child.props.value),
        disabled: child.props.disabled,
      }));
  }, [children]);

  // Find currently active option
  const selectedOption = options.find(
    (opt) => String(opt.value ?? "") === String(value ?? ""),
  );
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          name,
          value: optionValue,
        },
      });
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm font-normal shadow-2xs outline-none transition-all cursor-pointer ${
          isOpen
            ? "border-blue-600 ring-2 ring-blue-100 text-slate-900 shadow-sm"
            : "border-slate-300 text-slate-800 hover:border-slate-400"
        } ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${className}`}
        {...props}
      >
        <span
          className={`truncate ${
            !selectedOption || selectedOption.value === ""
              ? "text-slate-400 font-normal"
              : "text-slate-900 font-normal"
          }`}
        >
          {displayLabel}
        </span>
        <span
          className={`pointer-events-none ml-2 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Custom Styled Floating Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">
              No options available
            </div>
          ) : (
            options.map((opt, index) => {
              const isSelected =
                String(opt.value ?? "") === String(value ?? "");
              return (
                <button
                  key={`${opt.value}-${index}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-blue-600 shrink-0 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function CreateLead() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

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
    if (!document) return "";

    const directUrl = document.fileUrl || document.documentUrl || document.url;

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

  const applicantBusinessLicenseUrl = getDocumentImageUrl(applicantBusinessLicenseDocument);
  const isApplicantBusinessLicenseUploaded = Boolean(applicantBusinessLicenseDocument);

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

  const applicantAddressProofUrl = getDocumentImageUrl(applicantAddressProofDocument);
  const isApplicantAddressProofUploaded = Boolean(applicantAddressProofDocument);

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

  const applicantBankStatementUrl = getDocumentImageUrl(applicantBankStatementDocument);
  const isApplicantBankStatementUploaded = Boolean(applicantBankStatementDocument);

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

  const applicantIncomeProofUrl = getDocumentImageUrl(applicantIncomeProofDocument);
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

  const applicantBusinessProofUrl = getDocumentImageUrl(applicantBusinessProofDocument);
  const isApplicantBusinessProofUploaded = Boolean(applicantBusinessProofDocument);

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
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
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
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
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

  const applicantPropertyTaxReceiptUrl = getDocumentImageUrl(applicantPropertyTaxReceiptDocument);
  const isApplicantPropertyTaxReceiptUploaded = Boolean(applicantPropertyTaxReceiptDocument);

  const handleViewApplicantPropertyTaxReceipt = () => {
    if (!applicantPropertyTaxReceiptUrl) {
      setMessageType("error");
      setMessage("Property Tax Receipt file is not available.");
      return;
    }
    window.open(applicantPropertyTaxReceiptUrl, "_blank", "noopener,noreferrer");
  };

  const applicantKhataCertificateDocument = useMemo(() => {
    const matched = uploadedDocuments.filter((doc) => {
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
      return (
        documentName.includes("KHATA") ||
        documentType.includes("KHATA") ||
        documentName.includes("KHATA_CERTIFICATE") ||
        documentName.includes("KHATA CERTIFICATE")
      );
    });
    return matched[0] || null;
  }, [uploadedDocuments]);

  const applicantKhataCertificateUrl = getDocumentImageUrl(applicantKhataCertificateDocument);
  const isApplicantKhataCertificateUploaded = Boolean(applicantKhataCertificateDocument);

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
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
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

  const applicantSurveySketchUrl = getDocumentImageUrl(applicantSurveySketchDocument);
  const isApplicantSurveySketchUploaded = Boolean(applicantSurveySketchDocument);

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
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
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

  const applicantEcCertificateUrl = getDocumentImageUrl(applicantEcCertificateDocument);
  const isApplicantEcCertificateUploaded = Boolean(applicantEcCertificateDocument);

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
      const documentName = normalizeDocumentValue(doc.documentName || doc.document_name);
      const documentType = normalizeDocumentValue(doc.documentType || doc.document_type);
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

  const applicantApprovalPlanUrl = getDocumentImageUrl(applicantApprovalPlanDocument);
  const isApplicantApprovalPlanUploaded = Boolean(applicantApprovalPlanDocument);

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
      residenceAddressLine1: formData.residenceAddressLine1?.trim() || undefined,
      residenceAddressLine2: formData.residenceAddressLine2?.trim() || undefined,
      residenceLandmark: formData.residenceLandmark?.trim() || undefined,
      residenceCity: formData.residenceCity?.trim() || undefined,
      residenceDistrict: formData.residenceDistrict?.trim() || undefined,
      residenceState: formData.residenceState?.trim() || undefined,
      residencePincode: formData.residencePincode?.trim() || undefined,
      gramPanchayatCorporation: formData.gramPanchayatCorporation || undefined,
      gramPanchayatOrCorporation: formData.gramPanchayatCorporation || undefined,
      residenceType: formData.residenceType || undefined,
      propertyOwnerName: formData.propertyOwnerName?.trim() || undefined,
      relationshipWithApplicant: formData.relationshipWithApplicant || undefined,
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type) && !isExtensionValid) {
      setMessageType("error");
      setMessage("Only JPG, PNG and PDF Property Tax Receipt files are allowed.");
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
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
      const targetId = data?.targetApplicationId || createdApplicationId || applicationId;
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
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
        relationship: contact.referenceType || contact.relationship || "Purchaser",
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
        age: member.age !== "" && member.age !== undefined && !isNaN(Number(member.age)) ? Number(member.age) : undefined,
        occupation: member.occupation ? String(member.occupation).trim() : undefined,
        income: member.income !== "" && member.income !== undefined && !isNaN(Number(member.income)) ? Number(member.income) : undefined,
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
        application.constitution ||
        profile.constitution ||
        "INDIVIDUAL",

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
              age: row.age !== null && row.age !== undefined ? String(row.age) : "",
              occupation: row.occupation || "",
              income: row.income !== null && row.income !== undefined ? String(row.income) : "",
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
        relationship: contact.referenceType || contact.relationship || "Purchaser",
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
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {applicationId ? "Modify Lead Workspace" : "New Loan Application"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in information parameters to initiate property loan
            underwriting creation rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveDraft}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveNewDraftMutation.isPending || updateDraftMutation.isPending
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={isPending || !applicationId}
            onClick={handleSubmitForReview}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {submitDraftMutation.isPending
              ? "Submitting..."
              : "Submit for Underwriting"}
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
                const firstPendingIndex = leadJourney.findIndex(
                  (step) => !step.completed,
                );
                const isCurrent =
                  !item.completed && index === firstPendingIndex;

                return (
                  <div
                    key={item.key || item.label}
                    className="relative flex flex-1 flex-col items-center text-center"
                  >
                    {index !== leadJourney.length - 1 && (
                      <div
                        className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${
                          leadJourney[index + 1]?.completed
                            ? "bg-emerald-500"
                            : "bg-slate-100"
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
                        <svg
                          className="h-3.5 w-3.5"
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
                      className={`mt-2 px-2 text-xs font-medium ${item.completed || isCurrent ? "text-slate-800 font-semibold" : "text-slate-400"}`}
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* Work Not Started Warning Banner */}
      {!isWorkStarted && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-lg">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Attendance Punch-In Required
              </h4>
              <p className="text-xs text-amber-800">
                You have not started your work session for today. Please punch
                in your attendance before creating or saving leads.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 shrink-0"
          >
            Start Work Now ➔
          </button>
        </div>
      )}

      {/* Global Toast Alert Messages */}
      {message && (
        <div
          className={`rounded-lg border p-4 text-xs font-semibold shadow-xs ${
            messageType === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Main Core Form Inputs Viewport Layout matching image guidelines */}
      <div className="space-y-6">
        <Section title="Primary Applicant Information">
          {/* Sub-Section 1: BASIC INFORMATION */}
          <div className="col-span-full space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-2 w-1 rounded-full bg-blue-600" />
                Basic Information
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
              <Field
                containerClassName="md:col-span-1"
                label={
                  <>
                    Customer / Entity Name
                    <span className="text-red-600 font-bold"> *</span>
                  </>
                }
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                placeholder="Enter customer / entity name"
              />

              <Field
                containerClassName="md:col-span-1"
                label={
                  <>
                    Customer Type
                    <span className="text-red-600 font-bold"> *</span>
                  </>
                }
              >
                <Select
                  name="customerType"
                  value={formData.customerType || "INDIVIDUAL"}
                  onChange={handleInputChange}
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="PROPRIETORSHIP">Proprietor</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="COMPANY">Company</option>
                </Select>
              </Field>

              <Field
                containerClassName="md:col-span-1"
                label={
                  <>
                    Date of Birth
                    <span className="text-red-600 font-bold"> *</span>
                  </>
                }
                type="date"
                name="dob"
                value={formData.dob ? String(formData.dob).slice(0, 10) : ""}
                onChange={handleInputChange}
              />

              <Field containerClassName="md:col-span-1" label="Gender">
                <Select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>

              <Field containerClassName="md:col-span-1" label="Marital Status">
                <Select
                  name="maritalStatus"
                  value={formData.maritalStatus || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Marital Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorce</option>
                  <option value="WIDOWED">Widow</option>
                </Select>
              </Field>

              <Field containerClassName="md:col-span-1" label="Nationality">
                <Select
                  name="nationality"
                  value={formData.nationality || "INDIAN"}
                  onChange={handleInputChange}
                >
                  <option value="INDIAN">Indian</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Sub-Section 2: CONTACT INFORMATION */}
          <div className="col-span-full space-y-4 pt-3 border-t border-slate-100">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-2 w-1 rounded-full bg-blue-600" />
                Contact Information
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
              <Field
                containerClassName="md:col-span-1"
                label={
                  <>
                    Mobile Number
                    <span className="text-red-600 font-bold"> *</span>
                  </>
                }
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                maxLength={10}
                inputMode="numeric"
                required
                placeholder="Enter 10-digit number"
              />

              <Field
                containerClassName="md:col-span-1"
                label={
                  <>
                    Email Id
                    <span className="text-red-600 font-bold"> *</span>
                  </>
                }
                type="email"
                name="emailId"
                value={formData.emailId || ""}
                onChange={handleInputChange}
                maxLength={255}
                autoComplete="email"
                placeholder="name@domain.com"
                required
              />
            </div>
          </div>

          {/* Sub-Section 3: KYC DETAILS */}
          <div className="col-span-full space-y-4 pt-3 border-t border-slate-100">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-2 w-1 rounded-full bg-blue-600" />
                KYC Details
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {/* Left Side Column: PAN Block */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-3.5 sm:p-4 shadow-2xs">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    PAN Number *
                  </label>
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-1.5">
                    <input
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 sm:px-4 py-2.5 text-sm uppercase font-normal tracking-wider text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* PAN Document Upload Section (Image and PDF) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Upload PAN Card (Image / PDF)
                    </span>
                    {isApplicantPanUploaded && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                          Uploaded
                        </span>
                        <button
                          type="button"
                          onClick={handleViewApplicantPan}
                          className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                        >
                          View PAN
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handlePanFileChange}
                      />
                      <span className="truncate max-w-[200px]">
                        {panFile ? panFile.name : "Choose File (Image / PDF)"}
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!panFile || uploadPanDocumentMutation.isPending}
                      onClick={() => uploadPanDocumentMutation.mutate()}
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
                    >
                      {uploadPanDocumentMutation.isPending
                        ? "Uploading..."
                        : "Upload"}
                    </button>
                  </div>

                  {panFile && (
                    <p className="text-[11px] font-medium text-slate-600 truncate">
                      Selected:{" "}
                      <span className="font-semibold text-slate-800">
                        {panFile.name}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side Column: Aadhaar / Udyam Aadhaar Box */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-3.5 sm:p-4 shadow-2xs">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Aadhaar / Udyam Aadhaar (Last 4 Digits) *
                  </label>
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-1.5">
                    <input
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber || ""}
                      onChange={handleInputChange}
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="e.g. 1234"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 sm:px-4 py-2.5 text-sm font-normal tracking-widest text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* Aadhaar / Udyam Aadhaar Document Upload Section (Image and PDF) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Upload Aadhaar / Udyam (Image / PDF)
                    </span>
                    {isApplicantAadhaarUploaded && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                          Uploaded
                        </span>
                        <button
                          type="button"
                          onClick={handleViewApplicantAadhaar}
                          className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                        >
                          View Aadhaar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleAadhaarFileChange}
                      />
                      <span className="truncate max-w-[200px]">
                        {aadhaarFile
                          ? aadhaarFile.name
                          : "Choose File (Image / PDF)"}
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={
                        !aadhaarFile || uploadAadhaarDocumentMutation.isPending
                      }
                      onClick={() => uploadAadhaarDocumentMutation.mutate()}
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
                    >
                      {uploadAadhaarDocumentMutation.isPending
                        ? "Uploading..."
                        : "Upload"}
                    </button>
                  </div>

                  {aadhaarFile && (
                    <p className="text-[11px] font-medium text-slate-600 truncate">
                      Selected:{" "}
                      <span className="font-semibold text-slate-800">
                        {aadhaarFile.name}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Profile Photo Management Panel */}
            <div className="rounded-2xl border border-slate-300 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-3xs">
                  <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                    IMG
                  </span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">
                    Biometric Photo
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
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

              <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[210px]">
                <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors whitespace-nowrap">
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
                  disabled={
                    !customerPhotoFile || uploadCustomerPhotoMutation.isPending
                  }
                  onClick={() => uploadCustomerPhotoMutation.mutate()}
                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 sm:py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-all active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 whitespace-nowrap"
                >
                  {uploadCustomerPhotoMutation.isPending
                    ? "Uploading..."
                    : "Upload"}
                </button>
              </div>
            </div>

            {customerPhotoFile && (
              <div className="rounded-xl bg-blue-50/50 px-3 py-1.5 border border-blue-100 text-[11px] font-medium text-blue-700 truncate w-full sm:max-w-sm">
                Staged:{" "}
                <span className="font-bold">{customerPhotoFile.name}</span>
              </div>
            )}
          </div>

          {/* Sub-Section 4: EMPLOYMENT & BUSINESS INFORMATION */}
          <div className="col-span-full space-y-5 pt-3 border-t border-slate-100">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-2 w-1 rounded-full bg-blue-600" />
                Employment &amp; Business Information
              </h4>
            </div>

            {/* Core Business & Profile Inputs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Occupation">
                <Select
                  name="occupation"
                  value={formData.occupation || "SELF_EMPLOYED"}
                  onChange={handleInputChange}
                >
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS">Business</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="AGRICULTURE">Agriculture</option>
                  <option value="RETIRED">Retired</option>
                  <option value="OTHER">Others</option>
                </Select>
              </Field>

              <Field label="Constitution">
                <Select
                  name="constitution"
                  value={formData.constitution || "INDIVIDUAL"}
                  onChange={handleInputChange}
                >
                  <option value="PROPRIETORSHIP">Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PVT_LTD">Pvt Ltd</option>
                  <option value="LLP">LLP</option>
                  <option value="INDIVIDUAL">Individual</option>
                </Select>
              </Field>

              <Field
                label="Employer / Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Enter employer or business name"
              />

              <Field label="Nature of Business">
                <Select
                  name="natureOfBusiness"
                  value={formData.natureOfBusiness}
                  onChange={handleInputChange}
                >
                  <option value="">Select Nature of Business</option>
                  {NATURE_OF_BUSINESS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>

              {formData.natureOfBusiness === "Other" && (
                <Field
                  label="Specify Nature of Business"
                  name="otherNatureOfBusiness"
                  value={formData.otherNatureOfBusiness}
                  onChange={handleInputChange}
                  placeholder="Enter specific business category"
                />
              )}

              <Field
                label="Business Vintage"
                name="businessVintage"
                value={formData.businessVintage}
                onChange={handleInputChange}
                placeholder="e.g. 5 Years"
              />

              <Field
                label="UDYAM Number"
                name="udyamNumber"
                value={formData.udyamNumber}
                onChange={handleInputChange}
                placeholder="e.g. UDYAM-MH-01-0012345"
                className="uppercase tracking-wider font-normal"
              />

              {/* GST Identification Block */}
              <Field label="GST Number">
                <input
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase tracking-wider text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <div className="sm:col-span-2 lg:col-span-3">
                <Field
                  label="Business Address"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="Complete business or office address with landmark"
                />
              </div>
            </div>

            {/* Monthly Financials Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Monthly Financial Overview
                </h5>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Monthly Income (₹)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={formData.monthlyIncome}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </Field>

                <Field label="Monthly Sales / Turnover (₹)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="monthlySales"
                      value={formData.monthlySales}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </Field>

                <Field label="Monthly Profit (₹)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="monthlyProfit"
                      value={formData.monthlyProfit}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Business Document Verification Cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* UDYAM Certificate Card */}
              <div className="flex flex-col justify-between gap-3.5 rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        UDYAM Certificate
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate">
                        MSME / Udyam Registration (PDF or Image)
                      </p>
                    </div>
                  </div>

                  {isApplicantUdyamUploaded ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                        Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={handleViewApplicantUdyam}
                        className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleUdyamFileChange}
                    />
                    <span className="truncate max-w-[200px]">
                      {udyamFile ? udyamFile.name : "Choose File (PDF / Image)"}
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!udyamFile || uploadUdyamDocumentMutation.isPending}
                    onClick={() => uploadUdyamDocumentMutation.mutate()}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
                  >
                    {uploadUdyamDocumentMutation.isPending ? "Uploading..." : "Upload"}
                  </button>
                </div>

                {udyamFile && (
                  <p className="text-[11px] font-medium text-slate-600 truncate">
                    Selected: <span className="font-semibold text-slate-800">{udyamFile.name}</span>
                  </p>
                )}
              </div>

              {/* Business License Card */}
              <div className="flex flex-col justify-between gap-3.5 rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        Business License / Shop Act
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate">
                        Trade License, Gumasta, or MOA/AOA (PDF or Image)
                      </p>
                    </div>
                  </div>

                  {isApplicantBusinessLicenseUploaded ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                        Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={handleViewApplicantBusinessLicense}
                        className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleBusinessLicenseFileChange}
                    />
                    <span className="truncate max-w-[200px]">
                      {businessLicenseFile ? businessLicenseFile.name : "Choose File (PDF / Image)"}
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!businessLicenseFile || uploadBusinessLicenseDocumentMutation.isPending}
                    onClick={() => uploadBusinessLicenseDocumentMutation.mutate()}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
                  >
                    {uploadBusinessLicenseDocumentMutation.isPending ? "Uploading..." : "Upload"}
                  </button>
                </div>

                {businessLicenseFile && (
                  <p className="text-[11px] font-medium text-slate-600 truncate">
                    Selected: <span className="font-semibold text-slate-800">{businessLicenseFile.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Section 5: ADDRESS DETAILS - RESIDENCE ADDRESS */}
          <div className="col-span-full space-y-4 pt-3 border-t border-slate-100">
            <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="h-2 w-1 rounded-full bg-blue-600" />
                5. Address Details
              </h4>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/80 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                Residence Address
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
              <Field
                containerClassName="md:col-span-2"
                label="Address Line 1"
                name="residenceAddressLine1"
                value={formData.residenceAddressLine1 || ""}
                onChange={handleInputChange}
                placeholder="House / Flat No., Building Name, Street"
              />

              <Field
                containerClassName="md:col-span-1"
                label="Address Line 2"
                name="residenceAddressLine2"
                value={formData.residenceAddressLine2 || ""}
                onChange={handleInputChange}
                placeholder="Area, Sector, Locality"
              />

              <Field
                containerClassName="md:col-span-1"
                label="Landmark"
                name="residenceLandmark"
                value={formData.residenceLandmark || ""}
                onChange={handleInputChange}
                placeholder="Nearby Landmark"
              />

              <Field
                containerClassName="md:col-span-1"
                label="City"
                name="residenceCity"
                value={formData.residenceCity || ""}
                onChange={handleInputChange}
                placeholder="City"
              />

              <Field
                containerClassName="md:col-span-1"
                label="District"
                name="residenceDistrict"
                value={formData.residenceDistrict || ""}
                onChange={handleInputChange}
                placeholder="District"
              />

              <Field containerClassName="md:col-span-1" label="State">
                <Select
                  name="residenceState"
                  value={formData.residenceState || ""}
                  onChange={handleInputChange}
                  placeholder="Select State"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                containerClassName="md:col-span-1"
                label="Pincode"
                name="residencePincode"
                value={formData.residencePincode || ""}
                onChange={handleInputChange}
                maxLength={6}
                inputMode="numeric"
                placeholder="6-digit Pincode"
              />

              <Field
                containerClassName="md:col-span-1"
                label="Gram Panchayat / Municipal Corporation"
              >
                <Select
                  name="gramPanchayatCorporation"
                  value={formData.gramPanchayatCorporation || ""}
                  onChange={handleInputChange}
                  placeholder="Select Option"
                >
                  <option value="">Select Option</option>
                  {LOCAL_BODY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                containerClassName="md:col-span-1"
                label="Residence Type"
              >
                <Select
                  name="residenceType"
                  value={formData.residenceType || ""}
                  onChange={handleInputChange}
                  placeholder="Select Residence Type"
                >
                  <option value="">Select Residence Type</option>
                  {RESIDENCE_TYPE_OPTIONS.map((resType) => (
                    <option key={resType} value={resType}>
                      {resType}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </Section>

        {/* Co-Applicants Multi-Card Management Workspace */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Co-Applicant Details
              </h4>
              <p className="text-xs text-slate-500">
                Add up to 3 joint/co-signing applicants to distribute collateral
                risk parameters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCoApplicant}
              disabled={coApplicants.length >= 3}
              className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Co-Applicant
            </button>
          </div>

          {coApplicants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
              No co-applicants added. Click the button above to add financial
              profile verification cards.
            </div>
          ) : (
            coApplicants.map((coApp, index) => (
              <div key={index} className="relative group">
                <Section title={`Co-Applicant Details ${index + 1}`}>
                  <Field
                    label="Co-Applicant Name (from PAN) *"
                    name="name"
                    value={coApp.name}
                    readOnly
                    placeholder="Auto-filled after PAN scan"
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </label>
                    <div className="flex gap-2">
                      <input
                        name="mobile"
                        value={coApp.mobile}
                        onChange={(e) => handleCoApplicantChange(index, e)}
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="10-digit mobile"
                        required
                        disabled={coApp.mobileVerified}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleCoApplicantMobileOtp(index)}
                        disabled={coApp.mobileVerified}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                      >
                        {coApp.mobileVerified
                          ? "Verified"
                          : coApp.mobileOtpSent
                            ? "Resend"
                            : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Email Address *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        name="email"
                        value={coApp.email}
                        onChange={(e) => handleCoApplicantChange(index, e)}
                        placeholder="name@domain.com"
                        disabled={coApp.emailVerified}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm disabled:bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleCoApplicantEmailOtp(index)}
                        disabled={coApp.emailVerified}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                      >
                        {coApp.emailVerified
                          ? "Verified"
                          : coApp.emailOtpSent
                            ? "Resend"
                            : "Send OTP"}
                      </button>
                    </div>
                  </div>

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
                    <span className="text-[11px] text-slate-500">
                      Enter PAN manually or upload the card below. Format:
                      ABCDE1234F.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCoApplicantPanVerify(index)}
                      disabled={coApp.panVerified}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                    >
                      {coApp.panVerified ? "PAN Verified" : "Verify PAN"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      PAN Card OCR *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) =>
                        updateCoApplicant(index, {
                          panFile: e.target.files?.[0] || null,
                          panOcrError: "",
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleCoApplicantPanOcr(index)}
                      disabled={coApp.panOcrLoading}
                      className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50"
                    >
                      {coApp.panOcrLoading
                        ? "Reading PAN..."
                        : "Extract PAN & Name"}
                    </button>
                    {coApp.panOcrError && (
                      <span className="text-[11px] text-rose-600">
                        {coApp.panOcrError}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                    <label className="text-xs font-semibold text-slate-700">
                      Identity Verification
                    </label>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      No Aadhaar number entry is required. A secure DigiLocker /
                      offline XML verification link will be sent directly to the
                      co-applicant.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCoApplicantIdentityLink(index)}
                      disabled={
                        coApp.identityStatus === "INITIATED" ||
                        coApp.identityStatus === "VERIFIED"
                      }
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                    >
                      {coApp.identityStatus === "VERIFIED"
                        ? "Identity Verified"
                        : coApp.identityStatus === "INITIATED"
                          ? "Link Sent"
                          : "Send Identity Link"}
                    </button>
                  </div>

                  <Field label="Relationship Matrix *">
                    <Select
                      name="relationship"
                      value={coApp.relationship}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                    >
                      <option value="SPOUSE">Spouse</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="SON">Son</option>
                      <option value="SIBLING">Sibling</option>
                    </Select>
                  </Field>

                  <Field label="Occupation Type">
                    <Select
                      name="occupation"
                      value={coApp.occupation}
                      onChange={(e) => handleCoApplicantChange(index, e)}
                    >
                      <option value="SELF_EMPLOYED">Self-employed</option>
                      <option value="SALARIED">Salaried Sector</option>
                      <option value="BUSINESS">Business</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="AGRICULTURE">Agriculture</option>
                      <option value="OTHER">Others</option>
                    </Select>
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
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Reference / Contact Persons
              </h4>
              <p className="text-xs text-slate-500">
                Add primary organizational or personal references associated
                with this account lead.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddContactPerson}
              className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Add Contact Person
            </button>
          </div>

          {contactPersons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
              No contact persons added. Click the button above to add
              verification reference lines.
            </div>
          ) : (
            contactPersons.map((contact, index) => (
              <div key={index} className="relative group">
                <Section title={`Contact Person Reference ${index + 1}`}>
                  <Field
                    label="Reference Name *"
                    name="name"
                    value={contact.name}
                    onChange={(e) => handleContactPersonChange(index, e)}
                    placeholder="Enter reference name"
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </label>
                    <input
                      name="mobile"
                      value={contact.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        handleContactPersonChange(index, {
                          target: { name: "mobile", value: val },
                        });
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="Enter 10-digit mobile"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <Field label="Reference Type *">
                    <Select
                      name="referenceType"
                      value={contact.referenceType || "Purchaser"}
                      onChange={(e) => handleContactPersonChange(index, e)}
                      placeholder="Select Reference Type"
                    >
                      {REFERENCE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  {/* Action Row containing layout removal button */}
                  <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveContactPerson(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove Reference
                    </button>
                  </div>
                </Section>
              </div>
            ))
          )}
        </div>

        {/* 7. Family Details Multi-Card Management Workspace */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                7. Family Details
              </h4>
              <p className="text-xs text-slate-500">
                Add family member details associated with the applicant.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFamilyMember}
              className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Family Member
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
              No family members added. Click the button above to add family details.
            </div>
          ) : (
            familyMembers.map((member, index) => (
              <div key={index} className="relative group">
                <Section title={`Family Member ${index + 1}`}>
                  <Field
                    label="Family Member Name *"
                    name="name"
                    value={member.name}
                    onChange={(e) => handleFamilyMemberChange(index, e)}
                    placeholder="Enter family member name"
                    required
                  />

                  <Field label="Relation *">
                    <Select
                      name="relation"
                      value={member.relation || "Brother"}
                      onChange={(e) => handleFamilyMemberChange(index, e)}
                      placeholder="Select Relation"
                    >
                      {FAMILY_RELATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="Age"
                    name="age"
                    type="number"
                    min="0"
                    max="120"
                    value={member.age}
                    onChange={(e) => handleFamilyMemberChange(index, e)}
                    placeholder="Enter age"
                  />

                  <Field
                    label="Occupation"
                    name="occupation"
                    value={member.occupation}
                    onChange={(e) => handleFamilyMemberChange(index, e)}
                    placeholder="Enter occupation"
                  />

                  <Field
                    label="Income"
                    name="income"
                    type="number"
                    min="0"
                    value={member.income}
                    onChange={(e) => handleFamilyMemberChange(index, e)}
                    placeholder="Enter income"
                  />

                  {/* Action Row containing layout removal button */}
                  <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyMember(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove Family Member
                    </button>
                  </div>
                </Section>
              </div>
            ))
          )}
        </div>

        <Section title="8. Property Details (LAP / Mortgage)">
          <Field label="Property Owner Name">
            <input
              name="propertyOwnerName"
              value={formData.propertyOwnerName || ""}
              onChange={handleInputChange}
              placeholder="Enter property owner name"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field label="Relationship With Applicant">
            <Select
              name="relationshipWithApplicant"
              value={formData.relationshipWithApplicant || ""}
              onChange={handleInputChange}
              placeholder="Select relationship"
            >
              {PROPERTY_OWNER_RELATION_OPTIONS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Plot Size">
            <input
              name="plotSize"
              value={formData.plotSize || ""}
              onChange={handleInputChange}
              placeholder="e.g. 1200 sq yards / 30x40"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field label="Area Sq Ft">
            <input
              name="areaSqFt"
              value={formData.areaSqFt || ""}
              onChange={handleInputChange}
              placeholder="e.g. 1500"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field
            label="Market Value *"
            name="propertyValue"
            type="number"
            min="0"
            value={formData.propertyValue}
            onChange={handleInputChange}
            placeholder="Enter market value"
          />

          <Field
            label="Government Value"
            name="governmentValue"
            type="number"
            min="0"
            value={formData.governmentValue || ""}
            onChange={handleInputChange}
            placeholder="Enter government value"
          />

          <Field label="Property Category">
            <Select
              name="propertyCategory"
              value={formData.propertyCategory}
              onChange={handleCategoryChange}
            >
              {PROPERTY_CATEGORY.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Property Type *">
            <Select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
            >
              {propertyTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="9. Type of Structure">
            <Select
              name="typeOfStructure"
              value={formData.typeOfStructure || ""}
              onChange={handleInputChange}
              placeholder="Select structure type"
            >
              {STRUCTURE_TYPE_OPTIONS.map((struct) => (
                <option key={struct} value={struct}>
                  {struct}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="10. Plot Demarcated">
            <Select
              name="plotDemarcated"
              value={formData.plotDemarcated || ""}
              onChange={handleInputChange}
              placeholder="Select demarcation status"
            >
              {PLOT_DEMARCATED_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="11. Type of Usage of Entire Property">
            <Select
              name="propertyUsageType"
              value={formData.propertyUsageType || ""}
              onChange={handleInputChange}
              placeholder="Select property usage"
            >
              {PROPERTY_USAGE_TYPE_OPTIONS.map((usage) => (
                <option key={usage} value={usage}>
                  {usage}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="12. Type of Premises">
            <Select
              name="premisesType"
              value={formData.premisesType || ""}
              onChange={handleInputChange}
              placeholder="Select premises type"
            >
              {PREMISES_TYPE_OPTIONS.map((premise) => (
                <option key={premise} value={premise}>
                  {premise}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="13. Property Occupancy (Occupied By)">
            <input
              name="occupiedBy"
              value={formData.occupiedBy || ""}
              onChange={handleInputChange}
              placeholder="e.g. Owner / Tenant Name / Vacant / Family Member"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field label="14. Construction Details (Construction Status)">
            <Select
              name="constructionStatus"
              value={formData.constructionStatus || ""}
              onChange={handleInputChange}
              placeholder="Select construction status"
            >
              {CONSTRUCTION_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <PropertyAddressAutocomplete
            propertyAddress={formData.propertyAddress}
            city={formData.city}
            state={formData.state}
            pinCode={formData.pinCode}
            onChange={(updatedFields) => {
              setFormData((previous) => ({
                ...previous,
                ...updatedFields,
              }));
            }}
          />
        </Section>

        <Section title="15. Property Documents">
          {/* 1. Sale Deed */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">1. Sale Deed</span>
              {isApplicantSaleDeedUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantSaleDeed}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleSaleDeedFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {saleDeedFile ? saleDeedFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!saleDeedFile || uploadSaleDeedDocumentMutation.isPending}
                onClick={() => uploadSaleDeedDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadSaleDeedDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {saleDeedFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{saleDeedFile.name}</span>
              </p>
            )}
          </div>

          {/* 2. Property Tax Receipt */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">2. Property Tax Receipt</span>
              {isApplicantPropertyTaxReceiptUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantPropertyTaxReceipt}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handlePropertyTaxReceiptFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {propertyTaxReceiptFile ? propertyTaxReceiptFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!propertyTaxReceiptFile || uploadPropertyTaxReceiptDocumentMutation.isPending}
                onClick={() => uploadPropertyTaxReceiptDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadPropertyTaxReceiptDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {propertyTaxReceiptFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{propertyTaxReceiptFile.name}</span>
              </p>
            )}
          </div>

          {/* 3. Khata Certificate */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">3. Khata Certificate</span>
              {isApplicantKhataCertificateUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantKhataCertificate}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleKhataCertificateFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {khataCertificateFile ? khataCertificateFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!khataCertificateFile || uploadKhataCertificateDocumentMutation.isPending}
                onClick={() => uploadKhataCertificateDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadKhataCertificateDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {khataCertificateFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{khataCertificateFile.name}</span>
              </p>
            )}
          </div>

          {/* 4. Survey Sketch */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">4. Survey Sketch</span>
              {isApplicantSurveySketchUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantSurveySketch}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleSurveySketchFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {surveySketchFile ? surveySketchFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!surveySketchFile || uploadSurveySketchDocumentMutation.isPending}
                onClick={() => uploadSurveySketchDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadSurveySketchDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {surveySketchFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{surveySketchFile.name}</span>
              </p>
            )}
          </div>

          {/* 5. EC Certificate */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">5. EC Certificate</span>
              {isApplicantEcCertificateUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantEcCertificate}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleEcCertificateFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {ecCertificateFile ? ecCertificateFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!ecCertificateFile || uploadEcCertificateDocumentMutation.isPending}
                onClick={() => uploadEcCertificateDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadEcCertificateDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {ecCertificateFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{ecCertificateFile.name}</span>
              </p>
            )}
          </div>

          {/* 6. Approval Plan */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">6. Approval Plan</span>
              {isApplicantApprovalPlanUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantApprovalPlan}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleApprovalPlanFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {approvalPlanFile ? approvalPlanFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!approvalPlanFile || uploadApprovalPlanDocumentMutation.isPending}
                onClick={() => uploadApprovalPlanDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadApprovalPlanDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {approvalPlanFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{approvalPlanFile.name}</span>
              </p>
            )}
          </div>
        </Section>

        <Section title="16. KYC Documents">
          {/* 1. Address Proof (Upload) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">1. Address Proof</span>
              {isApplicantAddressProofUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantAddressProof}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleAddressProofFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {addressProofFile ? addressProofFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!addressProofFile || uploadAddressProofDocumentMutation.isPending}
                onClick={() => uploadAddressProofDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadAddressProofDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {addressProofFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{addressProofFile.name}</span>
              </p>
            )}
          </div>

          {/* 2. Bank Statement (Upload) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">2. Bank Statement</span>
              {isApplicantBankStatementUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantBankStatement}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleBankStatementFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {bankStatementFile ? bankStatementFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!bankStatementFile || uploadBankStatementDocumentMutation.isPending}
                onClick={() => uploadBankStatementDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadBankStatementDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {bankStatementFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{bankStatementFile.name}</span>
              </p>
            )}
          </div>

          {/* 3. Income Proof (Upload) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">3. Income Proof</span>
              {isApplicantIncomeProofUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantIncomeProof}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleIncomeProofFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {incomeProofFile ? incomeProofFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!incomeProofFile || uploadIncomeProofDocumentMutation.isPending}
                onClick={() => uploadIncomeProofDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadIncomeProofDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {incomeProofFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{incomeProofFile.name}</span>
              </p>
            )}
          </div>

          {/* 4. Business Proof (Upload) */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">4. Business Proof</span>
              {isApplicantBusinessProofUploaded && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={handleViewApplicantBusinessProof}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleBusinessProofFileChange}
                />
                <span className="truncate max-w-[200px]">
                  {businessProofFile ? businessProofFile.name : "Choose File (PDF / Image)"}
                </span>
              </label>
              <button
                type="button"
                disabled={!businessProofFile || uploadBusinessProofDocumentMutation.isPending}
                onClick={() => uploadBusinessProofDocumentMutation.mutate()}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98"
              >
                {uploadBusinessProofDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
            {businessProofFile && (
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Selected: <span className="font-semibold text-slate-800">{businessProofFile.name}</span>
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
