from flask import Blueprint, request, jsonify
from app.db import get_db_connection

ratings_bp = Blueprint('ratings', __name__)

@ratings_bp.route('/rate-vendor', methods=['POST'])
@ratings_bp.route('/api/v1/rate-vendor', methods=['POST'])
def rate_vendor():
    data = request.get_json() or {}
    vendor_id = data.get('vendor_id')
    raw_rating = data.get('rating')

    if not vendor_id or raw_rating is None:
        return jsonify({"error": "Vendor ID and Rating are required"}), 400

    try:
        rating = float(raw_rating)
        if rating < 1.0 or rating > 5.0:
            return jsonify({"error": "Rating must be between 1.0 and 5.0"}), 400
    except ValueError:
        return jsonify({"error": "Invalid rating format"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT Average_Rating FROM vendor_rating WHERE Vendor_ID = %s", (vendor_id,))
            res = cursor.fetchone()

            if res and res.get('Average_Rating') is not None:
                current_avg = float(res['Average_Rating'])
                # Weighted running average
                new_avg = round((current_avg * 0.7) + (rating * 0.3), 1)
                cursor.execute("UPDATE vendor_rating SET Average_Rating = %s WHERE Vendor_ID = %s", (new_avg, vendor_id))
            else:
                cursor.execute("INSERT INTO vendor_rating (Vendor_ID, Average_Rating) VALUES (%s, %s)", (vendor_id, rating))
                new_avg = rating

        conn.commit()
        return jsonify({
            "message": "Thank you for your rating!",
            "new_average": new_avg
        }), 200
    except Exception as e:
        print("RATING ERROR:", e)
        return jsonify({"error": "Failed to record rating"}), 500
    finally:
        conn.close()
