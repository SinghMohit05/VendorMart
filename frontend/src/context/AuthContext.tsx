import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vendor, Admin } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  vendor: Vendor | null;
  admin: Admin | null;
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  loginVendor: (vendorData: Vendor) => void;
  logoutVendor: () => void;
  loginAdmin: (adminData: Admin) => void;
  logoutAdmin: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [vendor, setVendor] = useState<Vendor | null>(() => {
    const saved = localStorage.getItem('vendor');
    return saved ? JSON.parse(saved) : null;
  });

  const [admin, setAdmin] = useState<Admin | null>(() => {
    const saved = localStorage.getItem('admin');
    return saved ? JSON.parse(saved) : null;
  });

  const loginUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    showToast(`Welcome back, ${userData.username}!`, 'success');
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    showToast('Logged out successfully.', 'info');
  };

  const loginVendor = (vendorData: Vendor) => {
    setVendor(vendorData);
    localStorage.setItem('vendor', JSON.stringify(vendorData));
    showToast(`Welcome, ${vendorData.shop_name}!`, 'success');
  };

  const logoutVendor = () => {
    setVendor(null);
    localStorage.removeItem('vendor');
    showToast('Vendor logged out.', 'info');
  };

  const loginAdmin = (adminData: Admin) => {
    setAdmin(adminData);
    localStorage.setItem('admin', JSON.stringify(adminData));
    showToast(`Welcome, Administrator ${adminData.name}!`, 'success');
  };

  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
    showToast('Admin logged out.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        vendor,
        admin,
        loginUser,
        logoutUser,
        loginVendor,
        logoutVendor,
        loginAdmin,
        logoutAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
