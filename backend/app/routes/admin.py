from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import get_db_connection

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/stats', methods=['GET'])
@admin_bp.route('/api/v1/admin/stats', methods=['GET'])
def get_admin_stats():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    v.Vendor_ID,
                    v.Vendor_Name,
                    v.Shop_Name,
                    v.Email,
                    v.City,
                    v.Phone,
                    (SELECT COUNT(*) FROM orders o WHERE o.Vendor_ID = v.Vendor_ID) as total_orders,
                    (SELECT IFNULL(SUM(oi.Quantity), 0) FROM order_item oi JOIN orders o ON oi.Order_ID = o.Order_ID WHERE o.Vendor_ID = v.Vendor_ID) as total_items_sold,
                    (SELECT IFNULL(SUM(o.Total_Amount), 0) FROM orders o WHERE o.Vendor_ID = v.Vendor_ID) as total_revenue,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 4.5) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) as rating
                FROM vendor v
                ORDER BY total_revenue DESC
            """)
            stats = cursor.fetchall()

            for row in stats:
                row['total_revenue'] = float(row['total_revenue'])
                row['rating'] = float(row['rating'])
                row['total_items_sold'] = int(row['total_items_sold'])
                row['total_orders'] = int(row['total_orders'])

        return jsonify(stats)
    except Exception as e:
        print("ADMIN STATS ERROR:", e)
        return jsonify({"error": "Failed to fetch admin stats"}), 500
    finally:
        conn.close()


@admin_bp.route('/admin/overview', methods=['GET'])
@admin_bp.route('/api/v1/admin/overview', methods=['GET'])
def get_admin_overview():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Totals
            cursor.execute("SELECT COUNT(*) as total_vendors FROM vendor")
            total_vendors = cursor.fetchone()['total_vendors']

            cursor.execute("SELECT IFNULL(SUM(Total_Amount), 0) as total_revenue, COUNT(*) as total_orders FROM orders")
            orders_res = cursor.fetchone()
            total_revenue = float(orders_res['total_revenue'])
            total_orders = int(orders_res['total_orders'])

            cursor.execute("SELECT IFNULL(SUM(Quantity), 0) as total_sold FROM order_item")
            total_sold = int(cursor.fetchone()['total_sold'])

            # Top Vendor
            cursor.execute("""
                SELECT v.Shop_Name, IFNULL(SUM(o.Total_Amount), 0) as revenue
                FROM vendor v
                LEFT JOIN orders o ON v.Vendor_ID = o.Vendor_ID
                GROUP BY v.Vendor_ID, v.Shop_Name
                ORDER BY revenue DESC
                LIMIT 1
            """)
            top_vendor = cursor.fetchone()

            # Top Selling Product
            cursor.execute("""
                SELECT p.Product_Name, IFNULL(SUM(oi.Quantity), 0) as units_sold
                FROM product p
                JOIN order_item oi ON p.Product_ID = oi.Product_ID
                GROUP BY p.Product_ID, p.Product_Name
                ORDER BY units_sold DESC
                LIMIT 1
            """)
            top_product = cursor.fetchone()

        return jsonify({
            "total_vendors": total_vendors,
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_sold": total_sold,
            "top_vendor": top_vendor['Shop_Name'] if top_vendor else "N/A",
            "top_product": top_product['Product_Name'] if top_product else "N/A"
        })
    except Exception as e:
        print("ADMIN OVERVIEW ERROR:", e)
        return jsonify({"error": "Failed to fetch overview"}), 500
    finally:
        conn.close()


@admin_bp.route('/admin/vendors', methods=['POST'])
@admin_bp.route('/api/v1/admin/vendors', methods=['POST'])
def add_vendor():
    data = request.get_json() or {}
    v_name = data.get('name')
    shop_name = data.get('shop')
    phone = data.get('phone')
    email = data.get('email')
    address = data.get('address')
    city = data.get('city', 'Mumbai')
    password = data.get('password', 'password123')

    if not all([v_name, shop_name, email]):
        return jsonify({"error": "Name, Shop Name, and Email are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT Vendor_ID FROM vendor WHERE LOWER(Email) = %s", (email.lower(),))
            if cursor.fetchone():
                return jsonify({"error": "Vendor with this email already exists"}), 409

            cursor.execute("""
                INSERT INTO vendor (Vendor_Name, Shop_Name, Phone, Email, Address, City, Registration_Date, Password)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (v_name, shop_name, phone, email.lower(), address, city, datetime.now(), password))
            v_id = cursor.lastrowid

            cursor.execute("INSERT INTO vendor_rating (Vendor_ID, Average_Rating) VALUES (%s, %s)", (v_id, 4.5))

        conn.commit()
        return jsonify({"message": "Vendor registered successfully!", "vendor_id": v_id}), 201
    except Exception as e:
        print("ADD VENDOR ERROR:", e)
        return jsonify({"error": "Failed to register vendor"}), 500
    finally:
        conn.close()
