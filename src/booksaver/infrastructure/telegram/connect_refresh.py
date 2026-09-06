"""Explain the background inventory refresh that follows a saved login."""

from collections.abc import Callable

from booksaver.daemon.check_coordinator import (
    CheckCoordinator,
    ImmediateAdmission,
    InventoryCompletion,
)
from booksaver.domain.account_sync import SynchronizationTrigger


def start_post_connect_refresh(
    telegram_user_id: int,
    coordinator: CheckCoordinator,
    send: Callable[[int, str], object],
) -> None:
    # Announce before admission: even an immediately completed worker must not send
    # its result before this progress message. Authentication was already announced.
    send(
        telegram_user_id,
        "Preparing to refresh your reservations. "
        "Please wait for the result before using /checknow.",
    )

    def completed(completion: InventoryCompletion) -> None:
        report = completion.report
        if report is not None and (report.succeeded or report.accepted_positive_observations):
            preserved = (
                " Other saved reservations were kept."
                if report.accepted_positive_observations
                else ""
            )
            message = (
                f"Reservation refresh finished: {report.discovered} found, "
                f"{report.eligible} eligible for price-drop checks.{preserved} "
                "Send /checknow to check prices, or /bookings for details."
            )
        else:
            message = (
                "Your Booking.com login is saved, but the reservation refresh could not "
                "be completed. Your saved reservations were kept. Send /bookings to retry."
            )
            if report is not None and report.failure_code is not None:
                message += f" Reason: {report.failure_code.value}."
        send(telegram_user_id, message)

    admission = coordinator.request_inventory(
        telegram_user_id, completed, trigger=SynchronizationTrigger.CONNECT,
    )
    if admission is ImmediateAdmission.BUSY:
        send(
            telegram_user_id,
            "Your login is saved, but another browser operation is running. "
            "The reservation refresh was not started or queued. "
            "Send /bookings after that operation finishes.",
        )
    elif admission is ImmediateAdmission.STOPPING:
        send(
            telegram_user_id,
            "Your login is saved, but BookSaver is shutting down. "
            "The reservation refresh was not started. Send /bookings once it restarts.",
        )
