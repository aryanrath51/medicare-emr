const MOCK_DB = [
    {id: "1", patientName: "Alice Johnson", date: "2023-10-27", time: "09:00", duration: "30 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
    {id: "2", patientName: "Bob Williams", date: "2023-10-27", time: "10:30", duration: "45 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "Virtual"},
    {id: "3", patientName: "Charlie Brown", date: "2023-10-28", time: "14:00", duration: "30 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
    {id: "4", patientName: "Diana Prince", date: "2023-10-26", time: "11:00", duration: "60 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
    {id: "5", patientName: "Evan Wright", date: "2023-10-29", time: "09:30", duration: "30 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "Virtual"},
    {id: "6", patientName: "Fiona Gallagher", date: "2023-10-27", time: "16:00", duration: "30 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "Virtual"},
    {id: "7", patientName: "George Martin", date: "2023-10-30", time: "13:00", duration: "45 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
    {id: "8", patientName: "Hannah Abbott", date: "2023-10-27", time: "08:00", duration: "15 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
    {id: "9", patientName: "Ian Somerhalder", date: "2023-11-01", time: "10:00", duration: "60 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "Virtual"},
    {id: "10", patientName: "Jane Doe", date: "2023-10-25", time: "15:00", duration: "30 min", doctorName: "Dr. Rath", status: "Scheduled", mode: "In-Person"},
];
export const get_appointments = async (filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let result = [...MOCK_DB];
    if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(appt => appt.patientName.toLowerCase().includes(query));
    }
    if (filters.date) {
        result = result.filter(appt => appt.date === filters.date);
    }
    const todayStr = "2023-10-27";
    if (filters.tab === 'Upcoming') {
        result = result.filter(appt => appt.date > todayStr || (appt.date === todayStr && appt.status === 'Upcoming'));
    } else if (filters.tab === 'Past') {
        result = result.filter(appt => appt.date < todayStr);
    } else if (filters.tab === 'Today' && !filters.date) {
        result = result.filter(appt => appt.date === todayStr);
    }
    return result;
};
export const update_appointment_status = async (id, newStatus) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DB.findIndex(appt => appt.id === id);
    if (index !== -1) {
        MOCK_DB[index].status = newStatus;
        return MOCK_DB[index];
    }
    return null;
};
export const create_appointment = async (newAppt) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    MOCK_DB.push(newAppt);
    return newAppt;
};
export const delete_appointment = async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DB.findIndex(appt => appt.id === id);
    if (index !== -1) {
        MOCK_DB.splice(index, 1);
    }
};
export const update_appointment_details = async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DB.findIndex(appt => appt.id === id);
    if (index !== -1) {
        MOCK_DB[index] = { ...MOCK_DB[index], ...updates };
        return MOCK_DB[index];
    }
    return null;
};