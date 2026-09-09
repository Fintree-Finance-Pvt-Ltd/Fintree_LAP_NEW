import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiX,
  FiArrowRight,
  FiBookmark,
} from "react-icons/fi";

const QUICK_DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 2 Days", days: 2 },
  { label: "In 3 Days", days: 3 },
  { label: "Next Week", days: 7 },
];

const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
  "06:30 PM",
];

const OBJECTIVE_TAGS = [
  "KYC Document Collection",
  "Property Site Inspection",
  "Income Verification",
  "Applicant Meeting / Discussion",
  "Co-Applicant Signature",
];

function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ScheduleFollowUpModal({
  isOpen,
  onClose,
  onConfirm,
  customerName = "",
  initialDate = "",
  initialTime = "10:00 AM",
  initialNotes = "",
  isSaving = false,
}) {
  const [followUpDate, setFollowUpDate] = useState(() => initialDate || formatDateForInput(new Date()));
  const [followUpTime, setFollowUpTime] = useState(() => initialTime || "10:00 AM");
  const [followUpNotes, setFollowUpNotes] = useState(() => initialNotes || "");

  useEffect(() => {
    if (isOpen) {
      setFollowUpDate(initialDate || formatDateForInput(new Date()));
      setFollowUpTime(initialTime || "10:00 AM");
      setFollowUpNotes(initialNotes || "");
    }
  }, [isOpen, initialDate, initialTime, initialNotes]);

  if (!isOpen) return null;

  const handlePresetDate = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setFollowUpDate(formatDateForInput(target));
  };

  const handleAddTag = (tag) => {
    if (!followUpNotes.includes(tag)) {
      setFollowUpNotes((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const handleSaveWithFollowUp = () => {
    onConfirm({
      nextFollowUpDate: followUpDate,
      followUpTime,
      followUpNotes: followUpNotes.trim(),
      followUpStatus: "PENDING",
    });
  };

  const handleSaveDraftOnly = () => {
    onConfirm({
      nextFollowUpDate: null,
      followUpTime: null,
      followUpNotes: null,
      followUpStatus: "DRAFT_ONLY",
    });
  };

  const todayStr = formatDateForInput(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
                <FiCalendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Schedule Next Follow-Up
                </h3>
                <p className="mt-0.5 text-xs font-medium text-blue-100">
                  {customerName ? `Lead: ${customerName}` : "Keep this draft active in your daily workflow"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {/* Quick Date Chips */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Date Select
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_DATE_PRESETS.map((preset) => {
                const presetDate = new Date();
                presetDate.setDate(presetDate.getDate() + preset.days);
                const isSelected = followUpDate === formatDateForInput(presetDate);

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetDate(preset.days)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker Input */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FiCalendar className="text-blue-600" />
                Next Follow-Up Date *
              </label>
              <input
                type="date"
                min={todayStr}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FiClock className="text-blue-600" />
                Preferred Time
              </label>
              <input
                type="text"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                placeholder="e.g. 10:30 AM"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Time Slot Chips */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Popular Time Slots
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setFollowUpTime(slot)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    followUpTime === slot
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Objective / Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FiFileText className="text-blue-600" />
              Follow-Up Purpose & Notes
            </label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="e.g. Collect Property registry papers, meet borrower at shop..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Quick tags:</span>
              {OBJECTIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Info */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 flex items-start gap-3">
            <FiBookmark className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-900">
              On this follow-up date, this case will automatically appear on your daily smart route map planner.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSaveDraftOnly}
            disabled={isSaving}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            Save Draft (Skip Follow-Up)
          </button>

          <button
            type="button"
            onClick={handleSaveWithFollowUp}
            disabled={isSaving || !followUpDate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <FiCheckCircle className="h-4 w-4" />
                <span>Save & Schedule Follow-Up</span>
                <FiArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
