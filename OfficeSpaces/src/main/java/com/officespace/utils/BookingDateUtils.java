package com.officespace.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public final class BookingDateUtils {

    private BookingDateUtils() {
    }

    public static boolean isToday(LocalDate date) {
        return date != null && date.isEqual(LocalDate.now());
    }

    public static boolean isPast(LocalDate date) {
        return date != null && date.isBefore(LocalDate.now());
    }

    public static boolean isPastDateTime(LocalDate date, String timeStr) {
        if (date == null) return false;
        if (date.isBefore(LocalDate.now())) return true;
        if (date.isAfter(LocalDate.now())) return false;
        if (timeStr == null || timeStr.trim().isEmpty()) return false;

        try {
            LocalTime time = parseTime(timeStr);
            return LocalDateTime.of(date, time).isBefore(LocalDateTime.now());
        } catch (Exception e) {
            return false;
        }
    }

    public static LocalTime parseTime(String timeStr) {
        if (timeStr == null) return LocalTime.of(9, 0);
        String cleaned = timeStr.trim().toUpperCase();
        if (cleaned.contains("AM") || cleaned.contains("PM")) {
            boolean isPm = cleaned.contains("PM");
            cleaned = cleaned.replace("AM", "").replace("PM", "").trim();
            String[] parts = cleaned.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            if (isPm && hour < 12) hour += 12;
            if (!isPm && hour == 12) hour = 0;
            return LocalTime.of(hour, minute);
        } else {
            String[] parts = cleaned.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            return LocalTime.of(hour, minute);
        }
    }

    public static long calculateDays(LocalDate start, LocalDate end) {
        if (start == null || end == null) return 0;
        long days = ChronoUnit.DAYS.between(start, end);
        return days <= 0 ? 1 : days;
    }

    public static long calculateWeeks(LocalDate start, LocalDate end) {
        long days = calculateDays(start, end);
        long weeks = days / 7;
        return weeks <= 0 ? 1 : weeks;
    }

    public static long calculateMonths(LocalDate start, LocalDate end) {
        if (start == null || end == null) return 1;
        long months = ChronoUnit.MONTHS.between(start, end);
        return months <= 0 ? 1 : months;
    }

    public static long calculateHours(String startTime, String endTime) {
        try {
            LocalTime start = parseTime(startTime);
            LocalTime end = parseTime(endTime);
            long minutes = ChronoUnit.MINUTES.between(start, end);
            long hours = minutes / 60;
            return hours <= 0 ? 1 : hours;
        } catch (Exception e) {
            return 1;
        }
    }
}
