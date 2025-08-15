import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Plus, Search, Edit, Trash2, Mail, MapPin, UploadCloud } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { API_URL } from '../lib/api';


const Customers = ( ) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({ id: null, name: '', address: '', phone: '', email: '' });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const navigate = useNavigate();

  const fetchCustomers = async (source) => {
    console.log(`DEBUG: Fetching customers, initiated by: ${source}`);
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/customers`);
      console.log("DEBUG: Raw API response received:", response);

      if (!response || !Array.isArray(response.data)) {
        console.error("FATAL DEBUG: API did not return an array!", response.data);
        setCustomers([]);
        throw new Error("Invalid data format from server.");
      }

      const validData = response.data.filter(c => {
        const isValid = c && typeof c === 'object' && c.id && c.name;
        if (!isValid) {
          console.warn("FATAL DEBUG: Found invalid customer item in API response:", c);
        }
        return isValid;
      });
      
      console.log("DEBUG: Setting clean customers state:", validData);
      setCustomers(validData);

    } catch (err) {
      console.error(`FATAL DEBUG: Error in fetchCustomers (from ${source}):`, err);
      setError('Could not fetch customers. Please ensure the backend is running.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers('Initial Load');
  }, []);

  useEffect(() => {
    if (customers) {
      const filtered = customers.filter(customer => {
        if (!customer) {
            console.error("FATAL DEBUG: Found undefined customer during filtering!");
            return false;
        }
        return (
            (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      });
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const openModalForNew = () => {
    setIsEditing(false);
    setCurrentCustomer({ id: null, name: '', address: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadResult(null);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const action = isEditing ? 'Edit' : 'New';
    console.log(`DEBUG: Submitting form for ${action} customer.`);
    if (!currentCustomer.name) {
      alert('Customer name is required.');
      return;
    }
    const payload = { ...currentCustomer };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/customers/${currentCustomer.id}`, payload);
      } else {
        await axios.post(`${API_URL}/api/customers`, payload);
      }
      closeModal();
      await fetchCustomers(`${action} Submit`);
    } catch (err) {
      console.error(`FATAL DEBUG: Error during form submit for ${action}:`, err);
      setError(`Failed to ${action.toLowerCase()} customer.`);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    console.log(`DEBUG: Deleting customer ID: ${customerId}`);
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/api/customers/${customerId}`);
        await fetchCustomers('Delete');
      } catch (err) {
        console.error(`FATAL DEBUG: Error during delete:`, err);
        setError('Failed to delete customer. They may have associated jobs.');
      }
    }
  };

  const handleFileChange = (event) => {
    setUploadFile(event.target.files[0]);
  };

  const handleUpload = () => {
    console.log("DEBUG: Starting CSV upload process.");
    if (!uploadFile) {
      alert("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    Papa.parse(uploadFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("DEBUG: Papaparse completed. Rows found:", results.data.length);
        const processedCustomers = results.data.map(row => {
          const name = `${row["First Name"] || ''} ${row["Last Name"] || ''}`.trim();
          const address = `${row["Billing Address"] || ''}, ${row["City"] || ''}`.trim().replace(/^,|,$/g, '');
          let phone = '';
          if (row["Phone 1"]) {
            phone = String(row["Phone 1"]).replace(/[^0-9]/g, '');
          }
          const email = row["Email Address"] || '';
          return { name, email, phone, address };
        }).filter(customer => customer.name);

        console.log("DEBUG: Processed customers to upload:", processedCustomers.length);

        if (processedCustomers.length === 0) {
            alert("Could not find any valid customer data in the file. Please check the format.");
            setUploading(false);
            return;
        }
        try {
          const response = await axios.post(`${API_URL}/api/customers/bulk-upload`, { customers: processedCustomers });
          console.log("DEBUG: Bulk upload API response:", response.data);
          if (response.data && response.data.errors && response.data.errors.length > 0) {
            setError('Some records failed to upload. See details below.');
          } else {
            setError('');
          }
          setUploadResult(response.data);
          await fetchCustomers('Bulk Upload');
        } catch (err) {
          console.error("FATAL DEBUG: Error during bulk upload:", err);
          setError('Bulk upload failed. Please check your CSV and try again.');
          setUploadResult({ message: "An error occurred during upload.", errors: [{ error: err.message }] });
        } finally {
          setUploading(false);
        }
      }
    });
  };

  if (loading) return <div className="text-center p-10">Loading customers...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-500">View, add, edit, and manage all your customers.</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={openUploadModal} className="btn-secondary">
                <UploadCloud className="h-4 w-4 mr-2" />
                Upload CSV
            </button>
            <button onClick={openModalForNew} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Customer
            </button>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, address, or email..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                if (!customer || typeof customer !== 'object' || !customer.id || !customer.name) {
                  // Prevent rendering undefined or malformed customer objects
                  return null;
                }
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/customers/${customer.id}`); }}
                    tabIndex={0}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        to={`/customers/${customer.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-700 hover:underline"
                        title="View customer details"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                          <Mail size={12} className="mr-2 text-gray-400"/> {customer.email || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.address ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"
                          title="Click to open in Google Maps"
                        >
                          <MapPin size={12} className="mr-2"/> {customer.address}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModalForEdit(customer); }}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="Edit customer"
                        >
                          <Edit size={14} className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete customer"
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="input mt-1"
                  value={currentCustomer.email || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  placeholder="johndoe@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={currentCustomer.phone || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={currentCustomer.address || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                  placeholder="123 Main St, Anytown, USA"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {isEditing ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Upload Customers via CSV</h3>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Select your CSV file to upload. The uploader will automatically process columns like 'First Name', 'Last Name', 'Billing Address', etc.
                </p>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {uploadFile && <p className="text-sm text-gray-500">Selected file: {uploadFile.name}</p>}
            </div>

            {uploadResult && (
                <div className="mt-4 p-3 rounded-md bg-gray-50">
                    <p className="font-semibold text-gray-800">{uploadResult.message}</p>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                            {uploadResult.errors.map((err, index) => (
                                <li key={index}>{err.data?.name || 'Unknown Row'}: {err.error}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
              <button type="button" className="btn-secondary" onClick={closeUploadModal}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload and Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
