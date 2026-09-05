import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react';
import { productApi } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { VendorPriceTable } from '../../components/product/VendorPriceTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProductImage } from '../../components/ui/ProductImage';
import { useToast } from '../../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { selectedCity, setSelectedCity, supportedCities } = useLocation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-prices', productId, selectedCity],
    queryFn: () => productApi.getProductPrices(productId, selectedCity),
    enabled: !isNaN(productId),
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500">
          We couldn't find the requested product or local vendor data for this area.
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-indigo-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const { product, vendor_prices = [] } = data;
  const lowestPrice =
    vendor_prices.length > 0
      ? Math.min(...vendor_prices.map((v) => v.final_price))
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <Link
          to="/shop"
          className="text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Products</span>
        </Link>

        {/* Location selector inline */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-500">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {supportedCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Product Hero Card (No photos) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0">
              <ProductImage
                alt={product.name}
                category={product.category}
                size="full"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-0.5 rounded-full">
                    {product.category}
                  </span>
                )}
                {vendor_prices.some((v) => v.discount_percentage > 0) && (
                  <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                    Discounts Available
                  </span>
                )}
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
                {product.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                {product.description || 'Quality product available through multiple neighborhood vendors.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Product</span>
            </button>
          </div>
        </div>

        {/* Pricing Highlight Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Best Available Local Price
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              {lowestPrice !== null ? (
                <>
                  <span className="font-display font-black text-3xl text-indigo-600">
                    ₹{lowestPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Verified Local Rate
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-slate-500">
                  No vendors in {selectedCity} currently
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Available Local Shops</span>
            <span className="text-base font-extrabold text-slate-900">
              {vendor_prices.length} Vendors
            </span>
          </div>
        </div>

        {/* Value Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
            <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Express Pickup</span>
              <span className="text-[11px] text-slate-400">Within 20 mins</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">100% Genuine</span>
              <span className="text-[11px] text-slate-400">Direct from shop</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Best Price Guaranteed</span>
              <span className="text-[11px] text-slate-400">Multi-vendor compare</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Feature: Vendor Comparison Table */}
      <section className="space-y-4 pt-4">
        {vendor_prices.length > 0 ? (
          <VendorPriceTable
            vendors={vendor_prices}
            productName={product.name}
            productId={product.product_id}
            productImage={product.image}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto text-xl">
              🏪
            </div>
            <h3 className="text-base font-bold text-slate-900">No Vendors in {selectedCity}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This product is currently not listed by local vendors in {selectedCity}. Try switching
              your location to Mumbai or Bangalore.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
