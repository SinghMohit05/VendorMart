import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def init_admin():
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM admin')
            if not cur.fetchone():
                admin_name = os.getenv("ADMIN_NAME", "Administrator")
                admin_email = os.getenv("ADMIN_EMAIL")
                admin_password = os.getenv("ADMIN_PASSWORD")
                cur.execute(
                    'INSERT INTO admin (Name, Email, Password) VALUES (%s, %s, %s)',
                    (admin_name, admin_email, admin_password)
                )
                conn.commit()
                print(f'Default admin created: {admin_email}')
            else:
                print('Admin user already exists.')
    finally:
        conn.close()

if __name__ == '__main__':
    init_admin()