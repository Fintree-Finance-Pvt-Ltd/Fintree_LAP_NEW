import { Section, Field, Select, getStepIcon } from "../ui/CreateLeadUI.jsx";
import {
  PROPERTY_OWNER_RELATION_OPTIONS,
  STRUCTURE_TYPE_OPTIONS,
  PLOT_DEMARCATED_OPTIONS,
  PROPERTY_USAGE_TYPE_OPTIONS,
  PREMISES_TYPE_OPTIONS,
  CONSTRUCTION_STATUS_OPTIONS,
} from "../constants/createLeadConstants.js";
import { PROPERTY_CATEGORY } from "../../../rmUtils.js";
import PropertyAddressAutocomplete from "../../PropertyAddressAutocomplete.jsx";

export default function Step4CollateralDetails({
  formData,
  setFormData,
  handleInputChange,
  handleCategoryChange,
  propertyTypeOptions,
}) {
  return (
    <div className="space-y-6">
      <Section
        icon={getStepIcon(4, "h-5 w-5")}
        title="Property Details (LAP / Mortgage)"
      >
        <Field label="Property Owner Name">
          <input
            name="propertyOwnerName"
            value={formData.propertyOwnerName || ""}
            onChange={handleInputChange}
            placeholder="Enter property owner name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        <Field label="Relationship With Applicant">
          <Select
            name="relationshipWithApplicant"
            value={formData.relationshipWithApplicant || ""}
            onChange={handleInputChange}
            placeholder="Select relationship"
          >
            {PROPERTY_OWNER_RELATION_OPTIONS.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Plot Size">
          <input
            name="plotSize"
            value={formData.plotSize || ""}
            onChange={handleInputChange}
            placeholder="e.g. 1200 sq yards / 30x40"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        <Field label="Area Sq Ft">
          <input
            name="areaSqFt"
            value={formData.areaSqFt || ""}
            onChange={handleInputChange}
            placeholder="e.g. 1500"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        <Field
          label="Market Value *"
          name="propertyValue"
          type="number"
          min="0"
          value={formData.propertyValue}
          onChange={handleInputChange}
          placeholder="Enter market value"
        />

        <Field
          label="Government Value"
          name="governmentValue"
          type="number"
          min="0"
          value={formData.governmentValue || ""}
          onChange={handleInputChange}
          placeholder="Enter government value"
        />

        <Field label="Property Category">
          <Select
            name="propertyCategory"
            value={formData.propertyCategory}
            onChange={handleCategoryChange}
          >
            {PROPERTY_CATEGORY.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property Type *">
          <Select
            name="propertyType"
            value={formData.propertyType}
            onChange={handleInputChange}
          >
            {propertyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Type of Structure">
          <Select
            name="typeOfStructure"
            value={formData.typeOfStructure || ""}
            onChange={handleInputChange}
            placeholder="Select structure type"
          >
            {STRUCTURE_TYPE_OPTIONS.map((struct) => (
              <option key={struct} value={struct}>
                {struct}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Plot Demarcated">
          <Select
            name="plotDemarcated"
            value={formData.plotDemarcated || ""}
            onChange={handleInputChange}
            placeholder="Select demarcation status"
          >
            {PLOT_DEMARCATED_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Type of Usage of Entire Property">
          <Select
            name="propertyUsageType"
            value={formData.propertyUsageType || ""}
            onChange={handleInputChange}
            placeholder="Select property usage"
          >
            {PROPERTY_USAGE_TYPE_OPTIONS.map((usage) => (
              <option key={usage} value={usage}>
                {usage}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Type of Premises">
          <Select
            name="premisesType"
            value={formData.premisesType || ""}
            onChange={handleInputChange}
            placeholder="Select premises type"
          >
            {PREMISES_TYPE_OPTIONS.map((premise) => (
              <option key={premise} value={premise}>
                {premise}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property Occupancy (Occupied By)">
          <input
            name="occupiedBy"
            value={formData.occupiedBy || ""}
            onChange={handleInputChange}
            placeholder="e.g. Owner / Tenant Name / Vacant / Family Member"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        <Field label="Construction Details (Construction Status)">
          <Select
            name="constructionStatus"
            value={formData.constructionStatus || ""}
            onChange={handleInputChange}
            placeholder="Select construction status"
          >
            {CONSTRUCTION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <PropertyAddressAutocomplete
          propertyAddress={formData.propertyAddress}
          city={formData.city}
          state={formData.state}
          pinCode={formData.pinCode}
          onChange={(updatedFields) => {
            setFormData((previous) => ({
              ...previous,
              ...updatedFields,
            }));
          }}
        />
      </Section>
    </div>
  );
}
