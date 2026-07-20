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
import { useAuth } from "../../../hooks/useAuth.js";
import { rmApi } from "../rmApi.js";
import {
  buildWorkflowTimeline,
  PROPERTY_CATEGORY,
  PROPERTY_TYPE,
} from "../rmUtils.js";

/* =========================================================
   VISIT BLOCKS & API TYPES
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
  Residential: [VISIT_BLOCKS.CUSTOMER_RESIDENCE, VISIT_BLOCKS.BUSINESS_OFFICE, VISIT_BLOCKS.RESIDENTIAL_PROPERTY],
  Commercial: [VISIT_BLOCKS.CUSTOMER_RESIDENCE, VISIT_BLOCKS.BUSINESS_OFFICE, VISIT_BLOCKS.COMMERCIAL_PROPERTY],
  Industrial: [VISIT_BLOCKS.CUSTOMER_RESIDENCE, VISIT_BLOCKS.BUSINESS_OFFICE, VISIT_BLOCKS.INDUSTRIAL_PROPERTY],
  "Land / Plot": [VISIT_BLOCKS.CUSTOMER_RESIDENCE, VISIT_BLOCKS.BUSINESS_OFFICE, VISIT_BLOCKS.LAND_PLOT],
};

const DOCUMENT_NAMES = {
  [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: ["CUSTOMER_RESIDENCE_FRONTAGE", "CUSTOMER_RESIDENCE_INTERIOR", "CUSTOMER_WITH_RESIDENCE", "RESIDENCE_NEARBY_LANDMARK"],
  [VISIT_BLOCKS.BUSINESS_OFFICE]: ["BUSINESS_FRONTAGE", "BUSINESS_SIGNBOARD", "BUSINESS_INTERIOR", "BUSINESS_STOCK", "BUSINESS_EMPLOYEE_SETUP"],
  [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: ["RESIDENTIAL_PROPERTY_FRONTAGE", "RESIDENTIAL_PROPERTY_ENTRANCE", "RESIDENTIAL_PROPERTY_INTERIOR", "RESIDENTIAL_PROPERTY_LANDMARK"],
  [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: ["COMMERCIAL_PROPERTY_FRONTAGE", "COMMERCIAL_PROPERTY_SIGNBOARD", "COMMERCIAL_PROPERTY_INTERIOR", "COMMERCIAL_PROPERTY_LANDMARK"],
  [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: ["INDUSTRIAL_PROPERTY_GATE", "INDUSTRIAL_PROPERTY_SHED", "INDUSTRIAL_PROPERTY_MACHINERY", "INDUSTRIAL_PROPERTY_APPROACH_ROAD"],
  [VISIT_BLOCKS.LAND_PLOT]: ["LAND_PLOT_FRONTAGE", "LAND_PLOT_BOUNDARY", "LAND_PLOT_CORNER", "LAND_PLOT_SURVEY_MARKER", "LAND_PLOT_APPROACH_ROAD"],
};

const PROPERTY_VISIT_CONFIG = {
  Residential: {
    block: VISIT_BLOCKS.RESIDENTIAL_PROPERTY,
    title: "Residential Property Visit",
    icon: FaHome,
    areaLabel: "Built-up Area (sq. ft.)",
    usageLabel: "Residential Usage",
    usageOptions: ["Self Occupied", "Family Occupied", "Tenanted", "Vacant", "Under Construction"],
    landmarkPlaceholder: "Near society, school or main road",
    photoText: "Capture building frontage, entrance, interiors and landmark photos",
  },
  Commercial: {
    block: VISIT_BLOCKS.COMMERCIAL_PROPERTY,
    title: "Commercial Property Visit",
    icon: FaBuilding,
    areaLabel: "Commercial Area (sq. ft.)",
    usageLabel: "Commercial Usage",
    usageOptions: ["Office", "Shop", "Showroom", "Warehouse", "Hotel", "Restaurant", "Hospital", "Educational Institution", "Other Commercial Use"],
    landmarkPlaceholder: "Near market, business park or main road",
    photoText: "Capture commercial frontage, signboard, interiors and landmark photos",
  },
  Industrial: {
    block: VISIT_BLOCKS.INDUSTRIAL_PROPERTY,
    title: "Industrial Property Visit",
    icon: FaIndustry,
    areaLabel: "Industrial Area (sq. ft.)",
    usageLabel: "Industrial Usage",
    usageOptions: ["Factory", "Manufacturing Unit", "Industrial Shed", "Warehouse", "Godown", "Workshop", "Other Industrial Use"],
    landmarkPlaceholder: "Near industrial estate, highway or factory",
    photoText: "Capture factory gate, shed, machinery, approach road and landmark photos",
  },
  "Land / Plot": {
    block: VISIT_BLOCKS.LAND_PLOT,
    title: "Land / Plot Visit",
    icon: FaMapMarkedAlt,
    areaLabel: "Plot Area (sq. ft.)",
    usageLabel: "Current Land Usage",
    usageOptions: ["Vacant Plot", "Agricultural Use", "Residential Use", "Commercial Use", "Industrial Use", "Under Construction"],
    landmarkPlaceholder: "Near survey marker, village road or highway",
    photoText: "Capture plot boundaries, corners, survey marker, approach road and landmark photos",
  },
};

const CHECKLIST_ITEMS = [
  { key: "customerIdentityMatched", label: "Customer identity matched", desc: "Customer identity verified during visit" },
  { key: "visitWithinAssignedRoute", label: "Visit within assigned route", desc: "Visit location is within the assigned area" },
  { key: "photosContainExifEvidence", label: "Photos contain EXIF/time evidence", desc: "Photo timestamp and location evidence captured" },
  { key: "noImageDuplicationDetected", label: "No image duplication detected", desc: "Uploaded images are unique" },
  { key: "addressComparedWithApplication", label: "Address compared with application", desc: "Physical address matches application details" },
  { key: "negativeObservationsDisclosed", label: "Negative observations disclosed", desc: "All adverse observations have been recorded" },
];

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none transition-colors focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const textareaClass = `${inputClass} resize-none`;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? response;
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const normalizePropertyCategory = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");
  const categoryMap = {
    residential: "Residential", "residential property": "Residential", "residential property visit": "Residential", "customer / residence": "Residential", "customer / residence visit": "Residential", customer_residence: "Residential",
    commercial: "Commercial", "commercial property": "Commercial", "commercial property visit": "Commercial", "business / office": "Commercial", "business / office visit": "Commercial", business_office: "Commercial",
    industrial: "Industrial", "industrial property": "Industrial", "industrial property visit": "Industrial",
    "land / plot": "Land / Plot", "land/plot": "Land / Plot", "land plot": "Land / Plot", "land and plot": "Land / Plot", land: "Land / Plot", plot: "Land / Plot"
  };
  return categoryMap[normalizedValue] || null;
};

const normalizePropertyType = (propertyType, propertyCategory) => {
  if (!propertyType) return "";
  const value = String(propertyType).trim();
  if (!propertyCategory) return value;
  return value.replace(new RegExp(`^${propertyCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-\\s*`, "i"), "").trim();
};

const normalizeVisitBlock = (value) => {
  const map = {
    customer_residence: VISIT_BLOCKS.CUSTOMER_RESIDENCE,
    business_office: VISIT_BLOCKS.BUSINESS_OFFICE,
    residential_property: VISIT_BLOCKS.RESIDENTIAL_PROPERTY,
    commercial_property: VISIT_BLOCKS.COMMERCIAL_PROPERTY,
    industrial_property: VISIT_BLOCKS.INDUSTRIAL_PROPERTY,
    land_plot: VISIT_BLOCKS.LAND_PLOT,
  };
  return map[String(value || "").trim().toLowerCase()] || null;
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
  return labels[block] || PROPERTY_VISIT_CONFIG[propertyCategory]?.title || "Property";
};

const getDocumentBlock = (document) => {
  const visitTypeBlock = normalizeVisitBlock(document?.visitType);
  if (visitTypeBlock) return visitTypeBlock;
  const name = String(document?.documentName || "").toUpperCase();
  if (name.startsWith("CUSTOMER_RESIDENCE_") || name === "RESIDENCE_NEARBY_LANDMARK") return VISIT_BLOCKS.CUSTOMER_RESIDENCE;
  if (name.startsWith("BUSINESS_")) return VISIT_BLOCKS.BUSINESS_OFFICE;
  if (name.startsWith("RESIDENTIAL_PROPERTY_")) return VISIT_BLOCKS.RESIDENTIAL_PROPERTY;
  if (name.startsWith("COMMERCIAL_PROPERTY_")) return VISIT_BLOCKS.COMMERCIAL_PROPERTY;
  if (name.startsWith("INDUSTRIAL_PROPERTY_")) return VISIT_BLOCKS.INDUSTRIAL_PROPERTY;
  if (name.startsWith("LAND_PLOT_")) return VISIT_BLOCKS.LAND_PLOT;
  return null;
};

const createInitialChecklist = () => CHECKLIST_ITEMS.reduce((res, item) => ({ ...res, [item.key]: false }), {});

const createInitialVisitForms = (profile, propertyCategory) => {
  const today = getTodayDate();
  const customerName = [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(" ");
  const residenceAddress = [profile?.currentAddress, profile?.currentCity, profile?.currentState, profile?.currentPincode].filter(Boolean).join(", ");
  const propertyAddress = [profile?.propertyAddress, profile?.propertyCity, profile?.propertyState, profile?.propertyPincode].filter(Boolean).join(", ");
  const normPropType = normalizePropertyType(profile?.propertyType, propertyCategory);

  const basePropFields = { visitDate: today, propertyType: normPropType, propertyAddress, ownership: profile?.ownershipType || "", usage: "", area: "", propertyCondition: "", nearbyLandmark: "", marketValue: profile?.marketValue || "", visitResult: "", remarks: "" };

  return {
    [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: { visitDate: today, customerName, personMet: "Customer", residenceAddress, residenceType: "", visitResult: "", remarks: "" },
    [VISIT_BLOCKS.BUSINESS_OFFICE]: { visitDate: today, occupationType: profile?.occupationType || "", businessName: profile?.businessName || "", businessVintage: "", businessActivity: "", employeeCount: "", stockOfficeSetup: "", visitResult: "", remarks: "" },
    [VISIT_BLOCKS.RESIDENTIAL_PROPERTY]: { ...basePropFields, occupancy: "" },
    [VISIT_BLOCKS.COMMERCIAL_PROPERTY]: { ...basePropFields, occupancy: "" },
    [VISIT_BLOCKS.INDUSTRIAL_PROPERTY]: { ...basePropFields, occupancy: "", approachRoad: "", machineryAvailable: "" },
    [VISIT_BLOCKS.LAND_PLOT]: { ...basePropFields, boundaryAvailable: "", surveyNumber: "" },
  };
};

const mergeSavedVisits = (initialForms, savedVisits) => {
  const merged = { ...initialForms };
  for (const saved of savedVisits) {
    const block = normalizeVisitBlock(saved?.visitType);
    if (!block || !merged[block]) continue;
    merged[block] = {
      ...merged[block],
      ...(saved?.formData || {}),
      visitDate: saved?.visitDate || merged[block].visitDate,
      visitResult: saved?.visitResult ? String(saved.visitResult).trim().charAt(0).toUpperCase() + String(saved.visitResult).trim().slice(1).toLowerCase() : merged[block].visitResult,
      remarks: saved?.remarks ?? merged[block].remarks,
    };
    if (saved?.propertyType !== undefined) merged[block].propertyType = saved.propertyType || "";
  }
  return merged;
};

const getBrowserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, locationAccuracy: pos.coords.accuracy, capturedAt: new Date().toISOString(), deviceId: navigator.userAgent }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await rmApi.reverseGeocode(lat, lng);
    return unwrapResponse(res)?.formattedAddress || "";
  } catch {
    return "";
  }
};

/* =========================================================
   INLINE ATOMIC SUBCOMPONENTS
========================================================= */
function GeoCameraModal({ isOpen, onClose, onCapture, blockName }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [captureLocation, setCaptureLocation] = useState(null);
  const [watermarkTime, setWatermarkTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setWatermarkTime(new Date()), 1000);

    async function initSystem() {
      setIsInitializing(true); setErrorMsg(""); setCaptureLocation(null);
      if (!navigator.geolocation) {
        setErrorMsg("GPS not supported."); setIsInitializing(false); return;
      }
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 12000 }));
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setCaptureLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, locationName: address });

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsInitializing(false);
      } catch (err) {
        setErrorMsg("Permissions denied for Camera or GPS positioning.");
        setIsInitializing(false);
      }
    }
    initSystem();
    return () => { clearInterval(timer); stopTracks(); };
  }, [isOpen]);

  const stopTracks = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !captureLocation) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.font = "16px Arial"; ctx.fillStyle = "#fff";
    ctx.fillText(`Visit: ${blockName} | Loc: ${captureLocation.locationName || "N/A"}`, 20, canvas.height - 45);
    ctx.fillText(`Lat: ${captureLocation.latitude.toFixed(5)} Long: ${captureLocation.longitude.toFixed(5)} | ${new Date().toLocaleString()}`, 20, canvas.height - 20);

    canvas.toBlob((blob) => {
      onCapture(new File([blob], `visit_${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopTracks(); onClose();
    }, "image/jpeg", 0.95);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h4 className="text-sm font-extrabold text-slate-800">Secure Live Capture - {blockName}</h4>
          <button onClick={() => { stopTracks(); onClose(); }} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
        </div>
        <div className="relative aspect-video bg-black flex flex-col justify-center items-center">
          {isInitializing && <div className="text-white text-xs">Initializing Secure Environment...</div>}
          {errorMsg && <div className="text-rose-400 text-xs px-4 text-center">{errorMsg}</div>}
          <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${isInitializing || errorMsg ? "hidden" : "block"}`} />
        </div>
        <div className="flex justify-between bg-slate-50 px-5 py-4">
          <button onClick={() => { stopTracks(); onClose(); }} className="rounded-xl border px-4 py-2 text-xs font-bold bg-white">Cancel</button>
          <button disabled={isInitializing || !!errorMsg} onClick={handleCapture} className="bg-blue-600 text-white rounded-xl px-5 py-2 text-xs font-extrabold disabled:opacity-50">Capture</button>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ imageUrl, title, onClose }) {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <button onClick={onClose} className="text-slate-400"><FaTimes /></button>
        </div>
        <div className="bg-black p-2 flex justify-center max-h-[70vh]">
          <img src={imageUrl} alt="Preview" className="max-h-[65vh] object-contain" />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase text-slate-500">{label}{required && <span className="ml-1 text-rose-500">*</span>}</label>
      {children}
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
  allowExtraFiles = false,
  onFilesChange,
  onDeleteDocument,
  deletingDocumentId,
  blockLabel,
}) {
  const maxFiles = DOCUMENT_NAMES[block]?.length || 0;
  const usedCount = selectedFiles.length + uploadedDocuments.length;
  const remainingSlots = allowExtraFiles
    ? Math.max(99 - selectedFiles.length, 0)
    : Math.max(maxFiles - usedCount, 0);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const canCapture = !disabled && remainingSlots > 0;

  return (
    <div className="space-y-3">
      <div
        onClick={() => canCapture && setIsCameraOpen(true)}
        className={`rounded-xl border-2 border-dashed p-4 text-center ${
          !canCapture
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : "cursor-pointer border-blue-200 bg-blue-50/30 hover:border-blue-400"
        }`}
      >
        <FaCamera className="mx-auto mb-1 text-slate-400" size={16} />
        <div className="text-xs font-bold text-slate-700">{title}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
        <div className="mt-1 text-[10px] font-bold text-blue-600">
          {allowExtraFiles
            ? "Valuation can upload additional revisit photos"
            : remainingSlots > 0
              ? `${remainingSlots} slots remaining`
              : "Limits reached"}
        </div>
      </div>

      <GeoCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => onFilesChange([...selectedFiles, file])}
        blockName={blockLabel}
      />

      <ImagePreviewModal
        imageUrl={preview?.url}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />

      {uploadedDocuments.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-1.5 text-xs"
        >
          <span className="truncate font-bold text-slate-700">
            {doc.fileName || doc.documentName}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPreview({
                  url: doc.fileUrl || doc.documentUrl || doc.url,
                  title: doc.documentName,
                })
              }
              className="font-bold text-blue-600"
            >
              <FaEye />
            </button>

            {!disabled && (
              <button
                type="button"
                disabled={deletingDocumentId === doc.id}
                onClick={() => onDeleteDocument(doc.id)}
                className="text-rose-500 disabled:opacity-40"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
      ))}

      {selectedFiles.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-1.5 text-xs"
        >
          <span className="truncate font-bold text-slate-700">
            {file.name}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPreview({
                  url: URL.createObjectURL(file),
                  title: file.name,
                })
              }
              className="font-bold text-blue-600"
            >
              <FaEye />
            </button>

            {!disabled && (
              <button
                type="button"
                onClick={() =>
                  onFilesChange(
                    selectedFiles.filter((_, idx) => idx !== index),
                  )
                }
                className="text-rose-500"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitSaveButton({
  label,
  updateLabel,
  disabled,
  isSaving,
  onSave,
  saved,
  savedLocked,
}) {
  if (saved && savedLocked) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-extrabold text-white shadow-md">
        <FaCheckCircle size={14} /> Done
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isSaving}
      onClick={onSave}
      className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-40"
    >
      {isSaving ? "Saving..." : saved ? updateLabel || "Update Visit" : label}
    </button>
  );
}

/* =========================================================
   CONTAINER CARD MODULES (RESIDENCE, BUSINESS, COLLATERAL)
========================================================= */
function CustomerResidenceCard({ form, selectedFiles, uploadedDocuments, disabled, allowSavedEdit = false, allowExtraPhotos = false, onChange, onFilesChange, onDeleteDocument, deletingDocumentId, onSave, isSaving, saved, isTranslucent }) {
  const isSavedLocked = saved && !allowSavedEdit;

  return (
    <div className={`space-y-4 rounded-2xl border p-6 transition-all shadow-sm ${saved ? "border-emerald-200 bg-emerald-50/30 ring-2 ring-emerald-500" : "border-slate-100 bg-white"} ${isTranslucent ? "opacity-40 pointer-events-none select-none" : ""}`}>
      <div className="flex justify-between items-start border-b pb-2">
        <div className="flex items-center gap-2">
          <FaHome className="text-blue-600" />
          <h3 className="text-sm font-extrabold text-slate-800">Customer / Residence Visit</h3>
        </div>
        {saved && <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Completed</span>}
      </div>

      <FormField label="Visit Date" required>
        <input type="date" value={form.visitDate} disabled={disabled || isSavedLocked} onChange={e => onChange("visitDate", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Customer Name" required>
        <input type="text" value={form.customerName} disabled={disabled || isSavedLocked} onChange={e => onChange("customerName", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Person Met" required>
        <select value={form.personMet} disabled={disabled || isSavedLocked} onChange={e => onChange("personMet", e.target.value)} className={inputClass}>
          <option value="Customer">Customer</option>
          <option value="Spouse">Spouse</option>
          <option value="Co-Applicant">Co-Applicant</option>
          <option value="Family Member">Family Member</option>
        </select>
      </FormField>
      <FormField label="Residence Address" required>
        <textarea rows={2} value={form.residenceAddress} disabled={disabled || isSavedLocked} onChange={e => onChange("residenceAddress", e.target.value)} className={textareaClass} />
      </FormField>
      <FormField label="Residence Type" required>
        <select value={form.residenceType} disabled={disabled || isSavedLocked} onChange={e => onChange("residenceType", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          <option value="Owned">Owned</option>
          <option value="Rented">Rented</option>
          <option value="Ancestral">Ancestral</option>
        </select>
      </FormField>
      <FormField label="Visit Result" required>
        <select value={form.visitResult} disabled={disabled || isSavedLocked} onChange={e => onChange("visitResult", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
        </select>
      </FormField>
      <FormField label="Remarks" required>
        <textarea rows={2} value={form.remarks} disabled={disabled || isSavedLocked} onChange={e => onChange("remarks", e.target.value)} className={textareaClass} />
      </FormField>

      <PhotoUpload block={VISIT_BLOCKS.CUSTOMER_RESIDENCE} title="Residence Photos" description="Frontage, internal setup" selectedFiles={selectedFiles} uploadedDocuments={uploadedDocuments} disabled={disabled || isSavedLocked} onFilesChange={onFilesChange} onDeleteDocument={onDeleteDocument} deletingDocumentId={deletingDocumentId} blockLabel="Residence" allowExtraFiles={allowExtraPhotos} />
      <VisitSaveButton label="Save Customer Visit" updateLabel="Update Customer Visit" disabled={disabled} isSaving={isSaving} onSave={onSave} saved={saved} savedLocked={isSavedLocked} />
    </div>
  );
}

function BusinessOfficeCard({ form, selectedFiles, uploadedDocuments, disabled, allowSavedEdit = false, allowExtraPhotos = false, onChange, onFilesChange, onDeleteDocument, deletingDocumentId, onSave, isSaving, saved, isTranslucent }) {
  const isSavedLocked = saved && !allowSavedEdit;

  return (
    <div className={`space-y-4 rounded-2xl border p-6 transition-all shadow-sm ${saved ? "border-emerald-200 bg-emerald-50/30 ring-2 ring-emerald-500" : "border-slate-100 bg-white"} ${isTranslucent ? "opacity-40 pointer-events-none select-none" : ""}`}>
      <div className="flex justify-between items-start border-b pb-2">
        <div className="flex items-center gap-2">
          <FaBuilding className="text-violet-600" />
          <h3 className="text-sm font-extrabold text-slate-800">Business / Office Visit</h3>
        </div>
        {saved && <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Completed</span>}
      </div>

      <FormField label="Visit Date" required>
        <input type="date" value={form.visitDate} disabled={disabled || isSavedLocked} onChange={e => onChange("visitDate", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Occupation Type" required>
        <input type="text" value={form.occupationType} disabled={disabled || isSavedLocked} onChange={e => onChange("occupationType", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Business Name" required>
        <input type="text" value={form.businessName} disabled={disabled || isSavedLocked} onChange={e => onChange("businessName", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Business Vintage (Years)" required>
        <input type="number" value={form.businessVintage} disabled={disabled || isSavedLocked} onChange={e => onChange("businessVintage", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Business Activity" required>
        <input type="text" value={form.businessActivity} disabled={disabled || isSavedLocked} onChange={e => onChange("businessActivity", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Employee Count" required>
        <input type="number" value={form.employeeCount} disabled={disabled || isSavedLocked} onChange={e => onChange("employeeCount", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Stock Setup" required>
        <select value={form.stockOfficeSetup} disabled={disabled || isSavedLocked} onChange={e => onChange("stockOfficeSetup", e.target.value)} className={inputClass}>
          <option value="">Select position</option>
          <option value="Adequate">Adequate</option>
          <option value="Available">Available</option>
          <option value="Scarce">Scarce</option>
        </select>
      </FormField>
      <FormField label="Visit Result" required>
        <select value={form.visitResult} disabled={disabled || isSavedLocked} onChange={e => onChange("visitResult", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
        </select>
      </FormField>
      <FormField label="Remarks" required>
        <textarea rows={2} value={form.remarks} disabled={disabled || isSavedLocked} onChange={e => onChange("remarks", e.target.value)} className={textareaClass} />
      </FormField>

      <PhotoUpload block={VISIT_BLOCKS.BUSINESS_OFFICE} title="Business Photos" description="Office signage, interior workspace" selectedFiles={selectedFiles} uploadedDocuments={uploadedDocuments} disabled={disabled || isSavedLocked} onFilesChange={onFilesChange} onDeleteDocument={onDeleteDocument} deletingDocumentId={deletingDocumentId} blockLabel="Business" allowExtraFiles={allowExtraPhotos} />
      <VisitSaveButton label="Save Business Visit" updateLabel="Update Business Visit" disabled={disabled} isSaving={isSaving} onSave={onSave} saved={saved} savedLocked={isSavedLocked} />
    </div>
  );
}

function PropertyVisitCard({ block, form, propertyCategory, selectedFiles, uploadedDocuments, disabled, allowSavedEdit = false, allowExtraPhotos = false, onChange, onFilesChange, onDeleteDocument, deletingDocumentId, onSave, isSaving, saved, isTranslucent }) {
  const config = PROPERTY_VISIT_CONFIG[propertyCategory];
  if (!config) return null;
  const Icon = config.icon;
  const propertyTypes = PROPERTY_TYPE[propertyCategory] || [];
  const isSavedLocked = saved && !allowSavedEdit;

  return (
    <div className={`space-y-4 rounded-2xl border p-6 transition-all shadow-sm ${saved ? "border-emerald-200 bg-emerald-50/30 ring-2 ring-emerald-500" : "border-slate-100 bg-white"} ${isTranslucent ? "opacity-40 pointer-events-none select-none" : ""}`}>
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <Icon className="text-emerald-600" />
          <h3 className="text-sm font-extrabold text-slate-800">{config.title}</h3>
        </div>
        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{propertyCategory}</span>
      </div>

      <FormField label="Visit Date" required>
        <input type="date" value={form.visitDate} disabled={disabled || isSavedLocked} onChange={e => onChange("visitDate", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Property Type" required>
        <select value={form.propertyType} disabled={disabled || isSavedLocked} onChange={e => onChange("propertyType", e.target.value)} className={inputClass}>
          <option value="">Select Option</option>
          {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </FormField>
      <FormField label="Property Address" required>
        <textarea rows={2} value={form.propertyAddress} disabled={disabled || isSavedLocked} onChange={e => onChange("propertyAddress", e.target.value)} className={textareaClass} />
      </FormField>
      <FormField label="Ownership Status" required>
        <select value={form.ownership} disabled={disabled || isSavedLocked} onChange={e => onChange("ownership", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          <option value="Self">Self Owned</option>
          <option value="Joint">Joint Ownership</option>
        </select>
      </FormField>
      <FormField label={config.usageLabel} required>
        <select value={form.usage} disabled={disabled || isSavedLocked} onChange={e => onChange("usage", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          {config.usageOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </FormField>
      <FormField label={config.areaLabel} required>
        <input type="number" value={form.area} disabled={disabled || isSavedLocked} onChange={e => onChange("area", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Market Value Estimate" required>
        <input type="number" value={form.marketValue} disabled={disabled || isSavedLocked} onChange={e => onChange("marketValue", e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Visit Result" required>
        <select value={form.visitResult} disabled={disabled || isSavedLocked} onChange={e => onChange("visitResult", e.target.value)} className={inputClass}>
          <option value="">Select option</option>
          <option value="Positive">Positive</option>
          <option value="Negative">Negative</option>
        </select>
      </FormField>
      <FormField label="Remarks" required>
        <textarea rows={2} value={form.remarks} disabled={disabled || isSavedLocked} onChange={e => onChange("remarks", e.target.value)} className={textareaClass} />
      </FormField>

      <PhotoUpload block={block} title="Collateral Assets Photos" description={config.photoText} selectedFiles={selectedFiles} uploadedDocuments={uploadedDocuments} disabled={disabled || isSavedLocked} onFilesChange={onFilesChange} onDeleteDocument={onDeleteDocument} deletingDocumentId={deletingDocumentId} blockLabel="Property" allowExtraFiles={allowExtraPhotos} />
      <VisitSaveButton label="Save Property Visit" updateLabel="Update Property Visit" disabled={disabled} isSaving={isSaving} onSave={onSave} saved={saved} savedLocked={isSavedLocked} />
    </div>
  );

}


function normalizeRoles(user) {
  const roles = user?.roles;

  if (!roles) return [];

  return Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase())
    : [String(roles).toUpperCase()];
}

function unwrapApplicationList(response) {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}
/* =========================================================
   CORE COMPONENT MODULE EXPORT
========================================================= */
export default function FieldVisits() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initializedApplicationRef = useRef(null);

  const { user } = useAuth();
  const roles = normalizeRoles(user);

  const isRM = roles.includes("RM");
  const isValuation = roles.includes("VALUATION") || roles.includes("VALUTION");

  const canSelectApplication = isRM || isValuation;

  const [message, setMessage] = useState(null);
  const [visitForms, setVisitForms] = useState({});
  const [checklist, setChecklist] = useState(createInitialChecklist());
  const [selectedPhotos, setSelectedPhotos] = useState({});

  const applicationsQuery = useQuery({
    queryKey: ["field-visit-application-list", roles.join("_")],
    queryFn: async () => rmApi.applications({ page: 1, limit: 200 }),
    enabled: canSelectApplication,
    retry: false,
  });

  const applicationList = useMemo(() => {
    const rows = unwrapApplicationList(applicationsQuery.data);

    if (isValuation) {
      return rows.filter((item) => {
        const stage = String(item.stage || "").toUpperCase();
        const status = String(item.status || "").toUpperCase();

        return (
          stage === "VALUATION" ||
          status === "VALUATION_PENDING" ||
          status === "VALUATION_QUERY"
        );
      });
    }

    return rows;
  }, [applicationsQuery.data, isValuation]);

  const selectedApplicationSummary = useMemo(() => {
    if (!applicationId) return null;

    return applicationList.find(
      (item) => String(item.id) === String(applicationId),
    );
  }, [applicationId, applicationList]);

  const handleApplicationChange = (event) => {
    const selectedId = event.target.value;

    setMessage(null);

    if (!selectedId) {
      navigate("/field-visits", { replace: true });
      return;
    }

    initializedApplicationRef.current = null;
    setVisitForms({});
    setSelectedPhotos({});

    navigate(`/field-visits/${selectedId}`, {
      replace: true,
    });
  };

  const { data: customerProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["customer-profile", applicationId],
    queryFn: async () => unwrapResponse(await rmApi.getCustomerProfile(applicationId)),
    enabled: !!applicationId,
  });

  const { data: fieldVisitData, isLoading: isVisitsLoading } = useQuery({
    queryKey: ["field-visits", applicationId],
    queryFn: async () => unwrapResponse(await rmApi.getFieldVisits(applicationId)),
    enabled: !!applicationId,
  });

  const propertyCategory = useMemo(() => {
    return normalizePropertyCategory(customerProfile?.propertyCategory ?? fieldVisitData?.propertyCategory);
  }, [customerProfile, fieldVisitData]);

  const visitBlocks = useMemo(() => {
    return propertyCategory ? VISIT_BLOCKS_BY_PROPERTY_CATEGORY[propertyCategory] || [] : [];
  }, [propertyCategory]);

  const { data: fieldVisitDocumentData } = useQuery({
    queryKey: ["field-visit-documents", applicationId],
    queryFn: async () => unwrapResponse(await rmApi.getFieldVisitDocuments(applicationId)),
    enabled: !!applicationId,
  });

  const fieldVisitDocuments = useMemo(() => {
    if (!fieldVisitDocumentData) return [];
    return Array.isArray(fieldVisitDocumentData) ? fieldVisitDocumentData : fieldVisitDocumentData?.documents || [];
  }, [fieldVisitDocumentData]);

  const documentsByBlock = useMemo(() => {
    const grouped = {};
    for (const b of visitBlocks) grouped[b] = [];
    for (const doc of fieldVisitDocuments) {
      const b = getDocumentBlock(doc);
      if (b && grouped[b]) grouped[b].push(doc);
    }
    return grouped;
  }, [fieldVisitDocuments, visitBlocks]);

  const { data: workflowData, isLoading: isWorkflowLoading } = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: async () => unwrapResponse(await rmApi.workflowStatus(applicationId)),
    enabled: !!applicationId,
  });

  const leadJourney = buildWorkflowTimeline(workflowData || {});
  const workflowStatus = workflowData?.data?.data ?? {};

  /* --- COMPUTED BLOCKS FOR SEQUENTIAL ACCORDION FLOW --- */
  const savedBlocks = useMemo(() => {
    const activeSet = new Set();

    // 1. Properly isolate the array of completed elements from response payload
    const actualSavedVisits = Array.isArray(fieldVisitData)
      ? fieldVisitData
      : fieldVisitData?.visits || [];

    // 2. Strict Check: Customer Residence (must match API string exactly)
    const hasCustomerVisitData = actualSavedVisits.some(
      (v) => String(v?.visitType).toUpperCase() === "CUSTOMER_RESIDENCE"
    );
    if (workflowStatus.customerVisit || hasCustomerVisitData) {
      activeSet.add(VISIT_BLOCKS.CUSTOMER_RESIDENCE);
    }

    // 3. Strict Check: Business Office (must match API string exactly)
    const hasBusinessVisitData = actualSavedVisits.some(
      (v) => String(v?.visitType).toUpperCase() === "BUSINESS_OFFICE"
    );
    if (workflowStatus.businessVisit || hasBusinessVisitData) {
      activeSet.add(VISIT_BLOCKS.BUSINESS_OFFICE);
    }

    // 4. Strict Check: Asset Property Visit types
    const hasPropertyVisitData = actualSavedVisits.some((v) => {
      const type = String(v?.visitType).toUpperCase();
      return type !== "CUSTOMER_RESIDENCE" && type !== "BUSINESS_OFFICE" && type !== "UNDEFINED";
    });

    if (workflowStatus.propertyVisit || hasPropertyVisitData) {
      visitBlocks.forEach(b => {
        if (b !== VISIT_BLOCKS.CUSTOMER_RESIDENCE && b !== VISIT_BLOCKS.BUSINESS_OFFICE) {
          activeSet.add(b);
        }
      });
    }

    return activeSet;
  }, [workflowStatus, visitBlocks, fieldVisitData]);



  useEffect(() => {
    if (!customerProfile || !propertyCategory || isVisitsLoading) return;
    if (initializedApplicationRef.current === String(applicationId)) return;

    const saved = Array.isArray(fieldVisitData) ? fieldVisitData : fieldVisitData?.visits || [];
    setVisitForms(mergeSavedVisits(createInitialVisitForms(customerProfile, propertyCategory), saved));
    setSelectedPhotos(visitBlocks.reduce((res, b) => ({ ...res, [b]: [] }), {}));
    initializedApplicationRef.current = String(applicationId);
  }, [applicationId, customerProfile, propertyCategory, fieldVisitData, visitBlocks, isVisitsLoading]);

  const deleteDocumentMutation = useMutation({
    mutationFn: ({ documentId }) => rmApi.deleteFieldVisitDocument(applicationId, documentId),
    onSuccess: () => {
      setMessage({ type: "success", text: "Photo removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["field-visit-documents", applicationId] });
    },
  });

  const saveVisitMutation = useMutation({
    mutationFn: async (block) => {
      const files = selectedPhotos[block] || [];
      const configuredNames = DOCUMENT_NAMES[block] || [];
      const usedNames = new Set((documentsByBlock[block] || []).map(d => d.documentName));
      const slots = configuredNames.filter((name) => !usedNames.has(name));

      for (let i = 0; i < files.length; i++) {
        const documentName =
          slots[i] ||
          `${API_VISIT_TYPES[block]}_${isValuation ? "VALUATION_REVISIT" : "EXTRA"}_${Date.now()}_${i + 1}`;

        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("visitType", API_VISIT_TYPES[block]);
        formData.append("documentType", "PHOTO");
        formData.append("documentSource", "FIELD_VISIT");
        formData.append("documentName", documentName);

        await rmApi.uploadFieldVisitDocument(applicationId, formData);
      }

      setSelectedPhotos(curr => ({ ...curr, [block]: [] }));
      const loc = await getBrowserLocation();
      const form = visitForms[block];
      const { visitDate, visitResult, remarks, propertyType, ...formData } = form;

      const payload = {
        propertyCategory,
        visit: {
          visitType: API_VISIT_TYPES[block],
          visitDate,
          visitResult,
          remarks,
          propertyType: propertyType ?? null,
          formData,
          ...(loc || {}),
        },
      };
      return rmApi.saveFieldVisit(applicationId, payload);
    },
    onSuccess: async (response, savedBlock) => {
      setMessage({
        type: "success",
        text: "Visit saved successfully.",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["field-visits", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["field-visit-documents", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application", applicationId],
        }),
      ]);

      const result = unwrapResponse(response);
      const data = result?.data ?? result;

      const isPropertyVisit =
        savedBlock !== VISIT_BLOCKS.CUSTOMER_RESIDENCE &&
        savedBlock !== VISIT_BLOCKS.BUSINESS_OFFICE;

      // if (data?.geoVerificationReady || isPropertyVisit) {
      //   navigate(data?.nextRoute || `/geo-verification/${applicationId}`, {
      //     replace: true,
      //   });
      // }

      if (!isValuation && (data?.geoVerificationReady || isPropertyVisit)) {
        navigate(data?.nextRoute || `/geo-verification/${applicationId}`, {
          replace: true,
        });
      }
    },
  });

  // const handleContinueJourney = () => {
  //   if (!workflowStatus.customerVisit || !workflowStatus.businessVisit || !workflowStatus.propertyVisit) {
  //     setMessage({ type: "error", text: "Complete all verification checkpoints down the chain first." });
  //     return;
  //   }
  //   navigate(`/geo-verification/${applicationId}`, { replace: true });
  // };

  const isCustomerDone = savedBlocks.has(VISIT_BLOCKS.CUSTOMER_RESIDENCE);
  const isBusinessDone = savedBlocks.has(VISIT_BLOCKS.BUSINESS_OFFICE);

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Upper Presentation Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] to-[#6a11cb] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Field Visits Processing Pipeline
            </h2>

            <p className="mt-1 text-xs text-blue-100">
              Application File ID: {applicationId || "Please select application"}
            </p>

            {selectedApplicationSummary && (
              <p className="mt-1 text-xs font-semibold text-blue-50">
                {selectedApplicationSummary.applicationNumber} ·{" "}
                {selectedApplicationSummary.customerName} ·{" "}
                {selectedApplicationSummary.mobile}
              </p>
            )}
          </div>

          {canSelectApplication && (
            <div className="w-full sm:w-[420px]">
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
                Select Application
              </label>

              <select
                value={applicationId || ""}
                onChange={handleApplicationChange}
                className="h-11 w-full rounded-xl border border-white/20 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-white/20"
              >
                <option value="">
                  {applicationsQuery.isLoading
                    ? "Loading applications..."
                    : "Select application"}
                </option>

                {applicationList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.applicationNumber || `APP-${item.id}`} -{" "}
                    {item.customerName || "No Name"} -{" "}
                    {item.mobile || "No Mobile"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* <button onClick={handleContinueJourney} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-600">
            Continue Journey
          </button> */}
        </div>

        {/* Dynamic Workflow Bar */}
        <div className="mt-6 rounded-2xl bg-white/95 p-4 text-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between overflow-x-auto">
            {isWorkflowLoading ? <div className="text-xs text-slate-400">Syncing status...</div> : leadJourney.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1 text-center relative">
                <div className={`h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center ${step.completed ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {step.completed ? "✓" : index + 1}
                </div>
                <p className="mt-1 text-[11px] font-semibold">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 text-sm font-semibold rounded-2xl border ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          {message.text}
        </div>
      )}

      {!applicationId && (
        <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FaCamera size={22} />
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-slate-800">
            Select application to start visit upload
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-500">
            Select an application from the header dropdown. After selecting, customer,
            business and property visit photo upload sections will load automatically.
          </p>
        </div>
      )}

      {/* Grid Allocation Layout with Structural Control Mapping */}
      {applicationId && (isProfileLoading || isVisitsLoading) ? (
        <div className="py-10 text-center font-bold text-slate-400">
          Loading Configuration Streams...
        </div>
      ) : applicationId ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card Module 1: Customer Residence */}
          {visitBlocks.includes(VISIT_BLOCKS.CUSTOMER_RESIDENCE) && (
            <CustomerResidenceCard
              form={visitForms[VISIT_BLOCKS.CUSTOMER_RESIDENCE] || {}}
              selectedFiles={
                selectedPhotos[VISIT_BLOCKS.CUSTOMER_RESIDENCE] || []
              }
              uploadedDocuments={
                documentsByBlock[VISIT_BLOCKS.CUSTOMER_RESIDENCE] || []
              }
              disabled={saveVisitMutation.isPending}
              allowSavedEdit={isValuation}
              allowExtraPhotos={isValuation}
              onChange={(field, value) =>
                setVisitForms((current) => ({
                  ...current,
                  [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: {
                    ...current[VISIT_BLOCKS.CUSTOMER_RESIDENCE],
                    [field]: value,
                  },
                }))
              }
              onFilesChange={(files) =>
                setSelectedPhotos((current) => ({
                  ...current,
                  [VISIT_BLOCKS.CUSTOMER_RESIDENCE]: files,
                }))
              }
              onDeleteDocument={(documentId) =>
                deleteDocumentMutation.mutate({
                  documentId,
                })
              }
              deletingDocumentId={
                deleteDocumentMutation.variables?.documentId
              }
              onSave={() =>
                saveVisitMutation.mutate(
                  VISIT_BLOCKS.CUSTOMER_RESIDENCE,
                )
              }
              isSaving={
                saveVisitMutation.isPending &&
                saveVisitMutation.variables ===
                  VISIT_BLOCKS.CUSTOMER_RESIDENCE
              }
              saved={isCustomerDone}
              isTranslucent={false}
            />
          )}

          {/* Card Module 2: Business Workspace Verification */}
          {visitBlocks.includes(VISIT_BLOCKS.BUSINESS_OFFICE) && (
            <BusinessOfficeCard
              form={visitForms[VISIT_BLOCKS.BUSINESS_OFFICE] || {}}
              selectedFiles={
                selectedPhotos[VISIT_BLOCKS.BUSINESS_OFFICE] || []
              }
              uploadedDocuments={
                documentsByBlock[VISIT_BLOCKS.BUSINESS_OFFICE] || []
              }
              disabled={
                saveVisitMutation.isPending ||
                (!isValuation && !isCustomerDone)
              }
              allowSavedEdit={isValuation}
              allowExtraPhotos={isValuation}
              onChange={(field, value) =>
                setVisitForms((current) => ({
                  ...current,
                  [VISIT_BLOCKS.BUSINESS_OFFICE]: {
                    ...current[VISIT_BLOCKS.BUSINESS_OFFICE],
                    [field]: value,
                  },
                }))
              }
              onFilesChange={(files) =>
                setSelectedPhotos((current) => ({
                  ...current,
                  [VISIT_BLOCKS.BUSINESS_OFFICE]: files,
                }))
              }
              onDeleteDocument={(documentId) =>
                deleteDocumentMutation.mutate({
                  documentId,
                })
              }
              deletingDocumentId={
                deleteDocumentMutation.variables?.documentId
              }
              onSave={() =>
                saveVisitMutation.mutate(VISIT_BLOCKS.BUSINESS_OFFICE)
              }
              isSaving={
                saveVisitMutation.isPending &&
                saveVisitMutation.variables ===
                  VISIT_BLOCKS.BUSINESS_OFFICE
              }
              saved={isBusinessDone}
              isTranslucent={!isValuation && !isCustomerDone}
            />
          )}

          {/* Card Module 3: Structural Real Estate Assets Verification */}
          {(() => {
            const block = visitBlocks.find(
              (item) =>
                item !== VISIT_BLOCKS.CUSTOMER_RESIDENCE &&
                item !== VISIT_BLOCKS.BUSINESS_OFFICE,
            );

            if (!block) return null;

            return (
              <PropertyVisitCard
                block={block}
                form={visitForms[block] || {}}
                propertyCategory={propertyCategory}
                selectedFiles={selectedPhotos[block] || []}
                uploadedDocuments={documentsByBlock[block] || []}
                disabled={
                  saveVisitMutation.isPending ||
                  (!isValuation && !isBusinessDone)
                }
                allowSavedEdit={isValuation}
                allowExtraPhotos={isValuation}
                onChange={(field, value) =>
                  setVisitForms((current) => ({
                    ...current,
                    [block]: {
                      ...current[block],
                      [field]: value,
                    },
                  }))
                }
                onFilesChange={(files) =>
                  setSelectedPhotos((current) => ({
                    ...current,
                    [block]: files,
                  }))
                }
                onDeleteDocument={(documentId) =>
                  deleteDocumentMutation.mutate({
                    documentId,
                  })
                }
                deletingDocumentId={
                  deleteDocumentMutation.variables?.documentId
                }
                onSave={() => saveVisitMutation.mutate(block)}
                isSaving={
                  saveVisitMutation.isPending &&
                  saveVisitMutation.variables === block
                }
                saved={savedBlocks.has(block)}
                isTranslucent={!isValuation && !isBusinessDone}
              />
            );
          })()}
        </div>
      ) : null}
    </div>
  )
}