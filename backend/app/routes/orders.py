from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import get_db_connection
from app.services.order_service import OrderService

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders/<int:user_id>', methods=['GET'])
@orders_bp.route('/api/v1/orders/<int:user_id>', methods=['GET'])
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
                    v.Shop_Name as shop_name,
                    v.Email as vendor_email,
                    v.Phone as vendor_phone,
                    v.City as vendor_city,
                    v.Vendor_ID as vendor_id,
                    p.Payment_Method as payment_method,
                    p.Payment_Status as payment_status
                FROM orders o
                LEFT JOIN delivery d ON o.Order_ID = d.Order_ID
                LEFT JOIN vendor v ON o.Vendor_ID = v.Vendor_ID
                LEFT JOIN (
                    SELECT p1.Order_ID, p1.Payment_Method, p1.Payment_Status
                    FROM payment p1
                    INNER JOIN (
                        SELECT MIN(Payment_ID) as min_id FROM payment GROUP BY Order_ID
                    ) p2 ON p1.Payment_ID = p2.min_id
                ) p ON o.Order_ID = p.Order_ID
                WHERE o.User_ID = %s
                ORDER BY o.Order_ID DESC
            """, (user_id,))
            orders = cursor.fetchall()

            for o in orders:
                o['total_amount'] = float(o['total_amount'])
                
                # Fetch items for this order
                cursor.execute("""
                    SELECT 
                        oi.Order_Item_ID as item_id,
                        oi.Product_ID as product_id,
                        oi.Quantity as quantity,
                        oi.Price as price,
                        p.Product_Name as product_name,
                        p.Image_URL as product_image
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
                            now = datetime.now()
                            if dt.date() == now.date():
                                o['expected_date'] = "Today at " + dt.strftime('%I:%M %p')
                            else:
                                o['expected_date'] = dt.strftime('%b %d, %I:%M %p')
                        except Exception:
                            pass
                    else:
                        now = datetime.now()
                        if raw_expected.date() == now.date():
                            o['expected_date'] = "Today at " + raw_expected.strftime('%I:%M %p')
                        else:
                            o['expected_date'] = raw_expected.strftime('%b %d, %I:%M %p')
                else:
                    o['expected_date'] = "Within 30 mins"

                # Status progression:
                # 0: CONFIRMED (PAID/PENDING)
                # 1: READY FOR PICKUP (SHIPPED)
                # 2: PICKED UP (DELIVERED)
                del_status = (o.get('delivery_status') or 'PENDING').upper()
                if del_status == 'DELIVERED':
                    o['display_status'] = 'Picked Up'
                    o['status_step'] = 2
                elif del_status in ('SHIPPED', 'READY'):
                    o['display_status'] = 'Ready for Pickup'
                    o['status_step'] = 1
                else:
                    o['display_status'] = 'Confirmed'
                    o['status_step'] = 0

        return jsonify(orders)
    except Exception as e:
        print("GET ORDERS ERROR:", e)
        return jsonify({"error": "Failed to retrieve orders"}), 500
    finally:
        conn.close()


@orders_bp.route('/checkout', methods=['POST'])
@orders_bp.route('/api/v1/checkout', methods=['POST'])
def checkout():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    payment_method = data.get('payment_method', 'UPI')
    delivery_address = data.get('address', 'Local Store Pickup')
    cart_items = data.get('items')  # Optional explicit cart items

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        result = OrderService.process_checkout(
            user_id=user_id,
            payment_method=payment_method,
            delivery_address=delivery_address,
            cart_items=cart_items
        )
        return jsonify(result), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print("CHECKOUT ERROR:", e)
        return jsonify({"error": f"Checkout failed: {str(e)}"}), 500
