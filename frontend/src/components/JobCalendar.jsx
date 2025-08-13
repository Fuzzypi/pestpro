import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// The calendar now needs to know about the jobs AND how to open the modal for editing
const JobCalendar = ({ jobs, onDateClick, onEventClick }) => {
  
  // When a user clicks on an existing job/event on the calendar...
  const handleEventClick = (clickInfo) => {
    // Find the full job object from our state that matches the clicked event's ID
    const jobId = clickInfo.event.id;
    const jobData = jobs.find(j => j.id === parseInt(jobId));
    if (jobData) {
      onEventClick(jobData); // Pass the full job object to the parent
    }
  };

  const handleDateClick = (arg) => {
    onDateClick(arg.dateStr);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        events={jobs}
        eventClick={handleEventClick} // <-- This now opens the edit modal
        dateClick={handleDateClick}
        editable={true}
        selectable={true}
      />
    </div>
  );
};

export default JobCalendar;
