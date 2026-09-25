package com.officespace.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Repairs missing hourly fields on Office rows created by older versions.
 *
 * Property types are intentionally left unchanged so startup never rewrites
 * existing listings.
 */
@Component
public class CoworkingDataFixer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(CoworkingDataFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Fix broken hourly fields on Office rows that still have MONTH + null times.
            String fixHourlySql = "UPDATE properties SET price_unit = 'HOUR', opening_time = '09:00', closing_time = '18:00', slot_duration_minutes = 60 " +
                    "WHERE property_type = 'Office' " +
                    "AND (price_unit = 'MONTH' OR price_unit IS NULL) " +
                    "AND opening_time IS NULL " +
                    "AND closing_time IS NULL";
            int fixed = jdbcTemplate.update(fixHourlySql);
            if (fixed > 0) {
                logger.info("PropertyTypeFixer: Fixed {} Office rows with missing hourly pricing data.", fixed);
            }

            if (fixed == 0) {
                logger.info("PropertyTypeFixer: No legacy rows needed fixing.");
            }
        } catch (Exception e) {
            logger.error("PropertyTypeFixer: Error during startup data fix: ", e);
        }
    }
}
