from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import get_db_connection

vendor_bp = Blueprint('vendor', __name__)

@vendor_bp.route('/vendor/orders/<int:vendor_id>', methods=['GET'])
@vendor_bp.route('/api/v1/vendor/orders/<int:vendor_id>', methods=['GET'])
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
                    u.Email as customer_email,
                    u.Phone as customer_phone
                FROM orders o
                LEFT JOIN delivery d ON o.Order_ID = d.Order_ID
                LEFT JOIN user u ON o.User_ID = u.User_ID
                WHERE o.Vendor_ID = %s
                ORDER BY o.Order_ID DESC
            """, (vendor_id,))
            orders = cursor.fetchall()

            for o in orders:
                o['total_amount'] = float(o['total_amount'])
                
                # Fetch order items
                cursor.execute("""
                    SELECT 
                        oi.Quantity as quantity,
                        oi.Price as price,
                        p.Product_Name as product_name
                    FROM order_item oi
                    JOIN product p ON oi.Product_ID = p.Product_ID
                    WHERE oi.Order_ID = %s
                """, (o['order_id'],))
                o['items'] = cursor.fetchall()
                for it in o['items']:
                    it['price'] = float(it['price'])
                    it['quantity'] = int(it['quantity'])

                # Format dates
                raw_order_date = o['order_date']
                if raw_order_date:
                    if isinstance(raw_order_date, str):
                        try:
                            dt = datetime.fromisoformat(raw_order_date.replace("Z", ""))
                            o['order_date'] = dt.strftime('%b %d, %Y')
                        except Exception:
                            pass
                    else:
                        o['order_date'] = raw_order_date.strftime('%b %d, %Y')

                raw_expected = o['expected_date']
                if raw_expected:
                    if isinstance(raw_expected, str):
                        try:
                            dt = datetime.fromisoformat(raw_expected.replace("Z", ""))
                            o['expected_date'] = dt.strftime('%b %d, %I:%M %p')
                        except Exception:
                            pass
                    else:
                        o['expected_date'] = raw_expected.strftime('%b %d, %I:%M %p')

        return jsonify(orders)
    except Exception as e:
        print("VENDOR ORDERS ERROR:", e)
        return jsonify({"error": "Failed to fetch vendor orders"}), 500
    finally:
        conn.close()


@vendor_bp.route('/vendor/orders/<int:order_id>/status', methods=['PUT'])
@vendor_bp.route('/api/v1/vendor/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.get_json() or {}
    status = data.get('status', '').upper()

    # Map friendly status to standard DB values
    # PENDING / CONFIRMED -> PENDING
    # READY / SHIPPED -> SHIPPED
    # DELIVERED / COMPLETED / PICKED_UP -> DELIVERED
    valid_map = {
        'PENDING': 'PENDING',
        'CONFIRMED': 'PENDING',
        'PREPARING': 'PENDING',
        'READY': 'SHIPPED',
        'SHIPPED': 'SHIPPED',
        'DELIVERED': 'DELIVERED',
        'COMPLETED': 'DELIVERED',
        'PICKED UP': 'DELIVERED'
    }

    db_status = valid_map.get(status)
    if not db_status:
        return jsonify({"error": f"Invalid status '{status}'. Valid statuses: {list(valid_map.keys())}"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE delivery 
                SET Delivery_Status = %s 
                WHERE Order_ID = %s
            """, (db_status, order_id))
        conn.commit()
        return jsonify({"message": f"Order status successfully updated to {status}"}), 200
    except Exception as e:
        print("STATUS UPDATE ERROR:", e)
        return jsonify({"error": "Failed to update order status"}), 500
    finally:
        conn.close()


@vendor_bp.route('/vendor/inventory/<int:vendor_id>', methods=['GET'])
@vendor_bp.route('/api/v1/vendor/inventory/<int:vendor_id>', methods=['GET'])
def get_vendor_inventory(vendor_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    vp.Vendor_Product_ID as vp_id,
                    p.Product_ID as product_id,
                    p.Product_Name as name,
                    p.Image_URL as image,
                    pc.Category_Name as category,
                    pr.Price_Amount as price,
                    IFNULL(d.Discount_Percentage, 0) as discount,
                    IFNULL(s.Quantity_Available, 0) as stock
                FROM vendor_product vp
                JOIN product p ON vp.Product_ID = p.Product_ID
                JOIN product_category pc ON p.Category_ID = pc.Category_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE vp.Vendor_ID = %s
                ORDER BY p.Product_Name ASC
            """, (vendor_id,))
            inventory = cursor.fetchall()
            for item in inventory:
                item['price'] = float(item['price'])
                item['discount'] = float(item['discount'])
                item['stock'] = int(item['stock'])
                if item['stock'] > 15:
                    item['stock_status'] = 'Healthy'
                elif item['stock'] > 0:
                    item['stock_status'] = 'Low Stock'
                else:
                    item['stock_status'] = 'Out of Stock'

        return jsonify(inventory)
    except Exception as e:
        print("VENDOR INVENTORY ERROR:", e)
        return jsonify({"error": "Failed to fetch vendor inventory"}), 500
    finally:
        conn.close()


@vendor_bp.route('/vendor/add-product', methods=['POST'])
@vendor_bp.route('/api/v1/vendor/add-product', methods=['POST'])
def vendor_add_product():
    data = request.get_json() or {}
    vendor_id = data.get('vendor_id')
    product_id = data.get('product_id')
    price = data.get('price')
    stock = data.get('stock')
    discount = float(data.get('discount', 0))

    if not all([vendor_id, product_id, price is not None, stock is not None]):
        return jsonify({"error": "Vendor ID, Product ID, Price, and Stock are required"}), 400

    try:
        price = float(price)
        stock = int(stock)
        if price <= 0 or stock < 0:
            return jsonify({"error": "Price must be greater than 0 and stock cannot be negative"}), 400
    except ValueError:
        return jsonify({"error": "Invalid price or stock format"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if vendor already offers this product
            cursor.execute("""
                SELECT Vendor_Product_ID FROM vendor_product 
                WHERE Vendor_ID = %s AND Product_ID = %s
            """, (vendor_id, product_id))
            existing = cursor.fetchone()

            if existing:
                vp_id = existing['Vendor_Product_ID']
                # Update existing price and stock
                cursor.execute("""
                    UPDATE price SET Price_Amount = %s, Last_Updated = %s
                    WHERE Vendor_Product_ID = %s
                """, (price, datetime.now(), vp_id))

                cursor.execute("""
                    UPDATE stock SET Quantity_Available = %s
                    WHERE Vendor_Product_ID = %s
                """, (stock, vp_id))

                if discount > 0:
                    cursor.execute("""
                        INSERT INTO discount (Vendor_Product_ID, Discount_Percentage, Start_Date, End_Date)
                        VALUES (%s, %s, %s, %s)
                    """, (vp_id, discount, datetime.now(), datetime.now()))
                
                message = "Product inventory updated successfully!"
            else:
                # Insert vendor_product
                cursor.execute("""
                    INSERT INTO vendor_product (Vendor_ID, Product_ID)
                    VALUES (%s, %s)
                """, (vendor_id, product_id))
                vp_id = cursor.lastrowid

                # Insert price
                cursor.execute("""
                    INSERT INTO price (Vendor_Product_ID, Product_ID, Price_Amount, Last_Updated)
                    VALUES (%s, %s, %s, %s)
                """, (vp_id, product_id, price, datetime.now()))

                # Insert stock
                cursor.execute("""
                    INSERT INTO stock (Vendor_Product_ID, Quantity_Available)
                    VALUES (%s, %s)
                """, (vp_id, stock))

                if discount > 0:
                    cursor.execute("""
                        INSERT INTO discount (Vendor_Product_ID, Discount_Percentage, Start_Date, End_Date)
                        VALUES (%s, %s, %s, %s)
                    """, (vp_id, discount, datetime.now(), datetime.now()))

                message = "Product added to shop inventory successfully!"

        conn.commit()
        return jsonify({"message": message, "vendor_product_id": vp_id}), 201
    except Exception as e:
        print("ADD PRODUCT ERROR:", e)
        return jsonify({"error": "Failed to add product to inventory"}), 500
    finally:
        conn.close()


@vendor_bp.route('/vendor/inventory/<int:vp_id>', methods=['PUT'])
@vendor_bp.route('/api/v1/vendor/inventory/<int:vp_id>', methods=['PUT'])
def update_inventory_item(vp_id):
    data = request.get_json() or {}
    price = data.get('price')
    stock = data.get('stock')
    discount = data.get('discount')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if price is not None:
                cursor.execute("""
                    UPDATE price SET Price_Amount = %s, Last_Updated = %s
                    WHERE Vendor_Product_ID = %s
                """, (float(price), datetime.now(), vp_id))

            if stock is not None:
                cursor.execute("""
                    UPDATE stock SET Quantity_Available = %s
                    WHERE Vendor_Product_ID = %s
                """, (int(stock), vp_id))

            if discount is not None:
                cursor.execute("SELECT Discount_ID FROM discount WHERE Vendor_Product_ID = %s", (vp_id,))
                if cursor.fetchone():
                    cursor.execute("UPDATE discount SET Discount_Percentage = %s WHERE Vendor_Product_ID = %s", (float(discount), vp_id))
                else:
                    cursor.execute("INSERT INTO discount (Vendor_Product_ID, Discount_Percentage) VALUES (%s, %s)", (vp_id, float(discount)))

        conn.commit()
        return jsonify({"message": "Inventory item updated successfully"}), 200
    except Exception as e:
        print("UPDATE INVENTORY ERROR:", e)
        return jsonify({"error": "Failed to update inventory item"}), 500
    finally:
        conn.close()
