from __future__ import annotations

import sqlite3
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from booksaver.domain.models import Booking, BookingStatus
from booksaver.domain.value_objects import (
    ConfirmationId,
    Money,
    Platform,
    ProductType,
    Property,
    RefundabilityPolicy,
    RoomType,
    StayDates,
)

SCHEMA_VERSION = 1
_SCHEMA_SQL = Path(__file__).parent / "schema.sql"


class SqliteStore:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._conn: sqlite3.Connection | None = None

    def connect(self) -> None:
        self._db_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        is_new = not self._db_path.exists()
        self._conn = sqlite3.connect(str(self._db_path))
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._conn.row_factory = sqlite3.Row
        if is_new:
            self._db_path.chmod(0o600)
        self._apply_schema()

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

    def __enter__(self) -> SqliteStore:
        self.connect()
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            raise RuntimeError("Store not connected. Use connect() or a context manager.")
        return self._conn

    def _apply_schema(self) -> None:
        self.conn.executescript(_SCHEMA_SQL.read_text())
        row = self.conn.execute("SELECT MAX(version) FROM schema_meta").fetchone()
        if row[0] is None:
            self.conn.execute(
                "INSERT INTO schema_meta (version, applied_at) VALUES (?, ?)",
                (SCHEMA_VERSION, datetime.now(UTC).isoformat()),
            )
            self.conn.commit()


class SqliteBookingRepository:
    def __init__(self, store: SqliteStore) -> None:
        self._store = store

    def add(self, booking: Booking) -> None:
        self._store.conn.execute(
            """
            INSERT INTO bookings (
                booking_id, platform, product_type, confirmation_id,
                property_name, property_ref, check_in, check_out,
                room_type, baseline_amount, baseline_currency,
                refundable, refund_note, refund_deadline,
                registered_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            ),
        )
        self._store.conn.commit()

    def get_by_id(self, booking_id: str) -> Booking | None:
        row = self._store.conn.execute(
            "SELECT * FROM bookings WHERE booking_id = ?", (booking_id,)
        ).fetchone()
        return self._row_to_booking(row) if row else None

    def get_by_confirmation(self, confirmation_id: ConfirmationId) -> Booking | None:
        row = self._store.conn.execute(
            "SELECT * FROM bookings WHERE confirmation_id = ?", (confirmation_id.value,)
        ).fetchone()
        return self._row_to_booking(row) if row else None

    def list_active(self) -> list[Booking]:
        rows = self._store.conn.execute(
            "SELECT * FROM bookings WHERE status = 'active' ORDER BY registered_at DESC"
        ).fetchall()
        return [self._row_to_booking(r) for r in rows]

    def list_all(self) -> list[Booking]:
        rows = self._store.conn.execute(
            "SELECT * FROM bookings ORDER BY registered_at DESC"
        ).fetchall()
        return [self._row_to_booking(r) for r in rows]

    def exists(self, confirmation_id: ConfirmationId) -> bool:
        row = self._store.conn.execute(
            "SELECT 1 FROM bookings WHERE confirmation_id = ?", (confirmation_id.value,)
        ).fetchone()
        return row is not None

    def _row_to_booking(self, row: sqlite3.Row) -> Booking:
        deadline_str: str | None = row["refund_deadline"]
        return Booking(
            booking_id=row["booking_id"],
            platform=Platform(row["platform"]),
            product_type=ProductType(row["product_type"]),
            confirmation_id=ConfirmationId(row["confirmation_id"]),
            property=Property(
                name=row["property_name"],
                booking_com_ref=row["property_ref"],
            ),
            stay_dates=StayDates(
                check_in=date.fromisoformat(row["check_in"]),
                check_out=date.fromisoformat(row["check_out"]),
            ),
            room_type=RoomType(label=row["room_type"]),
            baseline_price=Money(
                amount=Decimal(row["baseline_amount"]),
                currency=row["baseline_currency"],
            ),
            refundability=RefundabilityPolicy(
                is_refundable=bool(row["refundable"]),
                note=row["refund_note"],
                deadline=date.fromisoformat(deadline_str) if deadline_str else None,
            ),
            registered_at=datetime.fromisoformat(row["registered_at"]),
            status=BookingStatus(row["status"]),
        )


class SqliteCheckHistoryRepository:
    def __init__(self, store: SqliteStore) -> None:
        self._store = store

    def append(self, booking_id: str, record: Any) -> None:
        self._store.conn.execute(
            "INSERT INTO check_history (booking_id, recorded_at) VALUES (?, ?)",
            (booking_id, datetime.now(UTC).isoformat()),
        )
        self._store.conn.commit()

    def list_for_booking(self, booking_id: str) -> list[Any]:
        rows = self._store.conn.execute(
            "SELECT * FROM check_history WHERE booking_id = ? ORDER BY recorded_at",
            (booking_id,),
        ).fetchall()
        return [dict(r) for r in rows]
