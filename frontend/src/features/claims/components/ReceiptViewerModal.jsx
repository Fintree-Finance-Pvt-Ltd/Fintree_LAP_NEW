import { useState, useMemo } from "react";
import {
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiMaximize2,
  FiRotateCw,
  FiX,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";

function resolveReceiptUrl(rawUrl) {
  if (!rawUrl) return "";
  const str = String(rawUrl).trim();
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("blob:") || str.startsWith("data:")) {
    return str;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  let host = "http://localhost:9000";
  if (apiBase) {
    try {
      host = new URL(apiBase).origin;
    } catch {
      host = "http://localhost:9000";
    }
  }

  const cleanPath = str.replace(/^\/+/, "");
  return `${host}/${cleanPath}`;
}

export default function ReceiptViewerModal({
  isOpen,
  onClose,
  receiptUrl,
  originalName,
  claimNumber,
  ocrRawText,
  amount,
  merchantName,
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showOcrText, setShowOcrText] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fullUrl = useMemo(() => resolveReceiptUrl(receiptUrl), [receiptUrl]);

  if (!isOpen || !receiptUrl) return null;

  const isPdf =
    receiptUrl.toLowerCase().endsWith(".pdf") ||
    originalName?.toLowerCase().endsWith(".pdf");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col h-[92vh] w-full max-w-4xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {claimNumber ? `Receipt • ${claimNumber}` : "Bill Receipt Preview"}
                </span>
                {amount && (
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    ₹{Number(amount).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {merchantName ? `${merchantName} • ` : ""}
                {originalName || "Uploaded Receipt"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {ocrRawText && (
              <button
                type="button"
                onClick={() => setShowOcrText(!showOcrText)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  showOcrText
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FiFileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {showOcrText ? "Hide OCR" : "View OCR"}
                </span>
              </button>
            )}

            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Open in new tab"
            >
              <FiExternalLink className="h-4 w-4" />
            </a>

            <a
              href={fullUrl}
              download={originalName || "receipt"}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Download Receipt"
            >
              <FiDownload className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-600/30 hover:text-rose-400 transition cursor-pointer"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950/40">
          {/* Main Viewer */}
          <div className="flex-1 relative flex items-center justify-center overflow-auto p-4 select-none">
            {isPdf ? (
              <iframe
                src={`${fullUrl}#toolbar=0`}
                title="Receipt PDF"
                className="w-full h-full rounded-xl border border-slate-800 bg-white"
              />
            ) : imageError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FiFileText className="h-12 w-12 text-slate-600 mb-3" />
                <p className="text-sm font-bold text-slate-300">
                  Receipt preview unavailable
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  The image could not be loaded directly in the modal viewer.
                </p>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <FiExternalLink className="h-4 w-4" />
                  <span>Open in New Tab</span>
                </a>
              </div>
            ) : (
              <div
                className="transition-transform duration-200 ease-out flex items-center justify-center max-h-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={fullUrl}
                  alt="Claim Receipt"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Float Controls for Image Zoom & Rotate */}
            {!isPdf && !imageError && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-xl backdrop-blur-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom Out"
                >
                  <FiZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom In"
                >
                  <FiZoomIn className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Rotate 90°"
                >
                  <FiRotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded bg-slate-800 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* OCR Raw Text Drawer (collapsible) */}
          {showOcrText && ocrRawText && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 p-4 flex flex-col h-60 md:h-full overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Extracted OCR Text
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  AI Scanned
                </span>
              </div>
              <div className="flex-1 overflow-y-auto mt-2 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {ocrRawText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
