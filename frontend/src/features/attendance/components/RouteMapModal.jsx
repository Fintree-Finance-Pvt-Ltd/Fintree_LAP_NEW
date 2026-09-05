import { useEffect, useRef, useState } from "react";
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

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [activeView, setActiveView] = useState("map"); // "map" | "timeline"

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

  const formatTime = safeFormatTime;

  const fetchRoute = async () => {
    if (!attendanceId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getRoute(attendanceId);
      const raw = res?.data?.data || res?.data || res;
      // raw might be { attendance: ..., points: ... } or inside .data
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
      });
      mapInstanceRef.current = map;

      // OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Invalidate size once modal layout settles
      const t1 = setTimeout(() => map?.invalidateSize?.(), 100);
      const t2 = setTimeout(() => map?.invalidateSize?.(), 350);
      const t3 = setTimeout(() => map?.invalidateSize?.(), 800);

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

        map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 15);
      }

      // Start Marker
      if (startLat && startLng) {
        const startPos = [Number(startLat), Number(startLng)];
        const startTimeStr = safeFormatTime(att.startTime || att.start_time);
        const startLocName = att.startLocation || att.start_location || "Start Location";

        L.marker(startPos, { icon: startIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b;">
              <b style="color: #059669;">🟢 PUNCH IN (Start Work)</b><br/>
              <b>Time:</b> ${startTimeStr}<br/>
              <b>Location:</b> ${startLocName}<br/>
              <b>Coords:</b> ${Number(startLat).toFixed(5)}, ${Number(startLng).toFixed(5)}
            </div>
          `);
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
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b;">
              <b style="color: #4f46e5;">📍 Route Stop #${idx + 1}</b><br/>
              <b>Time:</b> ${timeStr}<br/>
              <b>Location:</b> ${p.locationName || p.location_name || "Waypoint Trail"}<br/>
              <b>Coords:</b> ${Number(pLat).toFixed(5)}, ${Number(pLng).toFixed(5)}
            </div>
          `);
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
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b;">
              <b style="color: ${isLive ? "#2563eb" : "#dc2626"};">
                ${isLive ? "📡 LIVE CURRENT LOCATION" : "🔴 PUNCH OUT (End Work)"}
              </b><br/>
              <b>Time:</b> ${endTimeStr}<br/>
              <b>Location:</b> ${endLocName}<br/>
              <b>Coords:</b> ${Number(endLat).toFixed(5)}, ${Number(endLng).toFixed(5)}
            </div>
          `);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error("Leaflet initialization caught error:", err);
    }
  }, [routeData, activeView]);

  if (!attendanceId) return null;

  const att = routeData?.attendance || {};
  const points = routeData?.points || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 md:p-6 backdrop-blur-md transition-all animate-fadeIn">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#0f2942] text-white shadow-2xl">
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-400/30">
              <FiNavigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white">
                  {att.userName || "Employee"} • Route Movement Map
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    att.status === "COMPLETED"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse"
                  }`}
                >
                  {att.status === "COMPLETED" ? "Completed" : "Live Tracking Active"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Work Session Date: <span className="text-slate-200 font-semibold">{att.date}</span>
                {att.userEmail ? ` • ${att.userEmail}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchRoute}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Refresh GPS Route"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Map"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/10 bg-slate-900/40 p-4 sm:grid-cols-4 text-xs">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <FiFlag className="text-emerald-400" /> Start Punch Time
            </span>
            <div className="mt-1 font-bold text-white text-sm">
              {safeFormatTime(att.startTime || att.start_time)}
            </div>
            <div className="text-[10px] text-slate-400 truncate" title={att.startLocation || att.start_location}>
              {att.startLocation || att.start_location || "Office"}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <FiMapPin className="text-rose-400" /> Last / Exit Time
            </span>
            <div className="mt-1 font-bold text-white text-sm">
              {safeFormatTime(att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at)}
            </div>
            <div className="text-[10px] text-slate-400 truncate" title={att.endLocation || att.end_location || att.currentLocation || att.current_location}>
              {att.endLocation || att.end_location || att.currentLocation || att.current_location || "In Progress"}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <FiCompass className="text-cyan-400" /> Total Distance
            </span>
            <div className="mt-1 font-bold text-cyan-300 text-sm">
              {att.totalDistanceKm || att.total_distance_km ? `${att.totalDistanceKm || att.total_distance_km} km` : "0.0 km"}
            </div>
            <div className="text-[10px] text-slate-400">
              {points.length} waypoints tracked
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <FiClock className="text-amber-400" /> Total Duration
            </span>
            <div className="mt-1 font-bold text-amber-300 text-sm">
              {att.totalHours || att.total_hours || "In Progress"}
            </div>
            <div className="text-[10px] text-slate-400">Working session</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-2 bg-slate-900/20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("map")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeView === "map"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Interactive Map View
            </button>
            <button
              type="button"
              onClick={() => setActiveView("timeline")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeView === "timeline"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Route Waypoint Timeline ({points.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Start
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> Trail
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Exit / Live
            </span>
          </div>
        </div>

        {/* Main Content: Map or Timeline */}
        <div className="relative flex-1 overflow-hidden bg-slate-950" style={{ minHeight: "480px" }}>
          {activeView === "map" ? (
            <div className="h-full w-full" style={{ height: "100%", width: "100%", minHeight: "480px" }}>
              <div
                ref={mapContainerRef}
                className="h-full w-full z-10"
                style={{ height: "100%", width: "100%", minHeight: "480px" }}
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6 space-y-3">
              {/* Start Point */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-emerald-500/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                  🟢
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Start Punch-In</span>
                    <span className="font-mono text-slate-300">{safeFormatTime(att.startTime || att.start_time)}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{att.startLocation || att.start_location || "Office Workspace"}</p>
                  {(att.startLatitude || att.start_latitude) && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Coordinates: {att.startLatitude || att.start_latitude}, {att.startLongitude || att.start_longitude}
                    </p>
                  )}
                </div>
              </div>

              {/* Waypoints */}
              {points.map((pt, i) => (
                <div
                  key={pt.id || i}
                  className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-white/5 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 font-bold shrink-0 text-xs">
                    #{i + 1}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">
                        {pt.locationName || pt.location_name || `Movement Checkpoint #${i + 1}`}
                      </span>
                      <span className="font-mono text-slate-400">{safeFormatTime(pt.recordedAt || pt.recorded_at)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Lat: {pt.latitude}, Lng: {pt.longitude}
                      {pt.speed ? ` • Speed: ${(pt.speed * 3.6).toFixed(1)} km/h` : ""}
                      {pt.accuracy ? ` • GPS Accuracy: ±${pt.accuracy.toFixed(0)}m` : ""}
                    </p>
                  </div>
                </div>
              ))}

              {/* End Point */}
              {(att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude) && (
                <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-red-500/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 font-bold shrink-0">
                    {att.status === "COMPLETED" ? "🔴" : "📡"}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400">
                        {att.status === "COMPLETED" ? "Punch-Out Exit" : "Current Live Location"}
                      </span>
                      <span className="font-mono text-slate-300">
                        {safeFormatTime(att.endTime || att.end_time || att.lastTrackedAt || att.last_tracked_at)}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{att.endLocation || att.end_location || att.currentLocation || att.current_location || "Location"}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Coordinates: {att.endLatitude || att.end_latitude || att.currentLatitude || att.current_latitude},{" "}
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
