export const VISIT_STATUS = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
} as const;

export const VISIT_RESULT = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
  REFER: 'REFER',
} as const;

export const VISIT_TYPE = {
  CUSTOMER_RESIDENCE: 'CUSTOMER_RESIDENCE',
  BUSINESS_OFFICE: 'BUSINESS_OFFICE',

  RESIDENTIAL_PROPERTY: 'RESIDENTIAL_PROPERTY',
  COMMERCIAL_PROPERTY: 'COMMERCIAL_PROPERTY',
  INDUSTRIAL_PROPERTY: 'INDUSTRIAL_PROPERTY',
  LAND_PLOT: 'LAND_PLOT',
} as const;

export const DOCUMENT_SOURCE = {
  FIELD_VISIT: 'FIELD_VISIT',
  OTHER: 'OTHER',
} as const;

export const DOCUMENT_TYPE = {
  PHOTO: 'PHOTO',
} as const;

export const PROPERTY_CATEGORIES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Land / Plot',
  'Residential Property Visit',
  'Business / Office Visit',
  'Customer / Residence Visit',
] as const;

export const CATEGORY_TO_VISIT_TYPE: Record<string, string> = {
  Residential: VISIT_TYPE.RESIDENTIAL_PROPERTY,
  Commercial: VISIT_TYPE.COMMERCIAL_PROPERTY,
  Industrial: VISIT_TYPE.INDUSTRIAL_PROPERTY,
  'Land / Plot': VISIT_TYPE.LAND_PLOT,
};

export const VISIT_TYPE_TO_CATEGORY: Record<string, string> = {
  [VISIT_TYPE.RESIDENTIAL_PROPERTY]: 'Residential',
  [VISIT_TYPE.COMMERCIAL_PROPERTY]: 'Commercial',
  [VISIT_TYPE.INDUSTRIAL_PROPERTY]: 'Industrial',
  [VISIT_TYPE.LAND_PLOT]: 'Land / Plot',
};

export const PROPERTY_VISIT_VISIT_TYPES = [
  VISIT_TYPE.RESIDENTIAL_PROPERTY,
  VISIT_TYPE.COMMERCIAL_PROPERTY,
  VISIT_TYPE.INDUSTRIAL_PROPERTY,
  VISIT_TYPE.LAND_PLOT,
] as const;

export const ALLOWED_VISIT_TYPES = [
  VISIT_TYPE.CUSTOMER_RESIDENCE,
  VISIT_TYPE.BUSINESS_OFFICE,
  VISIT_TYPE.RESIDENTIAL_PROPERTY,
  VISIT_TYPE.COMMERCIAL_PROPERTY,
  VISIT_TYPE.INDUSTRIAL_PROPERTY,
  VISIT_TYPE.LAND_PLOT,
] as const;

export const getRequiredVisitTypes = (
  propertyCategory: string,
): string[] => {
  const propertyVisitType =
    CATEGORY_TO_VISIT_TYPE[propertyCategory];

  if (!propertyVisitType) {
    return [];
  }

  return [
    VISIT_TYPE.CUSTOMER_RESIDENCE,
    VISIT_TYPE.BUSINESS_OFFICE,
    propertyVisitType,
  ];
};

export const DOCUMENT_NAMES: Record<string, readonly string[]> = {
  [VISIT_TYPE.CUSTOMER_RESIDENCE]: [
    'CUSTOMER_RESIDENCE_FRONTAGE',
    'CUSTOMER_RESIDENCE_INTERIOR',
    'CUSTOMER_WITH_RESIDENCE',
    'RESIDENCE_NEARBY_LANDMARK',
  ],

  [VISIT_TYPE.BUSINESS_OFFICE]: [
    'BUSINESS_FRONTAGE',
    'BUSINESS_SIGNBOARD',
    'BUSINESS_INTERIOR',
    'BUSINESS_STOCK',
    'BUSINESS_EMPLOYEE_SETUP',
  ],

  [VISIT_TYPE.RESIDENTIAL_PROPERTY]: [
    'RESIDENTIAL_PROPERTY_FRONTAGE',
    'RESIDENTIAL_PROPERTY_ENTRANCE',
    'RESIDENTIAL_PROPERTY_INTERIOR',
    'RESIDENTIAL_PROPERTY_LANDMARK',
  ],

  [VISIT_TYPE.COMMERCIAL_PROPERTY]: [
    'COMMERCIAL_PROPERTY_FRONTAGE',
    'COMMERCIAL_PROPERTY_SIGNBOARD',
    'COMMERCIAL_PROPERTY_INTERIOR',
    'COMMERCIAL_PROPERTY_LANDMARK',
  ],

  [VISIT_TYPE.INDUSTRIAL_PROPERTY]: [
    'INDUSTRIAL_PROPERTY_GATE',
    'INDUSTRIAL_PROPERTY_SHED',
    'INDUSTRIAL_PROPERTY_MACHINERY',
    'INDUSTRIAL_PROPERTY_APPROACH_ROAD',
  ],

  [VISIT_TYPE.LAND_PLOT]: [
    'LAND_PLOT_FRONTAGE',
    'LAND_PLOT_BOUNDARY',
    'LAND_PLOT_CORNER',
    'LAND_PLOT_SURVEY_MARKER',
    'LAND_PLOT_APPROACH_ROAD',
  ],
};

export const REQUIRED_DOCUMENT_PREFIXES: Record<string, string> = {
  [VISIT_TYPE.CUSTOMER_RESIDENCE]: 'CUSTOMER_RESIDENCE_',
  [VISIT_TYPE.BUSINESS_OFFICE]: 'BUSINESS_',
  [VISIT_TYPE.RESIDENTIAL_PROPERTY]: 'RESIDENTIAL_PROPERTY_',
  [VISIT_TYPE.COMMERCIAL_PROPERTY]: 'COMMERCIAL_PROPERTY_',
  [VISIT_TYPE.INDUSTRIAL_PROPERTY]: 'INDUSTRIAL_PROPERTY_',
  [VISIT_TYPE.LAND_PLOT]: 'LAND_PLOT_',
};

export const FIELD_VISIT_CHECKLIST_KEYS = [
  'customerIdentityMatched',
  'visitWithinAssignedRoute',
  'photosContainExifEvidence',
  'noImageDuplicationDetected',
  'addressComparedWithApplication',
  'negativeObservationsDisclosed',
] as const;

export const STORED_FORMAT = 'longtext' as const;

export const UPLOAD_BASE_URL = (
  process.env.UPLOAD_BASE_URL ??
  'http://localhost:9000'
).replace(/\/+$/, '');

export const normalizePropertyCategory = (
  value: unknown,
): string | null => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  const categories: Record<string, string> = {
    residential: 'Residential',
    'residential property': 'Residential',
    'residential property visit': 'Residential',
    'customer / residence': 'Residential',
    'customer / residence visit': 'Residential',
    customer_residence: 'Residential',

    commercial: 'Commercial',
    'commercial property': 'Commercial',
    'commercial property visit': 'Commercial',
    'business / office': 'Commercial',
    'business / office visit': 'Commercial',
    business_office: 'Commercial',

    industrial: 'Industrial',
    'industrial property': 'Industrial',
    'industrial property visit': 'Industrial',

    'land / plot': 'Land / Plot',
    'land/plot': 'Land / Plot',
    'land plot': 'Land / Plot',
    'land and plot': 'Land / Plot',
    land: 'Land / Plot',
    plot: 'Land / Plot',
  };

  return categories[normalized] || null;
};

export const normalizeVisitType = (
  value: unknown,
): string | null => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');

  const aliases: Record<string, string> = {
    CUSTOMER_RESIDENCE: VISIT_TYPE.CUSTOMER_RESIDENCE,
    BUSINESS_OFFICE: VISIT_TYPE.BUSINESS_OFFICE,

    RESIDENTIAL_PROPERTY: VISIT_TYPE.RESIDENTIAL_PROPERTY,
    COMMERCIAL_PROPERTY: VISIT_TYPE.COMMERCIAL_PROPERTY,
    INDUSTRIAL_PROPERTY: VISIT_TYPE.INDUSTRIAL_PROPERTY,

    LAND_PLOT: VISIT_TYPE.LAND_PLOT,
    LAND: VISIT_TYPE.LAND_PLOT,
    PLOT: VISIT_TYPE.LAND_PLOT,
  };

  return aliases[normalized] || null;
};

export const normalizeVisitResult = (
  value: unknown,
): string | null => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  const results: Record<string, string> = {
    POSITIVE: VISIT_RESULT.POSITIVE,
    NEGATIVE: VISIT_RESULT.NEGATIVE,
    REFER: VISIT_RESULT.REFER,
  };

  return results[normalized] || null;
};

export const getVisitTypeFromDocumentName = (
  documentName: string,
): string | null => {
  for (const [visitType, documentNames] of Object.entries(
    DOCUMENT_NAMES,
  )) {
    if (documentNames.includes(documentName)) {
      return visitType;
    }
  }

  return null;
};