import React, { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';

interface CompareContextType {
  compareIds: number[];
  toggleCompare: (productId: number, productName?: string) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const { showToast } = useToast();

  const toggleCompare = (productId: number, productName: string = 'Product') => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        showToast(`Removed ${productName} from comparison`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        if (prev.length >= 4) {
          showToast('You can compare up to 4 products at once', 'error');
          return prev;
        }
        showToast(`Added ${productName} to comparison`, 'success');
        return [...prev, productId];
      }
    });
  };

  const isInCompare = (productId: number) => compareIds.includes(productId);

  const clearCompare = () => setCompareIds([]);

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
