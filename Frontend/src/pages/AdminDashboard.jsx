import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import {
  approveProperty,
  deletePropertyAsAdmin,
  getAllPropertiesForAdmin,
  rejectProperty,
} from "../services/adminService";
import "../css/adminDashboard.css";
const fallbackImage =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85";

function getPropertyId(property) {
  if (!property) return null;
  return property.propertyId ?? property.id;
}

function getApprovalStatus(property) {
  if (!property) return "Pending";

  const approvalStatus = String(
    property.approvalStatus || ""
  ).trim().toUpperCase();

  if (approvalStatus === "APPROVED" || property.isApproved === true) {
    return "Approved";
  }

  if (approvalStatus === "REJECTED" || String(property.status || "").trim().toUpperCase() === "REJECTED") {
    return "Rejected";
  }

  return "Pending";
}

function formatPropertyType(propertyType = "") {
  return propertyType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (!error.response) {
    return "Cannot connect to the backend. Make sure Spring Boot is running.";
  }

  return "Unable to complete the request. Please try again.";
}

function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadProperties = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError("");

        const propertyResponse = await getAllPropertiesForAdmin();
        setProperties(Array.isArray(propertyResponse) ? propertyResponse : []);
      } catch (requestError) {
        console.error("Admin property loading error:", requestError);
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const statistics = useMemo(() => {
    const approved = properties.filter(
      (property) => getApprovalStatus(property) === "Approved"
    ).length;

    const pending = properties.filter(
      (property) => getApprovalStatus(property) === "Pending"
    ).length;

    const rejected = properties.filter(
      (property) => getApprovalStatus(property) === "Rejected"
    ).length;

    return {
      total: properties.length,
      approved,
      pending,
      rejected,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return properties.filter((property) => {
      if (!property) return false;
      const approvalStatus = getApprovalStatus(property);

      const matchesStatus =
        statusFilter === "All" || approvalStatus === statusFilter;

      const propType = String(
        property.propertyType || property.type || ""
      );

      const matchesType =
        typeFilter === "All" ||
        propType.toLowerCase() === typeFilter.toLowerCase();

      const matchesSearch =
        !searchText ||
        property.title?.toLowerCase().includes(searchText) ||
        property.city?.toLowerCase().includes(searchText) ||
        propType.toLowerCase().includes(searchText) ||
        String(property.ownerId || "").includes(searchText);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [properties, search, statusFilter, typeFilter]);

  const executePropertyAction = async (property, confirmText, actionFn, successText, isDelete = false) => {
    const propertyId = getPropertyId(property);
    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      setActionId(propertyId);
      setError("");
      setSuccessMessage("");

      await actionFn(propertyId);

      if (isDelete) {
        setProperties((previousProperties) =>
          previousProperties.filter(
            (item) => getPropertyId(item) !== propertyId
          )
        );
      } else {
        await loadProperties(false);
      }

      setSuccessMessage(successText);
    } catch (requestError) {
      console.error("Property action error:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = (property) =>
    executePropertyAction(
      property,
      `Approve "${property.title}"?`,
      approveProperty,
      `${property.title} was approved successfully.`
    );

  const handleReject = (property) =>
    executePropertyAction(
      property,
      `Reject "${property.title}"?`,
      rejectProperty,
      `${property.title} was rejected.`
    );

  const handleDelete = (property) =>
    executePropertyAction(
      property,
      `Permanently delete "${property.title}"? This action cannot be undone.`,
      deletePropertyAsAdmin,
      `${property.title} was deleted successfully.`,
      true
    );

  return (
    <main className="admin-dashboard-page">
      <section className="admin-dashboard-hero">
        <div className="container admin-dashboard-hero-content">
          <div>
            <span className="admin-dashboard-label">
              <FiShield />
              ADMIN CONTROL PANEL
            </span>

            <h1>Property Management</h1>

            <p>
              Review, approve and manage all listed rental properties.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadProperties()}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh Data
          </button>
        </div>
      </section>

      <section className="container admin-dashboard-content">
        <div className="admin-statistics-grid">
          <article className="admin-stat-card">
            <span className="admin-stat-icon total">
              <FiBriefcase />
            </span>

            <div>
              <p>Total Properties</p>
              <strong>{statistics.total}</strong>
            </div>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-icon pending">
              <FiClock />
            </span>

            <div>
              <p>Pending Approval</p>
              <strong>{statistics.pending}</strong>
            </div>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-icon approved">
              <FiCheckCircle />
            </span>

            <div>
              <p>Approved</p>
              <strong>{statistics.approved}</strong>
            </div>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-icon rejected">
              <FiXCircle />
            </span>

            <div>
              <p>Rejected</p>
              <strong>{statistics.rejected}</strong>
            </div>
          </article>
        </div>

        {error && (
          <div className="admin-message admin-error-message">
            <FiXCircle />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="admin-message admin-success-message">
            <FiCheckCircle />
            {successMessage}
          </div>
        )}

        <div className="admin-property-section">
          <div className="admin-section-heading">
            <div>
              <h2>All Properties</h2>

              <p>
                {filteredProperties.length} properties found
              </p>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-box">
              <FiSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search property, city or owner ID..."
              />
            </div>

            <select
              className="admin-status-filter"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <option value="All">All Types</option>
              <option value="Office">Office</option>
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
            </select>

            <select
              className="admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <FiRefreshCw className="admin-loading-icon" />

              <h2>Loading properties...</h2>

              <p>Please wait while the data is loading.</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="admin-empty-state">
              <FiBriefcase />

              <h2>No properties found</h2>

              <p>
                Try another search or filter.
              </p>
            </div>
          ) : (
            <div className="admin-properties-grid">
              {filteredProperties.map((property) => {
                const propertyId =
                  getPropertyId(property);

                const approvalStatus =
                  getApprovalStatus(property);

                const approvalClass =
                  approvalStatus.toLowerCase();

                const isProcessing =
                  actionId === propertyId;

                const propType =
                  property.propertyType ||
                  property.type ||
                  "Office";

                return (
                  <article
                    className="admin-property-card"
                    key={propertyId}
                  >
                    <div className="admin-property-image">
                      <img
                        src={property.image || fallbackImage}
                        alt={property.title}
                        onError={(event) => {
                          event.currentTarget.src =
                            fallbackImage;
                        }}
                      />

                      <span
                        className={`admin-approval-badge ${approvalClass}`}
                      >
                        {approvalStatus === "Approved" && (
                          <FiCheckCircle />
                        )}

                        {approvalStatus === "Pending" && (
                          <FiClock />
                        )}

                        {approvalStatus === "Rejected" && (
                          <FiXCircle />
                        )}

                        {approvalStatus}
                      </span>
                    </div>

                    <div className="admin-property-card-content">
                      <span className="admin-property-type">
                        {formatPropertyType(propType)}
                      </span>

                      <h3>{property.title}</h3>

                      <p className="admin-property-location">
                        <FiMapPin />
                        {property.city || "Location unavailable"}
                      </p>

                      <div className="admin-property-details">
                        <div>
                          <span>Owner ID</span>
                          <strong>
                            #{property.ownerId || "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Area</span>
                          <strong>
                            {property.areaSqft || property.area || 0} sq.ft.
                          </strong>
                        </div>

                        <div>
                          <span>Listing</span>
                          <strong>
                            {property.listingType || "RENT"}
                          </strong>
                        </div>

                        <div>
                          <span>Availability</span>
                          <strong>
                            {property.status || "AVAILABLE"}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-property-price">
                        <span>
                          {property.listingType === "SALE" || property.listingType === "BUY"
                            ? "Asking Price"
                            : propType === "Office"
                            ? "Rent Amount"
                            : "Monthly Rent"}
                        </span>

                        <strong>
                          ₹
                          {Number(
                            property.price || 0
                          ).toLocaleString("en-IN")}

                          {property.listingType !== "SALE" && property.listingType !== "BUY" && (
                            <small>
                              /
                              {String(
                                property.priceUnit || "MONTH"
                              ).toLowerCase()}
                            </small>
                          )}
                        </strong>
                      </div>

                      <div className="admin-property-actions">
                        {approvalStatus !== "Approved" && (
                          <button
                            type="button"
                            className="admin-approve-button"
                            onClick={() =>
                              handleApprove(property)
                            }
                            disabled={isProcessing}
                          >
                            <FiCheckCircle />
                            Approve
                          </button>
                        )}

                        {approvalStatus !== "Rejected" && (
                          <button
                            type="button"
                            className="admin-reject-button"
                            onClick={() =>
                              handleReject(property)
                            }
                            disabled={isProcessing}
                          >
                            <FiXCircle />
                            Reject
                          </button>
                        )}

                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() =>
                            handleDelete(property)
                          }
                          disabled={isProcessing}
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
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;