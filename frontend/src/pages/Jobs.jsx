import React, { useState, useEffect } from 'react';
import { Calendar, Plus, List } from 'lucide-react';
import axios from 'axios';
import JobCalendar from '../components/JobCalendar';
import JobModal from '../components/JobModal';
import DayViewModal from '../components/DayViewModal';

const API_URL = 'http://localhost:5000';

const Jobs = ( ) => {
  const [jobs, setJobs] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // <-- State to hold the job being edited
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs`);
      setJobs(response.data);
    } catch (err) {
      setError('Failed to fetch jobs.');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // --- HANDLER FOR CREATING A NEW JOB ---
  const handleJobCreated = (newJob) => {
    setJobs(prevJobs => [...prevJobs, newJob]);
  };

  // --- HANDLER FOR UPDATING AN EXISTING JOB ---
  const handleJobUpdated = (updatedJob) => {
    setJobs(prevJobs => prevJobs.map(job =>
      job.id === updatedJob.id ? updatedJob : job
    ));
  };

  // --- HANDLERS FOR OPENING MODALS ---
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  const handleEventClick = (job) => {
    setSelectedJob(job); // Set the job to be edited
    setIsJobModalOpen(true); // Open the modal
  };

  const openCreateModal = () => {
    setSelectedJob(null); // Ensure we're not in edit mode
    setIsJobModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <button onClick={openCreateModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
          <Plus className="h-4 w-4 mr-2" /> Schedule Job
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {/* View controls... */}
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <JobCalendar jobs={jobs} onDateClick={handleDateClick} onEventClick={handleEventClick} />
      
      <JobModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)}
        onJobCreated={handleJobCreated}
        onJobUpdated={handleJobUpdated}
        existingJob={selectedJob} // Pass the selected job to the modal
      />

      <DayViewModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDate}
        jobs={jobs}
      />
    </div>
  );
};

export default Jobs;
