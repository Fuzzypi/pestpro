import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const JobModal = ({ isOpen, onClose, onJobUpdated, onJobCreated, existingJob } ) => {
  const [formData, setFormData] = useState({});
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]); // <-- State for technicians
  const [error, setError] = useState('');
  const isEditMode = Boolean(existingJob);

  // Fetch BOTH customers and technicians when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchDropdownData = async () => {
        try {
          const [custRes, techRes] = await Promise.all([
            axios.get(`${API_URL}/api/customers`),
            axios.get(`${API_URL}/api/technicians`)
          ]);
          setCustomers(custRes.data);
          setTechnicians(techRes.data);
        } catch (err) {
          console.error("Failed to fetch dropdown data", err);
        }
      };
      fetchDropdownData();
    }
  }, [isOpen]);

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode && existingJob) {
      setFormData({
        description: existingJob.description || '',
        notes: existingJob.notes || '',
        customerId: existingJob.customer.id || '',
        job_date: existingJob.job_date || '',
        job_time: existingJob.job_time || '',
        technician_id: existingJob.technician_id || '', // <-- Pre-fill technician
      });
    } else {
      setFormData({ description: '', notes: '', customerId: '', job_date: '', job_time: '', technician_id: '' });
    }
  }, [existingJob, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const jobPayload = {
      customer_id: parseInt(formData.customerId),
      description: formData.description,
      notes: formData.notes,
      job_date: formData.job_date,
      job_time: formData.job_time,
      technician_id: formData.technician_id ? parseInt(formData.technician_id) : null, // <-- Include technician
    };

    try {
      if (isEditMode) {
        const response = await axios.put(`${API_URL}/api/jobs/${existingJob.id}`, jobPayload);
        onJobUpdated(response.data);
      } else {
        const response = await axios.post(`${API_URL}/api/jobs`, jobPayload);
        onJobCreated(response.data);
      }
      onClose();
    } catch (err) {
      setError('Failed to save job.');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Job' : 'Schedule New Job'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Customer and Description fields remain the same */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select name="customerId" value={formData.customerId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="">Select a Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>

          {/* --- NEW TECHNICIAN DROPDOWN --- */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician</label>
            <select name="technician_id" value={formData.technician_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="">Unassigned</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          {/* -------------------------------- */}

          {/* Date, Time, and Notes fields remain the same */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="job_date" value={formData.job_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" name="job_time" value={formData.job_time} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-md"></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Save Job</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobModal;
