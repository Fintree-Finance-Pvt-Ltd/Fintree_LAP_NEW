import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth.js";
import { attendanceApi } from "../features/attendance/attendanceApi.js";
import { reverseGeocodeCoords, saveLastKnownCoords } from "../utils/geoUtils.js";

const AttendanceContext = createContext(null);

// Haversine distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function AttendanceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [statusLoading, setStatusLoading] = useState(false);
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [isWorkEnded, setIsWorkEnded] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastTrackTimeRef = useRef(0);
  const lastCoordsRef = useRef(null);
  const isPingingRef = useRef(false);
  const [currentCoords, setCurrentCoords] = useState(null);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setIsWorkStarted(false);
      setIsWorkEnded(false);
      setAttendanceRecord(null);
      setShowStartModal(false);
      return;
    }

    try {
      setStatusLoading(true);
      const res = await attendanceApi.getTodayStatus();
      const data = res?.data || res;

      const started = Boolean(data?.isWorkStarted);
      const ended = Boolean(data?.isWorkEnded);

      setIsWorkStarted(started);
      setIsWorkEnded(ended);
      setAttendanceRecord(data?.record || null);

      const todayStr = getTodayStr();
      const dismissedKey = `lap_attendance_dismissed_${todayStr}_${user.id}`;
      const isDismissed = sessionStorage.getItem(dismissedKey) === "true";

      // Auto-open popup on login if user has not started work today
      if (!started && !isDismissed) {
        setShowStartModal(true);
      } else {
        setShowStartModal(false);
      }
    } catch (error) {
      console.warn("Unable to fetch attendance status:", error);
      // Fallback: If status check had issue, prompt if not dismissed
      const todayStr = getTodayStr();
      const dismissedKey = `lap_attendance_dismissed_${todayStr}_${user.id}`;
      if (sessionStorage.getItem(dismissedKey) !== "true") {
        setShowStartModal(true);
      }
    } finally {
      setStatusLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchStatus();

      // Check periodically (every 5 minutes) in case the clock crosses 8:00 AM or a new day begins
      const interval = setInterval(() => {
        fetchStatus();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    } else {
      setIsWorkStarted(false);
      setIsWorkEnded(false);
      setAttendanceRecord(null);
      setShowStartModal(false);
      setShowEndModal(false);
    }
  }, [isAuthenticated, user?.id, fetchStatus]);

  const [isLocationDisabledDuringWork, setIsLocationDisabledDuringWork] = useState(false);
  const [locationErrorDetails, setLocationErrorDetails] = useState(null);

  const retryRequestLocationPermission = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocationDisabledDuringWork(false);
        setLocationErrorDetails(null);
      },
      (err) => {
        setIsLocationDisabledDuringWork(true);
        const msg =
          err.code === 1
            ? "Location permission was denied in browser. Please enable location permission."
            : err.code === 2
            ? "Device GPS/Location services are turned off. Please turn on GPS."
            : "Location request timed out. Retrying...";
        setLocationErrorDetails(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

// Background Keep-Alive for Mobile Browsers (prevents OS from pausing GPS when screen is in pocket)
function startBackgroundKeepAlive() {
  let audioContext = null;
  let oscillator = null;
  let wakeLock = null;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
      oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.00001; // Inaudible silent sound
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
    }
  } catch (e) {
    console.debug("Background audio keepalive note:", e?.message);
  }

  // Request Screen WakeLock if supported
  if (typeof navigator !== "undefined" && navigator.wakeLock) {
    navigator.wakeLock.request("screen").then((lock) => {
      wakeLock = lock;
    }).catch(() => {});
  }

  return () => {
    try {
      if (oscillator) oscillator.stop();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (wakeLock) wakeLock.release();
    } catch (_) {}
  };
}

  // Live Location Tracking during active work day
  useEffect(() => {
    let watchId = null;
    let heartbeatTimer = null;
    let permissionPromptRetryTimer = null;
    let stopKeepAlive = null;

    if (isAuthenticated && isWorkStarted && !isWorkEnded && typeof navigator !== "undefined" && navigator.geolocation) {
      console.log("📍 Continuous GPS route tracking active for user work session (with pocket background keep-alive)...");

      // Start background keepalive to keep GPS running when phone screen is locked
      stopKeepAlive = startBackgroundKeepAlive();

      const handleLocationSuccess = (pos) => {
        setIsLocationDisabledDuringWork(false);
        setLocationErrorDetails(null);
        sendLocationPing(pos);
      };

      const handleLocationError = (err) => {
        console.warn("GPS tracking error during active work:", err?.message);
        setIsLocationDisabledDuringWork(true);
        const msg =
          err.code === 1
            ? "Location permission was denied. Please allow location access."
            : err.code === 2
            ? "Device GPS/location services are turned off. Please enable GPS."
            : "Location tracking error. Retrying...";
        setLocationErrorDetails(msg);
      };

      const sendLocationPing = async (pos) => {
        if (!pos?.coords || isPingingRef.current) return;

        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const now = Date.now();

        // Update local state with latest position
        saveLastKnownCoords(latitude, longitude);
        setCurrentCoords({
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: now,
        });

        // Determine if we should transmit ping to backend
        const last = lastCoordsRef.current;
        const timeSinceLastPing = now - lastTrackTimeRef.current;
        let distanceMovedMeters = 0;

        if (last) {
          distanceMovedMeters = getDistanceMeters(last.latitude, last.longitude, latitude, longitude);
        }

        // Send ping if:
        // 1. First ping (last === null)
        // 2. User moved >= 1 meter
        // 3. At least 5 seconds elapsed since last update
        const shouldSend = !last || distanceMovedMeters >= 1 || timeSinceLastPing >= 5 * 1000;

        if (shouldSend) {
          isPingingRef.current = true;
          lastTrackTimeRef.current = now;
          lastCoordsRef.current = { latitude, longitude };

          const lat = parseFloat(Number(latitude).toFixed(7));
          const lng = parseFloat(Number(longitude).toFixed(7));

          console.log(`📡 [GPS Live Ping] Sending location to DB -> Lat: ${lat}, Lng: ${lng}, Moved: ${distanceMovedMeters.toFixed(1)}m, Time: ${(timeSinceLastPing / 1000).toFixed(1)}s`);

          try {
            const rawId = attendanceRecord?.id;
            const attId = rawId !== undefined && rawId !== null && !isNaN(Number(rawId)) ? Number(rawId) : undefined;

            const res = await attendanceApi.trackLocation({
              ...(attId !== undefined ? { attendanceId: attId } : {}),
              latitude: lat,
              longitude: lng,
              accuracy: accuracy ? parseFloat(accuracy.toFixed(1)) : undefined,
              speed: speed !== null && speed !== undefined ? parseFloat(Number(speed).toFixed(2)) : undefined,
              heading: heading !== null && heading !== undefined ? parseFloat(Number(heading).toFixed(1)) : undefined,
            });

            console.log(`✅ [GPS Live Ping] Saved to lap_attendance_locations table! Attendance ID: ${attendanceRecord?.id}`);

            // Update live attendance record with new coordinates and distance
            const trackData = res?.data?.data || res?.data;
            if (trackData) {
              setAttendanceRecord((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentLatitude: lat,
                  currentLongitude: lng,
                  currentLocation: trackData.locationName || prev.currentLocation,
                  lastTrackedAt: new Date().toISOString(),
                  totalDistanceKm: trackData.totalDistanceKm ?? prev.totalDistanceKm,
                };
              });
            }
          } catch (err) {
            console.warn("⚠️ Background tracking ping skipped:", err?.message);
          } finally {
            // Safety unlock
            setTimeout(() => {
              isPingingRef.current = false;
            }, 1000);
          }
        }
      };

      try {
        // High accuracy continuous watcher with zero cache to pick up movement immediately
        watchId = navigator.geolocation.watchPosition(
          handleLocationSuccess,
          handleLocationError,
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        // Heartbeat interval (every 5 seconds) to ensure tracking stays active continuously
        heartbeatTimer = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            handleLocationError,
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        }, 5 * 1000);

        // Persistent re-request loop: If location is turned off or denied, re-prompt every 5 seconds
        permissionPromptRetryTimer = setInterval(() => {
          if (isLocationDisabledDuringWork) {
            console.log("🔄 Re-requesting location permission after location was turned off...");
            retryRequestLocationPermission();
          }
        }, 5000);

        // Wake handler: capture immediate position when user switches back to this tab
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            navigator.geolocation.getCurrentPosition(
              handleLocationSuccess,
              handleLocationError,
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleVisibilityChange);

        return () => {
          if (stopKeepAlive) stopKeepAlive();
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (permissionPromptRetryTimer) clearInterval(permissionPromptRetryTimer);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("focus", handleVisibilityChange);
        };
      } catch (e) {
        console.warn("Geolocation watch error:", e);
      }
    }
  }, [isAuthenticated, isWorkStarted, isWorkEnded, attendanceRecord?.id, isLocationDisabledDuringWork, retryRequestLocationPermission]);

  const dismissStartModalForSession = () => {
    if (user?.id) {
      const todayStr = getTodayStr();
      sessionStorage.setItem(`lap_attendance_dismissed_${todayStr}_${user.id}`, "true");
    }
    setShowStartModal(false);
  };

  const startWork = async (locationPayload = {}) => {
    try {
      setIsSubmitting(true);
      const res = await attendanceApi.startWork(locationPayload);
      const savedData = res?.data?.data || res?.data || res;

      setIsWorkStarted(true);
      setIsWorkEnded(false);
      setAttendanceRecord(savedData);
      setShowStartModal(false);
      return { success: true, data: savedData };
    } catch (error) {
      console.error("Failed to start work:", error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || "Failed to start work",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const endWork = async (locationPayload = {}) => {
    try {
      setIsSubmitting(true);
      const res = await attendanceApi.endWork(locationPayload);
      const updatedData = res?.data?.data || res?.data || res;

      setIsWorkEnded(true);
      setAttendanceRecord(updatedData);
      return { success: true, data: updatedData };
    } catch (error) {
      console.error("Failed to end work:", error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || "Failed to end work",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = useMemo(
    () => ({
      isWorkStarted,
      isWorkEnded,
      attendanceRecord,
      currentCoords,
      statusLoading,
      isSubmitting,
      showStartModal,
      showEndModal,
      isLocationDisabledDuringWork,
      locationErrorDetails,
      retryRequestLocationPermission,
      setShowStartModal,
      setShowEndModal,
      dismissStartModalForSession,
      fetchStatus,
      startWork,
      endWork,
    }),
    [
      isWorkStarted,
      isWorkEnded,
      attendanceRecord,
      currentCoords,
      statusLoading,
      isSubmitting,
      showStartModal,
      showEndModal,
      isLocationDisabledDuringWork,
      locationErrorDetails,
      retryRequestLocationPermission,
      fetchStatus,
    ]
  );


  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
