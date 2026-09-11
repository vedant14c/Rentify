import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMapPin,
  FiMaximize2,
  FiPhone,
  FiShield,
  FiStar,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import {
  getAllBookingRequestsForAdmin,
  getAllPropertiesForAdmin,
} from "../services/adminService";
import { getReviewsByPropertyId } from "../services/reviewService";
import "../css/adminUsers.css";

function getUserId(user) {
  return user?.userId ?? user?.id;
}

function getUserRole(user) {
  return String(user?.role || "USER").toUpperCase();
}

function getIsActive(user) {
  return user?.isActive !== false;
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function UserDetailsModal({ user, onClose, onStatusChange, onRoleChange, currentUserId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ownerProperties, setOwnerProperties] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [ownerReviews, setOwnerReviews] = useState([]);

  const userId = getUserId(user);
  const role = getUserRole(user);
  const isOwner = role === "OWNER";
  const isUser = role === "USER";
  const isActive = getIsActive(user);

  useEffect(() => {
    let active = true;

    const loadUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const [allProps, allReqs] = await Promise.all([
          getAllPropertiesForAdmin(),
          getAllBookingRequestsForAdmin("RENTAL"),
        ]);

        if (!active) return;

        const propList = Array.isArray(allProps) ? allProps : [];
        const reqList = Array.isArray(allReqs) ? allReqs : [];

        if (isOwner) {
          const userProps = propList.filter(
            (p) => Number(p.ownerId) === Number(userId)
          );
          setOwnerProperties(userProps);

          const ownerPropIds = new Set(
            userProps.map((p) => Number(p.propertyId ?? p.id))
          );

          const ownerApps = reqList.filter((r) =>
            ownerPropIds.has(Number(r.propertyId))
          );
          setUserApplications(ownerApps);

          // Fetch reviews for owner properties
          const reviewPromises = userProps.map(async (p) => {
            const pId = Number(p.propertyId ?? p.id);
            try {
              const revs = await getReviewsByPropertyId(pId);
              return Array.isArray(revs) ? revs : [];
            } catch {
              return [];
            }
          });

          const reviewsNested = await Promise.all(reviewPromises);
          if (active) {
            setOwnerReviews(reviewsNested.flat());
          }
        } else {
          // Regular user / Tenant
          const tenantApps = reqList.filter(
            (r) => Number(r.userId) === Number(userId)
          );
          setUserApplications(tenantApps);
        }
      } catch (err) {
        console.error("Error loading user details:", err);
        if (active) {
          setError("Failed to load full user details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      active = false;
    };
  }, [userId, isOwner, role]);

  if (!user) return null;

  const totalReviewsCount = ownerReviews.length;
  const averageRating =
    totalReviewsCount > 0
      ? (
          ownerReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          totalReviewsCount
        ).toFixed(1)
      : "N/A";

  const acceptedApplications = userApplications.filter(
    (a) => String(a.status).toLowerCase() === "accepted"
  );
  const pendingApplications = userApplications.filter(
    (a) => String(a.status).toLowerCase() === "pending"
  );

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div
        className="user-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="user-modal-header">
          <div className="user-modal-title-group">
            <div className={`user-modal-avatar ${role.toLowerCase()}`}>
              <FiUser />
            </div>

            <div>
              <h2>{user.name || "User Details"}</h2>
              <span className={`user-modal-badge ${role.toLowerCase()}`}>
                {role}
              </span>
              <span className={`user-modal-status ${isActive ? "active" : "inactive"}`}>
                {isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="user-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </header>

        <nav className="user-modal-tabs">
          <button
            type="button"
            className={`user-modal-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiUser /> Account Overview
          </button>

          {isOwner && (
            <button
              type="button"
              className={`user-modal-tab ${activeTab === "properties" ? "active" : ""}`}
              onClick={() => setActiveTab("properties")}
            >
              <FiBriefcase /> Properties Listed ({ownerProperties.length})
            </button>
          )}

          <button
            type="button"
            className={`user-modal-tab ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            <FiCalendar />
            {isOwner ? `Rental Applications (${userApplications.length})` : `Application History (${userApplications.length})`}
          </button>

          {isOwner && (
            <button
              type="button"
              className={`user-modal-tab ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <FiStar /> Reviews & Ratings ({ownerReviews.length})
            </button>
          )}
        </nav>

        <div className="user-modal-body">
          {error && (
            <div className="admin-users-error">
              <FiAlertCircle />
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="user-details-overview">
              <div className="user-details-grid">
                <div className="user-detail-card">
                  <h3>Personal Information</h3>
                  <div className="user-detail-item">
                    <FiUser />
                    <div>
                      <small>Full Name</small>
                      <strong>{user.name || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="user-detail-item">
                    <FiMail />
                    <div>
                      <small>Email Address</small>
                      <strong>{user.email || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="user-detail-item">
                    <FiPhone />
                    <div>
                      <small>Phone Number</small>
                      <strong>{user.phone || "Not provided"}</strong>
                    </div>
                  </div>

                  <div className="user-detail-item">
                    <FiShield />
                    <div>
                      <small>User ID & Role</small>
                      <strong>#{userId} — {role}</strong>
                    </div>
                  </div>

                  <div className="user-detail-item">
                    <FiClock />
                    <div>
                      <small>Account Status</small>
                      <strong className={isActive ? "text-green" : "text-red"}>
                        {isActive ? "Active" : "Inactive"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="user-detail-card">
                  <h3>Account Statistics</h3>

                  {isOwner ? (
                    <div className="user-stats-summary">
                      <div className="user-stat-box">
                        <span className="stat-num">{ownerProperties.length}</span>
                        <span className="stat-lbl">Properties Listed</span>
                      </div>

                      <div className="user-stat-box">
                        <span className="stat-num">{userApplications.length}</span>
                        <span className="stat-lbl">Applications Received</span>
                      </div>

                      <div className="user-stat-box">
                        <span className="stat-num">{acceptedApplications.length}</span>
                        <span className="stat-lbl">Active Rentals</span>
                      </div>

                      <div className="user-stat-box">
                        <span className="stat-num">{averageRating} ⭐</span>
                        <span className="stat-lbl">Average Rating ({totalReviewsCount})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="user-stats-summary">
                      <div className="user-stat-box">
                        <span className="stat-num">{userApplications.length}</span>
                        <span className="stat-lbl">Total Applications</span>
                      </div>

                      <div className="user-stat-box">
                        <span className="stat-num">{acceptedApplications.length}</span>
                        <span className="stat-lbl">Confirmed Rentals</span>
                      </div>

                      <div className="user-stat-box">
                        <span className="stat-num">{pendingApplications.length}</span>
                        <span className="stat-lbl">Pending Applications</span>
                      </div>
                    </div>
                  )}

                  <div className="user-modal-actions-box">
                    <h4>Account Actions</h4>

                    {userId === currentUserId ? (
                      <p className="current-user-notice">
                        This is your current Administrator account.
                      </p>
                    ) : (
                      <div className="user-action-buttons-inline">
                        <button
                          type="button"
                          className={`admin-user-action-button ${isActive ? "deactivate" : "activate"}`}
                          onClick={() => onStatusChange(user)}
                        >
                          {isActive ? <FiXCircle /> : <FiCheckCircle />}
                          {isActive ? "Deactivate Account" : "Activate Account"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "properties" && isOwner && (
            <div className="user-modal-properties">
              {ownerProperties.length === 0 ? (
                <div className="admin-users-empty">
                  <FiBriefcase />
                  <h3>No properties listed</h3>
                  <p>This owner has not created any property listings yet.</p>
                </div>
              ) : (
                <div className="user-modal-table-wrapper">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Property Title</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Monthly Rent</th>
                        <th>Status</th>
                        <th>Approval</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerProperties.map((prop) => (
                        <tr key={prop.propertyId ?? prop.id}>
                          <td>
                            <strong>{prop.title || prop.name}</strong>
                          </td>
                          <td>{prop.propertyType || prop.type || "Office"}</td>
                          <td>
                            <FiMapPin /> {prop.city}
                          </td>
                          <td>₹{Number(prop.price || 0).toLocaleString("en-IN")}/mo</td>
                          <td>
                            <span className={`admin-user-status ${String(prop.status || "AVAILABLE").toLowerCase() === "available" ? "active" : "inactive"}`}>
                              {prop.status || "AVAILABLE"}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-user-status ${prop.isApproved ? "active" : "inactive"}`}>
                              {prop.isApproved ? "Approved" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "applications" && (
            <div className="user-modal-applications">
              {userApplications.length === 0 ? (
                <div className="admin-users-empty">
                  <FiCalendar />
                  <h3>No rental applications found</h3>
                  <p>No application history recorded for this user.</p>
                </div>
              ) : (
                <div className="user-modal-table-wrapper">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Property ID</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Requested Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userApplications.map((app) => (
                        <tr key={app.requestId}>
                          <td>#{app.requestId}</td>
                          <td>#{app.propertyId}</td>
                          <td>{formatDate(app.proposedStart)}</td>
                          <td>{formatDate(app.proposedEnd)}</td>
                          <td>
                            <span className={`admin-user-status ${String(app.status || "pending").toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>{formatFullDate(app.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && isOwner && (
            <div className="user-modal-reviews">
              {ownerReviews.length === 0 ? (
                <div className="admin-users-empty">
                  <FiStar />
                  <h3>No reviews received</h3>
                  <p>No reviews have been submitted for this owner's properties yet.</p>
                </div>
              ) : (
                <div className="user-reviews-list">
                  {ownerReviews.map((rev) => (
                    <article key={rev.id || rev.reviewId} className="user-review-card">
                      <div className="user-review-header">
                        <span className="user-review-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={star <= Number(rev.rating) ? "active" : ""}
                            />
                          ))}
                          <strong>{rev.rating}/5</strong>
                        </span>
                        <small>{formatFullDate(rev.createdAt)}</small>
                      </div>
                      <p>{rev.comment}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal;
