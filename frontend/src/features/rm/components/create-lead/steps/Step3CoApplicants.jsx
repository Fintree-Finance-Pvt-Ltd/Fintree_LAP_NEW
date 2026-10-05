import { Section, Field, Select } from "../ui/CreateLeadUI.jsx";
import {
  REFERENCE_TYPE_OPTIONS,
  FAMILY_RELATION_OPTIONS,
} from "../constants/createLeadConstants.js";

export default function Step3CoApplicants({
  coApplicants,
  handleAddCoApplicant,
  handleCoApplicantChange,
  handleCoApplicantMobileOtp,
  handleCoApplicantEmailOtp,
  handleCoApplicantPanVerify,
  updateCoApplicant,
  handleCoApplicantPanOcr,
  handleCoApplicantIdentityLink,
  handleRemoveCoApplicant,
  contactPersons,
  handleAddContactPerson,
  handleContactPersonChange,
  handleRemoveContactPerson,
  familyMembers,
  handleAddFamilyMember,
  handleFamilyMemberChange,
  handleRemoveFamilyMember,
}) {
  return (
    <div className="space-y-6">
      {/* Co-Applicants Multi-Card Management Workspace */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Co-Applicant Details
            </h4>
            <p className="text-xs text-slate-500">
              Add up to 3 joint/co-signing applicants to distribute
              collateral risk parameters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCoApplicant}
            disabled={coApplicants.length >= 3}
            className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Co-Applicant
          </button>
        </div>

        {coApplicants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
            No co-applicants added. Click the button above to add
            financial profile verification cards.
          </div>
        ) : (
          coApplicants.map((coApp, index) => (
            <div key={index} className="relative group">
              <Section title={`Co-Applicant Details ${index + 1}`}>
                <Field
                  label="Co-Applicant Name (from PAN) *"
                  name="name"
                  value={coApp.name}
                  readOnly
                  placeholder="Auto-filled after PAN scan"
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="mobile"
                      value={coApp.mobile}
                      onChange={(e) =>
                        handleCoApplicantChange(index, e)
                      }
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      required
                      disabled={coApp.mobileVerified}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCoApplicantMobileOtp(index)
                      }
                      disabled={coApp.mobileVerified}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                    >
                      {coApp.mobileVerified
                        ? "Verified"
                        : coApp.mobileOtpSent
                          ? "Resend"
                          : "Send OTP"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      name="email"
                      value={coApp.email}
                      onChange={(e) =>
                        handleCoApplicantChange(index, e)
                      }
                      placeholder="name@domain.com"
                      disabled={coApp.emailVerified}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCoApplicantEmailOtp(index)
                      }
                      disabled={coApp.emailVerified}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                    >
                      {coApp.emailVerified
                        ? "Verified"
                        : coApp.emailOtpSent
                          ? "Resend"
                          : "Send OTP"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    PAN Number
                  </label>
                  <input
                    name="panNumber"
                    value={coApp.panNumber}
                    onChange={(e) =>
                      handleCoApplicantChange(index, e)
                    }
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm uppercase text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-[11px] text-slate-500">
                    Enter PAN manually or upload the card below.
                    Format: ABCDE1234F.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCoApplicantPanVerify(index)
                    }
                    disabled={coApp.panVerified}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                  >
                    {coApp.panVerified
                      ? "PAN Verified"
                      : "Verify PAN"}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    PAN Card OCR *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) =>
                      updateCoApplicant(index, {
                        panFile: e.target.files?.[0] || null,
                        panOcrError: "",
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleCoApplicantPanOcr(index)}
                    disabled={coApp.panOcrLoading}
                    className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50"
                  >
                    {coApp.panOcrLoading
                      ? "Reading PAN..."
                      : "Extract PAN & Name"}
                  </button>
                  {coApp.panOcrError && (
                    <span className="text-[11px] text-rose-600">
                      {coApp.panOcrError}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Identity Verification
                  </label>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    No Aadhaar number entry is required. A secure
                    DigiLocker / offline XML verification link will
                    be sent directly to the co-applicant.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleCoApplicantIdentityLink(index)
                    }
                    disabled={
                      coApp.identityStatus === "INITIATED" ||
                      coApp.identityStatus === "VERIFIED"
                    }
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-emerald-600"
                  >
                    {coApp.identityStatus === "VERIFIED"
                      ? "Identity Verified"
                      : coApp.identityStatus === "INITIATED"
                        ? "Link Sent"
                        : "Send Identity Link"}
                  </button>
                </div>

                <Field label="Relationship Matrix *">
                  <Select
                    name="relationship"
                    value={coApp.relationship}
                    onChange={(e) =>
                      handleCoApplicantChange(index, e)
                    }
                  >
                    <option value="SPOUSE">Spouse</option>
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="SON">Son</option>
                    <option value="SIBLING">Sibling</option>
                  </Select>
                </Field>

                <Field label="Occupation Type">
                  <Select
                    name="occupation"
                    value={coApp.occupation}
                    onChange={(e) =>
                      handleCoApplicantChange(index, e)
                    }
                  >
                    <option value="SELF_EMPLOYED">
                      Self-employed
                    </option>
                    <option value="SALARIED">
                      Salaried Sector
                    </option>
                    <option value="BUSINESS">Business</option>
                    <option value="PROFESSIONAL">
                      Professional
                    </option>
                    <option value="AGRICULTURE">Agriculture</option>
                    <option value="OTHER">Others</option>
                  </Select>
                </Field>

                <Field
                  label="Verified Monthly Income"
                  name="monthlyIncome"
                  type="number"
                  min="0"
                  value={coApp.monthlyIncome}
                  onChange={(e) =>
                    handleCoApplicantChange(index, e)
                  }
                  placeholder="e.g. 50000"
                />

                {/* Action Row containing structural removal handlers */}
                <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveCoApplicant(index)}
                    className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove CoApplicant: {index + 1}
                  </button>
                </div>
              </Section>
            </div>
          ))
        )}
      </div>

      {/* Contact Persons Multi-Card Management Workspace */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Reference / Contact Persons
            </h4>
            <p className="text-xs text-slate-500">
              Add primary organizational or personal references
              associated with this account lead.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddContactPerson}
            className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add Contact Person
          </button>
        </div>

        {contactPersons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
            No contact persons added. Click the button above to add
            verification reference lines.
          </div>
        ) : (
          contactPersons.map((contact, index) => (
            <div key={index} className="relative group">
              <Section
                title={`Contact Person Reference ${index + 1}`}
              >
                <Field
                  label="Reference Name *"
                  name="name"
                  value={contact.name}
                  onChange={(e) =>
                    handleContactPersonChange(index, e)
                  }
                  placeholder="Enter reference name"
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Mobile Number *
                  </label>
                  <input
                    name="mobile"
                    value={contact.mobile}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      handleContactPersonChange(index, {
                        target: { name: "mobile", value: val },
                      });
                    }}
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="Enter 10-digit mobile"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <Field label="Reference Type *">
                  <Select
                    name="referenceType"
                    value={contact.referenceType || "Purchaser"}
                    onChange={(e) =>
                      handleContactPersonChange(index, e)
                    }
                    placeholder="Select Reference Type"
                  >
                    {REFERENCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </Field>

                {/* Action Row containing layout removal button */}
                <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveContactPerson(index)}
                    className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove Reference
                  </button>
                </div>
              </Section>
            </div>
          ))
        )}
      </div>

      {/* 7. Family Details Multi-Card Management Workspace */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Family Details
            </h4>
            <p className="text-xs text-slate-500">
              Add family member details associated with the
              applicant.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddFamilyMember}
            className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Family Member
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500 font-medium">
            No family members added. Click the button above to add
            family details.
          </div>
        ) : (
          familyMembers.map((member, index) => (
            <div key={index} className="relative group">
              <Section title={`Family Member ${index + 1}`}>
                <Field
                  label="Family Member Name *"
                  name="name"
                  value={member.name}
                  onChange={(e) =>
                    handleFamilyMemberChange(index, e)
                  }
                  placeholder="Enter family member name"
                  required
                />

                <Field label="Relation *">
                  <Select
                    name="relation"
                    value={member.relation || "Brother"}
                    onChange={(e) =>
                      handleFamilyMemberChange(index, e)
                    }
                    placeholder="Select Relation"
                  >
                    {FAMILY_RELATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Age"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={member.age}
                  onChange={(e) =>
                    handleFamilyMemberChange(index, e)
                  }
                  placeholder="Enter age"
                />

                <Field
                  label="Occupation"
                  name="occupation"
                  value={member.occupation}
                  onChange={(e) =>
                    handleFamilyMemberChange(index, e)
                  }
                  placeholder="Enter occupation"
                />

                <Field
                  label="Income"
                  name="income"
                  type="number"
                  min="0"
                  value={member.income}
                  onChange={(e) =>
                    handleFamilyMemberChange(index, e)
                  }
                  placeholder="Enter income"
                />

                {/* Action Row containing layout removal button */}
                <div className="flex items-end justify-end pt-1.5 sm:col-span-1 lg:col-span-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyMember(index)}
                    className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2 transition-all flex items-center gap-1 shadow-2xs active:scale-[0.99]"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove Family Member
                  </button>
                </div>
              </Section>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
