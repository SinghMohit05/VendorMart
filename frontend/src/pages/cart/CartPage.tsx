import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Store, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';

export const CartPage: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartSavings,
    cartTotal,
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Compare local vendor prices and add items to your cart for store pickup.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
              Shopping Cart
            </h1>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full ml-2">
              {cartItems.length} items
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearCart}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Clear Cart
        </Button>
      </div>

      {/* Cart Grid: Items (Left) + Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.vendor_product_id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <ProductImage
                    alt={item.name}
                    category={item.category}
                    size="md"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 truncate">{item.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Vendor: <strong className="text-slate-700">{item.shop_name}</strong></span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Unit Price: <span className="font-semibold text-slate-900">₹{item.final_price}</span>
                  </div>
                </div>
              </div>

              {/* Stepper & Line Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.vendor_product_id, item.quantity - 1)}
                    className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.vendor_product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-base font-bold text-slate-900">
                    ₹{(item.final_price * item.quantity).toLocaleString()}
                  </div>
                  {item.discount_percentage > 0 && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeFromCart(item.vendor_product_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-6 shadow-xs sticky top-24">
          <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
            </div>

            {cartSavings > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Vendor Discounts:</span>
                <span>-₹{cartSavings.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Local Store Pickup:</span>
              <span className="text-emerald-600 font-bold">FREE</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total:</span>
              <span className="text-xl text-indigo-600">₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/checkout')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Checkout
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Guaranteed genuine neighborhood products</span>
          </div>
        </div>
      </div>
    </div>
  );
};
