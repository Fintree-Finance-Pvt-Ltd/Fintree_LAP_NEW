/**
 * Google Maps SDK Asynchronous Loader & Provider Utilities
 * Dynamically loads Google Maps JavaScript SDK when VITE_GOOGLE_MAPS_API_KEY is available.
 */

let googleMapsLoadingPromise = null;
let googleMapsLoadFailed = false;

/**
 * Get Google Maps API key from Vite environment
 */
export function getGoogleMapsApiKey() {
  const key = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || typeof key !== "string") return "";
  const trimmed = key.trim();
  return trimmed.length > 5 ? trimmed : "";
}

/**
 * Check if a valid Google Maps API key is configured
 */
export function hasGoogleMapsKey() {
  return Boolean(getGoogleMapsApiKey());
}

/**
 * Check if Google Maps SDK is currently loaded and available on window
 */
export function isGoogleMapsLoaded() {
  return Boolean(window.google && window.google.maps && window.google.maps.Map);
}

/**
 * Dynamically load Google Maps JavaScript API with places & geometry libraries.
 * Resolves with `window.google.maps` if successful, or null if key missing / failed.
 */
export function loadGoogleMapsScript() {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsLoadFailed) {
    return Promise.resolve(null);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.resolve(null);
  }

  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  googleMapsLoadingPromise = new Promise((resolve) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Script is already in DOM, wait for window.google.maps
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkInterval);
          resolve(window.google.maps);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (isGoogleMapsLoaded()) {
          resolve(window.google.maps);
        } else {
          console.warn("Google Maps script load timed out, falling back to Leaflet.");
          googleMapsLoadFailed = true;
          resolve(null);
        }
      }, 7000);
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry&loading=async`;

    script.onload = () => {
      if (isGoogleMapsLoaded()) {
        resolve(window.google.maps);
      } else {
        const interval = setInterval(() => {
          if (isGoogleMapsLoaded()) {
            clearInterval(interval);
            resolve(window.google.maps);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(interval);
          if (isGoogleMapsLoaded()) {
            resolve(window.google.maps);
          } else {
            console.warn("Google Maps API loaded but window.google.maps unavailable.");
            googleMapsLoadFailed = true;
            resolve(null);
          }
        }, 4000);
      }
    };

    script.onerror = (err) => {
      console.warn("Failed to load Google Maps SDK, falling back to Leaflet:", err);
      googleMapsLoadFailed = true;
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

/**
 * Reverse geocode coordinate using Google Geocoder if available, otherwise null.
 */
export async function reverseGeocodeGoogle(lat, lng) {
  if (!isGoogleMapsLoaded()) {
    await loadGoogleMapsScript();
  }

  if (!isGoogleMapsLoaded() || !window.google?.maps?.Geocoder) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: Number(lat), lng: Number(lng) } },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            const first = results[0];
            let route = "";
            let locality = "";
            let city = "";
            let state = "";
            let postalCode = "";
            let sublocality = "";

            first.address_components?.forEach((comp) => {
              const types = comp.types || [];
              if (types.includes("premise") || types.includes("subpremise") || types.includes("street_number")) {
                // building number
              }
              if (types.includes("route")) {
                route = comp.long_name;
              }
              if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
                sublocality = comp.long_name;
              }
              if (types.includes("locality")) {
                city = comp.long_name;
              } else if (!city && types.includes("administrative_area_level_2")) {
                city = comp.long_name;
              }
              if (types.includes("administrative_area_level_1")) {
                state = comp.long_name;
              }
              if (types.includes("postal_code")) {
                postalCode = comp.long_name;
              }
            });

            resolve({
              formattedAddress: first.formatted_address || "",
              address: [route, sublocality].filter(Boolean).join(", ") || first.formatted_address,
              city: city || sublocality || "",
              state: state || "",
              pinCode: postalCode || "",
              lat: Number(lat),
              lng: Number(lng),
            });
          } else {
            resolve(null);
          }
        }
      );
    } catch (err) {
      console.warn("Google reverse geocoding error:", err);
      resolve(null);
    }
  });
}
