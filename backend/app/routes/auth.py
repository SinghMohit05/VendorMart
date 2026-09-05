from flask import Blueprint, request, jsonify
from app.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@auth_bp.route('/api/v1/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('username') or data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    phone = data.get('phone', '9999999999')

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT User_ID FROM user WHERE LOWER(Email)=%s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "An account with this email already exists"}), 409

            cursor.execute("""
                INSERT INTO user (Name, Email, Password, Phone)
                VALUES (%s, %s, %s, %s)
            """, (name, email, password, phone))
            user_id = cursor.lastrowid
            
        conn.commit()
        return jsonify({
            "message": "Registered successfully!",
            "user": {
                "user_id": user_id,
                "username": name,
                "email": email,
                "phone": phone
            }
        }), 201
    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()


@auth_bp.route('/login', methods=['POST'])
@auth_bp.route('/api/v1/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    User_ID as user_id,
                    Name as username,
                    Email as email,
                    Phone as phone
                FROM user
                WHERE LOWER(Email)=%s AND Password=%s
            """, (email, password))
            user = cursor.fetchone()

        if user:
            return jsonify({"user": user})
        else:
            return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()


@auth_bp.route('/vendor/login', methods=['POST'])
@auth_bp.route('/api/v1/auth/vendor/login', methods=['POST'])
def vendor_login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    Vendor_ID as vendor_id, 
                    Vendor_Name as vendor_name, 
                    Shop_Name as shop_name, 
                    Email as email,
                    City as city,
                    Phone as phone
                FROM vendor 
                WHERE LOWER(Email)=%s AND Password=%s
            """, (email, password))
            vendor = cursor.fetchone()

        if vendor:
            return jsonify({"vendor": vendor})
        else:
            return jsonify({"error": "Invalid vendor email or password"}), 401
    except Exception as e:
        print("VENDOR LOGIN ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()


@auth_bp.route('/admin/login', methods=['POST'])
@auth_bp.route('/api/v1/auth/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT Admin_ID as admin_id, Name as name, Email as email
                FROM admin 
                WHERE LOWER(Email)=%s AND Password=%s
            """, (email, password))
            admin = cursor.fetchone()

        if admin:
            return jsonify({"admin": admin})
        else:
            return jsonify({"error": "Invalid admin credentials"}), 401
    except Exception as e:
        print("ADMIN LOGIN ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()
