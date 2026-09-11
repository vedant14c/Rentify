import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiHome,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import {
  getPropertyById,
  updateProperty,
  uploadPropertyImages,
} from "../services/propertyService";
import { geocodeAddress } from "../utils/geocoding";
import "../css/propertyForm.css";

const emptyForm = {
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
  state: "",
  zipCode: "",
  latitude: "",
  longitude: "",
};

function getCapacityFromDescription(description = "") {
  const capacityMatch = description.match(/Capacity:\s*(\d+)\s*people/i);
  return capacityMatch ? capacityMatch[1] : "";
}

function getResidentialDetailsFromDescription(description = "") {
  const bedroomsMatch = description.match(/Bedrooms:\s*(\d+)/i);
  const bathroomsMatch = description.match(/Bathrooms:\s*(\d+)/i);
  const furnishingMatch = description.match(
    /Furnishing:\s*(Furnished|Semi-Furnished|Unfurnished)/i
  );
  const parkingMatch = description.match(/Parking:\s*(Yes|No)/i);

  return {
    bedrooms: bedroomsMatch ? bedroomsMatch[1] : "1",
    bathrooms: bathroomsMatch ? bathroomsMatch[1] : "1",
    furnishing: furnishingMatch ? furnishingMatch[1] : "Unfurnished",
    parking: parkingMatch ? parkingMatch[1] : "No",
  };
}

function removeMetadataFromDescription(description = "") {
  return description
    .replace(/\s*Capacity:\s*\d+\s*people\s*/gi, "")
    .replace(/\s*Bedrooms:\s*\d+\s*/gi, "")
    .replace(/\s*Bathrooms:\s*\d+\s*/gi, "")
    .replace(/\s*Furnishing:\s*(Furnished|Semi-Furnished|Unfurnished)\s*/gi, "")
    .replace(/\s*Parking:\s*(Yes|No)\s*/gi, "")
    .trim();
}

function getErrorMessage(error) {
  const responseData = error.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData?.message) return responseData.message;
  if (!error.response) return "Cannot connect to the backend. Make sure Spring Boot is running.";
  return "Unable to update the property. Please try again.";
}

function EditProperty() {
  const { id } = useParams();

  const [formData, setFormData] = useState(emptyForm);
  const [existingProperty, setExistingProperty] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [propertyFound, setPropertyFound] = useState(true);
  const [updated, setUpdated] = useState(false);

  const [error, setError] = useState("");
  const [imageWarning, setImageWarning] = useState("");

  useEffect(() => {
    let componentActive = true;

    const loadProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const property = await getPropertyById(id);

        if (!componentActive) return;
        if (!property) {
          setPropertyFound(false);
          return;
        }

        setExistingProperty(property);

        const descriptionCapacity = getCapacityFromDescription(property.description);
        const resDetails = getResidentialDetailsFromDescription(property.description);

        const loadedPropertyType = property.propertyType || property.type || "Office";
        const isOffice = loadedPropertyType === "Office";

        setFormData({
          title: property.title || property.name || "",
          description: removeMetadataFromDescription(property.description || ""),
          propertyType: loadedPropertyType,
          listingType: property.listingType || "RENT",
          bookingMode: property.bookingMode || "INSTANT",
          price: property.price ?? "",
          priceUnit: isOffice ? property.priceUnit || "MONTH" : "MONTH",
          openingTime: property.openingTime || "09:00",
          closingTime: property.closingTime || "18:00",
          slotDurationMinutes: String(property.slotDurationMinutes || 60),
          areaSqft: property.areaSqft ?? property.area ?? "",
          capacity: descriptionCapacity || property.capacity || "",
          bedrooms: resDetails.bedrooms,
          bathrooms: resDetails.bathrooms,
          furnishing: resDetails.furnishing,
          parking: resDetails.parking,
          floorNumber: property.floorNumber ?? "",
          totalFloors: property.totalFloors ?? "",
          address: property.address || "",
          city: property.city || "",
          state: property.state || "",
          zipCode: property.zipCode || "",
          latitude: property.latitude ?? "",
          longitude: property.longitude ?? "",
        });
      } catch (requestError) {
        console.error("Property loading error:", requestError);
        if (componentActive) {
          setError("Unable to load property details.");
        }
      } finally {
        if (componentActive) {
          setLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      componentActive = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => {
      const updatedData = {
        ...previousData,
        [name]: value,
      };

      if (name === "propertyType" && value !== "Office") {
        updatedData.priceUnit = "MONTH";
      }

      return updatedData;
    });

    setError("");
    setUpdated(false);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    const validImages = files.filter((file) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)
    );

    if (validImages.length !== files.length) {
      setError("Please select only JPG, JPEG, PNG or WEBP images.");
      event.target.value = "";
      setSelectedImages([]);
      return;
    }

    setSelectedImages(validImages.slice(0, 5));
    setError("");
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
          setUpdated(false);
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

    if (!existingProperty) {
      setError("Property information is unavailable.");
      return;
    }

    const floorNumber = formData.floorNumber === "" ? null : Number(formData.floorNumber);
    const totalFloors = formData.totalFloors === "" ? null : Number(formData.totalFloors);

    if (floorNumber !== null && totalFloors !== null && floorNumber > totalFloors) {
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

    const cleanDescription = formData.description.trim();
    const descriptionWithDetails = extraDetails ? `${cleanDescription}\n\n${extraDetails}` : cleanDescription;

    const isHourlyOffice = isOfficeType && formData.priceUnit === "HOUR";

    const propertyData = {
      ownerId: Number(existingProperty.ownerId),
      title: formData.title.trim(),
      description: descriptionWithDetails,
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      bookingMode: formData.bookingMode || "INSTANT",
      price: Number(formData.price),
      priceUnit: isOfficeType ? formData.priceUnit : "MONTH",
      openingTime: isHourlyOffice ? formData.openingTime || "09:00" : null,
      closingTime: isHourlyOffice ? formData.closingTime || "18:00" : null,
      slotDurationMinutes: isHourlyOffice ? Number(formData.slotDurationMinutes || 60) : null,
      areaSqft: Number(formData.areaSqft),
      floorNumber,
      totalFloors,
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      status: existingProperty.status || "AVAILABLE",
      isApproved: existingProperty.isApproved ?? false,
    };

    try {
      setSaving(true);
      setError("");
      setImageWarning("");

      await updateProperty(Number(id), propertyData);

      if (selectedImages.length > 0) {
        try {
          await uploadPropertyImages(Number(id), selectedImages);
        } catch (imageError) {
          console.error("Property image upload error:", imageError);
          setImageWarning("Property details were updated, but the new images could not be uploaded.");
        }
      }

      setUpdated(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      console.error("Property update error:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="property-success-page">
        <div className="property-success-card">
          <h1>Loading property...</h1>
          <p>Please wait while we load the property.</p>
        </div>
      </main>
    );
  }

  if (!propertyFound) {
    return (
      <main className="property-success-page">
        <div className="property-success-card">
          <h1>Property not found</h1>
          <p>{error || "The selected property does not exist."}</p>
          <Link to="/owner-dashboard" className="primary-btn">
            Back to My Properties
          </Link>
        </div>
      </main>
    );
  }

  if (updated) {
    return (
      <main className="property-success-page">
        <div className="property-success-card">
          <span>
            <FiCheckCircle />
          </span>
          <p>PROPERTY UPDATED</p>
          <h1>Changes saved successfully!</h1>

          <div className="property-pending-message">
            Your updated property information was saved in the database.
          </div>

          {imageWarning && <div className="property-form-error">{imageWarning}</div>}

          <div className="property-success-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setUpdated(false);
                setSelectedImages([]);
              }}
            >
              Continue Editing
            </button>
            <Link to="/owner-dashboard" className="property-secondary-button">
              My Properties
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
          Back to My Properties
        </Link>

        <div className="property-page-heading">
          <span>OWNER PORTAL</span>
          <h1>Edit property</h1>
          <p>Update your property information and save the changes.</p>
        </div>

        {error && <div className="property-form-error">{error}</div>}

        <div className="property-form-layout">
          <form className="property-form-card" onSubmit={handleSubmit}>
            <div className="property-form-section">
              <div className="property-section-heading">
                <span>
                  <FiHome />
                </span>
                <div>
                  <h2>Basic information</h2>
                  <p>Update your property information</p>
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
                    placeholder="Enter property title"
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
                </label>

                <label className="property-field property-full-width">
                  Description
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    required
                  />
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
                  <h2>Price and details</h2>
                  <p>Update pricing, size and hours</p>
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

            <button type="submit" className="property-submit-button" disabled={saving}>
              <FiBriefcase />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default EditProperty;