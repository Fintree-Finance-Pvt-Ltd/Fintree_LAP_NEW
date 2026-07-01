import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaCheckCircle, FaInfoCircle, FaShieldAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";
import { requiredDocumentTypes } from "../rmUtils.js";

const documentLabels = {
  PAN: "PAN Card",
  AADHAAR: "Aadhaar / OVD",
  PHOTO: "Photograph",
  BANK_STATEMENT: "Bank Statement",
  PROPERTY_DOCUMENT: "Property Document",
  INCOME_PROOF: "Income Proof",
  OTHER: "Other Document",
};

export default function KycDocuments() {
  const { applicationId: routeApplicationId } = useParams();
  const [applicationId, setApplicationId] = useState(routeApplicationId || "");
  const [uploadingType, setUploadingType] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const applications = useQuery({ queryKey: ["rm-applications-documents"], queryFn: () => rmApi.applications({ page: 1, limit: 100 }) });
  //const selectedId = applicationId || routeApplicationId || applications.data?.data?.[0]?.id || "";
  const applicationList =
    applications.data?.data?.data ??
    applications.data?.data ??
    [];

  const selectedId =
    applicationId ||
    routeApplicationId ||
    applicationList?.[0]?.id ||
    "";
  const documentsQuery = useQuery({
    queryKey: ["rm-documents", selectedId],
    queryFn: () => rmApi.documents(selectedId),
    enabled: Boolean(selectedId),
  });

  const [
    showAddDocumentModal,
    setShowAddDocumentModal,
  ] = useState(false);

  const [
    newDocumentName,
    setNewDocumentName,
  ] = useState("");

  const [
    newDocumentFile,
    setNewDocumentFile,
  ] = useState(null);

  const [
    addDocumentError,
    setAddDocumentError,
  ] = useState("");

  const uploadedDocuments =
    documentsQuery.data?.data?.data ??
    documentsQuery.data?.data ??
    [];

  const uploadedTypes = useMemo(() => new Set(uploadedDocuments.map((doc) => doc.documentType)), [uploadedDocuments]);
  const verified = requiredDocumentTypes.filter((type) => uploadedTypes.has(type)).length;
  const completion = Math.round((verified / requiredDocumentTypes.length) * 100);

  // const upload = useMutation({
  //   mutationFn: ({ documentType, file }) => {
  //     const formData = new FormData();
  //     formData.append("applicationId", selectedId);
  //     formData.append("documentType", documentType);
  //     formData.append("documentName", documentLabels[documentType]);
  //     formData.append("file", file);
  //     return rmApi.uploadDocument(formData);
  //   },
  //   onSuccess: async () => {
  //     setMessage("Documents uploaded and workflow state refreshed.");
  //     await queryClient.invalidateQueries({ queryKey: ["rm-documents", selectedId] });
  //     await queryClient.invalidateQueries({ queryKey: ["rm-workflow", selectedId] });
  //     await queryClient.invalidateQueries({ queryKey: ["rm-workflow-overview"] });
  //     await rmApi.recordWorkflowStep(selectedId, { action: "DOCUMENTS_UPLOADED", remarks: "Documents uploaded" }).catch(() => undefined);
  //   },
  //   onSettled: () => setUploadingType(""),
  // });

  const metrics = [
    { title: "UPLOADED", value: verified, color: "from-blue-500/10 to-indigo-500/5", textColor: "text-blue-600" },
    { title: "TOTAL REQUIRED", value: requiredDocumentTypes.length, color: "from-emerald-500/10 to-teal-500/5", textColor: "text-emerald-600" },
    { title: "COMPLETION", value: `${completion}%`, color: "from-rose-500/10 to-pink-500/5", textColor: "text-rose-600" },
    { title: "KYC STATUS", value: completion === 100 ? "Ready" : "Pending", color: "from-amber-500/10 to-orange-500/5", textColor: "text-amber-600" },
  ];


  // const upload = useMutation({
  //   mutationFn: ({
  //     applicationId,
  //     documentType,
  //     documentName,
  //     file,
  //   }) => {
  //     const formData = new FormData();

  //     formData.append(
  //       "documentType",
  //       documentType,
  //     );

  //     formData.append(
  //       "documentName",
  //       documentName || documentType,
  //     );

  //     formData.append("file", file);

  //     return rmApi.uploadDocument(
  //       applicationId,
  //       formData,
  //     );
  //   },

  //   onSuccess: async () => {
  //     setMessage(
  //       "Document uploaded successfully.",
  //     );

  //     await Promise.all([
  //       queryClient.invalidateQueries({
  //         queryKey: [
  //           "rm-documents",
  //           selectedId,
  //         ],
  //       }),

  //       queryClient.invalidateQueries({
  //         queryKey: [
  //           "rm-workflow",
  //           selectedId,
  //         ],
  //       }),

  //       queryClient.invalidateQueries({
  //         queryKey: [
  //           "rm-workflow-overview",
  //         ],
  //       }),
  //     ]);
  //   },

  //   onError: (error) => {
  //     const errorMessage =
  //       error?.response?.data?.message ||
  //       error?.message ||
  //       "Document upload failed.";

  //     setMessage(errorMessage);

  //     console.error(
  //       "Document upload failed:",
  //       error?.response?.data || error,
  //     );
  //   },

  //   onSettled: () => {
  //     setUploadingType("");
  //   },
  // });

  const upload = useMutation({
    mutationFn: ({
      applicationId,
      documentType,
      documentName,
      file,
    }) => {
      const formData =
        new FormData();

      formData.append(
        "applicationId",
        String(
          Number(applicationId),
        ),
      );

      formData.append(
        "documentType",
        String(documentType)
          .trim()
          .toUpperCase(),
      );

      formData.append(
        "documentName",
        String(
          documentName ||
          documentType,
        ).trim(),
      );

      formData.append(
        "documentSource",
        "RM_PORTAL",
      );

      formData.append(
        "file",
        file,
      );

      return rmApi.uploadDocument(
        formData,
      );
    },

    onSuccess: async (
      response,
      variables,
    ) => {
      setMessage(
        response?.data?.message ||
        response?.data?.data
          ?.message ||
        response?.message ||
        "Document uploaded successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "rm-documents",
            selectedId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "rm-workflow",
            selectedId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "rm-workflow-overview",
          ],
        }),
      ]);

      if (
        variables.documentType ===
        "OTHER"
      ) {
        setShowAddDocumentModal(
          false,
        );

        setNewDocumentName("");
        setNewDocumentFile(null);
        setAddDocumentError("");
      }
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data
          ?.message ||
        error?.message ||
        "Document upload failed.";

      const finalMessage =
        Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage;

      setMessage(finalMessage);

      if (
        uploadingType ===
        "ADDITIONAL_DOCUMENT"
      ) {
        setAddDocumentError(
          finalMessage,
        );
      }

      console.error(
        "Document upload failed:",
        error?.response?.data ||
        error,
      );
    },

    onSettled: () => {
      setUploadingType("");
    },
  });


  const handleAddDocument = () => {
    setAddDocumentError("");

    if (!selectedId) {
      setAddDocumentError(
        "Please select an application first.",
      );

      return;
    }

    const documentName =
      newDocumentName.trim();

    if (!documentName) {
      setAddDocumentError(
        "Document name is required.",
      );

      return;
    }

    if (!newDocumentFile) {
      setAddDocumentError(
        "Please select a document file.",
      );

      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        newDocumentFile.type,
      )
    ) {
      setAddDocumentError(
        "Only PDF, JPG and PNG files are allowed.",
      );

      return;
    }

    const maximumFileSize =
      15 * 1024 * 1024;

    if (
      newDocumentFile.size >
      maximumFileSize
    ) {
      setAddDocumentError(
        "File size must not exceed 15 MB.",
      );

      return;
    }

    setUploadingType(
      "ADDITIONAL_DOCUMENT",
    );

    upload.mutate({
      applicationId:
        Number(selectedId),

      documentType:
        "OTHER",

      documentName,

      file:
        newDocumentFile,
    });
  };

  const additionalDocuments =
    uploadedDocuments.filter(
      (document) =>
        document.documentType ===
        "OTHER",
    );

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-8 text-slate-800 antialiased">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">KYC, Consent & Document Checklist</h2>
            <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">Applicant, income, banking and property documents.</p>
          </div>
          <select value={selectedId} onChange={(event) => setApplicationId(event.target.value)} className="rounded-xl border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-bold text-white outline-none">
            {/* //{(applications.data?.data ?? []).map((item) => ( */}
            {applicationList.map((item) => (
              <option key={item.id} value={item.id} className="text-slate-900">
                {item.applicationNumber} - {item.customerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">{message}</div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((card) => (
          <div key={card.title} className={`rounded-2xl border border-white bg-white bg-gradient-to-br ${card.color} p-6 shadow-sm`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.title}</div>
            <div className={`mt-2 text-3xl font-extrabold tracking-tight ${card.textColor}`}>{documentsQuery.isLoading ? "--" : card.value}</div>
          </div>
        ))}
      </div>

      {/* <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">Consent controls</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {["Mobile OTP and application consent", "Credit bureau consent", "CKYC retrieval consent", "DigiLocker / document consent", "Account Aggregator / banking consent", "Property verification consent"].map((label) => (
            <div key={label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <input type="checkbox" className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <div>
                <div className="text-xs font-bold text-slate-800">{label}</div>
                <div className="mt-0.5 text-[10px] font-medium text-slate-400">Capture consent evidence before using external verification services.</div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
              Document Checklist
            </h3>

            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Upload and manage applicant KYC documents
            </p>
          </div>

          <button
            type="button"
            disabled={
              !selectedId ||
              upload.isPending
            }
            onClick={() => {
              setNewDocumentName("");
              setNewDocumentFile(null);
              setAddDocumentError("");

              setShowAddDocumentModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base leading-none">
              +
            </span>

            Add Document
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="w-[40%] p-4 pl-6">Document</th>
                <th className="w-[25%] p-4">Latest File</th>
                <th className="w-[15%] p-4">Status</th>
                <th className="w-[20%] p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {requiredDocumentTypes
                .filter(
                  (type) => type !== "OTHER",
                )
                .map((type) => {
                  const latest = uploadedDocuments.find((doc) => doc.documentType === type);
                  const uploaded = Boolean(latest);
                  return (
                    <tr key={type} className="transition-colors hover:bg-slate-50/40">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{documentLabels[type]}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">PDF/JPG/PNG, max 15 MB</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-500">{latest?.fileName || "-"}</td>
                      <td className="p-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${uploaded ? "border border-emerald-200 bg-emerald-50 text-emerald-600" : "border border-rose-200 bg-rose-50 text-rose-600"}`}>
                          {uploaded ? "Uploaded" : "Pending"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <label className="inline-flex cursor-pointer rounded-lg border border-blue-200 bg-blue-50/40 px-4 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-50">
                          {/* {uploadingType === type ? "Uploading..." : uploaded ? "Replace" : "Upload"} */}
                          {upload.isPending &&
                            uploadingType === type
                            ? "Uploading..."
                            : uploaded
                              ? "Replace"
                              : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={
                              !selectedId ||
                              upload.isPending
                            }
                            onChange={(event) => {
                              const file =
                                event.target.files?.[0];

                              if (!file) {
                                return;
                              }

                              setUploadingType(type);
                              upload.mutate({
                                applicationId:
                                  Number(selectedId),

                                documentType:
                                  type,

                                documentName:
                                  documentLabels[type] ||
                                  type,

                                file,
                              });

                              event.target.value = "";
                            }}
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              {additionalDocuments.map(
                (document) => (
                  <tr
                    key={document.id}
                    className="transition-colors hover:bg-slate-50/40"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">
                        {document.documentName ||
                          "Additional Document"}
                      </div>

                      <div className="mt-0.5 text-[10px] text-slate-400">
                        Additional KYC document
                      </div>
                    </td>

                    <td className="p-4">
                      <p
                        className="max-w-[220px] truncate font-semibold text-slate-500"
                        title={
                          document.fileName || ""
                        }
                      >
                        {document.fileName || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        Uploaded
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-center">
                      <span className="text-[10px] font-semibold text-slate-400">
                        Additional
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h3 className="text-sm font-extrabold tracking-wide text-[#0f2942]">
      Document Checklist
    </h3>

    <p className="mt-1 text-[11px] font-medium text-slate-400">
      Upload and manage KYC documents
    </p>
  </div>

  <button
    type="button"
    disabled={
      !selectedId ||
      upload.isPending
    }
    onClick={() => {
      setNewDocumentName("");
      setNewDocumentFile(null);
      setAddDocumentError("");

      setShowAddDocumentModal(
        true,
      );
    }}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span className="text-base leading-none">
      +
    </span>

    Add Document
  </button>
</div> */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#0f2942]"><FaCheckCircle className="text-emerald-500" /> KYC results</h3>
          <div className="divide-y divide-slate-100 pt-1">
            <Result label="PAN validation" value={uploadedTypes.has("PAN") ? "Document uploaded" : "Pending"} />
            <Result label="Aadhaar validation" value={uploadedTypes.has("AADHAAR") ? "Document uploaded" : "Pending"} />
            <Result label="Photo" value={uploadedTypes.has("PHOTO") ? "Available" : "Pending"} />
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#0f2942]"><FaShieldAlt className="text-blue-600" /> Document security</h3>
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-xs font-medium text-blue-800">
            <FaInfoCircle className="mt-0.5 shrink-0" />
            Uploaded files are stored through the backend document service with metadata, uploader and workflow linkage.
          </div>
        </div>
      </div>

      {showAddDocumentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#0f2942]">
                  Add KYC Document
                </h3>

                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Upload an additional customer document
                </p>
              </div>

              <button
                type="button"
                disabled={upload.isPending}
                onClick={() => {
                  setShowAddDocumentModal(
                    false,
                  );

                  setNewDocumentName("");
                  setNewDocumentFile(null);
                  setAddDocumentError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Document Name
                  <span className="ml-1 text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={newDocumentName}
                  disabled={upload.isPending}
                  onChange={(event) => {
                    setNewDocumentName(
                      event.target.value,
                    );

                    setAddDocumentError("");
                  }}
                  placeholder="Example: Electricity Bill"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Select File
                  <span className="ml-1 text-rose-500">
                    *
                  </span>
                </label>

                <label
                  className={`block rounded-xl border-2 border-dashed p-5 text-center transition-all ${upload.isPending
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : "cursor-pointer border-blue-200 bg-blue-50/30 hover:border-blue-400"
                    }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={upload.isPending}
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0] ||
                        null;

                      setNewDocumentFile(
                        file,
                      );

                      setAddDocumentError(
                        "",
                      );
                    }}
                  />

                  {newDocumentFile ? (
                    <>
                      <p className="truncate text-xs font-bold text-blue-700">
                        {
                          newDocumentFile.name
                        }
                      </p>

                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {(
                          newDocumentFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-700">
                        Click to select a file
                      </p>

                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        PDF, JPG or PNG, maximum 15 MB
                      </p>
                    </>
                  )}
                </label>
              </div>

              {addDocumentError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {addDocumentError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                disabled={upload.isPending}
                onClick={() => {
                  setShowAddDocumentModal(
                    false,
                  );

                  setNewDocumentName("");
                  setNewDocumentFile(null);
                  setAddDocumentError("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  upload.isPending ||
                  !newDocumentName.trim() ||
                  !newDocumentFile
                }
                onClick={
                  handleAddDocument
                }
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {upload.isPending &&
                  uploadingType ===
                  "ADDITIONAL_DOCUMENT"
                  ? "Uploading..."
                  : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Result({ label, value }) {
  const ready = value !== "Pending";
  return (
    <div className="flex items-center justify-between py-2.5 text-xs">
      <span className="font-semibold text-slate-400">{label}</span>
      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${ready ? "border border-emerald-100 bg-emerald-50 text-emerald-600" : "border border-rose-100 bg-rose-50 text-rose-600"}`}>{value}</span>
    </div>
  );
}
