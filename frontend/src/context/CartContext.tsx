import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (vendorProductId: number) => void;
  updateQuantity: (vendorProductId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartSavings: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vendormart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vendormart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.vendor_product_id === item.vendor_product_id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + item.quantity;
        const finalQty = Math.min(newQty, item.stock);
        updated[existingIndex].quantity = finalQty;
        showToast(`Updated '${item.name}' quantity to ${finalQty}`, 'success');
        return updated;
      } else {
        showToast(`Added '${item.name}' from ${item.shop_name} to cart!`, 'success');
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (vendorProductId: number) => {
    setCartItems((prev) => {
      const filtered = prev.filter((i) => i.vendor_product_id !== vendorProductId);
      showToast('Item removed from cart', 'info');
      return filtered;
    });
  };

  const updateQuantity = (vendorProductId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(vendorProductId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.vendor_product_id === vendorProductId) {
          const clampedQty = Math.min(quantity, i.stock);
          return { ...i, quantity: clampedQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.final_price * item.quantity, 0);
  const cartSavings = Math.max(0, cartSubtotal - cartTotal);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartSavings,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
