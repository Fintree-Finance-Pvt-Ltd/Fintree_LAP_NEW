import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import { rmApi } from "../rmApi.js";
import { formatCurrency, requiredDocumentTypes, workflowSteps } from "../rmUtils.js";

export default function SubmitToBM() {
  const [applicationId, setApplicationId] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [recommendedAmount, setRecommendedAmount] = useState("");
  const [recommendedRoi, setRecommendedRoi] = useState("10.5");
  const [recommendedTenure, setRecommendedTenure] = useState("120");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const applications = useQuery({ queryKey: ["rm-submit-applications"], queryFn: () => rmApi.applications({ page: 1, limit: 100 }) });
  const selectedId = applicationId || applications.data?.data?.[0]?.id || "";
  const selectedApplication = (applications.data?.data ?? []).find((item) => String(item.id) === String(selectedId));
  const profile = useQuery({ queryKey: ["rm-profile", selectedId], queryFn: () => rmApi.getCustomerProfile(selectedId), enabled: Boolean(selectedId), retry: false });
  const documents = useQuery({ queryKey: ["rm-documents", selectedId], queryFn: () => rmApi.documents(selectedId), enabled: Boolean(selectedId) });

  const gateItems = useMemo(() => {
    const profileData = profile.data?.data;
    const uploadedTypes = new Set((documents.data?.data ?? []).map((doc) => doc.documentType));
    const docsComplete = requiredDocumentTypes.every((type) => uploadedTypes.has(type));
    return [
      { label: "Customer profile exists", sub: "Required before submission", passed: Boolean(profileData) },
      { label: "PAN verified", sub: "Set from customer profile KYC status", passed: Boolean(profileData?.panVerified) },
      { label: "Aadhaar verified", sub: "Set from customer profile KYC status", passed: Boolean(profileData?.aadhaarVerified) },
      { label: "Eligibility completed", sub: "FOIR, eligible amount, ROI, tenure and EMI required", passed: Boolean(profileData?.foir && profileData?.eligibleAmount && profileData?.roi && profileData?.tenure && profileData?.emi) },
      { label: "Required documents uploaded", sub: requiredDocumentTypes.join(", "), passed: docsComplete },
      { label: "RM recommendation completed", sub: "Recommended amount, ROI, tenure and remarks required", passed: Boolean(recommendation && recommendedAmount && recommendedRoi && recommendedTenure) },
    ];
  }, [profile.data, documents.data, recommendation, recommendedAmount, recommendedRoi, recommendedTenure]);

  const canSubmit = gateItems.every((item) => item.passed);

  const submit = useMutation({
    mutationFn: async () => {
      await rmApi.updateCustomerProfile(selectedId, {
        recommendedAmount: Number(recommendedAmount),
        recommendedRoi: Number(recommendedRoi),
        recommendedTenure: Number(recommendedTenure),
        rmRecommendation: recommendation,
      });
      return rmApi.submitToBm(selectedId, { remarks: recommendation });
    },
    onSuccess: async () => {
      setMessage("Application submitted to BM.");
      await queryClient.invalidateQueries({ queryKey: ["rm-submit-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] });
    },
    onError: (error) => setMessage(error?.message || "Unable to submit to BM"),
  });

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-8 text-slate-800 antialiased">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Submit Case to Branch Manager</h2>
            <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">
              {selectedApplication ? `${selectedApplication.applicationNumber} | ${selectedApplication.customerName}` : "Select an application for final RM quality check."}
            </p>
          </div>
          <div className="flex gap-3">
            <select value={selectedId} onChange={(event) => setApplicationId(event.target.value)} className="rounded-xl border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-bold text-white outline-none">
              {(applications.data?.data ?? []).map((item) => (
                <option key={item.id} value={item.id} className="text-slate-900">
                  {item.applicationNumber} - {item.customerName}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!canSubmit || submit.isPending}
              onClick={() => submit.mutate()}
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-blue-700 shadow-md transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submit.isPending ? "Submitting..." : "Submit to BM"}
            </button>
          </div>
        </div>
      </div>

      {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">{message}</div>}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
          {workflowSteps.map((label, idx) => (
            <div key={label} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${idx <= 1 ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}>
                {idx + 1}
              </div>
              <span className={`mt-2 whitespace-nowrap text-xs font-bold ${idx <= 1 ? "text-blue-600" : "text-slate-700"}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">Submission gate</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gateItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              {item.passed ? <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" size={18} /> : <FaTimesCircle className="mt-0.5 shrink-0 text-rose-400" size={18} />}
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="mt-0.5 text-[10px] font-medium text-slate-400">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <Field label="Recommended Amount" type="number" value={recommendedAmount} onChange={setRecommendedAmount} placeholder={selectedApplication ? formatCurrency(selectedApplication.requestedAmount) : ""} />
          <Field label="Recommended ROI" type="number" value={recommendedRoi} onChange={setRecommendedRoi} />
          <Field label="Recommended Tenure" type="number" value={recommendedTenure} onChange={setRecommendedTenure} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">RM Recommendation</label>
          <textarea value={recommendation} onChange={(event) => setRecommendation(event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white" />
    </div>
  );
}
