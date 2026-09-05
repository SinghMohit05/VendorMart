# VendorMart — Smart Local Shopping & Vendor Price Comparison

![VendorMart Banner](https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200)

> **VendorMart** is a modern, full-stack local commerce and multi-vendor price comparison platform. It empowers customers to compare real-time prices across neighborhood brick-and-mortar stores, claim local discounts, and order ahead for instant in-store pickup.

---

## 🌟 Key Features

### 🛒 Customer Experience
* **Smart Location Selector:** Seamlessly switch across 6 cities (**Mumbai, Bangalore, Chennai, Delhi, Hyderabad, Pune**) with persistent local price adjustments.
* **Multi-Vendor Price Comparison:** Side-by-side local vendor comparison table highlighting **Best Price**, **Top Rated**, and **Best Stock**.
* **Faceted Product Search & Filtering:** Filter by Category, Price Range, Available Stock, Discounts, and Ratings, with instant sorting.
* **Dedicated Comparison Hub (`/compare`):** Compare up to 4 products side-by-side on prices, ratings, vendor availability, and specifications.
* **Wishlist & Persistent Shopping Cart:** Save products per vendor, adjust quantities, and preview local savings.
* **Atomic Express Checkout:** Server-calculated discounts and pricing, automatic stock verification, atomic transaction rollback, and instant pickup scheduling.
* **Live Order Tracking Timeline:** Visual progress stepper (*Confirmed* → *Ready for Pickup* → *Picked Up*).
* **Community Vendor Reviews:** Transparent 5-star rating system with weighted average score updates.
* **User Profile Hub:** Account statistics, pickup history, and verified member credentials.

### 🏪 Vendor Portal (`/vendor`)
* **Dedicated Store Portal:** Authentication for neighborhood store owners.
* **Live Store Analytics:** Real-time metrics for today's orders, pending pickups, active inventory, and gross revenue.
* **Order Management Dashboard:** Transition incoming customer pickup requests from *Pending* to *Ready for Pickup* (`SHIPPED`) and *Completed* (`DELIVERED`).
* **Inventory Control & Stock Indicators:** Real-time stock status flags (*Healthy*, *Low Stock*, *Out of Stock*).
* **Quick Product Listing:** Add items to store inventory directly from the master product catalog with custom pricing and discounts.

### 🛡️ Admin Management (`/admin`)
* **Superuser Analytics:** Real-time metrics for total vendors, gross marketplace revenue, total orders, and units fulfilled.
* **Interactive Revenue Charts:** Visual revenue breakdown by vendor using Recharts.
* **Vendor Partner Rankings:** Performance breakdown by sales volume, units sold, revenue, and customer ratings.
* **Partner Onboarding:** Register and verify new local shop partners across supported cities.

---

## 🏗️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │             React 18 + TypeScript + Vite                │
   │   Tailwind CSS v4 • TanStack Query • Framer Motion      │
   │        Lucide React • Recharts • Axios Client           │
   └────────────────────────────┬────────────────────────────┘
                                │ (REST API / JSON)
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │             Flask 3.0+ Modular REST API                 │
   │  Blueprints: Auth, Products, Wishlist, Orders, Vendor,  │
   │               Admin, Ratings • CORS                     │
   └────────────────────────────┬────────────────────────────┘
                                │ (PyMySQL / Resilient Fallback)
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                  MySQL Database                         │
   │   (With auto-resilient local SQLite development mode)   │
   └─────────────────────────────────────────────────────────┘
```

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, React Router 7, TanStack Query v5, Framer Motion, Lucide React, Recharts, Axios.
* **Backend:** Python 3.14 / 3.10+, Flask, Flask-CORS, PyMySQL, python-dotenv, Cryptography.
* **Database:** MySQL 8.0+ / Resilient embedded SQLite development fallback.

---

## 📂 Project Structure

```
VendorMart/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory, CORS, blueprints
│   │   ├── config.py            # Environment configuration (.env loader)
│   │   ├── db.py                # Smart DB connection (PyMySQL + SQLite fallback)
│   │   ├── routes/
│   │   │   ├── auth.py          # /login, /register, /vendor/login, /admin/login
│   │   │   ├── products.py      # /products, /products/<id>/prices, /master-products
│   │   │   ├── wishlist.py      # /wishlist, /wishlist/<id>
│   │   │   ├── orders.py        # /orders/<user_id>, /checkout (atomic transaction)
│   │   │   ├── vendor.py        # /vendor/orders, /vendor/inventory, /vendor/add-product
│   │   │   ├── admin.py         # /admin/stats, /admin/overview, /admin/vendors
│   │   │   └── ratings.py       # /rate-vendor
│   │   └── services/
│   │       └── order_service.py # Atomic checkout, stock validation, server-side pricing
│   ├── run.py                   # Server runner on port 5000
│   ├── app.py                   # Backward-compatible entrypoint
│   ├── db.py                    # Backward-compatible database connector
│   ├── seed_data.py             # Database seeder script
│   ├── .env.example             # Example environment file
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/            # CartDrawer
│   │   │   ├── layout/          # Navbar, Footer
│   │   │   ├── product/         # ProductCard, VendorPriceTable, CompareDrawer
│   │   │   └── ui/              # Button, Badge, Modal, Skeleton, RatingStars
│   │   ├── context/             # AuthContext, LocationContext, CartContext, CompareContext, ToastContext
│   │   ├── pages/
│   │   │   ├── admin/           # AdminLoginPage, AdminDashboardPage
│   │   │   ├── auth/            # AuthPage (Login/Register)
│   │   │   ├── cart/            # CartPage
│   │   │   ├── checkout/        # CheckoutPage
│   │   │   ├── compare/         # ComparePage
│   │   │   ├── home/            # HomePage
│   │   │   ├── orders/          # OrdersPage
│   │   │   ├── product/         # ProductDetailPage
│   │   │   ├── profile/         # ProfilePage
│   │   │   ├── shop/            # ShopPage
│   │   │   └── vendor/          # VendorLoginPage, VendorDashboardPage
│   │   ├── services/            # api.ts (Centralized Axios client)
│   │   ├── types/               # index.ts (TypeScript definitions)
│   │   ├── App.tsx              # Application route tree
│   │   └── main.tsx             # React DOM entry
│   ├── legacy/                  # Archived original static HTML/JS/CSS files
│   ├── index.html               # Vite HTML entry
│   ├── vite.config.ts           # Vite configuration with API proxy
│   └── package.json             # NPM dependencies & scripts
└── README.md
```

---

## ⚙️ Quickstart & Setup

### Prerequisites
1. **Python 3.10+**
2. **Node.js 18+** and **npm**
3. **MySQL Server** (Optional: the backend automatically activates an embedded SQLite local engine if MySQL is not currently running).

---

### 1. Backend Setup

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. *(Optional)* Configure your local MySQL credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=localvendorpricecomparisonsystem
   FLASK_PORT=5000
   ```
4. Start the backend REST API:
   ```bash
   python run.py
   ```
   *The server starts on `http://127.0.0.1:5000`.*

---

### 2. Frontend Setup

1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --port 5173
   ```
   *The application opens on `http://localhost:5173`.*

---

### 3. Production Build

To test or build the optimized production assets:
```bash
cd frontend
npm run build
```

---

## 🔑 Default Credentials for Testing

| Role | Email | Password | Dashboard Route |
|---|---|---|---|
| **Customer** | `demo@vendormart.com` | `password123` | `/` and `/profile` |
| **Vendor** | `mumbaicentralmart@example.com` | `password123` | `/vendor/dashboard` |
| **Admin** | `admin@example.com` | `admin123` | `/admin/dashboard` |

---

## 📡 REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `POST` | `/login` | Customer authentication |
| `POST` | `/register` | Customer registration |
| `GET` | `/products?city=Mumbai` | Filtered product catalog by city |
| `GET` | `/products/<id>/prices?city=Mumbai` | Multi-vendor price comparison table |
| `GET` | `/categories` | Distinct product categories with counts |
| `GET` | `/master-products` | Master catalog for vendor product addition |
| `GET` | `/wishlist/<user_id>` | User saved wishlist items |
| `POST` | `/wishlist` | Add vendor product to wishlist |
| `DELETE` | `/wishlist/<item_id>` | Remove item from wishlist |
| `POST` | `/checkout` | Atomic checkout with stock & price verification |
| `GET` | `/orders/<user_id>` | Customer order history with timeline status |
| `POST` | `/rate-vendor` | Submit vendor review & update average rating |
| `POST` | `/vendor/login` | Vendor portal authentication |
| `GET` | `/vendor/orders/<vendor_id>` | Vendor incoming customer orders |
| `PUT` | `/vendor/orders/<order_id>/status` | Update delivery/pickup status |
| `GET` | `/vendor/inventory/<vendor_id>` | Vendor listed products and stock levels |
| `POST` | `/vendor/add-product` | Add master catalog item to vendor inventory |
| `POST` | `/admin/login` | Administrator authentication |
| `GET` | `/admin/overview` | Platform gross metrics |
| `GET` | `/admin/stats` | Vendor sales rankings and ratings |
| `POST` | `/admin/vendors` | Register new partner store |

---

## 🛡️ Data Integrity & Atomic Checkout

* **Server-Calculated Pricing:** Client totals are never trusted. Final discounts and line item amounts are strictly computed from canonical database values during checkout.
* **Pre-Checkout Stock Verification:** Every item is validated against live available stock. Orders with insufficient stock are rejected with clear error details.
* **Atomic Rollback:** Orders, items, stock decrements, delivery schedules, and payments are executed within an atomic database transaction. Any failure immediately triggers a complete database rollback.

---

## 📜 License
VendorMart is licensed under the MIT License.
