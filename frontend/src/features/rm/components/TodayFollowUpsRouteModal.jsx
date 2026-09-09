import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiClock,
  FiCompass,
  FiExternalLink,
  FiX,
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiRefreshCw,
  FiUser,
  FiShield,
  FiLayers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  calculateOptimalRouteSequence,
  getCurrentGPSPosition,
  getLastKnownCoords,
  reverseGeocodeCoords,
} from "../../../utils/geoUtils.js";
import { formatCurrency } from "../rmUtils.js";

// Custom Leaflet Icons Generator
const createStartIcon = () =>
  L.divIcon({
    className: "custom-start-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
          📍
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const createStopIcon = (stopNumber, rankLabel) => {
  const colors = [
    { bg: "#2563eb", shadow: "rgba(37, 99, 235, 0.45)", ring: "#1d4ed8" }, // 1: Blue
    { bg: "#7c3aed", shadow: "rgba(124, 58, 237, 0.45)", ring: "#6d28d9" }, // 2: Purple
    { bg: "#ea580c", shadow: "rgba(234, 88, 12, 0.45)", ring: "#c2410c" },  // 3: Orange
    { bg: "#0d9488", shadow: "rgba(13, 148, 136, 0.45)", ring: "#0f766e" }, // 4+: Teal
  ];
  const c = colors[(stopNumber - 1) % colors.length];

  return L.divIcon({
    className: `custom-stop-marker-${stopNumber}`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="padding: 2px 7px; border-radius: 9999px; background: #0f172a; color: white; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.2);">
          #${stopNumber} ${rankLabel}
        </div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${c.bg}; border: 3px solid #ffffff; box-shadow: 0 4px 12px ${c.shadow}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 13px;">
          ${stopNumber}
        </div>
      </div>
    `,
    iconSize: [80, 56],
    iconAnchor: [40, 56],
  });
};

export default function TodayFollowUpsRouteModal({
  isOpen,
  onClose,
  todayLeads = [],
  currentCoords = null,
  userName = "RM",
  spokeLocation = "",
}) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [loadingRoute, setLoadingRoute] = useState(true);
  const [routePlan, setRoutePlan] = useState(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const [userGps, setUserGps] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Resolve starting GPS location
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function initGps() {
      if (currentCoords?.latitude && currentCoords?.longitude) {
        if (isMounted) {
          setUserGps({
            latitude: Number(currentCoords.latitude),
            longitude: Number(currentCoords.longitude),
            name: `${userName} (Live Location)`,
          });
        }
        return;
      }

      const cached = getLastKnownCoords();
      if (cached && isMounted) {
        setUserGps({
          latitude: Number(cached.latitude),
          longitude: Number(cached.longitude),
          name: `${userName} (Cached Location)`,
        });
      }

      try {
        const fresh = await getCurrentGPSPosition(6000);
        if (isMounted && fresh) {
          const addr = await reverseGeocodeCoords(fresh.latitude, fresh.longitude);
          setUserGps({
            latitude: Number(fresh.latitude),
            longitude: Number(fresh.longitude),
            name: `${userName} (Current Position)`,
            address: addr || spokeLocation || "Live Position",
          });
        }
      } catch (err) {
        console.warn("Could not get high-accuracy GPS for route planner:", err);
        if (isMounted && !userGps) {
          setUserGps({
            latitude: 19.0760, // Default Mumbai / fallback
            longitude: 72.8777,
            name: `${userName} (Spoke Area)`,
            address: spokeLocation || "Spoke Branch",
          });
        }
      }
    }

    initGps();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentCoords, userName, spokeLocation, refreshTrigger]);

  // 2. Compute Nearest-Neighbor Route Optimization
  useEffect(() => {
    if (!isOpen || !userGps || todayLeads.length === 0) {
      if (todayLeads.length === 0) setLoadingRoute(false);
      return;
    }

    let isCancelled = false;
    async function calculatePlan() {
      setLoadingRoute(true);
      try {
        const plan = await calculateOptimalRouteSequence(userGps, todayLeads);
        if (!isCancelled) {
          setRoutePlan(plan);
          setSelectedStopIndex(0);
        }
      } catch (err) {
        console.error("Route calculation error:", err);
      } finally {
        if (!isCancelled) setLoadingRoute(false);
      }
    }

    calculatePlan();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, userGps, todayLeads, refreshTrigger]);

  // 3. Render Leaflet Map
  useEffect(() => {
    if (!isOpen || !routePlan || !mapContainerRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // Clean OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const boundsGroup = [];

      // 1. Add Starting RM Marker
      const startPt = routePlan.startPoint;
      if (startPt && startPt.lat && startPt.lng) {
        const startMarker = L.marker([startPt.lat, startPt.lng], {
          icon: createStartIcon(),
        }).addTo(map);

        startMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <b style="color: #059669; font-size: 13px;">🟢 Start Location (RM Live)</b><br/>
            <span>${startPt.customerName || "Your Location"}</span><br/>
            <span style="color: #64748b;">${startPt.address || ""}</span>
          </div>
        `);
        boundsGroup.push([startPt.lat, startPt.lng]);
      }

      // 2. Add Stop Markers
      routePlan.orderedStops.forEach((stop, index) => {
        const stopMarker = L.marker([stop.lat, stop.lng], {
          icon: createStopIcon(stop.stopNumber, stop.sequenceRankLabel),
        }).addTo(map);

        stopMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                Stop #${stop.stopNumber} (${stop.sequenceRankLabel})
              </span>
              <span style="color: #64748b; font-size: 11px;">${stop.distanceFromPrevKm} km away</span>
            </div>
            <b style="font-size: 14px; color: #0f172a;">${stop.customerName}</b><br/>
            <span style="color: #475569;">📞 ${stop.mobile}</span><br/>
            <span style="color: #64748b; font-size: 11px;">📍 ${stop.address}</span><br/>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #334155;">
              <b>Follow-up Time:</b> ${stop.followUpTime}<br/>
              <b>Purpose:</b> ${stop.followUpNotes || "Verification / Site Visit"}
            </div>
          </div>
        `);

        stopMarker.on("click", () => {
          setSelectedStopIndex(index);
        });

        boundsGroup.push([stop.lat, stop.lng]);
      });

      // 3. Draw Road Polyline
      if (routePlan.routePolyline && routePlan.routePolyline.length > 1) {
        // Shadow/glow line
        L.polyline(routePlan.routePolyline, {
          color: "#3b82f6",
          weight: 7,
          opacity: 0.35,
        }).addTo(map);

        // Main polyline
        L.polyline(routePlan.routePolyline, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.95,
          dashArray: "1, 8",
          lineCap: "round",
        }).addTo(map);
      }

      // Fit map bounds with padding
      if (boundsGroup.length > 0) {
        map.fitBounds(boundsGroup, { padding: [40, 40], maxZoom: 15 });
      }
    } catch (err) {
      console.error("Leaflet initialization error:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, routePlan]);

  // Focus map on selected stop
  const handleSelectStop = (index) => {
    setSelectedStopIndex(index);
    if (!mapInstanceRef.current || !routePlan?.orderedStops?.[index]) return;
    const stop = routePlan.orderedStops[index];
    mapInstanceRef.current.flyTo([stop.lat, stop.lng], 15, { duration: 1 });
  };

  const handleOpenGoogleMapsRoute = (stop) => {
    if (!stop || !userGps) return;
    const origin = `${userGps.latitude},${userGps.longitude}`;
    const destination = `${stop.lat},${stop.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenEntireRouteGoogleMaps = () => {
    if (!routePlan || !routePlan.orderedStops.length || !userGps) return;
    const origin = `${userGps.latitude},${userGps.longitude}`;
    const stops = routePlan.orderedStops;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
    const waypoints = stops
      .slice(0, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join("|");

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Modal Top Header */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 px-6 py-4 text-white shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md shadow-inner">
              <FiCompass className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Today's Follow-Up Route Planner
                </h2>
                <span className="rounded-full bg-emerald-400/30 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-100 ring-1 ring-emerald-400/40">
                  {todayLeads.length} Scheduled Today
                </span>
              </div>
              <p className="text-xs font-medium text-blue-100">
                Optimized route by nearest locations starting from your live location.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              title="Recalculate GPS Route"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/25"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${loadingRoute ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/90 px-6 py-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-black">
              📍
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Stops</div>
              <div className="font-extrabold text-slate-900">{todayLeads.length} Leads</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-200 px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-black">
              🛣️
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Est. Total Route</div>
              <div className="font-extrabold text-slate-900">
                {routePlan ? `${routePlan.totalDistanceKm} km` : "Calculating..."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-200 px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-black">
              ⏱️
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Drive Time</div>
              <div className="font-extrabold text-slate-900">
                {routePlan ? `~${routePlan.totalDurationMin} mins` : "Calculating..."}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pl-4">
            <button
              type="button"
              onClick={handleOpenEntireRouteGoogleMaps}
              disabled={!routePlan || !routePlan.orderedStops.length}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <FiNavigation className="h-3.5 w-3.5" />
              <span>Full Route in Google Maps</span>
            </button>
          </div>
        </div>

        {/* Main Body: Split Map & Itinerary */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Column: Itinerary Sequence List */}
          <div className="flex flex-col border-r border-slate-200 bg-white lg:col-span-5 xl:col-span-5 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Sequential Visit Plan (Nearest First)
              </span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Traveling Salesman Optimized
              </span>
            </div>

            {loadingRoute ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <FiRefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-bold text-slate-700">Analyzing GPS and calculating nearest sequence...</p>
                <p className="text-xs text-slate-400 mt-1">Measuring road distances to each follow-up address.</p>
              </div>
            ) : !routePlan || routePlan.orderedStops.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <FiCalendar className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No follow-ups scheduled for today</p>
                <p className="text-xs text-slate-400 mt-1">Leads with today's follow-up date will appear here automatically.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Starting Point Banner */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-start gap-3 shadow-2xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm">
                    START
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900">
                        {routePlan.startPoint.customerName}
                      </span>
                      <span className="rounded bg-emerald-200/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Origin
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/80 truncate mt-0.5">
                      {routePlan.startPoint.address}
                    </p>
                  </div>
                </div>

                {/* Ordered Stops List */}
                {routePlan.orderedStops.map((stop, index) => {
                  const isSelected = selectedStopIndex === index;
                  return (
                    <div
                      key={stop.leadId}
                      onClick={() => handleSelectStop(index)}
                      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Top Row: Rank Badge + Distance */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${
                              stop.stopNumber === 1
                                ? "bg-blue-600"
                                : stop.stopNumber === 2
                                ? "bg-purple-600"
                                : stop.stopNumber === 3
                                ? "bg-orange-600"
                                : "bg-teal-600"
                            }`}
                          >
                            {stop.stopNumber}
                          </span>
                          <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white">
                            {stop.sequenceRankLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <FiNavigation className="text-blue-600 h-3 w-3" />
                          <span>{stop.distanceFromPrevKm} km</span>
                          <span className="text-slate-400 font-normal">({stop.estDriveMin}m)</span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {stop.customerName}
                          </h4>
                          <span className="text-xs font-bold text-slate-500">
                            {stop.applicationNumber}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                          <FiMapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span>{stop.address}</span>
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1.5 text-slate-500">
                          <span>
                            Amount: <b className="text-slate-800">{formatCurrency(stop.requestedAmount)}</b>
                          </span>
                          <span className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                            <FiClock className="h-3 w-3" />
                            {stop.followUpTime}
                          </span>
                        </div>

                        {stop.followUpNotes && (
                          <div className="mt-2 rounded-lg bg-slate-100/80 p-2 text-[11px] text-slate-700 font-medium">
                            <b>Note:</b> {stop.followUpNotes}
                          </div>
                        )}
                      </div>

                      {/* Action Button Row */}
                      <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
                        {stop.mobile && stop.mobile !== "-" && (
                          <a
                            href={`tel:${stop.mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                          >
                            <FiPhone className="h-3 w-3" />
                            Call
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGoogleMapsRoute(stop);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
                        >
                          <FiNavigation className="h-3 w-3" />
                          Navigate
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            navigate(`/create-lead/${stop.leadId}`);
                          }}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
                          title="Open Lead Workspace"
                        >
                          <FiExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Leaflet Map */}
          <div className="relative flex flex-col lg:col-span-7 xl:col-span-7 h-full bg-slate-100">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="h-full w-full z-10" />

            {/* Floating Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-white/95 p-3.5 shadow-xl backdrop-blur-md border border-slate-200 text-xs text-slate-800 space-y-1.5 hidden sm:block">
              <div className="font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                <FiLayers className="text-blue-600" />
                Route Sequence Legend
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-600 inline-block ring-2 ring-emerald-200" />
                <span>Start Point (Live RM Location)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-600 inline-block ring-2 ring-blue-200" />
                <span>Stop 1 (1st Nearest)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-600 inline-block ring-2 ring-purple-200" />
                <span>Stop 2 (2nd Nearest)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-600 inline-block ring-2 ring-orange-200" />
                <span>Stop 3 (3rd Nearest)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FiShield className="text-blue-600" />
            <span>Smart Follow-up Route Engine with GPS Tracking</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
          >
            Close Route Planner
          </button>
        </div>
      </div>
    </div>
  );
}
