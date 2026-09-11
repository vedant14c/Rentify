import React from "react";

export function BookingStatusBadge({ status }) {
  const normalizedStatus = String(status || "PENDING").toUpperCase();

  const getBadgeStyle = () => {
    switch (normalizedStatus) {
      case "CONFIRMED":
      case "PAID":
        return { background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", label: "Confirmed & Paid" };
      case "APPROVED":
      case "ACCEPTED":
        return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff", label: "Approved by Owner" };
      case "PENDING_PAYMENT":
        return { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", label: "Pending Payment" };
      case "CANCELLED":
        return { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "Cancelled" };
      case "EXPIRED":
        return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", label: "Hold Expired" };
      case "REJECTED":
        return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", label: "Rejected" };
      case "PENDING":
      default:
        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", label: "Awaiting Owner Approval" };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.35rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.85rem",
        fontWeight: "600",
        background: style.background,
        color: style.color,
        border: style.border,
      }}
    >
      {style.label}
    </span>
  );
}

export default BookingStatusBadge;
