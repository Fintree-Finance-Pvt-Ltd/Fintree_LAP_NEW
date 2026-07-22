import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../applications/applicationsApi.js";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBuilding,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFilter,
  FaPaperPlane,
  FaPrint,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaStopwatch,
  FaTimes,
  FaUndo,
  FaUserTie,
} from "react-icons/fa";

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "",
  );
}

function extractArrayPayload(response) {
  const candidates = [
    response,
    response?.data,
    response?.applications,
    response?.data?.data,
    response?.data?.applications,
    response?.data?.data?.data,
    response?.data?.data?.applications,
  ];

  return (
    candidates.find((value) =>
      Array.isArray(value),
    ) || []
  );
}

function unwrapObjectPayload(response) {
  let current = response;

  for (let index = 0; index < 4; index += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(
        current,
        "data",
      )
    ) {
      break;
    }

    current = current.data;
  }

  return current;
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function calculateTat(value) {
  if (!value) {
    return "0h";
  }

  const updatedAt = new Date(value);

  if (Number.isNaN(updatedAt.getTime())) {
    return "0h";
  }

  const totalMinutes = Math.max(
    0,
    Math.floor(
      (Date.now() - updatedAt.getTime()) /
        (1000 * 60),
    ),
  );

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor(
    (totalMinutes % (24 * 60)) / 60,
  );
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatStatus(value, fallback = "-") {
  if (!value) {
    return fallback;
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getInitials(name) {
  return String(name || "NA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function calculateLtv(sanctionedAmount, marketValue) {
  const sanctioned = Number(sanctionedAmount);
  const market = Number(marketValue);

  if (
    !Number.isFinite(sanctioned) ||
    !Number.isFinite(market) ||
    market <= 0
  ) {
    return "-";
  }

  return `${((sanctioned / market) * 100).toFixed(2)}%`;
}

function mapApplicationToCase(item = {}) {
  const profile = item.customerProfile || {};

  const customerName =
    firstValue(
      item.customerName,
      item.applicantName,
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
    ) || "Unknown Customer";

  const requestedAmount = firstValue(
    item.requestedAmount,
    item.loanAmount,
    0,
  );

  const sanctionedAmount = firstValue(
    item.sanctionedAmount,
    item.recommendedAmount,
    profile.recommendedAmount,
    profile.eligibleAmount,
    requestedAmount,
  );

  const marketValue = firstValue(
    item.marketValue,
    item.valuationAmount,
    profile.marketValue,
  );

  const updatedAt = firstValue(
    item.legalApprovedAt,
    item.approvedAt,
    item.updatedAt,
    item.updated_at,
  );

  const rawStatus = firstValue(
    item.status,
    item.applicationStatus,
    "LEGAL_APPROVED",
  );

  return {
    id:
      firstValue(
        item.applicationNumber,
        item.application_number,
        item.id,
      ) || "-",

    databaseId: Number(
      firstValue(item.applicationId, item.id),
    ),

    applicant: customerName,
    initials: getInitials(customerName),

    mobile:
      firstValue(
        item.mobile,
        item.mobileNumber,
        profile.mobile,
      ) || "-",

    pan:
      firstValue(
        item.pan,
        item.panNumber,
        profile.panNumber,
      ) || "-",

    profile:
      formatStatus(
        firstValue(
          item.applicantProfile,
          item.occupationType,
          profile.occupationType,
        ),
        "-",
      ),

    source:
      firstValue(item.source, item.leadSource) ||
      "Direct",

    loanAmount: formatCurrency(requestedAmount),
    sanctionedAmount: formatCurrency(
      sanctionedAmount,
    ),

    propertyType:
      firstValue(
        item.propertyType,
        profile.propertyType,
      ) || "Open to view",

    propertyLocation:
      firstValue(
        item.propertyAddress,
        item.propertyLocation,
        profile.propertyAddress,
      ) || "Open to view",

    branch:
      firstValue(
        item.branchName,
        item.branch,
        profile.branchName,
        profile.propertyCity,
      ) || "-",

    legalStatus:
      String(rawStatus).toUpperCase() ===
      "LEGAL_APPROVED"
        ? "Legal Cleared"
        : formatStatus(rawStatus),

    checkerStatus: formatStatus(
      firstValue(
        item.checkerStatus,
        item.opsCheckerStatus,
        "PENDING_CHECKER",
      ),
      "Pending Checker",
    ),

    priority: formatStatus(
      firstValue(item.priority, "NORMAL"),
      "Normal",
    ),

    legalOfficer:
      firstValue(
        item.legalOfficerName,
        item.legalOfficer,
        item.updatedByName,
      ) || "-",

    approvedDate: formatDate(updatedAt),
    legalTat: calculateTat(updatedAt),

    completion: Number(
      firstValue(
        item.completionPercentage,
        item.completion,
        85,
      ),
    ),

    titleStatus:
      firstValue(
        item.titleStatus,
        profile.titleStatus,
      ) || "-",

    valuationAmount: formatCurrency(marketValue),

    ltv:
      firstValue(item.ltv, profile.ltv) ||
      calculateLtv(sanctionedAmount, marketValue),

    ownership:
      firstValue(
        item.ownership,
        item.propertyOwnership,
        profile.ownership,
        profile.propertyOwnership,
      ) || "-",

    searchReport:
      firstValue(
        item.searchReportStatus,
        item.searchReport,
        profile.searchReportStatus,
      ) || "-",

    encumbrance:
      firstValue(
        item.encumbranceStatus,
        item.encumbrance,
        profile.encumbranceStatus,
      ) || "-",

    mortgageType:
      firstValue(
        item.mortgageType,
        profile.mortgageType,
      ) || "-",

    recommendation:
      firstValue(
        item.recommendation,
        item.legalRecommendation,
        profile.rmRecommendation,
      ) || "Positive",
  };
}



const initialChecklist = [
  {
    id: 1,
    title: "Title ownership chain verified",
    description: "Ownership chain and previous sale deeds reviewed",
    checked: true,
    mandatory: true,
  },
  {
    id: 2,
    title: "Search report is valid and current",
    description: "Search report covers the required legal period",
    checked: true,
    mandatory: true,
  },
  {
    id: 3,
    title: "Encumbrance certificate verified",
    description: "Existing charges and liens have been identified",
    checked: true,
    mandatory: true,
  },
  {
    id: 4,
    title: "Property documents match applicant details",
    description: "Applicant and property owner information matched",
    checked: true,
    mandatory: true,
  },
  {
    id: 5,
    title: "Approved building plan available",
    description: "Plan approval and authority validation completed",
    checked: true,
    mandatory: true,
  },
  {
    id: 6,
    title: "Property tax receipts are current",
    description: "No material municipal dues are pending",
    checked: true,
    mandatory: true,
  },
  {
    id: 7,
    title: "Legal conditions captured correctly",
    description: "All pre-disbursement conditions are recorded",
    checked: true,
    mandatory: true,
  },
  {
    id: 8,
    title: "Mortgage route is legally valid",
    description: "MODT or registered mortgage process confirmed",
    checked: true,
    mandatory: true,
  },
  {
    id: 9,
    title: "Original document inventory confirmed",
    description: "Original documents are available for vaulting",
    checked: false,
    mandatory: true,
  },
  {
    id: 10,
    title: "Independent checker declaration",
    description: "Legal checker independently reviewed the legal opinion",
    checked: false,
    mandatory: true,
  },
];

const legalConditions = [
  {
    id: 1,
    condition: "Original title deed to be deposited before disbursement",
    owner: "Operations",
    dueDate: "22 Jul 2026",
    status: "Open",
  },
  {
    id: 2,
    condition: "MODT registration evidence to be uploaded",
    owner: "Legal",
    dueDate: "22 Jul 2026",
    status: "Open",
  },
  {
    id: 3,
    condition: "Latest property tax receipt to be retained",
    owner: "Applicant",
    dueDate: "21 Jul 2026",
    status: "Completed",
  },
];

const legalDocuments = [
  {
    id: 1,
    name: "Legal Search Report",
    type: "PDF",
    uploadedBy: "Ritika Sharma",
    status: "Verified",
  },
  {
    id: 2,
    name: "Title Document Chain",
    type: "PDF",
    uploadedBy: "Legal Team",
    status: "Verified",
  },
  {
    id: 3,
    name: "Encumbrance Certificate",
    type: "PDF",
    uploadedBy: "Legal Team",
    status: "Verified",
  },
  {
    id: 4,
    name: "Approved Building Plan",
    type: "PDF",
    uploadedBy: "Applicant",
    status: "Verified",
  },
];

const statusClasses = {
  "Pending Checker":
    "border-amber-200 bg-amber-50 text-amber-700",
  "Query Raised":
    "border-rose-200 bg-rose-50 text-rose-700",
  "Checker Approved":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const priorityClasses = {
  Critical: "border-rose-200 bg-rose-50 text-rose-700",
  High: "border-amber-200 bg-amber-50 text-amber-700",
  Normal: "border-slate-200 bg-slate-50 text-slate-600",
};

const caseProgressClasses = {
  74: "w-[74%]",
  82: "w-[82%]",
  85: "w-[85%]",
  88: "w-[88%]",
  91: "w-[91%]",
  100: "w-full",
};

const checklistProgressClasses = {
  0: "w-0",
  1: "w-[10%]",
  2: "w-[20%]",
  3: "w-[30%]",
  4: "w-[40%]",
  5: "w-1/2",
  6: "w-[60%]",
  7: "w-[70%]",
  8: "w-[80%]",
  9: "w-[90%]",
  10: "w-full",
};

function convertTatToHours(tatValue) {
  const value = String(tatValue || "");

  const dayMatch = value.match(/(\d+)\s*d/i);
  const hourMatch = value.match(/(\d+)\s*h/i);
  const minuteMatch = value.match(/(\d+)\s*m/i);

  const days = dayMatch ? Number(dayMatch[1]) : 0;
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  return days * 24 + hours + minutes / 60;
}

function getTatStatus(tatValue) {
  const totalHours = convertTatToHours(tatValue);

  if (totalHours <= 24) {
    return "Within SLA";
  }

  if (totalHours <= 48) {
    return "At Risk";
  }

  return "Breached";
}

function getTatClass(tatValue) {
  const status = getTatStatus(tatValue);

  if (status === "Within SLA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function SectionTitle({ eyebrow, title, rightContent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#203b67] sm:text-xl">
          {title}
        </h2>

        <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" />
      </div>

      {rightContent}
    </div>
  );
}

function DetailRow({ label, value, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,1fr)] items-start gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span className="text-xs font-medium leading-5 text-slate-500">
        {label}
      </span>

      {children || (
        <strong className="text-right text-xs font-extrabold leading-5 text-[#29436f]">
          {value}
        </strong>
      )}
    </div>
  );
}

export default function LegalCleared() {
  const [selectedCaseId, setSelectedCaseId] =
    useState(null);

  const [searchText, setSearchText] = useState("");
  const [checkerFilter, setCheckerFilter] =
    useState("All Status");
  const [branchFilter, setBranchFilter] =
    useState("All Branches");
  const [priorityFilter, setPriorityFilter] =
    useState("All Priority");
  const [tatFilter, setTatFilter] = useState("All TAT");

  const [checklist, setChecklist] =
    useState(initialChecklist);
  const [checkerRemarks, setCheckerRemarks] =
    useState("");

  const [pageStatus, setPageStatus] =
    useState("Pending Checker");

  const [submissionStatus, setSubmissionStatus] =
    useState("Legal Checker Review");

  const [toastMessage, setToastMessage] = useState("");

  const [isPddQueryOpen, setIsPddQueryOpen] =
    useState(false);
  const [pddQuery, setPddQuery] = useState("");
  const [pddQueryError, setPddQueryError] =
    useState("");

  /*
   * Board source:
   * applications.stage = OPERATION
   * applications.status = LEGAL_APPROVED
   *
   * The backend endpoint performs this filtering.
   */
  const legalApprovedQuery = useQuery({
    queryKey: [
      "legal-approved-applications",
      searchText.trim(),
    ],

    /*
     * apiClient already returns response.data from its response
     * interceptor, so this query must return the API result directly.
     */
    queryFn: () =>
      applicationsApi.legalApproved({
        page: 1,
        limit: 100,
        search: searchText.trim() || undefined,
      }),

    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const legalCases = useMemo(() => {
    const records = extractArrayPayload(
      legalApprovedQuery.data,
    );

    return records
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item),
      )
      .map(mapApplicationToCase)
      .filter(
        (item) =>
          item &&
          item.id !== undefined &&
          item.id !== null,
      );
  }, [legalApprovedQuery.data]);

  useEffect(() => {
    const firstCase =
      legalCases.find(
        (item) =>
          item &&
          item.id !== undefined &&
          item.id !== null,
      ) || null;

    if (!firstCase) {
      setSelectedCaseId(null);
      return;
    }

    const selectionStillExists = legalCases.some(
      (item) => item?.id === selectedCaseId,
    );

    if (!selectionStillExists) {
      setSelectedCaseId(firstCase.id);
      setPageStatus(
        firstCase.checkerStatus ||
          "Pending Checker",
      );
    }
  }, [legalCases, selectedCaseId]);

  const selectedListCase = useMemo(() => {
    if (!legalCases.length) {
      return null;
    }

    return (
      legalCases.find(
        (item) => item?.id === selectedCaseId,
      ) ||
      legalCases.find(Boolean) ||
      null
    );
  }, [legalCases, selectedCaseId]);

  /*
   * The board list uses only applications.
   * Complete customer/profile information is loaded only
   * when a case is selected through the existing
   * GET /applications/:id endpoint.
   */
  const selectedApplicationId =
    selectedListCase?.databaseId ?? null;

  const selectedCaseDetailsQuery = useQuery({
    queryKey: [
      "legal-approved-application-details",
      selectedApplicationId,
    ],

    queryFn: () => {
      if (!selectedApplicationId) {
        return null;
      }

      return applicationsApi.get(
        selectedApplicationId,
      );
    },

    enabled: Boolean(selectedApplicationId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const selectedCase = useMemo(() => {
    if (!selectedListCase) {
      return null;
    }

    const detailRecord = unwrapObjectPayload(
      selectedCaseDetailsQuery.data,
    );

    if (
      !detailRecord ||
      typeof detailRecord !== "object" ||
      Array.isArray(detailRecord)
    ) {
      return selectedListCase;
    }

    return {
      ...selectedListCase,
      ...mapApplicationToCase({
        ...detailRecord,
        id:
          detailRecord.id ??
          selectedListCase.databaseId,
        applicationId:
          detailRecord.applicationId ??
          selectedListCase.databaseId,
        applicationNumber:
          detailRecord.applicationNumber ??
          selectedListCase.id,
      }),
    };
  }, [
    selectedCaseDetailsQuery.data,
    selectedListCase,
  ]);

  const branchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          legalCases
            .map((item) => item?.branch)
            .filter(
              (value) =>
                value &&
                value !== "-" &&
                value !== "Open to view",
            ),
        ),
      ).sort(),
    [legalCases],
  );

  const priorityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          legalCases
            .map((item) => item?.priority)
            .filter(Boolean),
        ),
      ).sort(),
    [legalCases],
  );

  const filteredCases = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase();

    return legalCases.filter((item) => {
      if (!item) {
        return false;
      }

      const matchesSearch =
        !searchValue ||
        [
          item.id,
          item.applicant,
          item.mobile,
          item.pan,
          item.propertyType,
          item.propertyLocation,
          item.branch,
          item.legalOfficer,
        ].some((value) =>
          String(value).toLowerCase().includes(searchValue),
        );

      const matchesCheckerStatus =
        checkerFilter === "All Status" ||
        item.checkerStatus === checkerFilter;

      const matchesBranch =
        branchFilter === "All Branches" ||
        item.branch === branchFilter;

      const matchesPriority =
        priorityFilter === "All Priority" ||
        item.priority === priorityFilter;

      const matchesTat =
        tatFilter === "All TAT" ||
        getTatStatus(item.legalTat) === tatFilter;

      return (
        matchesSearch &&
        matchesCheckerStatus &&
        matchesBranch &&
        matchesPriority &&
        matchesTat
      );
    });
  }, [
    branchFilter,
    checkerFilter,
    legalCases,
    priorityFilter,
    searchText,
    tatFilter,
  ]);

  const dashboardMetrics = useMemo(() => {
    const awaitingChecker = legalCases.filter(
      (item) =>
        item.checkerStatus ===
        "Pending Checker",
    ).length;

    const queryRaised = legalCases.filter(
      (item) =>
        item.checkerStatus === "Query Raised",
    ).length;

    const totalTatHours = legalCases.reduce(
      (sum, item) =>
        sum +
        convertTatToHours(item.legalTat),
      0,
    );

    const averageTatHours = legalCases.length
      ? totalTatHours / legalCases.length
      : 0;

    const averageTat =
      averageTatHours >= 24
        ? `${(averageTatHours / 24).toFixed(
            1,
          )} Days`
        : `${averageTatHours.toFixed(1)} Hours`;

    return [
      {
        label: "LEGAL CLEARED",
        value: String(legalCases.length),
        helper:
          "Fetched from applications table",
        border: "border-teal-200",
        valueClass: "text-teal-600",
        circle: "bg-teal-500/10",
      },
      {
        label: "AWAITING CHECKER",
        value: String(awaitingChecker),
        helper: "Pending checker review",
        border: "border-blue-200",
        valueClass: "text-blue-600",
        circle: "bg-blue-500/10",
      },
      {
        label: "QUERY RAISED",
        value: String(queryRaised),
        helper: "Cases requiring resolution",
        border: "border-pink-200",
        valueClass: "text-pink-600",
        circle: "bg-pink-500/10",
      },
      {
        label: "AVERAGE LEGAL TAT",
        value: averageTat,
        helper: "Calculated from updated date",
        border: "border-orange-200",
        valueClass: "text-orange-500",
        circle: "bg-orange-500/10",
      },
    ];
  }, [legalCases]);

  const verifiedCount = checklist.filter(
    (item) => item.checked,
  ).length;

  const allMandatoryVerified = checklist
    .filter((item) => item.mandatory)
    .every((item) => item.checked);

  const showToast = (message) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const toggleChecklist = (itemId) => {
    setChecklist((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    );
  };

  const selectCase = (item) => {
    if (!item?.id) {
      return;
    }

    setSelectedCaseId(item.id);
    setPageStatus(
      item.checkerStatus || "Pending Checker",
    );
    setSubmissionStatus("Legal Checker Review");
    setCheckerRemarks("");
  };

  const saveDraft = () => {
    if (!selectedCase) {
      return;
    }

    setSubmissionStatus("Draft Saved");

    showToast(
      `${selectedCase.id} legal review saved as draft.`,
    );
  };

  const openPddQuery = () => {
    setPddQueryError("");
    setPddQuery("");
    setIsPddQueryOpen(true);
  };

  const closePddQuery = () => {
    setIsPddQueryOpen(false);
    setPddQuery("");
    setPddQueryError("");
  };

  const submitPddQuery = () => {
    if (!selectedCase) {
      return;
    }

    if (!pddQuery.trim()) {
      setPddQueryError(
        "Please enter the PDD query before submitting.",
      );
      return;
    }

    setPageStatus("Query Raised");
    setSubmissionStatus("PDD Query Raised");

    closePddQuery();

    showToast(
      `${selectedCase.id} PDD query raised successfully.`,
    );
  };

  const submitToOpsHead = () => {
    if (!selectedCase) {
      return;
    }

    if (!allMandatoryVerified) {
      showToast(
        "Complete all mandatory legal verification points before submission.",
      );
      return;
    }

    setPageStatus("Checker Approved");
    setSubmissionStatus("Submitted to OPS HEAD");

    showToast(
      `${selectedCase.id} submitted successfully to OPS HEAD.`,
    );
  };

  const resetLegalFilters = () => {
    setSearchText("");
    setCheckerFilter("All Status");
    setBranchFilter("All Branches");
    setPriorityFilter("All Priority");
    setTatFilter("All TAT");
  };

  if (legalApprovedQuery.isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-[#f4f7fb] p-6">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />

          <p className="mt-4 text-sm font-extrabold text-slate-700">
            Loading legally approved cases...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching OPERATION / LEGAL_APPROVED
            applications.
          </p>
        </div>
      </div>
    );
  }

  if (legalApprovedQuery.isError) {
    const errorMessage =
      legalApprovedQuery.error?.message ||
      "Unable to fetch legally approved applications.";

    return (
      <div className="grid min-h-[70vh] place-items-center bg-[#f4f7fb] p-6">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <FaExclamationTriangle
            className="mx-auto text-rose-500"
            size={30}
          />

          <h2 className="mt-4 text-lg font-black text-slate-800">
            Unable to load Legal Approved cases
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              legalApprovedQuery.refetch()
            }
            className="mt-5 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-black text-white transition hover:bg-teal-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-[#f4f7fb] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <FaBalanceScale size={25} />
          </span>

          <h2 className="mt-5 text-xl font-black text-slate-800">
            No Legal Approved Cases
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            No application currently matches stage{" "}
            <strong>OPERATION</strong> and status{" "}
            <strong>LEGAL_APPROVED</strong>.
          </p>

          <button
            type="button"
            onClick={() =>
              legalApprovedQuery.refetch()
            }
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-xs font-black text-white transition hover:bg-teal-800"
          >
            <FaUndo size={11} />
            Refresh Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[30px] bg-gradient-to-r from-[#127d91] via-[#167b8e] to-[#47b4ad] px-6 py-8 text-white shadow-[0_24px_65px_rgba(20,126,143,0.24)] sm:px-8 sm:py-10 xl:flex xl:min-h-[235px] xl:items-center xl:justify-between xl:gap-10">
          <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-cyan-400/25" />

          <div className="absolute left-[25%] top-0 -z-10 h-full w-52 skew-x-[-14deg] bg-indigo-500/35" />

          <div className="absolute -bottom-40 -right-16 -z-10 h-96 w-96 rounded-full border-[70px] border-white/5" />

          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] backdrop-blur">
              <FaBalanceScale size={15} />
              Legal Clearance Workspace
            </span>

            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-[44px]">
              Legal Cleared Cases
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-cyan-50/90 sm:text-base">
              Review legally approved LAP cases, verify the
              legal opinion, raise PDD queries and submit
              eligible applications to OPS HEAD.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
                <FaBuilding size={13} />
                Delhi Region
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
                <FaUserTie size={13} />
                Legal Checker
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950/15 px-3 py-2 text-xs font-semibold">
                <FaClock size={13} />
                Updated just now
              </span>

              <span
                className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-black ${
                  submissionStatus === "Submitted to OPS HEAD"
                    ? "bg-emerald-100 text-emerald-800"
                    : submissionStatus === "PDD Query Raised"
                      ? "bg-rose-100 text-rose-800"
                      : submissionStatus === "Draft Saved"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white/15 text-white"
                }`}
              >
                {submissionStatus}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 xl:mt-0 xl:max-w-[520px] xl:justify-end">
            <span
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black ${getTatClass(
                selectedCase.legalTat,
              )}`}
            >
              <FaStopwatch size={14} />
              TAT: {selectedCase.legalTat}
            </span>

            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 xl:flex-none"
            >
              <FaSave size={13} />
              Save Draft
            </button>

            <button
              type="button"
              onClick={openPddQuery}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-amber-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-50 xl:flex-none"
            >
              <FaFileAlt size={13} />
              Raise PDD Query
            </button>

            <button
              type="button"
              disabled={!allMandatoryVerified}
              onClick={submitToOpsHead}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-black shadow-lg transition xl:w-auto ${
                allMandatoryVerified
                  ? "bg-[#173c70] text-white hover:-translate-y-0.5 hover:bg-[#102e58]"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              <FaPaperPlane size={13} />
              Submit to OPS HEAD
            </button>
          </div>
        </section>

        {/* Workflow */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              id: 1,
              title: "Credit Approved",
              status: "Completed",
              completed: true,
            },
            {
              id: 2,
              title: "Legal Maker",
              status: "Completed",
              completed: true,
            },
            {
              id: 3,
              title: "Legal Cleared",
              status: "Current",
              current: true,
            },
            {
              id: 4,
              title: "OPS HEAD",
              status:
                submissionStatus === "Submitted to OPS HEAD"
                  ? "Submitted"
                  : "Pending",
              completed:
                submissionStatus === "Submitted to OPS HEAD",
            },
          ].map((item, index, array) => (
            <div
              key={item.id}
              className="relative flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-black ${
                  item.completed
                    ? "bg-emerald-500 text-white"
                    : item.current
                      ? "bg-teal-600 text-white ring-4 ring-teal-100"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {item.completed ? (
                  <FaCheck size={14} />
                ) : (
                  item.id
                )}
              </span>

              <div>
                <strong className="block text-sm font-extrabold text-slate-800">
                  {item.title}
                </strong>

                <span
                  className={`mt-1 block text-xs font-medium ${
                    item.completed
                      ? "text-emerald-600"
                      : item.current
                        ? "text-teal-600"
                        : "text-slate-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {index < array.length - 1 && (
                <span className="absolute -right-4 z-10 hidden text-lg text-teal-600 xl:block">
                  →
                </span>
              )}
            </div>
          ))}
        </section>

        {/* Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((item) => (
            <article
              key={item.label}
              className={`relative min-h-40 overflow-hidden rounded-[26px] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${item.border}`}
            >
              <span
                className={`absolute -right-10 -top-12 h-36 w-36 rounded-full ${item.circle}`}
              />

              <span
                className={`absolute -right-2 -top-2 h-24 w-24 rounded-full ${item.circle}`}
              />

              <p className="relative text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {item.label}
              </p>

              <strong
                className={`relative mt-5 block text-3xl font-black ${item.valueClass}`}
              >
                {item.value}
              </strong>

              <p className="relative mt-2 text-xs text-slate-500">
                {item.helper}
              </p>
            </article>
          ))}
        </section>

        {/* Filters */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Queue filters
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-[#203b67]">
                Legal Cleared Case Filters
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black ${getTatClass(
                  selectedCase.legalTat,
                )}`}
              >
                <FaStopwatch size={11} />
                Selected Case:{" "}
                {getTatStatus(selectedCase.legalTat)}
              </span>

              <button
                type="button"
                onClick={resetLegalFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-100"
              >
                <FaUndo size={11} />
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 transition focus-within:border-teal-300 focus-within:bg-white">
              <FaSearch size={13} />

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search case or applicant"
                className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="relative flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <FaBuilding
                className="text-slate-400"
                size={12}
              />

              <select
                value={branchFilter}
                onChange={(event) =>
                  setBranchFilter(event.target.value)
                }
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All Branches">
                  All Branches
                </option>

                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>

              <FaChevronDown
                className="pointer-events-none absolute right-3 text-slate-400"
                size={9}
              />
            </label>

            <label className="relative flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <FaShieldAlt
                className="text-slate-400"
                size={12}
              />

              <select
                value={checkerFilter}
                onChange={(event) =>
                  setCheckerFilter(event.target.value)
                }
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All Status">All Status</option>
                <option value="Pending Checker">
                  Pending Checker
                </option>
                <option value="Query Raised">
                  Query Raised
                </option>
                <option value="Checker Approved">
                  Checker Approved
                </option>
              </select>

              <FaChevronDown
                className="pointer-events-none absolute right-3 text-slate-400"
                size={9}
              />
            </label>

            <label className="relative flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <FaFilter
                className="text-slate-400"
                size={12}
              />

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All Priority">
                  All Priority
                </option>

                {priorityOptions.map((priority) => (
                  <option
                    key={priority}
                    value={priority}
                  >
                    {priority}
                  </option>
                ))}
              </select>

              <FaChevronDown
                className="pointer-events-none absolute right-3 text-slate-400"
                size={9}
              />
            </label>

            <label className="relative flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <FaStopwatch
                className="text-slate-400"
                size={12}
              />

              <select
                value={tatFilter}
                onChange={(event) =>
                  setTatFilter(event.target.value)
                }
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All TAT">All TAT</option>
                <option value="Within SLA">Within SLA</option>
                <option value="At Risk">At Risk</option>
                <option value="Breached">Breached</option>
              </select>

              <FaChevronDown
                className="pointer-events-none absolute right-3 text-slate-400"
                size={9}
              />
            </label>
          </div>
        </section>

        {/* Legal Approved Cases */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-7">
            <SectionTitle
              eyebrow="Legal approval queue"
              title="All Legal Approved Cases"
            />

            <span className="rounded-full bg-teal-50 px-3 py-2 text-[10px] font-black text-teal-700">
              {filteredCases.length} cases
            </span>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 px-4 pb-5 sm:px-7">
            <table className="mt-5 w-full min-w-[1250px] overflow-hidden rounded-2xl border border-slate-200 text-left">
              <thead>
                <tr className="bg-teal-50">
                  {[
                    "Case",
                    "Applicant",
                    "Loan",
                    "Property",
                    "Legal Opinion",
                    "Checker Status",
                    "Legal Officer / TAT",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-teal-200 px-5 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-teal-800"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item, index) => {
                  const isSelected =
                    item?.id === selectedCaseId;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => selectCase(item)}
                      className={`cursor-pointer border-b border-slate-100 transition last:border-b-0 ${
                        isSelected
                          ? "bg-teal-50/70"
                          : index % 2 === 1
                            ? "bg-slate-50/60 hover:bg-teal-50/40"
                            : "bg-white hover:bg-teal-50/40"
                      }`}
                    >
                      <td className="px-5 py-5 align-top">
                        <strong className="block text-xs font-black text-[#30476d]">
                          {item.id}
                        </strong>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          {item.source}
                        </span>

                        <span
                          className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase ${
                            priorityClasses[item.priority]
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <div className="flex min-w-44 items-center gap-3">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black ${
                              isSelected
                                ? "bg-teal-600 text-white"
                                : "bg-teal-50 text-teal-700"
                            }`}
                          >
                            {item.initials}
                          </span>

                          <div>
                            <strong className="block text-xs font-extrabold text-slate-700">
                              {item.applicant}
                            </strong>

                            <span className="mt-1 block text-[10px] text-slate-500">
                              {item.mobile}
                            </span>

                            <span className="block text-[10px] text-slate-400">
                              {item.pan}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <strong className="block whitespace-nowrap text-xs font-extrabold text-[#30476d]">
                          {item.loanAmount}
                        </strong>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Sanctioned:{" "}
                          {item.sanctionedAmount}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <span className="block max-w-40 text-xs font-medium leading-5 text-[#30476d]">
                          {item.propertyType}
                        </span>

                        <span className="mt-1 block max-w-40 text-[10px] leading-4 text-slate-500">
                          {item.propertyLocation}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                          {item.recommendation}
                        </span>

                        <span className="mt-2 block max-w-40 text-[10px] leading-4 text-slate-500">
                          {item.titleStatus}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black ${
                            statusClasses[item.checkerStatus]
                          }`}
                        >
                          {item.checkerStatus}
                        </span>

                        <div className="mt-3 w-32">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className={`block h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 ${
                                caseProgressClasses[
                                  item.completion
                                ] || "w-0"
                              }`}
                            />
                          </div>

                          <span className="mt-1 block text-[9px] text-slate-400">
                            {item.completion}% complete
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <strong className="block text-xs font-bold text-slate-700">
                          {item.legalOfficer}
                        </strong>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          {item.approvedDate}
                        </span>

                        <span
                          className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${getTatClass(
                            item.legalTat,
                          )}`}
                        >
                          <FaStopwatch size={9} />
                          {item.legalTat} ·{" "}
                          {getTatStatus(item.legalTat)}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-top">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectCase(item);
                          }}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#30476d] shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                        >
                          <FaEye size={12} />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCases.length === 0 && (
              <div className="grid min-h-52 place-content-center gap-3 text-center">
                <FaSearch
                  size={22}
                  className="mx-auto text-slate-300"
                />

                <strong className="text-sm font-black text-slate-700">
                  No legal-cleared cases found
                </strong>

                <p className="text-xs text-slate-400">
                  Change the search or selected filters.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Checker Review */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(340px,1fr)]">
          <div className="space-y-6">
            {/* Checklist */}
            <section className="rounded-[28px] border border-teal-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionTitle
                eyebrow="Selected legal case"
                title="Legal Checker Checklist"
                rightContent={
                  <div className="text-right">
                    <strong className="block text-sm font-black text-teal-700">
                      {verifiedCount}/{checklist.length}
                    </strong>

                    <span className="text-[10px] text-slate-400">
                      Verified
                    </span>
                  </div>
                }
              />

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all ${
                    checklistProgressClasses[verifiedCount]
                  }`}
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                      item.checked
                        ? "border-teal-200 bg-teal-50/50"
                        : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() =>
                        toggleChecklist(item.id)
                      }
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-teal-600"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-800">
                          {item.title}
                        </strong>

                        {item.mandatory && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[8px] font-black uppercase text-rose-600">
                            Required
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>

                      <span
                        className={`mt-2 inline-flex text-[10px] font-black ${
                          item.checked
                            ? "text-teal-700"
                            : "text-amber-600"
                        }`}
                      >
                        {item.checked
                          ? "Verified"
                          : "Checker verification pending"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Conditions */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionTitle
                eyebrow="Legal controls"
                title="Pre-disbursement Legal Conditions"
              />

              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Condition
                      </th>

                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Owner
                      </th>

                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Due Date
                      </th>

                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {legalConditions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-5 py-4 text-xs font-bold leading-5 text-slate-700">
                          {item.condition}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {item.owner}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {item.dueDate}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                              item.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Documents */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionTitle
                eyebrow="Legal evidence"
                title="Legal Documents"
              />

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {legalDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700">
                      <FaFileAlt size={17} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-xs font-extrabold text-slate-800">
                        {document.name}
                      </strong>

                      <span className="mt-1 block text-[10px] text-slate-500">
                        {document.type} ·{" "}
                        {document.uploadedBy}
                      </span>

                      <span className="mt-2 inline-flex text-[9px] font-black text-emerald-700">
                        {document.status}
                      </span>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label={`Preview ${document.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <FaEye size={12} />
                      </button>

                      <button
                        type="button"
                        aria-label={`Download ${document.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                      >
                        <FaDownload size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Remarks */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionTitle
                eyebrow="Checker decision"
                title="Legal Checker Remarks"
              />

              <textarea
                rows={4}
                value={checkerRemarks}
                onChange={(event) =>
                  setCheckerRemarks(event.target.value)
                }
                placeholder="Enter legal checker observations, conditions or reasons for return..."
                className="mt-6 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-50"
              />

              {!allMandatoryVerified && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={14}
                  />

                  <p className="text-xs leading-5 text-amber-800">
                    Complete all mandatory verification
                    points before submitting this case to
                    OPS HEAD.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Panel */}
          <aside className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#146f82] to-[#43aaa4] p-6 text-white">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />

                <p className="relative text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                  Selected legal case
                </p>

                <div className="relative mt-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-sm font-black">
                    {selectedCase.initials}
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold">
                      {selectedCase.applicant}
                    </h3>

                    <p className="mt-1 text-xs text-cyan-100">
                      {selectedCase.id}
                    </p>
                  </div>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold">
                    {selectedCase.legalStatus}
                  </span>

                  <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold">
                    {selectedCase.priority} Priority
                  </span>
                </div>
              </div>

              <div className="p-6">
                <DetailRow
                  label="Sanctioned Amount"
                  value={selectedCase.sanctionedAmount}
                />

                <DetailRow
                  label="Property Value"
                  value={selectedCase.valuationAmount}
                />

                <DetailRow
                  label="LTV"
                  value={selectedCase.ltv}
                />

                <DetailRow
                  label="Property"
                  value={selectedCase.propertyType}
                />

                <DetailRow
                  label="Location"
                  value={selectedCase.propertyLocation}
                />

                <DetailRow
                  label="Ownership"
                  value={selectedCase.ownership}
                />

                <DetailRow
                  label="Title Status"
                  value={selectedCase.titleStatus}
                />

                <DetailRow
                  label="Search Report"
                  value={selectedCase.searchReport}
                />

                <DetailRow
                  label="Encumbrance"
                  value={selectedCase.encumbrance}
                />

                <DetailRow
                  label="Mortgage Route"
                  value={selectedCase.mortgageType}
                />

                <DetailRow label="TAT Status">
                  <span
                    className={`justify-self-end rounded-full border px-3 py-1.5 text-[10px] font-black ${getTatClass(
                      selectedCase.legalTat,
                    )}`}
                  >
                    {selectedCase.legalTat} ·{" "}
                    {getTatStatus(selectedCase.legalTat)}
                  </span>
                </DetailRow>

                <DetailRow label="Checker Status">
                  <span
                    className={`justify-self-end rounded-full border px-3 py-1.5 text-[10px] font-black ${
                      statusClasses[pageStatus] ||
                      statusClasses["Pending Checker"]
                    }`}
                  >
                    {pageStatus}
                  </span>
                </DetailRow>

                <DetailRow label="Workflow Status">
                  <span
                    className={`justify-self-end rounded-full border px-3 py-1.5 text-[10px] font-black ${
                      submissionStatus ===
                      "Submitted to OPS HEAD"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : submissionStatus ===
                            "PDD Query Raised"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : submissionStatus ===
                              "Draft Saved"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {submissionStatus}
                  </span>
                </DetailRow>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionTitle
                eyebrow="Legal opinion"
                title="Recommendation"
              />

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <FaCheckCircle
                    className="mt-0.5 shrink-0 text-emerald-700"
                    size={17}
                  />

                  <div>
                    <strong className="text-sm font-extrabold text-emerald-800">
                      {selectedCase.recommendation}
                    </strong>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      Property title and legal documents
                      are acceptable subject to recorded
                      pre-disbursement conditions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Review Completion
                  </span>

                  <strong className="text-xs font-black text-teal-700">
                    {verifiedCount * 10}%
                  </strong>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 ${
                      checklistProgressClasses[verifiedCount]
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={saveDraft}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                <FaSave size={12} />
                Save Draft
              </button>

              <button
                type="button"
                onClick={openPddQuery}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-black text-amber-700 transition hover:bg-amber-100"
              >
                <FaFileAlt size={12} />
                Raise PDD Query
              </button>

              <button
                type="button"
                disabled={!allMandatoryVerified}
                onClick={submitToOpsHead}
                className={`mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                  allMandatoryVerified
                    ? "bg-[#173c70] text-white hover:bg-[#102e58]"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                Submit to OPS HEAD
                <FaPaperPlane size={12} />
              </button>
            </section>

            <section className="relative overflow-hidden rounded-[28px] border border-amber-200 bg-[#fffaf0] p-5 shadow-sm">
              <div className="absolute right-0 top-0 h-20 w-24 rounded-bl-full bg-teal-400/15" />

              <div className="relative flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <FaShieldAlt size={15} />
                </span>

                <div>
                  <strong className="text-sm font-extrabold text-amber-800">
                    Independent Legal Check
                  </strong>

                  <p className="mt-2 text-xs leading-6 text-amber-700">
                    The checker must independently verify
                    title, encumbrance, ownership,
                    mortgage route and pending PDD
                    conditions before submission.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>

      {/* PDD Query Modal */}
      {isPddQueryOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
                    Pre-disbursement control
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Raise PDD Query
                  </h2>

                  <p className="mt-2 text-xs text-white/80">
                    {selectedCase.id} ·{" "}
                    {selectedCase.applicant}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close PDD query modal"
                  onClick={closePddQuery}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-600">
                  PDD Query Details
                </span>

                <textarea
                  rows={5}
                  value={pddQuery}
                  onChange={(event) => {
                    setPddQuery(event.target.value);

                    if (pddQueryError) {
                      setPddQueryError("");
                    }
                  }}
                  placeholder="Mention the pending document, responsible owner, expected resolution and due date..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-50"
                />
              </label>

              {pddQueryError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <FaExclamationTriangle
                    className="mt-0.5 shrink-0 text-rose-600"
                    size={14}
                  />

                  <p className="text-xs leading-5 text-rose-700">
                    {pddQueryError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePddQuery}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitPddQuery}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-xs font-black text-white transition hover:bg-amber-700"
                >
                  <FaFileAlt size={12} />
                  Submit PDD Query
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
            <FaCheck size={11} />
          </span>

          <p className="text-xs font-bold text-slate-700">
            {toastMessage}
          </p>

          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setToastMessage("")}
            className="text-slate-400 transition hover:text-slate-600"
          >
            <FaTimes size={10} />
          </button>
        </div>
      )}
    </div>
  );
}