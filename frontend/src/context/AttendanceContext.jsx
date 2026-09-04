import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth.js";
import { attendanceApi } from "../features/attendance/attendanceApi.js";

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [statusLoading, setStatusLoading] = useState(false);
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [isWorkEnded, setIsWorkEnded] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isCurrentTimeAfter8AM = () => {
    const now = new Date();
    return now.getHours() >= 8;
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
      statusLoading,
      isSubmitting,
      showStartModal,
      showEndModal,
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
      statusLoading,
      isSubmitting,
      showStartModal,
      showEndModal,
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
