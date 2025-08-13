import React from 'react';
import { X, Clock } from 'lucide-react';

const DayViewModal = ({ isOpen, onClose, date, jobs }) => {
  if (!isOpen) return null;

  // Filter jobs to show only those on the selected date
  const jobsForDay = jobs.filter(job => job.start.startsWith(date));

  // Format the date for display (e.g., "August 10, 2025")
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Jobs for {formattedDate}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {jobsForDay.length > 0 ? (
            jobsForDay.map(job => (
              <div key={job.id} className="p-3 bg-gray-100 rounded-md border border-gray-200">
                <p className="font-bold text-gray-800">{job.title}</p>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock size={14} className="mr-2" />
                  <span>Status: {job.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No jobs scheduled for this day.</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayViewModal;
