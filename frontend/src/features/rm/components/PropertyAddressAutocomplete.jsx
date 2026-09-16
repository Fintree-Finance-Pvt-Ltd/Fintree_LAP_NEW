import { useEffect, useRef, useState, useCallback } from "react";
import {
  FiCompass,
  FiMapPin,
  FiNavigation,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import {
  KNOWN_LANDMARKS_DICT,
  PINCODE_LOCALITY_DICT,
  forwardGeocodeAddress,
  getCurrentGPSPosition,
  reverseGeocodeCoords,
} from "../../../utils/geoUtils.js";
import {
  hasGoogleMapsKey,
  isGoogleMapsLoaded,
  loadGoogleMapsScript,
  reverseGeocodeGoogle,
} from "../../../utils/googleMapsLoader.js";
import UniversalMapView from "../../../components/common/UniversalMapView.jsx";

export default function PropertyAddressAutocomplete({
  propertyAddress = "",
  city = "",
  state = "",
  pinCode = "",
  onChange = () => {},
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Map Coordinates state (default to Mumbai Region)
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.8777, isResolved: false });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const placesDummyDivRef = useRef(null);

  // Initialize Google Maps Places Service if key available
  useEffect(() => {
    if (hasGoogleMapsKey()) {
      loadGoogleMapsScript().then((gMaps) => {
        if (gMaps && isGoogleMapsLoaded()) {
          if (!autocompleteServiceRef.current && window.google?.maps?.places?.AutocompleteService) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          }
          if (!placesServiceRef.current && window.google?.maps?.places?.PlacesService) {
            if (!placesDummyDivRef.current) {
              placesDummyDivRef.current = document.createElement("div");
            }
            placesServiceRef.current = new window.google.maps.places.PlacesService(placesDummyDivRef.current);
          }
        }
      });
    }
  }, []);

  // Sync initial coordinates if address or pincode already exists
  useEffect(() => {
    if (!coords.isResolved && (propertyAddress || pinCode || city)) {
      const fullText = [propertyAddress, city, state, pinCode].filter(Boolean).join(", ");
      forwardGeocodeAddress(fullText).then((resolved) => {
        if (resolved?.lat && resolved?.lng) {
          setCoords({ lat: Number(resolved.lat), lng: Number(resolved.lng), isResolved: true });
        }
      });
    }
  }, [propertyAddress, city, state, pinCode, coords.isResolved]);

  // Handle outside click for suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Autocomplete Predictions (Google Places or OSM/Dictionary Fallback)
  const fetchPredictions = useCallback((query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setPredictions([]);
      setDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // 1. If Google Maps is available, use Google Places AutocompleteService
    if (isGoogleMapsLoaded() && autocompleteServiceRef.current) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: trimmed,
            componentRestrictions: { country: "in" },
            types: ["geocode", "establishment"],
          },
          (results, status) => {
            setIsSearching(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const formattedList = results.map((item) => ({
                id: item.place_id,
                title: item.structured_formatting?.main_text || item.description,
                subtitle: item.structured_formatting?.secondary_text || "",
                fullDescription: item.description,
                source: "google",
                placeId: item.place_id,
              }));
              setPredictions(formattedList);
              setDropdownOpen(formattedList.length > 0);
            } else {
              fallbackSearch(trimmed);
            }
          }
        );
        return;
      } catch (err) {
        console.warn("Google Places Autocomplete failed, falling back:", err);
      }
    }

    // 2. Fallback Search via Known Local Landmarks & Nominatim / Photon
    fallbackSearch(trimmed);
  }, []);

  // OpenStreetMap & Local Landmark fallback search
  const fallbackSearch = async (trimmed) => {
    const results = [];
    const lower = trimmed.toLowerCase();

    // 1. Search Known Landmarks Dict
    KNOWN_LANDMARKS_DICT.forEach((item, idx) => {
      if (item.keywords.some((k) => lower.includes(k) || k.includes(lower))) {
        results.push({
          id: `landmark_${idx}`,
          title: item.name.split(",")[0].trim(),
          subtitle: item.name.split(",").slice(1).join(",").trim() || "Landmark",
          fullDescription: item.name,
          source: "landmark",
          lat: item.lat,
          lng: item.lng,
        });
      }
    });

    // 2. Search PIN Code Dict
    Object.entries(PINCODE_LOCALITY_DICT).forEach(([pin, entry]) => {
      if (pin.includes(trimmed) || entry.name.toLowerCase().includes(lower)) {
        results.push({
          id: `pincode_${pin}`,
          title: entry.name.split(",")[0].trim(),
          subtitle: `${entry.name.split(",").slice(1).join(",").trim()} (PIN ${pin})`,
          fullDescription: `${entry.name}, PIN: ${pin}`,
          source: "pincode",
          pinCode: pin,
          lat: entry.lat,
          lng: entry.lng,
        });
      }
    });

    // 3. Query Nominatim / Photon OpenStreetMap API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&countrycodes=in&addressdetails=1`;

      const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item, idx) => {
            const addr = item.address || {};
            const title = item.name || item.display_name.split(",")[0].trim();
            const subtitle = item.display_name.split(",").slice(1, 4).join(",").trim();
            results.push({
              id: `osm_${item.place_id || idx}`,
              title,
              subtitle,
              fullDescription: item.display_name,
              source: "osm",
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              addressDetails: addr,
            });
          });
        }
      }
    } catch (_) {}

    setIsSearching(false);
    setPredictions(results.slice(0, 7));
    setDropdownOpen(results.length > 0);
  };

  // Search input change with debounce
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 280);
  };

  // User selects an autocomplete suggestion
  const handleSelectPrediction = (prediction) => {
    setDropdownOpen(false);
    setSearchQuery(prediction.title);

    // 1. Google Place Details
    if (prediction.source === "google" && prediction.placeId) {
      if (placesServiceRef.current) {
        placesServiceRef.current.getDetails(
          {
            placeId: prediction.placeId,
            fields: ["address_components", "formatted_address", "geometry", "name"],
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              let route = "";
              let sublocality = "";
              let cityVal = "";
              let stateVal = "";
              let pinVal = "";
              let premise = "";

              (place.address_components || []).forEach((comp) => {
                const types = comp.types || [];
                if (types.includes("premise") || types.includes("subpremise") || types.includes("street_number")) {
                  premise = comp.long_name;
                }
                if (types.includes("route")) {
                  route = comp.long_name;
                }
                if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
                  sublocality = comp.long_name;
                }
                if (types.includes("locality")) {
                  cityVal = comp.long_name;
                } else if (!cityVal && types.includes("administrative_area_level_2")) {
                  cityVal = comp.long_name;
                }
                if (types.includes("administrative_area_level_1")) {
                  stateVal = comp.long_name;
                }
                if (types.includes("postal_code")) {
                  pinVal = comp.long_name;
                }
              });

              const streetParts = [place.name, premise, route, sublocality].filter(
                (item, pos, arr) => item && arr.indexOf(item) === pos
              );
              const formattedStreet = streetParts.join(", ") || place.formatted_address || prediction.fullDescription;

              const lat = place.geometry?.location?.lat() || 19.076;
              const lng = place.geometry?.location?.lng() || 72.8777;

              setCoords({ lat, lng, isResolved: true });

              onChange({
                propertyAddress: formattedStreet,
                city: cityVal || sublocality || "",
                state: stateVal || "",
                pinCode: pinVal || "",
              });
              return;
            }
          }
        );
      }
    }

    // 2. Local Landmark / PIN Dict / OSM
    let newAddress = prediction.fullDescription || prediction.title;
    let newCity = city;
    let newState = state || "Maharashtra";
    let newPin = prediction.pinCode || pinCode;

    if (prediction.addressDetails) {
      const d = prediction.addressDetails;
      newCity = d.city || d.town || d.village || d.suburb || d.county || "";
      newState = d.state || "";
      newPin = d.postcode || "";
      newAddress = [d.road || d.neighbourhood || prediction.title, d.suburb, d.city_district]
        .filter(Boolean)
        .join(", ") || prediction.fullDescription;
    }

    if (prediction.lat && prediction.lng) {
      setCoords({ lat: prediction.lat, lng: prediction.lng, isResolved: true });
    }

    onChange({
      propertyAddress: newAddress,
      city: newCity,
      state: newState,
      pinCode: newPin,
    });
  };

  // User drags marker or clicks on map to fine-tune exact location
  const handleMapPinMove = async ({ lat, lng }) => {
    const newLat = Number(lat);
    const newLng = Number(lng);
    setCoords({ lat: newLat, lng: newLng, isResolved: true });

    // Try Google Reverse Geocoding first
    let resolved = null;
    if (isGoogleMapsLoaded()) {
      resolved = await reverseGeocodeGoogle(newLat, newLng);
    }

    if (resolved) {
      onChange({
        propertyAddress: resolved.address || propertyAddress,
        city: resolved.city || city,
        state: resolved.state || state,
        pinCode: resolved.pinCode || pinCode,
      });
    } else {
      // Fallback to OSM Reverse Geocode
      const addrStr = await reverseGeocodeCoords(newLat, newLng);
      if (addrStr) {
        onChange({
          propertyAddress: addrStr,
          city: city,
          state: state,
          pinCode: pinCode,
        });
      }
    }
  };

  // "Use My Live GPS Location" button
  const handleUseCurrentGPS = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentGPSPosition(6000);
      if (pos?.latitude && pos?.longitude) {
        const lat = Number(pos.latitude);
        const lng = Number(pos.longitude);
        setCoords({ lat, lng, isResolved: true });

        let resolved = null;
        if (isGoogleMapsLoaded()) {
          resolved = await reverseGeocodeGoogle(lat, lng);
        }

        if (resolved) {
          setSearchQuery(resolved.address || "My Current Location");
          onChange({
            propertyAddress: resolved.address || propertyAddress,
            city: resolved.city || city,
            state: resolved.state || state,
            pinCode: resolved.pinCode || pinCode,
          });
        } else {
          const addr = await reverseGeocodeCoords(lat, lng);
          if (addr) {
            setSearchQuery(addr);
            onChange({
              propertyAddress: addr,
              city: city,
              state: state,
              pinCode: pinCode,
            });
          }
        }
      }
    } catch (err) {
      console.warn("GPS capture failed:", err);
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div className="col-span-full space-y-4">
      {/* 1. Address Search Bar Header */}
      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-blue-900">
            Search Property Address / Locality / Landmark
          </span>
        </label>

        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSearch className="w-4 h-4 text-blue-600" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (predictions.length > 0) setDropdownOpen(true);
            }}
            disabled={disabled}
            placeholder="Type society, building, street, landmark, or PIN code to auto-fill..."
            className="w-full pl-10 pr-32 py-2.5 text-sm rounded-xl border border-blue-200 bg-blue-50/30 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-100 shadow-xs outline-none transition-all"
          />

          {/* Quick Action Buttons inside input */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPredictions([]);
                  setDropdownOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Clear Search"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleUseCurrentGPS}
              disabled={disabled || gpsLoading}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
              title="Use Current Device GPS Location"
            >
              {gpsLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiNavigation className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>
        </div>

        {/* 2. Autocomplete Suggestions Dropdown */}
        {dropdownOpen && predictions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Matching Locations ({predictions.length})</span>
              <span className="text-slate-400">Click to Select</span>
            </div>
            {predictions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPrediction(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2.5 group"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FiMapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-900 truncate">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</div>
                  )}
                </div>
                {item.source === "google" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 self-center">
                    Google
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 2-Column Split: Left = Address Form Fields, Right = Location Pin Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch pt-1">
        {/* Left Side: Property Address, City, State, PIN Code */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
            <FiMapPin className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Address Details
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Property Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                name="propertyAddress"
                value={propertyAddress}
                onChange={(e) => onChange({ propertyAddress: e.target.value })}
                disabled={disabled}
                placeholder="Flat / House / Building, Road, Locality"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={city}
                onChange={(e) => onChange({ city: e.target.value })}
                disabled={disabled}
                placeholder="e.g. Mumbai, Vasai"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={state}
                onChange={(e) => onChange({ state: e.target.value })}
                disabled={disabled}
                placeholder="e.g. Maharashtra"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="pinCode"
                maxLength={6}
                inputMode="numeric"
                value={pinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  onChange({ pinCode: val });
                }}
                disabled={disabled}
                placeholder="6-digit PIN code (e.g. 400001)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Property Location Pin Map */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Property Location Pin
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Drag marker to adjust exact position
            </span>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 shadow-2xs min-h-[310px]">
            <UniversalMapView
              center={coords}
              zoom={15}
              height="320px"
              interactive={!disabled}
              onMapClick={handleMapPinMove}
              onMarkerDragEnd={(_, newPos) => handleMapPinMove(newPos)}
              markers={[
                {
                  id: "property_target_marker",
                  lat: coords.lat,
                  lng: coords.lng,
                  label: "Property Location",
                  title: propertyAddress || "Selected Property",
                  color: "#2563eb",
                  draggable: !disabled,
                  popupContent: `
                    <div style="font-family: sans-serif; font-size: 12px;">
                      <b>🏠 Property Pin</b><br/>
                      <span>${propertyAddress || "Exact Location"}</span><br/>
                      <small style="color: #64748b;">${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}</small>
                    </div>
                  `,
                },
              ]}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
            <span>
              Lat: <b className="text-slate-700">{coords.lat.toFixed(5)}</b>, Lng:{" "}
              <b className="text-slate-700">{coords.lng.toFixed(5)}</b>
            </span>
            <span className="text-blue-600 font-medium">💡 Click map or drag pin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
