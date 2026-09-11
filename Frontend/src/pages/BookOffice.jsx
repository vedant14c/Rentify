import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiHome,
  FiLoader,
  FiMail,
  FiPhone,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { createBookingRequest, getPropertyAvailability } from "../services/bookingService";
import { getPropertyById } from "../services/propertyService";
import { processRazorpayPayment } from "../utils/payRazorpay";
import { AvailabilityCalendar } from "../components/booking/AvailabilityCalendar";
import { BookingSummaryCard } from "../components/booking/BookingSummaryCard";
import {
  calculateDurationPreview,
  calculateTotalPricePreview,
  formatInputDate,
} from "../utils/bookingUtils";
import "../css/booking.css";

function getStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function extractAvailabilityData(availabilityRes) {
  if (!availabilityRes) return { bookedDateRanges: [] };
  if (availabilityRes.data && availabilityRes.data.bookedDateRanges) {
    return availabilityRes.data;
  }
  return availabilityRes;
}

function BookOffice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const savedUser = getStoredUser();

  const [office, setOffice] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingPending, setPayingPending] = useState(false);
  const [confirmedRequestId, setConfirmedRequestId] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: savedUser?.name || "",
    email: savedUser?.email || "",
    phone: savedUser?.phone || "",
    bookingDate: "",
    endDate: "",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    teamSize: "1",
    residents: "1",
    requirements: "",
  });

  const minimumDate = formatInputDate(new Date());

  const fetchAvailabilityData = async () => {
    try {
      const rawRes = await getPropertyAvailability(Number(id));
      const availData = extractAvailabilityData(rawRes);
      setAvailability(availData);
      const ranges = availData?.bookedDateRanges || (Array.isArray(availData) ? availData : []);
      setBookedRanges(ranges);
    } catch (err) {
      console.warn("Unable to fetch availability:", err);
    }
  };

  useEffect(() => {
    let componentActive = true;

    const loadData = async () => {
      try {
        setPageLoading(true);
        setPageError("");

        const [officeRes, availabilityRes] = await Promise.all([
          getPropertyById(Number(id)),
          getPropertyAvailability(Number(id)).catch(() => ({ bookedDateRanges: [] })),
        ]);

        if (componentActive) {
          setOffice(officeRes);
          const availData = extractAvailabilityData(availabilityRes);
          setAvailability(availData);
          const ranges = availData?.bookedDateRanges || (Array.isArray(availData) ? availData : []);
          setBookedRanges(ranges);
        }
      } catch (requestError) {
        console.error("Unable to load property details:", requestError);
        if (componentActive) {
          if (!requestError.response) {
            setPageError("Cannot connect to the backend. Make sure Spring Boot is running.");
          } else {
            setPageError(requestError.response?.data?.message || "The selected property is unavailable.");
          }
        }
      } finally {
        if (componentActive) {
          setPageLoading(false);
        }
      }
    };

    loadData();

    return () => {
      componentActive = false;
    };
  }, [id]);

  const propertyTypeNormalized = String(office?.propertyType || office?.type || "Office").trim().toLowerCase();
  const isOffice = propertyTypeNormalized === "office";
  const isResidential = ["house", "apartment", "villa"].includes(propertyTypeNormalized);
  const priceUnitNormalized = String(office?.priceUnit || "MONTH").toUpperCase();
  const isHourly = isOffice && priceUnitNormalized === "HOUR";

  const handleDateRangeSelect = (start, end) => {
    setFormData((prev) => ({
      ...prev,
      bookingDate: start,
      endDate: isHourly ? start : end,
    }));
    setError("");
  };

  const handleHourlySlotSelect = (startT, endT) => {
    setFormData((prev) => ({
      ...prev,
      startTime: startT,
      endTime: endT,
    }));
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handlePayPendingNow = async () => {
    if (!confirmedRequestId) return;
    try {
      setPayingPending(true);
      await processRazorpayPayment({
        requestId: confirmedRequestId,
        officeName: office.title || office.name,
        user: savedUser,
      });
      navigate("/my-bookings");
    } catch (payErr) {
      alert("Payment failed or closed. You can retry anytime from My Bookings.");
    } finally {
      setPayingPending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const rawUserId = savedUser?.userId || savedUser?.id || localStorage.getItem("userId");
    const userIdNum = Number(rawUserId);

    if (!rawUserId || isNaN(userIdNum) || userIdNum <= 0) {
      setError("Your login session is invalid. Please log in again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!formData.bookingDate) {
      setError(`Please click a ${isHourly ? "booking date" : "start date"} on the calendar below.`);
      window.scrollTo({ top: 250, behavior: "smooth" });
      return;
    }

    const proposedStart = formData.bookingDate;
    const proposedEnd = isHourly ? formData.bookingDate : formData.endDate || formData.bookingDate;

    if (!isHourly && proposedEnd < proposedStart) {
      setError("End date cannot be earlier than start date.");
      window.scrollTo({ top: 250, behavior: "smooth" });
      return;
    }

    const durationInfo = calculateDurationPreview(
      priceUnitNormalized,
      formData.bookingDate,
      proposedEnd,
      formData.startTime,
      formData.endTime
    );

    const messageParts = [
      `Name: ${formData.fullName}`,
      `Phone: ${formData.phone}`,
    ];

    if (isOffice) {
      messageParts.push(`Team: ${formData.teamSize || 1}`);
    } else {
      messageParts.push(`Residents: ${formData.residents || 1}`);
    }

    if (isHourly) {
      messageParts.push(`Booking Date: ${formData.bookingDate}`);
      messageParts.push(`Hours: ${formData.startTime} - ${formData.endTime}`);
    } else if (isResidential) {
      messageParts.push(`Move-in: ${formData.bookingDate}`);
      messageParts.push(`Move-out: ${proposedEnd}`);
      messageParts.push(`Duration: ${durationInfo.text}`);
    } else {
      messageParts.push(`Rental Starts: ${formData.bookingDate}`);
      messageParts.push(`Rental Ends: ${proposedEnd}`);
      messageParts.push(`Duration: ${durationInfo.text}`);
    }

    if (formData.requirements) {
      messageParts.push(`Requirements: ${formData.requirements}`);
    }

    const message = messageParts.join(" | ").slice(0, 250);
    const isInstant = (office.bookingMode || "INSTANT").toUpperCase() === "INSTANT";

    try {
      setSubmitting(true);
      setError("");

      const createdRequest = await createBookingRequest({
        propertyId: office.propertyId || office.id,
        userId: userIdNum,
        proposedStart,
        proposedEnd,
        message,
      });

      setConfirmedRequestId(createdRequest.requestId);

      await fetchAvailabilityData();

      if (isInstant || createdRequest.status === "PENDING_PAYMENT" || createdRequest.status === "pending_payment") {
        try {
          await processRazorpayPayment({
            requestId: createdRequest.requestId,
            officeName: office.title || office.name,
            user: savedUser,
          });

          navigate("/my-bookings");
          return;
        } catch (payErr) {
          console.warn("Payment modal closed or failed:", payErr);
          setSubmitted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (requestError) {
      console.error("Booking error:", requestError);
      const responseData = requestError.response?.data;
      const statusCode = requestError.response?.status;

      if (!requestError.response) {
        setError("Cannot connect to the backend. Make sure Spring Boot is running.");
      } else if (statusCode === 409) {
        setError("These dates were just booked by someone else! Please select different dates.");
        fetchAvailabilityData();
      } else {
        setError(
          typeof responseData === "string"
            ? responseData
            : responseData?.message || "Booking request failed. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="booking-not-found">
        <div>
          <FiLoader className="loading-icon" />
          <h1>Loading property details...</h1>
          <p>Please wait while we prepare the booking engine.</p>
        </div>
      </main>
    );
  }

  if (!office || pageError) {
    return (
      <main className="booking-not-found">
        <div>
          <h1>Property unavailable</h1>
          <p>{pageError || "Please select an available property before booking."}</p>
          <Link to="/offices" className="primary-btn">
            Browse Properties
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="booking-success-page">
        <div className="booking-success-card">
          <span className="success-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <FiZap />
          </span>

          <p className="success-label" style={{ color: "#d97706" }}>BOOKING RESERVED — PAYMENT PENDING</p>

          <h1>Payment Pending</h1>

          {confirmedRequestId && (
            <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", color: "#873800", padding: "0.75rem 1.25rem", borderRadius: "10px", margin: "1rem auto", fontWeight: "700", display: "inline-block" }}>
              Booking ID: #{confirmedRequestId}
            </div>
          )}

          <p>
            Your reservation for <strong>{office.title || office.name}</strong> is reserved with <strong>Pending Payment</strong> status.
            Please complete your payment within 15 minutes to secure your booking.
          </p>

          <div className="success-actions" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="primary-btn"
              style={{ background: "#2563eb", cursor: "pointer" }}
              disabled={payingPending}
              onClick={handlePayPendingNow}
            >
              {payingPending ? "Opening Razorpay..." : "⚡ Pay with Razorpay Now"}
            </button>

            <Link to="/my-bookings" className="success-secondary-btn">
              Go to My Applications
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isInstant = (office.bookingMode || "INSTANT").toUpperCase() === "INSTANT";
  const durationInfo = calculateDurationPreview(
    priceUnitNormalized,
    formData.bookingDate,
    formData.endDate || formData.bookingDate,
    formData.startTime,
    formData.endTime
  );

  const priceCalc = calculateTotalPricePreview(
    office.price,
    priceUnitNormalized,
    formData.bookingDate,
    formData.endDate || formData.bookingDate,
    formData.startTime,
    formData.endTime
  );

  return (
    <main className="booking-page">
      <div className="container">
        <Link to={`/office-details/${office.propertyId || office.id}`} className="booking-back-link">
          <FiArrowLeft />
          Back to property details
        </Link>

        <div className="booking-page-heading">
          <span>
            {isHourly
              ? "HOURLY WORKSPACE BOOKING"
              : isResidential
              ? "RESIDENTIAL LEASE APPLICATION"
              : "PROPERTY RENTAL APPLICATION"}
          </span>
          <h1>
            {isHourly
              ? "Reserve Hourly Workspace"
              : isResidential
              ? "Submit Residential Lease Application"
              : isInstant
              ? "Book Workspace Immediately"
              : "Submit Property Rental Application"}
          </h1>
        </div>

        {isInstant && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FiZap style={{ fontSize: "1.5rem", color: "#2563eb", flexShrink: 0 }} />
            <div>
              <strong>Instant Book Available:</strong> Select dates, pay securely via Razorpay, and your reservation is confirmed immediately!
            </div>
          </div>
        )}

        <div className="booking-layout">
          <form className="booking-form-card" onSubmit={handleSubmit}>
            {error && <div className="booking-form-error">{error}</div>}

            <div className="form-section-heading">
              <span>1</span>
              <div>
                <h2>Personal Information</h2>
                <p>Enter your contact details</p>
              </div>
            </div>

            <div className="booking-form-grid">
              <label className="form-group">
                Full Name
                <div className="booking-input">
                  <FiUser />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </label>

              <label className="form-group">
                Email Address
                <div className="booking-input">
                  <FiMail />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </label>

              <label className="form-group booking-full-width">
                Phone Number
                <div className="booking-input">
                  <FiPhone />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    required
                  />
                </div>
              </label>
            </div>

            <div className="form-separator" />

            <div className="form-section-heading">
              <span>2</span>
              <div>
                <h2>
                  {isHourly
                    ? "Hourly Slot Selection"
                    : isResidential
                    ? "Tenancy & Move-in Dates"
                    : "Rental Term & Dates"}
                </h2>
                <p>
                  {isHourly
                    ? "Select your date and available time slot from the calendar below"
                    : "Click Start date and End date on the calendar below"}
                </p>
              </div>
            </div>

            {/* Availability Calendar Widget */}
            <AvailabilityCalendar
              isHourly={isHourly}
              openingTime={office.openingTime || "09:00"}
              closingTime={office.closingTime || "18:00"}
              slotDurationMinutes={office.slotDurationMinutes || 60}
              bookedRanges={bookedRanges}
              startDate={formData.bookingDate}
              endDate={formData.endDate}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onDateRangeSelect={handleDateRangeSelect}
              onHourlySlotSelect={handleHourlySlotSelect}
            />

            <div className="booking-form-grid">
              <label className="form-group">
                {isHourly ? "Booking Date" : isResidential ? "Move-in Date" : "Rental Starts"}
                <div className="booking-input">
                  <FiCalendar />
                  <input
                    type="date"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleChange}
                    min={minimumDate}
                    required
                  />
                </div>
              </label>

              {!isHourly && (
                <label className="form-group">
                  {isResidential ? "Move-out Date" : "Rental Ends"}
                  <div className="booking-input">
                    <FiCalendar />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.bookingDate || minimumDate}
                      required
                    />
                  </div>
                </label>
              )}

              {/* Occupants / Team Size */}
              {isOffice ? (
                <label className="form-group booking-full-width">
                  Team Size
                  <div className="booking-input">
                    <FiUsers />
                    <input
                      type="number"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleChange}
                      placeholder="Number of team members"
                      min="1"
                      required
                    />
                  </div>
                </label>
              ) : isResidential ? (
                <label className="form-group booking-full-width">
                  Number of Residents
                  <div className="booking-input">
                    <FiHome />
                    <input
                      type="number"
                      name="residents"
                      value={formData.residents}
                      onChange={handleChange}
                      placeholder="Number of residents staying"
                      min="1"
                      required
                    />
                  </div>
                </label>
              ) : null}

              <label className="form-group booking-full-width">
                Additional Requirements
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Any special requirements..."
                  rows="3"
                />
              </label>
            </div>

            <button type="submit" className="submit-booking-button" disabled={submitting}>
              {isInstant ? <FiCreditCard /> : <FiCheckCircle />}
              {submitting
                ? isInstant
                  ? "Opening Payment Gateway..."
                  : "Submitting Application..."
                : isInstant
                ? "Book & Pay Now"
                : isResidential
                ? "Submit Lease Application"
                : "Submit Rental Application"}
            </button>
          </form>

          {/* Airbnb Style Summary Card */}
          <BookingSummaryCard
            property={office}
            isHourly={isHourly}
            isResidential={isResidential}
            startDate={formData.bookingDate}
            endDate={formData.endDate || formData.bookingDate}
            startTime={formData.startTime}
            endTime={formData.endTime}
            durationText={durationInfo.text}
            totalAmount={priceCalc.total}
            teamSize={formData.teamSize}
            residents={formData.residents}
            submitting={submitting}
            isInstant={isInstant}
            confirmedRequestId={confirmedRequestId}
          />
        </div>
      </div>
    </main>
  );
}

export default BookOffice;