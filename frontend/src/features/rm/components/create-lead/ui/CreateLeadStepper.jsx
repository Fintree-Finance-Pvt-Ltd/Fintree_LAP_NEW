import { STEPS } from "../constants/createLeadConstants.js";
import { getStepIcon } from "./CreateLeadUI.jsx";

export default function CreateLeadStepper({ currentStep, setCurrentStep }) {
  return (
    <div className="w-full md:w-64 lg:w-72 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 p-4 sm:p-5 flex md:flex-col justify-start shrink-0 overflow-y-auto">
      <div className="flex md:flex-col gap-1.5 md:gap-0 w-full relative">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="relative flex-1 md:flex-initial">
              {/* Vertical connecting line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`hidden md:block absolute left-7 top-10 bottom-0 w-0.5 -translate-x-1/2 ${
                    isCompleted ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(step.id);
                  document
                    .getElementById("create-lead-step-scroll-container")
                    ?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full flex items-center md:items-start gap-3.5 p-2.5 md:p-3 rounded-xl transition-all text-left mb-1 cursor-pointer ${
                  isActive
                    ? "bg-blue-50/90 md:bg-white md:shadow-xs border border-blue-200/90 md:border-slate-200/90 ring-1 ring-blue-500/10"
                    : "hover:bg-slate-100/70"
                }`}
              >
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    getStepIcon(step.id, "h-4 w-4")
                  )}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-slate-900"
                          : "text-slate-600"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {step.subtitle}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
