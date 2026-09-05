import os
import re
import sqlite3
import pymysql
from app.config import Config

_USE_SQLITE_FALLBACK = False
_SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vendormart.db")


class SQLiteDictCursor:
    def __init__(self, connection):
        self.connection = connection
        self.cursor = connection.cursor()
        self.lastrowid = None
        self.rowcount = -1

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def _prepare_sql(self, sql):
        # Convert MySQL comments (# comment) to SQL standard (-- comment)
        lines = []
        for line in sql.split("\n"):
            stripped = line.strip()
            if stripped.startswith("#"):
                lines.append("-- " + stripped[1:])
            else:
                lines.append(line)
        sql = "\n".join(lines)

        # Replace MySQL %s parameter placeholders with SQLite ?
        # Handle cases where %s is used as parameter
        sql = re.sub(r'(?<!%)%s', '?', sql)
        # Handle %% as %
        sql = sql.replace('%%', '%')
        return sql

    def execute(self, sql, params=None):
        prepared_sql = self._prepare_sql(sql)
        try:
            if params is not None:
                # Convert list or tuple
                if isinstance(params, (list, tuple)):
                    self.cursor.execute(prepared_sql, params)
                else:
                    self.cursor.execute(prepared_sql, (params,))
            else:
                self.cursor.execute(prepared_sql)
            self.lastrowid = self.cursor.lastrowid
            self.rowcount = self.cursor.rowcount
            return self
        except Exception as e:
            # Re-raise with context
            raise e

    def executemany(self, sql, params_list):
        prepared_sql = self._prepare_sql(sql)
        self.cursor.executemany(prepared_sql, params_list)
        self.lastrowid = self.cursor.lastrowid
        self.rowcount = self.cursor.rowcount
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def close(self):
        self.cursor.close()


class SQLiteConnectionWrapper:
    def __init__(self, raw_conn):
        self.raw_conn = raw_conn
        self.raw_conn.row_factory = sqlite3.Row

    def cursor(self, *args, **kwargs):
        return SQLiteDictCursor(self.raw_conn)

    def commit(self):
        self.raw_conn.commit()

    def rollback(self):
        self.raw_conn.rollback()

    def close(self):
        self.raw_conn.close()


def init_sqlite_schema_and_seed(db_path):
    """Initializes schema and seeds rich dataset into SQLite if newly created."""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS product_category (
        Category_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Category_Name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product (
        Product_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Product_Name VARCHAR(255) NOT NULL,
        Description TEXT,
        Image_URL TEXT,
        Category_ID INTEGER,
        FOREIGN KEY (Category_ID) REFERENCES product_category(Category_ID)
    );

    CREATE TABLE IF NOT EXISTS vendor (
        Vendor_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_Name VARCHAR(255) NOT NULL,
        Shop_Name VARCHAR(255) NOT NULL,
        Phone VARCHAR(50),
        Email VARCHAR(255) UNIQUE,
        Address TEXT,
        City VARCHAR(100),
        Registration_Date DATETIME,
        Password VARCHAR(255) DEFAULT 'password123'
    );

    CREATE TABLE IF NOT EXISTS vendor_rating (
        Rating_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_ID INTEGER NOT NULL,
        Average_Rating REAL DEFAULT 4.0,
        FOREIGN KEY (Vendor_ID) REFERENCES vendor(Vendor_ID)
    );

    CREATE TABLE IF NOT EXISTS vendor_product (
        Vendor_Product_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_ID INTEGER NOT NULL,
        Product_ID INTEGER NOT NULL,
        FOREIGN KEY (Vendor_ID) REFERENCES vendor(Vendor_ID),
        FOREIGN KEY (Product_ID) REFERENCES product(Product_ID)
    );

    CREATE TABLE IF NOT EXISTS price (
        Price_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_Product_ID INTEGER NOT NULL,
        Price_Amount REAL NOT NULL,
        Last_Updated DATETIME,
        Product_ID INTEGER,
        FOREIGN KEY (Vendor_Product_ID) REFERENCES vendor_product(Vendor_Product_ID)
    );

    CREATE TABLE IF NOT EXISTS stock (
        Stock_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_Product_ID INTEGER NOT NULL,
        Quantity_Available INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (Vendor_Product_ID) REFERENCES vendor_product(Vendor_Product_ID)
    );

    CREATE TABLE IF NOT EXISTS discount (
        Discount_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Vendor_Product_ID INTEGER NOT NULL,
        Discount_Percentage REAL DEFAULT 0,
        Start_Date DATETIME,
        End_Date DATETIME,
        FOREIGN KEY (Vendor_Product_ID) REFERENCES vendor_product(Vendor_Product_ID)
    );

    CREATE TABLE IF NOT EXISTS user (
        User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name VARCHAR(255) NOT NULL,
        Email VARCHAR(255) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Phone VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
        Wishlist_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        User_ID INTEGER NOT NULL,
        FOREIGN KEY (User_ID) REFERENCES user(User_ID)
    );

    CREATE TABLE IF NOT EXISTS wishlist_item (
        Wishlist_Item_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Wishlist_ID INTEGER NOT NULL,
        Product_ID INTEGER NOT NULL,
        Vendor_Product_ID INTEGER NOT NULL,
        Quantity INTEGER DEFAULT 1,
        FOREIGN KEY (Wishlist_ID) REFERENCES wishlist(Wishlist_ID),
        FOREIGN KEY (Product_ID) REFERENCES product(Product_ID),
        FOREIGN KEY (Vendor_Product_ID) REFERENCES vendor_product(Vendor_Product_ID)
    );

    CREATE TABLE IF NOT EXISTS orders (
        Order_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        User_ID INTEGER NOT NULL,
        Vendor_ID INTEGER NOT NULL,
        Order_Date DATETIME,
        Total_Amount REAL NOT NULL,
        Order_Status VARCHAR(50) DEFAULT 'PAID',
        FOREIGN KEY (User_ID) REFERENCES user(User_ID),
        FOREIGN KEY (Vendor_ID) REFERENCES vendor(Vendor_ID)
    );

    CREATE TABLE IF NOT EXISTS order_item (
        Order_Item_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Order_ID INTEGER NOT NULL,
        Product_ID INTEGER NOT NULL,
        Quantity INTEGER NOT NULL,
        Price REAL NOT NULL,
        FOREIGN KEY (Order_ID) REFERENCES orders(Order_ID),
        FOREIGN KEY (Product_ID) REFERENCES product(Product_ID)
    );

    CREATE TABLE IF NOT EXISTS delivery (
        Delivery_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Order_ID INTEGER NOT NULL,
        Delivery_Status VARCHAR(50) DEFAULT 'SHIPPED',
        Expected_Date DATETIME,
        FOREIGN KEY (Order_ID) REFERENCES orders(Order_ID)
    );

    CREATE TABLE IF NOT EXISTS payment (
        Payment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Order_ID INTEGER NOT NULL,
        Payment_Method VARCHAR(50) DEFAULT 'UPI',
        Payment_Status VARCHAR(50) DEFAULT 'COMPLETED',
        Payment_Date DATE,
        FOREIGN KEY (Order_ID) REFERENCES orders(Order_ID)
    );

    CREATE TABLE IF NOT EXISTS admin (
        Admin_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name VARCHAR(255) NOT NULL,
        Email VARCHAR(255) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL
    );
    """)

    # Check if products already exist
    cur.execute("SELECT COUNT(*) FROM product")
    count = cur.fetchone()[0]
    if count == 0:
        print("[DB] Populating SQLite database with VendorMart catalog and seed data...")
        _seed_sqlite_data(cur)
        conn.commit()
        print("[DB] SQLite database populated successfully.")

    # Check admin
    cur.execute("SELECT COUNT(*) FROM admin")
    if cur.fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO admin (Name, Email, Password) VALUES (?, ?, ?)",
            (Config.ADMIN_NAME, Config.ADMIN_EMAIL, Config.ADMIN_PASSWORD)
        )
        conn.commit()

    # Check default test customer
    cur.execute("SELECT COUNT(*) FROM user WHERE Email = 'demo@vendormart.com'")
    if cur.fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO user (Name, Email, Password, Phone) VALUES (?, ?, ?, ?)",
            ("Demo Customer", "demo@vendormart.com", "password123", "9876543210")
        )
        conn.commit()

    conn.close()


def _seed_sqlite_data(cursor):
    import random
    from datetime import datetime, timedelta

    categories = ['Groceries', 'Fruits & Vegetables', 'Dairy & Bakery', 'Personal Care', 'Home Essentials']
    cat_ids = []
    for cat in categories:
        cursor.execute("INSERT INTO product_category (Category_Name) VALUES (?)", (cat,))
        cat_ids.append(cursor.lastrowid)

    cat1, cat2, cat3, cat4, cat5 = cat_ids

    product_data = [
        # Groceries (cat1)
        ("Ashirvaad Atta", "Superior MP Whole Wheat Flour (5kg).", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800", cat1),
        ("Fortune Sunflower Oil", "Refined sunflower oil (1L).", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800", cat1),
        ("Daawat Basmati Rice", "Long grain aromatic rice (1kg).", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800", cat1),
        ("Tata Salt", "Vacuum evaporated iodized salt (1kg).", "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800", cat1),
        ("Toor Dal", "Premium quality yellow pigeon peas (1kg).", "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800", cat1),
        ("Sugar", "Refined white sugar (1kg).", "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800", cat1),
        ("Red Label Tea", "High quality tea leaves with natural flavors.", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800", cat1),
        ("Nestle Maggi", "Ready-to-eat instant masala noodles (Pack of 4).", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800", cat1),
        ("Ketchup", "Tangy tomato ketchup for snacking (500g).", "https://images.unsplash.com/photo-1585325701165-351af916e581?w=800", cat1),
        ("Garlic Paste", "Strong aromatic ginger garlic paste (200g).", "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800", cat1),
        ("Green Moong Dal", "Whole green gram lentils (1kg).", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800", cat1),
        ("Pasta", "Italian durum wheat macaroni (500g).", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800", cat1),
        ("Poha", "Premium thick flattened rice (500g).", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", cat1),
        ("Black Pepper", "Freshly grounded black pepper (100g).", "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800", cat1),
        ("Honey", "Pure natural forest honey (250g).", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800", cat1),
        ("Turmeric Powder", "Pure haldi (200g).", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800", cat1),

        # Fruits & Vegetables (cat2)
        ("Fresh Tomatoes", "Juicy red farm-fresh tomatoes (1kg).", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800", cat2),
        ("Red Onions", "High-quality kitchen essential onions (1kg).", "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800", cat2),
        ("Potatoes", "Fresh earth-grown starchy potatoes (1kg).", "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800", cat2),
        ("Fresh Spinach", "Green leafy vegetable rich in iron.", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800", cat2),
        ("Banana", "Fresh yellow ripe bananas (1 dozen).", "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800", cat2),
        ("Apples", "Crunchy and sweet Kashmiri apples (1kg).", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800", cat2),
        ("Green Chillies", "Hot and spicy fresh chillies (100g).", "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800", cat2),
        ("Ginger", "Fresh aromatic ginger root (250g).", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800", cat2),
        ("Lemons", "Tangy fresh yellow lemons (pack of 4).", "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800", cat2),
        ("Cauliflower", "Fresh large white cauliflower florets.", "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=800", cat2),
        ("Carrots", "Sweet and crunchy orange carrots (500g).", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800", cat2),
        ("Cucumber", "Hydrating fresh green cucumber (500g).", "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800", cat2),

        # Dairy & Bakery (cat3)
        ("Fresh Milk", "Creamy full-fat milk (500ml).", "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800", cat3),
        ("Amul Butter", "Pure and delicious table butter (100g).", "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800", cat3),
        ("Fresh Brown Bread", "Healthy whole wheat sliced bread.", "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800", cat3),
        ("Paneer", "Fresh and soft cottage cheese (200g).", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800", cat3),
        ("Fresh Eggs", "White farm-fresh eggs (pack of 6).", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800", cat3),
        ("Greek Yogurt", "Creamy unsweetened yogurt (200g).", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800", cat3),
        ("Cheese Slices", "Premium processed cheese slices (Pack of 10).", "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800", cat3),
        ("Rusks", "Crunchy suji tea-time rusks.", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800", cat3),

        # Personal Care (cat4)
        ("Dettol Soap", "Anti-bacterial bathing soap (125g).", "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800", cat4),
        ("Dove Shampoo", "Deeply nourishing hair therapy (180ml).", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800", cat4),
        ("Colgate Toothpaste", "Strong teeth with calcium boost (150g).", "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800", cat4),
        ("Nivea Cream", "Intense hydration for dry skin (100ml).", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800", cat4),
        ("Hand Wash", "Gentle liquid hand soap (250ml).", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800", cat4),
        ("Aloe Vera Gel", "Pure soothing aloe vera gel (150ml).", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", cat4),

        # Home Essentials (cat5)
        ("Vim Liquid", "Strong grease cutting dishwash (500ml).", "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800", cat5),
        ("Surf Excel", "Tough stain removal detergent (1kg).", "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800", cat5),
        ("Harpic Cleaner", "Professional grade toilet cleaner (500ml).", "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800", cat5),
        ("Garbage Bags", "Heavy-duty biodegradable bags (Pack of 30).", "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800", cat5),
        ("Matchboxes", "Safety matches (pack of 10).", "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800", cat5),
        ("Floor Cleaner", "Pine scented disinfectant liquid (1L).", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800", cat5)
    ]

    p_ids = []
    for name, desc, img, cat_id in product_data:
        cursor.execute(
            "INSERT INTO product (Product_Name, Description, Image_URL, Category_ID) VALUES (?, ?, ?, ?)",
            (name, desc, img, cat_id)
        )
        p_ids.append(cursor.lastrowid)

    cities_vendors = {
        "Mumbai": [
            ("Mumbai Central Mart", "mumbaicentralmart@example.com"),
            ("Bandra Fresh Bites", "bandrafresh@example.com"),
            ("Colaba Organic Store", "colabaorganic@example.com"),
            ("Andheri Provisions", "andheriprovisions@example.com"),
            ("Juhu Dairy Delight", "juhudairy@example.com"),
            ("Powai Pantry", "powaipantry@example.com")
        ],
        "Bangalore": [
            ("Indiranagar Fresh Mart", "indiranagarmart@example.com"),
            ("Koramangala Daily Needs", "koramangaladaily@example.com"),
            ("HSR Layout Veggies", "hsrveggies@example.com"),
            ("Whitefield Organic Store", "whitefieldorganic@example.com"),
            ("Jayanagar Dairy Hub", "jayanagardairy@example.com")
        ],
        "Chennai": [
            ("Marina Fresh Groceries", "marinafresh@example.com"),
            ("Chennai Daily Mart", "chennaidaily@example.com"),
            ("T. Nagar Veggies", "tnagarveggies@example.com"),
            ("Adyar Dairy Hub", "adyardairy@example.com"),
            ("Besant Nagar Kirana", "besantkirana@example.com")
        ],
        "Delhi": [
            ("Connaught Place Provisions", "cpdelhi@example.com"),
            ("Hauz Khas Fresh Market", "hauzkhas@example.com"),
            ("South Ext Essentials", "southext@example.com"),
            ("Karol Bagh Daily Super", "karolbagh@example.com")
        ],
        "Hyderabad": [
            ("Banjara Hills Fresh", "banjarahills@example.com"),
            ("Jubilee Hills Pantry", "jubileehills@example.com"),
            ("Hitec City Mart", "hiteccity@example.com"),
            ("Gachibowli Groceries", "gachibowli@example.com")
        ],
        "Pune": [
            ("Kothrud Daily Needs", "kothrud@example.com"),
            ("Viman Nagar Supermarket", "vimannagar@example.com"),
            ("Koregaon Park Organic", "koregaonpark@example.com"),
            ("Baner Fresh Hub", "banerfresh@example.com")
        ]
    }

    random.seed(42)  # Deterministic seed for reproducible realistic prices

    for city, vendors_list in cities_vendors.items():
        for shop_name, email in vendors_list:
            v_name = shop_name.replace("Mart", "").replace("Store", "").replace("Pantry", "").strip()
            phone = f"98200{random.randint(10000, 99999)}"
            address = f"Shop {random.randint(1, 100)}, Market Road, {city}"
            reg_date = datetime.now() - timedelta(days=random.randint(30, 400))

            cursor.execute("""
                INSERT INTO vendor (Vendor_Name, Shop_Name, Phone, Email, Address, City, Registration_Date, Password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (v_name, shop_name, phone, email, address, city, reg_date, "password123"))
            v_id = cursor.lastrowid

            rating = round(random.uniform(4.0, 5.0), 1)
            cursor.execute("INSERT INTO vendor_rating (Vendor_ID, Average_Rating) VALUES (?, ?)", (v_id, rating))

            # Assign a generous sample of products to each vendor
            num_products = random.randint(len(p_ids) - 8, len(p_ids))
            assigned_products = random.sample(p_ids, num_products)

            for p_id in assigned_products:
                cursor.execute(
                    "INSERT INTO vendor_product (Vendor_ID, Product_ID) VALUES (?, ?)",
                    (v_id, p_id)
                )
                vp_id = cursor.lastrowid

                # Reasonable price variation
                base_price = float(random.randint(35, 380))
                cursor.execute("""
                    INSERT INTO price (Vendor_Product_ID, Product_ID, Price_Amount, Last_Updated)
                    VALUES (?, ?, ?, ?)
                """, (vp_id, p_id, base_price, datetime.now()))

                stock_qty = random.randint(5, 60)
                cursor.execute("""
                    INSERT INTO stock (Vendor_Product_ID, Quantity_Available)
                    VALUES (?, ?)
                """, (vp_id, stock_qty))

                # 30% chance of an attractive discount
                if random.random() < 0.35:
                    disc = float(random.choice([5, 10, 15, 20, 25]))
                    cursor.execute("""
                        INSERT INTO discount (Vendor_Product_ID, Discount_Percentage, Start_Date, End_Date)
                        VALUES (?, ?, ?, ?)
                    """, (vp_id, disc, datetime.now(), datetime.now() + timedelta(days=30)))


def get_db_connection():
    global _USE_SQLITE_FALLBACK

    if not _USE_SQLITE_FALLBACK:
        try:
            conn = pymysql.connect(
                host=Config.DB_HOST,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=2
            )
            return conn
        except Exception as e:
            # MySQL connection unreachable, switch to SQLite
            print(f"[DB Notice] MySQL connection failed ({e}). Activating embedded SQLite database fallback...")
            _USE_SQLITE_FALLBACK = True

    # Fallback to embedded SQLite database
    if not os.path.exists(_SQLITE_DB_PATH):
        init_sqlite_schema_and_seed(_SQLITE_DB_PATH)
    else:
        # Ensure schema integrity
        init_sqlite_schema_and_seed(_SQLITE_DB_PATH)

    raw_conn = sqlite3.connect(_SQLITE_DB_PATH)
    return SQLiteConnectionWrapper(raw_conn)
