import React from "react";
import { FiCheckCircle, FiClock, FiCalendar, FiTrendingUp, FiZap } from "react-icons/fi";
import { formatCurrency, formatDateDisplay } from "../../utils/bookingUtils";
import { BookingModeBadge } from "./BookingModeBadge";

export function AvailabilityCard({ availability, property }) {
  if (!property) return null;

  const typeNormalized = (property.propertyType || property.type || "").trim().toLowerCase();
  const isOffice = typeNormalized === "office";
  const isHourly = isOffice && (property.priceUnit || "").toUpperCase() === "HOUR";
  const isAvailableToday = !availability?.nextAvailableDate || availability.nextAvailableDate === new Date().toISOString().split("T")[0];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
          Availability & Rental Terms
        </h3>
        <BookingModeBadge mode={property.bookingMode} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {/* Availability Status */}
        <div style={{ background: isAvailableToday ? "#ecfdf5" : "#fffbe6", padding: "0.85rem 1rem", borderRadius: "12px", border: isAvailableToday ? "1px solid #a7f3d0" : "1px solid #ffe58f" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: isAvailableToday ? "#047857" : "#873800", textTransform: "uppercase" }}>
            Current Status
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", fontSize: "0.95rem", fontWeight: "700", color: isAvailableToday ? "#065f46" : "#b45309" }}>
            <FiCheckCircle />
            {isAvailableToday ? "✔ Available Today" : `Booked - Available from ${formatDateDisplay(availability?.nextAvailableDate)}`}
          </div>
        </div>

        {/* Price & Unit */}
        <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
            Rental Rate ({property.priceUnit || "MONTH"})
          </span>
          <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#2563eb", marginTop: "0.25rem" }}>
            {formatCurrency(property.price)} <small style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>/{String(property.priceUnit || "month").toLowerCase()}</small>
          </div>
        </div>

        {/* Business Hours - ONLY for Office + HOUR */}
        {isHourly && (
          <div style={{ background: "#eff6ff", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>
              Business Hours
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", fontSize: "0.95rem", fontWeight: "700", color: "#1d4ed8" }}>
              <FiClock />
              {property.openingTime || "09:00"} – {property.closingTime || "18:00"} ({property.slotDurationMinutes || 60}m slots)
            </div>
          </div>
        )}

        {/* Confirmed Monthly Bookings Counter */}
        {availability?.monthlyBookingsCount > 0 && (
          <div style={{ background: "#f0fdf4", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#15803d", textTransform: "uppercase" }}>
              Popular Property
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", fontSize: "0.95rem", fontWeight: "700", color: "#166534" }}>
              <FiTrendingUp />
              {availability.monthlyBookingsCount} Confirmed Bookings This Month
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvailabilityCard;
