-- Back up the database before running this migration.
-- It retains purchase request IDs. Rental rows receive new IDs in the merged table.

RENAME TABLE purchase_requests TO property_requests;

ALTER TABLE property_requests
    ADD COLUMN request_type VARCHAR(20) NOT NULL DEFAULT 'PURCHASE' AFTER user_id,
    ADD COLUMN proposed_start DATE NULL AFTER message,
    ADD COLUMN proposed_end DATE NULL AFTER proposed_start;

INSERT INTO property_requests (
    property_id,
    user_id,
    request_type,
    offer_price,
    message,
    proposed_start,
    proposed_end,
    status,
    reviewed_by,
    reviewed_at,
    created_at
)
SELECT
    property_id,
    user_id,
    'RENTAL',
    NULL,
    message,
    proposed_start,
    proposed_end,
    status,
    reviewed_by,
    reviewed_at,
    created_at
FROM rental_applications;

ALTER TABLE property_requests
    ALTER COLUMN request_type DROP DEFAULT;

DROP TABLE rental_applications;

CREATE INDEX idx_property_requests_user_id ON property_requests (user_id);
CREATE INDEX idx_property_requests_property_id ON property_requests (property_id);
CREATE INDEX idx_property_requests_type ON property_requests (request_type);
