/**
 * Standard shift target in minutes: 8 hours 30 mins (8.30 hrs) = 510 minutes
 */
export const TARGET_WORKING_MINUTES = 510;
export const TARGET_HOURS_LABEL = "8h 30m (8.30 hrs)";

/**
 * Robust date parser that handles ISO strings, "YYYY-MM-DD HH:mm:ss", Date objects, timestamps
 */
export function parseAttendanceDateMs(val) {
  if (!val) return null;
  if (val instanceof Date) return val.getTime();
  if (typeof val === "number") return val;

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Replace space between date and time with T if not present
    const isoClean = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const parsed = new Date(isoClean).getTime();
    if (!isNaN(parsed)) return parsed;

    // Fallback standard parse
    const fallback = new Date(trimmed).getTime();
    if (!isNaN(fallback)) return fallback;
  }

  return null;
}

/**
 * Formats integer minutes into clean "Xh Ym" string
 */
export function formatMinutesToDuration(minutes) {
  if (!minutes || minutes <= 0) return "0h 0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/**
 * Calculates accurate working duration for any attendance record
 */
export function calculateRecordDuration(record) {
  if (!record) {
    return {
      totalMinutes: 0,
      formattedDuration: "0h 0m",
      hours: 0,
      minutes: 0,
      progressPercent: 0,
      isFullShift: false,
    };
  }

  const startMs = parseAttendanceDateMs(record.startTime || record.start_time);
  const endMs = parseAttendanceDateMs(record.endTime || record.end_time);

  let totalMinutes = 0;

  // 1. If start and end time exist, ALWAYS calculate exact difference between them
  if (startMs && endMs && endMs >= startMs) {
    totalMinutes = Math.round((endMs - startMs) / 60000);
  } else if (
    startMs &&
    (record.status === "IN_PROGRESS" || (!endMs && record.status !== "COMPLETED"))
  ) {
    // 2. Live in-progress session
    totalMinutes = Math.max(0, Math.round((Date.now() - startMs) / 60000));
  } else if (record.totalMinutes || record.total_minutes) {
    // 3. Fallback to pre-calculated totalMinutes
    totalMinutes = Number(record.totalMinutes || record.total_minutes);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration = formatMinutesToDuration(totalMinutes);
  const progressPercent = Math.min(
    100,
    Math.round((totalMinutes / TARGET_WORKING_MINUTES) * 100)
  );
  const isFullShift = totalMinutes >= TARGET_WORKING_MINUTES;

  return {
    totalMinutes,
    formattedDuration,
    hours,
    minutes,
    progressPercent,
    isFullShift,
  };
}
