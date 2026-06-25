// import { useEffect, useMemo, useState } from "react";
// import {
//   FaCheck,
//   FaChevronRight,
//   FaRegCommentDots,
//   FaSave,
// } from "react-icons/fa";
// import { useParams } from "react-router-dom";
// import { useNavigate } from "react-router-dom";

// const SIDEBAR_COLOR = "#102552";
// const SIDEBAR_HOVER_COLOR = "#18346f";

// // const stages = [
// //   "Lead",
// //   "Field Verification",
// //   "BM Review",
// //   "CM Screening",
// //   "Credit",
// //   "Legal & Valuation",
// //   "Sanction",
// // ];

// // const initialChecklist = [
// //   {
// //     id: 1,
// //     title: "Source and partner verified",
// //     checked: true,
// //   },
// //   {
// //     id: 2,
// //     title: "Applicant contacted",
// //     checked: true,
// //   },
// //   {
// //     id: 3,
// //     title: "Duplicate PAN/mobile checked",
// //     checked: true,
// //   },
// //   {
// //     id: 4,
// //     title: "Field visit acceptable",
// //     checked: false,
// //   },
// //   {
// //     id: 5,
// //     title: "Geo within permitted radius",
// //     checked: true,
// //   },
// //   {
// //     id: 6,
// //     title: "Minimum documents available",
// //     checked: false,
// //   },
// //   {
// //     id: 7,
// //     title: "Loan purpose acceptable",
// //     checked: true,
// //   },
// //   {
// //     id: 8,
// //     title: "No negative field finding",
// //     checked: true,
// //   },
// // ];

// // const applicantSummary = [
// //   {
// //     label: "Requested",
// //     value: "₹65,00,000",
// //   },
// //   {
// //     label: "Income",
// //     value: "₹1,85,000",
// //   },
// //   {
// //     label: "FOIR",
// //     value: "22.70%",
// //   },
// //   {
// //     label: "Indicative LTV",
// //     value: "61.90%",
// //   },
// //   {
// //     label: "Distance",
// //     value: "18 KM",
// //   },
// //   {
// //     label: "Documents",
// //     value: "5 / 16",
// //   },
// // ];



// const fieldClass =
//   "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10";

// export default function BMReview() {
//   const navigate = useNavigate();
//   const [applications, setApplications] = useState([]);

//   const openReview = (application) => {
//     navigate(`/bmReview/${application.id}`);
//   };

//   return (
//     <div>
//       {applications.map((application) => (
//         <button
//           key={application.id}
//           type="button"
//           onClick={() => openReview(application)}
//         >
//           Review {application.applicationNumber}
//         </button>
//       ))}
//     </div>
//   );

//   const { applicationId } = useParams();

//   const [application, setApplication] =
//     useState(null);

//   const [stages, setStages] =
//     useState([]);

//   const [checklist, setChecklist] =
//     useState([]);
//   const [form, setForm] = useState({
//     sourcingQuality: "Good",
//     geoDecision: "Within Policy",
//     preliminaryEligibility: "Eligible",
//     remarks: "",
//   });
//   const [loading, setLoading] =
//     useState(true);

//   const [loadError, setLoadError] =
//     useState("");
//   const [message, setMessage] = useState("");
//   const [saving, setSaving] = useState(false);


//     useEffect(() => {
//     if (!applicationId) {
//       setLoadError(
//         "Application ID is missing.",
//       );
//       setLoading(false);
//       return;
//     }

//     const controller =
//       new AbortController();

//     const loadReview = async () => {
//       try {
//         setLoading(true);
//         setLoadError("");

//         const response =
//           await bmReviewApi.getByApplicationId(
//             applicationId,
//             {
//               signal: controller.signal,
//             },
//           );

//         const payload =
//           response.data?.data ??
//           response.data;

//         setApplication(
//           payload.application ?? null,
//         );

//         setStages(
//           Array.isArray(payload.stages)
//             ? payload.stages
//             : [],
//         );

//         setChecklist(
//           Array.isArray(payload.checklist)
//             ? payload.checklist
//             : [],
//         );

//         setForm({
//           sourcingQuality:
//             payload.review
//               ?.sourcingQuality ?? "Good",

//           geoDecision:
//             payload.review?.geoDecision ??
//             "Within Policy",

//           preliminaryEligibility:
//             payload.review
//               ?.preliminaryEligibility ??
//             "Eligible",

//           remarks:
//             payload.review?.remarks ?? "",
//         });
//       } catch (error) {
//         if (
//           error?.name === "CanceledError" ||
//           error?.code === "ERR_CANCELED"
//         ) {
//           return;
//         }

//         console.error(
//           "Unable to load BM review:",
//           error,
//         );

//         setLoadError(
//           error?.response?.data?.message ||
//             error?.message ||
//             "Unable to load BM review data.",
//         );
//       } finally {
//         if (!controller.signal.aborted) {
//           setLoading(false);
//         }
//       }
//     };

//     loadReview();

//     return () => {
//       controller.abort();
//     };
//   }, [applicationId]);

  
//   const completedCount = useMemo(() => {
//     return checklist.filter(
//       (item) => item.checked,
//     ).length;
//   }, [checklist]);

//   const allCompleted =
//     completedCount === checklist.length;

//   const progress =
//     checklist.length > 0
//       ? Math.round(
//         (completedCount / checklist.length) *
//         100,
//       )
//       : 0;

//   const toggleChecklist = (id) => {
//     setChecklist((previous) =>
//       previous.map((item) =>
//         item.id === id
//           ? {
//             ...item,
//             checked: !item.checked,
//           }
//           : item,
//       ),
//     );

//     setMessage("");
//   };

//   const handleChange = (event) => {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));

//     setMessage("");
//   };

//   const saveDraft = async () => {
//     try {
//       setSaving(true);
//       setMessage("");

//       /*
//        * Replace this with your backend API call:
//        *
//        * await bmReviewApi.saveDraft({
//        *   checklist,
//        *   ...form,
//        * });
//        */

//       await new Promise((resolve) =>
//         setTimeout(resolve, 500),
//       );

//       setMessage(
//         "BM review draft saved successfully.",
//       );
//     } catch (error) {
//       console.error(
//         "Unable to save BM review:",
//         error,
//       );

//       setMessage(
//         "Unable to save the BM review draft.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const raiseQuery = () => {
//     if (!form.remarks.trim()) {
//       setMessage(
//         "Enter remarks before raising a query.",
//       );

//       return;
//     }

//     /*
//      * Replace with backend API:
//      *
//      * await bmReviewApi.raiseQuery({
//      *   remarks: form.remarks,
//      * });
//      */

//     setMessage(
//       "Query raised successfully to the RM.",
//     );
//   };

//   const approveToCM = () => {
//     if (!allCompleted) {
//       setMessage(
//         "Complete all checklist items before approval.",
//       );

//       return;
//     }

//     if (!form.remarks.trim()) {
//       setMessage(
//         "BM review remarks are required.",
//       );

//       return;
//     }

//     if (
//       form.preliminaryEligibility !==
//       "Eligible"
//     ) {
//       setMessage(
//         "Only eligible cases can be moved to CM screening.",
//       );

//       return;
//     }

//     /*
//      * Replace with backend API:
//      *
//      * await bmReviewApi.approveToCM({
//      *   checklist,
//      *   ...form,
//      * });
//      */

//     setMessage(
//       "Case approved and moved to CM screening.",
//     );
//   };

//   const isError =
//     message.includes("Complete") ||
//     message.includes("required") ||
//     message.includes("Only") ||
//     message.includes("Enter") ||
//     message.includes("Unable");
//   const formatCurrency = (value) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 0,
//     }).format(Number(value ?? 0));

//   const applicantSummary = useMemo(
//     () => [
//       {
//         label: "Requested",
//         value: formatCurrency(
//           application?.requestedAmount,
//         ),
//       },
//       {
//         label: "Income",
//         value: formatCurrency(
//           application?.monthlyIncome,
//         ),
//       },
//       {
//         label: "FOIR",
//         value: `${Number(
//           application?.foir ?? 0,
//         ).toFixed(2)}%`,
//       },
//       {
//         label: "Indicative LTV",
//         value: `${Number(
//           application?.indicativeLtv ?? 0,
//         ).toFixed(2)}%`,
//       },
//       {
//         label: "Distance",
//         value: `${Number(
//           application?.distanceKm ?? 0,
//         )} KM`,
//       },
//       {
//         label: "Documents",
//         value: `${application?.documentsUploaded ?? 0
//           } / ${application?.documentsRequired ?? 0
//           }`,
//       },
//     ],
//     [application],
//   );
//   if (loading) {
//   return (
//     <div className="flex min-h-[300px] items-center justify-center">
//       <div className="text-center">
//         <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#102552]" />

//         <p className="mt-3 text-sm font-medium text-slate-500">
//           Loading BM review...
//         </p>
//       </div>
//     </div>
//   );
// }

// if (loadError) {
//   return (
//     <div className="rounded-xl border border-red-200 bg-red-50 p-5">
//       <h2 className="text-sm font-bold text-red-700">
//         Unable to load review
//       </h2>

//       <p className="mt-2 text-sm text-red-600">
//         {loadError}
//       </p>
//     </div>
//   );
// }

// if (!application) {
//   return (
//     <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
//       Application data was not found.
//     </div>
//   );
// }

//   return (
//     <div className="w-full space-y-3 pb-5">
//       {/* Compact header */}
//       <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center">
//         <div>
//           <div className="flex flex-wrap items-center gap-2">
//             <h1 className="text-lg font-bold text-[#102552]">
//               Branch Manager Review
//             </h1>

//             <span className="rounded-full bg-[#102552]/10 px-2.5 py-1 text-[10px] font-bold text-[#102552]">
//               BM REVIEW
//             </span>
//           </div>

//           <p className="mt-1 text-xs text-slate-500">
//             {application?.applicationNumber ??
//               "Application"}{" "}
//             ·{" "}
//             {application?.customerName ??
//               "Customer"}
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2 lg:ml-auto">
//           <button
//             type="button"
//             onClick={saveDraft}
//             disabled={saving}
//             className="flex h-9 items-center gap-2 rounded-lg border border-[#102552]/20 bg-[#102552]/[0.04] px-3 text-xs font-semibold text-[#102552] transition hover:bg-[#102552]/10 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             <FaSave size={11} />

//             {saving ? "Saving..." : "Save"}
//           </button>

//           <button
//             type="button"
//             onClick={raiseQuery}
//             className="flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
//           >
//             <FaRegCommentDots size={11} />
//             Raise Query
//           </button>

//           <button
//             type="button"
//             onClick={approveToCM}
//             className="flex h-9 items-center gap-2 rounded-lg bg-[#102552] px-4 text-xs font-semibold text-white transition hover:bg-[#18346f]"
//           >
//             Approve to CM
//             <FaChevronRight size={10} />
//           </button>
//         </div>
//       </section>

//       {/* Slim application journey */}
//       <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
//         <div className="flex min-w-[760px] items-center">
//           {stages.map((stage, index) => {
//             const completed =
//               stage.status === "completed";

//             const current =
//               stage.status === "current";

//             return (
//               <div
//                 key={stage.key}
//                 className="flex flex-1 items-center"
//               >
//                 <div className="flex items-center gap-2">
//                   <span
//                     className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${completed
//                         ? "bg-emerald-500 text-white"
//                         : current
//                           ? "bg-[#102552] text-white ring-4 ring-[#102552]/10"
//                           : "bg-slate-100 text-slate-400"
//                       }`}
//                   >
//                     {completed ? (
//                       <FaCheck size={8} />
//                     ) : (
//                       index + 1
//                     )}
//                   </span>

//                   <span
//                     className={`whitespace-nowrap text-[11px] font-semibold ${current
//                         ? "text-[#102552]"
//                         : completed
//                           ? "text-slate-700"
//                           : "text-slate-400"
//                       }`}
//                   >
//                     {stage.label}
//                   </span>
//                 </div>

//                 {index <
//                   stages.length - 1 && (
//                     <div
//                       className={`mx-3 h-px flex-1 ${completed
//                           ? "bg-emerald-300"
//                           : "bg-slate-200"
//                         }`}
//                     />
//                   )}
//               </div>
//             );
//           })}
//         </div>
//       </section>

//       {/* Success or error message */}
//       {message && (
//         <div
//           className={`rounded-lg border px-4 py-2.5 text-xs font-semibold ${isError
//               ? "border-red-200 bg-red-50 text-red-600"
//               : "border-emerald-200 bg-emerald-50 text-emerald-700"
//             }`}
//         >
//           {message}
//         </div>
//       )}

//       <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
//         {/* Left section */}
//         <div className="space-y-3">
//           {/* Review checklist */}
//           <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//               <div>
//                 <h2 className="text-sm font-bold text-[#102552]">
//                   Review checklist
//                 </h2>

//                 <p className="mt-0.5 text-[11px] text-slate-400">
//                   Verify sourcing and field
//                   information
//                 </p>
//               </div>

//               <div className="text-right">
//                 <p className="text-xs font-bold text-[#102552]">
//                   {completedCount}/
//                   {checklist.length}
//                 </p>

//                 <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
//                   <div
//                     className="h-full rounded-full bg-[#102552] transition-all duration-300"
//                     style={{
//                       width: `${progress}%`,
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
//               {checklist.map((item) => (
//                 <label
//                   key={item.id}
//                   className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${item.checked
//                       ? "border-[#102552]/20 bg-[#102552]/[0.04]"
//                       : "border-slate-200 hover:border-[#102552]/30 hover:bg-[#102552]/[0.02]"
//                     }`}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={item.checked}
//                     onChange={() =>
//                       toggleChecklist(item.id)
//                     }
//                     className="mt-0.5 h-4 w-4 accent-[#102552]"
//                   />

//                   <span className="text-xs font-medium leading-5 text-slate-700">
//                     {item.title}
//                   </span>
//                 </label>
//               ))}
//             </div>
//           </section>

//           {/* BM assessment */}
//           <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//             <h2 className="text-sm font-bold text-[#102552]">
//               BM assessment
//             </h2>

//             <p className="mt-0.5 text-[11px] text-slate-400">
//               Record the preliminary branch-level
//               decision
//             </p>

//             <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
//               <label className="grid gap-1.5">
//                 <span className="text-[11px] font-semibold text-slate-500">
//                   Sourcing Quality
//                 </span>

//                 <select
//                   name="sourcingQuality"
//                   value={
//                     form.sourcingQuality
//                   }
//                   onChange={handleChange}
//                   className={fieldClass}
//                 >
//                   <option value="Good">
//                     Good
//                   </option>

//                   <option value="Average">
//                     Average
//                   </option>

//                   <option value="Poor">
//                     Poor
//                   </option>
//                 </select>
//               </label>

//               <label className="grid gap-1.5">
//                 <span className="text-[11px] font-semibold text-slate-500">
//                   Geo Decision
//                 </span>

//                 <select
//                   name="geoDecision"
//                   value={form.geoDecision}
//                   onChange={handleChange}
//                   className={fieldClass}
//                 >
//                   <option value="Within Policy">
//                     Within Policy
//                   </option>

//                   <option value="Exception Required">
//                     Exception Required
//                   </option>

//                   <option value="Outside Policy">
//                     Outside Policy
//                   </option>
//                 </select>
//               </label>

//               <label className="grid gap-1.5">
//                 <span className="text-[11px] font-semibold text-slate-500">
//                   Eligibility
//                 </span>

//                 <select
//                   name="preliminaryEligibility"
//                   value={
//                     form.preliminaryEligibility
//                   }
//                   onChange={handleChange}
//                   className={fieldClass}
//                 >
//                   <option value="Eligible">
//                     Eligible
//                   </option>

//                   <option value="Deviation">
//                     Deviation
//                   </option>

//                   <option value="Not Eligible">
//                     Not Eligible
//                   </option>
//                 </select>
//               </label>
//             </div>

//             <label className="mt-3 grid gap-1.5">
//               <div className="flex justify-between">
//                 <span className="text-[11px] font-semibold text-slate-500">
//                   Review Remarks
//                 </span>

//                 <span className="text-[10px] text-slate-400">
//                   {form.remarks.length}/500
//                 </span>
//               </div>

//               <textarea
//                 name="remarks"
//                 value={form.remarks}
//                 onChange={handleChange}
//                 maxLength={500}
//                 rows={3}
//                 placeholder="Enter BM review remarks..."
//                 className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10"
//               />
//             </label>
//           </section>
//         </div>

//         {/* Applicant summary */}
//         <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//           <h2 className="text-sm font-bold text-[#102552]">
//             Applicant summary
//           </h2>

//           <p className="mt-0.5 text-[11px] text-slate-400">
//             Preliminary case information
//           </p>

//           <div className="mt-3">
//             {applicantSummary.map(
//               (item) => (
//                 <div
//                   key={item.label}
//                   className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
//                 >
//                   <span className="text-xs text-slate-500">
//                     {item.label}
//                   </span>

//                   <strong className="text-xs text-[#102552]">
//                     {item.value}
//                   </strong>
//                 </div>
//               ),
//             )}
//           </div>

//           <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
//             <p className="text-[11px] leading-5 text-amber-700">
//               BM validates sourcing, geography and
//               basic eligibility. Final underwriting
//               is completed by the credit team.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={approveToCM}
//             className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102552] text-xs font-semibold text-white transition hover:bg-[#18346f]"
//           >
//             Approve to CM
//             <FaChevronRight size={10} />
//           </button>
//         </aside>
//       </div>
//     </div>
//   );
// }



import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaChevronRight,
  FaRegCommentDots,
  FaSave,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { bmReviewApi } from "../bmApi.js";

const DEFAULT_STAGES = [
  {
    key: "LEAD",
    label: "Lead",
    status: "completed",
  },
  {
    key: "FIELD_VERIFICATION",
    label: "Field Verification",
    status: "completed",
  },
  {
    key: "BM_REVIEW",
    label: "BM Review",
    status: "current",
  },
  {
    key: "CM_SCREENING",
    label: "CM Screening",
    status: "pending",
  },
  {
    key: "CREDIT",
    label: "Credit",
    status: "pending",
  },
  {
    key: "LEGAL_VALUATION",
    label: "Legal & Valuation",
    status: "pending",
  },
  {
    key: "SANCTION",
    label: "Sanction",
    status: "pending",
  },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (
  error,
  fallbackMessage,
) => {
  const message =
    error?.response?.data?.message ??
    error?.response?.data?.errors ??
    error?.message ??
    fallbackMessage;

  return Array.isArray(message)
    ? message.join(", ")
    : String(message);
};

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

const pickValue = (
  object,
  ...propertyNames
) => {
  for (const propertyName of propertyNames) {
    const value = object?.[propertyName];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

const getApplicationId = (item) =>
  pickValue(
    item,
    "id",
    "applicationId",
    "application_id",
  );

export default function BMReview() {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const isQueuePage = !applicationId;

  // Queue states
  const [applications, setApplications] =
    useState([]);
  const [search, setSearch] =
    useState("");
  const [queueLoading, setQueueLoading] =
    useState(false);
  const [queueError, setQueueError] =
    useState("");

  // Detail states
  const [application, setApplication] =
    useState(null);
  const [stages, setStages] =
    useState(DEFAULT_STAGES);
  const [checklist, setChecklist] =
    useState([]);
  const [form, setForm] = useState({
    sourcingQuality: "Good",
    geoDecision: "Within Policy",
    preliminaryEligibility: "Eligible",
    remarks: "",
  });
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [detailError, setDetailError] =
    useState("");
  const [saving, setSaving] =
    useState(false);
  const [feedback, setFeedback] =
    useState({
      type: "",
      message: "",
    });

  const loadQueue = useCallback(
    async (signal) => {
      try {
        setQueueLoading(true);
        setQueueError("");

        const response =
          await bmReviewApi.getQueue({
            signal,
          });

        const payload =
          response?.data?.applications ??
          response?.data?.data
            ?.applications ??
          response?.data?.data ??
          response?.data ??
          [];

        setApplications(
          Array.isArray(payload)
            ? payload
            : [],
        );
      } catch (error) {
        if (
          error?.name ===
            "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Unable to load BM review queue:",
          error,
        );

        setQueueError(
          getErrorMessage(
            error,
            "Unable to load cases submitted to BM.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setQueueLoading(false);
        }
      }
    },
    [],
  );

  const loadReview = useCallback(
    async (signal) => {
      if (!applicationId) return;

      try {
        setDetailLoading(true);
        setDetailError("");
        setFeedback({
          type: "",
          message: "",
        });

        const response =
          await bmReviewApi.getByApplicationId(
            applicationId,
            { signal },
          );

        const payload =
          response?.data?.data ??
          response?.data ??
          {};
const applicationData =
  payload?.application ??
  payload?.case ??
  payload ??
  null;

        setApplication(applicationData);

        const stageRows = Array.isArray(
          payload?.stages,
        )
          ? payload.stages.map(
              (stage, index) => ({
                key:
                  stage.key ??
                  stage.code ??
                  `STAGE_${index + 1}`,
                label:
                  stage.label ??
                  stage.name ??
                  `Stage ${index + 1}`,
                status: String(
                  stage.status ?? "pending",
                ).toLowerCase(),
              }),
            )
          : DEFAULT_STAGES;

        setStages(stageRows);

        const checklistRows = Array.isArray(
          payload?.checklist,
        )
          ? payload.checklist.map(
              (item, index) => ({
                id:
                  item.id ??
                  item.itemId ??
                  index + 1,
                code:
                  item.code ??
                  item.itemCode ??
                  item.item_code ??
                  "",
                title:
                  item.title ??
                  item.label ??
                  "Checklist item",
                checked: toBoolean(
                  item.checked ??
                    item.isChecked ??
                    item.is_checked,
                ),
              }),
            )
          : [];

        setChecklist(checklistRows);

        const review =
          payload?.review ?? {};

        setForm({
          sourcingQuality:
            review.sourcingQuality ??
            review.sourcing_quality ??
            "Good",
          geoDecision:
            review.geoDecision ??
            review.geo_decision ??
            "Within Policy",
          preliminaryEligibility:
            review.preliminaryEligibility ??
            review.preliminary_eligibility ??
            "Eligible",
          remarks: review.remarks ?? "",
        });
      } catch (error) {
        if (
          error?.name ===
            "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Unable to load BM review:",
          error,
        );

        setDetailError(
          getErrorMessage(
            error,
            "Unable to load BM review data.",
          ),
        );
      } finally {
        if (!signal?.aborted) {
          setDetailLoading(false);
        }
      }
    },
    [applicationId],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    if (isQueuePage) {
      setApplication(null);
      setChecklist([]);
      setStages(DEFAULT_STAGES);

      loadQueue(controller.signal);
    } else {
      loadReview(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, [
    isQueuePage,
    loadQueue,
    loadReview,
  ]);

  const filteredApplications =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      if (!keyword) {
        return applications;
      }

      return applications.filter(
        (item) =>
          [
            pickValue(
              item,
              "applicationNumber",
              "application_number",
            ),
            pickValue(
              item,
              "customerName",
              "customer_name",
            ),
            pickValue(
              item,
              "mobileNumber",
              "mobile_number",
            ),
            pickValue(
              item,
              "panNumber",
              "pan_number",
            ),
            pickValue(
              item,
              "location",
              "city",
              "propertyCity",
              "property_city",
            ),
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(keyword),
          ),
      );
    }, [applications, search]);

  const completedCount = useMemo(
    () =>
      checklist.filter(
        (item) => item.checked,
      ).length,
    [checklist],
  );

  const allCompleted =
    checklist.length > 0 &&
    completedCount === checklist.length;

  const progress =
    checklist.length > 0
      ? Math.round(
          (completedCount /
            checklist.length) *
            100,
        )
      : 0;

  const applicantSummary = useMemo(
    () => [
      {
        label: "Requested",
        value: formatCurrency(
          pickValue(
            application,
            "requestedAmount",
            "requested_amount",
            "loanAmount",
            "loan_amount",
          ),
        ),
      },
      {
        label: "Income",
        value: formatCurrency(
          pickValue(
            application,
            "monthlyIncome",
            "monthly_income",
            "netMonthlyIncome",
            "net_monthly_income",
          ),
        ),
      },
      {
        label: "FOIR",
        value: `${Number(
          pickValue(
            application,
            "foir",
            "indicativeFoir",
            "indicative_foir",
          ) ?? 0,
        ).toFixed(2)}%`,
      },
      {
        label: "Indicative LTV",
        value: `${Number(
          pickValue(
            application,
            "indicativeLtv",
            "indicative_ltv",
            "ltv",
          ) ?? 0,
        ).toFixed(2)}%`,
      },
      {
        label: "Distance",
        value: `${Number(
          pickValue(
            application,
            "distanceKm",
            "distance_km",
            "distance",
          ) ?? 0,
        )} KM`,
      },
      {
        label: "Documents",
        value: `${
          pickValue(
            application,
            "documentsUploaded",
            "documents_uploaded",
          ) ?? 0
        } / ${
          pickValue(
            application,
            "documentsRequired",
            "documents_required",
          ) ?? 0
        }`,
      },
    ],
    [application],
  );

  const openReview = (selectedCase) => {
    const selectedApplicationId =
      getApplicationId(selectedCase);

    if (!selectedApplicationId) {
      setQueueError(
        "Application ID is missing for this case.",
      );
      return;
    }

    navigate(
      `/bmReview/${selectedApplicationId}`,
    );
  };

  const toggleChecklist = (id) => {
    setChecklist((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item,
      ),
    );

    setFeedback({
      type: "",
      message: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFeedback({
      type: "",
      message: "",
    });
  };

  const buildReviewPayload = () => ({
    sourcingQuality:
      form.sourcingQuality,
    geoDecision: form.geoDecision,
    preliminaryEligibility:
      form.preliminaryEligibility,
    remarks: form.remarks.trim(),
    checklist: checklist.map(
      (item) => ({
        id: item.id,
        code: item.code,
        checked: item.checked,
      }),
    ),
  });

  const saveDraft = async () => {
    if (!applicationId) return;

    try {
      setSaving(true);
      setFeedback({
        type: "",
        message: "",
      });

      await bmReviewApi.saveDraft(
        applicationId,
        buildReviewPayload(),
      );

      setFeedback({
        type: "success",
        message:
          "BM review draft saved successfully.",
      });
    } catch (error) {
      console.error(
        "Unable to save BM review:",
        error,
      );

      setFeedback({
        type: "error",
        message: getErrorMessage(
          error,
          "Unable to save the BM review draft.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const raiseQuery = async () => {
    if (!applicationId) return;

    if (!form.remarks.trim()) {
      setFeedback({
        type: "error",
        message:
          "Enter remarks before raising a query.",
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback({
        type: "",
        message: "",
      });

      await bmReviewApi.raiseQuery(
        applicationId,
        {
          remarks: form.remarks.trim(),
          checklist:
            buildReviewPayload().checklist,
        },
      );

      setFeedback({
        type: "success",
        message:
          "Query raised successfully to the RM.",
      });
    } catch (error) {
      console.error(
        "Unable to raise BM query:",
        error,
      );

      setFeedback({
        type: "error",
        message: getErrorMessage(
          error,
          "Unable to raise query.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const approveToCM = async () => {
    if (!applicationId) return;

    if (!allCompleted) {
      setFeedback({
        type: "error",
        message:
          "Complete all checklist items before approval.",
      });
      return;
    }

    if (!form.remarks.trim()) {
      setFeedback({
        type: "error",
        message:
          "BM review remarks are required.",
      });
      return;
    }

    if (
      form.preliminaryEligibility !==
      "Eligible"
    ) {
      setFeedback({
        type: "error",
        message:
          "Only eligible cases can be moved to CM screening.",
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback({
        type: "",
        message: "",
      });

      await bmReviewApi.approveToCM(
        applicationId,
        buildReviewPayload(),
      );

      navigate("/bmReview", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Unable to approve BM review:",
        error,
      );

      setFeedback({
        type: "error",
        message: getErrorMessage(
          error,
          "Unable to approve the case.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  // Queue page: /bmReview
  if (isQueuePage) {
    return (
      <div className="w-full space-y-4 pb-6">
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[#102552]">
                  BM Review Queue
                </h1>

                <span className="rounded-full bg-[#102552]/10 px-2.5 py-1 text-[10px] font-bold text-[#102552]">
                  {applications.length} CASES
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Cases whose status is
                SUBMITTED_TO_BM
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:ml-auto">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search application..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  loadQueue()
                }
                disabled={queueLoading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#102552]/20 bg-[#102552]/[0.04] px-3 text-xs font-semibold text-[#102552] transition hover:bg-[#102552]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaSyncAlt
                  className={
                    queueLoading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {queueError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {queueError}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {queueLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#102552]" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading cases submitted to
                  BM...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="bg-[#102552] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Application
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      PAN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Requested Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.length >
                  0 ? (
                    filteredApplications.map(
                      (item) => {
                        const rowId =
                          getApplicationId(
                            item,
                          );

                        return (
                          <tr
                            key={rowId}
                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-[#102552]">
                                {pickValue(
                                  item,
                                  "applicationNumber",
                                  "application_number",
                                ) ?? "-"}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                ID: {rowId ?? "-"}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700">
                                {pickValue(
                                  item,
                                  "customerName",
                                  "customer_name",
                                ) ?? "-"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {pickValue(
                                  item,
                                  "mobileNumber",
                                  "mobile_number",
                                ) ?? "-"}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-xs font-medium text-slate-600">
                              {pickValue(
                                item,
                                "panNumber",
                                "pan_number",
                              ) ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                              {formatCurrency(
                                pickValue(
                                  item,
                                  "requestedAmount",
                                  "requested_amount",
                                  "loanAmount",
                                  "loan_amount",
                                ),
                              )}
                            </td>

                            <td className="px-4 py-3 text-xs text-slate-600">
                              {[
                                pickValue(
                                  item,
                                  "propertyCity",
                                  "property_city",
                                  "city",
                                  "location",
                                ),
                                pickValue(
                                  item,
                                  "propertyState",
                                  "property_state",
                                  "state",
                                ),
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </td>

                            <td className="px-4 py-3 text-xs text-slate-600">
                              {formatDate(
                                pickValue(
                                  item,
                                  "submittedAt",
                                  "submitted_at",
                                  "updatedAt",
                                  "updated_at",
                                ),
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                {pickValue(
                                  item,
                                  "status",
                                  "currentStage",
                                  "current_stage",
                                ) ??
                                  "SUBMITTED_TO_BM"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openReview(
                                    item,
                                  )
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102552] px-3 text-xs font-semibold text-white transition hover:bg-[#18346f]"
                              >
                                Review
                                <FaChevronRight
                                  size={9}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-14 text-center"
                      >
                        <p className="text-sm font-semibold text-slate-600">
                          No cases submitted to BM
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Cases will appear when their
                          status becomes
                          SUBMITTED_TO_BM.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Detail loading
  if (detailLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#102552]" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading BM review...
          </p>
        </div>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/bmReview")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#102552]"
        >
          <FaArrowLeft />
          Back to queue
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-bold text-red-700">
            Unable to load review
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {detailError}
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/bmReview")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#102552]"
        >
          <FaArrowLeft />
          Back to queue
        </button>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          Application data was not found.
        </div>
      </div>
    );
  }

  // Detail page: /bmReview/:applicationId
  return (
    <div className="w-full space-y-3 pb-5">
      <button
        type="button"
        onClick={() =>
          navigate("/bmReview")
        }
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#102552] hover:underline"
      >
        <FaArrowLeft />
        Back to BM Review Queue
      </button>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-[#102552]">
              Branch Manager Review
            </h1>

            <span className="rounded-full bg-[#102552]/10 px-2.5 py-1 text-[10px] font-bold text-[#102552]">
              BM REVIEW
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {pickValue(
              application,
              "applicationNumber",
              "application_number",
            ) ?? "Application"}{" "}
            ·{" "}
            {pickValue(
              application,
              "customerName",
              "customer_name",
            ) ?? "Customer"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#102552]/20 bg-[#102552]/[0.04] px-3 text-xs font-semibold text-[#102552] transition hover:bg-[#102552]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSave size={11} />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={raiseQuery}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <FaRegCommentDots size={11} />
            Raise Query
          </button>

          <button
            type="button"
            onClick={approveToCM}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#102552] px-4 text-xs font-semibold text-white transition hover:bg-[#18346f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve to CM
            <FaChevronRight size={10} />
          </button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-[760px] items-center">
          {stages.map((stage, index) => {
            const completed =
              stage.status === "completed";
            const current =
              stage.status === "current";

            return (
              <div
                key={stage.key}
                className="flex flex-1 items-center"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      completed
                        ? "bg-emerald-500 text-white"
                        : current
                          ? "bg-[#102552] text-white ring-4 ring-[#102552]/10"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completed ? (
                      <FaCheck size={8} />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span
                    className={`whitespace-nowrap text-[11px] font-semibold ${
                      current
                        ? "text-[#102552]"
                        : completed
                          ? "text-slate-700"
                          : "text-slate-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {index <
                  stages.length - 1 && (
                  <div
                    className={`mx-3 h-px flex-1 ${
                      completed
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {feedback.message && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs font-semibold ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#102552]">
                  Review checklist
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Verify sourcing and field
                  information
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-[#102552]">
                  {completedCount}/
                  {checklist.length}
                </p>

                <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#102552] transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {checklist.length > 0 ? (
                checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                      item.checked
                        ? "border-[#102552]/20 bg-[#102552]/[0.04]"
                        : "border-slate-200 hover:border-[#102552]/30 hover:bg-[#102552]/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() =>
                        toggleChecklist(
                          item.id,
                        )
                      }
                      className="mt-0.5 h-4 w-4 accent-[#102552]"
                    />

                    <span className="text-xs font-medium leading-5 text-slate-700">
                      {item.title}
                    </span>
                  </label>
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  No checklist items were returned
                  by the API.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#102552]">
              BM assessment
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Record the preliminary branch-level
              decision
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Sourcing Quality
                </span>

                <select
                  name="sourcingQuality"
                  value={
                    form.sourcingQuality
                  }
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="Good">
                    Good
                  </option>
                  <option value="Average">
                    Average
                  </option>
                  <option value="Poor">
                    Poor
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Geo Decision
                </span>

                <select
                  name="geoDecision"
                  value={form.geoDecision}
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="Within Policy">
                    Within Policy
                  </option>
                  <option value="Exception Required">
                    Exception Required
                  </option>
                  <option value="Outside Policy">
                    Outside Policy
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Eligibility
                </span>

                <select
                  name="preliminaryEligibility"
                  value={
                    form.preliminaryEligibility
                  }
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="Eligible">
                    Eligible
                  </option>
                  <option value="Deviation">
                    Deviation
                  </option>
                  <option value="Not Eligible">
                    Not Eligible
                  </option>
                </select>
              </label>
            </div>

            <label className="mt-3 grid gap-1.5">
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Review Remarks
                </span>
                <span className="text-[10px] text-slate-400">
                  {form.remarks.length}/500
                </span>
              </div>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                placeholder="Enter BM review remarks..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#102552] focus:ring-2 focus:ring-[#102552]/10"
              />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#102552]">
            Applicant summary
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Preliminary case information
          </p>

          <div className="mt-3">
            {applicantSummary.map(
              (item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                >
                  <span className="text-xs text-slate-500">
                    {item.label}
                  </span>
                  <strong className="text-xs text-[#102552]">
                    {item.value}
                  </strong>
                </div>
              ),
            )}
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] leading-5 text-amber-700">
              BM validates sourcing, geography and
              basic eligibility. Final underwriting
              is completed by the credit team.
            </p>
          </div>

          <button
            type="button"
            onClick={approveToCM}
            disabled={saving}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102552] text-xs font-semibold text-white transition hover:bg-[#18346f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve to CM
            <FaChevronRight size={10} />
          </button>
        </aside>
      </div>
    </div>
  );
}
