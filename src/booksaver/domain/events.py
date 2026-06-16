from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .value_objects import CheckInterval, DataDirectory, Money, Property, RoomType, StayDates


@dataclass(frozen=True)
class BookingRegistered:
    booking_id: str
    platform: str
    property: Property
    stay_dates: StayDates
    room_type: RoomType
    baseline_price: Money
    registered_at: datetime


@dataclass(frozen=True)
class BookingRegistrationRejected:
    reason: str
    confirmation_id: str | None = None


@dataclass(frozen=True)
class ConfigLoaded:
    data_directory: DataDirectory
    check_interval: CheckInterval
    loaded_at: datetime


@dataclass(frozen=True)
class ConfigValidationFailed:
    errors: list[str]
