import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { buildWorkflowTimeline, formatCurrency } from "../rmUtils.js";

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
  const { applicationId } = useParams();
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const workflowQuery = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: () => rmApi.workflowStatus(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  });
  const leadJourney = useMemo(() => buildWorkflowTimeline(workflowQuery.data?.data ?? {}), [workflowQuery.data]);

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
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["rm-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["rm-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["rm-workflow", data.id] });
      navigate(`/my-leads`, { replace: true });
    },
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
    <form onSubmit={handleSubmit} className="min-h-screen space-y-6 bg-slate-50 p-6 text-slate-800 antialiased lg:p-8">
      {/* Top Banner & Action Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-violet-800 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Lead & Application Capture</h2>
            <p className="mt-1 text-xs text-blue-100/80">Configure structural applicant verification, loan assessment and collateral parameters.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="submit" 
              disabled={isPending} 
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveDraft.isPending ? "Saving..." : "Save Draft"}
            </button>
            <button 
              type="button" 
              disabled={isPending} 
              onClick={() => { setMessage(""); submitApplication.mutate(); }} 
              className="rounded-xl bg-blue-950 px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitApplication.isPending ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Workflow Stepper */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">RM Workflow Journey</h3>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"> Active Track </span>
        </div>
        
        {/* Horizontal Container scrollable on smaller viewports */}
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[800px] items-center justify-between">
            {leadJourney.map((item, index) => {
              const isCurrent = !item.completed && index === leadJourney.findIndex((step) => !step.completed);
              return (
                <div key={item.label} className="relative flex flex-1 flex-col items-center text-center">
                  {index !== leadJourney.length - 1 && (
                    <div className={`absolute left-[50%] top-4 h-[2px] w-full -translate-y-1/2 ${leadJourney[index + 1].completed ? "bg-emerald-500" : "bg-slate-200"}`} />
                  )}
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    item.completed ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-white text-slate-400 ring-2 ring-slate-200"
                  }`}>
                    {item.completed ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? "●" : index + 1}
                  </div>
                  <div className="mt-2.5 px-2">
                    <p className={`text-xs font-semibold ${item.completed || isCurrent ? "text-slate-900" : "text-slate-500"}`}>{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {message}
        </div>
      )}

      {/* Main Core Form Block */}
      <div className="space-y-8 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm lg:p-8">
        
        {/* Section: Customer Demographics */}
        <Section title="Customer Identification & Identity">
          <Field label="Customer / Entity Name *" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
          <Field label="Mobile Number *" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
          <Field label="Email ID" name="emailId" type="email" value={formData.emailId} onChange={handleInputChange} />
          <Field label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} maxLength={10} />
          <Field label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} maxLength={12} />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Occupation / Constitution</label>
            <select 
              name="occupation" 
              value={formData.occupation} 
              onChange={handleInputChange} 
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white"
            >
              <option value="SELF_EMPLOYED">Self employed</option>
              <option value="SALARIED">Salaried</option>
              <option value="BUSINESS">Business</option>
              <option value="PROFESSIONAL">Professional</option>
            </select>
          </div>
          <Field label="Employer / Business Name" name="businessName" value={formData.businessName} onChange={handleInputChange} />
        </Section>

        {/* Section: Financial Profiles & Live Calculation Preview Widget */}
        <Section title="Financial Profiles & Request Framework">
          <Field label="Verified Monthly Income" name="monthlyIncome" type="number" value={formData.monthlyIncome} onChange={handleInputChange} />
          <Field label="Existing Monthly Obligations" name="monthlyObligations" type="number" value={formData.monthlyObligations} onChange={handleInputChange} />
          <Field label="Requested Loan Amount *" name="requestedAmount" type="number" value={formData.requestedAmount} onChange={handleInputChange} required />
          <Field label="Requested Tenure (months)" name="requestedTenure" type="number" value={formData.requestedTenure} onChange={handleInputChange} />
          
          {/* Visual Dynamic Underwriting Widget Box */}
          <div className="md:col-span-2 rounded-xl bg-slate-50 p-4 border border-slate-200/50 grid grid-cols-3 gap-4">
            <div className="text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Indicative EMI</span>
              <span className="text-base font-extrabold text-blue-700 mt-1 block">{formatCurrency(calculated.emi)}</span>
            </div>
            <div className="text-center md:text-left border-x border-slate-200 px-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">FOIR Ratio</span>
              <span className={`text-base font-extrabold mt-1 block ${calculated.foir > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {calculated.foir.toFixed(2)}%
              </span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated LTV</span>
              <span className="text-base font-extrabold text-slate-700 mt-1 block">{calculated.ltv.toFixed(2)}%</span>
            </div>
          </div>
        </Section>

        {/* Section: Real Estate Asset / Collateral */}
        <Section title="Collateral & Property Specifics">
          <Field label="Property Type" name="propertyType" value={formData.propertyType} onChange={handleInputChange} placeholder="e.g. Commercial / Residential" />
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <input 
        {...props} 
        className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white placeholder:text-slate-300" 
      />
    </div>
  );
}