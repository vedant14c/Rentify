import React, { useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiAlertCircle } from "react-icons/fi";
import { formatInputDate, formatDateDisplay } from "../../utils/bookingUtils";

function normalizeDateString(dateVal) {
  if (!dateVal) return "";
  if (typeof dateVal === "string") return dateVal;
  if (Array.isArray(dateVal)) {
    const [y, m, d] = dateVal;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (dateVal instanceof Date) {
    return formatInputDate(dateVal);
  }
  return String(dateVal);
}

export function AvailabilityCalendar({
  isHourly,
  openingTime = "09:00",
  closingTime = "18:00",
  slotDurationMinutes = 60,
  bookedRanges = [],
  startDate,
  endDate,
  startTime,
  endTime,
  onDateRangeSelect,
  onHourlySlotSelect,
}) {
  const todayStr = formatInputDate(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionError, setSelectionError] = useState("");

  const generateHourlySlots = () => {
    const slots = [];
    const parseHour = (t) => {
      if (!t) return 9;
      let [h] = t.split(":").map(Number);
      return h;
    };

    const startH = parseHour(openingTime);
    const endH = parseHour(closingTime);

    for (let h = startH; h < endH; h++) {
      const formatTimeSlot = (hour) => {
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${String(formattedHour).padStart(2, "0")}:00 ${ampm}`;
      };

      const startSlot = formatTimeSlot(h);
      const endSlot = formatTimeSlot(h + 1);
      slots.push({ startTime: startSlot, endTime: endSlot, rawHour: h });
    }
    return slots;
  };

  const hourlySlots = generateHourlySlots();

  const isSlotPast = (rawHour) => {
    if (!startDate || startDate !== todayStr) return false;
    const currentHour = new Date().getHours();
    return rawHour <= currentHour;
  };

  const isSlotBooked = (slot) => {
    if (!startDate || !bookedRanges.length) return false;
    return bookedRanges.some((range) => {
      const start = normalizeDateString(range.startDate || range.proposedStart);
      const end = normalizeDateString(range.endDate || range.proposedEnd);
      return startDate >= start && startDate <= end;
    });
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getDayStatus = (dateStr) => {
    if (dateStr < todayStr) return "PAST";

    const matchedRange = (bookedRanges || []).find((range) => {
      const start = normalizeDateString(range.startDate || range.proposedStart);
      const end = normalizeDateString(range.endDate || range.proposedEnd);
      if (!start || !end) return false;
      return dateStr >= start && dateStr <= end;
    });

    if (matchedRange) {
      const statusStr = String(matchedRange.status || "").toUpperCase();
      return statusStr === "PENDING_PAYMENT" ? "HOLD" : "BOOKED";
    }

    if (startDate && endDate && dateStr >= startDate && dateStr <= endDate) {
      return "SELECTED";
    }

    if (startDate && !endDate && dateStr === startDate) {
      return "SELECTED_START";
    }

    return "AVAILABLE";
  };

  const handleDayClick = (dateStr) => {
    setSelectionError("");
    if (dateStr < todayStr) return;

    const dayStatus = getDayStatus(dateStr);
    if (dayStatus === "BOOKED" || dayStatus === "HOLD") return;

    if (!startDate || (startDate && endDate)) {
      onDateRangeSelect(dateStr, "");
    } else {
      let newStart = startDate;
      let newEnd = dateStr;

      if (dateStr < startDate) {
        newStart = dateStr;
        newEnd = startDate;
      }

      const hasInternalOverlap = bookedRanges.some((range) => {
        const start = normalizeDateString(range.startDate || range.proposedStart);
        const end = normalizeDateString(range.endDate || range.proposedEnd);
        return newStart <= end && newEnd >= start;
      });

      if (hasInternalOverlap) {
        setSelectionError("Selected range contains unavailable dates. Please choose different dates.");
        onDateRangeSelect("", "");
        return;
      }

      onDateRangeSelect(newStart, newEnd);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem" }}>
      {selectionError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiAlertCircle />
          <span>{selectionError}</span>
        </div>
      )}

      {isHourly ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#1e293b", fontWeight: "600" }}>
            <FiClock style={{ color: "#2563eb" }} />
            <span>Select Hourly Time Slot ({openingTime} – {closingTime})</span>
          </div>

          {!startDate ? (
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Please select a booking date above to view available hourly slots.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {hourlySlots.map((slot, idx) => {
                const past = isSlotPast(slot.rawHour);
                const booked = isSlotBooked(slot);
                const isSelected = startTime === slot.startTime && endTime === slot.endTime;
                const isDisabled = past || booked;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onHourlySlotSelect(slot.startTime, slot.endTime)}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: isDisabled ? "#f1f5f9" : isSelected ? "#eff6ff" : "#ffffff",
                      color: isDisabled ? "#94a3b8" : isSelected ? "#1d4ed8" : "#334155",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div>{slot.startTime}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "400", opacity: 0.8 }}>to {slot.endTime}</div>
                    {booked && <div style={{ fontSize: "0.7rem", color: "#dc2626" }}>❌ Reserved</div>}
                    {past && <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Past</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#475569" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }}></span> 🟩 Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }}></span> 🟥 Booked
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }}></span> 🟨 Pending Payment
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#2563eb" }}></span> 🔵 Selected Range
            </span>
          </div>

          {/* Month Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <button type="button" onClick={handlePrevMonth} style={{ border: "none", background: "#f1f5f9", padding: "0.5rem", borderRadius: "8px", cursor: "pointer" }}>
              <FiChevronLeft />
            </button>
            <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </strong>
            <button type="button" onClick={handleNextMonth} style={{ border: "none", background: "#f1f5f9", padding: "0.5rem", borderRadius: "8px", cursor: "pointer" }}>
              <FiChevronRight />
            </button>
          </div>

          {/* Month Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.35rem", textAlign: "center", fontSize: "0.85rem" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ fontWeight: "600", color: "#64748b", paddingBottom: "0.5rem" }}>
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateStr = formatInputDate(dateObj);
              const dayStatus = getDayStatus(dateStr);

              let bg = "#ffffff";
              let color = "#1e293b";
              let border = "1px solid #e2e8f0";
              let cursor = "pointer";
              let labelBadge = null;

              if (dayStatus === "PAST") {
                bg = "#f8fafc";
                color = "#cbd5e1";
                cursor = "not-allowed";
              } else if (dayStatus === "BOOKED") {
                bg = "#fef2f2";
                color = "#991b1b";
                border = "1px solid #fca5a5";
                cursor = "not-allowed";
              } else if (dayStatus === "HOLD") {
                bg = "#fffbe6";
                color = "#873800";
                border = "1px solid #ffe58f";
                cursor = "not-allowed";
              } else if (dayStatus === "SELECTED" || dayStatus === "SELECTED_START") {
                bg = "#2563eb";
                color = "#ffffff";
                border = "1px solid #1d4ed8";

                if (dateStr === startDate && dateStr === endDate) {
                  labelBadge = "Start & End";
                } else if (dateStr === startDate) {
                  labelBadge = "Start";
                } else if (dateStr === endDate) {
                  labelBadge = "End";
                }
              }

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  disabled={dayStatus === "PAST" || dayStatus === "BOOKED" || dayStatus === "HOLD"}
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    border,
                    background: bg,
                    color,
                    fontWeight: "600",
                    cursor,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span>{dayNum}</span>
                  {labelBadge && (
                    <span style={{ fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", background: "#ffffff", color: "#1d4ed8", padding: "1px 4px", borderRadius: "4px" }}>
                      {labelBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailabilityCalendar;
