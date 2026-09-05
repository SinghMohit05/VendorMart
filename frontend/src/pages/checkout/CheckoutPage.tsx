import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { orderApi, wishlistApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ProductImage } from '../../components/ui/ProductImage';
import { useToast } from '../../context/ToastContext';

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedCity } = useLocation();
  const { cartItems, clearCart, cartTotal: localCartTotal } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Also query wishlist items if cart is empty, so checkout works seamlessly from wishlist!
  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist', user?.user_id],
    queryFn: () => wishlistApi.getWishlist(user!.user_id),
    enabled: !!user?.user_id && cartItems.length === 0,
  });

  // Items to check out (cart has priority, fallback to wishlist)
  const itemsToCheckout =
    cartItems.length > 0
      ? cartItems
      : wishlistItems.map((wi) => ({
          vendor_product_id: wi.vendor_product_id,
          product_id: wi.product_id,
          name: wi.name,
          image: wi.image,
          category: wi.category,
          vendor_name: wi.vendor_name,
          shop_name: wi.shop_name,
          price: wi.price,
          final_price: wi.final_price,
          discount_percentage: wi.discount_percentage,
          quantity: wi.quantity,
          stock: wi.stock,
        }));

  const totalAmount = itemsToCheckout.reduce(
    (sum, item) => sum + item.final_price * item.quantity,
    0
  );

  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [address, setAddress] = useState<string>(`Local Store Pickup, ${selectedCity}`);
  const [phone, setPhone] = useState<string>(user?.phone || '9876543210');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success Confirmation State
  const [confirmedOrders, setConfirmedOrders] = useState<{
    orderIds: number[];
    total: number;
  } | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to place an order.', 'error');
      navigate('/login');
      return;
    }

    if (itemsToCheckout.length === 0) {
      showToast('Your cart and wishlist are empty.', 'error');
      navigate('/shop');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        user_id: number;
        payment_method: string;
        address: string;
        items?: { vendor_product_id: number; quantity: number }[];
      } = {
        user_id: user.user_id,
        payment_method: paymentMethod,
        address: address,
      };

      // If user had items explicitly in cart, pass them to backend
      if (cartItems.length > 0) {
        payload.items = cartItems.map((i) => ({
          vendor_product_id: i.vendor_product_id,
          quantity: i.quantity,
        }));
      }

      const res = await orderApi.checkout(payload);

      if (res.success) {
        clearCart();
        setConfirmedOrders({
          orderIds: res.order_ids,
          total: totalAmount,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Checkout failed. Please review items.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Sign In to Complete Checkout</h2>
        <p className="text-sm text-slate-500">
          Sign in or create an account to proceed with your local store order.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
          Checkout & Order Confirmation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your local pickup order from verified neighborhood shops
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Contact, Pickup, Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>1. Contact Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number (For pickup SMS)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          {/* Pickup / Store Delivery Info */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>2. Delivery & Pickup Method</span>
            </h3>
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center gap-3">
              <Store className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-sm text-slate-900 block">Express Self-Pickup</span>
                <span className="text-xs text-slate-600">
                  Ready within ~15-20 minutes at your selected vendor counter in {selectedCity}.
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pickup Notes / Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900">3. Select Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="sr-only"
                />
                <QrCode className="w-6 h-6 mb-2 text-indigo-600" />
                <span className="text-xs font-bold">UPI / QR</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Instant & Safe</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Card'
                    ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="Card"
                  checked={paymentMethod === 'Card'}
                  onChange={() => setPaymentMethod('Card')}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 mb-2 text-indigo-600" />
                <span className="text-xs font-bold">Card</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Credit / Debit</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6 mb-2 text-emerald-600" />
                <span className="text-xs font-bold">Pay on Pickup</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Cash / Counter UPI</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-6 shadow-xs sticky top-24">
          <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
            Review Order Items ({itemsToCheckout.length})
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
            {itemsToCheckout.map((item) => (
              <div
                key={item.vendor_product_id}
                className="flex items-center justify-between text-xs py-2 border-b border-slate-100 gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <ProductImage
                      alt={item.name}
                      category={item.category}
                      size="sm"
                    />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.shop_name} • Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  ₹{(item.final_price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Estimated Pickup:</span>
              <span className="font-bold text-slate-900">Today within 20 mins</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Local Store Fee:</span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-xl text-indigo-600">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Confirm & Pay ₹{totalAmount.toLocaleString()}
          </Button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted local order processing</span>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmedOrders !== null}
        onClose={() => {
          setConfirmedOrders(null);
          navigate('/orders');
        }}
        maxWidth="md"
      >
        <div className="text-center p-4 space-y-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="font-display font-black text-2xl text-slate-900">Order Placed Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your pickup order has been confirmed with local shops in {selectedCity}.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Reference:</span>
              <span className="font-mono font-bold text-slate-900">
                #VM-{confirmedOrders?.orderIds.join(', #VM-')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Paid:</span>
              <span className="font-bold text-indigo-600">
                ₹{confirmedOrders?.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ready for Pickup:</span>
              <span className="font-semibold text-emerald-600">Today, in ~15-20 mins</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setConfirmedOrders(null);
                navigate('/shop');
              }}
            >
              Keep Shopping
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setConfirmedOrders(null);
                navigate('/orders');
              }}
            >
              Track Orders
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
