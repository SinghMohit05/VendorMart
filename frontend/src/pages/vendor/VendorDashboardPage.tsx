import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Package,
  Boxes,
  IndianRupee,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { vendorApi, productApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProductImage } from '../../components/ui/ProductImage';

export const VendorDashboardPage: React.FC = () => {
  const { vendor, logoutVendor } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Product form
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('25');
  const [newDiscount, setNewDiscount] = useState<string>('0');

  // Fetch Vendor Orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['vendor-orders', vendor?.vendor_id],
    queryFn: () => vendorApi.getOrders(vendor!.vendor_id),
    enabled: !!vendor?.vendor_id,
  });

  // Fetch Vendor Inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['vendor-inventory', vendor?.vendor_id],
    queryFn: () => vendorApi.getInventory(vendor!.vendor_id),
    enabled: !!vendor?.vendor_id,
  });

  // Fetch Master Catalog for Add Product
  const { data: masterProducts = [] } = useQuery({
    queryKey: ['master-products'],
    queryFn: () => productApi.getMasterProducts(),
    enabled: isAddModalOpen,
  });

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; status: string }) =>
      vendorApi.updateOrderStatus(data.orderId, data.status),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendor?.vendor_id] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update order status', 'error');
    },
  });

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: (data: {
      vendor_id: number;
      product_id: number;
      price: number;
      stock: number;
      discount: number;
    }) => vendorApi.addProduct(data),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      setIsAddModalOpen(false);
      setSelectedProductId('');
      setNewPrice('');
      setNewStock('25');
      setNewDiscount('0');
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory', vendor?.vendor_id] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to add product to inventory', 'error');
    },
  });

  if (!vendor) {
    navigate('/vendor/login');
    return null;
  }

  // Dashboard calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter((o) => (o.delivery_status || '').toUpperCase() !== 'DELIVERED').length;
  const outOfStockCount = inventory.filter((i) => i.stock <= 0).length;

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newPrice || !newStock) {
      showToast('Please complete all required product fields', 'error');
      return;
    }

    addProductMutation.mutate({
      vendor_id: vendor.vendor_id,
      product_id: Number(selectedProductId),
      price: parseFloat(newPrice),
      stock: parseInt(newStock, 10),
      discount: parseFloat(newDiscount || '0'),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Vendor Shop Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl text-slate-900">{vendor.shop_name}</h1>
              <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                Partner Store
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: <strong>{vendor.vendor_name}</strong> • Email: {vendor.email} • City: {vendor.city || 'Mumbai'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logoutVendor();
              navigate('/vendor/login');
            }}
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
            Incoming Orders
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
            Pending Pickups
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-amber-600">{pendingOrders}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Products Listed
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-slate-900">{inventory.length}</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-black text-3xl text-emerald-600">
              ₹{totalRevenue.toLocaleString()}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📦 Orders Management ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          🏷️ Shop Inventory ({inventory.length})
        </button>
      </div>

      {/* Orders Tab View */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              No orders received yet for this store.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.map((o) => {
                    const status = (o.delivery_status || 'PENDING').toUpperCase();
                    return (
                      <tr key={o.order_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">#VM-{o.order_id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{o.customer_name}</div>
                          <div className="text-slate-400 text-[11px]">{o.customer_phone || o.customer_email}</div>
                        </td>
                        <td className="p-4">
                          {o.items?.map((it, i) => (
                            <div key={i} className="text-slate-700">
                              {it.quantity}x {it.product_name}
                            </div>
                          ))}
                        </td>
                        <td className="p-4 font-extrabold text-slate-900 text-sm">
                          ₹{o.total_amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          {status === 'DELIVERED' ? (
                            <Badge variant="success" size="sm">Picked Up</Badge>
                          ) : status === 'SHIPPED' ? (
                            <Badge variant="primary" size="sm">Ready for Pickup</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Confirmed / Pending</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({
                                orderId: o.order_id,
                                status: e.target.value,
                              })
                            }
                            className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-semibold text-slate-800 cursor-pointer text-xs"
                          >
                            <option value="PENDING">Confirmed</option>
                            <option value="SHIPPED">Ready for Pickup</option>
                            <option value="DELIVERED">Picked Up / Done</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab View */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventoryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
              No products listed yet. Click "+ Add Product" to sell items from the master catalog.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Available Stock</th>
                    <th className="p-4 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {inventory.map((item) => (
                    <tr key={item.vp_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                          <ProductImage
                            alt={item.name}
                            category={item.category}
                            size="sm"
                          />
                        </div>
                        <span>{item.name}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{item.category}</td>
                      <td className="p-4 font-bold text-slate-900 text-sm">₹{item.price}</td>
                      <td className="p-4">
                        {item.discount > 0 ? (
                          <span className="text-emerald-600 font-bold">{item.discount}% OFF</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{item.stock} units</td>
                      <td className="p-4 text-right">
                        {item.stock > 10 ? (
                          <Badge variant="success" size="sm">Healthy</Badge>
                        ) : item.stock > 0 ? (
                          <Badge variant="warning" size="sm">Low Stock</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Out of Stock</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Product to Your Shop"
        description="Select a product from the master catalog and set your price and stock."
        maxWidth="md"
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
            >
              <option value="">-- Choose from Master Catalog --</option>
              {masterProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹)</label>
              <input
                type="number"
                placeholder="199"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
                min="1"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Stock</label>
              <input
                type="number"
                placeholder="30"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
                min="0"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount %</label>
              <input
                type="number"
                placeholder="10"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                min="0"
                max="90"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-4"
            isLoading={addProductMutation.isPending}
          >
            Add to Shop Inventory
          </Button>
        </form>
      </Modal>
    </div>
  );
};
