import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppCard from "../../../components/common/AppCard.jsx";
import AppLoader from "../../../components/common/AppLoader.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import WorkflowHistory from "../../../components/workflow/WorkflowHistory.jsx";

import { applicationsApi } from "../applicationsApi.js";
import { rmApi } from "../../rm/rmApi.js";
import { buildWorkflowTimeline } from "../../rm/rmUtils.js";

const unwrapPayload = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response ?? null;
};

const unwrapArray = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.coApplicants)) return payload.coApplicants;
  if (Array.isArray(payload?.contactPersons)) return payload.contactPersons;
  if (Array.isArray(payload?.documents)) return payload.documents;

  return [];
};

const readValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const normalizeCoApplicant = (row) => ({
  id: readValue(row, [
    "id",
    "coApplicantId",
    "co_applicant_id",
  ]),
  name: readValue(row, [
    "name",
    "fullName",
    "full_name",
    "customerName",
    "customer_name",
  ]),
  mobile: readValue(row, [
    "mobile",
    "mobileNumber",
    "mobile_number",
    "phone",
    "phoneNumber",
  ]),
  email: readValue(row, [
    "email",
    "emailId",
    "email_id",
  ]),
  pan: readValue(row, [
    "panNumber",
    "pan_number",
    "pan",
  ]),
  aadhaar: readValue(row, [
    "aadhaarNumber",
    "aadhaar_number",
    "aadharNumber",
    "aadhar_number",
  ]),
  relationship: readValue(row, [
    "relationship",
    "relation",
  ]),
  occupation: readValue(row, [
    "occupation",
    "occupationType",
    "occupation_type",
  ]),
  monthlyIncome: readValue(row, [
    "monthlyIncome",
    "monthly_income",
    "income",
  ]),
});

const normalizeContactPerson = (row) => ({
  id: readValue(row, [
    "id",
    "contactPersonId",
    "contact_person_id",
  ]),
  name: readValue(row, [
    "name",
    "fullName",
    "full_name",
    "contactName",
    "contact_name",
  ]),
  mobile: readValue(row, [
    "mobile",
    "mobileNumber",
    "mobile_number",
    "phone",
    "phoneNumber",
  ]),
  email: readValue(row, [
    "email",
    "emailId",
    "email_id",
  ]),
  designation: readValue(row, [
    "designation",
    "role",
  ]),
  relationship: readValue(row, [
    "relationship",
    "relation",
  ]),
});

const valueOrDash = (value) => {
  const finalValue = String(value ?? "").trim();
  return finalValue || "—";
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatAmount = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDocumentUrl = (document) => {
  if (!document) return "";

  const directUrl =
    document.fileUrl ||
    document.file_url ||
    document.documentUrl ||
    document.url;

  if (directUrl) return directUrl;

  const filePath =
    document.filePath ||
    document.file_path ||
    "";

  if (!filePath) return "";

  if (String(filePath).startsWith("http")) {
    return filePath;
  }

  return `http://localhost:9000/${String(filePath).replace(/^\/+/, "")}`;
};

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">
        {String(value ?? "").trim() || "—"}
      </p>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
        {title}
      </h3>

      {subtitle && (
        <p className="mt-1 text-xs font-medium text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams();

  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");


  const submitToBm = useMutation({
    mutationFn: () => rmApi.submitToBm(applicationId),

    onSuccess: async (response) => {
      setSubmitMessage(
        response?.data?.message ||
          "Application submitted to BM successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["application", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rm-workflow", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workflow-history", applicationId],
        }),
      ]);
    },

    onError: (error) => {
      setSubmitMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit to BM.",
      );
    },
  });

  const applicationQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => applicationsApi.get(applicationId),
    enabled: Boolean(applicationId),
  });

  const workflowQuery = useQuery({
    queryKey: ["rm-workflow", applicationId],
    queryFn: () => rmApi.workflowStatus(applicationId),
    enabled: Boolean(applicationId),
  });

  const historyQuery = useQuery({
    queryKey: ["workflow-history", applicationId],
    queryFn: () => rmApi.workflowHistory(applicationId),
    enabled: Boolean(applicationId),
  });

  const documentsQuery = useQuery({
    queryKey: ["rm-documents", applicationId],
    queryFn: () => rmApi.documents(applicationId),
    enabled: Boolean(applicationId),
  });

  const coApplicantsQuery = useQuery({
    queryKey: ["co-applicants", applicationId],
    queryFn: () => rmApi.getCoApplicants(applicationId),
    enabled: Boolean(applicationId),
  });

  const contactPersonsQuery = useQuery({
    queryKey: ["contact-persons", applicationId],
    queryFn: () => rmApi.getContactPersons(applicationId),
    enabled: Boolean(applicationId),
  });

  const fieldVisitsQuery = useQuery({
    queryKey: ["field-visits", applicationId],
    queryFn: () => rmApi.getFieldVisits(applicationId),
    enabled: Boolean(applicationId),
  });

  const geoLocationsQuery = useQuery({
    queryKey: ["geo-locations", applicationId],
    queryFn: () => rmApi.getGeoLocations(applicationId),
    enabled: Boolean(applicationId),
  });

  const chargesQuery = useQuery({
    queryKey: ["charges-receipts", applicationId],
    queryFn: () => rmApi.getChargeSchedule(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  });

  const isLoading =
    applicationQuery.isLoading ||
    workflowQuery.isLoading ||
    documentsQuery.isLoading;

  if (isLoading) {
    return <AppLoader />;
  }

  const application = unwrapPayload(applicationQuery.data);

  if (!application) {
    return <div className="p-6">Application not found</div>;
  }

  const workflowFlags = unwrapPayload(workflowQuery.data) ?? {};
  const workflowSteps = buildWorkflowTimeline(workflowFlags);

  const documents = unwrapArray(documentsQuery.data);

  const coApplicants = unwrapArray(coApplicantsQuery.data)
    .map(normalizeCoApplicant)
    .filter(
      (item) =>
        item.name ||
        item.mobile ||
        item.pan ||
        item.aadhaar,
    );

  const contactPersons = unwrapArray(contactPersonsQuery.data)
    .map(normalizeContactPerson)
    .filter(
      (item) =>
        item.name ||
        item.mobile ||
        item.email ||
        item.designation,
    );

  const fieldVisits = unwrapArray(fieldVisitsQuery.data);
  const geoLocations = unwrapArray(geoLocationsQuery.data);
  const charges = unwrapArray(chargesQuery.data);
  const historyItems = unwrapArray(historyQuery.data);

  const visibleDocuments = showAllDocuments
    ? documents
    : documents.slice(0, 3);

  const hiddenDocumentCount = Math.max(
    documents.length - 3,
    0,
  );

  const completedSteps = workflowSteps.filter(
    (step) => step.completed,
  ).length;

  const progress = workflowSteps.length
    ? Math.round((completedSteps / workflowSteps.length) * 100)
    : 0;

  const applicant = {
    name: application.customerName,
    mobile:
      application.mobile ||
      application.mobileNumber ||
      application.phoneNumber,
    email:
      application.email ||
      application.emailId,
    pan:
      application.pan ||
      application.panNumber,
    aadhaar:
      application.aadhaarNumber,
    occupation:
      application.occupationType ||
      application.occupation,
    businessName:
      application.businessName,
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] p-6 text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-sm transition-all">
  <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
    
    {/* Left Column: Details */}
    <div className="space-y-4 max-w-xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
        Live Case Profile
      </div>

      <PageHeader
        title={
          application.applicationNumber || `Application #${applicationId}`
        }
        subtitle={
          application.customerName || "Applicant case details"
        }
        className="text-slate-900 text-2xl font-bold tracking-tight"
      />

      {/* Badges & Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
            Stage: <strong className="text-slate-900 font-semibold">{formatLabel(application.stage)}</strong>
          </span>

          <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
            Status: <strong className="text-slate-900 font-semibold">{formatLabel(application.status)}</strong>
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
  <button
    type="button"
    disabled={
      submitToBm.isPending ||
      String(application.status || "").toUpperCase() === "BM_PENDING"
    }
    onClick={() => {
      setSubmitMessage("");
      submitToBm.mutate();
    }}
    className="inline-flex w-fit items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
  >
    {submitToBm.isPending ? "Submitting..." : "Submit to BM"}
  </button>

  {submitMessage && (
    <span className="text-xs font-bold text-blue-700">
      {submitMessage}
    </span>
  )}
</div>
    </div>

    {/* Right Column: Key Metrics Grid */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[480px] shrink-0">
      {[
        { label: "Documents", count: documents.length },
        { label: "Co-Applicants", count: coApplicants.length },
        { label: "Contacts", count: contactPersons.length },
        { label: "Visits", count: fieldVisits.length },
      ].map((metric, i) => (
        <div
          key={i}
          className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
        >
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {metric.label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
            {metric.count}
          </p>
        </div>
      ))}
    </div>

  </div>
</div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left */}
          <div className="space-y-6 xl:col-span-2">
            <AppCard className="p-6">
              <SectionTitle
                title="Collected Applicant Details"
                subtitle="Primary applicant data fetched from application API."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoTile
                  label="Applicant Name"
                  value={applicant.name}
                />
                <InfoTile
                  label="Mobile"
                  value={applicant.mobile}
                />
                <InfoTile
                  label="Email"
                  value={applicant.email}
                />
                <InfoTile
                  label="PAN"
                  value={applicant.pan}
                />
                <InfoTile
                  label="Aadhaar / OVD"
                  value={applicant.aadhaar}
                />
                <InfoTile
                  label="Occupation"
                  value={formatLabel(applicant.occupation)}
                />
                <InfoTile
                  label="Business Name"
                  value={applicant.businessName}
                />
                <InfoTile
                  label="Application Stage"
                  value={formatLabel(application.stage)}
                />
                <InfoTile
                  label="Application Status"
                  value={formatLabel(application.status)}
                />
              </div>
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Address & Property Details"
                subtitle="Address, collateral and valuation details collected during lead creation."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoTile
                  label="Property Category"
                  value={application.propertyCategory}
                />
                <InfoTile
                  label="Property Type"
                  value={application.propertyType}
                />
                <InfoTile
                  label="Property Value"
                  value={formatAmount(
                    application.marketValue ||
                      application.propertyValue,
                  )}
                />
                <InfoTile
                  label="Property Address"
                  value={application.propertyAddress}
                />
                <InfoTile
                  label="City"
                  value={application.propertyCity || application.city}
                />
                <InfoTile
                  label="State"
                  value={application.propertyState || application.state}
                />
                <InfoTile
                  label="Pincode"
                  value={
                    application.propertyPincode ||
                    application.pinCode
                  }
                />
              </div>
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Co-Applicant Details"
                subtitle="Co-applicant details fetched from co-applicant API."
              />

              {coApplicantsQuery.isLoading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-400">
                  Loading co-applicants...
                </div>
              ) : coApplicants.length ? (
                <div className="space-y-4">
                  {coApplicants.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                            Co-Applicant {index + 1}
                          </p>
                          <h4 className="mt-1 text-lg font-extrabold text-slate-900">
                            {valueOrDash(item.name)}
                          </h4>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase text-blue-700">
                          {formatLabel(item.relationship)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <InfoTile
                          label="Mobile"
                          value={item.mobile}
                        />
                        <InfoTile
                          label="Email"
                          value={item.email}
                        />
                        <InfoTile
                          label="PAN"
                          value={item.pan}
                        />
                        <InfoTile
                          label="Aadhaar / OVD"
                          value={item.aadhaar}
                        />
                        <InfoTile
                          label="Occupation"
                          value={formatLabel(item.occupation)}
                        />
                        <InfoTile
                          label="Monthly Income"
                          value={formatAmount(item.monthlyIncome)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                  No co-applicant details found from API.
                </div>
              )}
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Contact Person Details"
                subtitle="Contact/reference details fetched from contact person API."
              />

              {contactPersonsQuery.isLoading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-400">
                  Loading contact persons...
                </div>
              ) : contactPersons.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {contactPersons.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/30 p-5 shadow-sm"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                            Contact Person {index + 1}
                          </p>
                          <h4 className="mt-1 text-lg font-extrabold text-slate-900">
                            {valueOrDash(item.name)}
                          </h4>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase text-indigo-700">
                          {formatLabel(item.relationship)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <InfoTile
                          label="Mobile"
                          value={item.mobile}
                        />
                        <InfoTile
                          label="Email"
                          value={item.email}
                        />
                        <InfoTile
                          label="Designation"
                          value={item.designation}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                  No contact person details found from API.
                </div>
              )}
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Verification, Geo & Charges"
                subtitle="Additional details collected from visits, geo-location and charges APIs."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoTile
                  label="Field Visits"
                  value={fieldVisits.length}
                />
                <InfoTile
                  label="Geo Locations"
                  value={geoLocations.length}
                />
                <InfoTile
                  label="Charges / Receipts"
                  value={charges.length}
                />
              </div>

              {geoLocations.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                  <h4 className="mb-3 text-sm font-extrabold text-slate-800">
                    Latest Geo Location
                  </h4>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoTile
                      label="Latitude"
                      value={geoLocations[0]?.latitude}
                    />
                    <InfoTile
                      label="Longitude"
                      value={geoLocations[0]?.longitude}
                    />
                    <InfoTile
                      label="Captured At"
                      value={formatDateTime(
                        geoLocations[0]?.createdAt ||
                          geoLocations[0]?.created_at,
                      )}
                    />
                  </div>
                </div>
              )}
            </AppCard>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <AppCard className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                    Document Card
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Showing {visibleDocuments.length} of{" "}
                    {documents.length} documents.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700">
                  {documents.length} Files
                </span>
              </div>

              {documents.length ? (
                <>
                  <div className="space-y-3">
                    {visibleDocuments.map((document) => {
                      const documentUrl = getDocumentUrl(document);

                      return (
                        <div
                          key={document.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-800">
                                {document.documentName ||
                                  document.document_name ||
                                  document.documentType ||
                                  document.document_type ||
                                  "Document"}
                              </p>

                              <p
                                className="mt-1 truncate text-xs font-semibold text-slate-400"
                                title={
                                  document.fileName ||
                                  document.file_name
                                }
                              >
                                {document.fileName ||
                                  document.file_name ||
                                  "—"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                                  {document.documentType ||
                                    document.document_type ||
                                    "OTHER"}
                                </span>

                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                                  {document.status || "UPLOADED"}
                                </span>
                              </div>
                            </div>

                            {documentUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    documentUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700 transition-all hover:bg-blue-100"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {documents.length > 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllDocuments((previous) => !previous)
                      }
                      className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-blue-700 transition-all hover:bg-blue-100"
                    >
                      {showAllDocuments
                        ? "Show Only 3 Documents"
                        : `Show All Documents (${hiddenDocumentCount} More)`}
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                  No documents found from API.
                </div>
              )}
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Live Activity Timeline"
                subtitle="Generated from live workflow API flags."
              />

              <div className="relative space-y-5 border-l-2 border-slate-200 pl-5">
                {workflowSteps.map((item, index) => {
                  const firstPendingIndex = workflowSteps.findIndex(
                    (step) => !step.completed,
                  );

                  const isCurrent =
                    !item.completed &&
                    index === firstPendingIndex;

                  return (
                    <div
                      key={item.key || item.label}
                      className="relative"
                    >
                      <span
                        className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                          item.completed
                            ? "bg-emerald-500"
                            : isCurrent
                              ? "bg-blue-600"
                              : "bg-slate-300"
                        }`}
                      />

                      <p
                        className={`text-sm font-extrabold ${
                          item.completed || isCurrent
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {item.completed
                          ? "Completed"
                          : isCurrent
                            ? "Current step"
                            : "Pending"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </AppCard>

            <AppCard className="p-6">
              <SectionTitle
                title="Audit Logs & History"
                subtitle="Workflow history fetched from API."
              />

              <WorkflowHistory items={historyItems} />
            </AppCard>
          </div>
        </div>
      </div>
    </div>
  );
}