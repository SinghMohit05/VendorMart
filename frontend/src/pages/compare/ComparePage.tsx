import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { useLocation } from '../../context/LocationContext';
import { productApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { ProductImage } from '../../components/ui/ProductImage';

export const ComparePage: React.FC = () => {
  const { compareIds, toggleCompare, clearCompare } = useCompare();
  const { selectedCity } = useLocation();
  const navigate = useNavigate();

  // Fetch all products in city
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products', selectedCity],
    queryFn: () => productApi.getProducts(selectedCity),
  });

  // Filter down to compared products
  const comparedItems = React.useMemo(() => {
    const map = new Map<number, { product: (typeof allProducts)[0]; count: number }>();
    allProducts.forEach((p) => {
      if (compareIds.includes(p.product_id)) {
        const existing = map.get(p.product_id);
        if (!existing) {
          map.set(p.product_id, { product: { ...p }, count: 1 });
        } else {
          existing.count += 1;
          if (p.final_price < existing.product.final_price) {
            existing.product = { ...p };
          }
        }
      }
    });
    return Array.from(map.values());
  }, [allProducts, compareIds]);

  if (compareIds.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">
          No Products Selected for Comparison
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Click the compare scale icon on any product card in the shop to compare local vendor prices
          side-by-side.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" />
            <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">
              Product Comparison
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing {comparedItems.length} products across neighborhood vendors in {selectedCity}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearCompare}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Clear All
        </Button>
      </div>

      {/* Comparison Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">
                Metric
              </th>
              {comparedItems.map(({ product }) => (
                <th key={product.product_id} className="p-4 text-left w-64">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 line-clamp-1">
                      {product.name}
                    </span>
                    <button
                      onClick={() => toggleCompare(product.product_id, product.name)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">

            {/* Category row */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Category</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4 font-medium text-slate-700">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-semibold">
                    {product.category}
                  </span>
                </td>
              ))}
            </tr>

            {/* Best Local Price */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Lowest Price</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4 font-extrabold text-indigo-600 text-lg">
                  ₹{product.final_price?.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Best Vendor */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Best Vendor</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4 font-medium text-slate-800">
                  {product.shop_name || product.vendor_name}
                </td>
              ))}
            </tr>

            {/* Other Vendors Available */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Vendor Availability</td>
              {comparedItems.map(({ product, count }) => (
                <td key={product.product_id} className="p-4 font-medium text-slate-700 text-xs">
                  {count} Local Shop{count > 1 ? 's' : ''} in {selectedCity}
                </td>
              ))}
            </tr>

            {/* Stock status */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Stock</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Out of Stock
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Customer Rating</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4 font-bold text-slate-800 text-xs">
                  ★ {product.rating ? product.rating.toFixed(1) : '4.5'} / 5.0
                </td>
              ))}
            </tr>

            {/* Action buttons */}
            <tr>
              <td className="p-4 text-xs font-semibold text-slate-500">Action</td>
              {comparedItems.map(({ product }) => (
                <td key={product.product_id} className="p-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/products/${product.product_id}`)}
                    className="w-full"
                  >
                    Compare Vendors
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
