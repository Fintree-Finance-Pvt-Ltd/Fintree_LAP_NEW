import { useEffect, useRef, useState, useCallback } from "react";
import {
  FiX,
  FiMapPin,
  FiClock,
  FiActivity,
  FiUser,
  FiRefreshCw,
  FiNavigation,
  FiCheckCircle,
  FiCompass,
  FiFlag,
  FiMaximize2,
  FiChevronDown,
  FiChevronUp,
  FiList,
  FiMap,
} from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { attendanceApi } from "../attendanceApi.js";
import { fetchRoadRoute } from "../../../utils/geoUtils.js";

// Custom Leaflet Icons
const createCustomIcon = (color, label, emoji) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background: ${color};
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        user-select: none;
      ">
        ${emoji || "📍"}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const startIcon = createCustomIcon("#10b981", "Start", "🟢");
const endIcon = createCustomIcon("#ef4444", "End", "🔴");
const currentLiveIcon = createCustomIcon("#3b82f6", "Live", "📡");
const waypointIcon = createCustomIcon("#6366f1", "Point", "•");

export default function RouteMapModal({ attendanceId, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerGroupRef = useRef(null);
  const polylineRef = useRef(null);
  const glowPolylineRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);
  const lastAttendanceIdRef = useRef(attendanceId);

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [activeView, setActiveView] = useState("map"); // "map" | "timeline"
  const [travelMode, setTravelMode] = useState("exact"); // "exact" | "road"
  const [showStats, setShowStats] = useState(true);
  const [routeStats, setRouteStats] = useState({
    roadDistanceKm: 0,
    isRoadRoute: false,
    calculating: false,
  });

  // Reset fitted bounds flag if attendanceId changes
  if (lastAttendanceIdRef.current !== attendanceId) {
    lastAttendanceIdRef.current = attendanceId;
    hasFittedBoundsRef.current = false;
  }

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const safeFormatTime = (d) => {
    if (!d) return "-";
    try {
      const cleanStr = typeof d === "string" ? d.replace(" ", "T") : d;
      const parsed = new Date(cleanStr);
      if (isNaN(parsed.getTime())) {
        const dOnly = new Date(d);
        if (!isNaN(dOnly.getTime())) {
          return dOnly.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
        return String(d);
      }
      return parsed.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(d);
    }
  };

  const fetchRoute = useCallback(async (silent = false) => {
    if (!attendanceId) return;
    if (!silent) setLoading(true);
    try {
      const res = await attendanceApi.getRoute(attendanceId);
      const raw = res?.data?.data || res?.data || res;
      const payload = raw?.attendance ? raw : raw?.data ? raw.data : raw;
      setRouteData(payload);
    } catch (error) {
      console.error("Failed to load route data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [attendanceId]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Live Auto-Refresh (every 5 seconds) if attendance is IN_PROGRESS
  useEffect(() => {
    if (!routeData?.attendance || routeData.attendance.status !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      fetchRoute(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [routeData?.attendance, fetchRoute]);

  // Handler to manually fit map bounds to route
  const fitRouteBounds = useCallback(() => {
    if (mapInstanceRef.current && polylineRef.current) {
      try {
        mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), {
          padding: [45, 45],
          maxZoom: 16,
        });
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }
  }, []);

  // 1. Initialize Map Instance Once
  useEffect(() => {
    if (activeView !== "map" || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [18.9559, 72.8152],
        zoom: 14,
        zoomControl: true,
        tap: true,
      });

      map.zoomControl.setPosition("bottomright");

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      routeLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      const t1 = setTimeout(() => map?.invalidateSize?.(), 100);
      const t2 = setTimeout(() => map?.invalidateSize?.(), 300);
      const t3 = setTimeout(() => map?.invalidateSize?.(), 600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      mapInstanceRef.current.invalidateSize();
    }
  }, [activeView]);

  // Cleanup Map on modal unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render and Update Layers (Markers, Polyline) without recreating the map
  useEffect(() => {
    if (!routeData || activeView !== "map" || !mapInstanceRef.current || !routeLayerGroupRef.current) return;

    let isSubscribed = true;
    const map = mapInstanceRef.current;
    const layerGroup = routeLayerGroupRef.current;

    layerGroup.clearLayers();
    polylineRef.current = null;
    glowPolylineRef.current = null;

    const points = routeData.points || [];
    const att = routeData.attendance || {};

    const startLat = att.startLatitude || att.start_latitude;
    const startLng = att.startLongitude || att.start_longitude;
    const endLat = att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude;
    const endLng = att.endLongitude || att.end_longitude || att.currentLongitude || att.current_longitude;

    // Collect all valid waypoint coordinates
    const keyCoords = [];

    if (startLat && startLng) {
      keyCoords.push([Number(startLat), Number(startLng)]);
    }

    points.forEach((p) => {
      const pLat = p.latitude || p.lat;
      const pLng = p.longitude || p.lng;
      if (pLat && pLng) {
        keyCoords.push([Number(pLat), Number(pLng)]);
      }
    });

    if (endLat && endLng) {
      const exists = keyCoords.some(
        ([la, lo]) => Math.abs(la - Number(endLat)) < 0.0001 && Math.abs(lo - Number(endLng)) < 0.0001
      );
      if (!exists) {
        keyCoords.push([Number(endLat), Number(endLng)]);
      }
    }

    const popupOptions = {
      autoPan: true,
      autoPanPadding: [20, 20],
      maxWidth: 280,
    };

    // Add Start Marker
    if (startLat && startLng) {
      const startPos = [Number(startLat), Number(startLng)];
      const startTimeStr = safeFormatTime(att.startTime || att.start_time);
      const startLocName = att.startLocation || att.start_location || "Start Location";

      const startMarker = L.marker(startPos, { icon: startIcon }).bindPopup(
        `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; padding: 2px;">
          <b style="color: #059669; font-size: 13px;">🟢 PUNCH IN (Start Work)</b><br/>
          <b>Time:</b> ${startTimeStr}<br/>
          <b>Location:</b> ${startLocName}<br/>
          <b>Coords:</b> ${Number(startLat).toFixed(5)}, ${Number(startLng).toFixed(5)}
        </div>
      `,
        popupOptions
      );
      layerGroup.addLayer(startMarker);
    }

    // Add Waypoint Markers
    points.forEach((p, idx) => {
      const pLat = p.latitude || p.lat;
      const pLng = p.longitude || p.lng;
      if (!pLat || !pLng) return;

      const pos = [Number(pLat), Number(pLng)];
      const timeStr = safeFormatTime(p.recordedAt || p.recorded_at);

      const wpMarker = L.marker(pos, { icon: waypointIcon }).bindPopup(
        `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; padding: 2px;">
          <b style="color: #4f46e5; font-size: 13px;">📍 Route Stop #${idx + 1}</b><br/>
          <b>Time:</b> ${timeStr}<br/>
          <b>Location:</b> ${p.locationName || p.location_name || "Waypoint Trail"}<br/>
          <b>Coords:</b> ${Number(pLat).toFixed(5)}, ${Number(pLng).toFixed(5)}
        </div>
      `,
        popupOptions
      );
      layerGroup.addLayer(wpMarker);
    });

    // Add End / Live Marker
    const isLive = att.status === "IN_PROGRESS";
    if (endLat && endLng) {
      const endPos = [Number(endLat), Number(endLng)];
      const endTimeStr = safeFormatTime(
        att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at
      );
      const endLocName =
        att.endLocation || att.end_location || att.currentLocation || att.current_location || "Location";

      const endMarker = L.marker(endPos, { icon: isLive ? currentLiveIcon : endIcon }).bindPopup(
        `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; padding: 2px;">
          <b style="color: ${isLive ? "#2563eb" : "#dc2626"}; font-size: 13px;">
            ${isLive ? "📡 LIVE CURRENT LOCATION" : "🔴 PUNCH OUT (End Work)"}
          </b><br/>
          <b>Time:</b> ${endTimeStr}<br/>
          <b>Location:</b> ${endLocName}<br/>
          <b>Coords:</b> ${Number(endLat).toFixed(5)}, ${Number(endLng).toFixed(5)}
        </div>
      `,
        popupOptions
      );
      layerGroup.addLayer(endMarker);
    }

    // Render Route Polyline
    if (keyCoords.length >= 2) {
      if (travelMode === "exact") {
        setRouteStats({
          roadDistanceKm: 0,
          isRoadRoute: false,
          calculating: false,
        });

        // Glow Underlay line
        const glow = L.polyline(keyCoords, {
          color: "#1d4ed8",
          weight: 7,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
        });
        layerGroup.addLayer(glow);
        glowPolylineRef.current = glow;

        // Main User Traveled Trail
        const polyline = L.polyline(keyCoords, {
          color: "#38bdf8",
          weight: 4,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        });
        layerGroup.addLayer(polyline);
        polylineRef.current = polyline;

        // Only auto-fit bounds on initial load, not during periodic live 5s background updates
        if (!hasFittedBoundsRef.current) {
          try {
            map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 16 });
            hasFittedBoundsRef.current = true;
          } catch (fitErr) {
            console.warn("fitBounds note:", fitErr);
          }
        }
      } else {
        setRouteStats((prev) => ({ ...prev, calculating: true }));

        fetchRoadRoute(keyCoords).then((routeRes) => {
          if (!isSubscribed || !mapInstanceRef.current || !routeLayerGroupRef.current) return;

          const renderCoords =
            routeRes.roadCoordinates && routeRes.roadCoordinates.length > 0
              ? routeRes.roadCoordinates
              : keyCoords;

          setRouteStats({
            roadDistanceKm: routeRes.distanceKm,
            isRoadRoute: routeRes.isRoadRoute,
            calculating: false,
          });

          // Glow Underlay line
          const glow = L.polyline(renderCoords, {
            color: "#1d4ed8",
            weight: 7,
            opacity: 0.5,
            lineCap: "round",
            lineJoin: "round",
          });
          layerGroup.addLayer(glow);
          glowPolylineRef.current = glow;

          // Main Road Route Line
          const polyline = L.polyline(renderCoords, {
            color: "#38bdf8",
            weight: 4,
            opacity: 0.95,
            dashArray: routeRes.isRoadRoute ? undefined : "6, 8",
            lineCap: "round",
            lineJoin: "round",
          });
          layerGroup.addLayer(polyline);
          polylineRef.current = polyline;

          // Only auto-fit bounds on initial load
          if (!hasFittedBoundsRef.current) {
            try {
              map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 16 });
              hasFittedBoundsRef.current = true;
            } catch (fitErr) {
              console.warn("fitBounds note:", fitErr);
            }
          }
        });
      }
    } else if (keyCoords.length === 1 && !hasFittedBoundsRef.current) {
      map.setView(keyCoords[0], 15);
      hasFittedBoundsRef.current = true;
    }

    return () => {
      isSubscribed = false;
    };
  }, [routeData, activeView, travelMode]);


  // Handle map resizing when stats collapsible toggles
  useEffect(() => {
    if (activeView === "map" && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize?.();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showStats, activeView]);

  if (!attendanceId) return null;

  const att = routeData?.attendance || {};
  const points = routeData?.points || [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-0 sm:p-3 md:p-6 backdrop-blur-md transition-all animate-fadeIn"
    >
      <div className="relative flex h-[100dvh] sm:h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-white/20 bg-[#0f2942] text-white shadow-2xl">
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5 sm:px-6 sm:py-3.5 bg-slate-900/80">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-400/30">
              <FiNavigation className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                  {att.userName || "Employee"}
                </h3>
                <span className="hidden sm:inline text-slate-400 text-xs">•</span>
                <span className="hidden sm:inline text-xs text-slate-300 font-medium">Route Movement</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 ${
                    att.status === "COMPLETED"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : att.status === "AUTO_END_WORK" ||
                        att.status === "auto_end_work" ||
                        att.status === "AUTO_ENDED" ||
                        att.status === "END_WORK_HOUR"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse"
                  }`}
                >
                  {att.status === "COMPLETED"
                    ? "Completed"
                    : att.status === "AUTO_END_WORK" ||
                      att.status === "auto_end_work" ||
                      att.status === "AUTO_ENDED" ||
                      att.status === "END_WORK_HOUR"
                    ? "auto_end_work"
                    : "Live Tracking"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                Date: <span className="text-slate-200 font-medium">{att.date || "Today"}</span>
                {att.userEmail ? ` • ${att.userEmail}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchRoute}
              disabled={loading}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-all active:scale-95 cursor-pointer touch-manipulation"
              title="Refresh GPS Route"
              aria-label="Refresh GPS Route"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>

            {/* Toggle Stats for mobile */}
            <button
              type="button"
              onClick={() => setShowStats((prev) => !prev)}
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-all active:scale-95 cursor-pointer touch-manipulation"
              title={showStats ? "Hide Stats" : "Show Stats"}
              aria-label={showStats ? "Hide Stats" : "Show Stats"}
            >
              {showStats ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </button>

            {/* Main Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 px-3 sm:h-10 sm:px-3.5 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/15 text-red-200 hover:bg-red-500/30 hover:text-white transition-all active:scale-95 cursor-pointer font-semibold text-xs sm:text-sm shadow-sm touch-manipulation"
              title="Close Map"
              aria-label="Close Map"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip (Collapsible on mobile) */}
        {showStats && (
          <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:gap-2 border-b border-white/10 bg-slate-900/50 p-2 sm:p-3 sm:grid-cols-4 text-xs transition-all animate-fadeIn">
            <div className="rounded-xl bg-white/5 p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1 font-medium">
                <FiFlag className="text-emerald-400 shrink-0" /> Start Punch
              </span>
              <div className="mt-0.5 font-bold text-white text-xs sm:text-sm truncate">
                {safeFormatTime(att.startTime || att.start_time)}
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={att.startLocation || att.start_location}>
                {att.startLocation || att.start_location || "Office"}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1 font-medium">
                <FiMapPin className="text-rose-400 shrink-0" /> Last Punch / Live
              </span>
              <div className="mt-0.5 font-bold text-white text-xs sm:text-sm truncate">
                {safeFormatTime(att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at)}
              </div>
              <div className="text-[10px] text-slate-400 truncate" title={att.endLocation || att.end_location || att.currentLocation || att.current_location}>
                {att.endLocation || att.end_location || att.currentLocation || att.current_location || "In Progress"}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1 font-medium">
                <FiCompass className="text-cyan-400 shrink-0" /> Total Distance
              </span>
              <div className="mt-0.5 font-bold text-cyan-300 text-xs sm:text-sm">
                {routeStats.roadDistanceKm > 0
                  ? `${routeStats.roadDistanceKm} km`
                  : att.totalDistanceKm || att.total_distance_km
                  ? `${att.totalDistanceKm || att.total_distance_km} km`
                  : "0.0 km"}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                {routeStats.isRoadRoute ? (
                  <span className="text-emerald-400 font-semibold">🛣️ Road route</span>
                ) : (
                  <span>{points.length} waypoints</span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-2 sm:p-2.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1 font-medium">
                <FiClock className="text-amber-400 shrink-0" /> Duration
              </span>
              <div className="mt-0.5 font-bold text-amber-300 text-xs sm:text-sm truncate">
                {att.totalHours || att.total_hours || "In Progress"}
              </div>
              <div className="text-[10px] text-slate-400">Work session</div>
            </div>
          </div>
        )}

        {/* View Tabs & Route Style Selector */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-white/10 px-3 py-1.5 sm:px-6 sm:py-2 bg-slate-900/30">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView("map")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
                activeView === "map"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FiMap className="h-3.5 w-3.5" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("timeline")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
                activeView === "timeline"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FiList className="h-3.5 w-3.5" />
              <span>Timeline ({points.length})</span>
            </button>

            {/* Trail Mode Switcher */}
            {activeView === "map" && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/10">
                <button
                  type="button"
                  onClick={() => setTravelMode("exact")}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation ${
                    travelMode === "exact"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                  title="Exact walk/travel GPS trail connecting every recorded point"
                >
                  <span>📍 Exact Walk/Travel Trail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode("road")}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation ${
                    travelMode === "road"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/40"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                  title="Snap to car roads"
                >
                  <span>🚗 Road Driving</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Start
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Trail
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Exit/Live
            </span>
          </div>
        </div>

        {/* Main Content: Map or Timeline */}
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-slate-950">
          {activeView === "map" ? (
            <div className="relative h-full w-full">
              {/* Floating Quick Action Controls on Map (Top-Right / Top-Left) with higher z-index */}
              <div className="absolute top-3 left-3 z-[1001] flex items-center gap-2">
                <button
                  type="button"
                  onClick={fitRouteBounds}
                  className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer touch-manipulation"
                  title="Fit whole route to screen"
                >
                  <FiMaximize2 className="h-3.5 w-3.5 text-blue-400" />
                  <span className="hidden xs:inline text-[11px]">Fit Route</span>
                </button>
              </div>

              {/* Floating Mobile Exit Pill directly on the map */}
              {/* <div className="absolute top-3 right-3 z-[1001] flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1 rounded-xl border border-red-500/50 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-red-300 shadow-xl backdrop-blur-md hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
                  title="Exit Map"
                >
                  <FiX className="h-4 w-4 text-red-400" />
                  <span className="text-[11px]">Close</span>
                </button>
              </div> */}

              {/* Leaflet Map Canvas */}
              <div
                ref={mapContainerRef}
                className="h-full w-full z-10"
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-3 sm:p-6 space-y-2.5 sm:space-y-3">
              {/* Start Point */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-2xl bg-white/5 p-3 sm:p-4 border border-emerald-500/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                  🟢
                </div>
                <div className="flex-1 text-xs min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm">Start Punch-In</span>
                    <span className="font-mono text-slate-300 text-[11px] sm:text-xs shrink-0">{safeFormatTime(att.startTime || att.start_time)}</span>
                  </div>
                  <p className="text-slate-300 mt-1 truncate">{att.startLocation || att.start_location || "Office Workspace"}</p>
                  {(att.startLatitude || att.start_latitude) && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      Coords: {att.startLatitude || att.start_latitude}, {att.startLongitude || att.start_longitude}
                    </p>
                  )}
                </div>
              </div>

              {/* Waypoints */}
              {points.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-xs text-slate-400">
                  No intermediate route checkpoints recorded for this work session.
                </div>
              ) : (
                points.map((pt, i) => (
                  <div
                    key={pt.id || i}
                    className="flex items-start gap-2.5 sm:gap-3 rounded-2xl bg-white/5 p-3 sm:p-4 border border-white/5 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 font-bold shrink-0 text-xs">
                      #{i + 1}
                    </div>
                    <div className="flex-1 text-xs min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-indigo-300 truncate">
                          {pt.locationName || pt.location_name || `Movement Checkpoint #${i + 1}`}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px] sm:text-xs shrink-0">{safeFormatTime(pt.recordedAt || pt.recorded_at)}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-1 truncate">
                        Lat: {pt.latitude}, Lng: {pt.longitude}
                        {pt.speed ? ` • Speed: ${(pt.speed * 3.6).toFixed(1)} km/h` : ""}
                        {pt.accuracy ? ` • GPS: ±${pt.accuracy.toFixed(0)}m` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* End Point */}
              {(att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude) && (
                <div className="flex items-start gap-2.5 sm:gap-3 rounded-2xl bg-white/5 p-3 sm:p-4 border border-red-500/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 font-bold shrink-0">
                    {att.status === "COMPLETED" ? "🔴" : "📡"}
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-red-400 text-xs sm:text-sm">
                        {att.status === "COMPLETED" ? "Punch-Out Exit" : "Current Live Location"}
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] sm:text-xs shrink-0">
                        {safeFormatTime(att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at)}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 truncate">{att.endLocation || att.end_location || att.currentLocation || att.current_location || "Location"}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      Coords: {att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude},{" "}
                      {att.endLongitude || att.end_longitude || att.currentLongitude || att.current_longitude}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

