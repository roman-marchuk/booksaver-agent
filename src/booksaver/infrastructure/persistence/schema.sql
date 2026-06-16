CREATE TABLE IF NOT EXISTS schema_meta (
    version    INTEGER NOT NULL,
    applied_at TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id       TEXT    PRIMARY KEY,
    platform         TEXT    NOT NULL CHECK(platform = 'booking_com'),
    product_type     TEXT    NOT NULL CHECK(product_type = 'hotel'),
    confirmation_id  TEXT    NOT NULL UNIQUE,
    property_name    TEXT    NOT NULL,
    property_ref     TEXT    NOT NULL,
    check_in         TEXT    NOT NULL,
    check_out        TEXT    NOT NULL CHECK(check_out > check_in),
    room_type        TEXT    NOT NULL,
    baseline_amount  TEXT    NOT NULL,
    baseline_currency TEXT   NOT NULL,
    refundable       INTEGER NOT NULL CHECK(refundable = 1),
    refund_note      TEXT    NOT NULL DEFAULT '',
    refund_deadline  TEXT,
    registered_at    TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'active'
);

-- Contract stub: columns extended by Unit 2 (booking_com_price_monitor)
CREATE TABLE IF NOT EXISTS check_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id  TEXT    NOT NULL REFERENCES bookings(booking_id),
    recorded_at TEXT    NOT NULL
);
