package com.officespace.constants;

import com.officespace.entities.BookingMode;
import java.time.LocalTime;

public final class BookingConstants {

    private BookingConstants() {
        // Utility / Constants class
    }

    public static final LocalTime DEFAULT_OPENING_TIME = LocalTime.of(9, 0);
    public static final LocalTime DEFAULT_CLOSING_TIME = LocalTime.of(18, 0);
    public static final int DEFAULT_SLOT_DURATION_MINUTES = 60;
    public static final BookingMode DEFAULT_BOOKING_MODE = BookingMode.INSTANT;
}
