from datetime import datetime

# --- Data Mocking (Simulating Aurora Fetch) ---
MOCK_DB = [
    {"id": "1", "patientName": "Alice Johnson", "date": "2023-10-27", "time": "09:00", "duration": "30 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
    {"id": "2", "patientName": "Bob Williams", "date": "2023-10-27", "time": "10:30", "duration": "45 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "Virtual"},
    {"id": "3", "patientName": "Charlie Brown", "date": "2023-10-28", "time": "14:00", "duration": "30 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
    {"id": "4", "patientName": "Diana Prince", "date": "2023-10-26", "time": "11:00", "duration": "60 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
    {"id": "5", "patientName": "Evan Wright", "date": "2023-10-29", "time": "09:30", "duration": "30 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "Virtual"},
    {"id": "6", "patientName": "Fiona Gallagher", "date": "2023-10-27", "time": "16:00", "duration": "30 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "Virtual"},
    {"id": "7", "patientName": "George Martin", "date": "2023-10-30", "time": "13:00", "duration": "45 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
    {"id": "8", "patientName": "Hannah Abbott", "date": "2023-10-27", "time": "08:00", "duration": "15 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
    {"id": "9", "patientName": "Ian Somerhalder", "date": "2023-11-01", "time": "10:00", "duration": "60 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "Virtual"},
    {"id": "10", "patientName": "Jane Doe", "date": "2023-10-25", "time": "15:00", "duration": "30 min", "doctorName": "Dr. Rath", "status": "Scheduled", "mode": "In-Person"},
]

def get_appointments(filters=None):
    """
    Simulates a GraphQL Query to fetch appointments.
    Args:
        filters (dict): Optional dictionary containing 'date' or 'status'.
    Returns:
        list: Filtered list of appointments.
    """
    if not filters:
        return MOCK_DB

    result = MOCK_DB

    # Filter by Date (Exact Match)
    if 'date' in filters and filters['date']:
        result = [appt for appt in result if appt['date'] == filters['date']]

    # Filter by Status
    if 'status' in filters and filters['status']:
        result = [appt for appt in result if appt['status'] == filters['status']]
        
    # Logic for "Tabs" (Today, Upcoming, Past) usually happens here or frontend
    # For this assignment, we return the raw filtered list.
    return result

def update_appointment_status(appt_id, new_status):
    """
    Simulates a GraphQL Mutation to update appointment status.
    Args:
        appt_id (str): The ID of the appointment.
        new_status (str): The new status to set.
    Returns:
        dict: The updated appointment object or None if not found.
    """
    for appt in MOCK_DB:
        if appt['id'] == appt_id:
            appt['status'] = new_status
            
            # --- ARCHITECTURE NOTE ---
            # 1. Aurora Transactional Write:
            #    In a real scenario, we would execute:
            #    cursor.execute("UPDATE appointments SET status = %s WHERE id = %s", (new_status, appt_id))
            #    connection.commit()
            
            # 2. AppSync Subscription Trigger:
            #    After the DB write is successful, AppSync would detect the change (via Lambda return or Direct Resolver).
            #    It publishes a message to the 'onUpdateAppointment' subscription topic.
            #    Connected clients (React Frontend) receive the payload via WebSocket and update their cache.
            
            return appt
            
    return None

# Example Usage for testing
if __name__ == "__main__":
    print("Fetching appointments for 2023-10-27:")
    print(get_appointments({'date': '2023-10-27'}))
    
    print("\nUpdating ID 1 to 'Cancelled':")
    print(update_appointment_status("1", "Cancelled"))