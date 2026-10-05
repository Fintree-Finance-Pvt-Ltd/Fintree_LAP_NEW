export default function DocumentUploadCard({
  title,
  isUploaded,
  onView,
  file,
  onFileChange,
  onUpload,
  isUploading,
  fileAccept = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf",
  chooseFileLabel = "Choose File (PDF / Image)",
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-3xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">{title}</span>
        {isUploaded && (
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
              Uploaded
            </span>
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="text-[10px] font-bold text-blue-600 hover:underline transition-all cursor-pointer"
              >
                View
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors truncate">
          <input
            type="file"
            className="hidden"
            accept={fileAccept}
            onChange={onFileChange}
          />
          <span className="truncate max-w-[200px]">
            {file ? file.name : chooseFileLabel}
          </span>
        </label>
        <button
          type="button"
          disabled={!file || isUploading}
          onClick={onUpload}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {file && (
        <p className="text-[11px] font-medium text-slate-600 truncate">
          Selected:{" "}
          <span className="font-semibold text-slate-800">{file.name}</span>
        </p>
      )}
    </div>
  );
}
