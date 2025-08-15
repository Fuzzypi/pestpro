import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

import { API_URL } from '../lib/api';


// Helper to get today's date in YYYY-MM-DD format
const getTodayString = ( ) => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!selectedDate) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/agenda/${selectedDate}`);
        setJobs(response.data);
      } catch (err) {
        setError(`Failed to fetch agenda for ${selectedDate}.`);
        console.error(err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [selectedDate]); // Refetch whenever the date changes

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily Agenda</h1>
          <p className="text-gray-600">A summary of all jobs for the selected day.</p>
        </div>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Schedule for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Time</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Job</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Technician</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length > 0 ? (
                  jobs.map(job => (
                    <tr key={job.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{job.job_time}</td>
                      <td className="py-3 px-4">{job.customer.name}</td>
                      <td className="py-3 px-4">{job.description}</td>
                      <td className="py-3 px-4">{job.technician_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">No jobs scheduled for this day.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
