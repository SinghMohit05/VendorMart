import axios from 'axios';
import {
  User,
  Vendor,
  Admin,
  Product,
  ProductDetailResponse,
  WishlistItem,
  Order,
  VendorOrder,
  VendorInventoryItem,
  MasterProduct,
  Category,
  AdminVendorStat,
  AdminOverview,
} from '../types';

const api = axios.create({
  baseURL: '', // Relative baseURL lets Vite proxy to http://127.0.0.1:5000 in dev or current host
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message === 'Network Error') {
      message = 'Cannot connect to VendorMart server. Please ensure the backend is running.';
    }
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  register: async (username: string, email: string, password: string, phone?: string): Promise<{ message: string; user?: User }> => {
    const res = await api.post('/register', { username, email, password, phone });
    return res.data;
  },
  vendorLogin: async (email: string, password: string): Promise<{ vendor: Vendor }> => {
    const res = await api.post('/vendor/login', { email, password });
    return res.data;
  },
  adminLogin: async (email: string, password: string): Promise<{ admin: Admin }> => {
    const res = await api.post('/admin/login', { email, password });
    return res.data;
  },
};

// Product API
export const productApi = {
  getProducts: async (city: string, category?: string, search?: string): Promise<Product[]> => {
    const params: Record<string, string> = { city };
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;
    const res = await api.get('/products', { params });
    return res.data;
  },
  getProductPrices: async (id: number, city: string): Promise<ProductDetailResponse> => {
    const res = await api.get(`/products/${id}/prices`, { params: { city } });
    return res.data;
  },
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data;
  },
  getMasterProducts: async (): Promise<MasterProduct[]> => {
    const res = await api.get('/master-products');
    return res.data;
  },
  getDeals: async (city: string): Promise<Product[]> => {
    const res = await api.get('/products/deals', { params: { city } });
    return res.data;
  },
};

// Wishlist API
export const wishlistApi = {
  getWishlist: async (userId: number): Promise<WishlistItem[]> => {
    const res = await api.get(`/wishlist/${userId}`);
    return res.data;
  },
  addToWishlist: async (userId: number, vendorProductId: number, quantity: number = 1): Promise<{ message: string }> => {
    const res = await api.post('/wishlist', {
      user_id: userId,
      vendor_product_id: vendorProductId,
      quantity,
    });
    return res.data;
  },
  removeFromWishlist: async (itemId: number): Promise<{ message: string }> => {
    const res = await api.delete(`/wishlist/${itemId}`);
    return res.data;
  },
  updateQuantity: async (itemId: number, quantity: number): Promise<{ message: string }> => {
    const res = await api.put(`/wishlist/item/${itemId}/quantity`, { quantity });
    return res.data;
  },
};

// Orders API
export const orderApi = {
  getOrders: async (userId: number): Promise<Order[]> => {
    const res = await api.get(`/orders/${userId}`);
    return res.data;
  },
  checkout: async (payload: {
    user_id: number;
    payment_method: string;
    address?: string;
    items?: { vendor_product_id: number; quantity: number }[];
  }): Promise<{ message: string; order_ids: number[]; success: boolean }> => {
    const res = await api.post('/checkout', payload);
    return res.data;
  },
};

// Rating API
export const ratingApi = {
  rateVendor: async (vendorId: number, rating: number): Promise<{ message: string; new_average: number }> => {
    const res = await api.post('/rate-vendor', { vendor_id: vendorId, rating });
    return res.data;
  },
};

// Vendor API
export const vendorApi = {
  getOrders: async (vendorId: number): Promise<VendorOrder[]> => {
    const res = await api.get(`/vendor/orders/${vendorId}`);
    return res.data;
  },
  updateOrderStatus: async (orderId: number, status: string): Promise<{ message: string }> => {
    const res = await api.put(`/vendor/orders/${orderId}/status`, { status });
    return res.data;
  },
  getInventory: async (vendorId: number): Promise<VendorInventoryItem[]> => {
    const res = await api.get(`/vendor/inventory/${vendorId}`);
    return res.data;
  },
  addProduct: async (data: {
    vendor_id: number;
    product_id: number;
    price: number;
    stock: number;
    discount?: number;
  }): Promise<{ message: string; vendor_product_id: number }> => {
    const res = await api.post('/vendor/add-product', data);
    return res.data;
  },
  updateInventoryItem: async (vpId: number, data: { price?: number; stock?: number; discount?: number }): Promise<{ message: string }> => {
    const res = await api.put(`/vendor/inventory/${vpId}`, data);
    return res.data;
  },
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<AdminVendorStat[]> => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getOverview: async (): Promise<AdminOverview> => {
    const res = await api.get('/admin/overview');
    return res.data;
  },
  addVendor: async (data: {
    name: string;
    shop: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    password?: string;
  }): Promise<{ message: string; vendor_id: number }> => {
    const res = await api.post('/admin/vendors', data);
    return res.data;
  },
};

export default api;
