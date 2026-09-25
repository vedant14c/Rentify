// Pure UI Helper functions for calendar rendering, formatting, and price preview.

export function formatInputDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeDisplay(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = String(timeStr).slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatCurrency(amount) {
  const numericAmount = Number(amount) || 0;
  return `₹${numericAmount.toLocaleString("en-IN")}`;
}

export function calculateEndDate(startDate, durationStr) {
  if (!startDate) return "";
  const count = Number.parseInt(durationStr, 10) || 1;
  const [year, month, day] = startDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);

  const unit = String(durationStr).toLowerCase();
  if (unit.includes("week")) {
    d.setDate(d.getDate() + count * 7);
  } else if (unit.includes("day")) {
    d.setDate(d.getDate() + count);
  } else {
    d.setMonth(d.getMonth() + count);
  }
  return formatInputDate(d);
}

export function calculateDurationPreview(priceUnit, startDate, endDate, startTime, endTime) {
  const unit = String(priceUnit || "MONTH").toUpperCase();

  if (unit === "HOUR") {
    if (!startTime || !endTime) return { count: 0, text: "—" };
    const parseMinutes = (t) => {
      const value = String(t).trim().toUpperCase();
      const isPm = value.includes("PM");
      const isAm = value.includes("AM");
      const parts = value.replace("AM", "").replace("PM", "").trim().split(":").map(Number);
      let hour = parts[0];
      const minute = parts[1] || 0;
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
      return hour * 60 + minute;
    };
    const diffMinutes = parseMinutes(endTime) - parseMinutes(startTime);
    if (diffMinutes <= 0) return { count: 0, text: "—" };
    const count = diffMinutes / 60;
    const text = Number.isInteger(count)
      ? `${count} ${count === 1 ? "Hour" : "Hours"}`
      : `${diffMinutes} Minutes`;
    return { count: diffMinutes / 60, text };
  }

  if (!startDate || !endDate || endDate <= startDate) {
    return { count: 0, text: "—" };
  }

  const [y1, m1, d1] = startDate.split("-").map(Number);
  const [y2, m2, d2] = endDate.split("-").map(Number);

  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  const diffDays = Math.max(1, Math.round((dt2 - dt1) / (1000 * 60 * 60 * 24)));

  if (unit === "DAY") {
    return { count: diffDays, text: `${diffDays} ${diffDays === 1 ? "Day" : "Days"}` };
  }

  if (unit === "WEEK") {
    const weeks = Math.max(1, Math.round(diffDays / 7));
    return { count: weeks, text: `${weeks} ${weeks === 1 ? "Week" : "Weeks"}` };
  }

  // MONTH
  // Check exact month difference if days match (e.g. 29 Aug to 29 Sept)
  let monthDiff = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) {
    monthDiff -= 1;
  }

  if (monthDiff >= 1 && d1 === d2) {
    return { count: monthDiff, text: `${monthDiff} ${monthDiff === 1 ? "Month" : "Months"}` };
  }

  const estimatedMonths = Math.max(1, Math.round(diffDays / 30));
  return { count: estimatedMonths, text: `${estimatedMonths} ${estimatedMonths === 1 ? "Month" : "Months"}` };
}

export function calculateTotalPricePreview(basePrice, priceUnit, startDate, endDate, startTime, endTime) {
  const price = Number(basePrice) || 0;
  const durationInfo = calculateDurationPreview(priceUnit, startDate, endDate, startTime, endTime);
  return {
    rate: price,
    durationText: durationInfo.text,
    total: durationInfo.count > 0 ? price * durationInfo.count : null,
  };
}
