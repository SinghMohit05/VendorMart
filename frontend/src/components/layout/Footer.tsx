import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, MapPin, Heart, ArrowUpRight } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export const Footer: React.FC = () => {
  const { supportedCities, setSelectedCity } = useLocation();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tight">
                Vendor<span className="text-indigo-400">Mart</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              VendorMart empowers smart local shopping. Compare prices across trusted neighborhood
              vendors, unlock verified discounts, and enjoy seamless store pickups.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Local Pricing Verified
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Marketplace
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  Price Comparison
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Local Cities */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Supported Cities
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {supportedCities.map((city) => (
                <li key={city}>
                  <button
                    onClick={() => {
                      setSelectedCity(city);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{city}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner & Business Portals */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              For Partners
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link
                  to="/vendor/login"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Vendor Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor/dashboard"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Shop Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Hub</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 VendorMart Platform. All local rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for local commerce
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
