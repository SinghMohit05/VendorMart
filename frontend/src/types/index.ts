export interface User {
  user_id: number;
  username: string;
  email: string;
  phone?: string;
}

export interface Vendor {
  vendor_id: number;
  vendor_name: string;
  shop_name: string;
  email: string;
  city?: string;
  phone?: string;
  address?: string;
}

export interface Admin {
  admin_id: number;
  name: string;
  email: string;
}

export interface Product {
  product_id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  final_price: number;
  discount_percentage: number;
  vendor_name: string;
  shop_name?: string;
  vendor_id: number;
  city: string;
  rating: number;
  stock: number;
  vendor_product_id: number;
}

export interface VendorPrice {
  vendor_product_id: number;
  vendor_id: number;
  vendor_name: string;
  shop_name: string;
  city: string;
  address?: string;
  phone?: string;
  price: number;
  discount_percentage: number;
  final_price: number;
  rating: number;
  stock: number;
  is_best_price?: boolean;
  is_best_stock?: boolean;
  is_best_rated?: boolean;
}

export interface ProductDetailResponse {
  product: {
    product_id: number;
    name: string;
    description: string;
    image: string;
    category?: string;
  };
  vendor_prices: VendorPrice[];
  city: string;
  vendors_count: number;
}

export interface WishlistItem {
  item_id: number;
  product_id: number;
  name: string;
  description: string;
  image: string;
  category?: string;
  vendor_name: string;
  shop_name: string;
  vendor_id: number;
  vendor_product_id: number;
  price: number;
  discount_percentage: number;
  quantity: number;
  stock: number;
  final_price: number;
  total_price: number;
}

export interface CartItem {
  vendor_product_id: number;
  product_id: number;
  name: string;
  image: string;
  category?: string;
  vendor_name: string;
  shop_name: string;
  price: number;
  final_price: number;
  discount_percentage: number;
  quantity: number;
  stock: number;
}

export interface OrderItem {
  item_id?: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
}

export interface Order {
  order_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  delivery_status: string;
  expected_date: string;
  vendor_name: string;
  shop_name?: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_city?: string;
  vendor_id: number;
  payment_method: string;
  payment_status: string;
  display_status: string;
  status_step: number;
  items?: OrderItem[];
}

export interface VendorOrder {
  order_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  delivery_status: string;
  expected_date: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  items: {
    quantity: number;
    price: number;
    product_name: string;
  }[];
}

export interface VendorInventoryItem {
  vp_id: number;
  product_id: number;
  name: string;
  image: string;
  category: string;
  price: number;
  discount: number;
  stock: number;
  stock_status: 'Healthy' | 'Low Stock' | 'Out of Stock';
}

export interface MasterProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
}

export interface Category {
  id: number;
  name: string;
  product_count: number;
}

export interface AdminVendorStat {
  Vendor_ID: number;
  Vendor_Name: string;
  Shop_Name: string;
  Email: string;
  City: string;
  Phone: string;
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  rating: number;
}

export interface AdminOverview {
  total_vendors: number;
  total_revenue: number;
  total_orders: number;
  total_sold: number;
  top_vendor: string;
  top_product: string;
}
