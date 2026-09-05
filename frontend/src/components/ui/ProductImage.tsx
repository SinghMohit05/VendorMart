import React from 'react';
import { ShoppingBag, Apple, Milk, Sparkles, Home, Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  alt,
  category = '',
  className = '',
  containerClassName = '',
  size = 'full',
}) => {
  const getCategoryConfig = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('fruit') || lower.includes('veg')) {
      return {
        bg: 'from-emerald-500/15 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-teal-950/20',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
        iconBg: 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300',
        icon: Apple,
        label: 'Fresh Produce',
      };
    }
    if (lower.includes('dairy') || lower.includes('bakery')) {
      return {
        bg: 'from-sky-500/15 via-blue-500/10 to-indigo-500/5 dark:from-sky-950/40 dark:to-indigo-950/20',
        textColor: 'text-sky-700 dark:text-sky-300',
        badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200',
        iconBg: 'bg-sky-100/90 text-sky-700 dark:bg-sky-900/70 dark:text-sky-300',
        icon: Milk,
        label: 'Dairy & Bakery',
      };
    }
    if (lower.includes('personal') || lower.includes('care')) {
      return {
        bg: 'from-rose-500/15 via-pink-500/10 to-purple-500/5 dark:from-rose-950/40 dark:to-purple-950/20',
        textColor: 'text-rose-700 dark:text-rose-300',
        badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200',
        iconBg: 'bg-rose-100/90 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300',
        icon: Sparkles,
        label: 'Personal Care',
      };
    }
    if (lower.includes('home') || lower.includes('essential')) {
      return {
        bg: 'from-teal-500/15 via-cyan-500/10 to-blue-500/5 dark:from-teal-950/40 dark:to-cyan-950/20',
        textColor: 'text-teal-700 dark:text-teal-300',
        badgeBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200',
        iconBg: 'bg-teal-100/90 text-teal-700 dark:bg-teal-900/70 dark:text-teal-300',
        icon: Home,
        label: 'Home Essentials',
      };
    }
    if (lower.includes('grocer')) {
      return {
        bg: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5 dark:from-amber-950/40 dark:to-orange-950/20',
        textColor: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
        iconBg: 'bg-amber-100/90 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300',
        icon: ShoppingBag,
        label: 'Daily Groceries',
      };
    }
    return {
      bg: 'from-slate-500/15 via-gray-500/10 to-slate-500/5 dark:from-slate-950/40 dark:to-gray-950/20',
      textColor: 'text-slate-700 dark:text-slate-300',
      badgeBg: 'bg-slate-100 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200',
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: Package,
      label: 'Product',
    };
  };

  const config = getCategoryConfig(category);
  const IconComponent = config.icon;

  // Compact icon badge mode (for list rows, carts, tables, checkout)
  if (size === 'sm') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center rounded-lg ${config.iconBg} ${containerClassName}`}
        title={`${alt} (${category || config.label})`}
      >
        <IconComponent className="w-4 h-4" />
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center rounded-xl ${config.iconBg} ${containerClassName}`}
        title={`${alt} (${category || config.label})`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
    );
  }

  // Full / Card Mode: vector banner with subtle pattern, icon & category tag
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center p-3 text-center overflow-hidden select-none bg-gradient-to-br ${config.bg} ${containerClassName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-xs border border-white/60 dark:border-slate-700 flex items-center justify-center backdrop-blur-xs">
          <IconComponent className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeBg}`}>
          {category || config.label}
        </span>
      </div>
    </div>
  );
};
