import { Section, Field, Select, getStepIcon } from "../ui/CreateLeadUI.jsx";
import {
  NATURE_OF_BUSINESS_OPTIONS,
  INDIAN_STATES,
  LOCAL_BODY_OPTIONS,
  RESIDENCE_TYPE_OPTIONS,
} from "../constants/createLeadConstants.js";

export default function Step2AdditionalDetails({
  formData,
  handleInputChange,
}) {
  return (
    <div className="space-y-6">
      <Section
        icon={getStepIcon(2, "h-5 w-5")}
        title="Employment & Business Profile"
      >
        <div className="col-span-full space-y-5">
          {/* Core Business & Profile Inputs */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Occupation">
              <Select
                name="occupation"
                value={formData.occupation || "SELF_EMPLOYED"}
                onChange={handleInputChange}
              >
                <option value="SALARIED">Salaried</option>
                <option value="SELF_EMPLOYED">Self Employed</option>
                <option value="BUSINESS">Business</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="AGRICULTURE">Agriculture</option>
                <option value="RETIRED">Retired</option>
                <option value="OTHER">Others</option>
              </Select>
            </Field>

            <Field label="Constitution">
              <Select
                name="constitution"
                value={formData.constitution || "INDIVIDUAL"}
                onChange={handleInputChange}
              >
                <option value="PROPRIETORSHIP">
                  Proprietorship
                </option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="PVT_LTD">Pvt Ltd</option>
                <option value="LLP">LLP</option>
                <option value="INDIVIDUAL">Individual</option>
              </Select>
            </Field>

            <Field
              label="Employer / Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Enter employer or business name"
            />

            <Field label="Nature of Business">
              <Select
                name="natureOfBusiness"
                value={formData.natureOfBusiness}
                onChange={handleInputChange}
              >
                <option value="">Select Nature of Business</option>
                {NATURE_OF_BUSINESS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>

            {formData.natureOfBusiness === "Other" && (
              <Field
                label="Specify Nature of Business"
                name="otherNatureOfBusiness"
                value={formData.otherNatureOfBusiness}
                onChange={handleInputChange}
                placeholder="Enter specific business category"
              />
            )}

            <Field
              label="Business Vintage"
              name="businessVintage"
              value={formData.businessVintage}
              onChange={handleInputChange}
              placeholder="e.g. 5 Years"
            />

            <Field
              label="UDYAM Number"
              name="udyamNumber"
              value={formData.udyamNumber}
              onChange={handleInputChange}
              placeholder="e.g. UDYAM-MH-01-0012345"
              className="uppercase tracking-wider font-normal"
            />

            {/* GST Identification Block */}
            <Field label="GST Number">
              <input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase tracking-wider text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <div className="sm:col-span-2 lg:col-span-3">
              <Field
                label="Business Address"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                placeholder="Complete business or office address with landmark"
              />
            </div>
          </div>

          {/* Monthly Financials Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Monthly Financial Overview
              </h5>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Monthly Income (₹)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </Field>

              <Field label="Monthly Sales / Turnover (₹)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="monthlySales"
                    value={formData.monthlySales}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </Field>

              <Field label="Monthly Profit (₹)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="monthlyProfit"
                    value={formData.monthlyProfit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Sub-Section 5: ADDRESS DETAILS - RESIDENCE ADDRESS */}
        <div className="col-span-full space-y-4 pt-3 border-t border-slate-100">
          <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Address Details
            </h4>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/80 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              Residence Address
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <Field
              containerClassName="md:col-span-2"
              label="Address Line 1"
              name="residenceAddressLine1"
              value={formData.residenceAddressLine1 || ""}
              onChange={handleInputChange}
              placeholder="House / Flat No., Building Name, Street"
            />

            <Field
              containerClassName="md:col-span-1"
              label="Address Line 2"
              name="residenceAddressLine2"
              value={formData.residenceAddressLine2 || ""}
              onChange={handleInputChange}
              placeholder="Area, Sector, Locality"
            />

            <Field
              containerClassName="md:col-span-1"
              label="Landmark"
              name="residenceLandmark"
              value={formData.residenceLandmark || ""}
              onChange={handleInputChange}
              placeholder="Nearby Landmark"
            />

            <Field
              containerClassName="md:col-span-1"
              label="City"
              name="residenceCity"
              value={formData.residenceCity || ""}
              onChange={handleInputChange}
              placeholder="City"
            />

            <Field
              containerClassName="md:col-span-1"
              label="District"
              name="residenceDistrict"
              value={formData.residenceDistrict || ""}
              onChange={handleInputChange}
              placeholder="District"
            />

            <Field containerClassName="md:col-span-1" label="State">
              <Select
                name="residenceState"
                value={formData.residenceState || ""}
                onChange={handleInputChange}
                placeholder="Select State"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              containerClassName="md:col-span-1"
              label="Pincode"
              name="residencePincode"
              value={formData.residencePincode || ""}
              onChange={handleInputChange}
              maxLength={6}
              inputMode="numeric"
              placeholder="6-digit Pincode"
            />

            <Field
              containerClassName="md:col-span-1"
              label="Gram Panchayat / Municipal Corporation"
            >
              <Select
                name="gramPanchayatCorporation"
                value={formData.gramPanchayatCorporation || ""}
                onChange={handleInputChange}
                placeholder="Select Option"
              >
                <option value="">Select Option</option>
                {LOCAL_BODY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              containerClassName="md:col-span-1"
              label="Residence Type"
            >
              <Select
                name="residenceType"
                value={formData.residenceType || ""}
                onChange={handleInputChange}
                placeholder="Select Residence Type"
              >
                <option value="">Select Residence Type</option>
                {RESIDENCE_TYPE_OPTIONS.map((resType) => (
                  <option key={resType} value={resType}>
                    {resType}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Section>
    </div>
  );
}
