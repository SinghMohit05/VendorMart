from db import get_db_connection

def update_schema():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Add Password column to vendor if not exists
        cursor.execute("SHOW COLUMNS FROM vendor LIKE 'Password'")
        if not cursor.fetchone():
            print("Adding Password column to vendor...")
            cursor.execute("ALTER TABLE vendor ADD COLUMN Password VARCHAR(255) DEFAULT 'password123'")
            conn.commit()
            print("Password column added.")
        else:
            print("Password column already exists.")
            
        # Update existing vendors to have the default password if null
        cursor.execute("UPDATE vendor SET Password = 'password123' WHERE Password IS NULL")
        conn.commit()
        print("Schema update complete.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
