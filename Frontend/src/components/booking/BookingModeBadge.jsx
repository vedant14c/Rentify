import React from "react";

export function BookingModeBadge({ mode }) {
  const isInstant = String(mode || "INSTANT").toUpperCase() === "INSTANT";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.35rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.85rem",
        fontWeight: "600",
        background: isInstant ? "#ecfdf5" : "#fffbe6",
        color: isInstant ? "#047857" : "#d97706",
        border: isInstant ? "1px solid #a7f3d0" : "1px solid #ffe58f",
      }}
    >
      {isInstant ? "⚡ Instant Book" : "📋 Owner Approval Required"}
    </span>
  );
}

export default BookingModeBadge;
