/**
 * Geolocation & Reverse Geocoding Utilities
 */

const addressCache = new Map();

/**
 * Reverse geocode latitude and longitude to a human-readable address.
 * Uses Nominatim OpenStreetMap with local caching.
 */
export async function reverseGeocodeCoords(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "";
  }

  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return "";

  const cacheKey = `${numLat.toFixed(3)},${numLng.toFixed(3)}`;

  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  // Check sessionStorage cache
  try {
    const stored = sessionStorage.getItem(`lap_geo_${cacheKey}`);
    if (stored) {
      addressCache.set(cacheKey, stored);
      return stored;
    }
  } catch (_) {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      numLat
    )}&lon=${encodeURIComponent(numLng)}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
        const city = addr.city || addr.town || addr.village || addr.county || "";
        const state = addr.state || "";

        const parts = [road, suburb !== road ? suburb : "", city, state].filter(Boolean);
        let placeName = parts.slice(0, 3).join(", ");

        if (!placeName && data.display_name) {
          placeName = data.display_name.split(",").slice(0, 3).join(",").trim();
        }

        if (placeName) {
          addressCache.set(cacheKey, placeName);
          try {
            sessionStorage.setItem(`lap_geo_${cacheKey}`, placeName);
          } catch (_) {}
          return placeName;
        }
      }
    }
  } catch (err) {
    console.debug("Reverse geocode fetch skipped:", err?.message);
  }

  return "";
}

/**
 * Clean legacy coordinate string to readable name or fallback
 */
export function cleanLocationName(rawLocation, fallback = "Office Workspace") {
  if (!rawLocation) return fallback;
  const str = String(rawLocation).trim();

  // If format is like "18.9559° N, 72.8152° E (Fintree)"
  if (str.includes("° N") || str.includes("° E") || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str)) {
    const match = str.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return fallback;
  }

  return str;
}

/**
 * Cache last known coordinates to localStorage for instant startup
 */
export function saveLastKnownCoords(latitude, longitude) {
  try {
    if (latitude && longitude) {
      localStorage.setItem(
        "lap_last_coords",
        JSON.stringify({
          latitude: Number(latitude),
          longitude: Number(longitude),
          timestamp: Date.now(),
        })
      );
    }
  } catch (_) {}
}

export function getLastKnownCoords() {
  try {
    const raw = localStorage.getItem("lap_last_coords");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Valid within last 24 hours
      if (parsed?.latitude && parsed?.longitude && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Fetch true road route geometry between multiple coordinates using OSRM Routing Engine.
 * Converts waypoints into realistic on-road driving paths.
 */
export async function fetchRoadRoute(rawPoints = []) {
  if (!rawPoints || rawPoints.length < 2) {
    return {
      roadCoordinates: rawPoints.map((p) => (Array.isArray(p) ? p : [p.latitude || p.lat, p.longitude || p.lng])),
      distanceKm: 0,
      durationMin: 0,
      isRoadRoute: false,
    };
  }

  // Normalize points to { lat, lng }
  const normalized = [];
  rawPoints.forEach((p) => {
    const lat = Array.isArray(p) ? Number(p[0]) : Number(p.latitude || p.lat);
    const lng = Array.isArray(p) ? Number(p[1]) : Number(p.longitude || p.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      // Check if duplicate of last point to avoid OSRM zero-distance errors
      const last = normalized[normalized.length - 1];
      if (!last || Math.abs(last.lat - lat) > 0.00005 || Math.abs(last.lng - lng) > 0.00005) {
        normalized.push({ lat, lng });
      }
    }
  });

  if (normalized.length < 2) {
    return {
      roadCoordinates: normalized.map((p) => [p.lat, p.lng]),
      distanceKm: 0,
      durationMin: 0,
      isRoadRoute: false,
    };
  }

  // If there are too many intermediate crumbs (e.g. > 25), sample them down for OSRM URL limits
  let sampled = normalized;
  if (normalized.length > 25) {
    sampled = [normalized[0]];
    const step = (normalized.length - 2) / 23;
    for (let i = 1; i <= 23; i++) {
      sampled.push(normalized[Math.round(i * step)]);
    }
    sampled.push(normalized[normalized.length - 1]);
  }

  // OSRM expects coordinates in "longitude,latitude" format separated by semicolon
  const coordString = sampled.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM GeoJSON coordinates are [lon, lat] -> Leaflet requires [lat, lng]
        const roadCoordinates = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);

        if (roadCoordinates.length > 0) {
          const distanceKm = route.distance ? parseFloat((route.distance / 1000).toFixed(2)) : 0;
          const durationMin = route.duration ? Math.round(route.duration / 60) : 0;

          return {
            roadCoordinates,
            distanceKm,
            durationMin,
            isRoadRoute: true,
          };
        }
      }
    }
  } catch (err) {
    console.debug("OSRM road routing fallback to direct polyline:", err?.message);
  }

  // Fallback to straight-line connection between normalized points
  return {
    roadCoordinates: normalized.map((p) => [p.lat, p.lng]),
    distanceKm: 0,
    durationMin: 0,
    isRoadRoute: false,
  };
}

/**
 * Robust GPS position promise with high-accuracy + standard accuracy fallback
 */
export function getCurrentGPSPosition(timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const cached = getLastKnownCoords();
      if (cached) return resolve(cached);
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    let resolved = false;

    // 1. Try High Accuracy (GPS hardware)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return;
        resolved = true;
        saveLastKnownCoords(pos.coords.latitude, pos.coords.longitude);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        });
      },
      (err1) => {
        console.warn("High accuracy GPS note, falling back to standard accuracy:", err1?.message);
        // 2. Fallback to standard accuracy (Wi-Fi / Network location - fast & reliable on laptops)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (resolved) return;
            resolved = true;
            saveLastKnownCoords(pos.coords.latitude, pos.coords.longitude);
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
            });
          },
          (err2) => {
            if (resolved) return;
            const cached = getLastKnownCoords();
            if (cached) {
              resolved = true;
              return resolve(cached);
            }
            resolved = true;
            const message =
              err2.code === 1
                ? "Location permission was denied. Please allow location access in your browser."
                : err2.code === 2
                ? "Location unavailable. Please ensure GPS/location services are enabled."
                : "Location request timed out. Please retry.";
            const customError = new Error(message);
            customError.code = err2.code;
            reject(customError);
          },
          { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: Math.min(timeoutMs, 5000), maximumAge: 0 }
    );
  });
}

/**
 * Calculate straight line distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return 0;

  const R = 6371; // Radius of the Earth in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

const forwardGeoCache = new Map();

/**
 * Forward geocode an address string (e.g., street, city, pin code) into { lat, lng } coordinates.
 * Includes caching and sensible fallbacks.
 */
export async function forwardGeocodeAddress(addressStr, fallbackCoords = null) {
  if (!addressStr || typeof addressStr !== "string") {
    return fallbackCoords || null;
  }

  const cleanQuery = addressStr.trim();
  if (cleanQuery.length < 3) return fallbackCoords || null;

  if (forwardGeoCache.has(cleanQuery)) {
    return forwardGeoCache.get(cleanQuery);
  }

  try {
    const sessionKey = `lap_fwd_geo_${encodeURIComponent(cleanQuery.slice(0, 50))}`;
    const cached = sessionStorage.getItem(sessionKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      forwardGeoCache.set(cleanQuery, parsed);
      return parsed;
    }
  } catch (_) {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&limit=1&countrycodes=in`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const result = {
          lat: parseFloat(Number(data[0].lat).toFixed(6)),
          lng: parseFloat(Number(data[0].lon).toFixed(6)),
          displayName: data[0].display_name || cleanQuery,
        };
        forwardGeoCache.set(cleanQuery, result);
        try {
          const sessionKey = `lap_fwd_geo_${encodeURIComponent(cleanQuery.slice(0, 50))}`;
          sessionStorage.setItem(sessionKey, JSON.stringify(result));
        } catch (_) {}
        return result;
      }
    }
  } catch (err) {
    console.debug("Forward geocode fetch skipped:", err?.message);
  }

  // Deterministic local coordinate offset based on address text if external lookup is offline
  if (fallbackCoords && fallbackCoords.lat && fallbackCoords.lng) {
    let hash = 0;
    for (let i = 0; i < cleanQuery.length; i++) {
      hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
      hash |= 0;
    }
    const offsetLat = ((hash % 100) / 10000) * 1.5;
    const offsetLng = (((hash >> 2) % 100) / 10000) * 1.5;
    const synthetic = {
      lat: parseFloat((fallbackCoords.lat + offsetLat).toFixed(6)),
      lng: parseFloat((fallbackCoords.lng + offsetLng).toFixed(6)),
      displayName: cleanQuery,
    };
    forwardGeoCache.set(cleanQuery, synthetic);
    return synthetic;
  }

  return null;
}

/**
 * Calculate the optimal visit sequence for today's follow-up leads starting from user's current location.
 * Implements the Nearest Neighbor Algorithm:
 *  - 1st Stop: Nearest to RM Starting Location
 *  - 2nd Stop: Nearest to 1st Stop
 *  - 3rd Stop: Nearest to 2nd Stop (and so on)
 */
export async function calculateOptimalRouteSequence(startLocation, leadList = []) {
  if (!leadList || leadList.length === 0) {
    return {
      orderedStops: [],
      totalDistanceKm: 0,
      totalDurationMin: 0,
      routePolyline: [],
    };
  }

  const startLat = Number(startLocation?.latitude || startLocation?.lat || 19.0760);
  const startLng = Number(startLocation?.longitude || startLocation?.lng || 72.8777);
  const startPoint = {
    id: "START_POINT",
    customerName: startLocation?.name || "Your Current Location",
    lat: startLat,
    lng: startLng,
    address: startLocation?.address || "Starting Location / Punch In",
    isStart: true,
  };

  // 1. Geocode / Resolve Coordinates for all leads
  const resolvedLeads = await Promise.all(
    leadList.map(async (lead, index) => {
      const profile = lead.customerProfile || {};
      const propertyAddr =
        lead.propertyAddress ||
        profile.propertyAddress ||
        lead.propertyCity ||
        profile.propertyCity ||
        lead.city ||
        "";
      const pincode = lead.pinCode || profile.propertyPincode || profile.currentPincode || "";
      const city = lead.city || profile.propertyCity || profile.currentCity || "";

      let fullAddress = [propertyAddr, city, pincode ? `PIN: ${pincode}` : ""]
        .filter(Boolean)
        .join(", ");

      if (!fullAddress) {
        fullAddress = `Customer Location (${lead.customerName || "Lead #" + (lead.id || index + 1)})`;
      }

      // Check if lead already has direct latitude/longitude
      let lat = Number(lead.latitude || profile.latitude || lead.lat || 0);
      let lng = Number(lead.longitude || profile.longitude || lead.lng || 0);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        // Forward geocode with fallback near start location
        const geocoded = await forwardGeocodeAddress(fullAddress, { lat: startLat, lng: startLng });
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
        } else {
          // Synthetic nearby coordinates offset
          const angle = (index * 2 * Math.PI) / (leadList.length || 1);
          const distOffset = 0.015 + index * 0.01;
          lat = startLat + Math.cos(angle) * distOffset;
          lng = startLng + Math.sin(angle) * distOffset;
        }
      }

      return {
        ...lead,
        leadId: lead.id || lead.applicationId || index + 1,
        applicationNumber: lead.applicationNumber || `LAP-${lead.id || index + 1}`,
        customerName: lead.customerName || profile.firstName || "Valued Customer",
        mobile: lead.mobile || profile.mobile || "-",
        requestedAmount: lead.requestedAmount || profile.eligibleAmount || 0,
        address: fullAddress,
        city: city || "Local",
        propertyType: lead.propertyType || profile.propertyType || "Residential Property",
        followUpTime: lead.followUpTime || profile.followUpTime || "10:00 AM",
        followUpNotes: lead.followUpNotes || profile.followUpNotes || "Follow-up visit and verification",
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      };
    })
  );

  // 2. Nearest Neighbor Sequencing Algorithm
  const unvisited = [...resolvedLeads];
  const orderedStops = [];
  let currentPos = startPoint;
  let accumulatedDistanceKm = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistanceKm(
        currentPos.lat,
        currentPos.lng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = i;
      }
    }

    const [nearestLead] = unvisited.splice(nearestIndex, 1);
    const distanceFromPrevKm = shortestDistance === Infinity ? 0 : shortestDistance;
    const estDriveMin = Math.max(3, Math.round(distanceFromPrevKm * 3.5)); // ~17 km/h urban traffic speed

    accumulatedDistanceKm += distanceFromPrevKm;

    const stopNumber = orderedStops.length + 1;
    let sequenceRankLabel = "1st Nearest";
    if (stopNumber === 2) sequenceRankLabel = "2nd Nearest";
    else if (stopNumber === 3) sequenceRankLabel = "3rd Nearest";
    else if (stopNumber > 3) sequenceRankLabel = `${stopNumber}th Stop`;

    const stopObj = {
      ...nearestLead,
      stopNumber,
      sequenceRankLabel,
      distanceFromPrevKm: parseFloat(distanceFromPrevKm.toFixed(2)),
      estDriveMin,
      totalAccumulatedKm: parseFloat(accumulatedDistanceKm.toFixed(2)),
      prevStopName: currentPos.customerName,
    };

    orderedStops.push(stopObj);
    currentPos = stopObj;
  }

  // 3. Build route waypoints [Start, Stop 1, Stop 2, Stop 3, ...]
  const allWaypoints = [
    [startPoint.lat, startPoint.lng],
    ...orderedStops.map((stop) => [stop.lat, stop.lng]),
  ];

  // Fetch actual OSRM road geometry
  let roadRouteResult = null;
  try {
    roadRouteResult = await fetchRoadRoute(allWaypoints);
  } catch (_) {}

  const finalPolyline =
    roadRouteResult?.roadCoordinates && roadRouteResult.roadCoordinates.length > 0
      ? roadRouteResult.roadCoordinates
      : allWaypoints;

  const totalDistanceKm = roadRouteResult?.distanceKm || parseFloat(accumulatedDistanceKm.toFixed(2));
  const totalDurationMin = roadRouteResult?.durationMin || Math.round(totalDistanceKm * 3.5);

  return {
    startPoint,
    orderedStops,
    totalDistanceKm,
    totalDurationMin,
    routePolyline: finalPolyline,
  };
}


