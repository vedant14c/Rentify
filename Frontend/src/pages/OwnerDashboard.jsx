import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  getOwnerBookingRequests,
  updateBookingRequestStatus,
} from "../services/bookingService";
import {
  deleteProperty,
  getOwnerProperties,
  updateProperty,
} from "../services/propertyService";
import BookingStatusBadge from "../components/booking/BookingStatusBadge";
import BookingModeBadge from "../components/booking/BookingModeBadge";
import "../css/ownerDashboard.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function getOwnerId() {
  const user = getStoredUser();
  return user?.userId || user?.id || localStorage.getItem("userId");
}

function formatDate(date) {
  if (!date) return "Not selected";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createPropertyPayload(property, status) {
  return {
    ownerId: property.ownerId,
    title: property.title,
    description: property.description || "",
    propertyType: property.propertyType,
    listingType: property.listingType,
    price: Number(property.price || 0),
    priceUnit: property.priceUnit || "MONTH",
    areaSqft: Number(property.areaSqft || 0),
    floorNumber: Number(property.floorNumber || 0),
    totalFloors: Number(property.totalFloors || 0),
    address: property.address || "",
    city: property.city,
    state: property.state,
    zipCode: property.zipCode || "",
    latitude: property.latitude || null,
    longitude: property.longitude || null,
    status,
    isApproved: property.isApproved,
    bookingMode: property.bookingMode || "INSTANT",
    openingTime: property.openingTime,
    closingTime: property.closingTime,
    slotDurationMinutes: property.slotDurationMinutes,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

function OwnerDashboard() {
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const [updatingPropertyId, setUpdatingPropertyId] = useState(null);

  const [bookingRequests, setBookingRequests] = useState([]);
  const [activeRequestTab, setActiveRequestTab] = useState("ALL");
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  useEffect(() => {
    let componentActive = true;
    const ownerId = getOwnerId();

    if (!ownerId) {
      setPropertyError("Your login session is invalid.");
      setRequestError("Your login session is invalid.");
      setPropertiesLoading(false);
      setRequestsLoading(false);
      return () => {
        componentActive = false;
      };
    }

    const loadProperties = async () => {
      try {
        setPropertiesLoading(true);
        setPropertyError("");
        const response = await getOwnerProperties(Number(ownerId));
        if (componentActive) {
          setProperties(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        console.error("Unable to load owner properties:", err);
        if (componentActive) setPropertyError("Unable to load your properties.");
      } finally {
        if (componentActive) setPropertiesLoading(false);
      }
    };

    const loadBookingRequests = async () => {
      try {
        setRequestsLoading(true);
        setRequestError("");
        const response = await getOwnerBookingRequests(Number(ownerId));
        if (componentActive) {
          setBookingRequests(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        console.error("Unable to load booking requests:", err);
        if (componentActive) setRequestError("Unable to load booking requests.");
      } finally {
        if (componentActive) setRequestsLoading(false);
      }
    };

    loadProperties();
    loadBookingRequests();

    return () => {
      componentActive = false;
    };
  }, []);

  const propertyStatistics = useMemo(() => {
    const approved = properties.filter((p) => p.isApproved === true).length;
    const pending = properties.filter((p) => p.isApproved !== true).length;
    return { total: properties.length, approved, pending };
  }, [properties]);

  const requestStatistics = useMemo(() => {
    const pending = bookingRequests.filter(
      (r) => String(r.status).toUpperCase() === "PENDING"
    ).length;
    const accepted = bookingRequests.filter((r) =>
      ["CONFIRMED", "APPROVED", "ACCEPTED", "PAID"].includes(String(r.status).toUpperCase())
    ).length;

    return { total: bookingRequests.length, pending, accepted };
  }, [bookingRequests]);

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      setUpdatingPropertyId(propertyId);
      await deleteProperty(propertyId);
      setProperties((prev) => prev.filter((p) => p.propertyId !== propertyId));
    } catch (err) {
      setPropertyError("Unable to delete this property.");
    } finally {
      setUpdatingPropertyId(null);
    }
  };

  const handleAvailabilityChange = async (property) => {
    const propertyId = property.propertyId;
    const newStatus = String(property.status).toUpperCase() === "UNAVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";

    try {
      setUpdatingPropertyId(propertyId);
      const payload = createPropertyPayload(property, newStatus);
      await updateProperty(propertyId, payload);
      setProperties((prev) =>
        prev.map((item) => (item.propertyId === propertyId ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      setPropertyError("Unable to update property availability.");
    } finally {
      setUpdatingPropertyId(null);
    }
  };

  const handleRequestStatus = async (requestId, newStatus) => {
    const actionName = newStatus === "APPROVED" || newStatus === "accepted" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionName} this booking request?`)) return;

    try {
      setUpdatingRequestId(requestId);
      await updateBookingRequestStatus(requestId, newStatus);
      setBookingRequests((prev) =>
        prev.map((item) => (item.requestId === requestId ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      setRequestError("Unable to update this request.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Filter requests by Tab
  const todayStr = new Date().toISOString().split("T")[0];
  const filteredRequests = bookingRequests.filter((req) => {
    const status = String(req.status || "").toUpperCase();
    if (activeRequestTab === "UPCOMING") {
      return (status === "CONFIRMED" || status === "APPROVED") && req.proposedStart > todayStr;
    }
    if (activeRequestTab === "CURRENT") {
      return (status === "CONFIRMED" || status === "APPROVED") && req.proposedStart <= todayStr && req.proposedEnd >= todayStr;
    }
    if (activeRequestTab === "COMPLETED") {
      return status === "CONFIRMED" && req.proposedEnd < todayStr;
    }
    if (activeRequestTab === "CANCELLED") {
      return status === "CANCELLED" || status === "EXPIRED" || status === "REJECTED";
    }
    return true;
  });

  return (
    <main className="owner-dashboard-page">
      <section className="owner-dashboard-hero">
        <div className="container owner-dashboard-hero-content">
          <div>
            <span className="owner-dashboard-label">
              <FiBriefcase />
              PROPERTY MANAGEMENT
            </span>
            <h1>Owner Dashboard</h1>
            <p>Manage your rental properties and tenant applications.</p>
          </div>

          <Link to="/list-property" className="add-property-dashboard-button">
            <FiPlus />
            Add New Rental Property
          </Link>
        </div>
      </section>

      <section className="container owner-dashboard-content">
        <div className="owner-statistics-grid">
          <article className="owner-stat-card">
            <span className="owner-stat-icon total">
              <FiBriefcase />
            </span>
            <div>
              <p>Total Properties</p>
              <strong>{propertyStatistics.total}</strong>
            </div>
          </article>

          <article className="owner-stat-card">
            <span className="owner-stat-icon pending">
              <FiClock />
            </span>
            <div>
              <p>Pending Applications</p>
              <strong>{requestStatistics.pending}</strong>
            </div>
          </article>

          <article className="owner-stat-card">
            <span className="owner-stat-icon approved">
              <FiCheckCircle />
            </span>
            <div>
              <p>Confirmed / Accepted</p>
              <strong>{requestStatistics.accepted}</strong>
            </div>
          </article>
        </div>

        <section className="owner-booking-requests">
          <div className="owner-properties-heading">
            <div>
              <h2>Rental Applications</h2>
              <p>{bookingRequests.length} applications received</p>
            </div>
          </div>

          {/* Categorized Filter Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
            {["ALL", "UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveRequestTab(tab)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  border: "none",
                  background: activeRequestTab === tab ? "#2563eb" : "#f1f5f9",
                  color: activeRequestTab === tab ? "#ffffff" : "#475569",
                  cursor: "pointer",
                }}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {requestError && (
            <div className="owner-request-error">
              <FiAlertCircle />
              {requestError}
            </div>
          )}

          {requestsLoading ? (
            <div className="owner-request-empty">
              <FiClock />
              <h3>Loading booking requests...</h3>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="owner-request-empty">
              <FiCalendar />
              <h3>No booking requests found</h3>
            </div>
          ) : (
            <div className="owner-request-grid">
              {filteredRequests.map((request) => {
                const statusUpper = String(request.status || "").toUpperCase();
                const isPending = statusUpper === "PENDING";
                const isApprovalMode = String(request.bookingMode || "INSTANT").toUpperCase() !== "INSTANT";

                return (
                  <article className="owner-request-card" key={request.requestId}>
                    <div className="owner-request-card-heading">
                      <div>
                        <span>{request.requestType || "RENTAL"}</span>
                        <h3>{request.propertyTitle || `Property #${request.propertyId}`}</h3>
                      </div>

                      <BookingStatusBadge status={request.status} />
                    </div>

                    <div className="owner-request-user">
                      <FiUsers />
                      <div>
                        <small>Requested by</small>
                        <strong>{request.requesterName || `User #${request.userId}`}</strong>
                      </div>
                    </div>

                    <div className="owner-request-dates">
                      <div>
                        <FiCalendar />
                        <span>
                          <small>Start date</small>
                          <strong>{formatDate(request.proposedStart)}</strong>
                        </span>
                      </div>

                      <div>
                        <FiCalendar />
                        <span>
                          <small>End date</small>
                          <strong>{formatDate(request.proposedEnd)}</strong>
                        </span>
                      </div>
                    </div>

                    {isPending && isApprovalMode && (
                      <div className="owner-request-actions">
                        <button
                          type="button"
                          className="accept-request-button"
                          disabled={updatingRequestId === request.requestId}
                          onClick={() => handleRequestStatus(request.requestId, "APPROVED")}
                        >
                          <FiCheckCircle />
                          Approve Application
                        </button>

                        <button
                          type="button"
                          className="reject-request-button"
                          disabled={updatingRequestId === request.requestId}
                          onClick={() => handleRequestStatus(request.requestId, "REJECTED")}
                        >
                          <FiXCircle />
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="owner-properties-heading">
          <div>
            <h2>Your Listings</h2>
            <p>{properties.length} properties found</p>
          </div>
        </div>

        {propertyError && (
          <div className="owner-request-error">
            <FiAlertCircle />
            {propertyError}
          </div>
        )}

        {propertiesLoading ? (
          <div className="owner-properties-empty">
            <span>
              <FiClock />
            </span>
            <h2>Loading properties...</h2>
          </div>
        ) : properties.length > 0 ? (
          <div className="owner-properties-grid">
            {properties.map((property) => {
              const propertyId = property.propertyId;
              const propertyName = property.title || property.name || "Property";
              const propertyType = property.propertyType || property.type || "Office";
              const price = Number(property.price || 0);
              const approvalStatus = property.isApproved === true ? "Approved" : "Pending";
              const availability = String(property.status || "AVAILABLE").toUpperCase();

              return (
                <article className="owner-property-card" key={propertyId}>
                  <div className="owner-property-image-wrapper">
                    <img
                      src={property.image || fallbackImage}
                      alt={propertyName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallbackImage;
                      }}
                    />
                    <span className={`owner-approval-badge ${approvalStatus.toLowerCase()}`}>
                      {approvalStatus}
                    </span>
                  </div>

                  <div className="owner-property-card-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span className="owner-property-type">{propertyType}</span>
                      <BookingModeBadge mode={property.bookingMode} />
                    </div>

                    <h3>{propertyName}</h3>

                    <p className="owner-property-location">
                      <FiMapPin />
                      {property.city || "Location not provided"}
                    </p>

                    <div className="owner-property-price">
                      <span>{property.priceUnit || "MONTH"}</span>
                      <strong>
                        ₹{price.toLocaleString("en-IN")}
                        <small>/{String(property.priceUnit || "MONTH").toLowerCase()}</small>
                      </strong>
                    </div>

                    <div className="owner-property-actions">
                      <button
                        type="button"
                        className={`availability-button ${
                          availability === "AVAILABLE" ? "available" : "unavailable"
                        }`}
                        disabled={updatingPropertyId === propertyId}
                        onClick={() => handleAvailabilityChange(property)}
                      >
                        {updatingPropertyId === propertyId
                          ? "Updating..."
                          : availability === "AVAILABLE"
                          ? "Available"
                          : "Unavailable"}
                      </button>

                      <Link to={`/edit-property/${propertyId}`} className="edit-property-button">
                        <FiEdit3 />
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="delete-property-button"
                        disabled={updatingPropertyId === propertyId}
                        onClick={() => handleDelete(propertyId)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="owner-properties-empty">
            <span>
              <FiBriefcase />
            </span>
            <h2>No properties listed</h2>
            <Link to="/list-property">
              <FiPlus />
              List Your First Property
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default OwnerDashboard;