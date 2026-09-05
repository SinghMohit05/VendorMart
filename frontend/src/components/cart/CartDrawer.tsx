import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ProductImage } from '../ui/ProductImage';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartSavings,
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Your Shopping Cart</h2>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {cartItems.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Your Cart is Empty</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs">
                        Compare prices from local vendors and add items to your cart.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('/shop');
                      }}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.vendor_product_id}
                      className="flex gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ProductImage
                          alt={item.name}
                          category={item.category}
                          size="md"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.vendor_product_id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{item.shop_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              onClick={() => updateQuantity(item.vendor_product_id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.vendor_product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              ₹{(item.final_price * item.quantity).toLocaleString()}
                            </span>
                            {item.discount_percentage > 0 && (
                              <span className="text-[11px] text-slate-400 line-through block">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                  <div className="space-y-1.5 text-sm">
                    {cartSavings > 0 && (
                      <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                        <span>Total Local Savings:</span>
                        <span>-₹{cartSavings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Total:</span>
                      <span className="text-indigo-600 font-extrabold text-lg">
                        ₹{cartTotal.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Taxes calculated at checkout. Free local in-store pickup.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('/cart');
                      }}
                    >
                      Full Cart
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleCheckout}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
