// frontend/src/components/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogOut, Moon, Sun } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Theme (Dark/Light) ---
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // fall back to system preference
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Active link styling, tuned for dark header
  const navLinkClasses = ({ isActive }) =>
    isActive
      ? 'text-white font-semibold'
      : 'text-white/70 hover:text-white';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="bg-gray-800 text-white shadow-md dark:bg-gray-900">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">PestPro</h1>

          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>
            <NavLink to="/agenda" className={navLinkClasses}>Agenda</NavLink>
            <NavLink to="/jobs" className={navLinkClasses}>Jobs</NavLink>
            <NavLink to="/customers" className={navLinkClasses}>Customers</NavLink>
            <NavLink to="/schedule" className={navLinkClasses}>Schedule</NavLink>
            <NavLink to="/inventory" className={navLinkClasses}>Inventory</NavLink>
            <NavLink to="/marketing" className={navLinkClasses}>Marketing</NavLink>
            <NavLink to="/reports" className={navLinkClasses}>Reports</NavLink>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
              <span className="sr-only">Toggle theme</span>
            </button>

            <NavLink to="/settings" className={navLinkClasses}>Settings</NavLink>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center text-red-300 hover:text-red-200"
              >
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
