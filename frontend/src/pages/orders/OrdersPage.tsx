import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Store,
  Star,
  Phone,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { orderApi, ratingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RatingStars } from '../../components/ui/RatingStars';
import { Skeleton } from '../../components/ui/Skeleton';
import { Order } from '../../types';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Rating Modal state
  const [ratingVendor, setRatingVendor] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.user_id],
    queryFn: () => orderApi.getOrders(user!.user_id),
    enabled: !!user?.user_id,
  });

  const rateMutation = useMutation({
    mutationFn: (data: { vendorId: number; rating: number }) =>
      ratingApi.rateVendor(data.vendorId, data.rating),
    onSuccess: (data) => {
      showToast(`Review submitted! Vendor rating updated to ${data.new_average}★`, 'success');
      setRatingVendor(null);
      queryClient.invalidateQueries({ queryKey: ['orders', user?.user_id] });
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to submit rating', 'error');
    },
  });

  const handleOpenRating = (vendorId: number, vendorName: string) => {
    setSelectedRating(5);
    setRatingVendor({ id: vendorId, name: vendorName });
  };

  const handleSubmitRating = () => {
    if (!ratingVendor) return;
    rateMutation.mutate({
      vendorId: ratingVendor.id,
      rating: selectedRating,
    });
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign In to Track Orders</h2>
        <p className="text-sm text-slate-500">
          Sign in to view your real-time store pickup status and order receipts.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      </div>
    );
  }

  const statusSteps = ['CONFIRMED', 'READY FOR PICKUP', 'PICKED UP'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
              My Orders & Pickups
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates from your neighborhood vendor counters
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/shop')}>
          Shop More Products
        </Button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">No Orders Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Find the best local prices in your city and place your first store pickup order.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
            Explore Nearby Products
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: Order) => {
            const stepIndex = order.status_step ?? 0;

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-6 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-black text-lg text-slate-900">
                        Order #VM-{order.order_id}
                      </h3>
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {order.display_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Placed on {order.order_date}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 block">Total Amount</span>
                    <span className="text-xl font-extrabold text-indigo-600">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status Stepper Progress Bar */}
                <div className="py-2">
                  <div className="grid grid-cols-3 gap-2 relative">
                    {statusSteps.map((step, idx) => {
                      const isDone = idx < stepIndex;
                      const isCurrent = idx === stepIndex;

                      return (
                        <div key={step} className="flex flex-col items-center text-center relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isCurrent
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              isCurrent
                                ? 'text-indigo-600'
                                : isDone
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vendor Pickup Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <Store className="w-4 h-4 text-indigo-600" />
                      <span>{order.shop_name || order.vendor_name || 'Neighborhood Store'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      {order.vendor_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.vendor_phone}</span>
                        </div>
                      )}
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Ready: <strong className="text-slate-800">{order.expected_date}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleOpenRating(
                          order.vendor_id,
                          order.shop_name || order.vendor_name || 'Vendor'
                        )
                      }
                      leftIcon={<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    >
                      Rate Vendor
                    </Button>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Purchased Items ({order.items.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {order.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white"
                        >
                          <span className="font-semibold text-slate-800 truncate mr-2">
                            {it.product_name}
                          </span>
                          <span className="text-slate-500 shrink-0">
                            {it.quantity} × ₹{it.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Experience Modal */}
      <Modal
        isOpen={ratingVendor !== null}
        onClose={() => setRatingVendor(null)}
        title="Rate Your Experience"
        description={`Share your feedback for ${ratingVendor?.name}`}
        maxWidth="sm"
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="flex justify-center">
            <RatingStars
              rating={selectedRating}
              interactive
              size="lg"
              onRatingChange={(val) => setSelectedRating(val)}
            />
          </div>

          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your rating helps neighbors in your community discover the most reliable local vendors.
          </p>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            isLoading={rateMutation.isPending}
            onClick={handleSubmitRating}
          >
            Submit Review ({selectedRating} Stars)
          </Button>
        </div>
      </Modal>
    </div>
  );
};
