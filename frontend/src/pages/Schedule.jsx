import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';

import { API_URL } from '../lib/api';


const Schedule = ( ) => {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [jobsResponse, techsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/jobs`),
        axios.get(`${API_URL}/api/technicians`)
      ]);
      setEvents(jobsResponse.data);
      setResources(techsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch schedule data.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- THIS IS THE NEW FUNCTION FOR DRAG-AND-DROP ---
  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    const newResourceId = dropInfo.newResource ? dropInfo.newResource.id : null;
    
    const updatedJobPayload = {
      start: event.start.toISOString(), // The new date and time
      technician_id: newResourceId ? parseInt(newResourceId) : null, // The new technician
    };

    try {
      // Send the update to the backend
      await axios.put(`${API_URL}/api/jobs/${event.id}`, updatedJobPayload);
      
      // Optimistically update the UI right away for a smooth experience
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === parseInt(event.id) 
          ? { ...e, start: event.start.toISOString(), resourceId: newResourceId } 
          : e
      ));

    } catch (err) {
      setError('Failed to update job. Please try again.');
      console.error(err);
      // If the API call fails, revert the change in the UI
      dropInfo.revert();
    }
  };
  // ----------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Technician Schedule</h1>
        <p className="text-gray-600">Drag and drop to assign or reschedule jobs.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          resourceAreaWidth="15%"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
          }}
          editable={true}
          resources={resources}
          events={events}
          eventDrop={handleEventDrop} // <-- ADD THIS HANDLER
        />
      </div>
    </div>
  );
};

export default Schedule;
