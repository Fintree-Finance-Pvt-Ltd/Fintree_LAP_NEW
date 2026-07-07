import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaEye,
  FaFileImage,
  FaHome,
  FaIndustry,
  FaMapMarkedAlt,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { rmApi } from "../rmApi.js";
import {
  buildWorkflowTimeline,
  PROPERTY_CATEGORY,
  PROPERTY_TYPE,
} from "../rmUtils.js";

/* =========================================================
   VISIT BLOCKS
========================================================= */
export const VISIT_BLOCKS = {
  CUSTOMER_RESIDENCE: "customer_residence",
  BUSINESS_OFFICE: "business_office",
  RESIDENTIAL_PROPERTY: "residential_property",
  COMMERCIAL_PROPERTY: "commercial_property",
  INDUSTRIAL_PROPERTY: "industrial_property",
  LAND_PLOT: "land_plot",
};

const API_VISIT_TYPES = {
  [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: "CUSTOMER_RESIDENCE",
  [VISIT_BLOCKS.BUSINESS_OFFICE]: "BUSINESS_OFFICE",
  [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: "RESIDENTIAL_PROPERTY",
  [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: "COMMERCIAL_PROPERTY",
  [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: "INDUSTRIAL_PROPERTY",
  [VISIT_BLOCKS.LAND_PLOT]: "LAND_PLOT",
};

export const VISIT_BLOCKS_BY_PROPERTY_CATEGORY = {
  Residential: [
    VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    VISIT_BLOCKS.BUSINESS_OFFICE,
    VISIT_BLOCKS.RESIDENTIAL_PROPERTY,
  ],
  Commercial: [
    VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    VISIT_BLOCKS.BUSINESS_OFFICE,
    VISIT_BLOCKS.COMMERCIAL_PROPERTY,
  ],
  Industrial: [
    VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    VISIT_BLOCKS.BUSINESS_OFFICE,
    VISIT_BLOCKS.INDUSTRIAL_PROPERTY,
  ],
  "Land / Plot": [
    VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    VISIT_BLOCKS.BUSINESS_OFFICE,
    VISIT_BLOCKS.LAND_PLOT,
  ],
};

/* =========================================================
   DOCUMENT NAMES
========================================================= */
const DOCUMENT_NAMES = {
  [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: [
    "CUSTOMER_RESIDENCE_FRONTAGE",
    "CUSTOMER_RESIDENCE_INTERIOR",
    "CUSTOMER_WITH_RESIDENCE",
    "RESIDENCE_NEARBY_LANDMARK",
  ],
  [VISIT_BLOCKS.BUSINESS_OFFICE]: [
    "BUSINESS_FRONTAGE",
    "BUSINESS_SIGNBOARD",
    "BUSINESS_INTERIOR",
    "BUSINESS_STOCK",
    "BUSINESS_EMPLOYEE_SETUP",
  ],
  [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: [
    "RESIDENTIAL_PROPERTY_FRONTAGE",
    "RESIDENTIAL_PROPERTY_ENTRANCE",
    "RESIDENTIAL_PROPERTY_INTERIOR",
    "RESIDENTIAL_PROPERTY_LANDMARK",
  ],
  [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: [
    "COMMERCIAL_PROPERTY_FRONTAGE",
    "COMMERCIAL_PROPERTY_SIGNBOARD",
    "COMMERCIAL_PROPERTY_INTERIOR",
    "COMMERCIAL_PROPERTY_LANDMARK",
  ],
  [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: [
    "INDUSTRIAL_PROPERTY_GATE",
    "INDUSTRIAL_PROPERTY_SHED",
    "INDUSTRIAL_PROPERTY_MACHINERY",
    "INDUSTRIAL_PROPERTY_APPROACH_ROAD",
  ],
  [VISIT_BLOCKS.LAND_PLOT]: [
    "LAND_PLOT_FRONTAGE",
    "LAND_PLOT_BOUNDARY",
    "LAND_PLOT_CORNER",
    "LAND_PLOT_SURVEY_MARKER",
    "LAND_PLOT_APPROACH_ROAD",
  ],
};

/* =========================================================
   PROPERTY CONFIG
========================================================= */
const PROPERTY_VISIT_CONFIG = {
  Residential: {
    block: VISIT_BLOCKS.RESIDENTIAL_PROPERTY,
    title: "Residential Property Visit",
    icon: FaHome,
    areaLabel: "Built-up Area (sq. ft.)",
    usageLabel: "Residential Usage",
    usageOptions: [
      "Self Occupied",
      "Family Occupied",
      "Tenanted",
      "Vacant",
      "Under Construction",
    ],
    landmarkPlaceholder: "Near society, school or main road",
    photoText:
      "Capture building frontage, entrance, interiors and landmark photos",
  },
  Commercial: {
    block: VISIT_BLOCKS.COMMERCIAL_PROPERTY,
    title: "Commercial Property Visit",
    icon: FaBuilding,
    areaLabel: "Commercial Area (sq. ft.)",
    usageLabel: "Commercial Usage",
    usageOptions: [
      "Office",
      "Shop",
      "Showroom",
      "Warehouse",
      "Hotel",
      "Restaurant",
      "Hospital",
      "Educational Institution",
      "Other Commercial Use",
    ],
    landmarkPlaceholder: "Near market, business park or main road",
    photoText:
      "Capture commercial frontage, signboard, interiors and landmark photos",
  },
  Industrial: {
    block: VISIT_BLOCKS.INDUSTRIAL_PROPERTY,
    title: "Industrial Property Visit",
    icon: FaIndustry,
    areaLabel: "Industrial Area (sq. ft.)",
    usageLabel: "Industrial Usage",
    usageOptions: [
      "Factory",
      "Manufacturing Unit",
      "Industrial Shed",
      "Warehouse",
      "Godown",
      "Workshop",
      "Other Industrial Use",
    ],
    landmarkPlaceholder: "Near industrial estate, highway or factory",
    photoText:
      "Capture factory gate, shed, machinery, approach road and landmark photos",
  },
  "Land / Plot": {
    block: VISIT_BLOCKS.LAND_PLOT,
    title: "Land / Plot Visit",
    icon: FaMapMarkedAlt,
    areaLabel: "Plot Area (sq. ft.)",
    usageLabel: "Current Land Usage",
    usageOptions: [
      "Vacant Plot",
      "Agricultural Use",
      "Residential Use",
      "Commercial Use",
      "Industrial Use",
      "Under Construction",
    ],
    landmarkPlaceholder: "Near survey marker, village road or highway",
    photoText:
      "Capture plot boundaries, corners, survey marker, approach road and landmark photos",
  },
};

/* =========================================================
   CHECKLIST
========================================================= */
const CHECKLIST_ITEMS = [
  {
    key: "customerIdentityMatched",
    label: "Customer identity matched",
    desc: "Customer identity verified during visit",
  },
  {
    key: "visitWithinAssignedRoute",
    label: "Visit within assigned route",
    desc: "Visit location is within the assigned area",
  },
  {
    key: "photosContainExifEvidence",
    label: "Photos contain EXIF/time evidence",
    desc: "Photo timestamp and location evidence captured",
  },
  {
    key: "noImageDuplicationDetected",
    label: "No image duplication detected",
    desc: "Uploaded images are unique",
  },
  {
    key: "addressComparedWithApplication",
    label: "Address compared with application",
    desc: "Physical address matches application details",
  },
  {
    key: "negativeObservationsDisclosed",
    label: "Negative observations disclosed",
    desc: "All adverse observations have been recorded",
  },
];

/* =========================================================
   COMMON CLASSES
========================================================= */
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none transition-colors focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const textareaClass = `${inputClass} resize-none`;

/* =========================================================
   HELPERS
========================================================= */
const unwrapResponse = (response) =>
  response?.data?.data ?? response?.data ?? response;

const getApiErrorMessage = (error, fallbackMessage) => {
  const payload = error?.response?.data;
  const rawMessage = payload?.message ?? payload?.errors ?? error?.message;
  if (Array.isArray(rawMessage)) return rawMessage.join(", ");
  if (rawMessage && typeof rawMessage === "object")
    return JSON.stringify(rawMessage);
  return rawMessage || fallbackMessage;
};

const getTodayDate = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const normalizePropertyCategory = (value) => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
  const categoryMap = {
    residential: "Residential",
    "residential property": "Residential",
    "residential property visit": "Residential",
    "customer / residence": "Residential",
    "customer / residence visit": "Residential",
    customer_residence: "Residential",
    commercial: "Commercial",
    "commercial property": "Commercial",
    "commercial property visit": "Commercial",
    "business / office": "Commercial",
    "business / office visit": "Commercial",
    business_office: "Commercial",
    industrial: "Industrial",
    "industrial property": "Industrial",
    "industrial property visit": "Industrial",
    "land / plot": "Land / Plot",
    "land/plot": "Land / Plot",
    "land plot": "Land / Plot",
    "land and plot": "Land / Plot",
    land: "Land / Plot",
    plot: "Land / Plot",
  };
  return categoryMap[normalizedValue] || null;
};

const normalizePropertyType = (propertyType, propertyCategory) => {
  if (!propertyType) return "";
  const value = String(propertyType).trim();
  if (!propertyCategory) return value;
  const escapedCategory = propertyCategory.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const categoryPrefix = new RegExp(`^${escapedCategory}\\s*-\\s*`, "i");
  return value.replace(categoryPrefix, "").trim();
};

const normalizeVisitBlock = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const map = {
    customer_residence: VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    business_office: VISIT_BLOCKS.BUSINESS_OFFICE,
    residential_property: VISIT_BLOCKS.RESIDENTIAL_PROPERTY,
    commercial_property: VISIT_BLOCKS.COMMERCIAL_PROPERTY,
    industrial_property: VISIT_BLOCKS.INDUSTRIAL_PROPERTY,
    land_plot: VISIT_BLOCKS.LAND_PLOT,
  };
  return map[normalized] || null;
};

const normalizeVisitResultForForm = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  const map = { POSITIVE: "Positive", NEGATIVE: "Negative", REFER: "Refer" };
  return map[normalized] || "";
};

const getBlockLabel = (block, propertyCategory) => {
  const labels = {
    [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: "Customer / Residence",
    [VISIT_BLOCKS.BUSINESS_OFFICE]: "Business / Office",
    [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: "Residential Property",
    [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: "Commercial Property",
    [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: "Industrial Property",
    [VISIT_BLOCKS.LAND_PLOT]: "Land / Plot",
  };
  return (
    labels[block] ||
    PROPERTY_VISIT_CONFIG[propertyCategory]?.title ||
    "Property"
  );
};

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

const getDocumentBlock = (document) => {
  const visitTypeBlock = normalizeVisitBlock(document?.visitType);
  if (visitTypeBlock) return visitTypeBlock;
  const documentName = String(document?.documentName || "").toUpperCase();

  if (
    documentName.startsWith("CUSTOMER_RESIDENCE_") ||
    documentName === "RESIDENCE_NEARBY_LANDMARK"
  ) {
    return VISIT_BLOCKS.CUSTOMER_RESIDENCE;
  }
  if (documentName.startsWith("BUSINESS_")) return VISIT_BLOCKS.BUSINESS_OFFICE;
  if (documentName.startsWith("RESIDENTIAL_PROPERTY_"))
    return VISIT_BLOCKS.RESIDENTIAL_PROPERTY;
  if (documentName.startsWith("COMMERCIAL_PROPERTY_"))
    return VISIT_BLOCKS.COMMERCIAL_PROPERTY;
  if (documentName.startsWith("INDUSTRIAL_PROPERTY_"))
    return VISIT_BLOCKS.INDUSTRIAL_PROPERTY;
  if (documentName.startsWith("LAND_PLOT_")) return VISIT_BLOCKS.LAND_PLOT;
  return null;
};

const normalizeDocuments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.documents)) return payload.documents;
  if (Array.isArray(payload?.uploadedDocuments))
    return payload.uploadedDocuments;
  return [];
};

const normalizeVisits = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.visits)) return payload.visits;
  return [];
};

const createInitialChecklist = () =>
  CHECKLIST_ITEMS.reduce(
    (result, item) => ({ ...result, [item.key]: false }),
    {},
  );

const createInitialVisitForms = (profile, propertyCategory) => {
  const today = getTodayDate();
  const customerName = [
    profile?.firstName,
    profile?.middleName,
    profile?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const residenceAddress = [
    profile?.currentAddress,
    profile?.currentCity,
    profile?.currentState,
    profile?.currentPincode,
  ]
    .filter(Boolean)
    .join(", ");
  const propertyAddress = [
    profile?.propertyAddress,
    profile?.propertyCity,
    profile?.propertyState,
    profile?.propertyPincode,
  ]
    .filter(Boolean)
    .join(", ");
  const normalizedPropertyType = normalizePropertyType(
    profile?.propertyType,
    propertyCategory,
  );

  return {
    [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: {
      visitDate: today,
      customerName,
      personMet: "Customer",
      residenceAddress,
      residenceType: "",
      visitResult: "",
      remarks: "",
    },
    [VISIT_BLOCKS.BUSINESS_OFFICE]: {
      visitDate: today,
      occupationType: profile?.occupationType || "",
      businessName: profile?.businessName || "",
      businessVintage: "",
      businessActivity: "",
      employeeCount: "",
      stockOfficeSetup: "",
      visitResult: "",
      remarks: "",
    },
    [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: {
      visitDate: today,
      propertyType: normalizedPropertyType,
      propertyAddress,
      ownership: profile?.ownershipType || "",
      usage: "",
      area: "",
      occupancy: "",
      propertyCondition: "",
      nearbyLandmark: "",
      marketValue: profile?.marketValue || "",
      visitResult: "",
      remarks: "",
    },
    [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: {
      visitDate: today,
      propertyType: normalizedPropertyType,
      propertyAddress,
      ownership: profile?.ownershipType || "",
      usage: "",
      area: "",
      occupancy: "",
      propertyCondition: "",
      nearbyLandmark: "",
      marketValue: profile?.marketValue || "",
      visitResult: "",
      remarks: "",
    },
    [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: {
      visitDate: today,
      propertyType: normalizedPropertyType,
      propertyAddress,
      ownership: profile?.ownershipType || "",
      usage: "",
      area: "",
      occupancy: "",
      approachRoad: "",
      machineryAvailable: "",
      propertyCondition: "",
      nearbyLandmark: "",
      marketValue: profile?.marketValue || "",
      visitResult: "",
      remarks: "",
    },
    [VISIT_BLOCKS.LAND_PLOT]: {
      visitDate: today,
      propertyType: normalizedPropertyType,
      propertyAddress,
      ownership: profile?.ownershipType || "",
      usage: "",
      area: "",
      boundaryAvailable: "",
      surveyNumber: "",
      propertyCondition: "",
      nearbyLandmark: "",
      marketValue: profile?.marketValue || "",
      visitResult: "",
      remarks: "",
    },
  };
};

const mergeSavedVisits = (initialForms, savedVisits) => {
  const mergedForms = { ...initialForms };
  for (const savedVisit of savedVisits) {
    const block = normalizeVisitBlock(savedVisit?.visitType);
    if (!block || !mergedForms[block]) continue;

    mergedForms[block] = {
      ...mergedForms[block],
      ...(savedVisit?.formData || {}),
      visitDate: savedVisit?.visitDate || mergedForms[block].visitDate,
      visitResult:
        normalizeVisitResultForForm(savedVisit?.visitResult) ||
        mergedForms[block].visitResult,
      remarks: savedVisit?.remarks ?? mergedForms[block].remarks,
    };
    if (savedVisit?.propertyType !== undefined) {
      mergedForms[block].propertyType = savedVisit.propertyType || "";
    }
  }
  return mergedForms;
};

const getBrowserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationAccuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
          deviceId: navigator.userAgent,
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  });

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await rmApi.reverseGeocode(latitude, longitude);

    const result =
      response?.data?.data ??
      response?.data ??
      response;

    return result?.formattedAddress || "";
  } catch (error) {
    console.error(
      "Unable to retrieve location address:",
      error,
    );

    return "";
  }
};


const getCaptureLocation = () =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const locationName = await reverseGeocode(latitude, longitude);

        resolve({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          locationName,
          capturedAt: new Date(),
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      },
    );
  });

/* =========================================================
   GEO CAMERA MODAL COMPONENT (INLINE)
========================================================= */
function GeoCameraModal({ isOpen, onClose, onCapture, blockName }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [captureLocation, setCaptureLocation] = useState(null);
  const [watermarkTime, setWatermarkTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setInterval(() => setWatermarkTime(new Date()), 1000);

    async function initVerificationFlow() {
      setIsInitializing(true);
      setErrorMsg("");
      setCaptureLocation(null);

      if (!navigator.geolocation) {
        setErrorMsg(
          "Location service (GPS) is required but not supported by this browser.",
        );
        setIsInitializing(false);
        return;
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          });
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const locationName = await reverseGeocode(latitude, longitude);

        setCaptureLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          locationName,
        });
      } catch (gpsError) {
        console.error("Location initialization failed:", gpsError);

        setErrorMsg(
          "Location access is required. Please enable high-accuracy GPS permissions.",
        );
        setIsInitializing(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsInitializing(false);
      } catch (camError) {
        setErrorMsg(
          "Camera access was denied. Please allow camera permission and try again.",
        );
        setIsInitializing(false);
      }
    }

    initVerificationFlow();

    return () => {
      window.clearInterval(timer);
      stopCameraSystem();
    };
  }, [isOpen]);

  const stopCameraSystem = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const formatCoordinate = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(6) : "N/A";

  const wrapWatermarkText = (text, maxLength = 55) => {
    if (!text) return [];

    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (nextLine.length > maxLength && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

const getWatermarkLines = (capturedAt = new Date()) => {
  const locationName = captureLocation?.locationName?.trim();

  const locationLines = wrapWatermarkText(
    locationName || "Address lookup failed"
  );

  return [
    `Field Visit: ${blockName}`,
    `Captured: ${capturedAt.toLocaleString()}`,
    ...locationLines.map((line, index) =>
      index === 0 ? `Location: ${line}` : line
    ),
    `Lat: ${formatCoordinate(
      captureLocation?.latitude
    )}  Long: ${formatCoordinate(captureLocation?.longitude)}`,
  ];
};

  const drawWatermark = (context, canvas, capturedAt) => {
    const lines = getWatermarkLines(capturedAt);
    const padding = Math.max(12, Math.round(canvas.width * 0.018));
    const fontSize = Math.max(15, Math.round(canvas.width * 0.022));
    const lineHeight = Math.round(fontSize * 1.35);
    const boxHeight = padding * 2 + lineHeight * lines.length;

    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.68)";
    context.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
    context.font = `600 ${fontSize}px Arial, sans-serif`;
    context.fillStyle = "#ffffff";
    context.textBaseline = "top";

    lines.forEach((line, index) => {
      context.fillText(
        line,
        padding,
        canvas.height - boxHeight + padding + index * lineHeight,
      );
    });
    context.restore();
  };

  const handleCaptureAction = async () => {
    if (!videoRef.current || !streamRef.current || !captureLocation) return;

    try {
      const videoNode = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = videoNode.videoWidth || 1280;
      canvas.height = videoNode.videoHeight || 720;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context is unavailable.");

      context.drawImage(videoNode, 0, 0, canvas.width, canvas.height);
      const capturedAt = new Date();
      drawWatermark(context, canvas, capturedAt);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95),
      );

      if (blob) {
        const capturedFile = new File(
          [blob],
          `verification_${Date.now()}.jpg`,
          {
            type: "image/jpeg",
            lastModified: capturedAt.getTime(),
          },
        );
        onCapture(capturedFile);
        stopCameraSystem();
        onClose();
      }
    } catch (err) {
      setErrorMsg("Unable to capture the photo. Please try again.");
    }
  };

  if (!isOpen) return null;

  const watermarkLines = getWatermarkLines(watermarkTime);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">
              Secure Live Capture
            </h4>
            <p className="text-[10px] font-medium text-slate-400">
              Target Area: {blockName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraSystem();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close camera"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="relative flex aspect-video flex-col items-center justify-center bg-black p-2">
          {isInitializing && !errorMsg && (
            <div className="text-center text-xs font-semibold text-slate-400">
              Verifying location and camera permissions...
            </div>
          )}

          {errorMsg && (
            <div className="px-6 text-center text-xs font-bold text-rose-400">
              {errorMsg}
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full rounded-lg object-cover ${isInitializing || errorMsg ? "hidden" : "block"}`}
          />

          {!isInitializing && !errorMsg && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-b-lg bg-black/70 px-3 py-2 text-[10px] font-semibold leading-4 text-white">
              {watermarkLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              stopCameraSystem();
              onClose();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isInitializing || Boolean(errorMsg) || !captureLocation}
            onClick={handleCaptureAction}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaCamera size={12} />
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */
function FormField({ label, required = false, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* =========================================================
   PHOTO UPLOAD (UPDATED WITH MODAL INTERFACE TRIGGER)
========================================================= */
function ImagePreviewModal({ imageUrl, title, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h4 className="truncate pr-4 text-sm font-extrabold text-slate-800">
            {title || "Photo Preview"}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close preview"
          >
            <FaTimes size={14} />
          </button>
        </div>
        <div className="flex max-h-[75vh] items-center justify-center bg-black p-3">
          <img
            src={imageUrl}
            alt={title || "Captured photo preview"}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function PhotoUpload({
  block,
  title,
  description,
  selectedFiles,
  uploadedDocuments,
  disabled,
  onFilesChange,
  onDeleteDocument,
  deletingDocumentId,
  blockLabel,
}) {
  const maxFiles = DOCUMENT_NAMES[block]?.length || 0;
  const totalFiles = selectedFiles.length + uploadedDocuments.length;
  const remainingFiles = Math.max(maxFiles - totalFiles, 0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview?.isObjectUrl && preview.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const handleCaptureRegistration = (newFile) => {
    onFilesChange([...selectedFiles, newFile]);
  };

  const openSelectedFilePreview = (file) => {
    if (preview?.isObjectUrl && preview.url) URL.revokeObjectURL(preview.url);
    setPreview({
      url: URL.createObjectURL(file),
      title: file.name,
      isObjectUrl: true,
    });
  };

  const openUploadedDocumentPreview = (document) => {
    const url =
      document.fileUrl ||
      document.documentUrl ||
      document.url ||
      document.previewUrl;
    if (!url) return;
    setPreview({
      url,
      title: document.fileName || document.documentName,
      isObjectUrl: false,
    });
  };

  const closePreview = () => {
    if (preview?.isObjectUrl && preview.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => {
          if (!disabled && remainingFiles > 0) setIsCameraOpen(true);
        }}
        className={`block rounded-xl border-2 border-dashed p-5 text-center transition-all ${
          disabled || remainingFiles === 0
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
            : "cursor-pointer border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50/60"
        }`}
      >
        <FaCamera className="mx-auto mb-2 text-slate-400" size={18} />
        <div className="text-xs font-bold text-slate-700">{title}</div>
        <div className="mt-1 text-[10px] font-medium text-slate-400">
          {description}
        </div>
        <div className="mt-2 text-[10px] font-bold text-blue-600">
          {remainingFiles > 0
            ? `${remainingFiles} photo slot(s) available`
            : "Maximum photo limit reached"}
        </div>
      </div>

      <GeoCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCaptureRegistration}
        blockName={blockLabel}
      />

      <ImagePreviewModal
        imageUrl={preview?.url}
        title={preview?.title}
        onClose={closePreview}
      />

      {uploadedDocuments.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-500">
            Uploaded photos
          </p>
          {uploadedDocuments.map((document) => {
            const previewUrl =
              document.fileUrl ||
              document.documentUrl ||
              document.url ||
              document.previewUrl;
            return (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="shrink-0 text-emerald-600" />
                    <p className="truncate text-xs font-bold text-slate-700">
                      {document.fileName || document.documentName}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate pl-6 text-[9px] font-medium text-slate-400">
                    {document.documentName}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => openUploadedDocumentPreview(document)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <FaEye size={11} />
                      Preview
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      disabled={deletingDocumentId === document.id}
                      onClick={() => onDeleteDocument(document.id)}
                      className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-100 disabled:opacity-50"
                      aria-label="Delete uploaded photo"
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-500">
            Selected photos
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FaFileImage className="shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-700">
                    {file.name}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openSelectedFilePreview(file)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <FaEye size={11} />
                  Preview
                </button>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() =>
                      onFilesChange(selectedFiles.filter((_, i) => i !== index))
                    }
                    className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-100"
                    aria-label="Remove selected photo"
                  >
                    <FaTrash size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisitSaveButton({ label, disabled, isSaving, onSave, saved }) {
  if (saved) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200">
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
          {label.replace(/^Save\s+/i, "")} Saved
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <button
        type="button"
        disabled={disabled || isSaving}
        onClick={onSave}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : label}
      </button>
    </div>
  );
}

/* =========================================================
   CUSTOMER RESIDENCE CARD
========================================================= */
function CustomerResidenceCard({
  form,
  selectedFiles,
  uploadedDocuments,
  disabled,
  onChange,
  onFilesChange,
  onDeleteDocument,
  deletingDocumentId,
  onSave,
  isSaving,
  saved,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FaHome size={16} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0f2942]">
            Customer / Residence Visit
          </h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
            Verify customer identity and residential stability
          </p>
        </div>
      </div>

      <FormField label="Visit Date" required>
        <div className="relative">
          <input
            type="date"
            value={form.visitDate}
            disabled={disabled}
            onChange={(e) => onChange("visitDate", e.target.value)}
            className={inputClass}
          />
          <FaCalendarAlt className="pointer-events-none absolute right-4 top-3.5 text-xs text-slate-400" />
        </div>
      </FormField>

      <FormField label="Customer Name" required>
        <input
          type="text"
          value={form.customerName}
          disabled={disabled}
          onChange={(e) => onChange("customerName", e.target.value)}
          placeholder="Customer name"
          className={inputClass}
        />
      </FormField>

      <FormField label="Person Met" required>
        <select
          value={form.personMet}
          disabled={disabled}
          onChange={(e) => onChange("personMet", e.target.value)}
          className={inputClass}
        >
          <option value="Customer">Customer</option>
          <option value="Spouse">Spouse</option>
          <option value="Co-Applicant">Co-Applicant</option>
          <option value="Family Member">Family Member</option>
          <option value="Other">Other</option>
        </select>
      </FormField>

      <FormField label="Residence Address" required>
        <textarea
          rows={3}
          value={form.residenceAddress}
          disabled={disabled}
          onChange={(e) => onChange("residenceAddress", e.target.value)}
          placeholder="Enter residence address"
          className={textareaClass}
        />
      </FormField>

      <FormField label="Residence Type" required>
        <select
          value={form.residenceType}
          disabled={disabled}
          onChange={(e) => onChange("residenceType", e.target.value)}
          className={inputClass}
        >
          <option value="">Select residence type</option>
          <option value="Owned">Owned</option>
          <option value="Rented">Rented</option>
          <option value="Ancestral">Ancestral</option>
          <option value="Company Provided">Company Provided</option>
          <option value="Family Owned">Family Owned</option>
        </select>
      </FormField>

      <FormField label="Visit Result" required>
        <select
          value={form.visitResult}
          disabled={disabled}
          onChange={(e) => onChange("visitResult", e.target.value)}
          className={inputClass}
        >
          <option value="">Select visit result</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Refer">Refer</option>
        </select>
      </FormField>

      <FormField label="Residence Remarks" required>
        <textarea
          rows={3}
          maxLength={500}
          value={form.remarks}
          disabled={disabled}
          onChange={(e) => onChange("remarks", e.target.value)}
          placeholder="Enter residence visit observations"
          className={textareaClass}
        />
      </FormField>

      <PhotoUpload
        block={VISIT_BLOCKS.CUSTOMER_RESIDENCE}
        title="Capture geo-tagged residence photos"
        description="Timestamp, latitude, longitude and device details will be parsed securely"
        selectedFiles={selectedFiles}
        uploadedDocuments={uploadedDocuments}
        disabled={disabled}
        onFilesChange={onFilesChange}
        onDeleteDocument={onDeleteDocument}
        deletingDocumentId={deletingDocumentId}
        blockLabel="Customer Residence"
      />

      <VisitSaveButton
        label="Save Customer Visit"
        disabled={disabled}
        isSaving={isSaving}
        onSave={onSave}
        saved={saved}
      />
    </div>
  );
}

/* =========================================================
   BUSINESS OFFICE CARD
========================================================= */
function BusinessOfficeCard({
  form,
  selectedFiles,
  uploadedDocuments,
  disabled,
  onChange,
  onFilesChange,
  onDeleteDocument,
  deletingDocumentId,
  onSave,
  isSaving,
  saved,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <FaBuilding size={16} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0f2942]">
            Business / Office Visit
          </h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
            Verify income source and business activity
          </p>
        </div>
      </div>

      <FormField label="Visit Date" required>
        <input
          type="date"
          value={form.visitDate}
          disabled={disabled}
          onChange={(e) => onChange("visitDate", e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Occupation Type" required>
        <input
          type="text"
          value={form.occupationType}
          disabled={disabled}
          onChange={(e) => onChange("occupationType", e.target.value)}
          placeholder="Occupation type"
          className={inputClass}
        />
      </FormField>

      <FormField label="Business Name" required>
        <input
          type="text"
          value={form.businessName}
          disabled={disabled}
          onChange={(e) => onChange("businessName", e.target.value)}
          placeholder="Enter business or office name"
          className={inputClass}
        />
      </FormField>

      <FormField label="Business Vintage" required>
        <input
          type="number"
          min="0"
          value={form.businessVintage}
          disabled={disabled}
          onChange={(e) => onChange("businessVintage", e.target.value)}
          placeholder="Business vintage in years"
          className={inputClass}
        />
      </FormField>

      <FormField label="Business Activity" required>
        <input
          type="text"
          value={form.businessActivity}
          disabled={disabled}
          onChange={(e) => onChange("businessActivity", e.target.value)}
          placeholder="Manufacturing, trading, services, etc."
          className={inputClass}
        />
      </FormField>

      <FormField label="Employee Count" required>
        <input
          type="number"
          min="0"
          value={form.employeeCount}
          disabled={disabled}
          onChange={(e) => onChange("employeeCount", e.target.value)}
          placeholder="Enter employee count"
          className={inputClass}
        />
      </FormField>

      <FormField label="Stock / Office Setup" required>
        <select
          value={form.stockOfficeSetup}
          disabled={disabled}
          onChange={(e) => onChange("stockOfficeSetup", e.target.value)}
          className={inputClass}
        >
          <option value="">Select setup condition</option>
          <option value="Adequate">Adequate</option>
          <option value="Available">Available</option>
          <option value="Scarce">Scarce</option>
          <option value="Not Available">Not Available</option>
        </select>
      </FormField>

      <FormField label="Visit Result" required>
        <select
          value={form.visitResult}
          disabled={disabled}
          onChange={(e) => onChange("visitResult", e.target.value)}
          className={inputClass}
        >
          <option value="">Select visit result</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Refer">Refer</option>
        </select>
      </FormField>

      <FormField label="Business Remarks" required>
        <textarea
          rows={3}
          maxLength={500}
          value={form.remarks}
          disabled={disabled}
          onChange={(e) => onChange("remarks", e.target.value)}
          placeholder="Enter business visit observations"
          className={textareaClass}
        />
      </FormField>

      <PhotoUpload
        block={VISIT_BLOCKS.BUSINESS_OFFICE}
        title="Capture business visit photos"
        description="Capture frontage, signboard, stock, employees and office setup"
        selectedFiles={selectedFiles}
        uploadedDocuments={uploadedDocuments}
        disabled={disabled}
        onFilesChange={onFilesChange}
        onDeleteDocument={onDeleteDocument}
        deletingDocumentId={deletingDocumentId}
        blockLabel="Business Office"
      />

      <VisitSaveButton
        label="Save Business Visit"
        disabled={disabled}
        isSaving={isSaving}
        onSave={onSave}
        saved={saved}
      />
    </div>
  );
}

/* =========================================================
   PROPERTY CARD
========================================================= */
function PropertyVisitCard({
  block,
  form,
  propertyCategory,
  selectedFiles,
  uploadedDocuments,
  disabled,
  onChange,
  onFilesChange,
  onDeleteDocument,
  deletingDocumentId,
  onSave,
  isSaving,
  saved,
}) {
  const config = PROPERTY_VISIT_CONFIG[propertyCategory];
  if (!config) return null;

  const Icon = config.icon;
  const propertyTypes = PROPERTY_TYPE[propertyCategory] || [];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0f2942]">
              {config.title}
            </h3>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              Verify collateral details and physical condition
            </p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700">
          {propertyCategory}
        </span>
      </div>

      <FormField label="Visit Date" required>
        <input
          type="date"
          value={form.visitDate}
          disabled={disabled}
          onChange={(e) => onChange("visitDate", e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Property Category">
        <input
          type="text"
          value={propertyCategory}
          readOnly
          className={`${inputClass} cursor-not-allowed bg-slate-100 font-semibold text-slate-600`}
        />
      </FormField>

      <FormField label="Property Type" required>
        <select
          value={form.propertyType}
          disabled={disabled}
          onChange={(e) => onChange("propertyType", e.target.value)}
          className={inputClass}
        >
          <option value="">Select {propertyCategory} property type</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
          {form.propertyType && !propertyTypes.includes(form.propertyType) && (
            <option value={form.propertyType}>{form.propertyType}</option>
          )}
        </select>
      </FormField>

      <FormField label="Property Address" required>
        <textarea
          rows={3}
          value={form.propertyAddress}
          disabled={disabled}
          onChange={(e) => onChange("propertyAddress", e.target.value)}
          placeholder="Enter complete property address"
          className={textareaClass}
        />
      </FormField>

      <FormField label="Ownership" required>
        <select
          value={form.ownership}
          disabled={disabled}
          onChange={(e) => onChange("ownership", e.target.value)}
          className={inputClass}
        >
          <option value="">Select ownership</option>
          <option value="Self">Self</option>
          <option value="Joint">Joint</option>
          <option value="Family Owned">Family Owned</option>
          <option value="Third Party">Third Party</option>
        </select>
      </FormField>

      <FormField label={config.usageLabel} required>
        <select
          value={form.usage}
          disabled={disabled}
          onChange={(e) => onChange("usage", e.target.value)}
          className={inputClass}
        >
          <option value="">Select usage</option>
          {config.usageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={config.areaLabel} required>
        <input
          type="number"
          min="0"
          value={form.area}
          disabled={disabled}
          onChange={(e) => onChange("area", e.target.value)}
          placeholder="Enter approximate area"
          className={inputClass}
        />
      </FormField>

      {propertyCategory !== "Land / Plot" && (
        <FormField label="Occupancy" required>
          <select
            value={form.occupancy}
            disabled={disabled}
            onChange={(e) => onChange("occupancy", e.target.value)}
            className={inputClass}
          >
            <option value="">Select occupancy</option>
            <option value="Self Occupied">Self Occupied</option>
            <option value="Tenanted">Tenanted</option>
            <option value="Vacant">Vacant</option>
            <option value="Under Construction">Under Construction</option>
          </select>
        </FormField>
      )}

      {propertyCategory === "Industrial" && (
        <>
          <FormField label="Approach Road" required>
            <select
              value={form.approachRoad}
              disabled={disabled}
              onChange={(e) => onChange("approachRoad", e.target.value)}
              className={inputClass}
            >
              <option value="">Select approach road</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </FormField>
          <FormField label="Machinery Available" required>
            <select
              value={form.machineryAvailable}
              disabled={disabled}
              onChange={(e) => onChange("machineryAvailable", e.target.value)}
              className={inputClass}
            >
              <option value="">Select machinery status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Partially Available">Partially Available</option>
            </select>
          </FormField>
        </>
      )}

      {propertyCategory === "Land / Plot" && (
        <>
          <FormField label="Boundary Available" required>
            <select
              value={form.boundaryAvailable}
              disabled={disabled}
              onChange={(e) => onChange("boundaryAvailable", e.target.value)}
              className={inputClass}
            >
              <option value="">Select boundary status</option>
              <option value="Fully Demarcated">Fully Demarcated</option>
              <option value="Partially Demarcated">Partially Demarcated</option>
              <option value="Not Demarcated">Not Demarcated</option>
            </select>
          </FormField>
          <FormField label="Survey / Gat / Khasra Number" required>
            <input
              type="text"
              value={form.surveyNumber}
              disabled={disabled}
              onChange={(e) => onChange("surveyNumber", e.target.value)}
              placeholder="Enter survey, gat or khasra number"
              className={inputClass}
            />
          </FormField>
        </>
      )}

      <FormField label="Property Condition" required>
        <select
          value={form.propertyCondition}
          disabled={disabled}
          onChange={(e) => onChange("propertyCondition", e.target.value)}
          className={inputClass}
        >
          <option value="">Select property condition</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Average">Average</option>
          <option value="Poor">Poor</option>
          <option value="Under Construction">Under Construction</option>
        </select>
      </FormField>

      <FormField label="Nearby Landmark" required>
        <input
          type="text"
          value={form.nearbyLandmark}
          disabled={disabled}
          onChange={(e) => onChange("nearbyLandmark", e.target.value)}
          placeholder={config.landmarkPlaceholder}
          className={inputClass}
        />
      </FormField>

      <FormField label="Market Value" required>
        <input
          type="number"
          min="0"
          value={form.marketValue}
          disabled={disabled}
          onChange={(e) => onChange("marketValue", e.target.value)}
          placeholder="Enter approximate market value"
          className={inputClass}
        />
      </FormField>

      <FormField label="Visit Result" required>
        <select
          value={form.visitResult}
          disabled={disabled}
          onChange={(e) => onChange("visitResult", e.target.value)}
          className={inputClass}
        >
          <option value="">Select visit result</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
          <option value="Refer">Refer</option>
        </select>
      </FormField>

      <FormField label="Property Remarks" required>
        <textarea
          rows={3}
          maxLength={500}
          value={form.remarks}
          disabled={disabled}
          onChange={(e) => onChange("remarks", e.target.value)}
          placeholder={`Enter observations for the ${propertyCategory.toLowerCase()} property`}
          className={textareaClass}
        />
      </FormField>

      <PhotoUpload
        block={block}
        title={`Capture ${propertyCategory} property photos`}
        description={config.photoText}
        selectedFiles={selectedFiles}
        uploadedDocuments={uploadedDocuments}
        disabled={disabled}
        onFilesChange={onFilesChange}
        onDeleteDocument={onDeleteDocument}
        deletingDocumentId={deletingDocumentId}
        blockLabel={`${propertyCategory} Property`}
      />

      <VisitSaveButton
        label={`Save ${propertyCategory} Property Visit`}
        disabled={disabled}
        isSaving={isSaving}
        onSave={onSave}
        saved={saved}
      />
    </div>
  );
}

/* =========================================================
   LOADING & HISTORY COMPONENTS
========================================================= */
function VisitCardsLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[500px] animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-8 space-y-5">
            {[1, 2, 3, 4, 5].map((field) => (
              <div key={field}>
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="mt-2 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitHistory({ history, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-500">
          Loading visit history...
        </p>
      </div>
    );
  }
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-extrabold text-slate-700">Visit History</p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          No completed field visits found for this application.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {history.map((visit) => (
        <div
          key={visit.id}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-800">
                {getBlockLabel(normalizeVisitBlock(visit.visitType))}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Visit date: {visit.visitDate || "N/A"}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
                {visit.visitStatus}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700">
                {visit.visitResult || "N/A"}
              </span>
            </div>
          </div>
          {visit.remarks && (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">
              {visit.remarks}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   MAIN EXPORT COMPONENT
========================================================= */
export default function FieldVisits() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initializedApplicationRef = useRef(null);

  const [activeTab, setActiveTab] = useState("All Visits");
  const [message, setMessage] = useState(null);
  const [visitForms, setVisitForms] = useState({});
  const [checklist, setChecklist] = useState(createInitialChecklist());
  const [selectedPhotos, setSelectedPhotos] = useState({});

  /* --- DATA QUERIES --- */
  const {
    data: customerProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ["customer-profile", applicationId],
    queryFn: async () => {
      const response = await rmApi.getCustomerProfile(applicationId);
      return unwrapResponse(response);
    },
    enabled: Boolean(applicationId),
    retry: false,
  });

  const { data: fieldVisitData, isLoading: isVisitsLoading } = useQuery({
    queryKey: ["field-visits", applicationId],
    queryFn: async () => {
      const response = await rmApi.getFieldVisits(applicationId);
      return unwrapResponse(response);
    },
    enabled: Boolean(applicationId),
    retry: false,
  });

  const rawPropertyCategory =
    customerProfile?.propertyCategory ??
    customerProfile?.property_category ??
    customerProfile?.propertyDetails?.propertyCategory ??
    customerProfile?.propertyDetails?.property_category ??
    fieldVisitData?.propertyCategory ??
    fieldVisitData?.property_category ??
    null;
  const propertyCategory = normalizePropertyCategory(rawPropertyCategory);

  const visitBlocks = useMemo(() => {
    if (!propertyCategory) return [];
    return VISIT_BLOCKS_BY_PROPERTY_CATEGORY[propertyCategory] || [];
  }, [propertyCategory]);

  const savedVisits = useMemo(
    () => normalizeVisits(fieldVisitData),
    [fieldVisitData],
  );
  const isCompleted = Boolean(fieldVisitData?.completionStatus?.completed);

  const { data: fieldVisitDocumentData, isLoading: isDocumentsLoading } =
    useQuery({
      queryKey: ["field-visit-documents", applicationId],
      queryFn: async () => {
        const response = await rmApi.getFieldVisitDocuments(applicationId);
        return unwrapResponse(response);
      },
      enabled: Boolean(applicationId),
      retry: false,
    });

  const fieldVisitDocuments = useMemo(
    () => normalizeDocuments(fieldVisitDocumentData),
    [fieldVisitDocumentData],
  );

  const documentsByBlock = useMemo(() => {
    const grouped = {};
    for (const block of visitBlocks) grouped[block] = [];
    for (const doc of fieldVisitDocuments) {
      const block = getDocumentBlock(doc);
      if (!block) continue;
      grouped[block] = [...(grouped[block] || []), doc];
    }
    return grouped;
  }, [fieldVisitDocuments, visitBlocks]);

  const { data: workflowData, isLoading: isWorkflowLoading } = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: async () => {
      const response = await rmApi.workflowStatus(applicationId);
      return unwrapResponse(response);
    },
    enabled: Boolean(applicationId),
  });
  const leadJourney = buildWorkflowTimeline(workflowData || {});

  const workflowStatus = workflowData?.data?.data ?? {};

  /*
   * A visit block is treated as "saved" once its workflow flag is true.
   * This keeps each card independent: saving the customer visit only
   * locks/hides the customer card, never the business or property cards.
   */
  const savedBlocks = useMemo(() => {
    const set = new Set();
    if (workflowStatus.customerVisit) {
      set.add(VISIT_BLOCKS.CUSTOMER_RESIDENCE);
    }
    if (workflowStatus.businessVisit) {
      set.add(VISIT_BLOCKS.BUSINESS_OFFICE);
    }
    if (workflowStatus.propertyVisit) {
      for (const block of visitBlocks) {
        if (
          block !== VISIT_BLOCKS.CUSTOMER_RESIDENCE &&
          block !== VISIT_BLOCKS.BUSINESS_OFFICE
        ) {
          set.add(block);
        }
      }
    }
    return set;
  }, [workflowStatus, visitBlocks]);

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["field-visit-history", applicationId],
    queryFn: async () => {
      const response = await rmApi.getFieldVisitHistory(applicationId);
      return unwrapResponse(response);
    },
    enabled: Boolean(applicationId) && activeTab === "Visit History",
  });
  const visitHistory = useMemo(
    () => normalizeVisits(historyData),
    [historyData],
  );

  /* --- STATE MANAGEMENT SYNC LIFECYCLES --- */
  useEffect(() => {
    initializedApplicationRef.current = null;
    setVisitForms({});
    setChecklist(createInitialChecklist());
    setSelectedPhotos({});
    setMessage(null);
    setActiveTab("All Visits");
  }, [applicationId]);

  useEffect(() => {
    if (!customerProfile || !propertyCategory || isVisitsLoading) return;
    if (initializedApplicationRef.current === String(applicationId)) return;

    const initialForms = createInitialVisitForms(
      customerProfile,
      propertyCategory,
    );
    setVisitForms(mergeSavedVisits(initialForms, savedVisits));

    const existingChecklist =
      fieldVisitData?.checklistData ||
      savedVisits.find(
        (v) => v?.checklistData && Object.keys(v.checklistData).length > 0,
      )?.checklistData ||
      {};
    setChecklist({ ...createInitialChecklist(), ...existingChecklist });

    setSelectedPhotos(
      visitBlocks.reduce((res, b) => ({ ...res, [b]: [] }), {}),
    );
    initializedApplicationRef.current = String(applicationId);
  }, [
    applicationId,
    customerProfile,
    propertyCategory,
    savedVisits,
    fieldVisitData,
    visitBlocks,
    isVisitsLoading,
  ]);

  const updateVisitField = (block, field, value) => {
    setVisitForms((current) => ({
      ...current,
      [block]: { ...(current[block] || {}), [field]: value },
    }));
  };

  const updateSelectedPhotos = (block, files) => {
    setSelectedPhotos((current) => ({ ...current, [block]: files }));
  };

  /* --- OPERATIONS & MUTATIONS --- */
  const deleteDocumentMutation = useMutation({
    mutationFn: ({ documentId }) =>
      rmApi.deleteFieldVisitDocument(applicationId, documentId),
    onSuccess: async () => {
      setMessage({
        type: "success",
        text: "Field visit photo deleted successfully.",
      });
      await queryClient.invalidateQueries({
        queryKey: ["field-visit-documents", applicationId],
      });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to delete field visit photo."),
      });
    },
  });

  const validateBeforeComplete = () => {
    if (!propertyCategory)
      return "Property category is missing from the customer profile.";
    const requiredFields = {
      [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: [
        "visitDate",
        "customerName",
        "personMet",
        "residenceAddress",
        "residenceType",
        "visitResult",
        "remarks",
      ],
      [VISIT_BLOCKS.BUSINESS_OFFICE]: [
        "visitDate",
        "occupationType",
        "businessName",
        "businessVintage",
        "businessActivity",
        "employeeCount",
        "stockOfficeSetup",
        "visitResult",
        "remarks",
      ],
    };

    const propertyBlock = PROPERTY_VISIT_CONFIG[propertyCategory]?.block;
    requiredFields[propertyBlock] = [
      "visitDate",
      "propertyType",
      "propertyAddress",
      "ownership",
      "usage",
      "area",
      "propertyCondition",
      "nearbyLandmark",
      "marketValue",
      "visitResult",
      "remarks",
    ];

    if (propertyCategory !== "Land / Plot")
      requiredFields[propertyBlock].push("occupancy");
    if (propertyCategory === "Industrial")
      requiredFields[propertyBlock].push("approachRoad", "machineryAvailable");
    if (propertyCategory === "Land / Plot")
      requiredFields[propertyBlock].push("boundaryAvailable", "surveyNumber");

    for (const block of visitBlocks) {
      const form = visitForms[block];
      if (!form)
        return `${getBlockLabel(block, propertyCategory)} form is missing.`;
      for (const f of requiredFields[block] || []) {
        if (!hasValue(form[f]))
          return `${getBlockLabel(block, propertyCategory)}: ${f} is required.`;
      }
      const uploadedCount = documentsByBlock[block]?.length || 0;
      const selectedCount = selectedPhotos[block]?.length || 0;
      if (uploadedCount + selectedCount === 0)
        return `${getBlockLabel(block, propertyCategory)}: at least one photo is required.`;
    }

    const uncheckedChecklist = CHECKLIST_ITEMS.find(
      (item) => checklist[item.key] !== true,
    );
    if (uncheckedChecklist)
      return `Checklist item "${uncheckedChecklist.label}" must be confirmed.`;
    return null;
  };

  const uploadSelectedDocumentsForBlock = async (block) => {
    const files = selectedPhotos[block] || [];
    if (!files.length) return;

    const configuredNames = DOCUMENT_NAMES[block] || [];
    const usedNames = new Set(
      (documentsByBlock[block] || []).map((d) => d.documentName),
    );
    const availableNames = configuredNames.filter(
      (name) => !usedNames.has(name),
    );

    if (files.length > availableNames.length) {
      throw new Error(
        `${getBlockLabel(block, propertyCategory)}: maximum photo limit exceeded.`,
      );
    }

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visitType", API_VISIT_TYPES[block]);
      formData.append("documentType", "PHOTO");
      formData.append("documentSource", "FIELD_VISIT");
      formData.append("documentName", availableNames[index]);

      await rmApi.uploadFieldVisitDocument(applicationId, formData);

      setSelectedPhotos((current) => ({
        ...current,
        [block]: (current[block] || []).filter((sf) => sf !== file),
      }));
    }
  };

  const uploadSelectedDocuments = async () => {
    for (const block of visitBlocks) {
      await uploadSelectedDocumentsForBlock(block);
    }
  };

  const buildCompletionPayload = (location) => ({
    propertyCategory,
    checklistData: checklist,
    ...(location || {}),
    visits: visitBlocks.map((block) => {
      const form = visitForms[block];
      const { visitDate, visitResult, remarks, propertyType, ...formData } =
        form;
      return {
        visitType: API_VISIT_TYPES[block],
        visitDate,
        visitResult,
        remarks,
        ...(propertyType !== undefined ? { propertyType } : {}),
        formData,
        ...(location || {}),
      };
    }),
  });

  const buildSaveVisitPayload = (block, location) => {
    if (!propertyCategory)
      throw new Error(
        `Invalid property category received: ${rawPropertyCategory || "Empty"}`,
      );
    const form = visitForms[block];
    if (!form)
      throw new Error(
        `${getBlockLabel(block, propertyCategory)} form is missing.`,
      );
    const { visitDate, visitResult, remarks, propertyType, ...formData } = form;

    return {
      propertyCategory,
      visit: {
        visitType: API_VISIT_TYPES[block],
        visitDate: visitDate || undefined,
        visitResult: visitResult || undefined,
        remarks: remarks || undefined,
        propertyType: propertyType ?? null,
        formData,
        checklistData: checklist,
        ...(location || {}),
      },
    };
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      const validationError = validateBeforeComplete();
      if (validationError) throw new Error(validationError);

      setMessage({ type: "info", text: "Uploading field visit photos..." });
      await uploadSelectedDocuments();
      await queryClient.invalidateQueries({
        queryKey: ["field-visit-documents", applicationId],
      });

      setMessage({ type: "info", text: "Completing field visits..." });
      const location = await getBrowserLocation();
      const payload = buildCompletionPayload(location);
      const response = await rmApi.completeFieldVisits(applicationId, payload);
      return unwrapResponse(response);
    },
    onSuccess: async () => {
      setMessage({
        type: "success",
        text: "Field visits completed successfully.",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["field-visits", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["field-visit-documents", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["field-visit-history", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", applicationId],
        }),
        queryClient.invalidateQueries({ queryKey: ["rm-workflow-overview"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer-profile", applicationId],
        }),
      ]);
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to complete field visits."),
      });
    },
  });

  const saveVisitMutation = useMutation({
    mutationFn: async (block) => {
      if (!propertyCategory)
        throw new Error(
          `Property category is invalid or missing. Received: ${rawPropertyCategory || "Empty"}`,
        );
      await uploadSelectedDocumentsForBlock(block);
      const location = await getBrowserLocation();
      const payload = buildSaveVisitPayload(block, location);

      console.log("SAVE FIELD VISIT PAYLOAD:", payload);
      const response = await rmApi.saveFieldVisit(applicationId, payload);
      return { block, response: unwrapResponse(response) };
    },
    onSuccess: async ({ block, response }) => {
      setMessage({
        type: "success",
        text:
          response?.message ||
          `${getBlockLabel(block, propertyCategory)} visit saved successfully.`,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["field-visits", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["field-visit-documents", applicationId],
        }),
      ]);
    },
    onError: (error, block) => {
      setMessage({
        type: "error",
        text: getApiErrorMessage(
          error,
          `Unable to save ${getBlockLabel(block, propertyCategory)} visit.`,
        ),
      });
    },
  });

  /* --- VIEW RENDER CONTEXTS --- */

  const handleContinueJourney = () => {
    const pendingVisits = [];
    if (!workflowStatus.customerVisit) pendingVisits.push("Customer");
    if (!workflowStatus.businessVisit) pendingVisits.push("Business");
    if (!workflowStatus.propertyVisit) pendingVisits.push("Property");

    if (pendingVisits.length) {
      setMessage({
        type: "error",
        text: `Complete ${pendingVisits.join(", ")} visit${
          pendingVisits.length > 1 ? "s" : ""
        } before continuing the journey.`,
      });
      return;
    }

    if (applicationId) {
      navigate(`/geo-verification/${applicationId}`, { replace: true });
    }
  };

  const tabs = useMemo(
    () => [
      "All Visits",
      ...visitBlocks.map((b) => getBlockLabel(b, propertyCategory)),
      "Visit History",
    ],
    [visitBlocks, propertyCategory],
  );

  const visibleBlocks = useMemo(() => {
    if (activeTab === "All Visits") return visitBlocks;
    if (activeTab === "Visit History") return [];
    return visitBlocks.filter(
      (b) => getBlockLabel(b, propertyCategory) === activeTab,
    );
  }, [activeTab, visitBlocks, propertyCategory]);

  const pageLoading = isProfileLoading || isVisitsLoading || isDocumentsLoading;
  const formDisabled =
    isCompleted || completeMutation.isPending || saveVisitMutation.isPending;

  const renderVisitBlock = (block) => {
    const commonProps = {
      form: visitForms[block] || {},
      selectedFiles: selectedPhotos[block] || [],
      uploadedDocuments: documentsByBlock[block] || [],
      disabled: formDisabled,
      onChange: (field, val) => updateVisitField(block, field, val),
      onFilesChange: (files) => updateSelectedPhotos(block, files),
      onDeleteDocument: (docId) =>
        deleteDocumentMutation.mutate({ documentId: docId }),
      deletingDocumentId: deleteDocumentMutation.variables?.documentId,
      onSave: () => saveVisitMutation.mutate(block),
      isSaving:
        saveVisitMutation.isPending && saveVisitMutation.variables === block,
      saved: savedBlocks.has(block),
    };

    switch (block) {
      case VISIT_BLOCKS.CUSTOMER_RESIDENCE:
        return <CustomerResidenceCard key={block} {...commonProps} />;
      case VISIT_BLOCKS.BUSINESS_OFFICE:
        return <BusinessOfficeCard key={block} {...commonProps} />;
      case VISIT_BLOCKS.RESIDENTIAL_PROPERTY:
      case VISIT_BLOCKS.COMMERCIAL_PROPERTY:
      case VISIT_BLOCKS.INDUSTRIAL_PROPERTY:
      case VISIT_BLOCKS.LAND_PLOT:
        return (
          <PropertyVisitCard
            key={block}
            block={block}
            propertyCategory={propertyCategory}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 text-slate-800 antialiased sm:p-6 lg:p-8">
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Field Visits & Verification
              </h2>
              <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">
                Application ID: {applicationId || "N/A"} • Residence, business
                and collateral visit evidence
              </p>
              {propertyCategory && (
                <div className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
                  Property Category: {propertyCategory}
                </div>
              )}
              {isCompleted && (
                <div className="ml-2 mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-white">
                  Visits Completed
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={
                !applicationId ||
                !propertyCategory ||
                completeMutation.isPending ||
                saveVisitMutation.isPending ||
                pageLoading ||
                isWorkflowLoading ||
                isCompleted
              }
              onClick={() => completeMutation.mutate()}
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-blue-700 shadow-md transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completeMutation.isPending
                ? "Completing..."
                : isCompleted
                  ? "Visits Completed"
                  : "Complete Field Visits"}
            </button>
            <button
              type="button"
              onClick={handleContinueJourney}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-emerald-600"
            >
              Continue Journey
            </button>
          </div>

          {/* Workflow Status Slider */}
          <div className="mt-2 rounded-2xl bg-white/95 p-5 text-slate-800 shadow-inner backdrop-blur-sm">
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[800px] items-center justify-between">
                {isWorkflowLoading ? (
                  <div className="w-full animate-pulse py-2 text-center text-xs font-semibold text-slate-400">
                    Loading workflow tracker timeline...
                  </div>
                ) : (
                  leadJourney.map((item, index) => {
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
                            className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${leadJourney[index + 1]?.completed ? "bg-emerald-500" : "bg-slate-200"}`}
                          />
                        )}
                        <div
                          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${item.completed ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-white text-slate-400 ring-2 ring-slate-200"}`}
                        >
                          {item.completed ? "✓" : isCurrent ? "●" : index + 1}
                        </div>
                        <p
                          className={`mt-2.5 px-2 text-xs font-semibold ${item.completed || isCurrent ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {item.label}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messaging & Guard Feedback Panels */}
      {isProfileError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {getApiErrorMessage(profileError, "Unable to load customer profile.")}
        </div>
      )}

      {!isProfileLoading &&
        !isProfileError &&
        customerProfile &&
        !propertyCategory && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-extrabold">
              Unsupported or missing property category
            </p>
            <p className="mt-1 text-xs font-medium">
              Received value: {customerProfile?.propertyCategory || "Empty"}.
              Expected one of: {PROPERTY_CATEGORY.join(", ")}.
            </p>
          </div>
        )}

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm font-semibold ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs Filter Bar */}
      {!isProfileLoading && propertyCategory && (
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Cards Display Grid Section */}
      {pageLoading ? (
        <VisitCardsLoading />
      ) : activeTab === "Visit History" ? (
        <VisitHistory history={visitHistory} isLoading={isHistoryLoading} />
      ) : propertyCategory ? (
        <div
          className={`grid grid-cols-1 gap-6 ${activeTab === "All Visits" ? "lg:grid-cols-3" : "mx-auto max-w-2xl"}`}
        >
          {visibleBlocks.map(renderVisitBlock)}
        </div>
      ) : null}

      {/* Field Control Compliance Checklist */}
      {!pageLoading && propertyCategory && activeTab !== "Visit History" && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">
              Field control checklist
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 ${formDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key] || false}
                  disabled={formDisabled}
                  onChange={(e) =>
                    setChecklist((cur) => ({
                      ...cur,
                      [item.key]: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {item.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
