import { useMemo, useState } from "react";
import {
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
  FiRotateCw,
  FiX,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";
import { toast } from "react-toastify";

function resolveReceiptUrl(rawUrl) {
  if (!rawUrl) return "";
  const str = String(rawUrl).trim();
  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("blob:") ||
    str.startsWith("data:")
  ) {
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
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleCopyOcr = () => {
    if (!ocrRawText) return;
    navigator.clipboard.writeText(ocrRawText);
    toast.info("OCR raw text copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col h-[92vh] w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono">
                  {claimNumber ? `Receipt • ${claimNumber}` : "Bill Receipt Preview"}
                </span>
                {amount && (
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400 font-mono">
                    ₹{Number(amount).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {merchantName ? `${merchantName} • ` : ""}
                {originalName || "Uploaded Receipt Document"}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {ocrRawText && (
              <button
                type="button"
                onClick={() => setShowOcrText(!showOcrText)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  showOcrText
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FiFileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {showOcrText ? "Hide OCR Text" : "View OCR Text"}
                </span>
              </button>
            )}

            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Open in new window"
            >
              <FiExternalLink className="h-4 w-4" />
            </a>

            <a
              href={fullUrl}
              download={originalName || "receipt"}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Download file"
            >
              <FiDownload className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Floating Zoom & Control Toolbar (for images) */}
        {!isPdf && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              {rotation > 0 && <span>• Rotation: {rotation}°</span>}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom In"
              >
                <FiZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Zoom Out"
              >
                <FiZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Rotate 90 deg"
              >
                <FiRotateCw className="h-3.5 w-3.5" />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                  title="Reset View"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          {/* Document / Image Viewer Canvas */}
          <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={fullUrl}
                title="Receipt Document"
                className="h-full w-full rounded-2xl bg-white border border-slate-800"
              />
            ) : imageError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FiFileText className="h-12 w-12 text-slate-600 mb-2" />
                <p className="text-sm font-bold text-white">
                  Unable to display image directly
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  You can still view or download the attachment file.
                </p>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  <FiExternalLink className="h-3.5 w-3.5" />
                  <span>Open Attached Bill</span>
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full overflow-auto">
                <img
                  src={fullUrl}
                  alt="Receipt Preview"
                  onError={() => setImageError(true)}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-in-out",
                  }}
                  className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl origin-center select-none"
                />
              </div>
            )}
          </div>

          {/* OCR Raw Text Side Drawer */}
          {showOcrText && ocrRawText && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 p-4 flex flex-col gap-2 overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Extracted OCR Text
                </span>
                <button
                  type="button"
                  onClick={handleCopyOcr}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FiCopy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="flex-1 overflow-y-auto text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                {ocrRawText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
