import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Store,
  IndianRupee,
  Package,
  TrendingUp,
  Plus,
  LogOut,
  Award,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminDashboardPage: React.FC = () => {
  const { admin, logoutAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [shopName, setShopName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('98200' + Math.floor(10000 + Math.random() * 90000));
  const [vendorCity, setVendorCity] = useState('Mumbai');
  const [vendorAddress, setVendorAddress] = useState('Market St, Central Market');

  // Fetch Admin Overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getOverview(),
    enabled: !!admin,
  });

  // Fetch Vendor Stats Breakdown
  const { data: vendorStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    enabled: !!admin,
  });

  // Add Vendor Mutation
  const addVendorMutation = useMutation({
    mutationFn: (data: {
      name: string;
      shop: string;
      email: string;
      phone: string;
      address: string;
      city: string;
    }) => adminApi.addVendor(data),
    onSuccess: (res) => {
      showToast(res.message || 'Vendor partner registered successfully!', 'success');
      setIsAddVendorOpen(false);
      setVendorName('');
      setShopName('');
      setVendorEmail('');
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to register vendor', 'error');
    },
  });

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  // Chart data: top 8 vendors by revenue
  const chartData = vendorStats.slice(0, 8).map((v) => ({
    name: v.Shop_Name.length > 12 ? v.Shop_Name.substring(0, 10) + '..' : v.Shop_Name,
    revenue: v.total_revenue,
    orders: v.total_orders,
  }));

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !shopName || !vendorEmail) {
      showToast('Please fill all required vendor details', 'error');
      return;
    }
    addVendorMutation.mutate({
      name: vendorName,
      shop: shopName,
      email: vendorEmail,
      phone: vendorPhone,
      address: vendorAddress,
      city: vendorCity,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl">Admin Analytics Hub</h1>
              <span className="bg-indigo-500/20 text-indigo-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Superuser
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong>{admin.name}</strong> ({admin.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddVendorOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Partner Vendor
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logoutAdmin();
              navigate('/admin/login');
            }}
            className="text-white border-slate-700 hover:bg-slate-800"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Partner Vendors
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">
              {overview?.total_vendors ?? 0}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Orders
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">
              {overview?.total_orders ?? 0}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Units Sold
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">
              {overview?.total_sold ?? 0}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Gross Marketplace Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-emerald-600">
              ₹{(overview?.total_revenue ?? 0).toLocaleString()}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Top Vendor Revenue Breakdown (₹)
            </h3>
            <p className="text-xs text-slate-500">Gross sales performance across active local partner shops</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vendor Ranking Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">
            Vendor Partner Breakdown ({vendorStats.length})
          </h3>
          <p className="text-xs text-slate-500">Complete performance rankings and customer review averages</p>
        </div>

        {statsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="p-4">Vendor & Shop</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4">Items Sold</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vendorStats.map((v) => (
                  <tr key={v.Vendor_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{v.Shop_Name}</div>
                      <div className="text-slate-400 text-[11px]">{v.Vendor_Name} • {v.Email}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{v.City || 'Mumbai'}</td>
                    <td className="p-4 font-bold text-slate-800">{v.total_orders}</td>
                    <td className="p-4 font-bold text-slate-800">{v.total_items_sold}</td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      ₹{v.total_revenue.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-amber-600">
                      ★ {v.rating ? v.rating.toFixed(1) : '4.5'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        title="Register New Partner Vendor"
        description="Add a verified neighborhood store to the VendorMart platform."
        maxWidth="md"
      >
        <form onSubmit={handleAddVendorSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Owner Name</label>
              <input
                type="text"
                placeholder="Ramesh Kumar"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Shop Name</label>
              <input
                type="text"
                placeholder="Central Supermarket"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="centralsuper@example.com"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
              <input
                type="tel"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
              <select
                value={vendorCity}
                onChange={(e) => setVendorCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Chennai">Chennai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Store Address</label>
            <input
              type="text"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-4"
            isLoading={addVendorMutation.isPending}
          >
            Register Partner Store
          </Button>
        </form>
      </Modal>
    </div>
  );
};
