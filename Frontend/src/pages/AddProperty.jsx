import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiHome,
  FiImage,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import {
  createProperty,
  uploadPropertyImages,
} from "../services/propertyService";
import { geocodeAddress } from "../utils/geocoding";
import "../css/propertyForm.css";

const initialForm = {
  title: "",
  description: "",
  propertyType: "Office",
  listingType: "RENT",
  bookingMode: "INSTANT",
  price: "",
  priceUnit: "MONTH",
  openingTime: "09:00",
  closingTime: "18:00",
  slotDurationMinutes: "60",
  areaSqft: "",
  capacity: "",
  bedrooms: "1",
  bathrooms: "1",
  furnishing: "Unfurnished",
  parking: "No",
  floorNumber: "",
  totalFloors: "",
  address: "",
  city: "",
  state: "Maharashtra",
  zipCode: "",
  latitude: "",
  longitude: "",
};

function getLoggedInUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function AddProperty() {
  const user = getLoggedInUser();

  const [formData, setFormData] = useState({
    ...initialForm,
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [imageWarning, setImageWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => {
      const updated = {
        ...previousData,
        [name]: value,
      };

      if (name === "propertyType" && value !== "Office") {
        updated.priceUnit = "MONTH";
      }

      return updated;
    });

    setError("");
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Only JPG, PNG and WEBP image files are allowed.");
    } else {
      setError("");
    }

    setImageFiles(validFiles);
  };

  const handleGPSLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setError("");
        },
        (error) => {
          console.error("GPS error:", error);
          setError("Unable to retrieve your location. Please ensure location access is allowed.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const ownerId = user?.userId || user?.id || localStorage.getItem("userId");

    if (!ownerId) {
      setError("Your login session is invalid. Please log in again.");
      return;
    }

    if (
      formData.floorNumber &&
      formData.totalFloors &&
      Number(formData.floorNumber) > Number(formData.totalFloors)
    ) {
      setError("Floor number cannot be greater than total floors.");
      return;
    }

    const isOfficeType = formData.propertyType === "Office";

    let extraDetails = "";

    if (isOfficeType) {
      if (formData.capacity) {
        extraDetails = `Capacity: ${Number(formData.capacity)} people`;
      }
    } else {
      extraDetails = `Bedrooms: ${formData.bedrooms || 1}\nBathrooms: ${formData.bathrooms || 1}\nFurnishing: ${formData.furnishing || "Unfurnished"}\nParking: ${formData.parking || "No"}`;
    }

    const description = extraDetails
      ? `${formData.description.trim()}\n\n${extraDetails}`
      : formData.description.trim();

    const isHourlyOffice = isOfficeType && formData.priceUnit === "HOUR";

    const propertyPayload = {
      ownerId: Number(ownerId),
      title: formData.title.trim(),
      description,
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      bookingMode: formData.bookingMode || "INSTANT",
      price: Number(formData.price),
      priceUnit: isOfficeType ? formData.priceUnit : "MONTH",
      openingTime: isHourlyOffice ? formData.openingTime || "09:00" : null,
      closingTime: isHourlyOffice ? formData.closingTime || "18:00" : null,
      slotDurationMinutes: isHourlyOffice ? Number(formData.slotDurationMinutes || 60) : null,
      areaSqft: Number(formData.areaSqft),

      floorNumber: formData.floorNumber ? Number(formData.floorNumber) : null,
      totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,

      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),

      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,

      status: "AVAILABLE",
      isApproved: false,
    };

    try {
      setLoading(true);
      setError("");
      setImageWarning("");

      if (!propertyPayload.latitude || !propertyPayload.longitude) {
        try {
          const coords = await geocodeAddress({
            address: propertyPayload.address,
            city: propertyPayload.city,
            state: propertyPayload.state,
            zipCode: propertyPayload.zipCode,
          });

          if (coords) {
            propertyPayload.latitude = coords.lat;
            propertyPayload.longitude = coords.lng;
          }
        } catch (geoErr) {
          console.warn("Geocoding failed during creation, continuing without coordinates:", geoErr);
        }
      }

      const createdProperty = await createProperty(propertyPayload);
      const propertyId = createdProperty?.propertyId || createdProperty?.id;

      if (!propertyId) {
        throw new Error("Backend did not return the new property ID.");
      }

      if (imageFiles.length > 0) {
        try {
          await uploadPropertyImages(propertyId, imageFiles);
        } catch (imageError) {
          console.error("Property image upload failed:", imageError);
          setImageWarning("Property was saved, but the image upload failed.");
        }
      }

      setSubmitted(true);
      setFormData({ ...initialForm });
      setImageFiles([]);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      console.error("Property submission error:", requestError);
      const responseData = requestError.response?.data;

      if (!requestError.response) {
        setError(requestError.message || "Cannot connect to the backend.");
      } else {
        setError(
          typeof responseData === "string"
            ? responseData
            : responseData?.message || "Unable to submit the property."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="property-success-page">
        <div className="property-success-card">
          <span>
            <FiCheckCircle />
          </span>

          <p>PROPERTY SUBMITTED</p>
          <h1>Property added successfully!</h1>

          <div className="property-pending-message">
            Your property has been submitted successfully.
            <br />
            Your listing is under review and will be published once approved.
          </div>

          {imageWarning && <div className="property-form-error">{imageWarning}</div>}

          <div className="property-success-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setSubmitted(false);
                setImageWarning("");
              }}
            >
              Add Another Property
            </button>

            <Link to="/owner-dashboard" className="property-secondary-button">
              View My Properties
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isOfficeType = formData.propertyType === "Office";
  const isHourlyOffice = isOfficeType && formData.priceUnit === "HOUR";

  return (
    <main className="list-property-page">
      <div className="container">
        <Link to="/owner-dashboard" className="property-back-link">
          <FiArrowLeft />
          Back to dashboard
        </Link>

        <div className="property-page-heading">
          <span>OWNER PORTAL</span>
          <h1>List your property</h1>
          <p>Enter your property details and reach tenants searching for rental spaces.</p>
        </div>

        <div className="property-form-layout">
          <form className="property-form-card" onSubmit={handleSubmit}>
            {error && <div className="property-form-error">{error}</div>}

            <div className="property-form-section">
              <div className="property-section-heading">
                <span>
                  <FiHome />
                </span>
                <div>
                  <h2>Basic information</h2>
                  <p>Tell us about your property</p>
                </div>
              </div>

              <div className="property-form-grid">
                <label className="property-field property-full-width">
                  Property title
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Example: Premium Workspace or Luxury Villa"
                    required
                  />
                </label>

                <label className="property-field">
                  Property type
                  <select name="propertyType" value={formData.propertyType} onChange={handleChange} required>
                    <option value="Office">Office</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                  </select>
                </label>

                <label className="property-field property-full-width">
                  Booking Mode
                  <select name="bookingMode" value={formData.bookingMode} onChange={handleChange} required>
                    <option value="INSTANT">Instant Book (Guests book & pay immediately)</option>
                    <option value="APPROVAL">Approval Required (Owner reviews & approves each request)</option>
                  </select>
                  <small style={{ color: "#6a7892", display: "block", marginTop: "4px" }}>
                    Approval Required is recommended for long-term residential rentals.
                  </small>
                </label>

                <label className="property-field property-full-width">
                  Description
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the property and facilities..."
                    rows="5"
                    required
                  />
                </label>

                <label className="property-field property-full-width">
                  Property images
                  <div className="property-input-with-icon">
                    <FiImage />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      onChange={handleImageChange}
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="property-form-divider" />

            <div className="property-form-section">
              <div className="property-section-heading">
                <span>
                  <FiMapPin />
                </span>
                <div>
                  <h2>Location Coordinates</h2>
                  <p>Provide GPS coordinates for your property manually or automatically</p>
                </div>
              </div>
              <div className="property-form-grid">
                <label className="property-field">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 19.0760"
                  />
                </label>
                <label className="property-field">
                  Longitude
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 72.8777"
                  />
                </label>
                <div className="property-field property-full-width" style={{ marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="property-secondary-button" 
                    onClick={handleGPSLocation}
                    style={{ width: 'fit-content' }}
                  >
                    <FiMapPin style={{ marginRight: '8px' }} />
                    Get Current Location (GPS)
                  </button>
                  <small style={{ color: "#6a7892", display: "block", marginTop: "8px" }}>
                    If left blank, coordinates will be auto-generated from the address.
                  </small>
                </div>
              </div>
            </div>

            <div className="property-form-divider" />

            <div className="property-form-section">
              <div className="property-section-heading">
                <span>
                  <FiDollarSign />
                </span>
                <div>
                  <h2>Price & Property Details</h2>
                  <p>Enter size, capacity and pricing</p>
                </div>
              </div>

              <div className="property-form-grid">
                {isOfficeType ? (
                  <>
                    <label className="property-field">
                      Rent Amount
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Rent amount"
                        min="1"
                        required
                      />
                    </label>

                    <label className="property-field">
                      Rental Unit
                      <select name="priceUnit" value={formData.priceUnit} onChange={handleChange} required>
                        <option value="HOUR">Per Hour</option>
                        <option value="DAY">Per Day</option>
                        <option value="WEEK">Per Week</option>
                        <option value="MONTH">Per Month</option>
                      </select>
                    </label>

                    {/* Business Hours - ONLY for Office + HOUR */}
                    {isHourlyOffice && (
                      <>
                        <label className="property-field">
                          Opening Time
                          <div className="property-input-with-icon">
                            <FiClock />
                            <select name="openingTime" value={formData.openingTime} onChange={handleChange} required>
                              <option value="07:00">07:00 AM</option>
                              <option value="08:00">08:00 AM</option>
                              <option value="09:00">09:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                            </select>
                          </div>
                        </label>

                        <label className="property-field">
                          Closing Time
                          <div className="property-input-with-icon">
                            <FiClock />
                            <select name="closingTime" value={formData.closingTime} onChange={handleChange} required>
                              <option value="17:00">05:00 PM</option>
                              <option value="18:00">06:00 PM</option>
                              <option value="19:00">07:00 PM</option>
                              <option value="20:00">08:00 PM</option>
                              <option value="21:00">09:00 PM</option>
                              <option value="22:00">10:00 PM</option>
                            </select>
                          </div>
                        </label>

                        <label className="property-field">
                          Slot Duration
                          <select name="slotDurationMinutes" value={formData.slotDurationMinutes} onChange={handleChange} required>
                            <option value="30">30 Minutes</option>
                            <option value="60">60 Minutes (1 Hour)</option>
                            <option value="90">90 Minutes</option>
                            <option value="120">120 Minutes (2 Hours)</option>
                          </select>
                        </label>
                      </>
                    )}

                    <label className="property-field">
                      Area (sq.ft.)
                      <input
                        type="number"
                        name="areaSqft"
                        value={formData.areaSqft}
                        onChange={handleChange}
                        placeholder="Example: 1200"
                        min="1"
                        required
                      />
                    </label>

                    <label className="property-field">
                      Workspace Capacity
                      <div className="property-input-with-icon">
                        <FiUsers />
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleChange}
                          placeholder="Number of people"
                          min="1"
                          required
                        />
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="property-field">
                      Monthly Rent
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Monthly rent"
                        min="1"
                        required
                      />
                    </label>

                    <label className="property-field">
                      Area (sq.ft.)
                      <input
                        type="number"
                        name="areaSqft"
                        value={formData.areaSqft}
                        onChange={handleChange}
                        placeholder="Example: 1200"
                        min="1"
                        required
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="property-submit-button" disabled={loading}>
              <FiBriefcase />
              {loading ? "Submitting Property..." : "Submit Property"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default AddProperty;