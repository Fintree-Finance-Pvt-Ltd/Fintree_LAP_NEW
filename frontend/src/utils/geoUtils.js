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

