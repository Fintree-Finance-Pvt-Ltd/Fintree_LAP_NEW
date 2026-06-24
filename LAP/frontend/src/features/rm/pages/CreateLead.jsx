import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { formatCurrency, workflowSteps } from "../rmUtils.js";

const emptyForm = {
  customerName: "",
  mobileNumber: "",
  emailId: "",
  panNumber: "",
  aadhaarNumber: "",
  occupation: "SELF_EMPLOYED",
  businessName: "",
  monthlyIncome: "",
  monthlyObligations: "",
  requestedAmount: "",
  requestedTenure: "120",
  propertyType: "",
  propertyValue: "",
  propertyAddress: "",
  city: "",
  state: "",
  pinCode: "",
};

export default function CreateLead() {
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const calculated = useMemo(() => {
    const income = Number(formData.monthlyIncome || 0);
    const obligations = Number(formData.monthlyObligations || 0);
    const requested = Number(formData.requestedAmount || 0);
    const propertyValue = Number(formData.propertyValue || 0);
    const foir = income > 0 ? (obligations / income) * 100 : 0;
    const ltv = propertyValue > 0 ? (requested / propertyValue) * 100 : 0;
    const roi = 10.5;
    const tenure = Number(formData.requestedTenure || 120);
    const monthlyRate = roi / 12 / 100;
    const emi = requested && tenure ? (requested * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1) : 0;
    return { foir, ltv, roi, tenure, emi };
  }, [formData]);

  const buildPayload = () => ({
    customerName: formData.customerName,
    mobile: formData.mobileNumber,
    email: formData.emailId || undefined,
    pan: formData.panNumber || undefined,
    aadhaarNumber: formData.aadhaarNumber || undefined,
    occupationType: formData.occupation,
    businessName: formData.businessName || undefined,
    monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined,
    monthlyObligations: formData.monthlyObligations ? Number(formData.monthlyObligations) : undefined,
    requestedAmount: formData.requestedAmount || undefined,
    requestedTenure: formData.requestedTenure ? Number(formData.requestedTenure) : undefined,
    propertyType: formData.propertyType || undefined,
    marketValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
    propertyAddress: formData.propertyAddress || undefined,
    propertyCity: formData.city || undefined,
    propertyState: formData.state || undefined,
    propertyPincode: formData.pinCode || undefined,
    foir: calculated.foir,
    emi: calculated.emi,
    roi: calculated.roi,
    tenure: calculated.tenure,
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      const response = await rmApi.saveDraft(buildPayload());
      return response;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["rm-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] });
      navigate(`/applications/${data.id}`, { replace: true });
    },
    onError: (error) => setMessage(error?.message || "Unable to save draft"),
  });

  const submitApplication = useMutation({
    mutationFn: async () => {
      const response = await rmApi.submitApplication(buildPayload());
      return response;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["rm-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] });
      navigate(`/applications/${data.id}`, { replace: true });
    },
    onError: (error) => setMessage(error?.message || "Unable to submit application"),
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");
    saveDraft.mutate();
  };

  const isPending = saveDraft.isPending || submitApplication.isPending;

  return (
    <form onSubmit={handleSubmit} className="min-h-screen space-y-6 bg-[#f8fafc] p-8 text-slate-800 antialiased">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Lead & Application Capture</h2>
            <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">Capture applicant, loan and collateral details.</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-blue-700 shadow-md transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
              {saveDraft.isPending ? "Saving..." : "Save Draft"}
            </button>
            <button type="button" disabled={isPending} onClick={() => { setMessage(""); submitApplication.mutate(); }} className="rounded-xl bg-blue-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {submitApplication.isPending ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
          {workflowSteps.map((label, idx) => (
            <div key={label} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-500"}`}>
                {idx + 1}
              </div>
              <span className={`mt-2 whitespace-nowrap text-xs font-bold ${idx === 0 ? "text-blue-600" : "text-slate-700"}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {message && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{message}</div>}

      <div className="space-y-10 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <Section title="Customer Details">
          <Field label="Customer / Entity Name *" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
          <Field label="Mobile Number *" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
          <Field label="Email ID" name="emailId" type="email" value={formData.emailId} onChange={handleInputChange} />
          <Field label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} maxLength={10} />
          <Field label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} maxLength={12} />
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Occupation / Constitution</label>
            <select name="occupation" value={formData.occupation} onChange={handleInputChange} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white">
              <option value="SELF_EMPLOYED">Self employed</option>
              <option value="SALARIED">Salaried</option>
              <option value="BUSINESS">Business</option>
              <option value="PROFESSIONAL">Professional</option>
            </select>
          </div>
          <Field label="Employer / Business Name" name="businessName" value={formData.businessName} onChange={handleInputChange} />
          <Field label="Verified Monthly Income" name="monthlyIncome" type="number" value={formData.monthlyIncome} onChange={handleInputChange} />
          <Field label="Existing Monthly Obligations" name="monthlyObligations" type="number" value={formData.monthlyObligations} onChange={handleInputChange} />

          <Field label="Requested Loan Amount *" name="requestedAmount" type="number" value={formData.requestedAmount} onChange={handleInputChange} required />
          <Field label="Requested Tenure (months)" name="requestedTenure" type="number" value={formData.requestedTenure} onChange={handleInputChange} />
          <ReadOnly label="Indicative EMI" value={formatCurrency(calculated.emi)} />
        </Section>

        <Section title="Property Details">
          <Field label="Property Type" name="propertyType" value={formData.propertyType} onChange={handleInputChange} />
          <Field label="Approximate Property Value" name="propertyValue" type="number" value={formData.propertyValue} onChange={handleInputChange} />
          <Field label="Property Address" name="propertyAddress" value={formData.propertyAddress} onChange={handleInputChange} />
          <Field label="City" name="city" value={formData.city} onChange={handleInputChange} />
          <Field label="State" name="state" value={formData.state} onChange={handleInputChange} />
          <Field label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleInputChange} maxLength={6} />
        </Section>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input {...props} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white" />
    </div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input value={value} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none" />
    </div>
  );
}
