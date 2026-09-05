import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { orderApi, wishlistApi } from '../../services/api';
import { Button } from '../../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const { selectedCity } = useLocation();
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', user?.user_id],
    queryFn: () => orderApi.getOrders(user!.user_id),
    enabled: !!user?.user_id,
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?.user_id],
    queryFn: () => wishlistApi.getWishlist(user!.user_id),
    enabled: !!user?.user_id,
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Card Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-100 uppercase">
            {user.username.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl text-slate-900">{user.username}</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Local Shopper
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user.phone || '9876543210'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                {selectedCity}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logoutUser();
            navigate('/');
          }}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Orders Completed
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">{orders.length}</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Saved In Wishlist
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">{wishlist.length}</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-500">
              <Heart className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Local Purchases
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-emerald-600">
              ₹{totalSpent.toLocaleString()}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Recent Local Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your past neighborhood shop pickups</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No orders placed yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => (
              <div
                key={o.order_id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">Order #VM-{o.order_id}</div>
                  <div className="text-slate-500 mt-0.5">
                    {o.vendor_name || o.shop_name} • {o.order_date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 text-sm">
                    ₹{o.total_amount.toLocaleString()}
                  </div>
                  <span className="text-indigo-600 font-semibold">{o.display_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
