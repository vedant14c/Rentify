import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiInbox,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
  FiX,
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

const isConfirmed = (s) => ["CONFIRMED", "PAID"].includes(String(s || "").toUpperCase());

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

function getOwnerId(user) {
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

function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = String(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateRange(start, end) {
  if (!start) return "Date not selected";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function formatApplied(request) {
  const raw =
    request.createdAt || request.appliedAt || request.requestedAt || request.createdDate;
  if (raw) {
    const then = new Date(raw);
    if (!Number.isNaN(then.getTime())) {
      const diffMs = Date.now() - then.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const isStale = diffDays > 14;
      if (diffDays <= 0) return { text: "Applied today", isStale: false };
      if (diffDays === 1) return { text: "Applied 1 day ago", isStale: false };
      return { text: `Applied ${diffDays} days ago`, isStale };
    }
  }
  if (request.proposedStart) return { text: `For ${formatDate(request.proposedStart)}`, isStale: false };
  return { text: "Recently applied", isStale: false };
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatPrice(price, priceUnit) {
  const num = Number(price || 0);
  const unit = String(priceUnit || "MONTH").toUpperCase();
  const unitLabel = unit === "HOUR" ? "/hr" : unit === "DAY" ? "/day" : unit === "MONTH" ? "/mo" : unit === "YEAR" ? "/yr" : "";

  let formatted = "";
  if (num >= 10000000) {
    formatted = `₹${(num / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  } else if (num >= 100000) {
    formatted = `₹${(num / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  } else {
    formatted = `₹${num.toLocaleString("en-IN")}`;
  }

  return { formatted, unitLabel };
}

function getRequestStatusMeta(status) {
  const s = String(status || "").toUpperCase();
  if (["CONFIRMED", "PAID"].includes(s)) {
    return {
      cls: "confirmed",
      label: s === "PAID" ? "Confirmed & Paid" : "Confirmed",
      isPendingAction: false,
    };
  }
  if (s === "PENDING_PAYMENT") {
    return {
      cls: "pending-payment",
      label: "Payment Pending",
      isPendingAction: false,
    };
  }
  if (["APPROVED", "ACCEPTED"].includes(s)) {
    return {
      cls: "approved",
      label: "Owner Approved",
      isPendingAction: false,
    };
  }
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(s)) {
    return {
      cls: "rejected",
      label: s === "CANCELLED" ? "Cancelled" : s === "EXPIRED" ? "Expired" : "Rejected",
      isPendingAction: false,
    };
  }
  if (s === "PENDING") {
    return {
      cls: "action-needed",
      label: "Action Needed",
      isPendingAction: true,
    };
  }
  const cleanLabel = s
    ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")
    : "Unknown";
  return {
    cls: "rejected",
    label: cleanLabel,
    isPendingAction: false,
  };
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
    capacity: property.capacity,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

function OwnerDashboard({ view = "dashboard" }) {
  const owner = useMemo(() => getStoredUser(), []);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const [updatingPropertyId, setUpdatingPropertyId] = useState(null);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertyFilterStatus, setPropertyFilterStatus] = useState("ALL");
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");

  const [bookingRequests, setBookingRequests] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");
  const [activeRequestTab, setActiveRequestTab] = useState(() => {
    const raw = (queryTab || "ALL").toUpperCase();
    return ["ALL", "PENDING", "UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].includes(raw)
      ? raw
      : "ALL";
  });

  useEffect(() => {
    if (queryTab) {
      const upper = queryTab.toUpperCase();
      if (["ALL", "PENDING", "UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].includes(upper)) {
        setActiveRequestTab(upper);
      }
    }
  }, [queryTab]);

  const handleTabChange = (tab) => {
    setActiveRequestTab(tab);
    setSearchParams(tab === "ALL" ? {} : { tab: tab.toLowerCase() });
  };

  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  // In-app confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    isDestructive: false,
    onConfirm: null,
  });

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    if (!confirmModal.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && updatingRequestId === null && updatingPropertyId === null) {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmModal.isOpen, updatingRequestId, updatingPropertyId]);

  useEffect(() => {
    let componentActive = true;
    const ownerId = getOwnerId(owner);

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
  }, [owner]);

  const propertyStatistics = useMemo(() => {
    const active = properties.filter((p) => String(p.status || "").toUpperCase() === "AVAILABLE").length;
    return { total: properties.length, active };
  }, [properties]);

  const requestStatistics = useMemo(() => {
    const pending = bookingRequests.filter(
      (r) => String(r.status || "").toUpperCase() === "PENDING"
    ).length;
    const confirmed = bookingRequests.filter((r) => isConfirmed(r.status)).length;

    return { total: bookingRequests.length, pending, confirmed };
  }, [bookingRequests]);

  const handleDelete = (propertyId, propertyTitle) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Property",
      message: `Are you sure you want to permanently delete "${propertyTitle || "this property"}"? This action cannot be undone.`,
      confirmLabel: "Delete Property",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setUpdatingPropertyId(propertyId);
          await deleteProperty(propertyId);
          setProperties((prev) => prev.filter((p) => p.propertyId !== propertyId));
        } catch (err) {
          setPropertyError("Unable to delete this property.");
        } finally {
          setUpdatingPropertyId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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

  const handleRequestStatus = (requestId, newStatus) => {
    const isApprove = newStatus === "APPROVED";
    setConfirmModal({
      isOpen: true,
      title: isApprove ? "Approve Application" : "Reject Application",
      message: isApprove
        ? "Are you sure you want to approve this application? The requester will be notified to proceed with payment."
        : "Are you sure you want to reject this booking application?",
      confirmLabel: isApprove ? "Approve" : "Reject",
      isDestructive: !isApprove,
      onConfirm: async () => {
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
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filter requests for bookings view tabs
  const filteredRequests = useMemo(() => {
    return bookingRequests.filter((req) => {
      const status = String(req.status || "").toUpperCase();
      if (activeRequestTab === "PENDING") {
        return status === "PENDING";
      }
      if (activeRequestTab === "UPCOMING") {
        return isConfirmed(req.status) && req.proposedStart > todayStr;
      }
      if (activeRequestTab === "CURRENT") {
        return isConfirmed(req.status) && req.proposedStart <= todayStr && req.proposedEnd >= todayStr;
      }
      if (activeRequestTab === "COMPLETED") {
        return isConfirmed(req.status) && req.proposedEnd < todayStr;
      }
      if (activeRequestTab === "CANCELLED") {
        return status === "CANCELLED" || status === "EXPIRED" || status === "REJECTED";
      }
      return true;
    });
  }, [bookingRequests, activeRequestTab, todayStr]);

  // Dashboard preview strictly uses latest requests, independent of activeRequestTab
  const recentRequests = useMemo(() => {
    return [...bookingRequests]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);

        if (validA && validB && timeA !== timeB) {
          return timeB - timeA;
        }
        if (validA && !validB) return -1;
        if (!validA && validB) return 1;
        return (b.requestId || 0) - (a.requestId || 0);
      })
      .slice(0, 3);
  }, [bookingRequests]);

  const recentProperties = useMemo(() => {
    return properties.slice(0, 3);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const q = propertySearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(prop.title || "").toLowerCase().includes(q) ||
        String(prop.city || "").toLowerCase().includes(q) ||
        String(prop.address || "").toLowerCase().includes(q);

      const matchesStatus =
        propertyFilterStatus === "ALL" ||
        String(prop.status || "").toUpperCase() === propertyFilterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [properties, propertySearchQuery, propertyFilterStatus]);

  const searchedRequests = useMemo(() => {
    const q = bookingSearchQuery.trim().toLowerCase();
    if (!q) return filteredRequests;
    return filteredRequests.filter((req) => {
      return (
        String(req.propertyTitle || "").toLowerCase().includes(q) ||
        String(req.requesterName || "").toLowerCase().includes(q) ||
        String(req.requestId || "").includes(q)
      );
    });
  }, [filteredRequests, bookingSearchQuery]);

  return (
    <main className="owner-dashboard-page">
      <div className="owner-dashboard-container">
        {/* HERO BANNER FOR DASHBOARD OR EXECUTIVE HEADER FOR SUBPAGES */}
        {view === "dashboard" ? (
          <section className="owner-dashboard-hero">
            <div className="owner-dashboard-hero-glow-1" />
            <div className="owner-dashboard-hero-glow-2" />
            <div className="owner-dashboard-hero-glow-3" />
            <div className="owner-dashboard-hero-content">
              <div className="owner-hero-text-block">
                <span className="owner-dashboard-label">
                  PROPERTY MANAGEMENT • OVERVIEW
                </span>
                <h1>Welcome back, {owner?.name?.split(" ")[0] || "Owner"}</h1>
                <p>Here's how your rental portfolio is performing across operations today.</p>
              </div>

              <Link to="/list-property" className="add-property-dashboard-button">
                <FiPlus />
                Add New Rental Property
              </Link>
            </div>
          </section>
        ) : (
          <section className="owner-subpage-header">
            <div className="owner-subpage-breadcrumbs">
              <Link to="/owner-dashboard">Dashboard</Link>
              <span>/</span>
              <span>{view === "properties" ? "My Properties" : "Rental Applications"}</span>
            </div>
            <div className="owner-subpage-header-row">
              <div>
                <h1>{view === "properties" ? "My Properties" : "Rental Applications & Bookings"}</h1>
                <p>
                  {view === "properties"
                    ? "Manage your rental listings, live availability, and hourly or monthly rates."
                    : "Review tenant applications, approve bookings, and monitor occupancy status."}
                </p>
              </div>
              <Link to="/list-property" className="add-property-dashboard-button">
                <FiPlus />
                Add New Rental Property
              </Link>
            </div>
          </section>
        )}

        {/* DASHBOARD CONTENT (ALIGNED WRAPPER) */}
        <section className="owner-dashboard-content">
          {/* FOUR STAT CARDS (CLICKABLE SHORTCUTS) */}
          <div className="owner-statistics-grid">
            {/* Stat 1: Active Properties */}
            <Link to="/owner-properties" className="owner-stat-card card-active" title="View all your properties">
              <div className="owner-stat-top">
                <span className="owner-stat-label">Active Properties</span>
                <div className="owner-stat-icon approved">
                  <FiCheckCircle />
                </div>
              </div>
              <div className="owner-stat-bottom">
                <strong className="owner-stat-value">{propertyStatistics.active}</strong>
                <div className="owner-stat-trend">
                  <span className="owner-stat-dot" />
                  <span>of {propertyStatistics.total} listed properties</span>
                </div>
              </div>
            </Link>

            {/* Stat 2: Total Portfolio */}
            <Link to="/owner-bookings?tab=all" className="owner-stat-card card-total" title="View all tenant inquiries">
              <div className="owner-stat-top">
                <span className="owner-stat-label">Total Inquiries</span>
                <div className="owner-stat-icon total">
                  <FiInbox />
                </div>
              </div>
              <div className="owner-stat-bottom">
                <strong className="owner-stat-value">{requestStatistics.total}</strong>
                <div className="owner-stat-trend total-trend">
                  <FiTrendingUp />
                  <span>All-time requests received</span>
                </div>
              </div>
            </Link>

            {/* Stat 3: Pending Review */}
            <Link to="/owner-bookings?tab=pending" className={`owner-stat-card card-pending ${requestStatistics.pending > 0 ? "has-pending" : ""}`} title="Review pending booking requests">
              <div className="owner-stat-top">
                <span className="owner-stat-label">Pending Bookings</span>
                {requestStatistics.pending > 0 ? (
                  <span className="owner-stat-action-pill">Review</span>
                ) : (
                  <div className="owner-stat-icon pending">
                    <FiClock />
                  </div>
                )}
              </div>
              <div className="owner-stat-bottom">
                <strong className="owner-stat-value">{requestStatistics.pending}</strong>
                <div className="owner-stat-trend pending-trend">
                  {requestStatistics.pending > 0 ? (
                    <>
                      <FiAlertCircle />
                      <span>Needs immediate review</span>
                    </>
                  ) : (
                    <span>All caught up</span>
                  )}
                </div>
              </div>
            </Link>

            {/* Stat 4: Confirmed Bookings */}
            <Link to="/owner-bookings?tab=upcoming" className="owner-stat-card card-confirmed" title="View upcoming confirmed bookings">
              <div className="owner-stat-top">
                <span className="owner-stat-label">Confirmed Bookings</span>
                <div className="owner-stat-icon confirmed">
                  <FiCalendar />
                </div>
              </div>
              <div className="owner-stat-bottom">
                <strong className="owner-stat-value">{requestStatistics.confirmed}</strong>
                <div className="owner-stat-trend confirmed-trend">
                  <FiCheckCircle />
                  <span>Total confirmed to date</span>
                </div>
              </div>
            </Link>
          </div>

          {/* QUICK ACTIONS TOOLBAR */}
          {view === "dashboard" && (
            <section className="owner-quick-actions">
              <Link to="/owner-properties" className="owner-quick-action secondary">
                <FiBriefcase />
                Manage Properties
              </Link>

              <Link to="/owner-bookings?tab=pending" className="owner-quick-action warning">
                <FiClock />
                Review Pending
                {requestStatistics.pending > 0 && (
                  <span className="owner-quick-action-badge">
                    {requestStatistics.pending}
                  </span>
                )}
              </Link>

              <Link to="/owner-bookings" className="owner-quick-action secondary">
                <FiCalendar />
                View All Bookings
              </Link>
            </section>
          )}

          {/* RECENT APPLICATIONS */}
          {(view === "dashboard" || view === "bookings") && (
            <section id="bookings" className="owner-booking-requests">
              <div className="owner-properties-heading" style={{ margin: "0 0 20px" }}>
                <div>
                  <div className="owner-heading-title-group">
                    <h2>{view === "dashboard" ? "Recent Rental Applications" : "Rental Applications"}</h2>
                    {view === "dashboard" && recentRequests.length > 0 && (
                      <span className="owner-badge-pill new">New</span>
                    )}
                  </div>
                  {view === "bookings" && <p>{bookingRequests.length} applications received</p>}
                </div>
                {view === "dashboard" && (
                  <Link to="/owner-bookings" className="owner-view-all-link">
                    View all →
                  </Link>
                )}
              </div>

              {view === "bookings" && (
                <div className="owner-bookings-filter-bar">
                  <div className="owner-request-tabs">
                    {["ALL", "PENDING", "UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabChange(tab)}
                        className={`owner-request-tab ${activeRequestTab === tab ? "active" : ""}`}
                      >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <div className="owner-search-box compact">
                    <FiSearch />
                    <input
                      type="text"
                      value={bookingSearchQuery}
                      onChange={(e) => setBookingSearchQuery(e.target.value)}
                      placeholder="Search applicant or property..."
                    />
                    {bookingSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBookingSearchQuery("")}
                        className="owner-search-clear"
                        title="Clear search"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {requestError && (
                <div className="owner-request-error">
                  <FiAlertCircle />
                  <span style={{ flex: 1 }}>{requestError}</span>
                  <button
                    type="button"
                    className="owner-error-close-btn"
                    onClick={() => setRequestError("")}
                    title="Dismiss"
                  >
                    <FiX />
                  </button>
                </div>
              )}

              {requestsLoading ? (
                <div className="owner-request-empty">
                  <FiClock />
                  <h3>Loading booking requests...</h3>
                </div>
              ) : (view === "dashboard" ? recentRequests : searchedRequests).length === 0 ? (
                <div className="owner-request-empty">
                  <FiCalendar />
                  <h3>{bookingSearchQuery ? "No matching requests found" : "No booking requests found"}</h3>
                </div>
              ) : view === "dashboard" ? (
                <div className="owner-app-list">
                  {recentRequests.map((request) => {
                    const statusMeta = getRequestStatusMeta(request.status);
                    const appliedInfo = formatApplied(request);

                    return (
                      <div className="owner-app-row" key={request.requestId}>
                        <div className="owner-app-left">
                          <div className="owner-app-avatar" title={request.requesterName || "Requester"}>
                            {getInitials(request.requesterName || `User ${request.userId}`)}
                          </div>
                          <div className="owner-app-info">
                            <div className="name">{request.propertyTitle || `Property #${request.propertyId}`}</div>
                            <div className="sub">
                              <span>{request.requesterName || `User #${request.userId}`}</span>
                              <span>•</span>
                              <span>{appliedInfo.text}</span>
                              {appliedInfo.isStale && statusMeta.isPendingAction && (
                                <span className="stale-warning-tag">Overdue</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="owner-app-right">
                          <span className={`owner-app-status status-${statusMeta.cls}`}>
                            <span className="owner-status-dot" />
                            {statusMeta.label}
                          </span>
                          <Link to="/owner-bookings" className="owner-app-view">
                            View →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="owner-request-grid">
                  {searchedRequests.map((request) => {
                    const statusUpper = String(request.status || "").toUpperCase();
                    const isPending = statusUpper === "PENDING";
                    const isApprovalMode = String(request.bookingMode || "INSTANT").toUpperCase() !== "INSTANT";
                    const isPurchaseInquiry =
                      String(request.listingType || "").toUpperCase() === "SALE" ||
                      String(request.requestType || "").toUpperCase() === "PURCHASE" ||
                      String(request.requestType || "").toUpperCase() === "BUY" ||
                      String(request.message || "").toUpperCase().includes("PURCHASE INQUIRY");

                    return (
                      <article className="owner-request-card" key={request.requestId}>
                        <div className="owner-request-card-heading">
                          <div>
                            <span style={isPurchaseInquiry ? { color: "#059669", fontWeight: "700" } : {}}>
                              {isPurchaseInquiry ? "PURCHASE INQUIRY" : request.requestType || "RENTAL"}
                            </span>
                            <h3>{request.propertyTitle || `Property #${request.propertyId}`}</h3>
                          </div>

                          <BookingStatusBadge status={request.status} />
                        </div>

                        <div className="owner-request-user">
                          <FiUsers />
                          <div>
                            <small>{isPurchaseInquiry ? "Inquiry from" : "Requested by"}</small>
                            <strong>{request.requesterName || `User #${request.userId}`}</strong>
                          </div>
                        </div>

                        {isPurchaseInquiry ? (
                          <div className="owner-request-dates">
                            <div>
                              <FiCalendar />
                              <span>
                                <small>Preferred Visit Date</small>
                                <strong>{formatDate(request.proposedStart)}</strong>
                              </span>
                            </div>

                            <div>
                              <FiCheckCircle style={{ color: "#059669" }} />
                              <span>
                                <small>Inquiry Type</small>
                                <strong style={{ color: "#059669" }}>Site Visit & Buy</strong>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="owner-request-dates">
                            <div>
                              <FiCalendar />
                              <span>
                                <small>{request.startTime && request.endTime ? "Booking time" : "Booking dates"}</small>
                                <strong>{formatDateRange(request.proposedStart, request.proposedEnd)}</strong>
                                {request.startTime && request.endTime && (
                                  <em>{formatTime(request.startTime)} – {formatTime(request.endTime)}</em>
                                )}
                              </span>
                            </div>

                            <div>
                              <FiUsers />
                              <span>
                                <small>Occupants</small>
                                <strong>{request.teamSize || "Not specified"}</strong>
                              </span>
                            </div>
                          </div>
                        )}

                        {request.message && (
                          <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", color: "#475569", border: "1px solid #e2e8f0" }}>
                            <strong>Note:</strong> {request.message}
                          </div>
                        )}

                        {isPending && isApprovalMode && (
                          <div className="owner-request-actions">
                            <button
                              type="button"
                              className="accept-request-button"
                              disabled={updatingRequestId === request.requestId}
                              onClick={() => handleRequestStatus(request.requestId, "APPROVED")}
                            >
                              <FiCheckCircle />
                              {isPurchaseInquiry ? "Confirm Visit" : "Approve Application"}
                            </button>

                            <button
                              type="button"
                              className="reject-request-button"
                              disabled={updatingRequestId === request.requestId}
                              onClick={() => handleRequestStatus(request.requestId, "REJECTED")}
                            >
                              <FiXCircle />
                              {isPurchaseInquiry ? "Decline Visit" : "Reject"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* PROPERTIES SECTION */}
          {(view === "dashboard" || view === "properties") && (
            <>
              <div id="properties" className="owner-properties-heading">
                <div>
                  <div className="owner-heading-title-group">
                    <h2>{view === "dashboard" ? "Recent Properties" : "Your Listings"}</h2>
                    {view === "dashboard" && recentProperties.length > 0 && (
                      <span className="owner-badge-pill featured">{recentProperties.length} Featured</span>
                    )}
                  </div>
                  {view === "properties" && (
                    <p>
                      {filteredProperties.length === properties.length
                        ? `${properties.length} properties found`
                        : `Showing ${filteredProperties.length} of ${properties.length} properties`}
                    </p>
                  )}
                </div>
                {view === "dashboard" && (
                  <Link to="/owner-properties" className="owner-view-all-link">
                    View all →
                  </Link>
                )}
              </div>

              {view === "properties" && (
                <div className="owner-filter-toolbar">
                  <div className="owner-search-box">
                    <FiSearch />
                    <input
                      type="text"
                      value={propertySearchQuery}
                      onChange={(e) => setPropertySearchQuery(e.target.value)}
                      placeholder="Search properties by title, city, or address..."
                    />
                    {propertySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPropertySearchQuery("")}
                        className="owner-search-clear"
                        title="Clear search"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>

                  <div className="owner-filter-pills">
                    <button
                      type="button"
                      className={`owner-filter-pill ${propertyFilterStatus === "ALL" ? "active" : ""}`}
                      onClick={() => setPropertyFilterStatus("ALL")}
                    >
                      All ({properties.length})
                    </button>
                    <button
                      type="button"
                      className={`owner-filter-pill ${propertyFilterStatus === "AVAILABLE" ? "active" : ""}`}
                      onClick={() => setPropertyFilterStatus("AVAILABLE")}
                    >
                      Active ({propertyStatistics.active})
                    </button>
                    <button
                      type="button"
                      className={`owner-filter-pill ${propertyFilterStatus === "UNAVAILABLE" ? "active" : ""}`}
                      onClick={() => setPropertyFilterStatus("UNAVAILABLE")}
                    >
                      Paused ({propertyStatistics.total - propertyStatistics.active})
                    </button>
                  </div>
                </div>
              )}

              {propertyError && (
                <div className="owner-request-error">
                  <FiAlertCircle />
                  <span style={{ flex: 1 }}>{propertyError}</span>
                  <button
                    type="button"
                    className="owner-error-close-btn"
                    onClick={() => setPropertyError("")}
                    title="Dismiss"
                  >
                    <FiX />
                  </button>
                </div>
              )}

              {propertiesLoading ? (
                <div className="owner-properties-empty">
                  <span>
                    <FiClock />
                  </span>
                  <h2>Loading properties...</h2>
                </div>
              ) : (view === "dashboard" ? recentProperties : filteredProperties).length === 0 ? (
                <div className="owner-properties-empty">
                  <span>
                    <FiBriefcase />
                  </span>
                  <h2>{propertySearchQuery || propertyFilterStatus !== "ALL" ? "No properties match your filter" : "No properties listed"}</h2>
                  <p style={{ color: "var(--stitch-on-surface-muted)", margin: "4px 0 16px" }}>
                    {propertySearchQuery || propertyFilterStatus !== "ALL"
                      ? "Try adjusting your search terms or reset the status filter."
                      : "Start renting out your workspace today."}
                  </p>
                  {propertySearchQuery || propertyFilterStatus !== "ALL" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPropertySearchQuery("");
                        setPropertyFilterStatus("ALL");
                      }}
                      className="owner-filter-pill active"
                      style={{ padding: "8px 18px", fontSize: "13px" }}
                    >
                      Reset Filters
                    </button>
                  ) : (
                    <Link to="/list-property">
                      <FiPlus />
                      List Your First Property
                    </Link>
                  )}
                </div>
              ) : (
                <div className="owner-properties-grid">
                  {(view === "dashboard" ? recentProperties : filteredProperties).map((property) => {
                    const propertyId = property.propertyId;
                    const propertyName = property.title || property.name || "Property";
                    const propertyType = property.propertyType || property.type || "Office";
                    const isForSale = String(property.listingType || "").toUpperCase() === "SALE" || String(property.listingType || "").toUpperCase() === "BUY";
                    const price = Number(property.price || 0);
                    const approvalStatus = property.isApproved === true ? "Approved" : "Pending";
                    const availability = String(property.status || "AVAILABLE").toUpperCase();
                    const priceMeta = formatPrice(price, property.priceUnit);

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
                          <span className="owner-card-type-chip">{propertyType}</span>
                          <span className={`owner-approval-badge ${approvalStatus.toLowerCase()}`}>
                            {approvalStatus}
                          </span>
                        </div>

                        <div className="owner-property-card-content">
                          <div className="owner-property-tags-row">
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: isForSale ? "#ecfdf5" : "#eff6ff", color: isForSale ? "#059669" : "#2563eb", border: `1px solid ${isForSale ? "#a7f3d0" : "#bfdbfe"}` }}>
                              {isForSale ? "For Sale" : "For Rent"}
                            </span>
                            {!isForSale && <BookingModeBadge mode={property.bookingMode} />}
                          </div>

                          <h3 title={propertyName}>{propertyName}</h3>

                          <p className="owner-property-location">
                            <FiMapPin />
                            {property.city || "Location not provided"}
                          </p>

                          <div className="owner-property-price">
                            <strong>{priceMeta.formatted}</strong>
                            {!isForSale && priceMeta.unitLabel && <small>{priceMeta.unitLabel}</small>}
                          </div>

                          <div className="owner-property-summary">{property.capacity ? <span>{property.capacity} occupants</span> : null}{String(property.priceUnit || "").toUpperCase() === "HOUR" && property.openingTime && property.closingTime ? (<span>{property.openingTime}–{property.closingTime}</span>) : null}</div>

                          {/* Availability Toggle */}
                          <button
                            type="button"
                            className={`availability-toggle-btn ${
                              availability === "AVAILABLE" ? "active" : "paused"
                            }`}
                            disabled={updatingPropertyId === propertyId}
                            onClick={() => handleAvailabilityChange(property)}
                            title="Click to toggle availability"
                          >
                            <span className="toggle-indicator-dot" />
                            <span>{availability === "AVAILABLE" ? "Active (Listed)" : "Paused (Unlisted)"}</span>
                            <small>{availability === "AVAILABLE" ? "Click to pause" : "Click to activate"}</small>
                          </button>

                          <div className="owner-property-actions">
                            <Link
                              to={`/property/${propertyId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-property-button"
                              title="Preview public listing as buyer/tenant"
                            >
                              <FiExternalLink />
                              View
                            </Link>

                            <Link to={`/edit-property/${propertyId}`} className="edit-property-button">
                              <FiEdit3 />
                              Edit Details
                            </Link>

                            <button
                              type="button"
                              className="delete-property-button"
                              disabled={updatingPropertyId === propertyId}
                              onClick={() => handleDelete(propertyId, propertyName)}
                              title="Delete property"
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
              )}
            </>
          )}
        </section>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div
          className="owner-modal-overlay"
          onClick={() => {
            if (updatingRequestId === null && updatingPropertyId === null) {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            className="owner-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="owner-modal-header">
              <h3>{confirmModal.title}</h3>
              <button
                type="button"
                className="owner-modal-close-btn"
                disabled={updatingRequestId !== null || updatingPropertyId !== null}
                onClick={() => {
                  if (updatingRequestId === null && updatingPropertyId === null) {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  }
                }}
              >
                <FiX />
              </button>
            </div>
            <p className="owner-modal-body">{confirmModal.message}</p>
            <div className="owner-modal-actions">
              <button
                type="button"
                className="owner-modal-cancel-btn"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`owner-modal-confirm-btn ${confirmModal.isDestructive ? "destructive" : "primary"}`}
                disabled={updatingRequestId !== null || updatingPropertyId !== null}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default OwnerDashboard;