# Agenda Status & Notification Logic

This document details the automated logic for task status transitions and the notification system in the Agromet Lab platform.

## 1. Automated Status Calculation
The system uses `agendas.utils.calculate_status` to determine the initial state of a task based on its dates:
- **Pending:** Current time is before the start `date` and `time`.
- **In-Progress:** Current time is between the start and `expected_finish_date`.
- **Completed:** Current time is after the `expected_finish_date` (Status toggle overrides this).

## 2. Notification Rules & Alerts

The `check_and_create_alerts` utility runs periodically (via background tasks or on login) to trigger the following rules:

### A. Stagnation Rule
- **Condition:** Task is in `pending` status, but the start `date`/`time` has already passed.
- **Alert:** "Gentle Reminder" - Notifies the user that the task was scheduled to start.

### B. 80% Time Elapsed Rule (Deadline Warning)
- **Condition:** Task is `in-progress`.
- **Logic:** `(Now - StartTime) / (Deadline - StartTime) ≥ 0.8`.
- **Alert:** "Time Check" - Warns the user that 80% of the allocated time has passed.

### C. Milestone Approaching (Immediate Warning)
- **Condition:** Task is not `completed` and the deadline is within the next 2 hours.
- **Alert:** "Upcoming Milestone" - Notifies the user of the imminent deadline.

### D. Overdue Rule
- **Condition:** Task is not `completed` and the deadline has passed.
- **Alert:** "Milestone Overlooked" - Alerts the user that the task is officially overdue.

### E. Schedule Reminders
- **Condition:** Private schedule (`Schedule` model) is starting in exactly 30 minutes.
- **Alert:** "Schedule Due Soon" - Provides a 30-minute head-start reminder.

---

## 3. Communication Channels
All alerts are broadcast through three distinct channels:
1. **Internal System Notifications:** Visible in the "Notification Archive".
2. **WebSocket Push:** Real-time "toast" messages appearing instantly in the browser.
3. **Email Notifications:** Premium HTML emails sent to the collaborator's registered email address.
4. **Native Browser Push:** Mobile-style OS notifications (if user has enabled them).

## 4. Technical Implementation
- **Core Logic:** `agendas/utils.py` -> `check_and_create_alerts()`
- **Email Delivery:** `agendas/utils.py` -> `send_notification_email()`
- **WebSocket Backend:** `agendas/consumers.py`
