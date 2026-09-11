import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  cancelBookingRequest,
  getMyBookingRequests,
} from "../services/bookingService";
import { getPropertyById } from "../services/propertyService";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";
import BookingStatusBadge from "../components/booking/BookingStatusBadge";
import "../css/bookings.css";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function getMessageValue(message, fieldName) {
  if (!message) return "";
  const field = message
    .split("|")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(`${fieldName.toLowerCase()}:`));

  if (!field) return "";
  return field.substring(field.indexOf(":") + 1).trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "Not selected";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [payingId, setPayingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let componentActive = true;

    const loadBookings = async () => {
      const savedUser = getStoredUser();
      const userId = savedUser?.userId || savedUser?.id || localStorage.getItem("userId");

      if (!userId) {
        setError("Your login session is invalid. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getMyBookingRequests(Number(userId));
        const requests = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        const formattedBookings = await Promise.all(
          requests.map(async (request) => {
            let office = null;

            try {
              office = await getPropertyById(request.propertyId);
            } catch (err) {
              console.error(`Unable to load property ${request.propertyId}:`, err);
            }

            const teamSize = getMessageValue(request.message, "Team");
            const savedDuration = getMessageValue(request.message, "Duration");

            return {
              id: request.requestId,
              propertyId: request.propertyId,
              officeName: office?.title || office?.name || `Property #${request.propertyId}`,
              officeType: office?.propertyType || office?.type || "Property",
              city: office?.city || "Location unavailable",
              image:
                office?.image ||
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
              price: Number(office?.price || 0),
              priceUnit: office?.priceUnit || "MONTH",
              bookingDate: request.proposedStart,
              endDate: request.proposedEnd,
              duration: savedDuration || "1 Month",
              teamSize,
              rawStatus: request.status,
              message: request.message,
            };
          })
        );

        if (componentActive) {
          setBookings(formattedBookings);
        }
      } catch (requestError) {
        console.error("Unable to load bookings:", requestError);
        if (!componentActive) return;
        setError("Unable to load your bookings. Please try again.");
      } finally {
        if (componentActive) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      componentActive = false;
    };
  }, []);

  const handlePayment = async (booking) => {
    try {
      setPayingId(booking.id);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Unable to load payment gateway.");
        return;
      }

      const order = await createPaymentOrder(booking.id);
      const user = getStoredUser() || {};

      const options = {
        key: order.keyId || order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SpacesHub",
        description: booking.officeName,
        order_id: order.orderId || order.id,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setBookings((prev) =>
              prev.map((item) => (item.id === booking.id ? { ...item, rawStatus: "CONFIRMED" } : item))
            );
          } catch (verifyErr) {
            alert("Payment verification failed.");
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (orderErr) {
      alert("Unable to start payment.");
    } finally {
      setPayingId(null);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;

    try {
      setCancellingId(bookingId);
      await cancelBookingRequest(bookingId);

      setBookings((prev) =>
        prev.map((item) => (item.id === bookingId ? { ...item, rawStatus: "CANCELLED" } : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Unable to cancel this booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const isCancellable = (booking) => {
    const status = String(booking.rawStatus || "").toUpperCase();
    if (["CANCELLED", "EXPIRED", "REJECTED"].includes(status)) return false;

    const todayStr = new Date().toISOString().split("T")[0];
    if (!booking.bookingDate) return true;

    return booking.bookingDate >= todayStr;
  };

  // Filter Bookings by Tab
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((b) => {
    const status = String(b.rawStatus || "").toUpperCase();
    if (activeTab === "UPCOMING") {
      return (status === "CONFIRMED" || status === "APPROVED") && b.bookingDate > todayStr;
    }
    if (activeTab === "CURRENT") {
      return (status === "CONFIRMED" || status === "APPROVED") && b.bookingDate <= todayStr && b.endDate >= todayStr;
    }
    if (activeTab === "PAST") {
      return status === "CONFIRMED" && b.endDate < todayStr;
    }
    if (activeTab === "CANCELLED") {
      return status === "CANCELLED";
    }
    if (activeTab === "EXPIRED") {
      return status === "EXPIRED";
    }
    return true;
  });

  return (
    <main className="bookings-page">
      <section className="bookings-header">
        <div className="container">
          <p>MY APPLICATIONS</p>
          <h1>My Rental Applications</h1>
          <span>View and manage all your property rental applications.</span>
        </div>
      </section>

      <section className="container bookings-content">
        {/* Categorized Filter Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
          {["ALL", "UPCOMING", "CURRENT", "PAST", "CANCELLED", "EXPIRED"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "600",
                border: "none",
                background: activeTab === tab ? "#2563eb" : "#f1f5f9",
                color: activeTab === tab ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="bookings-error">
            <FiAlertCircle />
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-bookings">
            <span>
              <FiClock />
            </span>
            <h2>Loading bookings...</h2>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-bookings">
            <span>
              <FiCalendar />
            </span>
            <h2>No bookings found</h2>
            <p>Explore our available rental properties and send your rental application.</p>
            <Link to="/offices" className="primary-btn">
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const statusUpper = String(booking.rawStatus || "").toUpperCase();
              const canPay = statusUpper === "PENDING_PAYMENT" || statusUpper === "APPROVED";
              const cancellable = isCancellable(booking);

              return (
                <article className="booking-card" key={booking.id}>
                  <img src={booking.image} alt={booking.officeName} />

                  <div className="booking-card-content">
                    <div className="booking-card-heading">
                      <div>
                        <span className="booking-office-type">{booking.officeType}</span>
                        <h2>{booking.officeName}</h2>
                        <p>
                          <FiMapPin />
                          {booking.city}
                        </p>
                      </div>

                      <BookingStatusBadge status={booking.rawStatus} />
                    </div>

                    <div className="booking-card-information">
                      <div>
                        <FiCalendar />
                        <span>
                          <small>Start Date</small>
                          <strong>{formatDate(booking.bookingDate)}</strong>
                        </span>
                      </div>

                      <div>
                        <FiClock />
                        <span>
                          <small>Duration</small>
                          <strong>{booking.duration}</strong>
                        </span>
                      </div>

                      <div>
                        <FiUsers />
                        <span>
                          <small>Occupants</small>
                          <strong>{booking.teamSize ? `${booking.teamSize} people` : "1 person"}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="booking-card-bottom">
                      <div>
                        <small>Price Rate</small>
                        <strong>
                          ₹{booking.price.toLocaleString("en-IN")}/{String(booking.priceUnit).toLowerCase()}
                        </strong>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {canPay && (
                          <button
                            type="button"
                            className="cancel-booking-button"
                            style={{ background: "#2563eb" }}
                            disabled={payingId === booking.id}
                            onClick={() => handlePayment(booking)}
                          >
                            {payingId === booking.id ? "Opening..." : "Pay Now"}
                          </button>
                        )}

                        {cancellable && (
                          <button
                            type="button"
                            className="cancel-booking-button"
                            disabled={cancellingId === booking.id}
                            onClick={() => cancelBooking(booking.id)}
                          >
                            <FiXCircle />
                            {cancellingId === booking.id ? "Cancelling..." : "Cancel Request"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyBookings;