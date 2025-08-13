import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure axios is imported
import { Mail, MessageSquare, Share2, Plus, Zap, TrendingUp, Users, Eye } from 'lucide-react';

const API_URL = 'http://localhost:5000'; // Define API URL

const Marketing = ( ) => {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'Email',
    audience: 'Residential',
    service: 'general'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- FETCH REAL DATA FROM BACKEND ---
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/marketing`);
        setCampaigns(response.data);
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
        setError("Could not load campaign data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // --- SIMULATE AI CONTENT (NO CHANGE NEEDED) ---
  const generateAIContent = async () => {
    const aiContent = {
      subject: `Professional ${newCampaign.service} Services - Long Pro Pest Control`,
      content: `Dear Valued Customer,\n\nAs Cleveland's trusted pest control experts, Long Pro Pest Control is here to protect your property with our professional ${newCampaign.service} services.\n\nOur experienced technicians use the latest techniques and eco-friendly solutions to ensure your home or business remains pest-free. With over [X] years of experience serving the Cleveland area, we understand the unique challenges our local environment presents.\n\nSpecial Offer: Schedule your ${newCampaign.service} service this month and receive 15% off your first treatment!\n\nWhy Choose Long Pro Pest Control:\n• Licensed and insured professionals\n• Eco-friendly treatment options\n• 100% satisfaction guarantee\n• Emergency service available\n• Competitive pricing\n\nDon't let pests disrupt your peace of mind. Contact us today to schedule your consultation.\n\nBest regards,\nThe Long Pro Pest Control Team\nCleveland, OH\n\nCall: (216) XXX-XXXX\nVisit: www.longpropc.com`
    };
    return aiContent;
  };

  // --- HANDLE CREATING CAMPAIGN VIA API ---
  const handleCreateCampaign = async () => {
    const aiContent = await generateAIContent();
    
    const payload = {
      name: newCampaign.name,
      type: newCampaign.type,
      audience: newCampaign.audience,
      content: aiContent
    };

    try {
      const response = await axios.post(`${API_URL}/api/marketing`, payload);
      setCampaigns([response.data, ...campaigns]); // Add new campaign to the top
      setShowCreateModal(false);
      setNewCampaign({ name: '', type: 'Email', audience: 'Residential', service: 'general' });
    } catch (err) {
      console.error("Failed to create campaign", err);
      setError("Could not create campaign. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  if (loading) return <div className="text-center p-10">Loading marketing data...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marketing Automation</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered marketing campaigns for Long Pro Pest Control
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card"><div className="flex items-center"><div className="flex-shrink-0"><div className="p-3 rounded-lg bg-blue-100"><Mail className="h-6 w-6 text-blue-600" /></div></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Total Sent</p><p className="text-2xl font-semibold text-gray-900">{totalSent.toLocaleString()}</p></div></div></div>
        <div className="card"><div className="flex items-center"><div className="flex-shrink-0"><div className="p-3 rounded-lg bg-green-100"><Eye className="h-6 w-6 text-green-600" /></div></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Open Rate</p><p className="text-2xl font-semibold text-gray-900">{openRate}%</p></div></div></div>
        <div className="card"><div className="flex items-center"><div className="flex-shrink-0"><div className="p-3 rounded-lg bg-purple-100"><Users className="h-6 w-6 text-purple-600" /></div></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Active Campaigns</p><p className="text-2xl font-semibold text-gray-900">{campaigns.filter(c => c.status === 'Active').length}</p></div></div></div>
        <div className="card"><div className="flex items-center"><div className="flex-shrink-0"><div className="p-3 rounded-lg bg-yellow-100"><TrendingUp className="h-6 w-6 text-yellow-600" /></div></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Revenue Generated</p><p className="text-2xl font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p></div></div></div>
      </div>

      {/* AI Content Generator */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-start">
          <Zap className="h-6 w-6 text-primary-600 mt-1" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">AI Content Generator</h3>
            <p className="mt-1 text-sm text-gray-600">Generate professional marketing content tailored for your pest control business using AI. Our system creates personalized emails, SMS messages, and social media posts that resonate with your Cleveland customers.</p>
            <div className="mt-4"><button className="btn-primary" onClick={() => setShowCreateModal(true)}><Zap className="h-4 w-4 mr-2" />Generate AI Content</button></div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Marketing Campaigns</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Audience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{campaign.name}</div><div className="text-sm text-gray-500">Created: {campaign.createdDate}</div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm text-gray-900">{campaign.type}</div><div className="text-sm text-gray-500">{campaign.audience}</div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm text-gray-900">Sent: {campaign.sent} | Opened: {campaign.opened}</div><div className="text-sm text-gray-500">Clicked: {campaign.clicked} | Rate: {campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0}%</div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${campaign.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>{campaign.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex space-x-2"><button className="text-primary-600 hover:text-primary-900">Edit</button><button className="text-blue-600 hover:text-blue-900">View</button>{campaign.status === 'Draft' && (<button className="text-green-600 hover:text-green-900">Send</button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create AI-Powered Campaign</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                  <input
                    type="text"
                    className="input mt-1"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    placeholder="e.g., Summer Bed Bug Prevention"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
                  <select
                    className="input mt-1"
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                  >
                    <option value="Email">Email Campaign</option>
                    <option value="SMS">SMS Campaign</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <select
                    className="input mt-1"
                    value={newCampaign.audience}
                    onChange={(e) => setNewCampaign({...newCampaign, audience: e.target.value})}
                  >
                    <option value="Residential">Residential Customers</option>
                    <option value="Commercial">Commercial Customers</option>
                    <option value="All">All Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Focus</label>
                  <select
                    className="input mt-1"
                    value={newCampaign.service}
                    onChange={(e) => setNewCampaign({...newCampaign, service: e.target.value})}
                  >
                    <option value="general">General Pest Control</option>
                    <option value="bed bug">Bed Bug Treatment</option>
                    <option value="termite">Termite Control</option>
                    <option value="rodent">Rodent Control</option>
                    <option value="commercial">Commercial Services</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
