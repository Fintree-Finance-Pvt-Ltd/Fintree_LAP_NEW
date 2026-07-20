import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth.js";

import { rmApi } from "../rmApi.js";
import { workflowStepsConfig } from "../rmUtils.js";

const createEmptyGeoData = () => ({
  residence: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    status: "Pending",
  },
  business: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    status: "Pending",
  },
  property: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    distanceSpoke: "",
    mismatch: "No",
    status: "Pending",
  },
});

const LOCATION_TYPE_MAP = {
  residence: "RESIDENCE",
  business: "BUSINESS",
  property: "PROPERTY",
};

const TAB_FROM_LOCATION_TYPE = {
  RESIDENCE: "residence",
  BUSINESS: "business",
  PROPERTY: "property",
};

const GEO_TABS = [
  {
    key: "residence",
    label: "Residence Geo",
  },
  {
    key: "business",
    label: "Business Geo",
  },
  {
    key: "property",
    label: "Property Geo",
  },
];

const unwrapResponse = (response) =>
  response?.data !== undefined ? response.data : response ?? {};

function unwrapApplicationList(response) {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function normalizeRoles(user) {
  const roles = user?.roles;

  if (!roles) return [];

  return Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase())
    : [String(roles).toUpperCase()];
}

const formatCapturedAt = (value) => {
  if (!value) return "Not captured";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not captured"
    : date.toLocaleString();
};

const getLocationErrorMessage = (error) => {
  switch (error?.code) {
    case 1:
      return "Location permission denied. Please allow location access in your browser.";
    case 2:
      return "Your current location is unavailable.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to capture your current location.";
  }
};

const isGeoVerified = (item) => {
  return (
    item?.status === "Verified" &&
    item?.lat !== "" &&
    item?.lng !== "" &&
    Number.isFinite(Number(item?.lat)) &&
    Number.isFinite(Number(item?.lng))
  );
};

const isAllGeoVerified = (data) => {
  return (
    isGeoVerified(data.residence) &&
    isGeoVerified(data.business) &&
    isGeoVerified(data.property)
  );
};

function GeoField({ label, value, placeholder = "—" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

export default function GeoVerification() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const applicationId =
    params.applicationId ||
    params.id ||
    params.appId ||
    "";

  const { user } = useAuth();

  const roles = normalizeRoles(user);

  const isRM = roles.includes("RM");

  const isValuation =
    roles.includes("VALUATION") ||
    roles.includes("VALUTION");

  const canSelectApplication = isRM || isValuation;

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [activeTab, setActiveTab] = useState("residence");
  const [geoData, setGeoData] = useState(createEmptyGeoData);
  const [capturingLocationType, setCapturingLocationType] =
    useState("");

  const numericApplicationId = Number(applicationId);

  const applicationsQuery = useQuery({
    queryKey: ["geo-application-list", roles.join("_")],
    queryFn: async () =>
      rmApi.applications({
        page: 1,
        limit: 200,
      }),
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
          status === "VALUATION_QUERY" ||
          status === "LEGAL_PENDING"
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

    setMessage("");
    setGeoData(createEmptyGeoData());
    setActiveTab("residence");

    if (!selectedId) {
      navigate("/geo-verification", {
        replace: true,
      });
      return;
    }

    navigate(`/geo-verification/${selectedId}`, {
      replace: true,
    });
  };

  useEffect(() => {
    setMessage("");
    setGeoData(createEmptyGeoData());
    setActiveTab("residence");
  }, [applicationId]);

  const workflowData = useQuery({
    queryKey: ["rm-workflow-status", applicationId],
    queryFn: () => rmApi.workflowStatus(applicationId),
    enabled: Boolean(applicationId),
  });

  const workflowResponse = unwrapResponse(workflowData.data);
  const apiWorkflowFlags =
    workflowResponse?.data ?? workflowResponse ?? {};

  const geoPrerequisitesMet =
    !Boolean(applicationId) ||
    (Boolean(apiWorkflowFlags.customerVisit) &&
      Boolean(apiWorkflowFlags.businessVisit));

  const geoBlocked =
    !isValuation &&
    Boolean(applicationId) &&
    workflowData.isSuccess &&
    !geoPrerequisitesMet;

  const geoLocationsQuery = useQuery({
    queryKey: ["application-geo-locations", applicationId],
    queryFn: () => rmApi.getGeoLocations(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  });

  useEffect(() => {
    if (!geoLocationsQuery.data) return;

    const response = unwrapResponse(geoLocationsQuery.data);
    const locations = response?.data ?? response;

    if (!Array.isArray(locations)) return;

    setGeoData((previous) => {
      const updated = {
        ...previous,
        residence: {
          ...previous.residence,
        },
        business: {
          ...previous.business,
        },
        property: {
          ...previous.property,
        },
      };

      locations.forEach((location) => {
        const tabKey =
          TAB_FROM_LOCATION_TYPE[
            String(location.locationType || "").toUpperCase()
          ];

        if (!tabKey) return;

        updated[tabKey] = {
          ...updated[tabKey],
          lat:
            location.latitude != null
              ? String(location.latitude)
              : "",
          lng:
            location.longitude != null
              ? String(location.longitude)
              : "",
          gpsAddress: location.gpsAddress || "",
          accuracyMeters:
            location.accuracyMeters != null
              ? String(location.accuracyMeters)
              : "",
          capturedAt: location.capturedAt || "",
          status: "Verified",
        };
      });

      return updated;
    });
  }, [geoLocationsQuery.data]);

  const markGeoComplete = useMutation({
    mutationFn: async () =>
      rmApi.recordWorkflowStep(applicationId, {
        action: "GEO_VERIFICATION_DONE",
        remarks:
          "Residence, business and property geo verification completed.",
      }),

    onSuccess: async () => {
      setMessageType("success");
      setMessage(
        isValuation
          ? "Geo verification updated successfully."
          : "Geo verification completed. Redirecting to KYC documents...",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow-status", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application-geo-locations", applicationId],
        }),
      ]);

      if (!isValuation) {
        navigate(`/kyc-documents/${applicationId}`, {
          replace: true,
        });
      }
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to complete geo verification.";

      setMessageType("error");
      setMessage(
        Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      );
    },
  });

  const saveGeoLocationMutation = useMutation({
    mutationFn: ({ payload }) =>
      rmApi.saveGeoLocation(applicationId, payload),

    onSuccess: async (response, variables) => {
      const result = unwrapResponse(response);
      const saved = result?.data ?? result;
      const locationKey = variables.locationKey;

      const nextGeoData = {
        ...geoData,
        [locationKey]: {
          ...geoData[locationKey],
          lat:
            saved?.latitude != null
              ? String(saved.latitude)
              : "",
          lng:
            saved?.longitude != null
              ? String(saved.longitude)
              : "",
          gpsAddress: saved?.gpsAddress || "",
          accuracyMeters:
            saved?.accuracyMeters != null
              ? String(saved.accuracyMeters)
              : "",
          capturedAt: saved?.capturedAt || new Date().toISOString(),
          status: "Verified",
        },
      };

      setGeoData(nextGeoData);

      setMessageType("success");
      setMessage(
        result?.message || "Live location captured successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["application-geo-locations", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow-status", applicationId],
        }),
      ]);

      if (locationKey === "residence") {
        setActiveTab("business");
        return;
      }

      if (locationKey === "business") {
        setActiveTab("property");
        return;
      }

      if (
        locationKey === "property" &&
        isAllGeoVerified(nextGeoData)
      ) {
        markGeoComplete.mutate();
      }
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to store live location.";

      setMessageType("error");
      setMessage(
        Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      );
    },

    onSettled: () => setCapturingLocationType(""),
  });

  const handleCaptureLiveLocation = () => {
    if (
      !Number.isInteger(numericApplicationId) ||
      numericApplicationId <= 0
    ) {
      setMessageType("error");
      setMessage(
        "A valid application ID is required before capturing location.",
      );
      return;
    }

    if (!navigator.geolocation) {
      setMessageType("error");
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    const locationKey = activeTab;
    const locationType = LOCATION_TYPE_MAP[locationKey];

    if (!locationType) return;

    setCapturingLocationType(locationKey);
    setMessageType("success");
    setMessage(`Capturing ${locationKey} live location...`);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } =
          position.coords;

        const coordinateAddress = `Latitude ${latitude.toFixed(
          7,
        )}, Longitude ${longitude.toFixed(7)}`;

        saveGeoLocationMutation.mutate({
          locationKey,
          payload: {
            locationType,
            latitude,
            longitude,
            accuracyMeters: accuracy,
            gpsAddress: coordinateAddress,
          },
        });
      },
      (error) => {
        setCapturingLocationType("");
        setMessageType("error");
        setMessage(getLocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  };

  const selectedGeoData =
    geoData[activeTab] || geoData.residence;

  const hasSelectedCoordinates =
    selectedGeoData?.lat !== "" &&
    selectedGeoData?.lng !== "" &&
    Number.isFinite(Number(selectedGeoData?.lat)) &&
    Number.isFinite(Number(selectedGeoData?.lng));

  const handleOpenGoogleMaps = () => {
    if (!hasSelectedCoordinates) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${selectedGeoData.lat},${selectedGeoData.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const currentTabLabel =
    GEO_TABS.find((tab) => tab.key === activeTab)?.label ||
    "Geo";

  const isCapturing =
    Boolean(capturingLocationType) ||
    saveGeoLocationMutation.isPending;

  let contextActiveFound = false;

  const processedSteps = workflowStepsConfig.map((step, idx) => {
    const isCompleted = Boolean(apiWorkflowFlags[step.key]);

    let isActive = false;

    if (!isCompleted && !contextActiveFound) {
      isActive = true;
      contextActiveFound = true;
    }

    return {
      ...step,
      isCompleted,
      isActive,
      displayIndex: idx + 1,
    };
  });

  if (geoBlocked) {
    return <Navigate to="/customer-visit" replace />;
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 text-slate-800 antialiased md:p-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Geo Verification
            </h2>

            <p className="mt-1 text-xs font-medium text-blue-100/90">
              Application #
              {applicationId || "Please select application"} •
              Real-time field parameter checks.
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
            <div className="w-full xl:w-[420px]">
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCaptureLiveLocation}
              disabled={!applicationId || isCapturing}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50"
            >
              {capturingLocationType === activeTab
                ? "Capturing..."
                : `Capture ${currentTabLabel}`}
            </button>

            <button
              type="button"
              disabled={
                !applicationId ||
                markGeoComplete.isPending ||
                !isAllGeoVerified(geoData)
              }
              onClick={() => markGeoComplete.mutate()}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              {markGeoComplete.isPending
                ? "Saving..."
                : isValuation
                  ? "Save Geo Verification"
                  : "Proceed to KYC Documents"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            messageType === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-rose-100 bg-rose-50 text-rose-800"
          }`}
        >
          {message}
        </div>
      )}

      {!applicationId && (
        <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
            📍
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-slate-800">
            Select application to load geo verification
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-500">
            Select an application from the header dropdown. Residence,
            business and property geo verification data will load
            automatically.
          </p>
        </div>
      )}

      {applicationId && (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Application Journey
                </h3>

                <p className="text-sm font-extrabold text-slate-800">
                  Pipeline Tracking ID:{" "}
                  <span className="text-blue-600">
                    #{applicationId || "Unselected"}
                  </span>
                </p>
              </div>

              {workflowData.isFetching && (
                <span className="inline-flex animate-pulse items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Syncing milestones...
                </span>
              )}
            </div>

            <div className="scrollbar-none relative flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2">
              {processedSteps.map((step, idx) => (
                <div
                  key={step.key}
                  className="flex min-w-[125px] flex-1 items-center"
                >
                  <div className="group flex flex-1 flex-col items-center text-center">
                    <div
                      className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                        step.isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-100"
                          : step.isActive
                            ? "border-blue-600 bg-blue-600 font-black text-white ring-4 ring-blue-50"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {step.isCompleted ? (
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
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <span
                      className={`mt-2.5 max-w-[115px] truncate text-[11px] font-bold tracking-tight transition-colors ${
                        step.isCompleted
                          ? "text-emerald-600"
                          : step.isActive
                            ? "font-extrabold text-blue-600"
                            : "font-medium text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {idx < processedSteps.length - 1 && (
                    <div className="mx-2 mt-[-20px] h-[3px] min-w-[30px] flex-1 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          step.isCompleted
                            ? "w-full bg-emerald-500"
                            : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 pt-4">
              <div className="flex gap-2 overflow-x-auto">
                {GEO_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const isVerified =
                    geoData[tab.key]?.status === "Verified";

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center gap-2 whitespace-nowrap rounded-t-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wide transition-all ${
                        isActive
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isVerified
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />

                      {isActive && (
                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {currentTabLabel} Details
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Capture the system geolocation coordinates for
                    verification checks.
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    selectedGeoData.status === "Verified"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {selectedGeoData.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <GeoField
                  label="Latitude"
                  value={selectedGeoData.lat}
                />

                <GeoField
                  label="Longitude"
                  value={selectedGeoData.lng}
                />

                <GeoField
                  label="Accuracy"
                  value={
                    selectedGeoData.accuracyMeters
                      ? `${selectedGeoData.accuracyMeters} meters`
                      : ""
                  }
                />

                <GeoField
                  label="Captured At"
                  value={
                    selectedGeoData.capturedAt
                      ? formatCapturedAt(selectedGeoData.capturedAt)
                      : ""
                  }
                />

                <div className="md:col-span-2">
                  <GeoField
                    label="GPS Location Address"
                    value={selectedGeoData.gpsAddress}
                  />
                </div>

                {activeTab === "property" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Distance from Spoke (KM)
                      </label>

                      <input
                        type="number"
                        value={geoData.property.distanceSpoke}
                        onChange={(event) =>
                          setGeoData((previous) => ({
                            ...previous,
                            property: {
                              ...previous.property,
                              distanceSpoke: event.target.value,
                            },
                          }))
                        }
                        placeholder="Enter distance"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Distance Mismatch
                      </label>

                      <select
                        value={geoData.property.mismatch}
                        onChange={(event) =>
                          setGeoData((previous) => ({
                            ...previous,
                            property: {
                              ...previous.property,
                              mismatch: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Mapping Preview
                </h3>
              </div>

              <div className="relative flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                {hasSelectedCoordinates ? (
                  <>
                    <div className="absolute right-4 top-4 h-3 w-3 animate-ping rounded-full bg-rose-500" />

                    <h4 className="max-w-md text-sm font-bold text-slate-800">
                      {selectedGeoData.gpsAddress}
                    </h4>

                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {selectedGeoData.lat}, {selectedGeoData.lng}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-600">
                      No Location Registered
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Please capture data using the browser action
                      handlers above.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  disabled={!hasSelectedCoordinates}
                  className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Open Live External Map
                  <FaExternalLinkAlt size={10} />
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Geo Summary
                  </h3>
                </div>

                <div className="space-y-3 pt-1 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Target Node</span>
                    <span className="font-bold text-slate-800">
                      {currentTabLabel}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Verification State</span>

                    <span
                      className={`font-bold ${
                        selectedGeoData.status === "Verified"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {selectedGeoData.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold uppercase text-white shadow-md hover:brightness-105"
              >
                Request Pipeline Geo Exception
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}