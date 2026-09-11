import { useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiExternalLink,
  FiMapPin,
  FiNavigation,
} from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { updateProperty } from "../services/propertyService";
import {
  geocodeAddress,
  getCityFallbackCoordinates,
} from "../utils/geocoding";
import "../css/locationMap.css";

// Standard Leaflet Marker Icon configuration
const customMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function PropertyLocationMap({ property, extensionPoints = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState(false);

  const propertyId = property?.propertyId ?? property?.id;
  const address = property?.address || "";
  const city = property?.city || "";
  const state = property?.state || "";
  const zipCode = property?.zipCode || property?.pinCode || "";
  const title = property?.title || property?.name || "Rental Property";
  const propertyType = property?.propertyType || property?.type || "Property";
  const price = property?.price || 0;
  const priceUnit = String(property?.priceUnit || "MONTH").toLowerCase();

  // Step 1: Resolve coordinates based on strategy
  useEffect(() => {
    let active = true;

    const resolveCoordinates = async () => {
      setLoading(true);
      setGeocodingError(false);

      const lat = parseFloat(property?.latitude);
      const lng = parseFloat(property?.longitude);

      // 1. Priority: Stored Database Coordinates
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat !== 0 &&
        lng !== 0
      ) {
        if (active) {
          setCoordinates({ lat, lng });
          setLoading(false);
        }
        return;
      }

      // 2. Priority: Address Geocoding for legacy properties
      const resolved = await geocodeAddress({ address, city, state, zipCode });

      if (!active) return;

      if (resolved) {
        setCoordinates(resolved);
        setLoading(false);

        // Save resolved coordinates back to DB for legacy properties
        if (propertyId) {
          try {
            await updateProperty(propertyId, {
              ...property,
              latitude: resolved.lat,
              longitude: resolved.lng,
            });
          } catch {
            // Non-critical background update
          }
        }
        return;
      }

      // 3. Fallback: City-level coordinates
      const cityFallback = getCityFallbackCoordinates(city);
      if (cityFallback) {
        setCoordinates({ lat: cityFallback[0], lng: cityFallback[1] });
        setLoading(false);
        return;
      }

      // 4. Geocoding Failure
      setGeocodingError(true);
      setLoading(false);
    };

    resolveCoordinates();

    return () => {
      active = false;
    };
  }, [property, address, city, state, zipCode, propertyId]);

  // Step 2: Initialize & update Leaflet Map
  useEffect(() => {
    if (!coordinates || !mapContainerRef.current) return;

    const formattedPrice = Number(price).toLocaleString("en-IN");

    const popupHtml = `
      <div class="popup-content-box">
        <span class="popup-badge">${propertyType}</span>
        <div class="popup-title">${title}</div>
        <div class="popup-city">📍 ${city || "Location"}</div>
        <div class="popup-price">
          <strong>₹${formattedPrice}</strong>
          <span>/ ${priceUnit}</span>
        </div>
      </div>
    `;

    // Clean up existing map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom: 14,
      scrollWheelZoom: false,
    });

    // Add OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add Custom Marker & Rich Popup
    L.marker([coordinates.lat, coordinates.lng], { icon: customMarkerIcon })
      .addTo(map)
      .bindPopup(popupHtml, { className: "custom-map-popup" });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, title, propertyType, city, price, priceUnit]);

  const fullAddressQuery = [address, city, state, zipCode, "India"]
    .filter(Boolean)
    .join(", ");

  const googleMapsUrl = coordinates
    ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddressQuery || city || "India"
      )}`;

  return (
    <section className="property-location-section">
      <h2>
        <FiMapPin /> Property Location
      </h2>

      <p className="location-section-subtitle">
        Interactive map and exact location details
      </p>

      <div className="location-address-grid">
        <div className="location-address-card">
          <small>Address</small>
          <strong>{address || "Not provided"}</strong>
        </div>

        <div className="location-address-card">
          <small>City</small>
          <strong>{city || "Not provided"}</strong>
        </div>

        <div className="location-address-card">
          <small>State</small>
          <strong>{state || "Not provided"}</strong>
        </div>

        <div className="location-address-card">
          <small>PIN Code</small>
          <strong>{zipCode || "Not provided"}</strong>
        </div>
      </div>

      {geocodingError ? (
        <div className="location-error-banner">
          <FiAlertTriangle />
          <div>
            <strong>Location map could not be displayed.</strong>
            <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.9 }}>
              The address location could not be automatically determined on the
              map. You can still use the button below to search in Google Maps.
            </p>
          </div>
        </div>
      ) : (
        <div className="map-wrapper">
          {loading ? (
            <div
              style={{
                display: "grid",
                height: "100%",
                placeItems: "center",
                background: "#f8fafc",
                color: "#64748b",
              }}
            >
              <span>Loading location map...</span>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              className="leaflet-map-container"
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>
      )}

      <div className="location-actions-bar">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="google-maps-btn"
        >
          <FiNavigation />
          Open in Google Maps
          <FiExternalLink />
        </a>
      </div>

      {/* Extension container for future nearby places & distance features */}
      {extensionPoints && (
        <div className="future-nearby-extension">{extensionPoints}</div>
      )}
    </section>
  );
}

export default PropertyLocationMap;
