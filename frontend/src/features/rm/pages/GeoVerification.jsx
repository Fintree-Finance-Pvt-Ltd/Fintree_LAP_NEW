// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useState } from "react";
// import { FaExternalLinkAlt } from "react-icons/fa";
// import { useParams } from "react-router-dom";

// import { rmApi } from "../rmApi.js";

// export default function GeoVerification() {
//   const { applicationId } = useParams();
//   const [message, setMessage] = useState("");
//   const queryClient = useQueryClient();
//   // Local states mimicking the data inside image_579077.png
//   const [geoData, setGeoData] = useState({
//     residence: { lat: "28.5708", lng: "77.3260", gpsAddress: "Sector 18, Noida, Uttar Pradesh 201301", manualAddress: "Sector 18, Noida, Uttar Pradesh 201301", status: "Verified" },
//     business: { lat: "28.5712", lng: "77.3248", gpsAddress: "Noida, Uttar Pradesh", status: "Verified" },
//     property: { lat: "28.5708", lng: "77.3260", distanceSpoke: "18", mismatch: "No", status: "Verified" }
//   });

//   const [activeTab, setActiveTab] = useState("residence");

//   const geoTabs = [
//     {
//       key: "residence",
//       label: "Residence Geo",
//     },
//     {
//       key: "business",
//       label: "Business Geo",
//     },
//     {
//       key: "property",
//       label: "Property Geo",
//     },
//   ];

//   const markGeoComplete = useMutation({
//     mutationFn: async () => rmApi.recordWorkflowStep(applicationId, { action: "GEO_VERIFICATION_DONE", remarks: "Geo verification completed" }),
//     onSuccess: async () => {
//       setMessage("Geo verification workflow step recorded.");
//       await queryClient.invalidateQueries({ queryKey: ["rm-workflow", applicationId] });
//       await queryClient.invalidateQueries({ queryKey: ["rm-workflow-overview"] });
//     },
//     onError: () => setMessage("Unable to update workflow state."),
//   });

//   return (
//     <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased">

//       {/* 1. Top Core Dashboard Banner */}
//       <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
//         <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
//         <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h2 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
//               Geo Verification
//             </h2>
//             <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
//               FTLIP-2026-0001 • Verify customer, business and property locations against the assigned spoke.
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
//               Capture Browser Location
//             </button>
//             <button type="button" disabled={!applicationId || markGeoComplete.isPending} onClick={() => markGeoComplete.mutate()} className="rounded-xl bg-white/20 text-white font-extrabold text-xs px-5 py-2.5 border border-white/30 shadow-md hover:bg-white/30 transition-all disabled:cursor-not-allowed disabled:opacity-60">
//               {markGeoComplete.isPending ? "Saving..." : "Save Verification"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">{message}</div>}

//       {/* 2. 3-Column Verification Form Matrix */}
//       {/* GEO VERIFICATION TABS */}
//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         {/* TAB HEADER */}
//         <div className="border-b border-slate-200 bg-slate-50 px-4 pt-4">
//           <div className="flex gap-2 overflow-x-auto">
//             {geoTabs.map((tab) => {
//               const isActive = activeTab === tab.key;

//               return (
//                 <button
//                   key={tab.key}
//                   type="button"
//                   onClick={() => setActiveTab(tab.key)}
//                   className={`relative whitespace-nowrap rounded-t-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wide transition-all ${isActive
//                       ? "bg-white text-blue-700 shadow-sm"
//                       : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
//                     }`}
//                 >
//                   {tab.label}

//                   {isActive && (
//                     <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* TAB CONTENT */}
//         <div className="p-6 md:p-8">
//           {/* RESIDENCE GEO TAB */}
//           {activeTab === "residence" && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
//                 <div>
//                   <h3 className="text-base font-extrabold text-[#0f2942]">
//                     Residence Geo Verification
//                   </h3>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Verify the applicant's current residential location.
//                   </p>
//                 </div>

//                 <span
//                   className={`rounded-full px-3 py-1 text-xs font-bold ${geoData.residence.status === "Verified"
//                       ? "bg-emerald-50 text-emerald-700"
//                       : "bg-rose-50 text-rose-700"
//                     }`}
//                 >
//                   {geoData.residence.status}
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Latitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.residence.lat}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Longitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.residence.lng}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5 md:col-span-2">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     GPS Address
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.residence.gpsAddress}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5 md:col-span-2">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Manual Address
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.residence.manualAddress}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         residence: {
//                           ...previous.residence,
//                           manualAddress: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Verification Status
//                   </label>

//                   <select
//                     value={geoData.residence.status}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         residence: {
//                           ...previous.residence,
//                           status: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   >
//                     <option value="Verified">
//                       Verified
//                     </option>

//                     <option value="Mismatch">
//                       Mismatch
//                     </option>

//                     <option value="Pending">
//                       Pending
//                     </option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* BUSINESS GEO TAB */}
//           {activeTab === "business" && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
//                 <div>
//                   <h3 className="text-base font-extrabold text-[#0f2942]">
//                     Business Geo Verification
//                   </h3>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Verify the applicant's business or workplace location.
//                   </p>
//                 </div>

//                 <span
//                   className={`rounded-full px-3 py-1 text-xs font-bold ${geoData.business.status === "Verified"
//                       ? "bg-emerald-50 text-emerald-700"
//                       : "bg-rose-50 text-rose-700"
//                     }`}
//                 >
//                   {geoData.business.status}
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Latitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.business.lat}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Longitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.business.lng}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5 md:col-span-2">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     GPS Address
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.business.gpsAddress}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Verification Status
//                   </label>

//                   <select
//                     value={geoData.business.status}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         business: {
//                           ...previous.business,
//                           status: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   >
//                     <option value="Verified">
//                       Verified
//                     </option>

//                     <option value="Mismatch">
//                       Mismatch
//                     </option>

//                     <option value="Pending">
//                       Pending
//                     </option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* PROPERTY GEO TAB */}
//           {activeTab === "property" && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
//                 <div>
//                   <h3 className="text-base font-extrabold text-[#0f2942]">
//                     Property Geo Verification
//                   </h3>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Verify collateral location and sourcing-radius compliance.
//                   </p>
//                 </div>

//                 <span
//                   className={`rounded-full px-3 py-1 text-xs font-bold ${geoData.property.status === "Verified"
//                       ? "bg-emerald-50 text-emerald-700"
//                       : "bg-rose-50 text-rose-700"
//                     }`}
//                 >
//                   {geoData.property.status}
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Latitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.property.lat}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Longitude
//                   </label>

//                   <input
//                     type="text"
//                     value={geoData.property.lng}
//                     readOnly
//                     className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Distance from Spoke (KM)
//                   </label>

//                   <input
//                     type="number"
//                     value={geoData.property.distanceSpoke}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         property: {
//                           ...previous.property,
//                           distanceSpoke: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Distance Mismatch
//                   </label>

//                   <select
//                     value={geoData.property.mismatch}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         property: {
//                           ...previous.property,
//                           mismatch: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   >
//                     <option value="No">No</option>
//                     <option value="Yes">Yes</option>
//                   </select>
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
//                     Verification Status
//                   </label>

//                   <select
//                     value={geoData.property.status}
//                     onChange={(event) =>
//                       setGeoData((previous) => ({
//                         ...previous,
//                         property: {
//                           ...previous.property,
//                           status: event.target.value,
//                         },
//                       }))
//                     }
//                     className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
//                   >
//                     <option value="Verified">
//                       Verified
//                     </option>

//                     <option value="Mismatch">
//                       Mismatch
//                     </option>

//                     <option value="Pending">
//                       Pending
//                     </option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 3. Bottom Maps Wrapper & Geo Decision Panel Split */}
//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">

//         {/* MAP AND DISTANCE CONTROL BLOCK */}
//         <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
//           <div className="border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-blue-600"></span>
//             <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Map and distance control</h3>
//           </div>

//           {/* Interactive Placeholder Simulation Canvas */}
//           <div className="flex-1 bg-[#dbe4f4]/60 rounded-xl p-8 flex flex-col items-center justify-center text-center relative min-h-[260px]">
//             {/* Custom SVG Location Map Pin Icon */}
//             <div className="relative mb-3 animate-bounce">
//               <div className="h-4 w-4 bg-rose-600 rounded-full border-2 border-white shadow-md relative z-10"></div>
//               <div className="h-6 w-1 bg-rose-600 mx-auto -mt-1 rounded-b"></div>
//             </div>

//             <h4 className="text-sm font-bold text-slate-800 max-w-md">Sector 18, Noida, Uttar Pradesh 201301</h4>
//             <p className="text-xs text-slate-400 mt-2 font-medium">Prototype map placeholder</p>
//             <p className="text-[11px] text-slate-400 font-mono mt-0.5">Coordinates: 28.5708, 77.3260</p>

//             <button className="mt-5 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition-all">
//               Open Google Maps <FaExternalLinkAlt size={10} className="text-slate-400" />
//             </button>
//           </div>
//         </div>

//         {/* GEO DECISION SUMMARY PANEL */}
//         <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
//           <div className="space-y-4">
//             <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
//               <span className="h-2 w-2 rounded-full bg-blue-600"></span>
//               <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Geo decision</h3>
//             </div>

//             <div className="space-y-3 pt-2">
//               <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
//                 <span className="text-slate-400 font-semibold">Assigned Spoke</span>
//                 <span className="font-bold text-[#0f2942]">Noida Spoke</span>
//               </div>
//               <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
//                 <span className="text-slate-400 font-semibold">Calculated Distance</span>
//                 <span className="font-bold text-[#0f2942]">18 KM</span>
//               </div>
//               <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
//                 <span className="text-slate-400 font-semibold">Policy Radius</span>
//                 <span className="font-bold text-[#0f2942]">50 KM</span>
//               </div>
//             </div>

//             {/* Validation Indicator Bar Capsule */}
//             <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-center justify-between relative overflow-hidden mt-4">
//               <div className="text-xs text-emerald-800 font-bold">
//                 Within standard sourcing radius.
//               </div>
//               {/* Abstract decorative graphic pill clip match */}
//               <div className="absolute right-0 top-0 bottom-0 w-8 bg-blue-600/10 rounded-l-full transform translate-x-3"></div>
//             </div>
//           </div>

//           {/* Exception Handler Trigger CTA */}
//           <button className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-amber-500/10 hover:brightness-105 transition-all uppercase tracking-wider">
//             Request Geo Exception
//           </button>
//         </div>

//       </div>

//     </div>
//   );
// }






import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useState,
} from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";

const EMPTY_GEO_DATA = {
  residence: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    status: "Pending",
  },

  business: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    status: "Pending",
  },

  property: {
    lat: "",
    lng: "",
    gpsAddress: "",
    accuracyMeters: "",
    capturedAt: "",
    distanceSpoke: "",
    mismatch: "No",
    status: "Pending",
  },
};

const LOCATION_TYPE_MAP = {
  residence: "RESIDENCE",
  business: "BUSINESS",
  property: "PROPERTY",
};

const TAB_FROM_LOCATION_TYPE = {
  RESIDENCE: "residence",
  BUSINESS: "business",
  PROPERTY: "property",
};

const GEO_TABS = [
  {
    key: "residence",
    label: "Residence Geo",
  },
  {
    key: "business",
    label: "Business Geo",
  },
  {
    key: "property",
    label: "Property Geo",
  },
];

const unwrapResponse = (response) => {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response ?? {};
};

const formatCapturedAt = (value) => {
  if (!value) {
    return "Not captured";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not captured";
  }

  return date.toLocaleString();
};

const getLocationErrorMessage = (
  error,
) => {
  switch (error?.code) {
    case 1:
      return "Location permission was denied. Please allow location access in your browser.";

    case 2:
      return "Your current location is unavailable.";

    case 3:
      return "Location request timed out. Please try again.";

    default:
      return "Unable to capture your current location.";
  }
};

function GeoField({
  label,
  value,
  placeholder = "—",
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

export default function GeoVerification() {
  // const { applicationId } = useParams();
   const params = useParams();

  const applicationId =
    params.applicationId ||
    params.id ||
    params.appId;

  console.log("Geo route params:", params);
  console.log("Resolved applicationId:", applicationId);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] =
  useState("success");

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] =
    useState("residence");

  const [geoData, setGeoData] =
    useState(EMPTY_GEO_DATA);

  const [
    capturingLocationType,
    setCapturingLocationType,
  ] = useState("");


 

  const numericApplicationId =
    Number(applicationId);

  const geoLocationsQuery = useQuery({
    queryKey: [
      "application-geo-locations",
      applicationId,
    ],

    queryFn: () =>
      rmApi.getGeoLocations(
        applicationId,
      ),

    enabled: Boolean(applicationId),
    retry: false,
  });

  useEffect(() => {
    if (!geoLocationsQuery.data) {
      return;
    }

    const response = unwrapResponse(
      geoLocationsQuery.data,
    );

    const locations =
      response?.data ?? response;

    if (!Array.isArray(locations)) {
      return;
    }

    setGeoData((previous) => {
      const updated = {
        ...previous,
        residence: {
          ...previous.residence,
        },
        business: {
          ...previous.business,
        },
        property: {
          ...previous.property,
        },
      };

      locations.forEach(
        (location) => {
          const tabKey =
            TAB_FROM_LOCATION_TYPE[
              location.locationType
            ];

          if (!tabKey) {
            return;
          }

          updated[tabKey] = {
            ...updated[tabKey],

            lat:
              location.latitude !==
                undefined &&
              location.latitude !== null
                ? String(
                    location.latitude,
                  )
                : "",

            lng:
              location.longitude !==
                undefined &&
              location.longitude !== null
                ? String(
                    location.longitude,
                  )
                : "",

            gpsAddress:
              location.gpsAddress || "",

            accuracyMeters:
              location.accuracyMeters !==
                undefined &&
              location.accuracyMeters !==
                null
                ? String(
                    location.accuracyMeters,
                  )
                : "",

            capturedAt:
              location.capturedAt || "",

            status: "Verified",
          };
        },
      );

      return updated;
    });
  }, [geoLocationsQuery.data]);

  const saveGeoLocationMutation =
    useMutation({
      mutationFn: ({
        payload,
      }) =>
        rmApi.saveGeoLocation(
          applicationId,
          payload,
        ),

      onSuccess: (
        response,
        variables,
      ) => {
        const result =
          unwrapResponse(response);

        const saved =
          result?.data ?? result;

        const locationKey =
          variables.locationKey;

        setGeoData((previous) => ({
          ...previous,

          [locationKey]: {
            ...previous[locationKey],

            lat:
              saved?.latitude !==
                undefined &&
              saved?.latitude !== null
                ? String(
                    saved.latitude,
                  )
                : "",

            lng:
              saved?.longitude !==
                undefined &&
              saved?.longitude !== null
                ? String(
                    saved.longitude,
                  )
                : "",

            gpsAddress:
              saved?.gpsAddress || "",

            accuracyMeters:
              saved?.accuracyMeters !==
                undefined &&
              saved?.accuracyMeters !==
                null
                ? String(
                    saved.accuracyMeters,
                  )
                : "",

            capturedAt:
              saved?.capturedAt ||
              new Date().toISOString(),

            status: "Verified",
          },
        }));

        setMessageType("success");

        setMessage(
          result?.message ||
            "Live location captured and stored successfully.",
        );

        queryClient.invalidateQueries({
          queryKey: [
            "application-geo-locations",
            applicationId,
          ],
        });
      },

      onError: (error) => {
        const errorMessage =
          error?.response?.data
            ?.message ||
          error?.message ||
          "Unable to store live location.";

        setMessageType("error");

        setMessage(
          Array.isArray(errorMessage)
            ? errorMessage.join(", ")
            : errorMessage,
        );
      },

      onSettled: () => {
        setCapturingLocationType("");
      },
    });

  const markGeoComplete = useMutation({
    mutationFn: async () =>
      rmApi.recordWorkflowStep(
        applicationId,
        {
          action:
            "GEO_VERIFICATION_DONE",
          remarks:
            "Geo verification completed",
        },
      ),

    onSuccess: async () => {
      setMessageType("success");

      setMessage(
        "Geo verification workflow step recorded.",
      );

      await queryClient.invalidateQueries({
        queryKey: [
          "rm-workflow",
          applicationId,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "rm-workflow-overview",
        ],
      });
    },

    onError: (error) => {
      const errorMessage =
        error?.response?.data
          ?.message ||
        error?.message ||
        "Unable to update workflow state.";

      setMessageType("error");

      setMessage(
        Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      );
    },
  });

  const handleCaptureLiveLocation =
    () => {
      if (
        !Number.isInteger(
          numericApplicationId,
        ) ||
        numericApplicationId <= 0
      ) {
        setMessageType("error");

        setMessage(
          "A valid application ID is required before capturing location.",
        );

        return;
      }

      if (!navigator.geolocation) {
        setMessageType("error");

        setMessage(
          "Geolocation is not supported by this browser.",
        );

        return;
      }

      const locationKey = activeTab;

      const locationType =
        LOCATION_TYPE_MAP[
          locationKey
        ];

      if (!locationType) {
        setMessageType("error");

        setMessage(
          "Invalid geo location type selected.",
        );

        return;
      }

      setCapturingLocationType(
        locationKey,
      );

      setMessageType("success");

      setMessage(
        `Capturing ${locationKey} live location...`,
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracyMeters =
            position.coords.accuracy;

          const coordinateAddress =
            `Latitude ${latitude.toFixed(
              7,
            )}, Longitude ${longitude.toFixed(
              7,
            )}`;

          saveGeoLocationMutation.mutate({
            locationKey,

            payload: {
              locationType,
              latitude,
              longitude,
              accuracyMeters,
              gpsAddress:
                coordinateAddress,
            },
          });
        },

        (error) => {
          setCapturingLocationType("");

          setMessageType("error");

          setMessage(
            getLocationErrorMessage(
              error,
            ),
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    };

  const selectedGeoData =
    geoData[activeTab] ||
    geoData.residence;

  const hasSelectedCoordinates =
    selectedGeoData?.lat !== "" &&
    selectedGeoData?.lng !== "" &&
    Number.isFinite(
      Number(selectedGeoData?.lat),
    ) &&
    Number.isFinite(
      Number(selectedGeoData?.lng),
    );

  const handleOpenGoogleMaps = () => {
    if (!hasSelectedCoordinates) {
      setMessageType("error");

      setMessage(
        "Capture the live location before opening Google Maps.",
      );

      return;
    }

 
    const latitude =
      Number(selectedGeoData.lat);

    const longitude =
      Number(selectedGeoData.lng);

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const currentTabLabel =
    GEO_TABS.find(
      (tab) =>
        tab.key === activeTab,
    )?.label || "Geo";

  const isCapturing =
    Boolean(
      capturingLocationType,
    ) ||
    saveGeoLocationMutation.isPending;

     
  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 text-slate-800 antialiased md:p-8">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Geo Verification
            </h2>

            <p className="mt-1 text-xs font-semibold tracking-wide text-blue-100/90">
              Application #
              {applicationId || "—"} •
              Capture residence,
              business, and property
              locations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* <button
              type="button"
              onClick={
                handleCaptureLiveLocation
              }
              disabled={
                !applicationId ||
                isCapturing
              }
              className="rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {capturingLocationType ===
              activeTab
                ? "Capturing..."
                : `Capture ${currentTabLabel}`}
            </button> */}

<div className="flex gap-3">
  <button
    type="button"
    onClick={handleCaptureLiveLocation}
    disabled={
      !applicationId ||
      isCapturing
    }
    className="rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {capturingLocationType === activeTab
      ? "Capturing..."
      : `Capture ${currentTabLabel}`}
  </button>

  <button 
    type="button"
    disabled={
      !applicationId ||
      markGeoComplete.isPending
    }
    onClick={() =>
      markGeoComplete.mutate()
    }
    className="rounded-xl border border-white/30 bg-white/20 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {markGeoComplete.isPending
      ? "Saving..."
      : "Save Verification"}
  </button>
</div>

            {/* <button
              type="button"
              disabled={
                !applicationId ||
                markGeoComplete.isPending
              }
              onClick={() =>
                markGeoComplete.mutate()
              }
              className="rounded-xl border border-white/30 bg-white/20 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markGeoComplete.isPending
                ? "Saving..."
                : "Save Verification"}
            </button> */}
          </div>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* LOADING */}
      {geoLocationsQuery.isLoading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
          Loading saved geo
          locations...
        </div>
      )}

      {/* TABS */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {GEO_TABS.map((tab) => {
              const isActive =
                activeTab === tab.key;

              const status =
                geoData[tab.key]
                  ?.status;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.key,
                    )
                  }
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-t-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wide transition-all ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                  }`}
                >
                  {tab.label}

                  <span
                    className={`h-2 w-2 rounded-full ${
                      status ===
                      "Verified"
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />

                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#0f2942]">
                {currentTabLabel}
                Verification
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Capture the live browser
                location for the selected
                verification type.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                selectedGeoData.status ===
                "Verified"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {selectedGeoData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <GeoField
              label="Latitude"
              value={
                selectedGeoData.lat
              }
            />

            <GeoField
              label="Longitude"
              value={
                selectedGeoData.lng
              }
            />

            <GeoField
              label="Location Accuracy"
              value={
                selectedGeoData.accuracyMeters
                  ? `${selectedGeoData.accuracyMeters} meters`
                  : ""
              }
            />

            <GeoField
              label="Captured At"
              value={
                selectedGeoData.capturedAt
                  ? formatCapturedAt(
                      selectedGeoData.capturedAt,
                    )
                  : ""
              }
            />

            <div className="md:col-span-2">
              <GeoField
                label="GPS Location"
                value={
                  selectedGeoData.gpsAddress
                }
              />
            </div>

            {activeTab ===
              "property" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Distance from Spoke
                    (KM)
                  </label>

                  <input
                    type="number"
                    value={
                      geoData.property
                        .distanceSpoke
                    }
                    onChange={(
                      event,
                    ) =>
                      setGeoData(
                        (previous) => ({
                          ...previous,

                          property: {
                            ...previous.property,

                            distanceSpoke:
                              event
                                .target
                                .value,
                          },
                        }),
                      )
                    }
                    placeholder="Enter distance"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Distance Mismatch
                  </label>

                  <select
                    value={
                      geoData.property
                        .mismatch
                    }
                    onChange={(
                      event,
                    ) =>
                      setGeoData(
                        (previous) => ({
                          ...previous,

                          property: {
                            ...previous.property,

                            mismatch:
                              event
                                .target
                                .value,
                          },
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="No">
                      No
                    </option>

                    <option value="Yes">
                      Yes
                    </option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={
                handleCaptureLiveLocation
              }
              disabled={
                !applicationId ||
                isCapturing
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {capturingLocationType ===
              activeTab
                ? "Capturing Location..."
                : `Capture Live ${currentTabLabel}`}
            </button>
          </div>
        </div>
      </div>

      {/* MAP AND DECISION */}
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />

            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">
              Map and Location
              Control
            </h3>
          </div>

          <div className="relative flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-xl bg-[#dbe4f4]/60 p-8 text-center">
            {hasSelectedCoordinates ? (
              <>
                <div className="relative mb-3">
                  <div className="relative z-10 h-4 w-4 rounded-full border-2 border-white bg-rose-600 shadow-md" />
                  <div className="mx-auto -mt-1 h-6 w-1 rounded-b bg-rose-600" />
                </div>

                <h4 className="max-w-md text-sm font-bold text-slate-800">
                  {selectedGeoData.gpsAddress ||
                    "Live location captured"}
                </h4>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  {currentTabLabel}
                </p>

                <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                  Coordinates:{" "}
                  {selectedGeoData.lat},{" "}
                  {selectedGeoData.lng}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Accuracy:{" "}
                  {selectedGeoData.accuracyMeters
                    ? `${selectedGeoData.accuracyMeters} meters`
                    : "Not available"}
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl">
                  📍
                </div>

                <h4 className="text-sm font-bold text-slate-700">
                  Location not captured
                </h4>

                <p className="mt-2 text-xs text-slate-400">
                  Click Capture Live
                  Location to record the
                  current browser location.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={
                handleOpenGoogleMaps
              }
              disabled={
                !hasSelectedCoordinates
              }
              className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open Google Maps

              <FaExternalLinkAlt
                size={10}
                className="text-slate-400"
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">
                Geo Decision
              </h3>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between border-b border-slate-50 pb-2 text-xs">
                <span className="font-semibold text-slate-400">
                  Location Type
                </span>

                <span className="font-bold text-[#0f2942]">
                  {currentTabLabel}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-2 text-xs">
                <span className="font-semibold text-slate-400">
                  Status
                </span>

                <span
                  className={`font-bold ${
                    selectedGeoData.status ===
                    "Verified"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {
                    selectedGeoData.status
                  }
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-2 text-xs">
                <span className="font-semibold text-slate-400">
                  Accuracy
                </span>

                <span className="font-bold text-[#0f2942]">
                  {selectedGeoData.accuracyMeters
                    ? `${selectedGeoData.accuracyMeters} m`
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-2 text-xs">
                <span className="font-semibold text-slate-400">
                  Last Captured
                </span>

                <span className="text-right text-[11px] font-bold text-[#0f2942]">
                  {formatCapturedAt(
                    selectedGeoData.capturedAt,
                  )}
                </span>
              </div>
            </div>

            <div
              className={`relative mt-4 flex items-center justify-between overflow-hidden rounded-xl border p-3 ${
                selectedGeoData.status ===
                "Verified"
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-amber-100 bg-amber-50/50"
              }`}
            >
              <div
                className={`text-xs font-bold ${
                  selectedGeoData.status ===
                  "Verified"
                    ? "text-emerald-800"
                    : "text-amber-800"
                }`}
              >
                {selectedGeoData.status ===
                "Verified"
                  ? "Live location captured and stored."
                  : "Location capture is pending."}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-amber-500/10 transition-all hover:brightness-105"
          >
            Request Geo Exception
          </button>
        </div>
      </div>
    </div>
  );
}