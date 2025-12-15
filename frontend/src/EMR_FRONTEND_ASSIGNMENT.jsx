import React, { useState, useEffect } from 'react';
import { get_appointments, update_appointment_status, create_appointment, delete_appointment, update_appointment_details } from './services/api_bridge';

// --- Icons (Using SVG directly to avoid dependency issues) ---
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
);

const AppointmentManagementView = () => {
  // --- State Management ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState('Today'); // 'Today', 'Upcoming', 'Past'
  const [selectedDate, setSelectedDate] = useState('2023-10-27'); // Default simulation date
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [currentView, setCurrentView] = useState('appointments');
  const [currentMonth, setCurrentMonth] = useState(new Date('2023-10-01'));
  const [appointmentCounts, setAppointmentCounts] = useState({});
  const [notification, setNotification] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Prepare filters based on interaction
      // Note: If a specific date is clicked on calendar, we prioritize that.
      // If a Tab is clicked, we might clear the specific date or filter differently.
      
      const filters = {};
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      // If user is on "Today" tab, we force the date filter
      if (activeTab === 'Today') {
        filters.tab = 'Today';
        filters.date = selectedDate; // Use selected date
      } else {
        filters.tab = activeTab;
        // If we are in Upcoming/Past, we might ignore the specific calendar date 
        // or use it as a starting point. For this assignment, let's say 
        // Calendar click overrides Tab logic for specific date viewing.
      }

      // Call the Simulated Python Service
      const data = await get_appointments(filters);
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarDots = async () => {
    try {
      const allAppts = await get_appointments({});
      const counts = {};
      allAppts.forEach(appt => {
        counts[appt.date] = (counts[appt.date] || 0) + 1;
      });
      setAppointmentCounts(counts);
    } catch (error) {
      console.error("Failed to fetch calendar dots", error);
    }
  };

  // Effect: Fetch data when Tab or Date changes
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedDate, searchQuery]);

  useEffect(() => {
    fetchCalendarDots();
  }, []);

  // --- Handlers ---
  const handleStatusUpdate = async (id, newStatus) => {
    // Optimistic UI Update (optional, but good UX)
    const previousAppointments = [...appointments];
    setAppointments(prev => prev.map(appt => 
      appt.id === id ? { ...appt, status: newStatus } : appt
    ));

    try {
      await update_appointment_status(id, newStatus);
      // In a real AppSync setup, a subscription would trigger here to refresh data
      let notificationData = null;
      if (newStatus === 'Confirmed') notificationData = { message: "Appointment Confirmed", type: "success" };
      else if (newStatus === 'Cancelled') notificationData = { message: "Appointment Cancelled", type: "error" };
      else if (newStatus === 'Scheduled') notificationData = { message: "Cancellation Undone", type: "info" };

      if (notificationData) {
        setNotification(notificationData);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      // Revert on failure
      setAppointments(previousAppointments);
      alert("Failed to update status");
    }
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    // If clicking a date, usually we switch to a "Day View" or "Today" equivalent
    setActiveTab('Today'); 
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editingAppointment) {
      // Update existing appointment
      const updates = {
        patientName: formData.get('patientName'),
        date: formData.get('date'),
        time: formData.get('time'),
      };
      
      setAppointments(prev => prev.map(appt => appt.id === editingAppointment.id ? { ...appt, ...updates } : appt));
      await update_appointment_details(editingAppointment.id, updates);
      setNotification({ message: "Appointment Updated", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Create new appointment
      const newAppt = {
        id: Date.now().toString(),
        patientName: formData.get('patientName'),
        date: formData.get('date'),
        time: formData.get('time'),
        duration: '30 min',
        doctorName: 'Dr. Rath',
        status: 'Scheduled',
        mode: 'In-Person'
      };
      setAppointments(prev => [...prev, newAppt]);
      await create_appointment(newAppt);
    }
    
    fetchCalendarDots();
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
  };

  const handleJumpToToday = () => {
    const simulationToday = new Date('2023-10-27');
    setCurrentMonth(new Date(simulationToday.getFullYear(), simulationToday.getMonth(), 1));
    setSelectedDate('2023-10-27');
    setActiveTab('Today');
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    const previousAppointments = [...appointments];
    setAppointments(prev => prev.filter(appt => appt.id !== appointmentToDelete));

    try {
      await delete_appointment(appointmentToDelete);
      fetchCalendarDots();
    } catch (error) {
      setAppointments(previousAppointments);
      alert("Failed to delete appointment");
    } finally {
      setAppointmentToDelete(null);
    }
  };

  // --- Render Helpers ---
  const getStatusColor = (status) => {
    switch(status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar (Visual Placeholder) */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col p-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">MediCare EMR</h1>
        <nav className="space-y-2">
          <button 
            type="button"
            onClick={() => setCurrentView('appointments')}
            className={`w-full text-left p-2 rounded font-medium ${currentView === 'appointments' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Appointments
          </button>
          <button 
            type="button"
            onClick={() => setCurrentView('patients')}
            className={`w-full text-left p-2 rounded font-medium ${currentView === 'patients' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Patients
          </button>
          <button 
            type="button"
            onClick={() => setCurrentView('messages')}
            className={`w-full text-left p-2 rounded font-medium ${currentView === 'messages' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Messages
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentView === 'appointments' && 'Appointment Management'}
            {currentView === 'patients' && 'Patient Records'}
            {currentView === 'messages' && 'Messages'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Dr. Rath</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center">R</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {currentView === 'appointments' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Calendar & Filters */}
            <div className="lg:col-span-1 space-y-6">
              {/* Calendar Widget */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex flex-col items-center">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={handleJumpToToday} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Jump to Today</button>
                  </div>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-gray-400 dark:text-gray-500 py-1">{d}</div>)}
                  
                  {/* Empty slots for days before start of month */}
                  {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay())].map((_, i) => (
                    <div key={`empty-${i}`} className="py-2"></div>
                  ))}

                  {/* Days */}
                  {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate())].map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const count = appointmentCounts[dateStr] || 0;
                    return (
                      <button 
                        key={day}
                        onClick={() => handleDateClick(dateStr)}
                        title={count > 0 ? `${count} Appointment${count !== 1 ? 's' : ''}` : undefined}
                        className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors relative ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {day}
                        {count > 0 && (
                          <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Appointment List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-fit">
                  {['Today', 'Upcoming', 'Past'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleClearFilters}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <SearchIcon />
                    </div>
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAppointment(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm whitespace-nowrap"
                  >
                    + New
                  </button>
                </div>
              </div>

              {/* List Content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No appointments found for this filter.</div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {appointments.map((appt) => (
                      <li key={appt.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            {/* Time Box */}
                            <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg min-w-[80px]">
                              <span className="text-lg font-bold">{appt.time}</span>
                              <span className="text-xs">{appt.duration}</span>
                            </div>
                            
                            {/* Details */}
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{appt.patientName}</h4>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1 space-x-3">
                                <span className="flex items-center"><UserIcon />&nbsp;{appt.doctorName}</span>
                                <span className="flex items-center"><ClockIcon />&nbsp;{appt.mode}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions & Status */}
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                              {appt.status}
                            </span>
                            
                            {/* Status Update Actions */}
                            <div className="flex space-x-2 mt-2">
                              {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                                <>
                                  <button 
                                    onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                                    className="text-xs text-green-600 hover:underline"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditingAppointment(appt);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-xs text-blue-600 hover:underline flex items-center"
                                  ><EditIcon />&nbsp;Edit</button>
                                </>
                              )}
                              {appt.status === 'Cancelled' && (
                                <button 
                                  onClick={() => handleStatusUpdate(appt.id, 'Scheduled')}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Undo
                                </button>
                              )}
                              {(appt.status === 'Cancelled' || appt.status === 'Completed') && (
                                <button 
                                  onClick={() => setAppointmentToDelete(appt.id)}
                                  className="text-xs text-gray-500 hover:text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-lg">The {currentView} module is currently under development.</p>
            </div>
          )}
        </main>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>
            <form onSubmit={handleSaveAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient Name</label>
                <input name="patientName" type="text" defaultValue={editingAppointment?.patientName} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2" placeholder="Enter patient name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <input name="date" type="date" defaultValue={editingAppointment?.date || selectedDate} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                  <input name="time" type="time" defaultValue={editingAppointment?.time} required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingAppointment(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingAppointment ? 'Save Changes' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {appointmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">Delete Appointment</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to permanently delete this appointment?</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setAppointmentToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default AppointmentManagementView;