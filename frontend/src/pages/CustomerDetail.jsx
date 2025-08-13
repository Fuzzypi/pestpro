import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// --- THIS IS THE CORRECTED LINE ---
import { User, Mail, Phone, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const CustomerDetail = ( ) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { customerId } = useParams(); // Gets the ID from the URL

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/customers/${customerId}`);
        setCustomer(response.data);
      } catch (err) {
        setError('Could not fetch customer details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  // This function was unused, so it can be removed for cleanliness, but it's not causing the error.
  // const getStatusIcon = (status) => { ... };

  if (loading) return <div className="text-center p-10">Loading customer details...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;
  if (!customer) return <div className="text-center p-10">No customer found.</div>;

  return (
    <div className="space-y-6">
      {/* Customer Info Header */}
      <div className="card">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail size={16} className="mr-2 text-gray-400" />
              <span>{customer.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center">
              <Phone size={16} className="mr-2 text-gray-400" />
              <span>{customer.phone || 'No phone provided'}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-gray-400" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address || '' )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {customer.address || 'No address provided'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Job History */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Job History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.jobs && customer.jobs.length > 0 ? (
                  customer.jobs.map(job => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{job.job_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{job.technician_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No job history found for this customer.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
