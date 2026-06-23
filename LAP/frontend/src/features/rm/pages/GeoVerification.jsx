import { useState } from "react";
import { FaMapMarkerAlt, FaCompass, FaExternalLinkAlt } from "react-icons/fa";

export default function GeoVerification() {
  // Local states mimicking the data inside image_579077.png
  const [geoData, setGeoData] = useState({
    residence: { lat: "28.5708", lng: "77.3260", gpsAddress: "Sector 18, Noida, Uttar Pradesh 201301", manualAddress: "Sector 18, Noida, Uttar Pradesh 201301", status: "Verified" },
    business: { lat: "28.5712", lng: "77.3248", gpsAddress: "Noida, Uttar Pradesh", status: "Verified" },
    property: { lat: "28.5708", lng: "77.3260", distanceSpoke: "18", mismatch: "No", status: "Verified" }
  });

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      
      {/* 1. Top Core Dashboard Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2575fc] via-[#1a4cb0] to-[#6a11cb] p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
              Geo Verification
            </h2>
            <p className="mt-1 text-xs text-blue-100/90 font-semibold tracking-wide">
              FTLIP-2026-0001 • Verify customer, business and property locations against the assigned spoke.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
              Capture Browser Location
            </button>
            <button className="rounded-xl bg-white/20 text-white font-extrabold text-xs px-5 py-2.5 border border-white/30 shadow-md hover:bg-white/30 transition-all">
              Save Verification
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3-Column Verification Form Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* BLOCK A: RESIDENCE GEO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2 uppercase tracking-wide">Residence Geo</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
            <input type="text" value={geoData.residence.lat} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
            <input type="text" value={geoData.residence.lng} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPS Address</label>
            <input type="text" value={geoData.residence.gpsAddress} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Manual Address</label>
            <input type="text" value={geoData.residence.manualAddress} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select value={geoData.residence.status} disabled className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-800 outline-none cursor-not-allowed">
              <option>Verified</option>
              <option>Mismatch</option>
            </select>
          </div>
        </div>

        {/* BLOCK B: BUSINESS GEO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2 uppercase tracking-wide">Business Geo</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
            <input type="text" value={geoData.business.lat} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
            <input type="text" value={geoData.business.lng} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPS Address</label>
            <input type="text" value={geoData.business.gpsAddress} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5 lg:pt-[68px]"> {/* Balances card heights perfectly */}
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select value={geoData.business.status} disabled className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-800 outline-none cursor-not-allowed">
              <option>Verified</option>
              <option>Mismatch</option>
            </select>
          </div>
        </div>

        {/* BLOCK C: PROPERTY GEO */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0f2942] border-b border-slate-100 pb-2 uppercase tracking-wide">Property Geo</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
            <input type="text" value={geoData.property.lat} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
            <input type="text" value={geoData.property.lng} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance from Spoke (KM)</label>
            <input type="text" value={geoData.property.distanceSpoke} readOnly className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50/50 text-slate-700 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance Mismatch</label>
            <select value={geoData.property.mismatch} disabled className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-800 outline-none cursor-not-allowed">
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select value={geoData.property.status} disabled className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-800 outline-none cursor-not-allowed">
              <option>Verified</option>
              <option>Mismatch</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. Bottom Maps Wrapper & Geo Decision Panel Split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
        
        {/* MAP AND DISTANCE CONTROL BLOCK */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Map and distance control</h3>
          </div>
          
          {/* Interactive Placeholder Simulation Canvas */}
          <div className="flex-1 bg-[#dbe4f4]/60 rounded-xl p-8 flex flex-col items-center justify-center text-center relative min-h-[260px]">
            {/* Custom SVG Location Map Pin Icon */}
            <div className="relative mb-3 animate-bounce">
              <div className="h-4 w-4 bg-rose-600 rounded-full border-2 border-white shadow-md relative z-10"></div>
              <div className="h-6 w-1 bg-rose-600 mx-auto -mt-1 rounded-b"></div>
            </div>
            
            <h4 className="text-sm font-bold text-slate-800 max-w-md">Sector 18, Noida, Uttar Pradesh 201301</h4>
            <p className="text-xs text-slate-400 mt-2 font-medium">Prototype map placeholder</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Coordinates: 28.5708, 77.3260</p>
            
            <button className="mt-5 flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition-all">
              Open Google Maps <FaExternalLinkAlt size={10} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* GEO DECISION SUMMARY PANEL */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0f2942]">Geo decision</h3>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Assigned Spoke</span>
                <span className="font-bold text-[#0f2942]">Noida Spoke</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Calculated Distance</span>
                <span className="font-bold text-[#0f2942]">18 KM</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Policy Radius</span>
                <span className="font-bold text-[#0f2942]">50 KM</span>
              </div>
            </div>

            {/* Validation Indicator Bar Capsule */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-center justify-between relative overflow-hidden mt-4">
              <div className="text-xs text-emerald-800 font-bold">
                Within standard sourcing radius.
              </div>
              {/* Abstract decorative graphic pill clip match */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-blue-600/10 rounded-l-full transform translate-x-3"></div>
            </div>
          </div>

          {/* Exception Handler Trigger CTA */}
          <button className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-amber-500/10 hover:brightness-105 transition-all uppercase tracking-wider">
            Request Geo Exception
          </button>
        </div>

      </div>

    </div>
  );
}