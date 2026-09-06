"""Test-only persistence setup for strict booking projections."""

from booksaver.domain.models import Booking
from booksaver.infrastructure.persistence.sqlite_store import SqliteStore


def seed_booking(
    store: SqliteStore,
    booking: Booking,
    *,
    user_id: int | None = None,
) -> None:
    """Insert a booking projection without exposing a production mutation API."""
    if user_id is None:
        row = store.conn.execute(
            "SELECT user_id FROM users WHERE role = 'owner' LIMIT 1"
        ).fetchone()
        if row is None:
            raise AssertionError("test database has no owner user")
        user_id = int(row[0])

    store.conn.execute(
        """
        INSERT INTO bookings (
            booking_id, platform, product_type, confirmation_id,
            property_name, property_ref, check_in, check_out,
            room_type, baseline_amount, baseline_currency,
            refundable, refund_note, refund_deadline,
            registered_at, status, occ_adults, occ_children, occ_rooms,
            user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            booking.booking_id,
            booking.platform.value,
            booking.product_type.value,
            booking.confirmation_id.value,
            booking.property.name,
            booking.property.booking_com_ref,
            booking.stay_dates.check_in.isoformat(),
            booking.stay_dates.check_out.isoformat(),
            booking.room_type.label,
            str(booking.baseline_price.amount),
            booking.baseline_price.currency,
            1 if booking.refundability.is_refundable else 0,
            booking.refundability.note,
            booking.refundability.deadline.isoformat()
            if booking.refundability.deadline
            else None,
            booking.registered_at.isoformat(),
            booking.status.value,
            booking.occupancy.adults if booking.occupancy else None,
            booking.occupancy.children if booking.occupancy else None,
            booking.occupancy.rooms if booking.occupancy else None,
            user_id,
        ),
    )
    store.conn.commit()
