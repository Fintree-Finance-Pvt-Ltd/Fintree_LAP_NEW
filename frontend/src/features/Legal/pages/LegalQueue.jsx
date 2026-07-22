import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FaBalanceScale,
  FaCheck,
  FaChevronDown,
  FaClipboardCheck,
  FaFileSignature,
  FaHome,
  FaPaperPlane,
  FaQuestionCircle,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
  FaUserTie,
} from "react-icons/fa";
import { useParams } from "react-router-dom";

import { legalApi } from "../legalApi.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? null;
};

const unwrapList = (response) => {
  const payload = unwrapPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

const valueOrEmpty = (value) =>
  value === null || value === undefined ? "" : String(value);

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const parseJson = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const joinAddress = (...parts) => {
  return parts
    .filter(
      (part) =>
        part !== null &&
        part !== undefined &&
        String(part).trim() !== "",
    )
    .map((part) => String(part).trim())
    .join(", ");
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

const formatStatus = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const todayDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const workflowSteps = [
  { id: 1, label: "Lead", status: "completed" },
  { id: 2, label: "BM", status: "completed" },
  { id: 3, label: "CM", status: "completed" },
  { id: 4, label: "Credit", status: "completed" },
  { id: 5, label: "Valuation", status: "completed" },
  { id: 6, label: "Legal", status: "current" },
  { id: 7, label: "Ops Maker", status: "pending" },
  { id: 8, label: "Ops Checker", status: "pending" },
  { id: 9, label: "Agreement", status: "pending" },
  { id: 10, label: "Disbursement", status: "pending" },
];

const defaultChecklist = [
  {
    id: "documentInventory",
    title: "Document inventory complete",
    subtitle: "All required legal documents are available",
    checked: false,
  },
  {
    id: "ownershipMatched",
    title: "Ownership verified",
    subtitle: "Owner name matches title documents",
    checked: false,
  },
  {
    id: "titleChainVerified",
    title: "Title chain verified",
    subtitle: "Previous transfers reviewed",
    checked: false,
  },
  {
    id: "encumbranceChecked",
    title: "Encumbrance checked",
    subtitle: "EC / search report reviewed",
    checked: false,
  },
  {
    id: "cersaiChecked",
    title: "CERSAI checked",
    subtitle: "Existing charge verified",
    checked: false,
  },
  {
    id: "mortgageFeasible",
    title: "Mortgage feasible",
    subtitle: "Mortgage can be created in lender favour",
    checked: false,
  },
];

const defaultTitleChain = [
  {
    year: "",
    title: "",
    subtitle: "",
  },
];

const defaultForm = {
  propertyCategory: "",
  propertyType: "",
  propertyAddress: "",
  propertyCity: "",
  propertyState: "",
  propertyPincode: "",
  fullPropertyAddress: "",
  currentAddress: "",
  permanentAddress: "",

  currentOwner: "",
  lawFirmAdvocate: "",
  assignmentDate: todayDate(),
  mortgageMethod: "",

  titleStatus: "",
  encumbranceStatus: "",
  cersaiResult: "",
  finalLegalStatus: "",

  conditions: "",
  opinionSummary: "",
  legalRemarks: "",
  queryRemarks: "",
  negativeRemarks: "",
  opsInstructions: "",
  legalReportReference: "",

  titleChain: defaultTitleChain,
  checklist: defaultChecklist,
};

const getApplicationObject = (payload) => {
  return (
    payload?.application ||
    payload?.data?.application ||
    payload?.data ||
    payload ||
    {}
  );
};

const isBlankValue = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const mergeNonBlank = (primary = {}, fallback = {}) => {
  const output = {
    ...(primary || {}),
  };

  Object.entries(fallback || {}).forEach(([key, value]) => {
    if (isBlankValue(output[key]) && !isBlankValue(value)) {
      output[key] = value;
    }
  });

  return output;
};

const mergeApplicationData = (legalApplication = {}, fullApplication = {}) => {
  const merged = mergeNonBlank(legalApplication, fullApplication);

  merged.customerProfile = mergeNonBlank(
    legalApplication?.customerProfile,
    fullApplication?.customerProfile,
  );

  merged.borrower = mergeNonBlank(
    legalApplication?.borrower,
    fullApplication?.borrower,
  );

  merged.applicant = mergeNonBlank(
    legalApplication?.applicant,
    fullApplication?.applicant,
  );

  merged.primaryApplicant = mergeNonBlank(
    legalApplication?.primaryApplicant,
    fullApplication?.primaryApplicant,
  );

  merged.property = mergeNonBlank(
    legalApplication?.property,
    fullApplication?.property,
  );

  merged.collateral = mergeNonBlank(
    legalApplication?.collateral,
    fullApplication?.collateral,
  );

  merged.propertyDetails = mergeNonBlank(
    legalApplication?.propertyDetails,
    fullApplication?.propertyDetails,
  );

  merged.collateralDetails = mergeNonBlank(
    legalApplication?.collateralDetails,
    fullApplication?.collateralDetails,
  );

  return merged;
};

const getSourceObject = (application) => ({
  profile: application?.customerProfile || {},
  borrower: application?.borrower || {},
  applicant: application?.applicant || {},
  primaryApplicant: application?.primaryApplicant || {},
  property: application?.property || {},
  collateral: application?.collateral || {},
  propertyDetails: application?.propertyDetails || {},
  collateralDetails: application?.collateralDetails || {},
});

const getCustomerName = (application, customerSnapshot = {}) => {
  const { profile, borrower, applicant, primaryApplicant } =
    getSourceObject(application);

  const joinedProfileName = `${profile?.firstName || ""} ${
    profile?.middleName || ""
  } ${profile?.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();

  return firstValue(
    customerSnapshot?.customerName,
    application?.customerName,
    application?.name,
    application?.applicantName,
    application?.borrowerName,
    profile?.customerName,
    profile?.name,
    joinedProfileName,
    borrower?.customerName,
    borrower?.name,
    applicant?.customerName,
    applicant?.name,
    primaryApplicant?.customerName,
    primaryApplicant?.name,
  );
};

const getAddressDetails = (
  application,
  legalPropertySnapshot = {},
  valuationPropertySnapshot = {},
) => {
  const {
    profile,
    borrower,
    applicant,
    primaryApplicant,
    property,
    collateral,
    propertyDetails,
    collateralDetails,
  } = getSourceObject(application);

  const propertyAddress = firstValue(
    legalPropertySnapshot?.propertyAddress,
    legalPropertySnapshot?.address,
    legalPropertySnapshot?.fullAddress,

    valuationPropertySnapshot?.propertyAddress,
    valuationPropertySnapshot?.address,
    valuationPropertySnapshot?.fullAddress,

    application?.propertyAddress,
    application?.address,
    application?.collateralAddress,
    application?.property_address,
    application?.propertyFullAddress,

    property?.propertyAddress,
    property?.address,
    property?.fullAddress,

    propertyDetails?.propertyAddress,
    propertyDetails?.address,
    propertyDetails?.fullAddress,

    collateral?.propertyAddress,
    collateral?.address,
    collateral?.fullAddress,

    collateralDetails?.propertyAddress,
    collateralDetails?.address,
    collateralDetails?.fullAddress,

    profile?.propertyAddress,
    profile?.address,
    profile?.property_address,

    borrower?.propertyAddress,
    borrower?.address,

    applicant?.propertyAddress,
    applicant?.address,

    primaryApplicant?.propertyAddress,
    primaryApplicant?.address,


    application?.propertyFullAddress,
application?.fullPropertyAddress,
application?.fullAddress,
application?.propertyLocation,
application?.collateralLocation,

profile?.fullPropertyAddress,
profile?.fullAddress,
profile?.propertyLocation,

borrower?.fullPropertyAddress,
borrower?.fullAddress,
borrower?.propertyLocation,

applicant?.fullPropertyAddress,
applicant?.fullAddress,
applicant?.propertyLocation,

primaryApplicant?.fullPropertyAddress,
primaryApplicant?.fullAddress,
primaryApplicant?.propertyLocation,
  );

  const propertyCity = firstValue(
    legalPropertySnapshot?.propertyCity,
    legalPropertySnapshot?.city,

    valuationPropertySnapshot?.propertyCity,
    valuationPropertySnapshot?.city,

    application?.propertyCity,
    application?.city,

    property?.propertyCity,
    property?.city,

    propertyDetails?.propertyCity,
    propertyDetails?.city,

    collateral?.propertyCity,
    collateral?.city,

    collateralDetails?.propertyCity,
    collateralDetails?.city,

    profile?.propertyCity,
    profile?.city,

    borrower?.propertyCity,
    borrower?.city,

    applicant?.propertyCity,
    applicant?.city,

    primaryApplicant?.propertyCity,
    primaryApplicant?.city,
  );

  const propertyState = firstValue(
    legalPropertySnapshot?.propertyState,
    legalPropertySnapshot?.state,

    valuationPropertySnapshot?.propertyState,
    valuationPropertySnapshot?.state,

    application?.propertyState,
    application?.state,

    property?.propertyState,
    property?.state,

    propertyDetails?.propertyState,
    propertyDetails?.state,

    collateral?.propertyState,
    collateral?.state,

    collateralDetails?.propertyState,
    collateralDetails?.state,

    profile?.propertyState,
    profile?.state,

    borrower?.propertyState,
    borrower?.state,

    applicant?.propertyState,
    applicant?.state,

    primaryApplicant?.propertyState,
    primaryApplicant?.state,
  );

  const propertyPincode = firstValue(
    legalPropertySnapshot?.propertyPincode,
    legalPropertySnapshot?.pincode,
    legalPropertySnapshot?.pinCode,

    valuationPropertySnapshot?.propertyPincode,
    valuationPropertySnapshot?.pincode,
    valuationPropertySnapshot?.pinCode,

    application?.propertyPincode,
    application?.pinCode,
    application?.pincode,
    application?.pin_code,

    property?.propertyPincode,
    property?.pincode,
    property?.pinCode,

    propertyDetails?.propertyPincode,
    propertyDetails?.pincode,
    propertyDetails?.pinCode,

    collateral?.propertyPincode,
    collateral?.pincode,
    collateral?.pinCode,

    collateralDetails?.propertyPincode,
    collateralDetails?.pincode,
    collateralDetails?.pinCode,

    profile?.propertyPincode,
    profile?.pincode,
    profile?.pinCode,

    borrower?.propertyPincode,
    borrower?.pincode,
    borrower?.pinCode,

    applicant?.propertyPincode,
    applicant?.pincode,
    applicant?.pinCode,

    primaryApplicant?.propertyPincode,
    primaryApplicant?.pincode,
    primaryApplicant?.pinCode,
  );

  const currentAddress = firstValue(
    legalPropertySnapshot?.currentAddress,

    application?.currentAddress,
    application?.current_address,
    application?.residenceAddress,
    application?.residentialAddress,
    application?.communicationAddress,
    application?.presentAddress,

    profile?.currentAddress,
    profile?.current_address,
    profile?.residenceAddress,
    profile?.residentialAddress,
    profile?.communicationAddress,
    profile?.presentAddress,

    borrower?.currentAddress,
    borrower?.residenceAddress,
    borrower?.presentAddress,

    applicant?.currentAddress,
    applicant?.residenceAddress,
    applicant?.presentAddress,

    primaryApplicant?.currentAddress,
    primaryApplicant?.residenceAddress,
    primaryApplicant?.presentAddress,
application?.address,
application?.fullAddress,
profile?.address,
profile?.fullAddress,
borrower?.address,
borrower?.fullAddress,
applicant?.address,
applicant?.fullAddress,
primaryApplicant?.address,
primaryApplicant?.fullAddress,

  );

  const permanentAddress = firstValue(
    legalPropertySnapshot?.permanentAddress,

    application?.permanentAddress,
    application?.permanent_address,

    profile?.permanentAddress,
    profile?.permanent_address,

    borrower?.permanentAddress,
    applicant?.permanentAddress,
    primaryApplicant?.permanentAddress,
  );

  const fullPropertyAddress = firstValue(
    legalPropertySnapshot?.fullPropertyAddress,
    valuationPropertySnapshot?.fullPropertyAddress,
    joinAddress(propertyAddress, propertyCity, propertyState, propertyPincode),
  );

  return {
    propertyAddress,
    propertyCity,
    propertyState,
    propertyPincode,
    currentAddress,
    permanentAddress,
    fullPropertyAddress,
  };
};

const buildInitialForm = (application, legalAssessment, valuationAssessment) => {
  const legalPropertySnapshot = parseJson(
    legalAssessment?.propertySnapshot,
    {},
  );

  const valuationPropertySnapshot = parseJson(
    valuationAssessment?.propertySnapshot,
    {},
  );

  const titleChain = parseJson(
    legalAssessment?.titleChainJson,
    defaultTitleChain,
  );

  const checklist = parseJson(
    legalAssessment?.checklistJson,
    defaultChecklist,
  );

  const address = getAddressDetails(
    application,
    legalPropertySnapshot,
    valuationPropertySnapshot,
  );

  const customerName = getCustomerName(application);

  return {
    ...defaultForm,

    propertyCategory: valueOrEmpty(
      firstValue(
        legalPropertySnapshot?.propertyCategory,
        valuationPropertySnapshot?.propertyCategory,
        application?.propertyCategory,
        application?.customerProfile?.propertyCategory,
      ),
    ),

    propertyType: valueOrEmpty(
      firstValue(
        legalAssessment?.propertyType,
        legalPropertySnapshot?.propertyType,
        valuationPropertySnapshot?.propertyType,
        application?.propertyType,
        application?.propertyCategory,
        application?.customerProfile?.propertyType,
        application?.customerProfile?.propertyCategory,
      ),
    ),

    propertyAddress: valueOrEmpty(
      firstValue(legalAssessment?.propertyAddress, address.propertyAddress),
    ),

    propertyCity: valueOrEmpty(address.propertyCity),
    propertyState: valueOrEmpty(address.propertyState),
    propertyPincode: valueOrEmpty(address.propertyPincode),
    fullPropertyAddress: valueOrEmpty(address.fullPropertyAddress),
    currentAddress: valueOrEmpty(address.currentAddress),
    permanentAddress: valueOrEmpty(address.permanentAddress),

    currentOwner: valueOrEmpty(
      firstValue(
        legalAssessment?.currentOwner,
        legalPropertySnapshot?.currentOwner,
        legalPropertySnapshot?.ownerName,
        valuationPropertySnapshot?.currentOwner,
        valuationPropertySnapshot?.ownerName,
        application?.propertyOwner,
        application?.ownerName,
        customerName,
      ),
    ),

    lawFirmAdvocate: valueOrEmpty(legalAssessment?.lawFirmAdvocate),

    assignmentDate: legalAssessment?.assignmentDate
      ? String(legalAssessment.assignmentDate).slice(0, 10)
      : todayDate(),

    mortgageMethod: valueOrEmpty(
      firstValue(
        legalAssessment?.mortgageMethod,
        legalPropertySnapshot?.mortgageMethod,
      ),
    ),

    titleStatus: valueOrEmpty(legalAssessment?.titleStatus),
    encumbranceStatus: valueOrEmpty(legalAssessment?.encumbranceStatus),
    cersaiResult: valueOrEmpty(legalAssessment?.cersaiResult),
    finalLegalStatus: valueOrEmpty(legalAssessment?.finalLegalStatus),

    conditions: valueOrEmpty(legalAssessment?.conditions),
    opinionSummary: valueOrEmpty(legalAssessment?.opinionSummary),
    legalRemarks: valueOrEmpty(legalAssessment?.legalRemarks),
    queryRemarks: valueOrEmpty(legalAssessment?.queryRemarks),
    negativeRemarks: valueOrEmpty(legalAssessment?.negativeRemarks),
    opsInstructions: valueOrEmpty(legalAssessment?.opsInstructions),
    legalReportReference: valueOrEmpty(legalAssessment?.legalReportReference),

    titleChain:
      Array.isArray(titleChain) && titleChain.length
        ? titleChain
        : defaultTitleChain,

    checklist:
      Array.isArray(checklist) && checklist.length
        ? checklist
        : defaultChecklist,
  };
};

export default function LegalQueue() {
  const { applicationId: routeApplicationId } = useParams();

  const [selectedId, setSelectedId] = useState(routeApplicationId || "");
  const [hydrationKey, setHydrationKey] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [form, setForm] = useState(defaultForm);

  const queryClient = useQueryClient();

  const casesQuery = useQuery({
    queryKey: ["legal-cases"],
    queryFn: () => legalApi.cases(),
    retry: false,
  });

  const legalCases = useMemo(() => unwrapList(casesQuery.data), [casesQuery.data]);

  const finalSelectedId =
    selectedId || routeApplicationId || legalCases?.[0]?.id || "";

const applicationQuery = useQuery({
  queryKey: ["legal-application", finalSelectedId],
  queryFn: () => legalApi.getApplication(finalSelectedId),
  enabled: Boolean(finalSelectedId),
  retry: false,
});

const fullApplicationQuery = useQuery({
  queryKey: ["legal-full-application", finalSelectedId],
  queryFn: () => legalApi.getFullApplication(finalSelectedId),
  enabled:
    Boolean(finalSelectedId) &&
    typeof legalApi.getFullApplication === "function",
  retry: false,
});

const applicationPayload = unwrapPayload(applicationQuery.data);
const fullApplicationPayload = unwrapPayload(fullApplicationQuery.data);

const legalApplication = getApplicationObject(applicationPayload);
const fullApplication = getApplicationObject(fullApplicationPayload);

const application = mergeApplicationData(
  legalApplication,
  fullApplication,
);

const legalAssessment =
  applicationPayload?.legalAssessment ||
  applicationPayload?.data?.legalAssessment ||
  null;

const valuationAssessment =
  applicationPayload?.valuationAssessment ||
  applicationPayload?.data?.valuationAssessment ||
  null;

const currentHydrationKey = [
  finalSelectedId,
  applicationQuery.dataUpdatedAt,
  fullApplicationQuery.dataUpdatedAt,
  legalAssessment?.id,
  valuationAssessment?.id,
].join("|");

  useEffect(() => {
    if (!finalSelectedId || !application?.id) return;
    if (hydrationKey === currentHydrationKey) return;

    setForm(buildInitialForm(application, legalAssessment, valuationAssessment));
    setHydrationKey(currentHydrationKey);
    setMessage("");
  }, [
    finalSelectedId,
    application?.id,
    legalAssessment?.id,
    valuationAssessment?.id,
    currentHydrationKey,
    hydrationKey,
  ]);

  const updateForm = (field, value) => {
    setMessage("");
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateAddressField = (field, value) => {
    setMessage("");

    setForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field === "propertyAddress" ||
        field === "propertyCity" ||
        field === "propertyState" ||
        field === "propertyPincode"
      ) {
        updated.fullPropertyAddress = joinAddress(
          field === "propertyAddress" ? value : updated.propertyAddress,
          field === "propertyCity" ? value : updated.propertyCity,
          field === "propertyState" ? value : updated.propertyState,
          field === "propertyPincode" ? value : updated.propertyPincode,
        );
      }

      return updated;
    });
  };

  const updateChecklist = (id) => {
    setMessage("");
    setForm((previous) => ({
      ...previous,
      checklist: previous.checklist.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    }));
  };

  const updateTitleChain = (index, field, value) => {
    setMessage("");
    setForm((previous) => ({
      ...previous,
      titleChain: previous.titleChain.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const addTitleChainRow = () => {
    setForm((previous) => ({
      ...previous,
      titleChain: [
        ...previous.titleChain,
        {
          year: "",
          title: "",
          subtitle: "",
        },
      ],
    }));
  };

  const removeTitleChainRow = (index) => {
    setForm((previous) => ({
      ...previous,
      titleChain:
        previous.titleChain.length <= 1
          ? previous.titleChain
          : previous.titleChain.filter((_item, itemIndex) => itemIndex !== index),
    }));
  };

  const completedChecks = form.checklist.filter((item) => item.checked).length;

  const selectedCaseText = application?.id
    ? `${getCustomerName(application) || ""} | ${application?.mobile || ""} | ${
        application?.pan || ""
      }`
    : "";

  const buildPayload = () => ({
    ...form,
    applicationId: Number(finalSelectedId),
    remarks: form.legalRemarks || form.opinionSummary,
    titleChain: form.titleChain,
    checklist: form.checklist,

    customerSnapshot: {
      applicationNumber: application?.applicationNumber,
      customerName: getCustomerName(application),
      mobile: application?.mobile,
      pan: application?.pan,
      requestedAmount: application?.requestedAmount,
      currentAddress: form.currentAddress,
      permanentAddress: form.permanentAddress,
    },

    propertySnapshot: {
      propertyCategory: form.propertyCategory,
      propertyType: form.propertyType,
      propertyAddress: form.propertyAddress,
      propertyCity: form.propertyCity,
      propertyState: form.propertyState,
      propertyPincode: form.propertyPincode,
      fullPropertyAddress: form.fullPropertyAddress,
      currentOwner: form.currentOwner,
      mortgageMethod: form.mortgageMethod,
      currentAddress: form.currentAddress,
      permanentAddress: form.permanentAddress,
    },

    valuationSnapshot: valuationAssessment,
  });

  const validateSelection = () => {
    if (!finalSelectedId) {
      setMessageType("error");
      setMessage("Please select Legal case first.");
      return false;
    }

    return true;
  };

  const validateBeforeOps = () => {
    const errors = [];

    if (!form.propertyAddress && !form.fullPropertyAddress) {
      errors.push("Property Address");
    }

    if (!form.propertyType) errors.push("Property Type");
    if (!form.currentOwner) errors.push("Current Owner");
    if (!form.lawFirmAdvocate) errors.push("Law Firm / Advocate");
    if (!form.assignmentDate) errors.push("Assignment Date");
    if (!form.titleStatus) errors.push("Title Status");
    if (!form.finalLegalStatus) errors.push("Final Legal Status");
    if (!form.opinionSummary) errors.push("Legal Opinion Summary");
    if (!form.opsInstructions) errors.push("Ops Instructions");

    if (form.finalLegalStatus === "Negative") {
      errors.push("Final Legal Status cannot be Negative for Ops Maker movement");
    }

    if (errors.length) {
      setMessageType("error");
      setMessage(`Please complete: ${errors.join(", ")}.`);
      return false;
    }

    return true;
  };

  const saveDraftMutation = useMutation({
    mutationFn: () => legalApi.saveDraft(finalSelectedId, buildPayload()),

    onSuccess: async (response) => {
      setMessageType("success");
      setMessage(response?.data?.message || "Legal draft saved successfully.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["legal-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["legal-cases"],
        }),
      ]);
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save Legal draft.",
      );
    },
  });

  const raiseQueryMutation = useMutation({
    mutationFn: () =>
      legalApi.raiseQuery(finalSelectedId, {
        ...buildPayload(),
        remarks:
          form.queryRemarks || form.legalRemarks || "Legal query raised.",
      }),

    onSuccess: async (response) => {
      setMessageType("success");
      setMessage(response?.data?.message || "Legal query raised successfully.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["legal-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["legal-application", finalSelectedId],
        }),
      ]);
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to raise Legal query.",
      );
    },
  });

  const markNegativeMutation = useMutation({
    mutationFn: () =>
      legalApi.markNegative(finalSelectedId, {
        ...buildPayload(),
        finalLegalStatus: "Negative",
        remarks:
          form.negativeRemarks || form.legalRemarks || "Legal marked negative.",
      }),

    onSuccess: async (response) => {
      setMessageType("success");
      setMessage(
        response?.data?.message || "Application marked negative by Legal.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["legal-cases"],
      });
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to mark Legal negative.",
      );
    },
  });

  const approveToOpsMakerMutation = useMutation({
    mutationFn: () =>
      legalApi.approveToOpsMaker(finalSelectedId, {
        ...buildPayload(),
        finalLegalStatus:
          form.finalLegalStatus === "Pending"
            ? "Positive"
            : form.finalLegalStatus,
        remarks:
          form.legalRemarks ||
          form.opinionSummary ||
          "Legal approved and moved to Ops Maker.",
      }),

    onSuccess: async (response) => {
      setMessageType("success");
      setMessage(
        response?.data?.message || "Legal approved and moved to Ops Maker.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["legal-cases"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["legal-application", finalSelectedId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ops-maker-cases"],
        }),
      ]);
    },

    onError: (error) => {
      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to move case to Ops Maker.",
      );
    },
  });

  const handleSaveDraft = () => {
    if (!validateSelection()) return;
    saveDraftMutation.mutate();
  };

  const handleRaiseQuery = () => {
    if (!validateSelection()) return;
    raiseQueryMutation.mutate();
  };

  const handleMarkNegative = () => {
    if (!validateSelection()) return;
    markNegativeMutation.mutate();
  };

  const handleApproveToOpsMaker = () => {
    if (!validateSelection()) return;
    if (!validateBeforeOps()) return;
    approveToOpsMakerMutation.mutate();
  };

  const isSubmitting =
    saveDraftMutation.isPending ||
    raiseQueryMutation.isPending ||
    markNegativeMutation.isPending ||
    approveToOpsMakerMutation.isPending;

const isLoadingSelected =
  Boolean(finalSelectedId) &&
  (applicationQuery.isLoading || fullApplicationQuery.isLoading);

  const scoreCards = [
    {
      label: "Requested Amount",
      value: formatCurrency(application?.requestedAmount),
      icon: FaClipboardCheck,
    },
    {
      label: "Valuation Value",
      value: formatCurrency(
        valuationAssessment?.recommendedValue || valuationAssessment?.marketValue,
      ),
      icon: FaHome,
    },
    {
      label: "Checklist",
      value: `${completedChecks}/${form.checklist.length}`,
      icon: FaCheck,
    },
    {
      label: "Legal Status",
      value: form.finalLegalStatus || "Pending",
      icon: FaBalanceScale,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#312e81] via-[#6d28d9] to-[#9333ea] p-7 text-white">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-purple-300/20" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl shadow-inner backdrop-blur-md">
                  <FaBalanceScale />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    Legal & Title Due Diligence
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {application?.applicationNumber || "Select Application"} ·
                    Review title, ownership, encumbrance, CERSAI and mortgage
                    feasibility.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{`Stage: ${formatStatus(application?.stage)}`}</Badge>
                    <Badge>{`Status: ${formatStatus(application?.status)}`}</Badge>
                    <Badge>{`Assessment: ${
                      legalAssessment?.assessmentStatus || "New Draft"
                    }`}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleSaveDraft}
                  icon={FaSave}
                >
                  {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleRaiseQuery}
                  icon={FaQuestionCircle}
                >
                  Raise Query
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleMarkNegative}
                  icon={FaTimesCircle}
                >
                  Mark Negative
                </HeaderButton>

                <HeaderButton
                  disabled={isSubmitting}
                  onClick={handleApproveToOpsMaker}
                  icon={FaPaperPlane}
                >
                  {approveToOpsMakerMutation.isPending
                    ? "Moving..."
                    : "Approve & Send to Ops Maker"}
                </HeaderButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[460px_1fr]">
            <div className="relative">
              <select
                value={finalSelectedId}
                disabled={casesQuery.isLoading || legalCases.length === 0}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setHydrationKey("");
                  setMessage("");
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-extrabold text-slate-700 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                {casesQuery.isLoading ? (
                  <option value="">Loading Legal cases...</option>
                ) : legalCases.length === 0 ? (
                  <option value="">No Legal cases available</option>
                ) : (
                  <>
                    <option value="">Select Legal Case</option>
                    {legalCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        ID: {item.id} |{" "}
                        {item.applicationNumber || `APP-${item.id}`} -{" "}
                        {item.customerName || "No Name"} -{" "}
                        {formatStatus(item.status)}
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
                placeholder="Selected legal case details"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-bold text-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm font-bold ${
              messageType === "success"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        )}

        {isLoadingSelected && (
          <div className="rounded-2xl border border-purple-100 bg-white p-8 text-center text-sm font-black text-slate-500 shadow-sm">
            Loading Legal case details...
          </div>
        )}

        {!finalSelectedId && (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-slate-800">
              Select Legal case
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Customer, valuation and property address details will load here.
            </p>
          </div>
        )}

        {finalSelectedId && !isLoadingSelected && (
          <>
            <WorkflowCard />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {scoreCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">
              <div className="space-y-6">
                <Panel
                  title="Customer & Valuation Summary"
                  subtitle="Application and valuation details for Legal review."
                  icon={FaUserTie}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <DisplayBox
                      label="Customer Name"
                      value={getCustomerName(application)}
                    />
                    <DisplayBox label="Mobile" value={application?.mobile} />
                    <DisplayBox label="PAN" value={application?.pan} />
                    <DisplayBox
                      label="Application Number"
                      value={application?.applicationNumber}
                    />
                    <DisplayBox
                      label="Requested Amount"
                      value={formatCurrency(application?.requestedAmount)}
                    />
                    <DisplayBox
                      label="Valuation Status"
                      value={valuationAssessment?.valuationStatus}
                    />
                    <DisplayBox
                      label="Market Value"
                      value={formatCurrency(valuationAssessment?.marketValue)}
                    />
                    <DisplayBox
                      label="Recommended Value"
                      value={formatCurrency(
                        valuationAssessment?.recommendedValue,
                      )}
                    />
                    <DisplayBox
                      label="Property Risk Grade"
                      value={valuationAssessment?.propertyRiskGrade}
                    />
                  </div>

                  <ReadOnlyText
                    label="Valuation Technical Remarks"
                    value={valuationAssessment?.technicalRemarks}
                  />

                  <ReadOnlyText
                    label="Valuation Legal Instructions"
                    value={valuationAssessment?.legalInstructions}
                  />
                </Panel>

               <Panel
  title="Property & Assignment"
  subtitle="Address loaded from Application Data, customer profile, applicant, borrower, valuation and saved legal data."
  icon={FaHome}
>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <Field
      label="Property Category"
      value={form.propertyCategory}
      onChange={(value) => updateForm("propertyCategory", value)}
    />

    <Field
      label="Property Type *"
      value={form.propertyType}
      onChange={(value) => updateForm("propertyType", value)}
    />

    <Field
      label="Current Owner *"
      value={form.currentOwner}
      onChange={(value) => updateForm("currentOwner", value)}
    />

    <Field
      label="City"
      value={form.propertyCity}
      onChange={(value) => updateAddressField("propertyCity", value)}
    />

    <Field
      label="State"
      value={form.propertyState}
      onChange={(value) => updateAddressField("propertyState", value)}
    />

    <Field
      label="Pincode"
      value={form.propertyPincode}
      onChange={(value) => updateAddressField("propertyPincode", value)}
    />

    <Field
      label="Law Firm / Advocate *"
      value={form.lawFirmAdvocate}
      onChange={(value) => updateForm("lawFirmAdvocate", value)}
    />

    <Field
      label="Assignment Date *"
      type="date"
      value={form.assignmentDate}
      onChange={(value) => updateForm("assignmentDate", value)}
    />

    <SelectField
      label="Mortgage Method"
      value={form.mortgageMethod}
      options={[
        "",
        "Equitable Mortgage / MODT",
        "Registered Mortgage",
        "Simple Mortgage",
      ]}
      onChange={(value) => updateForm("mortgageMethod", value)}
    />

    <Field
      label="Legal Report Reference"
      value={form.legalReportReference}
      onChange={(value) => updateForm("legalReportReference", value)}
    />
  </div>

  <TextArea
    label="Property Address *"
    rows={3}
    value={form.propertyAddress}
    onChange={(value) => updateAddressField("propertyAddress", value)}
  />

  <TextArea
    label="Full Property Address"
    rows={3}
    value={form.fullPropertyAddress}
    onChange={(value) => updateForm("fullPropertyAddress", value)}
  />

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <TextArea
      label="Current / Residence Address"
      rows={3}
      value={form.currentAddress}
      onChange={(value) => updateForm("currentAddress", value)}
    />

    <TextArea
      label="Permanent Address"
      rows={3}
      value={form.permanentAddress}
      onChange={(value) => updateForm("permanentAddress", value)}
    />
  </div>
</Panel>

                <Panel
                  title="Title Chain"
                  subtitle="Add title transfer history and proposed mortgage details."
                  icon={FaFileSignature}
                >
                  <div className="space-y-3">
                    {form.titleChain.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[100px_1fr_1fr_80px]"
                      >
                        <Field
                          label="Year"
                          value={item.year}
                          onChange={(value) =>
                            updateTitleChain(index, "year", value)
                          }
                        />

                        <Field
                          label="Title"
                          value={item.title}
                          onChange={(value) =>
                            updateTitleChain(index, "title", value)
                          }
                        />

                        <Field
                          label="Details"
                          value={item.subtitle}
                          onChange={(value) =>
                            updateTitleChain(index, "subtitle", value)
                          }
                        />

                        <button
                          type="button"
                          disabled={form.titleChain.length <= 1}
                          onClick={() => removeTitleChainRow(index)}
                          className="self-end rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addTitleChainRow}
                      className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-black text-purple-700"
                    >
                      + Add Title Chain Row
                    </button>
                  </div>
                </Panel>

                <Panel
                  title="Legal Checklist"
                  subtitle="Mandatory legal checks before Ops Maker movement."
                  icon={FaShieldAlt}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {form.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => updateChecklist(item.id)}
                          className="mt-1 h-4 w-4 accent-purple-600"
                        />

                        <span>
                          <span className="block text-xs font-black text-slate-800">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                            {item.subtitle}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="space-y-6">
                <div className="sticky top-6 space-y-6">
                  <Panel
                    title="Legal Opinion"
                    subtitle="Final Legal decision and remarks."
                    icon={FaBalanceScale}
                  >
                    <div className="space-y-4">
                      <SelectField
                        label="Title Status *"
                        value={form.titleStatus}
                        options={["", "Clear", "Conditional", "Adverse", "Pending"]}
                        onChange={(value) => updateForm("titleStatus", value)}
                      />

                      <SelectField
                        label="Encumbrance Status"
                        value={form.encumbranceStatus}
                        options={[
                          "",
                          "No adverse encumbrance",
                          "Existing charge found",
                          "Pending verification",
                        ]}
                        onChange={(value) =>
                          updateForm("encumbranceStatus", value)
                        }
                      />

                      <SelectField
                        label="CERSAI Result"
                        value={form.cersaiResult}
                        options={[
                          "",
                          "No active charge",
                          "Active charge found",
                          "Search pending",
                        ]}
                        onChange={(value) => updateForm("cersaiResult", value)}
                      />

                      <SelectField
                        label="Final Legal Status *"
                        value={form.finalLegalStatus}
                        options={["", "Positive", "Conditional", "Negative", "Pending"]}
                        onChange={(value) =>
                          updateForm("finalLegalStatus", value)
                        }
                      />

                      <TextArea
                        label="Conditions / Deficiencies"
                        value={form.conditions}
                        onChange={(value) => updateForm("conditions", value)}
                      />

                      <TextArea
                        label="Legal Opinion Summary *"
                        value={form.opinionSummary}
                        onChange={(value) =>
                          updateForm("opinionSummary", value)
                        }
                      />

                      <TextArea
                        label="Legal Remarks"
                        value={form.legalRemarks}
                        onChange={(value) => updateForm("legalRemarks", value)}
                      />

                      <TextArea
                        label="Query Remarks"
                        value={form.queryRemarks}
                        onChange={(value) => updateForm("queryRemarks", value)}
                      />

                      <TextArea
                        label="Negative Remarks"
                        value={form.negativeRemarks}
                        onChange={(value) =>
                          updateForm("negativeRemarks", value)
                        }
                      />

                      <TextArea
                        label="Ops Maker Instructions *"
                        value={form.opsInstructions}
                        onChange={(value) =>
                          updateForm("opsInstructions", value)
                        }
                      />
                    </div>
                  </Panel>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
                    Legal can save draft, raise query, mark negative, or approve
                    and move the case to Ops Maker.
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSaveDraft}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                    >
                      Save Draft
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleRaiseQuery}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                    >
                      Raise Legal Query
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleMarkNegative}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-rose-700 shadow-sm transition-all hover:bg-rose-100 disabled:opacity-50"
                    >
                      Mark Negative
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleApproveToOpsMaker}
                      className="rounded-xl bg-[#0f2942] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#183d62] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {approveToOpsMakerMutation.isPending
                        ? "Moving..."
                        : "Approve & Send to Ops Maker"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-500">
              Final submit saves Legal data in <b>legal_assessments</b> and
              moves the application to <b>OPS_MAKER_PENDING</b>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowCard() {
  return (
    <div className="rounded-[26px] border border-purple-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6 overflow-x-auto">
        {workflowSteps.map((step, index) => {
          const completed = step.status === "completed";
          const current = step.status === "current";

          return (
            <div
              key={step.id}
              className="flex min-w-[120px] flex-1 flex-col items-center text-center"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : current
                        ? "bg-purple-600 text-white ring-8 ring-purple-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <FaCheck /> : step.id}
                </div>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden h-0.5 w-14 bg-purple-200 xl:block" />
                )}
              </div>

              <p
                className={`mt-3 text-xs font-black ${
                  current ? "text-purple-700" : "text-slate-700"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderButton({ children, icon: Icon, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-purple-700 shadow-sm transition-all hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={13} />
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
      {children}
    </span>
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
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
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
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
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
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
        >
          {options.map((option) => (
            <option key={option || "blank"} value={option}>
              {option || "Select"}
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
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
      />
    </div>
  );
}

function DisplayBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {valueOrEmpty(value) || "—"}
      </p>
    </div>
  );
}

function ReadOnlyText({ label, value }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
        {valueOrEmpty(value) || "—"}
      </p>
    </div>
  );
}