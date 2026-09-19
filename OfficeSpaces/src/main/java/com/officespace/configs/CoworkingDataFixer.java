package com.officespace.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time startup fixer: normalizes any legacy property_type values
 * (e.g. "Coworking", "Co-working", "Desk", "Workspace", "Meeting Room", "Private Cabin")
 * to "Office", and ensures hourly fields are populated for rows that were
 * previously broken (priceUnit=MONTH, opening/closing times null).
 *
 * Safe to leave in — it's a no-op once all rows are already normalized.
 */
@Component
public class CoworkingDataFixer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(CoworkingDataFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Step 1: Normalize property_type to "Office" for any legacy sub-types
            String normalizeSql = "UPDATE properties SET property_type = 'Office' " +
                    "WHERE LOWER(property_type) IN ('coworking', 'co-working', 'desk', 'workspace', 'meeting room', 'meeting_room', 'private cabin', 'private_cabin', 'shared office')";
            int normalized = jdbcTemplate.update(normalizeSql);
            if (normalized > 0) {
                logger.info("PropertyTypeFixer: Normalized {} legacy property_type rows to 'Office'.", normalized);
            }

            // Step 2: Fix broken hourly fields on Office rows that still have MONTH + null times
            String fixHourlySql = "UPDATE properties SET price_unit = 'HOUR', opening_time = '09:00', closing_time = '18:00', slot_duration_minutes = 60 " +
                    "WHERE property_type = 'Office' " +
                    "AND (price_unit = 'MONTH' OR price_unit IS NULL) " +
                    "AND opening_time IS NULL " +
                    "AND closing_time IS NULL";
            int fixed = jdbcTemplate.update(fixHourlySql);
            if (fixed > 0) {
                logger.info("PropertyTypeFixer: Fixed {} Office rows with missing hourly pricing data.", fixed);
            }

            if (normalized == 0 && fixed == 0) {
                logger.info("PropertyTypeFixer: No legacy rows needed fixing.");
            }
        } catch (Exception e) {
            logger.error("PropertyTypeFixer: Error during startup data fix: ", e);
        }
    }
}
