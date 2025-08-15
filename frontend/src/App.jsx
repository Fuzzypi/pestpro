import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';

// Components / Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Jobs from './pages/Jobs';
import NewJob from './pages/NewJob';              // <-- added
import Schedule from './pages/Schedule';
import Agenda from './pages/Agenda';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Marketing from './pages/Marketing';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />

              {/* Customers */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:customerId" element={<CustomerDetail />} />

              {/* Jobs */}
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/new" element={<NewJob />} />   {/* <-- added */}

              {/* Other sections */}
              <Route path="schedule" element={<Schedule />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />

              {/* Default to dashboard when hitting "/" */}
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
