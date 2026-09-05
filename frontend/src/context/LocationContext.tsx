import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export const SUPPORTED_CITIES = [
  'Mumbai',
  'Bangalore',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Pune'
];

interface LocationContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  supportedCities: string[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setCityState] = useState<string>(() => {
    return localStorage.getItem('userCity') || 'Mumbai';
  });
  const { showToast } = useToast();

  const setSelectedCity = (city: string) => {
    setCityState(city);
    localStorage.setItem('userCity', city);
    showToast(`Location set to ${city}. Showing local vendor prices.`, 'success');
  };

  useEffect(() => {
    if (!localStorage.getItem('userCity')) {
      localStorage.setItem('userCity', 'Mumbai');
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        supportedCities: SUPPORTED_CITIES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
