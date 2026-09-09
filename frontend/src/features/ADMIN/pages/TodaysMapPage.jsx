import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCompass,
  FiMap,
  FiMapPin,
  FiMaximize2,
  FiRefreshCw,
  FiSearch,
  FiUsers
} from "react-icons/fi";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth.js";
import { fetchRoadRoute } from "../../../utils/geoUtils.js";
import { attendanceApi } from "../../attendance/attendanceApi.js";

// Helper: Normalize roles
function normalizeRoles(user) {
  const roles = user?.roles ?? user?.role;
  if (!roles) return [];
  return (Array.isArray(roles) ? roles : [roles])
    .map((role) =>
      String(role?.code || role?.name || role?.role || role).toUpperCase(),
    )
    .filter(Boolean);
}

// Helper: Format today's date in IST
function getTodayISTString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Helper: Format time string safely
function formatTime(d) {
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
}

// Distinct Route Colors for Multiple Users
const USER_ROUTE_COLORS = [
  "#38bdf8", // Sky Blue
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#e11d48", // Rose
  "#6366f1", // Indigo
];

function getUserColor(userId, index = 0) {
  const num = Number(userId) || index + 1;
  return USER_ROUTE_COLORS[(num - 1) % USER_ROUTE_COLORS.length];
}

// Custom Leaflet Named User Marker Icon (Shows Full User Name on Top + Pin)
const createNamedUserMarkerIcon = ({
  name,
  color,
  initials,
  isLive = false,
  subtitle = "",
}) => {
  return L.divIcon({
    className: "custom-user-named-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <!-- Full Name Badge Header on Top -->
        <div style="
          background: rgba(11, 20, 38, 0.95);
          color: #ffffff;
          border: 1.5px solid ${color};
          border-radius: 8px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 2px;
          user-select: none;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isLive ? "#10b981" : color};"></span>
          <span>${name}</span>
          ${subtitle ? `<span style="font-size: 9px; opacity: 0.8; font-weight: normal;">• ${subtitle}</span>` : ""}
          ${isLive ? '<span style="font-size: 9px; color: #34d399; font-weight: bold;">(Live)</span>' : ""}
        </div>

        <!-- Avatar Pin Circle -->
        <div style="
          background: ${color};
          color: white;
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.45);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          position: relative;
        ">
          ${isLive ? "📡" : initials || "📍"}
        </div>
        <!-- Pin Arrow -->
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${color};
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [140, 68],
    iconAnchor: [70, 67],
    popupAnchor: [0, -65],
  });
};

const createStartMarkerIcon = (userName, color = "#10b981") => {
  return L.divIcon({
    className: "custom-start-named-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          background: rgba(6, 78, 59, 0.95);
          color: #a7f3d0;
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 1px 6px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          margin-bottom: 2px;
        ">
          🟢 ${userName} (Start)
        </div>
        <div style="
          background: #10b981;
          color: white;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        ">
          🏁
        </div>
      </div>
    `,
    iconSize: [120, 50],
    iconAnchor: [60, 49],
    popupAnchor: [0, -48],
  });
};

const startIcon = L.divIcon({
  className: "custom-start-pin",
  html: `
    <div style="
      background: #10b981;
      color: white;
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    ">🟢</div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

const waypointIcon = L.divIcon({
  className: "custom-waypoint-pin",
  html: `
    <div style="
      background: #6366f1;
      color: white;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    ">•</div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

export default function TodaysMapPage() {
  const { user } = useAuth();
  const roles = normalizeRoles(user);
  const isAdmin = roles.includes("ADMIN");

  // State
  const [selectedDate, setSelectedDate] = useState(getTodayISTString);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState({ stats: null, data: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "IN_PROGRESS" | "COMPLETED" | "AUTO_END_WORK"
  const [selectedUser, setSelectedUser] = useState(null); // null = overview of all users
  const [activeTab, setActiveTab] = useState("list"); // "list" | "timeline"
  const [travelMode, setTravelMode] = useState("exact"); // "exact" | "road"
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mobileView, setMobileView] = useState("map"); // "map" | "list"
  const [roadRouteStats, setRoadRouteStats] = useState({
    distanceKm: 0,
    isRoad: false,
  });

  // Refs for Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const glowPolylineRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Fetch today's map data with robust response parsing and fallback
  const fetchMapData = useCallback(
    async (silent = false) => {
      if (!isAdmin) return;
      if (!silent) setLoading(true);
      try {
        let rawResponse = null;
        try {
          rawResponse = await attendanceApi.getTodaysMap({
            date: selectedDate,
          });
        } catch (apiErr) {
          console.warn(
            "getTodaysMap endpoint fallback to getAll:",
            apiErr?.message,
          );
          rawResponse = await attendanceApi.getAll({
            date: selectedDate,
            limit: 300,
          });
        }

        // Handle various response wrappers
        let records = [];
        let extractedStats = null;

        if (Array.isArray(rawResponse)) {
          records = rawResponse;
        } else if (rawResponse && typeof rawResponse === "object") {
          if (Array.isArray(rawResponse.data)) {
            records = rawResponse.data;
            extractedStats = rawResponse.stats || null;
          } else if (Array.isArray(rawResponse.data?.data)) {
            records = rawResponse.data.data;
            extractedStats =
              rawResponse.data.stats || rawResponse.stats || null;
          } else if (Array.isArray(rawResponse.items)) {
            records = rawResponse.items;
            extractedStats = rawResponse.stats || null;
          }
        }

        // Format and normalize records
        const formattedRecords = records.map((r) => {
          const startLat = r.startLatitude ?? r.start_latitude ?? null;
          const startLng = r.startLongitude ?? r.start_longitude ?? null;
          const currentLat = r.currentLatitude ?? r.current_latitude ?? null;
          const currentLng = r.currentLongitude ?? r.current_longitude ?? null;
          const endLat = r.endLatitude ?? r.end_latitude ?? null;
          const endLng = r.endLongitude ?? r.end_longitude ?? null;
          const rawPts = r.points || r.locations || [];

          const points = rawPts
            .map((p) => ({
              id: p.id,
              latitude: Number(p.latitude ?? p.lat),
              longitude: Number(p.longitude ?? p.lng),
              accuracy: p.accuracy,
              speed: p.speed,
              heading: p.heading,
              locationName: p.locationName || p.location_name || null,
              recordedAt: p.recordedAt || p.recorded_at,
            }))
            .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));

          const latestLat =
            currentLat ??
            endLat ??
            startLat ??
            (points.length > 0 ? points[points.length - 1].latitude : null);
          const latestLng =
            currentLng ??
            endLng ??
            startLng ??
            (points.length > 0 ? points[points.length - 1].longitude : null);

          return {
            ...r,
            id: r.id,
            userId: r.userId || r.user_id,
            user:
              r.user ||
              (r.userId
                ? { id: r.userId, name: `Employee #${r.userId}` }
                : null),
            startLatitude:
              startLat !== null && !isNaN(Number(startLat))
                ? Number(startLat)
                : null,
            startLongitude:
              startLng !== null && !isNaN(Number(startLng))
                ? Number(startLng)
                : null,
            currentLatitude:
              currentLat !== null && !isNaN(Number(currentLat))
                ? Number(currentLat)
                : null,
            currentLongitude:
              currentLng !== null && !isNaN(Number(currentLng))
                ? Number(currentLng)
                : null,
            endLatitude:
              endLat !== null && !isNaN(Number(endLat)) ? Number(endLat) : null,
            endLongitude:
              endLng !== null && !isNaN(Number(endLng)) ? Number(endLng) : null,
            latestLatitude:
              latestLat !== null && !isNaN(Number(latestLat))
                ? Number(latestLat)
                : null,
            latestLongitude:
              latestLng !== null && !isNaN(Number(latestLng))
                ? Number(latestLng)
                : null,
            totalDistanceKm: Number(
              r.totalDistanceKm || r.total_distance_km || 0,
            ),
            totalHours: r.totalHours || r.total_hours || "In progress",
            status: r.status,
            points,
          };
        });

        // Compute statistics if not provided directly
        const activeCount = formattedRecords.filter(
          (r) => r.status === "IN_PROGRESS",
        ).length;
        const completedCount = formattedRecords.filter(
          (r) => r.status === "COMPLETED",
        ).length;
        const autoEndedCount = formattedRecords.filter(
          (r) =>
            r.status === "AUTO_END_WORK" ||
            r.status === "auto_end_work" ||
            r.status === "AUTO_ENDED" ||
            r.status === "END_WORK_HOUR",
        ).length;
        const totalDistanceKm = formattedRecords.reduce(
          (sum, r) => sum + (Number(r.totalDistanceKm) || 0),
          0,
        );

        const computedStats = extractedStats || {
          totalUsers: formattedRecords.length,
          activeCount,
          completedCount,
          autoEndedCount,
          totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        };

        setMapData({
          stats: computedStats,
          data: formattedRecords,
        });
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedDate, isAdmin],
  );

  // Helper to select an employee and load their full route if not already loaded
  const handleSelectUser = useCallback(async (item) => {
    setSelectedUser(item);
    setMobileView("map");
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize?.();
    }, 150);

    if (!item?.points || item.points.length === 0) {
      try {
        const res = await attendanceApi.getRoute(item.id);
        const raw = res?.data?.data || res?.data || res;
        const loadedPoints = raw?.points || [];
        const loadedAtt = raw?.attendance || {};

        setSelectedUser((prev) => {
          if (!prev || prev.id !== item.id) return prev;
          return {
            ...prev,
            ...loadedAtt,
            points: loadedPoints,
          };
        });
      } catch (err) {
        console.warn("Could not load full route breadcrumbs:", err);
      }
    }
  }, []);

  // Map resize invalidation when mobile view toggles
  useEffect(() => {
    if (mobileView === "map" && mapInstanceRef.current) {
      const t1 = setTimeout(
        () => mapInstanceRef.current?.invalidateSize?.(),
        100,
      );
      const t2 = setTimeout(
        () => mapInstanceRef.current?.invalidateSize?.(),
        300,
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [mobileView]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Live Auto-Refresh polling (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMapData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMapData]);

  // Filtered employees list
  const filteredRecords = useMemo(() => {
    const list = mapData.data || [];
    return list.filter((item) => {
      const name = item.user?.name || `Employee #${item.userId}`;
      const email = item.user?.email || "";
      const startLoc = item.startLocation || "";
      const currentLoc = item.currentLocation || item.endLocation || "";

      const matchesSearch =
        !searchQuery.trim() ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startLoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        currentLoc.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "IN_PROGRESS") return item.status === "IN_PROGRESS";
      if (statusFilter === "COMPLETED") return item.status === "COMPLETED";
      if (statusFilter === "AUTO_END_WORK") {
        return (
          item.status === "AUTO_END_WORK" ||
          item.status === "auto_end_work" ||
          item.status === "AUTO_ENDED" ||
          item.status === "END_WORK_HOUR"
        );
      }
      return true;
    });
  }, [mapData.data, searchQuery, statusFilter]);

  // Initialize and update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset previous map instance if needed
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // India default center
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Tiles with crisp clarity
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (glowPolylineRef.current) {
      map.removeLayer(glowPolylineRef.current);
      glowPolylineRef.current = null;
    }

    // SCENARIO 1: A specific employee is selected -> Draw their focused complete route!
    if (selectedUser) {
      const points = selectedUser.points || [];
      const startLat = selectedUser.startLatitude;
      const startLng = selectedUser.startLongitude;
      const endLat =
        selectedUser.endLatitude ??
        selectedUser.currentLatitude ??
        (points.length > 0 ? points[points.length - 1].latitude : null);
      const endLng =
        selectedUser.endLongitude ??
        selectedUser.currentLongitude ??
        (points.length > 0 ? points[points.length - 1].longitude : null);

      const routeCoords = [];

      // Start coordinate
      if (startLat && startLng) {
        routeCoords.push([Number(startLat), Number(startLng)]);
      }

      // Intermediate coordinates
      points.forEach((p) => {
        if (p.latitude && p.longitude) {
          routeCoords.push([Number(p.latitude), Number(p.longitude)]);
        }
      });

      // End / Current coordinate
      if (endLat && endLng) {
        const exists = routeCoords.some(
          ([la, lo]) =>
            Math.abs(la - Number(endLat)) < 0.0001 &&
            Math.abs(lo - Number(endLng)) < 0.0001,
        );
        if (!exists) {
          routeCoords.push([Number(endLat), Number(endLng)]);
        }
      }

      const userName =
        selectedUser.user?.name || `Employee #${selectedUser.userId}`;
      const userColor = getUserColor(selectedUser.userId || selectedUser.id, 0);

      // Add Start Marker with Name
      if (startLat && startLng) {
        const startMarker = L.marker([Number(startLat), Number(startLng)], {
          icon: createStartMarkerIcon(userName, "#10b981"),
        }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <b style="color: #059669; font-size: 13px;">🟢 PUNCH IN (Start)</b><br/>
            <b>Employee:</b> ${userName}<br/>
            <b>Time:</b> ${formatTime(selectedUser.startTime)}<br/>
            <b>Location:</b> ${selectedUser.startLocation || "Office Workspace"}<br/>
            <b>Coords:</b> ${Number(startLat).toFixed(5)}, ${Number(startLng).toFixed(5)}
          </div>
        `);
        markersGroup.addLayer(startMarker);
      }

      // Add Waypoint Markers
      points.forEach((pt, idx) => {
        if (!pt.latitude || !pt.longitude) return;
        const wpMarker = L.marker([Number(pt.latitude), Number(pt.longitude)], {
          icon: waypointIcon,
        }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <b style="color: #4f46e5; font-size: 13px;">📍 Waypoint #${idx + 1}</b><br/>
            <b>Time:</b> ${formatTime(pt.recordedAt)}<br/>
            <b>Location:</b> ${pt.locationName || "Trail checkpoint"}<br/>
            <b>Coords:</b> ${Number(pt.latitude).toFixed(5)}, ${Number(pt.longitude).toFixed(5)}
            ${pt.speed ? `<br/><b>Speed:</b> ${(pt.speed * 3.6).toFixed(1)} km/h` : ""}
          </div>
        `);
        markersGroup.addLayer(wpMarker);
      });

      // Add Current / End Marker with Name Badge
      const isLive = selectedUser.status === "IN_PROGRESS";
      const finalLat = endLat || startLat;
      const finalLng = endLng || startLng;

      if (finalLat && finalLng) {
        const initials = userName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        const color = isLive
          ? "#2563eb"
          : selectedUser.status === "COMPLETED"
            ? "#10b981"
            : "#f59e0b";
        const endMarker = L.marker([Number(finalLat), Number(finalLng)], {
          icon: createNamedUserMarkerIcon({
            name: userName,
            color,
            initials,
            isLive,
            subtitle: selectedUser.totalDistanceKm
              ? `${selectedUser.totalDistanceKm} km`
              : "",
          }),
        }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 2px;">
            <b style="color: ${color}; font-size: 13px;">
              ${isLive ? "📡 LIVE ACTIVE LOCATION" : "🔴 PUNCH OUT (End)"}
            </b><br/>
            <b>Employee:</b> ${userName}<br/>
            <b>Time:</b> ${formatTime(selectedUser.endTime || selectedUser.lastTrackedAt)}<br/>
            <b>Location:</b> ${selectedUser.endLocation || selectedUser.currentLocation || "Location"}<br/>
            <b>Distance:</b> ${selectedUser.totalDistanceKm || 0} km • <b>Duration:</b> ${selectedUser.totalHours || "-"}<br/>
            <b>Coords:</b> ${Number(finalLat).toFixed(5)}, ${Number(finalLng).toFixed(5)}
          </div>
        `);
        markersGroup.addLayer(endMarker);
      }

      // Draw Polyline Route
      if (routeCoords.length >= 2) {
        if (travelMode === "exact") {
          // Direct GPS trail connecting every breadcrumb
          const glow = L.polyline(routeCoords, {
            color: userColor,
            weight: 8,
            opacity: 0.45,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          glowPolylineRef.current = glow;

          const polyline = L.polyline(routeCoords, {
            color: "#38bdf8",
            weight: 4.5,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          polylineRef.current = polyline;

          try {
            map.fitBounds(polyline.getBounds(), {
              padding: [50, 50],
              maxZoom: 16,
            });
          } catch (_) {}
        } else {
          // Road snapped route via OSRM
          fetchRoadRoute(routeCoords).then((res) => {
            if (!mapInstanceRef.current) return;
            const roadPts =
              res.roadCoordinates?.length > 0
                ? res.roadCoordinates
                : routeCoords;
            setRoadRouteStats({
              distanceKm: res.distanceKm,
              isRoad: res.isRoadRoute,
            });

            const glow = L.polyline(roadPts, {
              color: userColor,
              weight: 8,
              opacity: 0.45,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);
            glowPolylineRef.current = glow;

            const polyline = L.polyline(roadPts, {
              color: "#38bdf8",
              weight: 4.5,
              opacity: 0.95,
              dashArray: res.isRoadRoute ? undefined : "6, 8",
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);
            polylineRef.current = polyline;

            try {
              map.fitBounds(polyline.getBounds(), {
                padding: [50, 50],
                maxZoom: 16,
              });
            } catch (_) {}
          });
        }
      } else if (routeCoords.length === 1) {
        map.setView(routeCoords[0], 15);
      }
    } else {
      // SCENARIO 2: All Users Overview -> Plot ALL Users' Locations & Travel Routes simultaneously!
      const allBoundsCoords = [];

      filteredRecords.forEach((item, index) => {
        const userColor = getUserColor(item.userId || item.id, index);
        const name = item.user?.name || `Employee #${item.userId}`;
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        const isLive = item.status === "IN_PROGRESS";
        const isCompleted = item.status === "COMPLETED";

        const startLat = item.startLatitude;
        const startLng = item.startLongitude;
        const currentLat = item.currentLatitude ?? item.latestLatitude;
        const currentLng = item.currentLongitude ?? item.latestLongitude;
        const endLat = item.endLatitude;
        const endLng = item.endLongitude;
        const points = item.points || [];

        const userRouteCoords = [];

        if (startLat && startLng) {
          userRouteCoords.push([Number(startLat), Number(startLng)]);
          allBoundsCoords.push([Number(startLat), Number(startLng)]);
        }

        points.forEach((p) => {
          if (p.latitude && p.longitude) {
            userRouteCoords.push([Number(p.latitude), Number(p.longitude)]);
            allBoundsCoords.push([Number(p.latitude), Number(p.longitude)]);
          }
        });

        const latestLat =
          currentLat ??
          endLat ??
          startLat ??
          (points.length > 0 ? points[points.length - 1].latitude : null);
        const latestLng =
          currentLng ??
          endLng ??
          startLng ??
          (points.length > 0 ? points[points.length - 1].longitude : null);

        if (latestLat && latestLng) {
          const exists = userRouteCoords.some(
            ([la, lo]) =>
              Math.abs(la - Number(latestLat)) < 0.0001 &&
              Math.abs(lo - Number(latestLng)) < 0.0001,
          );
          if (!exists) {
            userRouteCoords.push([Number(latestLat), Number(latestLng)]);
          }
          allBoundsCoords.push([Number(latestLat), Number(latestLng)]);
        }

        // Draw User's Travel Route Polyline if 2 or more coordinates exist
        if (userRouteCoords.length >= 2) {
          // Glow underlay
          const glow = L.polyline(userRouteCoords, {
            color: userColor,
            weight: 6,
            opacity: 0.35,
            lineCap: "round",
            lineJoin: "round",
          });
          glow.on("click", () => handleSelectUser(item));
          markersGroup.addLayer(glow);

          // Solid line with color
          const polyline = L.polyline(userRouteCoords, {
            color: userColor,
            weight: 3.5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          });
          polyline.on("click", () => handleSelectUser(item));
          markersGroup.addLayer(polyline);

          // Add Start Punch Pin if distinct from latest location
          if (
            startLat &&
            startLng &&
            latestLat &&
            latestLng &&
            (Math.abs(Number(startLat) - Number(latestLat)) > 0.0005 ||
              Math.abs(Number(startLng) - Number(latestLng)) > 0.0005)
          ) {
            const startMarker = L.marker([Number(startLat), Number(startLng)], {
              icon: createStartMarkerIcon(name, userColor),
            });
            startMarker.on("click", () => handleSelectUser(item));
            markersGroup.addLayer(startMarker);
          }
        }

        // Add Latest Location Marker with Full User Name Badge on Top!
        if (latestLat && latestLng) {
          const markerPos = [Number(latestLat), Number(latestLng)];
          const marker = L.marker(markerPos, {
            icon: createNamedUserMarkerIcon({
              name,
              color: userColor,
              initials,
              isLive,
              subtitle: item.totalDistanceKm
                ? `${item.totalDistanceKm} km`
                : "",
            }),
          });

          // Popup content with quick "Trace Travel Route" button
          const popupContent = document.createElement("div");
          popupContent.style.fontFamily = "sans-serif";
          popupContent.style.fontSize = "12px";
          popupContent.style.lineHeight = "1.4";
          popupContent.style.color = "#0f172a";
          popupContent.style.padding = "2px";
          popupContent.innerHTML = `
            <div style="font-weight: bold; font-size: 13px; color: ${userColor}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>${name}</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: ${userColor}20; color: ${userColor}; border: 1px solid ${userColor}40;">
                ${isLive ? "Working Now" : isCompleted ? "Completed" : "Auto-Ended"}
              </span>
            </div>
            <div style="margin-top: 4px; color: #475569;">
              <b>Time:</b> ${formatTime(item.lastTrackedAt || item.endTime || item.startTime)}<br/>
              <b>Start:</b> ${item.startLocation || "Office"}<br/>
              <b>Current:</b> ${item.currentLocation || item.endLocation || "Location"}<br/>
              <b>Distance:</b> ${item.totalDistanceKm || 0} km • <b>Duration:</b> ${item.totalHours || "-"}<br/>
              <b>GPS:</b> ${Number(latestLat).toFixed(4)}, ${Number(latestLng).toFixed(4)}
            </div>
            <button id="btn-view-route-${item.id}" style="
              margin-top: 8px;
              width: 100%;
              background: linear-gradient(135deg, ${userColor}, #1d4ed8);
              color: white;
              border: none;
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">
              🗺️ Trace Detailed Route (${userRouteCoords.length} pts)
            </button>
          `;

          marker.bindPopup(popupContent);

          marker.on("popupopen", () => {
            const btn = document.getElementById(`btn-view-route-${item.id}`);
            if (btn) {
              btn.onclick = () => {
                handleSelectUser(item);
              };
            }
          });

          markersGroup.addLayer(marker);
        }
      });

      // Fit map to all users & routes if bounds exist
      if (allBoundsCoords.length > 0) {
        try {
          const bounds = L.latLngBounds(allBoundsCoords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (_) {}
      }
    }
  }, [selectedUser, filteredRecords, travelMode, handleSelectUser]);

  // Fit bounds helper
  const fitMapBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedUser && polylineRef.current) {
      try {
        map.fitBounds(polylineRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 16,
        });
      } catch (_) {}
    } else {
      const coords = filteredRecords
        .map((r) => {
          const lat =
            r.latestLatitude ??
            r.currentLatitude ??
            r.endLatitude ??
            r.startLatitude;
          const lng =
            r.latestLongitude ??
            r.currentLongitude ??
            r.endLongitude ??
            r.startLongitude;
          return lat && lng ? [Number(lat), Number(lng)] : null;
        })
        .filter(Boolean);

      if (coords.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(coords), {
            padding: [50, 50],
            maxZoom: 14,
          });
        } catch (_) {}
      }
    }
  }, [selectedUser, filteredRecords]);

  // If user is not admin, redirect
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = mapData.stats || {
    totalUsers: mapData.data?.length || 0,
    activeCount:
      mapData.data?.filter((r) => r.status === "IN_PROGRESS").length || 0,
    completedCount:
      mapData.data?.filter((r) => r.status === "COMPLETED").length || 0,
    autoEndedCount:
      mapData.data?.filter(
        (r) =>
          r.status === "AUTO_END_WORK" ||
          r.status === "auto_end_work" ||
          r.status === "AUTO_ENDED" ||
          r.status === "END_WORK_HOUR",
      ).length || 0,
    totalDistanceKm:
      mapData.data?.reduce((s, r) => s + (Number(r.totalDistanceKm) || 0), 0) ||
      0,
  };

  return (
    <div className="flex h-[calc(100vh-4.25rem)] w-full flex-col overflow-hidden bg-[#070e1c] text-white">
      {/* Top Header & KPI Bar */}
      <header className="shrink-0 border-b border-white/10 bg-[#0b162c] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Date */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <FiMapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white sm:text-lg">
                  Today&apos;s Live Map
                </h1>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time user locations, movement status & travel routes
              </p>
            </div>
          </div>

          {/* Date Picker & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile View Toggle (Map / Users) */}
            <div className="flex md:hidden items-center rounded-xl bg-white/10 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMobileView("map");
                  setTimeout(
                    () => mapInstanceRef.current?.invalidateSize?.(),
                    100,
                  );
                  setTimeout(
                    () => mapInstanceRef.current?.invalidateSize?.(),
                    300,
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  mobileView === "map"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiMap className="h-3.5 w-3.5" /> Map
              </button>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  mobileView === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiUsers className="h-3.5 w-3.5" /> Users (
                {filteredRecords.length})
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
              <FiCalendar className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedUser(null);
                }}
                className="bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-200 outline-none cursor-pointer [color-scheme:dark]"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(getTodayISTString());
                  setSelectedUser(null);
                }}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  selectedDate === getTodayISTString()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedUser(null);
                }}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  selectedDate === ""
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                title="View all recorded attendance across all dates"
              >
                All
              </button>
            </div>

            {/* Auto Refresh Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                autoRefresh
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
              title="Auto-refresh live locations every 15 seconds"
            >
              <span
                className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
              />
              <span className="hidden sm:inline">Live 15s</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchMapData(false)}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
              title="Refresh GPS Data"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Strip */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 p-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs">
              <FiUsers />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Total Users
              </div>
              <div className="text-sm font-bold text-white">
                {stats.totalUsers}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs">
              <FiActivity className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-blue-300">
                Working Now
              </div>
              <div className="text-sm font-bold text-blue-400">
                {stats.activeCount} Live
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              <FiCheckCircle />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-emerald-300">
                Completed
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {stats.completedCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs">
              <FiClock />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-amber-300">
                Auto Ended
              </div>
              <div className="text-sm font-bold text-amber-400">
                {stats.autoEndedCount}
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs">
              <FiCompass />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-cyan-300">
                Total Distance
              </div>
              <div className="text-sm font-bold text-cyan-400">
                {stats.totalDistanceKm} km
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Panel & Right Map */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Side: Users Drawer / Timeline */}
        <aside
          className={`flex flex-col border-r border-white/10 bg-[#0b1426] md:w-80 lg:w-96 shrink-0 transition-all ${
            mobileView === "list" ? "w-full flex-1" : "hidden md:flex"
          }`}
        >
          {/* Header of Drawer */}
          <div className="border-b border-white/10 p-3 bg-slate-900/40">
            {selectedUser ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <FiArrowLeft className="h-3.5 w-3.5" />
                  <span>All Users</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("list")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      activeTab === "list"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    User Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      activeTab === "timeline"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Timeline ({selectedUser.points?.length || 0})
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-semibold">
                  {[
                    { id: "ALL", label: `All (${mapData.data?.length || 0})` },
                    { id: "IN_PROGRESS", label: `Live (${stats.activeCount})` },
                    {
                      id: "COMPLETED",
                      label: `Done (${stats.completedCount})`,
                    },
                    {
                      id: "AUTO_END_WORK",
                      label: `Auto-End (${stats.autoEndedCount})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`shrink-0 rounded-lg px-2 py-1 transition cursor-pointer ${
                        statusFilter === tab.id
                          ? "bg-blue-600/30 text-blue-300 border border-blue-400/40"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {selectedUser ? (
              activeTab === "list" ? (
                /* Selected User Overview Card */
                <div className="space-y-3 animate-fadeIn">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md">
                        {(selectedUser.user?.name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {selectedUser.user?.name ||
                            `Employee #${selectedUser.userId}`}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          {selectedUser.user?.email || "No email"}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            selectedUser.status === "IN_PROGRESS"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse"
                              : selectedUser.status === "COMPLETED"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                          }`}
                        >
                          {selectedUser.status === "IN_PROGRESS"
                            ? "Active / Working Now"
                            : selectedUser.status === "COMPLETED"
                              ? "Shift Completed"
                              : "Auto Ended at 10 PM"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400">
                          Total Distance
                        </span>
                        <div className="font-bold text-cyan-300">
                          {selectedUser.totalDistanceKm || 0} km
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">
                          Shift Duration
                        </span>
                        <div className="font-bold text-amber-300">
                          {selectedUser.totalHours || "In progress"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Punch In */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        🟢 Punch In (Start)
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {formatTime(selectedUser.startTime)}
                      </span>
                    </div>
                    <p className="text-slate-300 truncate">
                      {selectedUser.startLocation || "Office Workspace"}
                    </p>
                    {selectedUser.startLatitude && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Coords: {Number(selectedUser.startLatitude).toFixed(4)},{" "}
                        {Number(selectedUser.startLongitude).toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* Punch Out / Live */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs">
                    <div className="flex items-center justify-between text-blue-400 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        {selectedUser.status === "IN_PROGRESS"
                          ? "📡 Current Live Location"
                          : "🔴 Punch Out (End)"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {formatTime(
                          selectedUser.endTime || selectedUser.lastTrackedAt,
                        )}
                      </span>
                    </div>
                    <p className="text-slate-300 truncate">
                      {selectedUser.endLocation ||
                        selectedUser.currentLocation ||
                        "Location recorded"}
                    </p>
                    {(selectedUser.endLatitude ||
                      selectedUser.currentLatitude) && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Coords:{" "}
                        {Number(
                          selectedUser.endLatitude ||
                            selectedUser.currentLatitude,
                        ).toFixed(4)}
                        ,{" "}
                        {Number(
                          selectedUser.endLongitude ||
                            selectedUser.currentLongitude,
                        ).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected User Timeline */
                <div className="space-y-2 text-xs animate-fadeIn">
                  {/* Start Point */}
                  <div className="rounded-xl border border-emerald-500/30 bg-white/5 p-2.5">
                    <div className="flex items-center justify-between font-bold text-emerald-400">
                      <span>🟢 Punch In</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatTime(selectedUser.startTime)}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5 truncate">
                      {selectedUser.startLocation || "Office"}
                    </p>
                  </div>

                  {/* Waypoints */}
                  {(selectedUser.points || []).length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-center text-slate-400 text-xs">
                      No intermediate trail waypoints recorded.
                    </div>
                  ) : (
                    selectedUser.points.map((pt, i) => (
                      <div
                        key={pt.id || i}
                        className="rounded-xl border border-white/5 bg-white/5 p-2.5 hover:border-indigo-500/30 transition"
                      >
                        <div className="flex items-center justify-between font-semibold text-indigo-300">
                          <span>📍 Stop #{i + 1}</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {formatTime(pt.recordedAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5 truncate">
                          {pt.locationName || "Trail waypoint"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {Number(pt.latitude).toFixed(4)},{" "}
                          {Number(pt.longitude).toFixed(4)}
                          {pt.speed
                            ? ` • ${(pt.speed * 3.6).toFixed(1)} km/h`
                            : ""}
                        </p>
                      </div>
                    ))
                  )}

                  {/* End Point */}
                  <div className="rounded-xl border border-red-500/30 bg-white/5 p-2.5">
                    <div className="flex items-center justify-between font-bold text-red-400">
                      <span>
                        {selectedUser.status === "IN_PROGRESS"
                          ? "📡 Current Live"
                          : "🔴 Punch Out"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatTime(
                          selectedUser.endTime || selectedUser.lastTrackedAt,
                        )}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5 truncate">
                      {selectedUser.endLocation ||
                        selectedUser.currentLocation ||
                        "Location recorded"}
                    </p>
                  </div>
                </div>
              )
            ) : filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center text-slate-400 text-xs">
                <FiUsers className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">
                  No employees found
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {searchQuery
                    ? "Try refining your search filter"
                    : "No attendance recorded for this date"}
                </p>
              </div>
            ) : (
              /* All Users List */
              filteredRecords.map((item) => {
                const name = item.user?.name || `Employee #${item.userId}`;
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                const isLive = item.status === "IN_PROGRESS";
                const isCompleted = item.status === "COMPLETED";

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectUser(item)}
                    className="group relative cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-blue-500/50 hover:bg-white/10 active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-white border border-white/10 group-hover:border-blue-400">
                          {initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1426] ${
                            isLive
                              ? "bg-emerald-400 animate-pulse"
                              : isCompleted
                                ? "bg-blue-400"
                                : "bg-amber-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">
                            {name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatTime(
                              item.lastTrackedAt ||
                                item.endTime ||
                                item.startTime,
                            )}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.currentLocation ||
                            item.endLocation ||
                            item.startLocation ||
                            "Office Workspace"}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                          <span className="font-semibold text-cyan-300">
                            {item.totalDistanceKm || 0} km
                          </span>
                          <span>{item.totalHours || "In progress"}</span>
                          <span className="flex items-center gap-0.5 text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                            Route <FiChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Side: Interactive Leaflet Map */}
        <main
          className={`relative flex-1 w-full h-full overflow-hidden bg-slate-950 ${
            mobileView === "map"
              ? "flex flex-col"
              : "hidden md:flex md:flex-col"
          }`}
        >
          {/* Floating Top Route Controller (when user is selected) */}
          {selectedUser && (
            <div className="absolute top-3 left-3 right-3 z-[1001] flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/20 bg-slate-900/90 p-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex h-8 items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <FiArrowLeft /> Back
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {selectedUser.user?.name ||
                      `Employee #${selectedUser.userId}`}{" "}
                    Route
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {selectedUser.totalDistanceKm || 0} km •{" "}
                    {selectedUser.points?.length || 0} waypoints
                  </div>
                </div>
              </div>

              {/* Mode switch (Exact Walk vs Road Snapped) */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTravelMode("exact")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    travelMode === "exact"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                  title="Exact walk/travel GPS trail connecting all recorded points"
                >
                  📍 Exact Trail
                </button>
                <button
                  type="button"
                  onClick={() => setTravelMode("road")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    travelMode === "road"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/40"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                  title="Snap route to car driving roads"
                >
                  🚗 Road Driving
                </button>
              </div>
            </div>
          )}

          {/* Floating Map Actions (Bottom-Left / Top-Right) */}
          <div className="absolute bottom-6 left-6 z-[1001] flex items-center gap-2">
            <button
              type="button"
              onClick={fitMapBounds}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            >
              <FiMaximize2 className="text-blue-400" />
              <span>{selectedUser ? "Fit Route" : "Fit All Users"}</span>
            </button>
          </div>

          {/* Floating Mobile Toggle Button on Map */}
          <div className="md:hidden absolute bottom-6 right-6 z-[1001]">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-600/90 px-3 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md active:scale-95 transition cursor-pointer"
            >
              <FiUsers className="h-4 w-4" />
              <span>Users ({filteredRecords.length})</span>
            </button>
          </div>

          {/* Map Legend (Bottom Right - Desktop) */}
          <div className="absolute bottom-6 right-16 z-[1001] hidden sm:flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-slate-300 shadow-xl backdrop-blur-md">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Start
              / Done
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />{" "}
              Live Working
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{" "}
              Auto-Ended
            </span>
          </div>

          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="h-full w-full z-10" />
        </main>
      </div>
    </div>
  );
}
