from flask import Blueprint, request, jsonify
from app.db import get_db_connection

wishlist_bp = Blueprint('wishlist', __name__)

@wishlist_bp.route('/wishlist', methods=['POST'])
@wishlist_bp.route('/api/v1/wishlist', methods=['POST'])
def add_to_wishlist():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    vp_id = data.get('vendor_product_id')
    quantity = int(data.get('quantity', 1))

    if not user_id or not vp_id:
        return jsonify({"error": "User ID and Vendor Product ID are required"}), 400

    if quantity <= 0:
        return jsonify({"error": "Quantity must be at least 1"}), 400

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

            # 2. Get Product_ID and current stock from vendor_product
            cursor.execute("""
                SELECT vp.Product_ID, s.Quantity_Available 
                FROM vendor_product vp
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE vp.Vendor_Product_ID = %s
            """, (vp_id,))
            res = cursor.fetchone()
            if not res:
                return jsonify({"error": "Vendor Product not found"}), 404

            product_id = res['Product_ID']
            stock = res.get('Quantity_Available') or 0
            if stock <= 0:
                return jsonify({"error": "This item is currently out of stock with this vendor"}), 400

            # 3. Check if already in wishlist
            cursor.execute("""
                SELECT Wishlist_Item_ID, Quantity FROM wishlist_item 
                WHERE Wishlist_ID = %s AND Vendor_Product_ID = %s
            """, (wishlist_id, vp_id))
            existing = cursor.fetchone()

            if existing:
                new_qty = existing['Quantity'] + quantity
                cursor.execute("""
                    UPDATE wishlist_item 
                    SET Quantity = %s 
                    WHERE Wishlist_Item_ID = %s
                """, (new_qty, existing['Wishlist_Item_ID']))
                message = f"Updated item quantity to {new_qty}"
            else:
                cursor.execute("""
                    INSERT INTO wishlist_item (Wishlist_ID, Product_ID, Vendor_Product_ID, Quantity)
                    VALUES (%s, %s, %s, %s)
                """, (wishlist_id, product_id, vp_id, quantity))
                message = "Added to wishlist!"

        conn.commit()
        return jsonify({"message": message}), 201
    except Exception as e:
        print("ADD WISHLIST ERROR:", e)
        return jsonify({"error": "Failed to add to wishlist"}), 500
    finally:
        conn.close()


@wishlist_bp.route('/wishlist/<int:user_id>', methods=['GET'])
@wishlist_bp.route('/api/v1/wishlist/<int:user_id>', methods=['GET'])
def get_wishlist(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    wi.Wishlist_Item_ID as item_id,
                    p.Product_ID as product_id,
                    p.Product_Name as name,
                    p.Description as description,
                    p.Image_URL as image,
                    v.Vendor_Name as vendor_name,
                    v.Shop_Name as shop_name,
                    v.Vendor_ID as vendor_id,
                    vp.Vendor_Product_ID as vendor_product_id,
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
                ORDER BY wi.Wishlist_Item_ID DESC
            """, (user_id,))
            items = cursor.fetchall()

            for it in items:
                it['price'] = float(it['price'])
                it['discount_percentage'] = float(it['discount_percentage'])
                it['quantity'] = int(it['quantity'])
                it['final_price'] = round(it['price'] * (1.0 - it['discount_percentage'] / 100.0), 2)
                it['stock'] = int(it['stock'])
                it['total_price'] = round(it['final_price'] * it['quantity'], 2)

        return jsonify(items)
    except Exception as e:
        print("GET WISHLIST ERROR:", e)
        return jsonify({"error": "Failed to retrieve wishlist"}), 500
    finally:
        conn.close()


@wishlist_bp.route('/wishlist/<int:item_id>', methods=['DELETE'])
@wishlist_bp.route('/api/v1/wishlist/<int:item_id>', methods=['DELETE'])
def remove_from_wishlist(item_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM wishlist_item WHERE Wishlist_Item_ID = %s", (item_id,))
        conn.commit()
        return jsonify({"message": "Item removed from wishlist"}), 200
    except Exception as e:
        print("DELETE WISHLIST ERROR:", e)
        return jsonify({"error": "Failed to remove item"}), 500
    finally:
        conn.close()


@wishlist_bp.route('/wishlist/item/<int:item_id>/quantity', methods=['PUT'])
@wishlist_bp.route('/api/v1/wishlist/item/<int:item_id>/quantity', methods=['PUT'])
def update_wishlist_quantity(item_id):
    data = request.get_json() or {}
    quantity = int(data.get('quantity', 1))

    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE wishlist_item SET Quantity = %s WHERE Wishlist_Item_ID = %s", (quantity, item_id))
        conn.commit()
        return jsonify({"message": "Quantity updated"}), 200
    except Exception as e:
        print("UPDATE WISHLIST ERROR:", e)
        return jsonify({"error": "Failed to update quantity"}), 500
    finally:
        conn.close()
