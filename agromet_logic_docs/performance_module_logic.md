# Performance Module Logic & Functionalities

This document outlines the technical logic and user functionalities of the Agromet Lab Performance Module.

## 1. Overview
The performance module is designed to track and evaluate the performance of collaborators based on completed tasks (Agendas). It uses four key Performance Indicators (KPIs) to calculate a composite score for each assignment.

## 2. Key Performance Indicators (KPIs)

### A. Timeliness Score (TS) - 30% Weight
Measures how reliably a collaborator meets deadlines.
- **Early Completion:** 100 points
- **On-Time Completion:** 90 points
- **Late Completion:** 90 points - (10 points × number of days delayed). Minimum score is 0.

### B. Quality Score (QS) - 40% Weight
A subjective rating provided by the task creator or administrator. 
- **Rating Scale:** 1 to 5 stars.
- **Capture Method:** Interactive star rating directly on the **Task Detail page** (AgendaDetailView).
- **Calculation:** `(Rating / 5) × 100`.

### C. Efficiency Score (ES) - 20% Weight
Calculated by comparing the **Estimated Hours** against the **Actual Hours** taken to complete the task.
- **Ratio (Estimated / Actual):**
  - ≥ 1.2 (Finished 20% faster than estimated): 100 points
  - ≥ 1.0 (Finished within estimate): 90 points
  - ≥ 0.8: 70 points
  - < 0.8: 50 points
- **Default:** 90 points if no hours are specified.

### D. Reliability Score (RS) - 10% Weight
Reflects the consistency and communicative reliability of the collaborator.
- **Base Score:** 100 points.
- **Deductions:**
  - **Rework Count:** -10 points per occurrence (task sent back from completion).
  - **Missed Updates:** -5 points per missed scheduled update.

---

## 3. Composite Performance Score
The final score for an assignment is a weighted average of the four KPIs:
`Composite = (TS × 0.30) + (QS × 0.40) + (ES × 0.20) + (RS × 0.10)`

The score is stored in the `AgendaAssignment` model and updated whenever a task is marked as **Completed**.

---

## 4. User Functionalities

### Admin Features
- **Leaderboard:** View a ranked list of all collaborators based on their average composite scores.
- **Detailed Analytics:** Access a "Performance Dashboard" for any collaborator, featuring:
  - Radar chart of KPI strengths.
  - Historical task completion count.
  - Overall performance rating (Excellent, Good, Average, etc.).

### Collaborator Features (Future/Internal)
- Performance scores are primarily for administrative review but guide the internal "Team" rankings.

---

## 5. Technical Implementation Details

- **Backend Logic Location:** `agendas/utils.py` -> `calculate_assignment_performance()`
- **Calculation Trigger:** `agendas/api_views.py` -> `AgendaViewSet.toggle_status()` (when status moves to `completed`).
- **Data Capture:** 
  - **In-Page:** `frontend/src/components/agendas/AgendaDetailView.jsx` provides real-time star ratings via the `/rate/` endpoint.
  - **Fallback:** `frontend/src/components/agendas/CompleteTaskModal.jsx` (Confirmation only).
- **API Endpoints:**
  - `/api/v1/agendas/{id}/rate/` - New endpoint for persistent quality ratings.
  - `/api/v1/collaborators/leaderboard/` - For the overview list.
  - `/api/v1/collaborators/{id}/performance/` - For individual breakdown.
