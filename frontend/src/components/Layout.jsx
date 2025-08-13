import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // This is a good way to handle active link styling.
  const navLinkClasses = ({ isActive }) => 
    isActive 
      ? 'text-white font-bold' 
      : 'text-gray-300 hover:text-white';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">PestPro</h1>
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>
            <NavLink to="/agenda" className={navLinkClasses}>Agenda</NavLink>
            <NavLink to="/jobs" className={navLinkClasses}>Jobs</NavLink>
            <NavLink to="/customers" className={navLinkClasses}>Customers</NavLink>
            <NavLink to="/schedule" className={navLinkClasses}>Schedule</NavLink>
            {/* The Inventory link is already here and correct */}
            <NavLink to="/inventory" className={navLinkClasses}>Inventory</NavLink>
            <NavLink to="/marketing" className={navLinkClasses}>Marketing</NavLink>
            <NavLink to="/reports" className={navLinkClasses}>Reports</NavLink>
          </nav>
          <div className="flex items-center space-x-4">
            <NavLink to="/settings" className={navLinkClasses}>Settings</NavLink>
            {user && (
              <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-300">
                <LogOut size={16} className="mr-1" />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
