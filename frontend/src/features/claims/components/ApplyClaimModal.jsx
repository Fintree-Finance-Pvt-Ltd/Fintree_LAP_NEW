import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiInfo,
  FiLoader,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiZap,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { createWorker } from "tesseract.js";
import { claimsApi } from "../claimsApi.js";
import { extractDetailsFromOcr } from "../utils/receiptExtractor.js";
import { CATEGORY_META } from "./ClaimApprovalsTable.jsx";
import LiveCameraCaptureModal from "./LiveCameraCaptureModal.jsx";

const CATEGORIES = [
  { value: "TRAVEL", label: "Travel & Commute", sub: "Taxi, Flight, Train, Auto", icon: "🚕" },
  { value: "FUEL", label: "Fuel & Gas", sub: "Petrol, Diesel, CNG", icon: "⛽" },
  { value: "FOOD", label: "Food & Meals", sub: "Meals, Coffee, Refreshments", icon: "🍔" },
  { value: "HOTEL", label: "Hotel & Stay", sub: "Lodging, Room Tariffs", icon: "🏨" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies", sub: "Stationery, Courier, Printing", icon: "📎" },
  { value: "CLIENT_ENTERTAINMENT", label: "Client Meeting", sub: "Business Dinner, Hospitality", icon: "🤝" },
  { value: "INTERNET_PHONE", label: "Telecom & Wifi", sub: "Mobile Bill, Broadband", icon: "📱" },
  { value: "MEDICAL", label: "Medical & Health", sub: "Pharmacy, Doctor, Diagnostics", icon: "💊" },
  { value: "OTHER", label: "Miscellaneous", sub: "Other Official Expenses", icon: "📝" },
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
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData({
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
    setReceiptFile(null);
    setReceiptPreview(null);
    setOcrScanning(false);
    setOcrProgress(0);
    setOcrStatusText("");
    setOcrRawText("");
    setExtractedSummary(null);
    setSubmitting(false);
    setIsCameraOpen(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

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

    if (!allowedMime.includes(file.type)) {
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
    setOcrProgress(15);
    setOcrStatusText("Initializing AI OCR Engine...");
    setExtractedSummary(null);

    let worker = null;
    try {
      worker = await createWorker("eng");
      setOcrProgress(45);
      setOcrStatusText("Analyzing Bill & Extracting Text...");

      const ret = await worker.recognize(imageFile);
      setOcrProgress(80);
      setOcrStatusText("Mapping Fields & Amounts...");

      const text = ret.data.text || "";
      setOcrRawText(text);

      const extracted = extractDetailsFromOcr(text);

      // Auto-fill form fields
      setFormData((prev) => ({
        ...prev,
        amount: extracted.amount || prev.amount,
        taxAmount: extracted.taxAmount || prev.taxAmount,
        expenseDate: extracted.date || prev.expenseDate,
        merchantName: extracted.merchantName || prev.merchantName,
        invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
        gstNumber: extracted.gstNumber || prev.gstNumber,
        category:
          extracted.category !== "OTHER" ? extracted.category : prev.category,
        title:
          prev.title ||
          (extracted.merchantName
            ? `${extracted.merchantName} Expense`
            : ""),
      }));

      setExtractedSummary(extracted);
      setOcrProgress(100);
      setOcrStatusText("Extraction Completed!");
      toast.success("Bill scanned successfully! Details auto-filled below.");
    } catch (err) {
      console.warn("OCR recognition error:", err);
      toast.info("Could not auto-extract all fields. You can fill them manually.");
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

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setExtractedSummary(null);
    setOcrRawText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter expense purpose / title.");
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
      toast.success(
        res.data?.message || "Expense claim submitted successfully!",
      );

      resetForm();
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

  const totalCalculatedAmount =
    (Number(formData.amount) || 0) + (Number(formData.taxAmount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Submit Expense Claim
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload your bill receipt for AI auto-fill or enter details manually.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Bill Upload & AI OCR Scanning (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FiUploadCloud className="h-4 w-4 text-blue-600" />
                  <span>Bill Receipt & AI OCR</span>
                </span>
                {receiptFile && (
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiTrash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Upload Drop Zone / Preview */}
              {!receiptFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/70 text-blue-600 mb-3 shadow-2xs">
                    <FiUploadCloud className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Drag & Drop bill image or PDF
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, WEBP or PDF up to 20MB
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition cursor-pointer"
                    >
                      <FiCamera className="h-3.5 w-3.5" />
                      <span>Take Photo</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Selected File Preview Box */
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-2 text-white shadow-xs">
                    {receiptPreview ? (
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="h-44 w-full object-contain rounded-xl bg-slate-950"
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center text-slate-400">
                        <FiFileText className="h-10 w-10 text-slate-300" />
                        <span className="text-xs font-bold mt-2 text-white">
                          {receiptFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(receiptFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                        </span>
                      </div>
                    )}

                    {/* Laser OCR Scan Animation overlay */}
                    {ocrScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 text-center">
                        <div className="h-1 w-full bg-blue-500 animate-pulse rounded-full shadow-[0_0_12px_#3b82f6] mb-4" />
                        <FiLoader className="h-6 w-6 animate-spin text-blue-400" />
                        <p className="mt-2 text-xs font-bold text-white">
                          {ocrStatusText}
                        </p>
                        <div className="mt-2 w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${ocrProgress}%` }}
                            className="h-full bg-blue-500 transition-all duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extraction Summary Highlights */}
                  {extractedSummary && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <FiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>AI Auto-Extracted Details:</span>
                      </div>
                      <div className="text-[11px] text-emerald-950 space-y-0.5">
                        {extractedSummary.amount && (
                          <p>
                            • Detected Amount: <strong>₹{extractedSummary.amount}</strong>
                          </p>
                        )}
                        {extractedSummary.merchantName && (
                          <p>
                            • Merchant: <strong>{extractedSummary.merchantName}</strong>
                          </p>
                        )}
                        {extractedSummary.date && (
                          <p>
                            • Date: <strong>{extractedSummary.date}</strong>
                          </p>
                        )}
                        {extractedSummary.invoiceNumber && (
                          <p>
                            • Invoice #: <strong>{extractedSummary.invoiceNumber}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Policy note */}
              <div className="flex items-start gap-2 rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-[11px] text-blue-800 font-medium">
                <FiInfo className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Ensure invoice copy shows GSTIN (if applicable), date, and merchant name for faster clearance.
                </p>
              </div>
            </div>

            {/* Right Column: Expense Details Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Purpose / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expense Purpose / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="E.g. Client Dinner at Marriott / Taxi to Airport"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expense Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label} ({cat.sub})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amounts & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      name="amount"
                      required
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Tax / GST */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tax / GST (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="taxAmount"
                      value={formData.taxAmount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    required
                    value={formData.expenseDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Merchant & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Merchant / Vendor Name
                  </label>
                  <div className="relative">
                    <FiShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      name="merchantName"
                      value={formData.merchantName}
                      onChange={handleInputChange}
                      placeholder="E.g. Uber / Amazon / SpiceJet"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bill / Invoice Number
                  </label>
                  <div className="relative">
                    <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      placeholder="E.g. INV-98721"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vendor GSTIN (Optional)
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="E.g. 27AAAPL1234C1ZV"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Description / Business Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Business Justification
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide any additional context or client details..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Total Requested:{" "}
              <strong className="text-slate-900 font-mono text-sm">
                ₹{Number(formData.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || ocrScanning}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {submitting && (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Submit Claim</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Camera Snap Modal */}
      {isCameraOpen && (
        <LiveCameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            handleFileSelect(file);
          }}
        />
      )}
    </div>
  );
}
