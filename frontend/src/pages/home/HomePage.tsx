import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRight,
  TrendingUp,
  Percent,
  Sparkles,
  ShieldCheck,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import { productApi } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { Product } from '../../types';

export const HomePage: React.FC = () => {
  const { selectedCity, setSelectedCity, supportedCities } = useLocation();
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  // Fetch products for current city
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', selectedCity],
    queryFn: () => productApi.getProducts(selectedCity),
  });

  // Fetch top deals
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', selectedCity],
    queryFn: () => productApi.getDeals(selectedCity),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
  });

  // Group products by product_id to show unique products with lowest prices on the homepage
  const groupedProducts = React.useMemo(() => {
    const map = new Map<number, { product: Product; vendorCount: number }>();
    products.forEach((p) => {
      const existing = map.get(p.product_id);
      if (!existing) {
        map.set(p.product_id, { product: { ...p }, vendorCount: 1 });
      } else {
        existing.vendorCount += 1;
        if (p.final_price < existing.product.final_price) {
          existing.product = { ...p };
        }
      }
    });
    return Array.from(map.values());
  }, [products]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/shop?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-2xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Local Price Comparison Engine</span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight max-w-3xl mx-auto leading-[1.12]">
            Find the <span className="text-indigo-600 underline decoration-indigo-200 decoration-wavy decoration-2">Best Local Prices</span> Near You
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Compare real-time prices across verified neighborhood shops in {selectedCity}. Save money
            on everyday essentials and pick up in-store within minutes.
          </p>

          {/* Location & Search Composite Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            {/* City dropdown */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto shrink-0 text-xs font-bold text-slate-700 transition-colors">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {supportedCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <form onSubmit={handleHeroSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products (e.g. Atta, Milk, Tea)..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Metrics */}
          <div className="pt-8 grid grid-cols-3 max-w-lg mx-auto gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 backdrop-blur-xs">
              <div className="font-display font-extrabold text-2xl text-slate-900">500+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Local Products</div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 backdrop-blur-xs">
              <div className="font-display font-extrabold text-2xl text-indigo-600">30+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Verified Shops</div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 backdrop-blur-xs">
              <div className="font-display font-extrabold text-2xl text-emerald-600">Up to 30%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Price Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900">Popular Categories</h2>
            <p className="text-xs text-slate-500 mt-1">Explore essentials available for pickup in {selectedCity}</p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all text-left flex flex-col justify-between h-28 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {cat.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {cat.product_count} products
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Best Local Deals */}
      {deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-2">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Limited Time Vendor Deals</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                  Best Local Deals in {selectedCity}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Products with the highest discount rates compared to standard retail
                </p>
              </div>

              <button
                onClick={() => navigate('/shop')}
                className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-fit flex items-center gap-1.5"
              >
                <span>Explore Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dealsLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : deals.slice(0, 4).map((deal) => (
                    <ProductCard key={deal.vendor_product_id} product={deal} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products in City */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900">
                Trending Nearby in {selectedCity}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Top rated essentials with competitive vendor prices
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All ({groupedProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {productsLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : groupedProducts.slice(0, 8).map(({ product, vendorCount }) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  vendorCount={vendorCount}
                />
              ))}
        </div>
      </section>

      {/* Value Propositions / Why VendorMart */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
              Why Shop With VendorMart?
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              We bridge the gap between online convenience and neighborhood store value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mx-auto sm:mx-0 shadow-2xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Smart Price Comparison</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                See what different local grocers and electronics shops charge for the exact same item,
                so you never overpay.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mx-auto sm:mx-0 shadow-2xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Express Local Pickup</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Skip long courier waits. Order ahead and pick up your items ready at the local counter
                in as fast as 15 minutes.
              </p>
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl mx-auto sm:mx-0 shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Verified Neighborhood Shops</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every vendor is verified with transparent community ratings, authentic inventory, and
                safe digital payments.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
