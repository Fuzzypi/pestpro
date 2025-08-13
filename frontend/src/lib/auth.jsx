import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage, if it exists
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('pestpro_user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });
  
  const navigate = useNavigate();

  // This effect runs whenever the user state changes
  useEffect(() => {
    if (user) {
      // If user exists, store it in localStorage
      localStorage.setItem('pestpro_user', JSON.stringify(user));
    } else {
      // If user is null (logged out), remove it from localStorage
      localStorage.removeItem('pestpro_user');
    }
  }, [user]); // Dependency array ensures this runs only when 'user' changes

  const login = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null); // This will trigger the useEffect to clear localStorage
    navigate('/login', { replace: true });
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
