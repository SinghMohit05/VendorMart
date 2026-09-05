import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CompareProvider } from './context/CompareContext';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { CompareDrawer } from './components/product/CompareDrawer';

// Pages
import { HomePage } from './pages/home/HomePage';
import { ShopPage } from './pages/shop/ShopPage';
import { ProductDetailPage } from './pages/product/ProductDetailPage';
import { ComparePage } from './pages/compare/ComparePage';
import { WishlistPage } from './pages/wishlist/WishlistPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuthPage } from './pages/auth/AuthPage';
import { VendorLoginPage } from './pages/vendor/VendorLoginPage';
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 3, // 3 minutes cache
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LocationProvider>
          <AuthProvider>
            <CartProvider>
              <CompareProvider>
                <BrowserRouter>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <CartDrawer />
                    <CompareDrawer />

                    <main className="flex-1">
                      <Routes>
                        {/* Customer routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route path="/compare" element={<ComparePage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />

                        {/* Vendor routes */}
                        <Route path="/vendor/login" element={<VendorLoginPage />} />
                        <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
                        <Route path="/vendor/orders" element={<VendorDashboardPage />} />
                        <Route path="/vendor/inventory" element={<VendorDashboardPage />} />

                        {/* Admin routes */}
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

                        {/* Catch all fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>

                    <Footer />
                  </div>
                </BrowserRouter>
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </LocationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
