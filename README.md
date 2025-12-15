# MediCare EMR - Appointment Scheduling & Queue Management

## Live Demo
**[View Live Application](https://medicare-emr-z1qb.vercel.app/)**

## Overview
This project implements a comprehensive Appointment Scheduling and Queue Management system (Feature B) for an Electronic Medical Record (EMR) application. It features a responsive React frontend styled with Tailwind CSS and a simulated Python backend service logic.

## Features Implemented

### Frontend (React + Tailwind CSS)
- **Dynamic Calendar Widget:**
  - Month navigation (Next/Prev).
  - "Jump to Today" functionality.
  - Visual dot indicators for days with appointments.
  - Tooltips showing appointment counts per day.
- **Appointment Management:**
  - **View:** Filter by tabs (Today, Upcoming, Past) and specific dates.
  - **Search:** Real-time filtering by patient name.
  - **Create:** Modal form to schedule new appointments.
  - **Edit:** Update appointment details (Patient Name, Date, Time).
  - **Status Actions:** Confirm, Cancel, and Undo Cancellation of appointments.
  - **Delete:** Permanently remove appointments with a confirmation dialog.
- **UI/UX Enhancements:**
  - **Toast Notifications:** Animated slide-in notifications for success, error, and info states.
  - **Sidebar Navigation:** Switch between Appointments, Patients, and Messages views.
  - **Responsive Design:** Optimized for various screen sizes.

## Architecture & Data Consistency

### GraphQL Query Structure (Simulated)
The `get_appointments` function (mirrored in `api_bridge.js`) simulates a GraphQL Resolver.
- **Input:** `FilterInput { date: String, status: String }`
- **Output:** `[Appointment]`
- **Logic:** The resolver accepts optional filters. In a real AppSync environment, this would map to a VTL template querying an Aurora PostgreSQL database.

### Data Consistency (Update Mutation)
The `update_appointment_status` and `update_appointment_details` functions ensure consistency through a two-step process (simulated in comments):
1.  **Transactional Write:** The Python Lambda connects to Aurora and executes a SQL `UPDATE` within a transaction block. This ensures Atomicity (ACID compliance).
2.  **Real-time Subscription:** Upon a successful DB write, AppSync triggers a Subscription (`onUpdateAppointment`). The frontend listens to this subscription to update the local state immediately, ensuring all connected clients see the status change without refreshing.

## How to Run

1.  **Navigate to Frontend Directory:**
    ```bash
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run Application:**
    ```bash
    npm start
    ```
    *Note: The frontend uses `src/services/api_bridge.js` to simulate the Python backend logic directly in the browser for demonstration purposes.*

## Key Files
- `frontend/src/EMR_Frontend_Assignment.jsx`: Main React component containing the UI and state logic.
- `frontend/src/services/api_bridge.js`: JavaScript simulation of the backend logic and database.
- `backend/appointment_service.py`: The core Python logic for the microservice (Task 1).
