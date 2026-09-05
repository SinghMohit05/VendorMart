import React, { useState } from 'react';
import { VendorPrice } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RatingStars } from '../ui/RatingStars';
import { Store, ShoppingCart, Heart, Phone, MapPin, Award, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { wishlistApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface VendorPriceTableProps {
  vendors: VendorPrice[];
  productName: string;
  productId: number;
  productImage: string;
}

type SortField = 'cheapest' | 'rating' | 'stock';

export const VendorPriceTable: React.FC<VendorPriceTableProps> = ({
  vendors,
  productName,
  productId,
  productImage,
}) => {
  const [sortField, setSortField] = useState<SortField>('cheapest');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getQuantity = (vendorProductId: number) => quantities[vendorProductId] || 1;

  const setQuantity = (vendorProductId: number, qty: number, maxStock: number) => {
    const clamped = Math.max(1, Math.min(qty, maxStock));
    setQuantities((prev) => ({ ...prev, [vendorProductId]: clamped }));
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    if (sortField === 'cheapest') return a.final_price - b.final_price;
    if (sortField === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortField === 'stock') return b.stock - a.stock;
    return 0;
  });

  const handleAddToCart = (vendor: VendorPrice) => {
    const qty = getQuantity(vendor.vendor_product_id);
    addToCart({
      vendor_product_id: vendor.vendor_product_id,
      product_id: productId,
      name: productName,
      image: productImage,
      vendor_name: vendor.vendor_name,
      shop_name: vendor.shop_name,
      price: vendor.price,
      final_price: vendor.final_price,
      discount_percentage: vendor.discount_percentage,
      quantity: qty,
      stock: vendor.stock,
    });
  };

  const handleAddToWishlist = async (vendor: VendorPrice) => {
    if (!user) {
      showToast('Please log in to save to your wishlist.', 'info');
      navigate('/login');
      return;
    }
    const qty = getQuantity(vendor.vendor_product_id);
    try {
      await wishlistApi.addToWishlist(user.user_id, vendor.vendor_product_id, qty);
      showToast(`Saved '${productName}' from ${vendor.shop_name} to wishlist!`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to add to wishlist', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Compare Local Vendors</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vendors.length} local shop{vendors.length !== 1 ? 's' : ''} offering this item near you
          </p>
        </div>

        {/* Sorting Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSortField('cheapest')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              sortField === 'cheapest'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cheapest Price
          </button>
          <button
            onClick={() => setSortField('rating')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              sortField === 'rating'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Highest Rated
          </button>
          <button
            onClick={() => setSortField('stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              sortField === 'stock'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Most Stock
          </button>
        </div>
      </div>

      {/* Vendors Cards / Rows */}
      <div className="space-y-3.5">
        {sortedVendors.map((vendor, idx) => {
          const qty = getQuantity(vendor.vendor_product_id);
          const isCheapest = vendor.is_best_price;

          return (
            <div
              key={vendor.vendor_product_id}
              className={`relative rounded-xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCheapest
                  ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              {/* Vendor Information */}
              <div className="space-y-1.5 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-base">
                    {vendor.shop_name || vendor.vendor_name}
                  </h4>
                  {isCheapest && (
                    <Badge variant="success" size="sm" icon={<Award className="w-3 h-3" />}>
                      Best Price
                    </Badge>
                  )}
                  {vendor.is_best_rated && (
                    <Badge variant="warning" size="sm">
                      Top Rated
                    </Badge>
                  )}
                  {vendor.is_best_stock && (
                    <Badge variant="primary" size="sm">
                      Best Stock
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <RatingStars rating={vendor.rating} size="sm" showText />
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{vendor.city}</span>
                  </div>
                  {vendor.phone && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{vendor.phone}</span>
                      </div>
                    </>
                  )}
                </div>

                {isCheapest && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Save the most by choosing this local vendor!
                  </p>
                )}
              </div>

              {/* Price & Stock info */}
              <div className="flex items-center gap-6 justify-between md:justify-center">
                <div className="text-left md:text-center">
                  <span className="text-[11px] font-medium text-slate-400 block">Stock Status</span>
                  {vendor.stock > 10 ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      In Stock ({vendor.stock})
                    </span>
                  ) : vendor.stock > 0 ? (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Low Stock ({vendor.stock} left)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-900">
                    ₹{vendor.final_price.toLocaleString()}
                  </div>
                  {vendor.discount_percentage > 0 && (
                    <div className="flex items-center gap-1 justify-end text-xs">
                      <span className="text-slate-400 line-through">
                        ₹{vendor.price.toLocaleString()}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {Math.round(vendor.discount_percentage)}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                {vendor.stock > 0 ? (
                  <>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => setQuantity(vendor.vendor_product_id, qty - 1, vendor.stock)}
                        className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200/80 font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-slate-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQuantity(vendor.vendor_product_id, qty + 1, vendor.stock)}
                        disabled={qty >= vendor.stock}
                        className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200/80 font-bold text-sm disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <Button
                      variant={isCheapest ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleAddToCart(vendor)}
                      leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                    >
                      Add to Cart
                    </Button>

                    <button
                      onClick={() => handleAddToWishlist(vendor)}
                      title="Save to Wishlist"
                      className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Unavailable
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
