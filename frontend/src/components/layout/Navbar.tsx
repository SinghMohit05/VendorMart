import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  Store,
  MapPin,
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Package,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';

export const Navbar: React.FC = () => {
  const { user, vendor, admin, logoutUser, logoutVendor, logoutAdmin } = useAuth();
  const { selectedCity, setSelectedCity, supportedCities } = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { compareIds } = useCompare();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                Vendor<span className="text-indigo-600">Mart</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Local Commerce
              </span>
            </div>
          </Link>

          {/* Location Selector (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/70 transition-colors text-xs font-semibold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-slate-500 font-medium">In:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent font-bold text-slate-900 cursor-pointer focus:outline-none pr-1"
            >
              {supportedCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center flex-1 max-w-md relative"
          >
            <input
              type="text"
              placeholder="Search local products, grocery, electronics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </form>

          {/* Nav Right Links & User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Compare shortcut */}
            {compareIds.length > 0 && (
              <Link
                to="/compare"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare ({compareIds.length})</span>
              </Link>
            )}

            {/* Browse / Shop */}
            <Link
              to="/shop"
              className={`hidden sm:inline-flex px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                routerLocation.pathname === '/shop'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Browse Shop
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Customer Account / Orders */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {user.username}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.username}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <Package className="w-3.5 h-3.5" />
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Saved Wishlist
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutUser();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer text-left border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Partner Links (Vendor/Admin) */}
            <div className="hidden xl:flex items-center gap-1 border-l border-slate-200 pl-2">
              {vendor ? (
                <Link
                  to="/vendor/dashboard"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 rounded-lg"
                >
                  Vendor Hub
                </Link>
              ) : admin ? (
                <Link
                  to="/admin/dashboard"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 rounded-lg flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Link>
              ) : (
                <Link
                  to="/vendor/login"
                  className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Vendor Portal
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 py-4 space-y-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm border border-slate-200 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            {/* Mobile Location Selector */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Selected City:</span>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800"
              >
                {supportedCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 rounded-xl text-slate-800 hover:text-indigo-600"
              >
                Browse Shop
              </Link>
              <Link
                to="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 rounded-xl text-slate-800 hover:text-indigo-600 flex items-center justify-between"
              >
                <span>Compare</span>
                {compareIds.length > 0 && (
                  <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.2 rounded-full">
                    {compareIds.length}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 rounded-xl text-slate-800 hover:text-indigo-600"
              >
                Wishlist
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 rounded-xl text-slate-800 hover:text-indigo-600"
              >
                My Orders
              </Link>
            </div>

            {/* Vendor & Admin Mobile Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <Link
                to="/vendor/login"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600 py-1"
              >
                🏪 Vendor Portal
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600 py-1"
              >
                🛡️ Admin Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
