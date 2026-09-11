import { useState, useRef } from "react";
import {
  FiCamera,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiHelpCircle,
  FiInfo,
  FiLoader,
  FiUploadCloud,
  FiX,
  FiZap,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { createWorker } from "tesseract.js";
import { claimsApi } from "../claimsApi.js";
import { extractDetailsFromOcr } from "../utils/receiptExtractor.js";
import LiveCameraCaptureModal from "./LiveCameraCaptureModal.jsx";

const CATEGORIES = [
  { value: "TRAVEL", label: "Travel & Commute (Taxi/Flight/Train)", icon: "🚕" },
  { value: "FUEL", label: "Fuel / Petrol / Diesel / CNG", icon: "⛽" },
  { value: "FOOD", label: "Food & Meals / Refreshments", icon: "🍔" },
  { value: "HOTEL", label: "Hotel & Lodging / Stay", icon: "🏨" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies & Printing", icon: "📎" },
  { value: "CLIENT_ENTERTAINMENT", label: "Client Entertainment / Meeting", icon: "🤝" },
  { value: "INTERNET_PHONE", label: "Mobile / Internet / Telecom", icon: "📱" },
  { value: "MEDICAL", label: "Medical / Pharmacy", icon: "💊" },
  { value: "OTHER", label: "Miscellaneous / Other", icon: "📝" },
];

export default function ApplyClaimModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "OTHER",
    amount: "",
    taxAmount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    merchantName: "",
    invoiceNumber: "",
    gstNumber: "",
    description: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrRawText, setOcrRawText] = useState("");
  const [extractedSummary, setExtractedSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file) => {
    if (!file) return;

    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedMime.includes(file.mimetype || file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP image or PDF bill.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Receipt file size cannot exceed 20MB.");
      return;
    }

    setReceiptFile(file);

    // If image, create preview & run OCR extraction
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
      runOcrScan(file);
    } else {
      setReceiptPreview(null);
      setExtractedSummary(null);
    }
  };

  const runOcrScan = async (imageFile) => {
    setOcrScanning(true);
    setOcrProgress(10);
    setOcrStatusText("Initializing AI OCR Engine...");
    setExtractedSummary(null);

    let worker = null;
    try {
      worker = await createWorker('eng');
      setOcrProgress(40);
      setOcrStatusText("Analyzing Bill & Extracting Text...");

      const ret = await worker.recognize(imageFile);
      setOcrProgress(80);
      setOcrStatusText("Parsing Details & Mapping Fields...");

      const text = ret.data.text || "";
      setOcrRawText(text);

      const extracted = extractDetailsFromOcr(text);

      // Auto-fill fields if found
      setFormData((prev) => ({
        ...prev,
        amount: extracted.amount || prev.amount,
        taxAmount: extracted.taxAmount || prev.taxAmount,
        expenseDate: extracted.date || prev.expenseDate,
        merchantName: extracted.merchantName || prev.merchantName,
        invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
        gstNumber: extracted.gstNumber || prev.gstNumber,
        category: extracted.category !== "OTHER" ? extracted.category : prev.category,
        title: prev.title || (extracted.merchantName ? `${extracted.merchantName} Expense` : ""),
      }));

      setExtractedSummary(extracted);
      setOcrProgress(100);
      setOcrStatusText("OCR Complete!");
      toast.success("Bill scanned! Fields auto-filled. Please review and submit.");
    } catch (err) {
      console.warn("OCR recognition error:", err);
      toast.info("Could not auto-extract all fields. You can enter them manually.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setOcrScanning(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter expense title / purpose.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    if (!formData.expenseDate) {
      toast.error("Please select the expense date.");
      return;
    }

    setSubmitting(true);
    try {
      let receiptData = {};

      // 1. Upload receipt if selected
      if (receiptFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", receiptFile);

        const uploadRes = await claimsApi.uploadReceipt(uploadForm);
        const uploaded = uploadRes.data?.data || uploadRes.data;

        receiptData = {
          receiptUrl: uploaded.url,
          receiptOriginalName: uploaded.originalName,
          receiptMimeType: uploaded.mimeType,
          receiptSize: uploaded.size,
          ocrRawText: ocrRawText || undefined,
        };
      }

      // 2. Submit Claim
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
        expenseDate: formData.expenseDate,
        merchantName: formData.merchantName?.trim() || undefined,
        invoiceNumber: formData.invoiceNumber?.trim() || undefined,
        gstNumber: formData.gstNumber?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        ...receiptData,
      };

      const res = await claimsApi.applyClaim(payload);
      toast.success(res.data?.message || "Expense claim submitted successfully!");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit claim. Please try again.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Submit Expense Claim
              </h2>
              <p className="text-xs text-slate-500">
                Upload bill to auto-extract details or fill manually
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Bill Receipt Upload & Auto-Scan Area */}
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4 sm:p-5 transition hover:border-blue-400">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {receiptPreview ? (
                <div className="relative group shrink-0">
                  <img
                    src={receiptPreview}
                    alt="Receipt Preview"
                    className="h-24 w-24 object-cover rounded-xl border border-blue-300 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                      setExtractedSummary(null);
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition cursor-pointer"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-200">
                  <FiUploadCloud className="h-8 w-8" />
                </div>
              )}

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {receiptFile ? receiptFile.name : "Upload Bill / Receipt"}
                  </span>
                  {ocrScanning && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                      <FiLoader className="h-3 w-3 animate-spin" />
                      Scanning... {ocrProgress}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {ocrScanning
                    ? ocrStatusText
                    : "Supports JPG, PNG, WEBP, or PDF up to 20MB. AI auto-reads amount & details."}
                </p>

                {/* Upload Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrScanning}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition cursor-pointer"
                  >
                    <FiUploadCloud className="h-3.5 w-3.5" />
                    <span>Choose File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={ocrScanning}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    <FiCamera className="h-3.5 w-3.5" />
                    <span>Snap Photo (Camera)</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />

                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>

            {/* Extracted Highlights Banner */}
            {extractedSummary && !ocrScanning && (
              <div className="mt-3.5 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold">Smart Auto-Fill Applied:</div>
                  <div className="text-[11px] text-emerald-700 flex flex-wrap gap-x-3 gap-y-1">
                    {extractedSummary.amount && (
                      <span>
                        Amount: <strong>₹{extractedSummary.amount}</strong>
                      </span>
                    )}
                    {extractedSummary.date && (
                      <span>
                        Date: <strong>{extractedSummary.date}</strong>
                      </span>
                    )}
                    {extractedSummary.merchantName && (
                      <span>
                        Merchant: <strong>{extractedSummary.merchantName}</strong>
                      </span>
                    )}
                    {extractedSummary.invoiceNumber && (
                      <span>
                        Bill#: <strong>{extractedSummary.invoiceNumber}</strong>
                      </span>
                    )}
                    {extractedSummary.category && (
                      <span>
                        Category: <strong>{extractedSummary.category}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title / Purpose */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Expense Title / Purpose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Client visit taxi fare to BKC office"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Total Claim Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Expense Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Bill / Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Merchant / Vendor Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Merchant / Store / Vendor Name
              </label>
              <input
                type="text"
                name="merchantName"
                value={formData.merchantName}
                onChange={handleInputChange}
                placeholder="e.g. Uber, Indian Oil, Taj Hotel"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Invoice / Bill Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Invoice / Bill / Receipt Number
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="e.g. INV-2026-081"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* GSTIN (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Merchant GSTIN (Optional)
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Description / Remarks */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Expense Notes / Remarks (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide any additional project, customer, or travel details..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || ocrScanning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  <span>Submitting Claim...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Submit Expense Claim</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedFile) => handleFileSelect(capturedFile)}
      />
    </div>
  );
}
