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
  const polylineRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [activeView, setActiveView] = useState("map"); // "map" | "timeline"
  const [showStats, setShowStats] = useState(true);

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

  const fetchRoute = async () => {
    if (!attendanceId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getRoute(attendanceId);
      const raw = res?.data?.data || res?.data || res;
      const payload = raw?.attendance ? raw : raw?.data ? raw.data : raw;
      setRouteData(payload);
    } catch (error) {
      console.error("Failed to load route data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [attendanceId]);

  // Handler to fit map bounds to route
  const fitRouteBounds = useCallback(() => {
    if (mapInstanceRef.current && polylineRef.current) {
      try {
        mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), {
          padding: [40, 40],
          maxZoom: 16,
        });
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!routeData || activeView !== "map" || !mapContainerRef.current) return;

    const points = routeData.points || [];
    const att = routeData.attendance || {};

    const startLat = att.startLatitude || att.start_latitude;
    const startLng = att.startLongitude || att.start_longitude;
    const endLat = att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude;
    const endLng = att.endLongitude || att.end_longitude || att.currentLongitude || att.current_longitude;

    // Collect all valid coordinates
    const latLngs = [];

    if (startLat && startLng) {
      latLngs.push([Number(startLat), Number(startLng)]);
    }

    points.forEach((p) => {
      const pLat = p.latitude || p.lat;
      const pLng = p.longitude || p.lng;
      if (pLat && pLng) {
        latLngs.push([Number(pLat), Number(pLng)]);
      }
    });

    if (endLat && endLng) {
      const exists = latLngs.some(
        ([la, lo]) => Math.abs(la - Number(endLat)) < 0.0001 && Math.abs(lo - Number(endLng)) < 0.0001
      );
      if (!exists) {
        latLngs.push([Number(endLat), Number(endLng)]);
      }
    }

    // Clean up previous map instance safely
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    // Default center (e.g. coordinates or default Mumbai center)
    const initialCenter = latLngs.length > 0 ? latLngs[0] : [18.9559, 72.8152];

    try {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: true,
        tap: true,
      });
      mapInstanceRef.current = map;

      // Position zoom control for mobile friendliness (bottom right)
      map.zoomControl.setPosition("bottomright");

      // OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Invalidate size once modal layout settles
      const t1 = setTimeout(() => map?.invalidateSize?.(), 100);
      const t2 = setTimeout(() => map?.invalidateSize?.(), 300);
      const t3 = setTimeout(() => map?.invalidateSize?.(), 600);

      // Draw Route Polyline
      if (latLngs.length > 1) {
        // Glow underlay
        L.polyline(latLngs, {
          color: "#3b82f6",
          weight: 6,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        // Dashed top path
        const polyline = L.polyline(latLngs, {
          color: "#60a5fa",
          weight: 3,
          opacity: 1,
          dashArray: "6, 8",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        polylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 16 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 15);
      }

      const popupOptions = {
        autoPan: true,
        autoPanPadding: [20, 20],
        maxWidth: 280,
      };

      // Start Marker
      if (startLat && startLng) {
        const startPos = [Number(startLat), Number(startLng)];
        const startTimeStr = safeFormatTime(att.startTime || att.start_time);
        const startLocName = att.startLocation || att.start_location || "Start Location";

        L.marker(startPos, { icon: startIcon })
          .addTo(map)
          .bindPopup(
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
      }

      // Waypoint Markers
      points.forEach((p, idx) => {
        const pLat = p.latitude || p.lat;
        const pLng = p.longitude || p.lng;
        if (!pLat || !pLng) return;

        const pos = [Number(pLat), Number(pLng)];
        const timeStr = safeFormatTime(p.recordedAt || p.recorded_at);

        L.marker(pos, { icon: waypointIcon })
          .addTo(map)
          .bindPopup(
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
      });

      // End / Live Marker
      const isLive = att.status === "IN_PROGRESS";
      if (endLat && endLng) {
        const endPos = [Number(endLat), Number(endLng)];
        const endTimeStr = safeFormatTime(
          att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at
        );
        const endLocName =
          att.endLocation || att.end_location || att.currentLocation || att.current_location || "Location";

        L.marker(endPos, { icon: isLive ? currentLiveIcon : endIcon })
          .addTo(map)
          .bindPopup(
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
      }

      // Resize listener to keep map responsive on orientation changes
      const handleResize = () => {
        map?.invalidateSize?.();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener("resize", handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error("Leaflet initialization caught error:", err);
    }
  }, [routeData, activeView]);

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
                {att.totalDistanceKm || att.total_distance_km ? `${att.totalDistanceKm || att.total_distance_km} km` : "0.0 km"}
              </div>
              <div className="text-[10px] text-slate-400">
                {points.length} waypoints
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

        {/* View Tabs & Route Legend */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-white/10 px-3 py-1.5 sm:px-6 sm:py-2 bg-slate-900/30">
          <div className="flex items-center gap-1.5">
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

