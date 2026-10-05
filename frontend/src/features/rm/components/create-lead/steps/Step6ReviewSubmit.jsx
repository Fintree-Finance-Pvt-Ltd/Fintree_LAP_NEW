import { getStepIcon } from "../ui/CreateLeadUI.jsx";

export default function Step6ReviewSubmit({
  formData,
  setCurrentStep,
  coApplicants,
  contactPersons,
  familyMembers,
  // Document status booleans
  isApplicantPanUploaded,
  isApplicantAadhaarUploaded,
  isApplicantPhotoUploaded,
  isApplicantSaleDeedUploaded,
  isApplicantPropertyTaxReceiptUploaded,
  isApplicantKhataCertificateUploaded,
  isApplicantApprovalPlanUploaded,
  isApplicantSurveySketchUploaded,
  isApplicantEcCertificateUploaded,
  isApplicantAddressProofUploaded,
  isApplicantBankStatementUploaded,
  isApplicantIncomeProofUploaded,
  isApplicantBusinessProofUploaded,
  isApplicantUdyamUploaded,
  isApplicantBusinessLicenseUploaded,
}) {
  return (
    <div className="space-y-6">
      {/* Verification Summary Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Lead Ready for Review
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {formData.customerName || "Applicant Name Pending"}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Mobile:{" "}
              <span className="font-semibold">
                {formData.mobileNumber || "N/A"}
              </span>{" "}
              • Email:{" "}
              <span className="font-semibold">
                {formData.emailId || "N/A"}
              </span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 font-medium">
              Estimated Loan Stage
            </span>
            <div className="text-sm font-bold text-blue-700">
              Initial Verification
            </div>
          </div>
        </div>
      </div>

      {/* Lead Review Summary Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 1: Primary Applicant & KYC */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                {getStepIcon(1, "h-3.5 w-3.5")}
              </div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Applicant & KYC
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Full Name</dt>
              <dd className="font-semibold text-slate-800">
                {formData.customerName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Mobile Number</dt>
              <dd className="font-semibold text-slate-800">
                {formData.mobileNumber || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">PAN Number</dt>
              <dd className="font-semibold text-slate-800 font-mono">
                {formData.panNumber || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Aadhaar Number</dt>
              <dd className="font-semibold text-slate-800 font-mono">
                {formData.aadhaarNumber
                  ? `•••• •••• ${formData.aadhaarNumber.slice(-4)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Date of Birth</dt>
              <dd className="font-semibold text-slate-800">
                {formData.dob || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Gender / Marital</dt>
              <dd className="font-semibold text-slate-800">
                {formData.gender || "—"} / {formData.maritalStatus || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 2: Employment & Residence */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                {getStepIcon(2, "h-3.5 w-3.5")}
              </div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Employment & Residence
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Occupation</dt>
              <dd className="font-semibold text-slate-800">
                {formData.occupation || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Business Name</dt>
              <dd className="font-semibold text-slate-800">
                {formData.businessName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Monthly Income</dt>
              <dd className="font-semibold text-slate-800">
                {formData.monthlyIncome
                  ? `₹${Number(formData.monthlyIncome).toLocaleString("en-IN")}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Residence Type</dt>
              <dd className="font-semibold text-slate-800">
                {formData.residenceType || "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400 font-medium">Residence Address</dt>
              <dd className="font-semibold text-slate-800 truncate">
                {[
                  formData.residenceAddressLine1,
                  formData.residenceAddressLine2,
                  formData.residenceCity,
                  formData.residenceState,
                  formData.residencePincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 3: Co-Applicants & Family */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                {getStepIcon(3, "h-3.5 w-3.5")}
              </div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Co-Applicants & Family
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                Co-Applicants Added:
              </span>
              <span className="font-bold text-slate-800">
                {coApplicants.length} applicant(s)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                Reference Contacts:
              </span>
              <span className="font-bold text-slate-800">
                {contactPersons.length} contact(s)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                Family Members:
              </span>
              <span className="font-bold text-slate-800">
                {familyMembers.length} member(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Collateral Property */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                {getStepIcon(4, "h-3.5 w-3.5")}
              </div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Collateral Property
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Owner Name</dt>
              <dd className="font-semibold text-slate-800">
                {formData.propertyOwnerName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Property Category</dt>
              <dd className="font-semibold text-slate-800">
                {formData.propertyCategory || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Market Value</dt>
              <dd className="font-bold text-blue-600">
                {formData.propertyValue
                  ? `₹${Number(formData.propertyValue).toLocaleString("en-IN")}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Area / Sq Ft</dt>
              <dd className="font-semibold text-slate-800">
                {formData.areaSqFt ? `${formData.areaSqFt} sq ft` : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400 font-medium">Property Address</dt>
              <dd className="font-semibold text-slate-800 truncate">
                {[
                  formData.propertyAddress,
                  formData.city,
                  formData.state,
                  formData.pinCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Card 5: Uploaded Documents Verification Checklist */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
              {getStepIcon(5, "h-3.5 w-3.5")}
            </div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Uploaded Documents Status
            </h5>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Upload More
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {[
            { label: "PAN Card", ok: isApplicantPanUploaded },
            {
              label: "Aadhaar Card",
              ok: isApplicantAadhaarUploaded,
            },
            {
              label: "Customer Photo",
              ok: isApplicantPhotoUploaded,
            },
            { label: "Sale Deed", ok: isApplicantSaleDeedUploaded },
            {
              label: "Property Tax Receipt",
              ok: isApplicantPropertyTaxReceiptUploaded,
            },
            {
              label: "Khata Certificate",
              ok: isApplicantKhataCertificateUploaded,
            },
            {
              label: "Sanction Plan",
              ok: isApplicantApprovalPlanUploaded,
            },
            {
              label: "Survey Sketch",
              ok: isApplicantSurveySketchUploaded,
            },
            {
              label: "Encumbrance (EC)",
              ok: isApplicantEcCertificateUploaded,
            },
            {
              label: "Address Proof",
              ok: isApplicantAddressProofUploaded,
            },
            {
              label: "Bank Statement",
              ok: isApplicantBankStatementUploaded,
            },
            {
              label: "Income Proof",
              ok: isApplicantIncomeProofUploaded,
            },
            {
              label: "Business Proof",
              ok: isApplicantBusinessProofUploaded,
            },
            {
              label: "Udyam Certificate",
              ok: isApplicantUdyamUploaded,
            },
            {
              label: "Business License",
              ok: isApplicantBusinessLicenseUploaded,
            },
          ].map((doc, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs border ${
                doc.ok
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-500 font-normal"
              }`}
            >
              <span className="truncate mr-1">{doc.label}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  doc.ok
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {doc.ok ? "✓" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Declaration & Submission Notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-900 flex items-start gap-3">
        <input
          type="checkbox"
          id="lead-submit-consent"
          defaultChecked
          className="h-4 w-4 mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor="lead-submit-consent"
          className="cursor-pointer text-slate-700 leading-relaxed"
        >
          I confirm that the information and documents provided above are
          accurate and verified directly with the applicant for underwriting loan
          processing.
        </label>
      </div>
    </div>
  );
}
