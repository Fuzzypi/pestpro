import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../lib/auth';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Calendar, DollarSign, Archive, CheckCircle, Clock, PlusCircle } from 'lucide-react';

import { API_URL } from '../lib/api';


// --- Reusable Stat Card Component ---
const StatCard = ({ title, value, icon, subtext } ) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
    <div className="bg-gray-100 p-3 rounded-lg mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/dashboard`);
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  if (!data) return <div>Loading dashboard...</div>;

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user ? user.email.split('@')[0] : 'User'}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your pest control business today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={data.stats.totalCustomers} icon={<Users className="text-blue-500" />} subtext="+18 new this month" />
        <StatCard title="Jobs Today" value={data.stats.jobsToday} icon={<Calendar className="text-green-500" />} subtext="34 this week" />
        <StatCard title="Revenue This Month" value={`$${data.stats.revenueThisMonth.toLocaleString()}`} icon={<DollarSign className="text-yellow-500" />} subtext="15% increase from last month" />
        <StatCard title="Inventory Alerts" value={data.stats.inventoryAlerts} icon={<Archive className="text-red-500" />} subtext="2 low stock, 1 reorder" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold mb-4">Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.jobStatusDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label>
                {data.jobStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <ul className="space-y-4">
          {data.recentActivity.map(activity => (
            <li key={activity.id} className="flex items-center space-x-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-sm text-gray-700">{activity.description}</p>
              <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
