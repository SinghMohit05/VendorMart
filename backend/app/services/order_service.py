from datetime import datetime, timedelta
from app.db import get_db_connection


class OrderService:
    @staticmethod
    def process_checkout(user_id, payment_method="UPI", delivery_address="Local Pickup", cart_items=None):
        """
        Atomic checkout transaction:
        1. Validates user
        2. Retrieves items (either from wishlist or explicit cart_items)
        3. Validates available stock for each vendor product
        4. Calculates server-side canonical price and discounts
        5. Creates orders per vendor
        6. Creates order_items
        7. Decrements stock
        8. Creates delivery and payment records
        9. Clears purchased items from wishlist
        10. Commits atomically or rolls back on any error
        """
        if not user_id:
            raise ValueError("User ID is required for checkout.")

        conn = get_db_connection()
        created_order_ids = []

        try:
            with conn.cursor() as cursor:
                # 1. Verify User exists
                cursor.execute("SELECT User_ID, Name, Email, Phone FROM user WHERE User_ID = %s", (user_id,))
                user = cursor.fetchone()
                if not user:
                    raise ValueError(f"User with ID {user_id} does not exist.")

                # 2. Get items to check out
                items_to_checkout = []
                if cart_items and len(cart_items) > 0:
                    # Specific cart items provided
                    for c_item in cart_items:
                        vp_id = c_item.get("vendor_product_id")
                        qty = int(c_item.get("quantity", 1))
                        if qty <= 0:
                            raise ValueError("Quantity must be greater than 0.")
                        
                        cursor.execute("""
                            SELECT 
                                vp.Vendor_Product_ID,
                                vp.Vendor_ID,
                                vp.Product_ID,
                                pr.Price_Amount,
                                IFNULL(d.Discount_Percentage, 0) as Discount_Percentage,
                                IFNULL(s.Quantity_Available, 0) as Quantity_Available,
                                p.Product_Name,
                                v.Vendor_Name,
                                v.Shop_Name
                            FROM vendor_product vp
                            JOIN product p ON vp.Product_ID = p.Product_ID
                            JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                            JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                            LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                            LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                            WHERE vp.Vendor_Product_ID = %s
                        """, (vp_id,))
                        row = cursor.fetchone()
                        if not row:
                            raise ValueError(f"Vendor Product #{vp_id} not found.")
                        row["Quantity"] = qty
                        items_to_checkout.append(row)
                else:
                    # Default: fetch from user's wishlist
                    cursor.execute("""
                        SELECT 
                            wi.Wishlist_Item_ID,
                            vp.Vendor_Product_ID,
                            vp.Vendor_ID,
                            vp.Product_ID,
                            pr.Price_Amount,
                            IFNULL(d.Discount_Percentage, 0) as Discount_Percentage,
                            IFNULL(s.Quantity_Available, 0) as Quantity_Available,
                            wi.Quantity,
                            p.Product_Name,
                            v.Vendor_Name,
                            v.Shop_Name
                        FROM wishlist_item wi
                        JOIN wishlist w ON wi.Wishlist_ID = w.Wishlist_ID
                        JOIN vendor_product vp ON wi.Vendor_Product_ID = vp.Vendor_Product_ID
                        JOIN product p ON vp.Product_ID = p.Product_ID
                        JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                        JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                        LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                        LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                        WHERE w.User_ID = %s
                    """, (user_id,))
                    items_to_checkout = cursor.fetchall()

                if not items_to_checkout:
                    raise ValueError("No items found in wishlist or cart to checkout.")

                # 3. Stock validation check across all items BEFORE creating orders
                for item in items_to_checkout:
                    avail_stock = int(item["Quantity_Available"])
                    req_qty = int(item["Quantity"])
                    if req_qty <= 0:
                        raise ValueError(f"Invalid quantity {req_qty} for product '{item['Product_Name']}'.")
                    if req_qty > avail_stock:
                        raise ValueError(
                            f"Insufficient stock for '{item['Product_Name']}' from {item['Shop_Name']}. "
                            f"Requested: {req_qty}, Available: {avail_stock}."
                        )

                # 4. Group items by Vendor to create clean per-vendor orders
                orders_by_vendor = {}
                for item in items_to_checkout:
                    v_id = item["Vendor_ID"]
                    if v_id not in orders_by_vendor:
                        orders_by_vendor[v_id] = {
                            "vendor_id": v_id,
                            "vendor_name": item["Vendor_Name"],
                            "shop_name": item["Shop_Name"],
                            "items": []
                        }
                    orders_by_vendor[v_id]["items"].append(item)

                # 5. Process each vendor order atomically
                for v_id, v_data in orders_by_vendor.items():
                    vendor_items = v_data["items"]

                    # Server-side pricing calculation
                    total_amount = 0.0
                    item_calculations = []
                    for it in vendor_items:
                        base_price = float(it["Price_Amount"])
                        discount_pct = float(it["Discount_Percentage"] or 0)
                        qty = int(it["Quantity"])
                        unit_final_price = round(base_price * (1.0 - discount_pct / 100.0), 2)
                        line_total = round(unit_final_price * qty, 2)
                        total_amount += line_total
                        item_calculations.append({
                            "vendor_product_id": it["Vendor_Product_ID"],
                            "product_id": it["Product_ID"],
                            "product_name": it["Product_Name"],
                            "quantity": qty,
                            "unit_price": unit_final_price,
                            "line_total": line_total
                        })

                    total_amount = round(total_amount, 2)

                    # Create order record
                    cursor.execute("""
                        INSERT INTO orders (User_ID, Vendor_ID, Order_Date, Total_Amount, Order_Status)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (user_id, v_id, datetime.now(), total_amount, "PAID"))
                    order_id = cursor.lastrowid
                    created_order_ids.append(order_id)

                    # Create order items and decrement stock atomically
                    for calc in item_calculations:
                        cursor.execute("""
                            INSERT INTO order_item (Order_ID, Product_ID, Quantity, Price)
                            VALUES (%s, %s, %s, %s)
                        """, (order_id, calc["product_id"], calc["quantity"], calc["unit_price"]))

                        cursor.execute("""
                            UPDATE stock 
                            SET Quantity_Available = Quantity_Available - %s 
                            WHERE Vendor_Product_ID = %s
                        """, (calc["quantity"], calc["vendor_product_id"]))

                    # Create delivery record (Pickup model: ready buffer ~15 mins)
                    expected_pickup_time = datetime.now() + timedelta(minutes=20)
                    cursor.execute("""
                        INSERT INTO delivery (Order_ID, Delivery_Status, Expected_Date)
                        VALUES (%s, %s, %s)
                    """, (order_id, "SHIPPED", expected_pickup_time))

                    # Create payment record
                    cursor.execute("""
                        INSERT INTO payment (Order_ID, Payment_Method, Payment_Status, Payment_Date)
                        VALUES (%s, %s, %s, %s)
                    """, (order_id, payment_method, "COMPLETED", datetime.now().date()))

                # 6. Clear user's wishlist
                cursor.execute("""
                    DELETE FROM wishlist_item 
                    WHERE Wishlist_ID IN (SELECT Wishlist_ID FROM wishlist WHERE User_ID = %s)
                """, (user_id,))

            # 7. Commit entire transaction
            conn.commit()

            return {
                "success": True,
                "message": f"Payment Successful! {len(created_order_ids)} order(s) confirmed for pickup.",
                "order_ids": created_order_ids,
                "orders_count": len(created_order_ids)
            }

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
