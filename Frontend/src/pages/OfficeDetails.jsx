import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiLoader,
  FiMapPin,
  FiMaximize2,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import ReviewSection from "../components/ReviewSection";
import { getPropertyById } from "../services/propertyService";
import { getPropertyAvailability } from "../services/bookingService";
import AvailabilityCard from "../components/booking/AvailabilityCard";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyLocationMap from "../components/PropertyLocationMap";
import "../css/details.css";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function OfficeDetails() {
  const { id } = useParams();

  const [office, setOffice] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let componentActive = true;

    const loadOffice = async () => {
      try {
        setLoading(true);
        setError("");

        const [response, availRes] = await Promise.all([
          getPropertyById(Number(id)),
          getPropertyAvailability(Number(id)).catch(() => null),
        ]);

        if (componentActive) {
          setOffice(response);
          setAvailability(availRes);
        }
      } catch (requestError) {
        console.error("Unable to load property details:", requestError);
        if (!componentActive) return;

        if (!requestError.response) {
          setError("Cannot connect to the backend. Make sure Spring Boot is running.");
        } else if (requestError.response.status === 404) {
          setError("Property not found.");
        } else {
          setError(requestError.response?.data?.message || "Unable to load property details.");
        }
      } finally {
        if (componentActive) {
          setLoading(false);
        }
      }
    };

    loadOffice();

    return () => {
      componentActive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="details-not-found">
        <div>
          <FiLoader className="loading-icon" />
          <h1>Loading property details...</h1>
          <p>Please wait while we load the property information.</p>
        </div>
      </main>
    );
  }

  if (!office || error) {
    return (
      <main className="details-not-found">
        <div>
          <h1>Property unavailable</h1>
          <p>{error || "The property you are looking for is unavailable."}</p>
          <Link to="/properties" className="primary-btn">
            View All Properties
          </Link>
        </div>
      </main>
    );
  }

  const propertyId = office.propertyId ?? office.id;
  const rawListingType = String(office.listingType || "RENT").toUpperCase();
  const isForSale = rawListingType === "SALE" || rawListingType === "BUY";
  const propertyType = office.propertyType || office.type || "Property";
  const isOffice = propertyType.toLowerCase() === "office";
  const isInstant = (office.bookingMode || "INSTANT").toUpperCase() === "INSTANT";
  const currentUser = getStoredUser();
  const currentUserId = Number(currentUser?.userId || currentUser?.id || localStorage.getItem("userId"));
  const isOwner = String(currentUser?.role || localStorage.getItem("role") || "").toUpperCase() === "OWNER";
  const isOwnedProperty = isOwner && currentUserId === Number(office.ownerId);

  const facilities = [
    "High-speed Wi-Fi",
    "Air conditioning",
    "Power backup",
    "Parking facility",
    "24/7 security",
    "Housekeeping",
  ];

  const description =
    office.description ||
    `${office.name || office.title} is a professionally designed ${String(
      propertyType
    ).toLowerCase()} located in ${
      office.city
    }. It provides a comfortable, secure and productive environment for residents and professionals.`;

  return (
    <main className="details-page">
      <div className="container details-container">
        <Link to="/properties" className="back-to-offices">
          <FiArrowLeft />
          Back to properties
        </Link>

        <section className="details-image-section">
          <PropertyImageGallery
            images={office.images || []}
            mainImage={office.image}
            title={office.name || office.title}
          />
          <span className="details-type">
            {isForSale ? "For Sale • " : "For Rent • "}{propertyType}
          </span>
        </section>

        <section className="details-content-grid">
          <div className="details-main-content">
            <div className="details-heading">
              <div>
                <div className="details-location">
                  <FiMapPin />
                  {office.address || office.city}
                </div>
                <h1>{office.name || office.title}</h1>
              </div>

              <div className="verified-badge">
                <FiShield />
                Verified
              </div>
            </div>

            {/* Availability Card Component */}
            <AvailabilityCard availability={availability} property={office} />

            <div className="details-highlights">
              {office.areaSqft != null || office.area != null ? (
              <div className="highlight-item">
                <span className="highlight-icon">
                  <FiMaximize2 />
                </span>
                <div>
                  <small>Total Area</small>
                  <strong>{office.areaSqft ?? office.area} sq.ft.</strong>
                </div>
              </div>
              ) : null}

              {isOffice && office.capacity != null && (
                <div className="highlight-item">
                  <span className="highlight-icon">
                    <FiUsers />
                  </span>
                  <div>
                    <small>Capacity</small>
                    <strong>{office.capacity} Occupants</strong>
                  </div>
                </div>
              )}

              {!isOffice && office.bedrooms != null && (
                <div className="highlight-item">
                  <span className="highlight-icon">
                    <FiUsers />
                  </span>
                  <div>
                    <small>Bedrooms</small>
                    <strong>{office.bedrooms}</strong>
                  </div>
                </div>
              )}

              {!isOffice && office.bathrooms != null && (
                <div className="highlight-item">
                  <span className="highlight-icon">
                    <FiUsers />
                  </span>
                  <div>
                    <small>Bathrooms</small>
                    <strong>{office.bathrooms}</strong>
                  </div>
                </div>
              )}

              <div className="highlight-item">
                <span className="highlight-icon">
                  <FiCalendar />
                </span>
                <div>
                  <small>Booking Mode</small>
                  <strong style={{ color: isInstant ? "#047857" : "#d97706" }}>
                    {isInstant ? "⚡ Instant Book" : "📋 Owner Approval"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h2>About this property</h2>
              <p>{description}</p>
            </div>

            <div className="details-section">
              <h2>Facilities and amenities</h2>
              <div className="facilities-grid">
                {facilities.map((facility) => (
                  <div className="facility-item" key={facility}>
                    <FiCheckCircle />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            <PropertyLocationMap property={office} />
          </div>

          <aside className="booking-summary">
            <p className="booking-price-label">{isForSale ? "Purchase Price" : "Rental Rate"}</p>

            <div className="booking-price">
              ₹{Number(office.price || 0).toLocaleString("en-IN")}
              {!isForSale && office.priceUnit && <span>/{String(office.priceUnit || "").toLowerCase()}</span>}
            </div>

            <div className="booking-divider" />

            <div className="booking-information">
              <div>
                <span>Listing Type</span>
                <strong style={{ color: isForSale ? "#059669" : "#2563eb" }}>
                  {isForSale ? "For Sale (Purchase)" : "For Rent"}
                </strong>
              </div>

              <div>
                <span>Property Type</span>
                <strong>{propertyType}</strong>
              </div>

              <div>
                <span>Booking Mode</span>
                <strong>{isInstant ? "Instant Book" : "Owner Approval Required"}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{office.city}</strong>
              </div>
            </div>

            {isOwnedProperty ? (
              <Link to={`/edit-property/${propertyId}`} className="details-book-button">
                <FiCalendar />
                Edit Property
              </Link>
            ) : isOwner ? (
              <p className="booking-note">Owners cannot book properties.</p>
            ) : (
              <Link to={`/book-office/${propertyId}`} className="details-book-button">
                <FiCalendar />
                {isForSale
                  ? "Inquire to Purchase"
                  : isInstant
                  ? "Book Property Now"
                  : "Apply for Rental"}
              </Link>
            )}

            <p className="booking-note">
              {isForSale
                ? "Direct purchase request: Submit your inquiry to connect directly with the seller."
                : isInstant
                ? "Instant Booking: Pay securely to confirm immediately."
                : "No payment is required to submit a rental application."}
            </p>
          </aside>
        </section>

        <ReviewSection propertyId={propertyId} />
      </div>
    </main>
  );
}

export default OfficeDetails;