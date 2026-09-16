import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  hasGoogleMapsKey,
  isGoogleMapsLoaded,
  loadGoogleMapsScript,
} from "../../utils/googleMapsLoader.js";

/**
 * UniversalMapView component
 * Automatically switches between Google Maps (when VITE_GOOGLE_MAPS_API_KEY is available)
 * and Leaflet (OpenStreetMap) as fallback.
 */
export default function UniversalMapView({
  center = { lat: 19.076, lng: 72.8777 },
  zoom = 14,
  markers = [],
  polylines = [],
  onMapClick = null,
  onMarkerDragEnd = null,
  height = "280px",
  className = "",
  showProviderBadge = true,
  interactive = true,
  fitBoundsOnMarkers = false,
}) {
  const containerRef = useRef(null);
  const [provider, setProvider] = useState("checking"); // "google" | "leaflet" | "checking"

  // Google Maps refs
  const googleMapInstanceRef = useRef(null);
  const googleMarkersRef = useRef([]);
  const googlePolylinesRef = useRef([]);
  const googleListenersRef = useRef([]);

  // Leaflet refs
  const leafletMapInstanceRef = useRef(null);
  const leafletLayerGroupRef = useRef(null);

  // Normalize center
  const normalizedCenter = Array.isArray(center)
    ? { lat: Number(center[0]) || 19.076, lng: Number(center[1]) || 72.8777 }
    : { lat: Number(center?.lat) || 19.076, lng: Number(center?.lng) || 72.8777 };

  // 1. Detect provider (Google Maps vs Leaflet)
  useEffect(() => {
    let isMounted = true;
    if (hasGoogleMapsKey()) {
      loadGoogleMapsScript()
        .then((gMaps) => {
          if (!isMounted) return;
          if (gMaps && isGoogleMapsLoaded()) {
            setProvider("google");
          } else {
            setProvider("leaflet");
          }
        })
        .catch(() => {
          if (isMounted) setProvider("leaflet");
        });
    } else {
      setProvider("leaflet");
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------
  // GOOGLE MAPS IMPLEMENTATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (provider !== "google" || !containerRef.current || !isGoogleMapsLoaded()) return;

    // Destroy Leaflet if it was active
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
      leafletLayerGroupRef.current = null;
    }

    if (!googleMapInstanceRef.current) {
      const gMap = new window.google.maps.Map(containerRef.current, {
        center: normalizedCenter,
        zoom: zoom,
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: interactive,
        gestureHandling: interactive ? "auto" : "none",
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "simplified" }] },
        ],
      });

      if (interactive && onMapClick) {
        gMap.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onMapClick({ lat, lng });
        });
      }

      googleMapInstanceRef.current = gMap;
    } else {
      googleMapInstanceRef.current.panTo(normalizedCenter);
      googleMapInstanceRef.current.setZoom(zoom);
    }
  }, [provider, normalizedCenter.lat, normalizedCenter.lng, zoom, interactive]);

  // Google Maps Markers and Polylines
  useEffect(() => {
    if (provider !== "google" || !googleMapInstanceRef.current || !isGoogleMapsLoaded()) return;

    const gMap = googleMapInstanceRef.current;

    // Clear old markers
    googleMarkersRef.current.forEach((m) => m.setMap(null));
    googleMarkersRef.current = [];

    // Clear old polylines
    googlePolylinesRef.current.forEach((p) => p.setMap(null));
    googlePolylinesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoint = false;

    // Add Markers
    markers.forEach((markerData, idx) => {
      const lat = Number(markerData.lat);
      const lng = Number(markerData.lng);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      const pos = { lat, lng };
      bounds.extend(pos);
      hasValidPoint = true;

      const markerOptions = {
        position: pos,
        map: gMap,
        title: markerData.title || markerData.label || `Marker ${idx + 1}`,
        draggable: Boolean(markerData.draggable && interactive),
        animation: markerData.animation === "bounce" ? window.google.maps.Animation.BOUNCE : null,
      };

      // Custom icon styling for Google Maps
      if (markerData.color || markerData.iconUrl) {
        if (markerData.iconUrl) {
          markerOptions.icon = markerData.iconUrl;
        } else if (markerData.color) {
          markerOptions.icon = {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: markerData.color,
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: "#FFFFFF",
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 22),
          };
        }
      }

      const gMarker = new window.google.maps.Marker(markerOptions);

      if (markerData.popupContent) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1e293b; max-width: 220px;">${markerData.popupContent}</div>`,
        });
        gMarker.addListener("click", () => {
          infoWindow.open(gMap, gMarker);
        });
      }

      if (markerData.draggable && onMarkerDragEnd) {
        gMarker.addListener("dragend", (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          onMarkerDragEnd(markerData.id || idx, { lat: newLat, lng: newLng });
        });
      }

      googleMarkersRef.current.push(gMarker);
    });

    // Add Polylines
    polylines.forEach((poly) => {
      if (!poly.coordinates || poly.coordinates.length < 2) return;
      const path = poly.coordinates.map((pt) =>
        Array.isArray(pt) ? { lat: Number(pt[0]), lng: Number(pt[1]) } : { lat: Number(pt.lat), lng: Number(pt.lng) }
      );

      const gPoly = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: poly.color || "#2563eb",
        strokeOpacity: poly.opacity || 0.9,
        strokeWeight: poly.weight || 4,
        map: gMap,
      });

      googlePolylinesRef.current.push(gPoly);
    });

    if (fitBoundsOnMarkers && hasValidPoint && markers.length > 1) {
      gMap.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
    }
  }, [provider, markers, polylines, fitBoundsOnMarkers, interactive, onMarkerDragEnd]);

  // -------------------------------------------------------------
  // LEAFLET (OPENSTREETMAP) IMPLEMENTATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (provider !== "leaflet" || !containerRef.current) return;

    // Destroy Google map if it was active
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current = null;
    }

    if (!leafletMapInstanceRef.current) {
      if (containerRef.current._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }

      const lMap = L.map(containerRef.current, {
        zoomControl: interactive,
        scrollWheelZoom: interactive,
        dragging: interactive,
        attributionControl: false,
      }).setView([normalizedCenter.lat, normalizedCenter.lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(lMap);

      leafletLayerGroupRef.current = L.layerGroup().addTo(lMap);
      leafletMapInstanceRef.current = lMap;

      if (interactive && onMapClick) {
        lMap.on("click", (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      const t1 = setTimeout(() => lMap.invalidateSize(), 150);
      const t2 = setTimeout(() => lMap.invalidateSize(), 400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      leafletMapInstanceRef.current.setView([normalizedCenter.lat, normalizedCenter.lng], zoom);
      const t = setTimeout(() => leafletMapInstanceRef.current?.invalidateSize(), 150);
      return () => clearTimeout(t);
    }
  }, [provider, normalizedCenter.lat, normalizedCenter.lng, zoom, interactive]);

  // Leaflet Markers and Polylines
  useEffect(() => {
    if (provider !== "leaflet" || !leafletMapInstanceRef.current || !leafletLayerGroupRef.current) return;

    const layerGroup = leafletLayerGroupRef.current;
    layerGroup.clearLayers();

    const boundsGroup = [];

    markers.forEach((markerData, idx) => {
      const lat = Number(markerData.lat);
      const lng = Number(markerData.lng);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      boundsGroup.push([lat, lng]);

      const pinColor = markerData.color || "#2563eb";
      const customDivIcon = L.divIcon({
        className: `custom-marker-${idx}`,
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${
              markerData.label
                ? `<div style="padding: 2px 6px; border-radius: 9999px; background: #0f172a; color: white; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3); margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.2);">
                    ${markerData.label}
                  </div>`
                : ""
            }
            <div style="width: 30px; height: 30px; border-radius: 50% 50% 50% 0; background: ${pinColor}; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <div style="transform: rotate(45deg); font-size: 12px; color: white; font-weight: bold;">
                ${markerData.iconEmoji || "📍"}
              </div>
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 48],
        popupAnchor: [0, -42],
      });

      const lMarker = L.marker([lat, lng], {
        icon: customDivIcon,
        draggable: Boolean(markerData.draggable && interactive),
      });

      if (markerData.popupContent) {
        lMarker.bindPopup(markerData.popupContent);
      }

      if (markerData.draggable && onMarkerDragEnd) {
        lMarker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onMarkerDragEnd(markerData.id || idx, { lat: pos.lat, lng: pos.lng });
        });
      }

      layerGroup.addLayer(lMarker);
    });

    // Add Polylines
    polylines.forEach((poly) => {
      if (!poly.coordinates || poly.coordinates.length < 2) return;
      const roadPoly = L.polyline(poly.coordinates, {
        color: poly.color || "#2563eb",
        weight: poly.weight || 4,
        opacity: poly.opacity || 0.9,
        dashArray: poly.dashArray || null,
      });
      layerGroup.addLayer(roadPoly);
    });

    if (fitBoundsOnMarkers && boundsGroup.length > 1) {
      leafletMapInstanceRef.current.fitBounds(boundsGroup, { padding: [30, 30] });
    }
  }, [provider, markers, polylines, fitBoundsOnMarkers, interactive, onMarkerDragEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100 ${className}`}
      style={{ height }}
    >
      {/* Map DOM Container */}
      <div ref={containerRef} className="w-full h-full z-0" tabIndex={-1} />

      {/* Provider Badge */}
      {showProviderBadge && provider !== "checking" && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs text-xs font-semibold select-none transition-all">
          {provider === "google" ? (
            <>
              <span className="flex items-center gap-1 text-slate-800">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google Maps
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-slate-700">
                <span className="text-emerald-600 font-black">🍃</span>
                Leaflet (OSM)
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </>
          )}
        </div>
      )}

      {/* Loading overlay while detecting */}
      {provider === "checking" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Initializing Map...
          </div>
        </div>
      )}
    </div>
  );
}
