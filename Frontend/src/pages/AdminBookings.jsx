import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import {
  getAllBookingRequestsForAdmin,
  getAllPropertiesForAdmin,
  getAllUsersForAdmin,
  updateBookingStatusAsAdmin,
} from "../services/adminService";
import "../css/adminBookings.css";

function getRequestId(request) {
  return request.requestId ?? request.id;
}

function getPropertyId(property) {
  return property.propertyId ?? property.id;
}

function getUserId(user) {
  return user.userId ?? user.id;
}

function getStatus(request) {
  return String(
    request.status || "pending"
  ).toLowerCase();
}

function formatDate(date) {
  if (!date) {
    return "Not provided";
  }

  return new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
}

function formatCreatedDate(date) {
  if (!date) {
    return "Not available";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        bookingResponse,
        propertyResponse,
        userResponse,
      ] = await Promise.all([
        getAllBookingRequestsForAdmin("RENTAL"),
        getAllPropertiesForAdmin(),
        getAllUsersForAdmin(),
      ]);

      const bookingList = Array.isArray(
        bookingResponse
      )
        ? bookingResponse
        : [];

      const propertyList = Array.isArray(
        propertyResponse
      )
        ? propertyResponse
        : [];

      const userList = Array.isArray(userResponse)
        ? userResponse
        : [];

      console.log("[FRONTEND LOG] AdminBookings raw propertyList:", propertyList);
      console.log("[FRONTEND LOG] AdminBookings raw bookingList:", bookingList);

      const propertyMap = new Map(
        propertyList.map((property) => [
          Number(getPropertyId(property)),
          property,
        ])
      );

      const userMap = new Map(
        userList.map((user) => [
          Number(getUserId(user)),
          user,
        ])
      );

      const enrichedBookings = bookingList.map(
        (booking) => ({
          ...booking,

          property:
            propertyMap.get(
              Number(booking.propertyId)
            ) || null,

          requester:
            userMap.get(
              Number(booking.userId)
            ) || null,
        })
      );

      setBookings(enrichedBookings);
    } catch (requestError) {
      console.error(
        "Admin bookings loading error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const statistics = useMemo(() => {
    return {
      total: bookings.length,

      pending: bookings.filter(
        (booking) =>
          getStatus(booking) === "pending"
      ).length,

      accepted: bookings.filter(
        (booking) =>
          getStatus(booking) === "accepted"
      ).length,

      rejected: bookings.filter(
        (booking) =>
          getStatus(booking) === "rejected"
      ).length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return bookings.filter((booking) => {
      const status = getStatus(booking);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const matchesSearch =
        !searchText ||
        String(booking.property?.title || "")
          .toLowerCase()
          .includes(searchText) ||
        String(booking.requester?.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(booking.requester?.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(booking.property?.city || "")
          .toLowerCase()
          .includes(searchText) ||
        String(getRequestId(booking)).includes(
          searchText
        );

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const handleStatusUpdate = async (
    booking,
    newStatus
  ) => {
    const requestId = getRequestId(booking);

    const confirmed = window.confirm(
      `${newStatus === "accepted" ? "Accept" : "Reject"} booking request #${requestId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(requestId);
      setError("");
      setSuccessMessage("");

      const updatedBooking =
        await updateBookingStatusAsAdmin(
          requestId,
          newStatus
        );

      setBookings((previousBookings) =>
        previousBookings.map((item) =>
          getRequestId(item) === requestId
            ? {
                ...item,
                ...updatedBooking,
                status:
                  updatedBooking?.status ||
                  newStatus,
              }
            : item
        )
      );

      setSuccessMessage(
        `Booking request #${requestId} was ${newStatus}.`
      );
    } catch (requestError) {
      console.error(
        "Admin booking update error:",
        requestError
      );

      setError(getErrorMessage(requestError));
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="admin-bookings-page">
      <section className="admin-bookings-hero">
        <div className="container admin-bookings-hero-content">
          <div>
            <Link
              to="/admin-dashboard"
              className="admin-bookings-back-link"
            >
              <FiArrowLeft />
              Property Management
            </Link>

            <span className="admin-bookings-label">
              <FiShield />
              ADMIN CONTROL PANEL
            </span>

            <h1>Rental Application Management</h1>

            <p>
              View and manage all property rental applications.
            </p>
          </div>

          <button
            type="button"
            className="admin-bookings-refresh-button"
            onClick={loadBookings}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh Applications
          </button>
        </div>
      </section>

      <section className="container admin-bookings-content">
        <div className="admin-booking-statistics">
          <article>
            <span className="admin-booking-stat-icon total">
              <FiBriefcase />
            </span>

            <div>
              <p>Total Requests</p>
              <strong>{statistics.total}</strong>
            </div>
          </article>

          <article>
            <span className="admin-booking-stat-icon pending">
              <FiClock />
            </span>

            <div>
              <p>Pending</p>
              <strong>{statistics.pending}</strong>
            </div>
          </article>

          <article>
            <span className="admin-booking-stat-icon accepted">
              <FiCheckCircle />
            </span>

            <div>
              <p>Accepted</p>
              <strong>{statistics.accepted}</strong>
            </div>
          </article>

          <article>
            <span className="admin-booking-stat-icon rejected">
              <FiXCircle />
            </span>

            <div>
              <p>Rejected</p>
              <strong>{statistics.rejected}</strong>
            </div>
          </article>
        </div>

        {error && (
          <div className="admin-bookings-message error">
            <FiXCircle />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="admin-bookings-message success">
            <FiCheckCircle />
            {successMessage}
          </div>
        )}

        <div className="admin-bookings-section">
          <div className="admin-bookings-heading">
            <div>
              <h2>All Booking Requests</h2>

              <p>
                {filteredBookings.length} requests found
              </p>
            </div>
          </div>

          <div className="admin-bookings-toolbar">
            <div className="admin-bookings-search">
              <FiSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search property, user, city or request ID..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="accepted">
                Accepted
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          {loading ? (
            <div className="admin-bookings-empty">
              <FiRefreshCw className="admin-bookings-loading-icon" />

              <h2>Loading requests...</h2>

              <p>
                Please wait while booking requests
                are loading.
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="admin-bookings-empty">
              <FiCalendar />

              <h2>No booking requests found</h2>

              <p>
                Try another search or status filter.
              </p>
            </div>
          ) : (
            <div className="admin-bookings-grid">
              {filteredBookings.map((booking) => {
                const requestId =
                  getRequestId(booking);

                const status = getStatus(booking);

                const propertyTitle =
                  booking.property?.title ||
                  `Property #${booking.propertyId}`;

                const requesterName =
                  booking.requester?.name ||
                  `User #${booking.userId}`;

                const isProcessing =
                  actionId === requestId;

                return (
                  <article
                    className="admin-booking-card"
                    key={requestId}
                  >
                    <div className="admin-booking-card-header">
                      <div>
                        <span className="admin-request-number">
                          REQUEST #{requestId}
                        </span>

                        <h3>{propertyTitle}</h3>

                        <p>
                          <FiMapPin />
                          {booking.property?.city ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <span
                        className={`admin-booking-status ${status}`}
                      >
                        {status === "pending" && (
                          <FiClock />
                        )}

                        {status === "accepted" && (
                          <FiCheckCircle />
                        )}

                        {(status === "rejected" ||
                          status === "cancelled") && (
                          <FiXCircle />
                        )}

                        {status}
                      </span>
                    </div>

                    <div className="admin-requester-details">
                      <span className="admin-requester-icon">
                        <FiUser />
                      </span>

                      <div>
                        <small>Requested by</small>

                        <strong>
                          {requesterName}
                        </strong>

                        <span>
                          <FiMail />
                          {booking.requester?.email ||
                            "Email unavailable"}
                        </span>
                      </div>
                    </div>

                    <div className="admin-booking-information">
                      <div>
                        <FiCalendar />

                        <span>
                          <small>Start date</small>
                          <strong>
                            {formatDate(
                              booking.proposedStart
                            )}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FiCalendar />

                        <span>
                          <small>End date</small>
                          <strong>
                            {formatDate(
                              booking.proposedEnd
                            )}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FiBriefcase />

                        <span>
                          <small>Request type</small>
                          <strong>
                            {booking.requestType ||
                              "RENTAL"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="admin-booking-message-box">
                        <small>Customer message</small>
                        <p>{booking.message}</p>
                      </div>
                    )}

                    <div className="admin-booking-created">
                      Created:{" "}
                      {formatCreatedDate(
                        booking.createdAt
                      )}
                    </div>

                    {status === "pending" && (
                      <div className="admin-booking-actions">
                        <button
                          type="button"
                          className="admin-booking-accept-button"
                          onClick={() =>
                            handleStatusUpdate(
                              booking,
                              "accepted"
                            )
                          }
                          disabled={isProcessing}
                        >
                          <FiCheckCircle />

                          {isProcessing
                            ? "Updating..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          className="admin-booking-reject-button"
                          onClick={() =>
                            handleStatusUpdate(
                              booking,
                              "rejected"
                            )
                          }
                          disabled={isProcessing}
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
        </div>
      </section>
    </main>
  );
}

export default AdminBookings;