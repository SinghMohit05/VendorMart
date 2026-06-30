# Local Vendor Price Comparison System

This is a full-stack web application designed for a DBMS Mini Project. It allows users to browse products, compare prices across local vendors, maintain a wishlist, and place orders.

## Project Structure

```
/
├── backend/
│   ├── app.py              # Flask server and REST API routes
│   ├── db.py               # Database connection utility (PyMySQL)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main product listing page
│   ├── product.html        # Product details & vendor price comparison
│   ├── login.html          # User Login/Registration forms
│   ├── wishlist.html       # User Wishlist page
│   ├── styles.css          # Modern, responsive UI styles
│   └── app.js              # API integration and vanilla JS logic
```

## Prerequisites

1. **Python 3.x** installed.
2. **MySQL Server** installed and running.
3. Node (Not required for this pure HTML/JS frontend, just open the HTML files in a browser).

## Setup & Running the Project

### 1. Database Configuration
You need to create your database and tables using your existing SQL schema.
To configure the backend to connect to your database, you can create a `.env` file in the `backend/` directory or define environment variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name
```
*Note: Make sure your table column names match those queried in `backend/app.py`. Modify the SQL queries in `app.py` if your column names differ (e.g., `user_id`, `product_id`, `price` etc.)*

### 2. Backend Setup
Navigate to the `backend` directory and install the python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Run the Flask application:
```bash
python app.py
```
The server will start on `http://localhost:5000`.

### 3. Frontend Setup
The frontend uses vanilla HTML, CSS, and JS (No build tools required!).
Simply open the `frontend/index.html` file in any modern web browser to start using the app. Wait for the backend to run so data loads properly. Alternatively, you can serve the frontend via any live server (like VSCode Live Server).

## Features Implemented
- **Dynamic Database Connections:** Reads from your MySQL Database.
- **CORS enabled:** For safe cross-origin requests from the static HTML files.
- **Responsive Styling:** Uses `index.css` for a "wow"-factor design without external frameworks.
- **RESTful Endpoints:** Proper usage of JSON parsing and Status Codes.
- **Session Management:** Stores `current_user` in browser `LocalStorage`.

Good luck with your project presentation!
