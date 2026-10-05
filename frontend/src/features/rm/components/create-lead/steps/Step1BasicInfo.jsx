import { Section, Field, Select, getStepIcon } from "../ui/CreateLeadUI.jsx";

export default function Step1BasicInfo({
  formData,
  handleInputChange,
  isApplicantPhotoUploaded,
  handleViewApplicantPhoto,
  customerPhotoFile,
  handleCustomerPhotoChange,
  uploadCustomerPhotoMutation,
}) {
  return (
    <div className="space-y-6">
      {/* 1. Basic Information */}
      <Section
        icon={getStepIcon(1, "h-5 w-5")}
        title="Basic Information"
        subtitle="Primary applicant entity & demographic profile"
      >
        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Customer / Entity Name
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          name="customerName"
          value={formData.customerName}
          onChange={handleInputChange}
          required
          placeholder="Enter customer / entity name"
        />

        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Customer Type
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
        >
          <Select
            name="customerType"
            value={formData.customerType || "INDIVIDUAL"}
            onChange={handleInputChange}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="PROPRIETORSHIP">Proprietor</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="COMPANY">Company</option>
          </Select>
        </Field>

        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Date of Birth
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          type="date"
          name="dob"
          value={formData.dob ? String(formData.dob).slice(0, 10) : ""}
          onChange={handleInputChange}
        />

        <Field containerClassName="md:col-span-1" label="Gender">
          <Select
            name="gender"
            value={formData.gender || ""}
            onChange={handleInputChange}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>

        <Field containerClassName="md:col-span-1" label="Marital Status">
          <Select
            name="maritalStatus"
            value={formData.maritalStatus || ""}
            onChange={handleInputChange}
          >
            <option value="">Select Marital Status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorce</option>
            <option value="WIDOWED">Widow</option>
          </Select>
        </Field>

        <Field containerClassName="md:col-span-1" label="Nationality">
          <Select
            name="nationality"
            value={formData.nationality || "INDIAN"}
            onChange={handleInputChange}
          >
            <option value="INDIAN">Indian</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>
      </Section>

      {/* 2. Contact Information */}
      <Section
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        }
        title="Contact Information"
        subtitle="Phone and email for verification & communication"
      >
        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Mobile Number
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleInputChange}
          maxLength={10}
          inputMode="numeric"
          required
          placeholder="Enter 10-digit number"
        />

        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Email Id
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          type="email"
          name="emailId"
          value={formData.emailId || ""}
          onChange={handleInputChange}
          maxLength={255}
          autoComplete="email"
          placeholder="name@domain.com"
          required
        />
      </Section>

      {/* 3. KYC & Identification */}
      <Section
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        }
        title="KYC & Identity Verification"
        subtitle="Government identification numbers and live photo"
      >
        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              PAN Number
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          name="panNumber"
          value={formData.panNumber}
          onChange={handleInputChange}
          maxLength={10}
          placeholder="ABCDE1234F"
          className="uppercase tracking-wider font-normal"
        />

        <Field
          containerClassName="md:col-span-1"
          label={
            <>
              Aadhaar / Udyam Aadhaar (Last 4 Digits)
              <span className="text-red-600 font-bold"> *</span>
            </>
          }
          name="aadhaarNumber"
          value={formData.aadhaarNumber || ""}
          onChange={handleInputChange}
          maxLength={4}
          inputMode="numeric"
          placeholder="e.g. 1234"
        />

        {/* Compact Profile Photo Management Panel */}
        <div className="col-span-full rounded-2xl border border-slate-300 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-3xs">
              <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                IMG
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-800">
                Biometric Photo
              </h4>
              <div className="flex flex-wrap items-center gap-1.5">
                {isApplicantPhotoUploaded ? (
                  <>
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                      Uploaded
                    </span>
                    <button
                      type="button"
                      onClick={handleViewApplicantPhoto}
                      className="text-[10px] font-bold text-blue-600 hover:underline transition-all"
                    >
                      View Photo
                    </button>
                  </>
                ) : (
                  <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 border border-amber-100">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[210px]">
            <label className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:py-2 text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-50 transition-colors whitespace-nowrap">
              {customerPhotoFile ? "Change" : "Choose File"}
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={handleCustomerPhotoChange}
              />
            </label>

            <button
              type="button"
              disabled={
                !customerPhotoFile ||
                uploadCustomerPhotoMutation.isPending
              }
              onClick={() => uploadCustomerPhotoMutation.mutate()}
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 sm:py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-all active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 whitespace-nowrap"
            >
              {uploadCustomerPhotoMutation.isPending
                ? "Uploading..."
                : "Upload"}
            </button>
          </div>
        </div>

        {customerPhotoFile && (
          <div className="col-span-full rounded-xl bg-blue-50/50 px-3 py-1.5 border border-blue-100 text-[11px] font-medium text-blue-700 truncate w-full sm:max-w-sm">
            Staged:{" "}
            <span className="font-bold">
              {customerPhotoFile.name}
            </span>
          </div>
        )}
      </Section>
    </div>
  );
}
