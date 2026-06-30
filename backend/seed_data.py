import random
from datetime import datetime, timedelta
from db import get_db_connection

def clear_all_data(cursor):
    print("Clearing existing table data...")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    tables = ['order_item', 'delivery', 'orders', 'wishlist_item', 'price', 'stock', 'discount', 'vendor_product', 'product', 'vendor', 'product_category', 'vendor_rating', 'payment']
    for table in tables:
        cursor.execute(f"TRUNCATE TABLE {table}")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    print("All tables cleared.")

def seed_categories(cursor):
    categories = ['Groceries', 'Fruits & Vegetables', 'Dairy & Bakery', 'Personal Care', 'Home Essentials']
    category_ids = []
    for cat in categories:
        cursor.execute("INSERT INTO product_category (Category_Name) VALUES (%s)", (cat,))
        category_ids.append(cursor.lastrowid)
    print(f"Seeded {len(categories)} categories.")
    return category_ids

def seed_products(cursor, category_ids):
    # Mapping old indices to new category IDs
    cat1, cat2, cat3, cat4, cat5 = category_ids
    
    product_data = [
        # Groceries (cat1)
        ("Ashirvaad Atta", "Superior MP Whole Wheat Flour (5kg).", "https://images.unsplash.com/photo-1627483262112-039e9a0a0f16?w=800", cat1),
        ("Fortune Sunflower Oil", "Refined sunflower oil (1L).", "https://images.unsplash.com/photo-1474979144342-990867d36359?w=800", cat1),
        ("Daawat Basmati Rice", "Long grain aromatic rice (1kg).", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800", cat1),
        ("Tata Salt", "Vacuum evaporated iodized salt (1kg).", "https://images.unsplash.com/photo-1626154315486-559600e1215b?w=800", cat1),
        ("Toor Dal", "Premium quality yellow pigeon peas (1kg).", "https://images.unsplash.com/photo-1585914924626-455b50dc3990?w=800", cat1),
        ("Sugar", "Refined white sugar (1kg).", "https://images.unsplash.com/photo-1581447100595-37750aa2278c?w=800", cat1),
        ("Red Label Tea", "High quality tea leaves with natural flavors.", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800", cat1),
        ("Nestle Maggi", "Ready-to-eat instant masala noodles.", "https://images.unsplash.com/photo-1612966809572-775207a47b5a?w=800", cat1),
        ("Ketchup", "Tangy tomato ketchup for snacking.", "https://images.unsplash.com/photo-1585325701165-351af916e581?w=800", cat1),
        ("Garlic Paste", "Strong aromatic ginger garlic paste.", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800", cat1),
        ("Green Moong Dal", "Whole green gram lentils (1kg).", "https://images.unsplash.com/photo-1585914924626-455b50dc3990?w=800", cat1),
        ("Pasta", "Italian durum wheat macaroni.", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800", cat1),
        ("Poha", "Premium thick flattened rice (500g).", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", cat1),
        ("Black Pepper", "Freshly grounded black pepper (100g).", "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800", cat1),
        ("Honey", "Pure natural forest honey.", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800", cat1),
        ("Turmeric Powder", "Pure haldi (200g).", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800", cat1),

        # Fruits & Vegetables (cat2)
        ("Fresh Tomatoes", "Juicy red farm-fresh tomatoes (1kg).", "https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=800", cat2),
        ("Red Onions", "High-quality kitchen essential onions (1kg).", "https://images.unsplash.com/photo-1508747703725-71977713d510?w=800", cat2),
        ("Potatoes", "Fresh earth-grown starchy potatoes (1kg).", "https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=800", cat2),
        ("Fresh Spinach", "Green leafy vegetable rich in iron.", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800", cat2),
        ("Banana", "Fresh yellow ripe bananas (1 dozen).", "https://images.unsplash.com/photo-1571771894821-ad9b5886479b?w=800", cat2),
        ("Apples", "Crunchy and sweet Kashmiri apples (1kg).", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800", cat2),
        ("Green Chillies", "Hot and spicy fresh chillies (100g).", "https://images.unsplash.com/photo-1597113366853-9a93ad3ff2e4?w=800", cat2),
        ("Ginger", "Fresh aromatic ginger root (250g).", "https://images.unsplash.com/photo-1599940824399-b87987cb9723?w=800", cat2),
        ("Lemons", "Tangy fresh yellow lemons (pack of 4).", "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800", cat2),
        ("Cauliflower", "Fresh large white cauliflower florets.", "https://images.unsplash.com/photo-1510627489930-0c1b0baead43?w=800", cat2),
        ("Carrots", "Sweet and crunchy orange carrots (500g).", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800", cat2),
        ("Cucumber", "Hydrating fresh green cucumber (500g).", "https://images.unsplash.com/photo-1449300079323-02e209d9d02d?w=800", cat2),
        ("Green Peas", "Freshly shelled sweet green peas (500g).", "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800", cat2),
        ("Pomegranate", "Fresh nutrient-rich red pomegranate.", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800", cat2),
        ("Grapes", "Sweet seedless black or green grapes (500g).", "https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=800", cat2),
        ("Garlic", "Whole fresh garlic bulbs (100g).", "https://images.unsplash.com/photo-1584473457406-623ca276188e?w=800", cat2),

        # Dairy & Bakery (cat3)
        ("Fresh Milk", "Creamy full-fat milk (500ml).", "https://images.unsplash.com/photo-1563636619-e910f01ff184?w=800", cat3),
        ("Amul Butter", "Pure and delicious table butter (100g).", "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800", cat3),
        ("Fresh Brown Bread", "Healthy whole wheat sliced bread.", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", cat3),
        ("Paneer", "Fresh and soft cottage cheese (200g).", "https://images.unsplash.com/photo-1601050633647-81a317577a36?w=800", cat3),
        ("Fresh Eggs", "White farm-fresh eggs (pack of 6).", "https://images.unsplash.com/photo-1506976785307-8732e75ad53e?w=800", cat3),
        ("Greek Yogurt", "Creamy unsweetened yogurt (200g).", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800", cat3),
        ("Cheese Slices", "Premium processed cheese slices.", "https://images.unsplash.com/photo-1528284724614-23ed83f47385?w=800", cat3),
        ("Rusks", "Crunchy suji tea-time rusks.", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", cat3),
        ("Cookies", "Chocolate chip home-style cookies.", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800", cat3),
        ("Heavy Cream", "Fresh cooking cream (200ml).", "https://images.unsplash.com/photo-1501959915551-4e8d30928317?w=800", cat3),
        ("Curd", "Freshly set thick homemade curd.", "https://images.unsplash.com/photo-1564049489314-60d154ff107d?w=800", cat3),
        ("Buttermilk", "Refreshing spiced masala chaas.", "https://images.unsplash.com/photo-1556742111-a30107246473?w=800", cat3),
        ("Multigrain Bread", "Nutritious seed-topped bread.", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", cat3),
        ("Milk Cake", "Traditional Indian dairy sweet.", "https://images.unsplash.com/photo-1589135393670-bc62d66e8f49?w=800", cat3),
        ("Mozzarella Cheese", "Soft and stretchable pizza cheese.", "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800", cat3),
        ("Condensed Milk", "Sweetened milk for desserts.", "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800", cat3),

        # Personal Care (cat4)
        ("Dettol Soap", "Anti-bacterial bathing soap.", "https://images.unsplash.com/photo-1600857062241-99e5da7f519f?w=800", cat4),
        ("Dove Shampoo", "Deeply nourishing hair therapy.", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800", cat4),
        ("Colgate Toothpaste", "Strong teeth with calcium boost.", "https://images.unsplash.com/photo-1559591410-60b5030f230d?w=800", cat4),
        ("Nivea Cream", "Intense hydration for dry skin.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Hand Wash", "Gentle liquid hand soap (250ml).", "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800", cat4),
        ("Aloe Vera Gel", "Pure soothing aloe vera gel.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Talcum Powder", "Refreshing floral scent powder.", "https://images.unsplash.com/photo-1521223344201-d169129f7b7d?w=800", cat4),
        ("Lip Balm", "Moisturizing care for chapped lips.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Sanitizer", "Alcohol-based instant hand rub.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800", cat4),
        ("Facewash", "Deep cleaning neem facewash.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Hair Oil", "Pure coconut oil for hair growth.", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800", cat4),
        ("Antiseptic Liquid", "Multi-purpose first aid hygiene.", "https://images.unsplash.com/photo-1603398938378-e54eab446f21?w=800", cat4),
        ("Body Lotion", "Cocoa butter moisturizing lotion.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Toothbrush", "Soft bristles for gentle cleaning.", "https://images.unsplash.com/photo-1559591410-60b5030f230d?w=800", cat4),
        ("Cotton Swabs", "Soft cotton tips for hygiene.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", cat4),
        ("Deodorant", "Long-lasting fresh body spray.", "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800", cat4),

        # Home Essentials (cat5)
        ("Vim Liquid", "Strong grease cutting dishwash.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5),
        ("Surf Excel", "Tough stain removal detergent.", "https://images.unsplash.com/photo-1585311022073-b3af7e3d11bb?w=800", cat5),
        ("Harpic Cleaner", "Professional grade toilet cleaner.", "https://images.unsplash.com/photo-1585311022073-b3af7e3d11bb?w=800", cat5),
        ("Garbage Bags", "Heavy-duty biodegradable bags.", "https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?w=800", cat5),
        ("Matchboxes", "Safety matches (pack of 10).", "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800", cat5),
        ("Kitchen Towels", "Highly absorbent paper towels.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5),
        ("Floor Cleaner", "Pine scented disinfectant liquid.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5),
        ("Scrub Pad", "Durable nylon dishwashing scrub.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5),
        ("Mosquito Coils", "Indoor protective mosquito repellent.", "https://images.unsplash.com/photo-1550985616-10810253b84d?w=800", cat5),
        ("Incense Sticks", "Sandalwood scented agarbatti.", "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800", cat5),
        ("Aluminum Foil", "Food-grade wrapping foil (18m).", "https://images.unsplash.com/photo-1584990344447-3801ea8f707f?w=800", cat5),
        ("Light Bulbs", "Energy efficient LED bulbs.", "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800", cat5),
        ("Sponges", "Multi-purpose cleaning sponges.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5),
        ("Liquid Detergent", "Gentle wash for woolens.", "https://images.unsplash.com/photo-1585311022073-b3af7e3d11bb?w=800", cat5),
        ("Surface Sanitizer", "99.9% germ killing spray.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800", cat5),
        ("Cotton Cloths", "Soft reusable kitchen wipes.", "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800", cat5)
    ]

    p_ids = []
    for name, desc, img, cat_id in product_data:
        cursor.execute("""
            INSERT INTO product (Product_Name, Description, Image_URL, Category_ID)
            VALUES (%s, %s, %s, %s)
        """, (name, desc, img, cat_id))
        p_ids.append(cursor.lastrowid)
    print(f"Seeded {len(p_ids)} products.")
    return p_ids

def seed_vendors_for_city(cursor, city, vendor_names, p_ids):
    vendor_ids = []
    for name in vendor_names:
        shop_name = f"{name}"
        phone = f"98200{random.randint(10000, 99999)}"
        email = f"{name.lower().replace(' ', '')}@example.com"
        address = f"Street {random.randint(1, 100)}, {name.split()[0]}, {city}"
        reg_date = datetime.now() - timedelta(days=random.randint(1, 365))
        
        cursor.execute("""
            INSERT INTO vendor (Vendor_Name, Shop_Name, Phone, Email, Address, City, Registration_Date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, shop_name, phone, email, address, city, reg_date))
        v_id = cursor.lastrowid
        vendor_ids.append(v_id)
        
        # Initial rating
        cursor.execute("""
            INSERT INTO vendor_rating (Vendor_ID, Average_Rating)
            VALUES (%s, %s)
        """, (v_id, round(random.uniform(3.5, 5.0), 1)))
        
    print(f"Seeded {len(vendor_ids)} vendors in {city}.")

    # Link Products to Vendors
    links_count = 0
    for v_id in vendor_ids:
        num_products = random.randint(40, 60)
        selected_products = random.sample(p_ids, num_products)
        
        for p_id in selected_products:
            cursor.execute("INSERT INTO vendor_product (Vendor_ID, Product_ID) VALUES (%s, %s)", (v_id, p_id))
            vp_id = cursor.lastrowid
            
            # Find category for this product
            cursor.execute("SELECT Category_ID FROM product WHERE Product_ID = %s", (p_id,))
            cat_id_res = cursor.fetchone()
            cat_id = cat_id_res['Category_ID'] if cat_id_res else 1

            base_price_range = {
                1: (20, 1000), 2: (10, 500), 3: (10, 400), 4: (10, 500), 5: (10, 800)
            }
            # We need to find which "logical" category it is. 
            # This is a bit tricky since Category_ID is auto-incremented.
            # For simplicity, we'll just use a default range or try to match.
            # But in this script, we just seeded them in order.
            
            low, high = (20, 500) # Default
            # Attempt to find which index it is in category_ids
            # (In a real app we'd use Category_Name)
            
            price = float(random.randint(low, high))
            
            cursor.execute("""
                INSERT INTO price (Vendor_Product_ID, Price_Amount, Last_Updated, Product_ID)
                VALUES (%s, %s, %s, %s)
            """, (vp_id, price, datetime.now(), p_id))
            
            cursor.execute("""
                INSERT INTO stock (Vendor_Product_ID, Quantity_Available)
                VALUES (%s, %s)
            """, (vp_id, random.randint(0, 50)))
            
            if random.random() < 0.2:
                cursor.execute("""
                    INSERT INTO discount (Vendor_Product_ID, Discount_Percentage, Start_Date, End_Date)
                    VALUES (%s, %s, %s, %s)
                """, (vp_id, random.randint(5, 30), datetime.now(), datetime.now() + timedelta(days=30)))
            
            links_count += 1
            
    print(f"Created {links_count} vendor-product relationships for {city}.")

def seed_all():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        clear_all_data(cursor)
        cat_ids = seed_categories(cursor)
        p_ids = seed_products(cursor, cat_ids)

        # Chennai Vendors
        chennai_vendors = [
            "Marina Fresh Groceries", "Chennai Daily Mart", "T. Nagar Veggies", "Adyar Dairy Hub", "Velachery Provisions",
            "Besant Nagar Kirana", "Madras Spice & Salt", "Guindy Organic Farm", "Mylapore Milk Point", "Anna Nagar Green Store",
            "Santhome Supermarket", "Nungambakkam General Store", "Kodambakkam Kitchen Needs", "Purasaiwalkam Pantry", "Saidapet Staples",
            "Tambaram Tea & Snacks", "Chromepet Cleaners", "Egmore Egg House", "Royapettah Rice Mill", "Kilpauk Kosher Store"
        ]
        seed_vendors_for_city(cursor, "Chennai", chennai_vendors, p_ids)

        # Mumbai Vendors
        mumbai_vendors = [
            "Mumbai Central Mart", "Bandra Fresh Bites", "Colaba Organic Store", "Dadar Veggie Hub", "Andheri Provisions",
            "Juhu Dairy Delight", "Borivali General Store", "Ghatkopar Groceries", "Malad Milk Point", "Powai Pantry",
            "Chembur Cleaners", "Worli Wellness Store", "Kurla Kitchen Needs", "Parel Provisions", "Vikhroli Veggies",
            "Mulund Mart", "Sion Supermarket", "Santacruz Staples", "Kandivali Kirana", "Vile Parle Veggies"
        ]
        seed_vendors_for_city(cursor, "Mumbai", mumbai_vendors, p_ids)

        # Bangalore Vendors
        bangalore_vendors = [
            "Indiranagar Fresh Mart", "Koramangala Daily Needs", "HSR Layout Veggies", "Whitefield Organic Store", "Jayanagar Dairy Hub",
            "MG Road Supermarket", "Malleshwaram Provisions", "Electronic City Kirana", "Banashankari Bakery", "Rajajinagar Rice Mill",
            "Bannerghatta Green Store", "Bellandur Pantry", "BTM Layout Staples", "Yeshwanthpur Yard", "Marathahalli Milk Point",
            "Hebbal Hygiene Store", "Frazer Town Fresh", "Ulsoor General Store", "JP Nagar Junction", "Basavanagudi Basket"
        ]
        seed_vendors_for_city(cursor, "Bangalore", bangalore_vendors, p_ids)

        conn.commit()
        print("All data seeded successfully for Chennai, Mumbai, and Bangalore!")

    except Exception as e:
        conn.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    seed_all()
