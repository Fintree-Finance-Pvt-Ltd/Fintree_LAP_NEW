export default function CreateLeadFooter({
  currentStep,
  setCurrentStep,
  navigate,
  handleSaveDraft,
  handleSubmitForReview,
  isPending,
  isWorkStarted,
  applicationId,
  saveNewDraftMutation,
  updateDraftMutation,
  submitDraftMutation,
}) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 border-t border-slate-200 bg-slate-50/90 z-20">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-98 cursor-pointer"
      >
        Cancel
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => {
            setCurrentStep((prev) => Math.max(1, prev - 1));
            document
              .getElementById("create-lead-step-scroll-container")
              ?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all active:scale-98 cursor-pointer"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending || (!isWorkStarted && !applicationId)}
          className="rounded-xl border border-blue-200 bg-blue-50/80 px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
        >
          {saveNewDraftMutation.isPending || updateDraftMutation.isPending
            ? "Saving..."
            : "Save Draft"}
        </button>

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={() => {
              setCurrentStep((prev) => Math.min(6, prev + 1));
              document
                .getElementById("create-lead-step-scroll-container")
                ?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-98 cursor-pointer"
          >
            <span>Next</span>
            <span className="text-sm">→</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={isPending || (!isWorkStarted && !applicationId)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:bg-slate-300 transition-all active:scale-98 cursor-pointer"
          >
            <span>
              {submitDraftMutation.isPending
                ? "Submitting..."
                : "Submit for Underwriting"}
            </span>
            <span>🚀</span>
          </button>
        )}
      </div>
    </div>
  );
}
