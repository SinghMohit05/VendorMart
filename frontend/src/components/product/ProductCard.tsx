import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Scale, Store, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { Badge } from '../ui/Badge';
import { ProductImage } from '../ui/ProductImage';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';
import { wishlistApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProductCardProps {
  product: Product;
  vendorCount?: number;
  onSelectVendorForWishlist?: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  vendorCount = 1,
  onSelectVendorForWishlist,
}) => {
  const navigate = useNavigate();
  const { toggleCompare, isInCompare } = useCompare();
  const { user } = useAuth();
  const { showToast } = useToast();

  const inCompare = isInCompare(product.product_id);

  const handleQuickWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please log in to save items to your wishlist.', 'info');
      navigate('/login');
      return;
    }

    if (onSelectVendorForWishlist) {
      onSelectVendorForWishlist(product.product_id);
    } else {
      try {
        await wishlistApi.addToWishlist(user.user_id, product.vendor_product_id, 1);
        showToast(`Saved '${product.name}' to wishlist!`, 'success');
      } catch (err: unknown) {
        const error = err as Error;
        showToast(error.message || 'Failed to add to wishlist', 'error');
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.product_id}`);
  };

  // Stock status determination
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 8;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 shadow-xs hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Category Visual Header (No photos) */}
      <div className="relative w-full h-32 overflow-hidden">
        <ProductImage
          alt={product.name}
          category={product.category}
          size="full"
        />

        {/* Top Discount Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.discount_percentage > 0 && (
            <span className="bg-rose-500 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow-xs">
              {Math.round(product.discount_percentage)}% OFF
            </span>
          )}
        </div>

        {/* Action Buttons Top Right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleQuickWishlist}
            aria-label="Add to wishlist"
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-sm hover:bg-white text-slate-600 hover:text-rose-500 flex items-center justify-center transition-transform hover:scale-110"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product.product_id, product.name);
            }}
            aria-label="Compare price"
            className={`w-8 h-8 rounded-full backdrop-blur-xs shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${
              inCompare
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-indigo-600'
            }`}
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>

        {/* Stock status overlay if out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-white/95 text-slate-900 font-bold text-xs px-3 py-1 rounded-full shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800">
              {product.rating ? product.rating.toFixed(1) : '4.5'}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Local Verified</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {product.description || 'Quality local products near you.'}
          </p>
        </div>

        {/* Pricing & Vendor Details */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xs text-slate-500 block font-medium">From</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{product.final_price?.toLocaleString() || product.price?.toLocaleString()}
                </span>
                {product.discount_percentage > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Stock indicator badge */}
            <div>
              {isOutOfStock ? (
                <Badge variant="danger" size="sm">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="warning" size="sm">Only {product.stock} Left</Badge>
              ) : (
                <Badge variant="success" size="sm">In Stock</Badge>
              )}
            </div>
          </div>

          {/* Best Vendor Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-dashed border-slate-100">
            <div className="flex items-center gap-1 truncate mr-2">
              <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-medium text-slate-700 truncate">
                {product.shop_name || product.vendor_name}
              </span>
            </div>
            {vendorCount > 1 && (
              <span className="text-indigo-600 font-semibold text-[11px] shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                +{vendorCount - 1} vendors
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
