from flask import Blueprint, request, jsonify
from app.db import get_db_connection

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
@products_bp.route('/api/v1/products', methods=['GET'])
def get_products():
    city = request.args.get('city', 'Mumbai')
    category = request.args.get('category')
    search = request.args.get('search', '').strip()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Query vendor products for the city
            sql = """
                SELECT 
                    p.Product_ID as product_id,
                    p.Product_Name as name,
                    p.Description as description,
                    p.Image_URL as image,
                    pc.Category_Name as category,
                    pr.Price_Amount as price,
                    IFNULL(d.Discount_Percentage, 0) as discount_percentage,
                    v.Vendor_Name as vendor_name,
                    v.Shop_Name as shop_name,
                    v.Vendor_ID as vendor_id,
                    v.City as city,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 4.5) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) AS rating,
                    IFNULL(s.Quantity_Available, 0) as stock,
                    vp.Vendor_Product_ID as vendor_product_id
                FROM product p
                LEFT JOIN product_category pc ON p.Category_ID = pc.Category_ID
                JOIN vendor_product vp ON p.Product_ID = vp.Product_ID
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE LOWER(v.City) = LOWER(%s)
            """
            params = [city]

            if category and category.lower() != 'all':
                sql += " AND LOWER(pc.Category_Name) = LOWER(%s)"
                params.append(category)

            if search:
                sql += " AND (LOWER(p.Product_Name) LIKE LOWER(%s) OR LOWER(p.Description) LIKE LOWER(%s))"
                params.extend([f"%{search}%", f"%{search}%"])

            cursor.execute(sql, tuple(params))
            raw_data = cursor.fetchall()

            for row in raw_data:
                row['price'] = float(row['price']) if row.get('price') is not None else 0.0
                row['rating'] = float(row['rating']) if row.get('rating') is not None else 4.0
                row['discount_percentage'] = float(row['discount_percentage']) if row.get('discount_percentage') is not None else 0.0
                row['stock'] = int(row['stock']) if row.get('stock') is not None else 0
                row['final_price'] = round(row['price'] * (1.0 - row['discount_percentage'] / 100.0), 2)

        return jsonify(raw_data)
    except Exception as e:
        print("GET PRODUCTS ERROR:", e)
        return jsonify({"error": "Failed to fetch products"}), 500
    finally:
        conn.close()


@products_bp.route('/products/<int:id>/prices', methods=['GET'])
@products_bp.route('/api/v1/products/<int:id>/prices', methods=['GET'])
def product_prices(id):
    city = request.args.get('city', 'Mumbai')
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.Product_ID as product_id, 
                    p.Product_Name as name, 
                    p.Description as description, 
                    p.Image_URL as image,
                    pc.Category_Name as category
                FROM product p
                LEFT JOIN product_category pc ON p.Category_ID = pc.Category_ID
                WHERE p.Product_ID = %s
            """, (id,))
            product = cursor.fetchone()

            if not product:
                return jsonify({"error": "Product not found"}), 404

            cursor.execute("""
                SELECT 
                    vp.Vendor_Product_ID as vendor_product_id,
                    v.Vendor_Name as vendor_name,
                    v.Shop_Name as shop_name,
                    v.Vendor_ID as vendor_id,
                    v.City as city,
                    v.Address as address,
                    v.Phone as phone,
                    pr.Price_Amount as price,
                    IFNULL(d.Discount_Percentage, 0) as discount_percentage,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 4.5) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) AS rating,
                    IFNULL(s.Quantity_Available, 0) as stock
                FROM vendor_product vp
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                LEFT JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                LEFT JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE vp.Product_ID = %s AND LOWER(v.City) = LOWER(%s)
                ORDER BY pr.Price_Amount ASC
            """, (id, city))
            vendors = cursor.fetchall()

            if vendors:
                min_price = min(round(float(v['price']) * (1.0 - float(v['discount_percentage'] or 0) / 100.0), 2) for v in vendors)
                max_stock = max(int(v['stock'] or 0) for v in vendors)
                max_rating = max(float(v['rating'] or 0) for v in vendors)

                for v in vendors:
                    v['price'] = float(v['price'])
                    v['discount_percentage'] = float(v['discount_percentage'])
                    v['final_price'] = round(v['price'] * (1.0 - v['discount_percentage'] / 100.0), 2)
                    v['rating'] = float(v['rating'])
                    v['stock'] = int(v['stock'])
                    v['is_best_price'] = (v['final_price'] == min_price)
                    v['is_best_stock'] = (v['stock'] == max_stock and v['stock'] > 0)
                    v['is_best_rated'] = (v['rating'] == max_rating and v['rating'] > 0)

        return jsonify({
            "product": product,
            "vendor_prices": vendors,
            "city": city,
            "vendors_count": len(vendors)
        })

    except Exception as e:
        print("PRODUCT PRICES ERROR:", e)
        return jsonify({"error": "Failed to fetch product price comparisons"}), 500
    finally:
        conn.close()


@products_bp.route('/categories', methods=['GET'])
@products_bp.route('/api/v1/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    pc.Category_ID as id,
                    pc.Category_Name as name,
                    COUNT(p.Product_ID) as product_count
                FROM product_category pc
                LEFT JOIN product p ON pc.Category_ID = p.Category_ID
                GROUP BY pc.Category_ID, pc.Category_Name
                ORDER BY pc.Category_Name
            """)
            categories = cursor.fetchall()
            for c in categories:
                c['product_count'] = int(c['product_count'])
        return jsonify(categories)
    except Exception as e:
        print("CATEGORIES ERROR:", e)
        return jsonify({"error": "Failed to fetch categories"}), 500
    finally:
        conn.close()


@products_bp.route('/master-products', methods=['GET'])
@products_bp.route('/api/v1/master-products', methods=['GET'])
def get_master_products():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.Product_ID as id, 
                    p.Product_Name as name, 
                    p.Description as description,
                    p.Image_URL as image,
                    pc.Category_Name as category 
                FROM product p
                JOIN product_category pc ON p.Category_ID = pc.Category_ID
                ORDER BY p.Product_Name
            """)
            products = cursor.fetchall()
        return jsonify(products)
    except Exception as e:
        print("MASTER PRODUCTS ERROR:", e)
        return jsonify({"error": "Failed to fetch master products"}), 500
    finally:
        conn.close()


@products_bp.route('/products/deals', methods=['GET'])
@products_bp.route('/api/v1/products/deals', methods=['GET'])
def get_deals():
    city = request.args.get('city', 'Mumbai')
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
                    d.Discount_Percentage as discount_percentage,
                    v.Vendor_Name as vendor_name,
                    v.Shop_Name as shop_name,
                    v.City as city,
                    (SELECT IFNULL(AVG(vr.Average_Rating), 4.5) FROM vendor_rating vr WHERE vr.Vendor_ID = v.Vendor_ID) AS rating,
                    s.Quantity_Available as stock,
                    vp.Vendor_Product_ID as vendor_product_id
                FROM vendor_product vp
                JOIN product p ON vp.Product_ID = p.Product_ID
                JOIN product_category pc ON p.Category_ID = pc.Category_ID
                JOIN vendor v ON vp.Vendor_ID = v.Vendor_ID
                JOIN price pr ON vp.Vendor_Product_ID = pr.Vendor_Product_ID
                JOIN discount d ON vp.Vendor_Product_ID = d.Vendor_Product_ID
                JOIN stock s ON vp.Vendor_Product_ID = s.Vendor_Product_ID
                WHERE LOWER(v.City) = LOWER(%s) AND d.Discount_Percentage > 0 AND s.Quantity_Available > 0
                ORDER BY d.Discount_Percentage DESC
                LIMIT 12
            """, (city,))
            deals = cursor.fetchall()

            for d in deals:
                d['price'] = float(d['price'])
                d['discount_percentage'] = float(d['discount_percentage'])
                d['rating'] = float(d['rating'])
                d['stock'] = int(d['stock'])
                d['final_price'] = round(d['price'] * (1.0 - d['discount_percentage'] / 100.0), 2)

        return jsonify(deals)
    except Exception as e:
        print("DEALS ERROR:", e)
        return jsonify({"error": "Failed to fetch deals"}), 500
    finally:
        conn.close()
