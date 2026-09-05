import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ArrowRight, ShoppingCart, Store, AlertCircle } from 'lucide-react';
import { wishlistApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProductImage } from '../../components/ui/ProductImage';

export const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.user_id],
    queryFn: () => wishlistApi.getWishlist(user!.user_id),
    enabled: !!user?.user_id,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => wishlistApi.removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.user_id] });
      showToast('Item removed from wishlist', 'info');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to remove item', 'error');
    },
  });

  const totalAmount = items.reduce(
    (sum, item) => sum + item.final_price * (item.quantity || 1),
    0
  );

  const handleMoveToCart = (item: (typeof items)[0]) => {
    addToCart({
      vendor_product_id: item.vendor_product_id,
      product_id: item.product_id,
      name: item.name,
      image: item.image,
      vendor_name: item.vendor_name,
      shop_name: item.shop_name,
      price: item.price,
      final_price: item.final_price,
      discount_percentage: item.discount_percentage,
      quantity: item.quantity,
      stock: item.stock,
    });
    removeMutation.mutate(item.item_id);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Sign In to View Wishlist</h2>
        <p className="text-sm text-slate-500">
          Save products while comparing local vendor prices and access them anytime.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/login')}>
          Sign In Now
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
              My Wishlist
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Items saved with your preferred local neighborhood shops
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/checkout')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Checkout All Items (₹{totalAmount.toLocaleString()})
          </Button>
        )}
      </div>

      {/* Wishlist Items List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">Your Wishlist is Empty</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Save items as you compare vendor prices across neighborhood stores.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
            Explore Products
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <ProductImage
                    alt={item.name}
                    category={item.category}
                    size="md"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                  >
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Vendor: <strong className="text-slate-700">{item.shop_name || item.vendor_name}</strong></span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Quantity: <span className="font-bold text-slate-800">{item.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Pricing & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-extrabold text-slate-900">
                    ₹{(item.final_price * item.quantity).toLocaleString()}
                  </div>
                  {item.discount_percentage > 0 && (
                    <span className="text-xs text-emerald-600 font-semibold">
                      {Math.round(item.discount_percentage)}% OFF
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveToCart(item)}
                    leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  >
                    Move to Cart
                  </Button>

                  <button
                    onClick={() => removeMutation.mutate(item.item_id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
