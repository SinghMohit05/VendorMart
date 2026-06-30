from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ================= REGISTER =================
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    name = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute("SELECT * FROM user WHERE Email=%s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "User already exists"}), 400

            cursor.execute("""
                INSERT INTO user (Name, Email, Password, Phone)
                VALUES (%s, %s, %s, %s)
            """, (name, email, password, 9999999999))

        conn.commit()
        return jsonify({"message": "Registered successfully"}), 201

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        conn.close()


# ================= LOGIN =================
@app.route('/login', methods=['POST'])
def login():
    data = request.json

    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    User_ID as user_id,
                    Name as username,
                    Email as email
                FROM user
                WHERE Email=%s AND Password=%s
            """, (email, password))

            user = cursor.fetchone()

        if user:
            return jsonify({"user": user})
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        conn.close()


# ================= PRODUCTS (WITH STOCK) =================
@app.route('/products', methods=['GET'])
def get_products():
    city = request.args.get('city', 'Mumbai') # Default to Mumbai for demo
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.Product_ID as product_id,
                    p.Product_Name as name,
                    p.Description as description,
                    p.Image_URL as image,
                    pc.Category_Name as category,
                    pr.Price_Amount as price,
                    v.Vendor_Name as vendor_name,
                    v.City as city,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 0) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) AS rating,
                    IFNULL(s.Quantity_Available, 0) as stock
                FROM product p
                LEFT JOIN product_category pc ON p.Category_ID = pc.Category_ID
                JOIN vendor_product vp ON p.Product_ID = vp.Product_ID
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE v.City = %s
            """, (city,))

            data = cursor.fetchall()
            for row in data:
                if 'price' in row and row['price'] is not None:
                    row['price'] = float(row['price'])
                if 'rating' in row and row['rating'] is not None:
                    row['rating'] = float(row['rating'])
                if 'stock' in row and row['stock'] is not None:
                    row['stock'] = int(row['stock'])

        return jsonify(data)
    finally:
        conn.close()

# ================= PRODUCT DETAILS =================
@app.route('/products/<int:id>/prices', methods=['GET'])
def product_prices(id):
    city = request.args.get('city', 'Mumbai')
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT Product_ID as product_id, Product_Name as name, Description, Image_URL as image
                FROM product WHERE Product_ID=%s
            """, (id,))
            product = cursor.fetchone()

            cursor.execute("""
                SELECT 
                    vp.Vendor_Product_ID as vendor_product_id,
                    v.Vendor_Name as vendor_name,
                    v.Vendor_ID as vendor_id,
                    v.City as city,
                    pr.Price_Amount as price,
                    IFNULL(d.Discount_Percentage, 0) as discount_percentage,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 0) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) AS rating,
                    IFNULL(s.Quantity_Available, 0) as stock
                FROM vendor_product vp
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE vp.Product_ID=%s AND v.City=%s
            """, (id, city))
            vendors = cursor.fetchall()
            
            for v in vendors:
                v['price'] = float(v['price'])
                v['rating'] = float(v['rating'])
                v['discount_percentage'] = float(v['discount_percentage'])
                v['final_price'] = round(v['price'] * (1 - v['discount_percentage'] / 100), 2)

        return jsonify({"product": product, "vendor_prices": vendors})

    except Exception as e:
        print("DETAIL ERROR:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        conn.close()




from datetime import datetime

# ================= ADMIN LOGIN =================
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT Admin_ID as admin_id, Name as name, Email as email
                FROM admin 
                WHERE Email=%s AND Password=%s
            """, (email, password))
            admin = cursor.fetchone()
        
        if admin:
            return jsonify({"admin": admin})
        else:
            return jsonify({"error": "Invalid admin credentials"}), 401
    except Exception as e:
        print("ADMIN LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= ADMIN STATS =================
@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Stats joining vendor, orders, and ratings
            cursor.execute("""
                SELECT 
                    v.Vendor_ID,
                    v.Vendor_Name,
                    v.Shop_Name,
                    v.Email,
                    (SELECT COUNT(*) FROM orders o WHERE o.Vendor_ID = v.Vendor_ID) as total_orders,
                    (SELECT IFNULL(SUM(oi.Quantity), 0) FROM order_item oi JOIN orders o ON oi.Order_ID = o.Order_ID WHERE o.Vendor_ID = v.Vendor_ID) as total_items_sold,
                    (SELECT IFNULL(SUM(o.Total_Amount), 0) FROM orders o WHERE o.Vendor_ID = v.Vendor_ID) as total_revenue,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 0) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) as rating
                FROM vendor v
            """)
            stats = cursor.fetchall()

            # Fix Decimal/Type serialization
            for row in stats:
                row['total_revenue'] = float(row['total_revenue'])
                row['rating'] = float(row['rating'])
                row['total_items_sold'] = int(row['total_items_sold'])

        return jsonify(stats)
    except Exception as e:
        print("STATS ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= WISHLIST =================
@app.route('/wishlist', methods=['POST'])
def add_to_wishlist():
    data = request.json
    user_id = data.get('user_id')
    vp_id = data.get('vendor_product_id')
    quantity = int(data.get('quantity', 1))

    if not user_id or not vp_id:
        return jsonify({"error": "User ID and Vendor Product ID required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Ensure wishlist exists for user
            cursor.execute("SELECT Wishlist_ID FROM wishlist WHERE User_ID = %s", (user_id,))
            wishlist = cursor.fetchone()
            
            if not wishlist:
                cursor.execute("INSERT INTO wishlist (User_ID) VALUES (%s)", (user_id,))
                wishlist_id = cursor.lastrowid
            else:
                wishlist_id = wishlist['Wishlist_ID']

            # 2. Get Product_ID
            cursor.execute("SELECT Product_ID FROM vendor_product WHERE Vendor_Product_ID = %s", (vp_id,))
            res = cursor.fetchone()
            if not res:
                return jsonify({"error": "Vendor Product not found"}), 404
            product_id = res['Product_ID']

            # 3. Add to items (check if already exists?)
            cursor.execute("""
                SELECT * FROM wishlist_item 
                WHERE Wishlist_ID = %s AND Vendor_Product_ID = %s
            """, (wishlist_id, vp_id))
            
            if cursor.fetchone():
                return jsonify({"error": "Item already in wishlist"}), 400

            cursor.execute("""
                INSERT INTO wishlist_item (Wishlist_ID, Product_ID, Vendor_Product_ID, Quantity)
                VALUES (%s, %s, %s, %s)
            """, (wishlist_id, product_id, vp_id, quantity))

        conn.commit()
        return jsonify({"message": "Added to wishlist"}), 201
    except Exception as e:
        print("ADD WISHLIST ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

@app.route('/wishlist/<int:user_id>', methods=['GET'])
def get_wishlist(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    wi.Wishlist_Item_ID as item_id,
                    p.Product_Name as name,
                    p.Description as description,
                    p.Image_URL as image,
                    v.Vendor_Name as vendor_name,
                    v.Shop_Name as shop_name,
                    pr.Price_Amount as price,
                    wi.Quantity as quantity,
                    IFNULL(d.Discount_Percentage, 0) as discount_percentage,
                    IFNULL(s.Quantity_Available, 0) as stock
                FROM wishlist_item wi
                JOIN wishlist w ON wi.Wishlist_ID = w.Wishlist_ID
                JOIN product p ON wi.Product_ID = p.Product_ID
                JOIN vendor_product vp ON wi.Vendor_Product_ID = vp.Vendor_Product_ID
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE w.User_ID = %s
            """, (user_id,))
            items = cursor.fetchall()

            for it in items:
                it['price'] = float(it['price'])
                it['discount_percentage'] = float(it['discount_percentage'])
                it['quantity'] = int(it['quantity'])
                it['final_price'] = round(it['price'] * (1 - it['discount_percentage'] / 100), 2)
                it['stock'] = int(it['stock'])

        return jsonify(items)
    except Exception as e:
        print("GET WISHLIST ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

@app.route('/wishlist/<int:item_id>', methods=['DELETE'])
def remove_from_wishlist(item_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM wishlist_item WHERE Wishlist_Item_ID = %s", (item_id,))
        conn.commit()
        return jsonify({"message": "Item removed from wishlist"}), 200
    except Exception as e:
        print("DELETE WISHLIST ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= ORDERS & DELIVERY (PICKUP MODEL) =================
@app.route('/orders/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    o.Order_ID as order_id,
                    o.Order_Date as order_date,
                    o.Total_Amount as total_amount,
                    o.Order_Status as order_status,
                    d.Delivery_Status as delivery_status,
                    d.Expected_Date as expected_date,
                    v.Vendor_Name as vendor_name,
                    v.Email as vendor_email,
                    v.Vendor_ID as vendor_id,
                    p.Payment_Method as payment_method,
                    p.Payment_Status as payment_status
                FROM orders o
                LEFT JOIN delivery d ON o.Order_ID = d.Order_ID
                LEFT JOIN vendor v ON o.Vendor_ID = v.Vendor_ID
                LEFT JOIN (
                    # Subquery to get exactly one payment per order, compatible with ONLY_FULL_GROUP_BY
                    SELECT p1.Order_ID, p1.Payment_Method, p1.Payment_Status
                    FROM payment p1
                    INNER JOIN (
                        SELECT MIN(Payment_ID) as min_id FROM payment GROUP BY Order_ID
                    ) p2 ON p1.Payment_ID = p2.min_id
                ) p ON o.Order_ID = p.Order_ID
                WHERE o.User_ID = %s
                ORDER BY o.Order_Date DESC
            """, (user_id,))
            orders = cursor.fetchall()

            for o in orders:
                o['total_amount'] = float(o['total_amount'])
                if o['order_date']: 
                    o['order_date'] = o['order_date'].strftime('%b %d, %Y')
                
                if o['expected_date']: 
                    now = datetime.now()
                    if o['expected_date'].date() == now.date():
                        o['expected_date'] = "Today at " + o['expected_date'].strftime('%I:%M %p')
                    else:
                        o['expected_date'] = o['expected_date'].strftime('%b %d, %I:%M %p')
                
                # Pivot status for Pickup model
                if o['delivery_status'] == 'PENDING' or o['delivery_status'] == 'SHIPPED':
                    o['display_status'] = 'Ready for Pickup'
                elif o['delivery_status'] == 'DELIVERED':
                    o['display_status'] = 'Picked Up'
                else:
                    o['display_status'] = 'Confirmed'

        return jsonify(orders)
    finally:
        conn.close()

@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.json
    user_id = data.get('user_id')
    payment_method = data.get('payment_method', 'UPI') # Default to UPI
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Get wishlist items with their selected vendors
            cursor.execute("""
                SELECT vp.Vendor_Product_ID, vp.Vendor_ID, pr.Price_Amount, d.Discount_Percentage, wi.Quantity
                FROM wishlist_item wi
                JOIN wishlist w ON wi.Wishlist_ID = w.Wishlist_ID
                JOIN vendor_product vp ON wi.Vendor_Product_ID = vp.Vendor_Product_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                WHERE w.User_ID = %s
            """, (user_id,))
            items = cursor.fetchall()

            if not items:
                return jsonify({"error": "Wishlist is empty"}), 400

            # Group items by Vendor to create separate orders
            vendors_in_wishlist = {}
            for item in items:
                v_id = item['Vendor_ID']
                if v_id not in vendors_in_wishlist:
                    vendors_in_wishlist[v_id] = []
                vendors_in_wishlist[v_id].append(item)

            for v_id, v_items in vendors_in_wishlist.items():
                total_amt = 0
                for it in v_items:
                    price = float(it['Price_Amount'])
                    disc = float(it['Discount_Percentage'] or 0)
                    qty = int(it['Quantity'] or 1)
                    total_amt += round(price * (1 - disc/100), 2) * qty
                
                # 2. Create Order
                cursor.execute("""
                    INSERT INTO orders (User_ID, Vendor_ID, Order_Date, Total_Amount, Order_Status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, v_id, datetime.now(), total_amt, 'PAID'))
                order_id = cursor.lastrowid

                # 3. Create Order Items
                for it in v_items:
                    # Get Product_ID from Vendor_Product_ID
                    cursor.execute("SELECT Product_ID FROM vendor_product WHERE Vendor_Product_ID = %s", (it['Vendor_Product_ID'],))
                    p_id = cursor.fetchone()['Product_ID']
                    
                    price = float(it['Price_Amount'])
                    disc = float(it['Discount_Percentage'] or 0)
                    qty = int(it['Quantity'] or 1)
                    final_price = round(price * (1 - disc/100), 2)

                    cursor.execute("""
                        INSERT INTO order_item (Order_ID, Product_ID, Quantity, Price)
                        VALUES (%s, %s, %s, %s)
                    """, (order_id, p_id, qty, final_price))

                    # 3.5 Update Stock
                    cursor.execute("""
                        UPDATE stock 
                        SET Quantity_Available = Quantity_Available - %s 
                        WHERE Vendor_Product_ID = %s
                    """, (qty, it['Vendor_Product_ID']))

                # 4. Create Delivery entry (Ready for Pickup immediately)
                pickup_ready_time = datetime.now() + timedelta(minutes=15) # Small buffer
                cursor.execute("""
                    INSERT INTO delivery (Order_ID, Delivery_Status, Expected_Date)
                    VALUES (%s, %s, %s)
                """, (order_id, 'SHIPPED', pickup_ready_time))

                # 5. Create Payment entry
                cursor.execute("""
                    INSERT INTO payment (Order_ID, Payment_Method, Payment_Status, Payment_Date)
                    VALUES (%s, %s, %s, %s)
                """, (order_id, payment_method, 'COMPLETED', datetime.now().date()))

            # 4. Clear Wishlist
            cursor.execute("""
                DELETE FROM wishlist_item 
                WHERE Wishlist_ID IN (SELECT Wishlist_ID FROM wishlist WHERE User_ID = %s)
            """, (user_id,))
            
        conn.commit()
        return jsonify({"message": "Payment Successful! Order placed for Pickup."}), 201
    except Exception as e:
        print("CHECKOUT ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# ================= RATE VENDOR =================
@app.route('/rate-vendor', methods=['POST'])
def rate_vendor():
    data = request.json
    vendor_id = data.get('vendor_id')
    rating = float(data.get('rating'))

    if not vendor_id or not rating:
        return jsonify({"error": "Vendor ID and Rating required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Simple logic: Average of current rating and new rating
            # For a real app, we'd have a separate ratings table and calculate the real mean.
            cursor.execute("SELECT Average_Rating FROM vendor_rating WHERE Vendor_ID = %s", (vendor_id,))
            res = cursor.fetchone()
            
            if res:
                current_avg = float(res['Average_Rating'])
                new_avg = round((current_avg + rating) / 2, 1)
                cursor.execute("UPDATE vendor_rating SET Average_Rating = %s WHERE Vendor_ID = %s", (new_avg, vendor_id))
            else:
                cursor.execute("INSERT INTO vendor_rating (Vendor_ID, Average_Rating) VALUES (%s, %s)", (vendor_id, rating))
            
        conn.commit()
        return jsonify({"message": "Thank you for your rating!"}), 200
    except Exception as e:
        print("RATING ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= VENDOR LOGIN =================
@app.route('/vendor/login', methods=['POST'])
def vendor_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT Vendor_ID as vendor_id, Vendor_Name as vendor_name, Shop_Name as shop_name, Email as email
                FROM vendor 
                WHERE Email=%s AND Password=%s
            """, (email, password))
            vendor = cursor.fetchone()
        
        if vendor:
            return jsonify({"vendor": vendor})
        else:
            return jsonify({"error": "Invalid vendor credentials"}), 401
    except Exception as e:
        print("VENDOR LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= VENDOR ORDERS =================
@app.route('/vendor/orders/<int:vendor_id>', methods=['GET'])
def get_vendor_orders(vendor_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    o.Order_ID as order_id,
                    o.Order_Date as order_date,
                    o.Total_Amount as total_amount,
                    o.Order_Status as order_status,
                    d.Delivery_Status as delivery_status,
                    d.Expected_Date as expected_date,
                    u.Name as customer_name,
                    u.Phone as customer_phone
                FROM orders o
                LEFT JOIN delivery d ON o.Order_ID = d.Order_ID
                LEFT JOIN user u ON o.User_ID = u.User_ID
                WHERE o.Vendor_ID = %s
                ORDER BY o.Order_Date DESC
            """, (vendor_id,))
            orders = cursor.fetchall()

            for o in orders:
                o['total_amount'] = float(o['total_amount'])
                if o['order_date']: 
                    o['order_date'] = o['order_date'].strftime('%b %d, %Y')
                if o['expected_date']:
                    o['expected_date'] = o['expected_date'].strftime('%b %d, %I:%M %p')

        return jsonify(orders)
    except Exception as e:
        print("VENDOR ORDERS ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= UPDATE ORDER STATUS =================
@app.route('/vendor/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.json
    status = data.get('status') # 'SHIPPED' for Ready, 'DELIVERED' for Picked Up

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE delivery 
                SET Delivery_Status = %s 
                WHERE Order_ID = %s
            """, (status, order_id))
        conn.commit()
        return jsonify({"message": "Status updated successfully"})
    except Exception as e:
        print("STATUS UPDATE ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= MASTER PRODUCTS =================
@app.route('/master-products', methods=['GET'])
def get_master_products():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.Product_ID as id, 
                    p.Product_Name as name, 
                    pc.Category_Name as category 
                FROM product p
                JOIN product_category pc ON p.Category_ID = pc.Category_ID
                ORDER BY p.Product_Name
            """)
            products = cursor.fetchall()
        return jsonify(products)
    except Exception as e:
        print("MASTER PRODUCTS ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= VENDOR ADD PRODUCT =================
@app.route('/vendor/add-product', methods=['POST'])
def vendor_add_product():
    data = request.json
    vendor_id = data.get('vendor_id')
    product_id = data.get('product_id')
    price = data.get('price')
    stock = data.get('stock')

    if not all([vendor_id, product_id, price, stock]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Add to vendor_product
            cursor.execute("""
                INSERT INTO vendor_product (Vendor_ID, Product_ID)
                VALUES (%s, %s)
            """, (vendor_id, product_id))
            vp_id = cursor.lastrowid

            # 2. Add Price
            cursor.execute("""
                INSERT INTO price (Vendor_Product_ID, Product_ID, Price_Amount, Last_Updated)
                VALUES (%s, %s, %s, %s)
            """, (vp_id, product_id, price, datetime.now().date()))

            # 3. Add Stock
            cursor.execute("""
                INSERT INTO stock (Vendor_Product_ID, Quantity_Available)
                VALUES (%s, %s)
            """, (vp_id, stock))

        conn.commit()
        return jsonify({"message": "Product added to your inventory!"}), 201
    except Exception as e:
        print("ADD PRODUCT ERROR:", e)
        return jsonify({"error": "Already selling this product or server error"}), 500
    finally:
        conn.close()

# ================= VENDOR INVENTORY =================
@app.route('/vendor/inventory/<int:vendor_id>', methods=['GET'])
def get_vendor_inventory(vendor_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    vp.Vendor_Product_ID as vp_id,
                    p.Product_Name as name,
                    pc.Category_Name as category,
                    pr.Price_Amount as price,
                    s.Quantity_Available as stock
                FROM vendor_product vp
                JOIN product p ON vp.Product_ID = p.Product_ID
                JOIN product_category pc ON p.Category_ID = pc.Category_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE vp.Vendor_ID = %s
                ORDER BY p.Product_Name
            """, (vendor_id,))
            inventory = cursor.fetchall()
            for item in inventory:
                item['price'] = float(item['price'])
        return jsonify(inventory)
    except Exception as e:
        print("VENDOR INVENTORY ERROR:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        conn.close()

# ================= RUN =================
if __name__ == '__main__':
    app.run(debug=True)