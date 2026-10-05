import { PROPERTY_TYPE } from "../../../rmUtils.js";

export const NATURE_OF_BUSINESS_OPTIONS = [
  "Trading",
  "Manufacturing",
  "Services",
  "Retail",
  "Wholesale",
  "Professional Services",
  "Construction / Real Estate",
  "Transport / Logistics",
  "Agriculture / Allied Activities",
  "Hospitality / Restaurant",
  "Healthcare / Medical",
  "Education / Training",
  "IT / Software / Technology",
  "Financial Services",
  "Automobile / Dealership",
  "Textile / Garments",
  "FMCG / Consumer Goods",
  "E-commerce",
  "Import / Export",
  "Contractor",
  "Other",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const LOCAL_BODY_OPTIONS = [
  "Gram Panchayat",
  "Municipal Corporation",
  "Municipality / Municipal Council",
  "Town Panchayat / Cantonment Board",
];

export const RESIDENCE_TYPE_OPTIONS = [
  "Owned",
  "Rented",
  "Family Owned",
  "Company Provided",
];

export const REFERENCE_TYPE_OPTIONS = [
  "Purchaser",
  "Supplier",
  "Seller",
  "Customer",
  "Neighbour",
];

export const FAMILY_RELATION_OPTIONS = [
  "Brother",
  "Sister",
  "Partner",
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
];

export const PROPERTY_OWNER_RELATION_OPTIONS = [
  "Self",
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Partner",
  "Other",
];

export const STRUCTURE_TYPE_OPTIONS = [
  "RCC",
  "Stone",
  "BB",
  "GI Sheet",
  "Plot",
  "Load Bearing",
  "Mangalore Tiles",
];

export const PLOT_DEMARCATED_OPTIONS = ["Yes", "No"];

export const PROPERTY_USAGE_TYPE_OPTIONS = [
  "SOCP",
  "Rented Residential",
  "Self Commercial",
  "Industrial Shed",
  "Vacant Land",
  "Residential",
];

export const PREMISES_TYPE_OPTIONS = [
  "Raw House",
  "Flat",
  "Bungalow",
  "Shop",
  "Industrial",
  "Plot",
  "Office",
];

export const CONSTRUCTION_STATUS_OPTIONS = ["Under Construction", "Completed"];

export const emptyForm = {
  customerName: "",
  customerType: "INDIVIDUAL",
  dob: "",
  gender: "",
  maritalStatus: "",
  nationality: "INDIAN",
  mobileNumber: "",
  emailId: "",
  panNumber: "",
  aadhaarNumber: "",
  occupation: "SELF_EMPLOYED",
  constitution: "INDIVIDUAL",
  businessName: "",
  natureOfBusiness: "",
  otherNatureOfBusiness: "",
  businessVintage: "",
  businessAddress: "",
  udyamNumber: "",
  monthlyIncome: "",
  monthlySales: "",
  monthlyProfit: "",
  gstNumber: "",
  // 5. Address Details - Residence Address
  residenceAddressLine1: "",
  residenceAddressLine2: "",
  residenceLandmark: "",
  residenceCity: "",
  residenceDistrict: "",
  residenceState: "",
  residencePincode: "",
  gramPanchayatCorporation: "",
  residenceType: "",
  // 8. Property Details (LAP / Mortgage)
  propertyOwnerName: "",
  relationshipWithApplicant: "",
  plotSize: "",
  areaSqFt: "",
  governmentValue: "",
  // 9. Type of Structure
  typeOfStructure: "",
  // 10. Plot Demarcated
  plotDemarcated: "",
  // 11. Type of Usage of Entire Property
  propertyUsageType: "",
  // 12. Type of Premises
  premisesType: "",
  // 13. Property Occupancy
  occupiedBy: "",
  // 14. Construction Details
  constructionStatus: "",
  // Collateral Property
  propertyCategory: "Residential",
  propertyType: PROPERTY_TYPE.Residential?.[0] || "Independent House",
  propertyValue: "",
  propertyAddress: "",
  city: "",
  state: "",
  pinCode: "",
};

export const emptyCoApplicantForm = {
  id: null,
  name: "",
  mobile: "",
  email: "",
  panNumber: "",
  aadhaarNumber: "",
  relationship: "",
  occupation: "",
  monthlyIncome: "",
  mobileOtp: "",
  mobileOtpSent: false,
  mobileVerified: false,
  emailOtp: "",
  emailOtpSent: false,
  emailVerified: false,
  panFile: null,
  panOcrLoading: false,
  panOcrError: "",
  identityStatus: "NOT_INITIATED",
};

export const CONSENT_TEXT =
  "I hereby provide my consent to Fintree Finance Private Limited to verify my mobile number and process my information for the loan application.";

export const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    subtitle: "Name, contact & KYC",
    headerTitle: "1. Basic Information & KYC",
    headerDesc:
      "Enter the basic personal, contact, and identity verification details of the lead.",
  },
  {
    id: 2,
    title: "Additional Details",
    subtitle: "Employment & residence",
    headerTitle: "2. Employment & Residence Details",
    headerDesc:
      "Provide business profile, income specifics, and residential address.",
  },
  {
    id: 3,
    title: "Co-Applicants & Refs",
    subtitle: "Co-signers & references",
    headerTitle: "3. Co-Applicants, References & Family",
    headerDesc:
      "Add joint applicants, reference contacts, and dependent family members.",
  },
  {
    id: 4,
    title: "Collateral Details",
    subtitle: "Property & valuation",
    headerTitle: "4. Collateral Property Details (LAP / Mortgage)",
    headerDesc:
      "Specify mortgaged asset, guidance valuation, structure type, and property location.",
  },
  {
    id: 5,
    title: "Attachments",
    subtitle: "Upload documents",
    headerTitle: "5. Attachments & Documents",
    headerDesc:
      "Upload verified property title deeds, tax receipts, and financial proofs.",
  },
  {
    id: 6,
    title: "Review & Submit",
    subtitle: "Confirm information",
    headerTitle: "6. Review & Final Submission",
    headerDesc:
      "Review all captured lead details before final underwriting submission.",
  },
];
