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
  FiCornerDownRight,
  FiInfo,
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

const createStationIcon = (stationName, isDestination = false) =>
  L.divIcon({
    className: `custom-station-marker-${stationName}`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="padding: 2px 6px; border-radius: 6px; background: ${
          isDestination ? "#b91c1c" : "#6d28d9"
        }; color: white; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35); margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.3);">
          🚆 ${stationName} Stn
        </div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${
          isDestination ? "#ef4444" : "#8b5cf6"
        }; border: 2.5px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
          🚉
        </div>
      </div>
    `,
    iconSize: [90, 50],
    iconAnchor: [45, 50],
  });

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

  const [travelMode, setTravelMode] = useState("DRIVING"); // "DRIVING" | "TRANSIT"
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
            latitude: 19.076, // Default Mumbai / fallback
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
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 190px;">
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
            ${
              stop.trainTransit?.destStation
                ? `<div style="margin-top: 4px; background: #f5f3ff; color: #6d28d9; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                     🚆 Nearest Stn: ${stop.trainTransit.destStation.name} (${stop.trainTransit.destStation.line})
                   </div>`
                : ""
            }
          </div>
        `);

        stopMarker.on("click", () => {
          setSelectedStopIndex(index);
        });

        boundsGroup.push([stop.lat, stop.lng]);
      });

      // 3. Render Route Polylines based on Travel Mode
      if (travelMode === "DRIVING") {
        if (routePlan.routePolyline && routePlan.routePolyline.length > 1) {
          // Shadow/glow line
          L.polyline(routePlan.routePolyline, {
            color: "#3b82f6",
            weight: 7,
            opacity: 0.35,
          }).addTo(map);

          // Main road polyline
          L.polyline(routePlan.routePolyline, {
            color: "#2563eb",
            weight: 4,
            opacity: 0.95,
            dashArray: "1, 8",
            lineCap: "round",
          }).addTo(map);
        }
      } else if (travelMode === "TRANSIT") {
        // Draw railway stations & transit lines for stops
        routePlan.orderedStops.forEach((stop) => {
          const transit = stop.trainTransit;
          if (transit && transit.startStation && transit.destStation) {
            // Start Station Marker
            const startStnMarker = L.marker([transit.startStation.lat, transit.startStation.lng], {
              icon: createStationIcon(transit.startStation.name, false),
            }).addTo(map);
            startStnMarker.bindPopup(`<b>Boarding Station:</b> ${transit.startStation.name}<br/>Line: ${transit.startStation.line}`);
            boundsGroup.push([transit.startStation.lat, transit.startStation.lng]);

            // Destination Station Marker
            const destStnMarker = L.marker([transit.destStation.lat, transit.destStation.lng], {
              icon: createStationIcon(transit.destStation.name, true),
            }).addTo(map);
            destStnMarker.bindPopup(`<b>Destination Station:</b> ${transit.destStation.name}<br/>Line: ${transit.destStation.line}`);
            boundsGroup.push([transit.destStation.lat, transit.destStation.lng]);

            // First-Mile Leg: Start Point -> Start Station (Dotted green)
            L.polyline(
              [
                [startPt.lat, startPt.lng],
                [transit.startStation.lat, transit.startStation.lng],
              ],
              {
                color: "#10b981",
                weight: 3,
                dashArray: "4, 6",
                opacity: 0.8,
              }
            ).addTo(map);

            // Train Line Track: Start Station -> Destination Station (Purple railway track line)
            L.polyline(
              [
                [transit.startStation.lat, transit.startStation.lng],
                [transit.destStation.lat, transit.destStation.lng],
              ],
              {
                color: "#7c3aed",
                weight: 5,
                opacity: 0.9,
              }
            ).addTo(map);

            // Last-Mile Leg: Dest Station -> Customer Address (Dotted orange)
            L.polyline(
              [
                [transit.destStation.lat, transit.destStation.lng],
                [stop.lat, stop.lng],
              ],
              {
                color: "#ea580c",
                weight: 3,
                dashArray: "4, 6",
                opacity: 0.8,
              }
            ).addTo(map);
          }
        });
      }

      // Fit map bounds with padding
      if (boundsGroup.length > 0) {
        map.fitBounds(boundsGroup, { padding: [45, 45], maxZoom: 14 });
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
  }, [isOpen, routePlan, travelMode]);

  // Focus map on selected stop
  const handleSelectStop = (index) => {
    setSelectedStopIndex(index);
    if (!mapInstanceRef.current || !routePlan?.orderedStops?.[index]) return;
    const stop = routePlan.orderedStops[index];
    mapInstanceRef.current.flyTo([stop.lat, stop.lng], 14, { duration: 1 });
  };

  const handleOpenGoogleMapsRoute = (stop) => {
    if (!stop || !userGps) return;
    const origin = `${userGps.latitude},${userGps.longitude}`;
    const destination = `${stop.lat},${stop.lng}`;
    const mode = travelMode === "TRANSIT" ? "transit" : "driving";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
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
    const mode = travelMode === "TRANSIT" ? "transit" : "driving";

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
    if (waypoints && mode !== "transit") {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  const activeStop = routePlan?.orderedStops?.[selectedStopIndex] || routePlan?.orderedStops?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-2 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
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
                  {todayLeads.length} {todayLeads.length === 1 ? "Lead Scheduled" : "Leads Scheduled"}
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

        {/* Stats Strip & Travel Mode Switcher */}
        <div className="grid grid-cols-2 lg:grid-cols-12 border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 py-2.5 text-xs font-semibold text-slate-700 gap-2 items-center">
          {/* Total Stops */}
          <div className="flex items-center gap-2 pr-2 col-span-1 lg:col-span-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-black">
              📍
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Stops</div>
              <div className="font-extrabold text-slate-900">{todayLeads.length} {todayLeads.length === 1 ? "Lead" : "Leads"}</div>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-2 px-2 col-span-1 lg:col-span-2">
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

          {/* Travel Mode Toggle Button */}
          <div className="col-span-2 lg:col-span-5 flex items-center justify-center sm:justify-start gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTravelMode("DRIVING")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                travelMode === "DRIVING"
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🚗 Road / Drive</span>
              <span className="text-[11px] opacity-80 font-normal">
                ({routePlan ? `~${routePlan.totalDurationMin}m` : "..."})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTravelMode("TRANSIT")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                travelMode === "TRANSIT"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-purple-700"
              }`}
            >
              <span>🚆 Local Train & Transit</span>
              <span className="text-[11px] opacity-90 font-normal">
                ({routePlan ? `~${routePlan.totalTransitTimeMin || routePlan.totalDurationMin}m` : "..."})
              </span>
            </button>
          </div>

          {/* Full Google Maps Button */}
          <div className="col-span-2 lg:col-span-3 flex items-center justify-end">
            <button
              type="button"
              onClick={handleOpenEntireRouteGoogleMaps}
              disabled={!routePlan || !routePlan.orderedStops.length}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                travelMode === "TRANSIT"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <FiNavigation className="h-3.5 w-3.5" />
              <span>{travelMode === "TRANSIT" ? "Train Route in Maps" : "Full Route in Maps"}</span>
            </button>
          </div>
        </div>

        {/* Main Body: Split Map & Itinerary */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Column: Itinerary Sequence List */}
          <div className="flex flex-col border-r border-slate-200 bg-white lg:col-span-5 xl:col-span-5 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                {todayLeads.length === 1 ? "Follow-Up Visit Plan" : "Sequential Visit Plan (Nearest First)"}
              </span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {travelMode === "TRANSIT" ? "Suburban Railway Transit" : "Nearest Neighbor Optimized"}
              </span>
            </div>

            {loadingRoute ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <FiRefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-bold text-slate-700">Analyzing GPS & Customer Address...</p>
                <p className="text-xs text-slate-400 mt-1">Calculating road distances and nearest railway route.</p>
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
                        Origin (Punch In)
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
                  const transit = stop.trainTransit;

                  return (
                    <div
                      key={stop.leadId}
                      onClick={() => handleSelectStop(index)}
                      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/20"
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
                          {travelMode === "TRANSIT" ? (
                            <>
                              <span className="text-purple-600 font-bold">🚆</span>
                              <span>~{transit?.totalTransitTimeMin || stop.estDriveMin}m</span>
                              <span className="text-slate-400 font-normal">transit</span>
                            </>
                          ) : (
                            <>
                              <FiNavigation className="text-blue-600 h-3 w-3" />
                              <span>{stop.distanceFromPrevKm} km</span>
                              <span className="text-slate-400 font-normal">({stop.estDriveMin}m drive)</span>
                            </>
                          )}
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

                        <p className="text-xs text-slate-600 line-clamp-2 flex items-start gap-1">
                          <FiMapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
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

                        {/* Train & Transit Route Recommendation Card */}
                        {travelMode === "TRANSIT" && transit && (
                          <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-purple-200/60 pb-1.5">
                              <span className="font-black text-purple-900 flex items-center gap-1">
                                🚆 Train Route Guide
                              </span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-full">
                                {transit.trainLineName}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-[11px] text-purple-950 font-medium">
                              {/* Step 1: First Mile */}
                              <div className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold shrink-0">1.</span>
                                <div>
                                  <b className="text-slate-900">Reach {transit.startStation.name} Station:</b>{" "}
                                  ~{transit.startStation.distanceKm} km ({transit.firstMileTimeMin}m via Auto/Walk)
                                </div>
                              </div>

                              {/* Step 2: Train Journey */}
                              <div className="flex items-start gap-1.5">
                                <span className="text-purple-700 font-bold shrink-0">2.</span>
                                <div>
                                  <b className="text-purple-900">Board {transit.startStation.line}:</b>{" "}
                                  {transit.startStation.name} ➔ <b className="text-purple-900">{transit.destStation.name}</b> (~{transit.trainTimeMin} mins, {transit.stationDistanceKm} km)
                                </div>
                              </div>

                              {/* Step 3: Last Mile */}
                              <div className="flex items-start gap-1.5">
                                <span className="text-orange-600 font-bold shrink-0">3.</span>
                                <div>
                                  <b className="text-slate-900">{transit.destStation.name} Station (East/West) to Location:</b>{" "}
                                  Take auto ~{transit.destStation.distanceKm} km ({transit.lastMileTimeMin} mins) to customer address.
                                </div>
                              </div>
                            </div>
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
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95 ${
                            travelMode === "TRANSIT"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <FiNavigation className="h-3 w-3" />
                          {travelMode === "TRANSIT" ? "Train Map" : "Navigate"}
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

            {/* Dynamic Floating Legend Overlay */}
            {routePlan && routePlan.orderedStops.length > 0 && (
              <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-white/95 p-3.5 shadow-xl backdrop-blur-md border border-slate-200 text-xs text-slate-800 space-y-1.5 hidden sm:block max-w-sm">
                <div className="font-extrabold text-slate-900 mb-1 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FiLayers className="text-blue-600" />
                    Route Plan ({routePlan.orderedStops.length} {routePlan.orderedStops.length === 1 ? "Stop" : "Stops"})
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {travelMode === "TRANSIT" ? "Train Mode" : "Road Mode"}
                  </span>
                </div>

                {/* Start Point */}
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-600 inline-block ring-2 ring-emerald-200" />
                  <span className="font-medium text-slate-700 truncate">
                    Start: {routePlan.startPoint.customerName}
                  </span>
                </div>

                {/* Dynamically mapped stops */}
                {routePlan.orderedStops.map((stop) => {
                  const colors = [
                    "bg-blue-600 ring-blue-200",
                    "bg-purple-600 ring-purple-200",
                    "bg-orange-600 ring-orange-200",
                    "bg-teal-600 ring-teal-200",
                  ];
                  const c = colors[(stop.stopNumber - 1) % colors.length];
                  return (
                    <div key={stop.leadId} className="flex items-center gap-2">
                      <span className={`h-3 w-3 shrink-0 rounded-full ${c} inline-block ring-2`} />
                      <span className="font-medium text-slate-800 truncate">
                        Stop {stop.stopNumber} ({stop.sequenceRankLabel}): {stop.customerName}
                      </span>
                    </div>
                  );
                })}

                {/* Train Transit stations indicator */}
                {travelMode === "TRANSIT" && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-purple-700 font-bold">
                    <span>🚆</span>
                    <span>Railway Stations & Transit Lines Active</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FiShield className="text-blue-600" />
            <span>Smart Follow-up Route Engine with GPS & Mumbai Local Train Route Guide</span>
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
