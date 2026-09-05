import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { productApi } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types';

export const ShopPage: React.FC = () => {
  const { selectedCity } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';

  // Local state filters
  const [searchInput, setSearchInput] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('price_asc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
  });

  // Fetch all products for city
  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['products', selectedCity],
    queryFn: () => productApi.getProducts(selectedCity),
  });

  // Group products by product_id so each product card represents the best available price & vendor
  const groupedProducts = useMemo(() => {
    const map = new Map<number, { product: Product; allVendors: Product[] }>();
    rawProducts.forEach((p) => {
      const existing = map.get(p.product_id);
      if (!existing) {
        map.set(p.product_id, {
          product: { ...p },
          allVendors: [p],
        });
      } else {
        existing.allVendors.push(p);
        // Find cheapest vendor option
        if (p.final_price < existing.product.final_price) {
          existing.product = { ...p };
        }
      }
    });
    return Array.from(map.values());
  }, [rawProducts]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter(({ product }) => {
      // Search
      if (searchInput.trim()) {
        const query = searchInput.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = (product.description || '').toLowerCase().includes(query);
        const matchesCategory = (product.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      // Category
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Price range
      if (product.final_price > maxPrice) {
        return false;
      }

      // Stock
      if (inStockOnly && product.stock <= 0) {
        return false;
      }

      // Discount
      if (discountOnly && product.discount_percentage <= 0) {
        return false;
      }

      // Rating
      if (minRating > 0 && (product.rating || 0) < minRating) {
        return false;
      }

      return true;
    });
  }, [groupedProducts, searchInput, selectedCategory, maxPrice, inStockOnly, discountOnly, minRating]);

  // Apply Sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price_asc') return a.product.final_price - b.product.final_price;
      if (sortBy === 'price_desc') return b.product.final_price - a.product.final_price;
      if (sortBy === 'rating') return (b.product.rating || 0) - (a.product.rating || 0);
      if (sortBy === 'discount') return b.product.discount_percentage - a.product.discount_percentage;
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleResetFilters = () => {
    setSearchInput('');
    setSelectedCategory('All');
    setMaxPrice(1000);
    setInStockOnly(false);
    setDiscountOnly(false);
    setMinRating(0);
    setSortBy('price_asc');
    setSearchParams({});
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    if (catName === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catName);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
            Browse Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing vendor prices in <span className="font-bold text-indigo-600">{selectedCity}</span>
          </p>
        </div>

        {/* Sort & Mobile Filter Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFilterOpen(true)}
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filters
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Discounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 p-5 space-y-6 sticky top-24 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Search Products</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Product name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Categories</label>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('All')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-slate-400">{groupedProducts.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400">{cat.product_count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Max Price</span>
              <span className="text-indigo-600 font-extrabold">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹50</span>
              <span>₹1000</span>
            </div>
          </div>

          {/* Availability & Discounts Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>In Stock with local vendors</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={discountOnly}
                onChange={(e) => setDiscountOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>Discounted items only</span>
            </label>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Minimum Rating</label>
            <div className="flex gap-1.5">
              {[0, 3, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    minRating === rating
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {rating === 0 ? 'All' : `${rating}★`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium">Active:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                {selectedCategory}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                  onClick={() => handleCategorySelect('All')}
                />
              </span>
            )}
            {searchInput && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
                "{searchInput}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-slate-900"
                  onClick={() => setSearchInput('')}
                />
              </span>
            )}
            {maxPrice < 1000 && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
                Under ₹{maxPrice}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-slate-900"
                  onClick={() => setMaxPrice(1000)}
                />
              </span>
            )}
            <span className="text-slate-500 ml-auto font-medium">
              {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {/* Product Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No local items match your active filters in {selectedCity}. Try resetting your search or adjusting your price filters.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {sortedProducts.map(({ product, allVendors }) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  vendorCount={allVendors.length}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-slate-900">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Max Price:</span>
                <span className="text-indigo-600">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
