import React from "react";
import { FiCalendar, FiClock, FiCreditCard, FiHome, FiMapPin, FiUsers } from "react-icons/fi";
import { formatCurrency, formatDateDisplay, formatTimeDisplay } from "../../utils/bookingUtils";
import { BookingModeBadge } from "./BookingModeBadge";

export function BookingSummaryCard({
  property,
  isHourly,
  isResidential,
  isForSale,
  visitTimeSlot,
  startDate,
  endDate,
  startTime,
  endTime,
  durationText,
  totalAmount,
  teamSize,
  residents,
  submitting,
  isInstant,
  confirmedRequestId,
}) {
  if (!property) return null;

  const priceUnitNormalized = String(property.priceUnit || "MONTH").toUpperCase();

  return (
    <aside className="selected-office-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.5rem" }}>
      <p className="selected-office-label" style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: isForSale ? "#059669" : "#64748b", marginBottom: "1rem" }}>
        {isForSale ? "PURCHASE INQUIRY SUMMARY" : "BOOKING SUMMARY"}
      </p>

      {confirmedRequestId && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1rem", fontWeight: "700" }}>
          Booking ID: #{confirmedRequestId}
        </div>
      )}

      {property.image && (
        <img
          src={property.image}
          alt={property.title || property.name}
          style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px", marginBottom: "1rem" }}
        />
      )}

      <div className="selected-office-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span className="selected-office-type" style={{ fontSize: "0.85rem", color: isForSale ? "#059669" : "#2563eb", fontWeight: "700" }}>
            {property.propertyType || property.type} {isForSale ? "• For Sale" : ""}
          </span>
          {!isForSale && <BookingModeBadge mode={property.bookingMode} />}
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.25rem" }}>
          {property.title || property.name}
        </h2>

        <p className="selected-office-location" style={{ fontSize: "0.9rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "1rem" }}>
          <FiMapPin />
          {property.city}, {property.state}
        </p>

        {isForSale ? (
          <div style={{ borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "1rem 0", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Preferred Visit</span>
              <strong style={{ color: "#1e293b", textAlign: "right" }}>
                {formatDateDisplay(startDate) || "Select Visit Date"}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Time Window</span>
              <strong style={{ color: "#1e293b" }}>{visitTimeSlot || "Morning"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Inquiry Type</span>
              <strong style={{ color: "#059669" }}>On-site Visit & Purchase</strong>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "1rem 0", marginBottom: "1rem" }}>
            {/* Dates & Hours */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>{isHourly ? "Booking Date" : isResidential ? "Move-in / Move-out" : "Rental Period"}</span>
              <strong style={{ color: "#1e293b", textAlign: "right" }}>
                {isHourly ? (
                  formatDateDisplay(startDate) || "Select Date"
                ) : (
                  `${formatDateDisplay(startDate) || "Select Start"} → ${formatDateDisplay(endDate) || "Select End"}`
                )}
              </strong>
            </div>

            {isHourly && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Hours</span>
                <strong style={{ color: "#1e293b" }}>
                  {startTime && endTime ? `${formatTimeDisplay(startTime)} – ${formatTimeDisplay(endTime)}` : "Select time"}
                </strong>
              </div>
            )}

            {/* Duration */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>Duration</span>
              <strong style={{ color: "#1e293b" }}>{durationText || (isHourly ? "—" : "1 Month")}</strong>
            </div>

            {/* Occupants */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>{isResidential ? "Residents" : "Team Size"}</span>
              <strong style={{ color: "#1e293b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                {isResidential ? <FiHome style={{ color: "#2563eb" }} /> : <FiUsers style={{ color: "#2563eb" }} />}
                {isResidential ? `${residents || 1} Residents` : `${teamSize || 1} Members`}
              </strong>
            </div>
          </div>
        )}

        {/* Pricing breakdown */}
        <div style={{ marginBottom: "1rem" }}>
          {isForSale ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a" }}>Asking Price</span>
              <strong style={{ fontSize: "1.4rem", fontWeight: "800", color: "#059669" }}>
                {formatCurrency(property.price)}
              </strong>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Rate</span>
                <span style={{ color: "#1e293b", fontWeight: "600" }}>
                  {formatCurrency(property.price)} / {priceUnitNormalized.toLowerCase()}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a" }}>Total Amount</span>
                <strong style={{ fontSize: "1.4rem", fontWeight: "800", color: "#2563eb" }}>
                  {totalAmount == null ? "—" : formatCurrency(totalAmount)}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default BookingSummaryCard;
