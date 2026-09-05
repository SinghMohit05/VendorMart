import requests

BASE = 'http://localhost:5173'

print('--- 1. Testing Customer Login ---')
res = requests.post(f'{BASE}/login', json={'email': 'demo@vendormart.com', 'password': 'password123'})
assert res.status_code == 200, f'Login failed: {res.text}'
user_id = res.json()['user']['user_id']
print(f'Customer logged in: user_id={user_id}, name={res.json()["user"]["username"]}')

print('\n--- 2. Testing Cities and Products ---')
for city in ['Mumbai', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Pune']:
    r = requests.get(f'{BASE}/products', params={'city': city})
    assert r.status_code == 200
    print(f'City {city:12}: {len(r.json())} vendor products found')

print('\n--- 3. Testing Price Comparison for Product #1 ---')
r = requests.get(f'{BASE}/products/1/prices', params={'city': 'Mumbai'})
assert r.status_code == 200
data = r.json()
p_name = data['product']['name']
v_count = len(data['vendor_prices'])
print(f'Product: {p_name}, Vendors offering it: {v_count}')
cheapest = min(data['vendor_prices'], key=lambda x: x['final_price'])
print(f'Cheapest vendor: {cheapest["shop_name"]} at Rs {cheapest["final_price"]} (stock: {cheapest["stock"]})')

print('\n--- 4. Testing Wishlist & Atomic Checkout ---')
requests.post(f'{BASE}/wishlist', json={'user_id': user_id, 'vendor_product_id': cheapest['vendor_product_id'], 'quantity': 2})
wish = requests.get(f'{BASE}/wishlist/{user_id}').json()
print(f'Wishlist items: {len(wish)}')

r_checkout = requests.post(f'{BASE}/checkout', json={'user_id': user_id, 'payment_method': 'UPI', 'address': 'Shop Pickup'})
assert r_checkout.status_code == 201
print(f'Checkout result: {r_checkout.json()["message"]} (Orders created: {r_checkout.json()["order_ids"]})')

print('\n--- 5. Testing Orders & Vendor Rating ---')
orders = requests.get(f'{BASE}/orders/{user_id}').json()
print(f'Customer orders count: {len(orders)}')
latest_order = orders[0]
print(f'Latest order #VM-{latest_order["order_id"]}, Status: {latest_order["display_status"]}, Total: Rs {latest_order["total_amount"]}')

r_rate = requests.post(f'{BASE}/rate-vendor', json={'vendor_id': latest_order['vendor_id'], 'rating': 5.0})
assert r_rate.status_code == 200
print(f'Vendor rating submitted: {r_rate.json()}')

print('\n--- 6. Testing Vendor Portal ---')
v_auth = requests.post(f'{BASE}/vendor/login', json={'email': 'mumbaicentralmart@example.com', 'password': 'password123'})
assert v_auth.status_code == 200
v_id = v_auth.json()['vendor']['vendor_id']
v_shop = v_auth.json()['vendor']['shop_name']
print(f'Vendor logged in: {v_shop} (id={v_id})')

v_orders = requests.get(f'{BASE}/vendor/orders/{v_id}').json()
print(f'Vendor orders count: {len(v_orders)}')

r_status = requests.put(f'{BASE}/vendor/orders/{latest_order["order_id"]}/status', json={'status': 'SHIPPED'})
assert r_status.status_code == 200
print(f'Order status updated: {r_status.json()}')

v_inv = requests.get(f'{BASE}/vendor/inventory/{v_id}').json()
print(f'Vendor inventory count: {len(v_inv)} items')

print('\n--- 7. Testing Admin Portal ---')
a_auth = requests.post(f'{BASE}/admin/login', json={'email': 'admin@example.com', 'password': 'admin123'})
assert a_auth.status_code == 200
print(f'Admin logged in: {a_auth.json()["admin"]["name"]}')

a_overview = requests.get(f'{BASE}/admin/overview').json()
print(f'Admin Overview: Total Vendors={a_overview["total_vendors"]}, Revenue=Rs {a_overview["total_revenue"]}, Orders={a_overview["total_orders"]}')

a_stats = requests.get(f'{BASE}/admin/stats').json()
print(f'Admin Vendor Rankings: {len(a_stats)} vendors ranked')

print('\n======================================================')
print('  SUCCESS: ALL USER, VENDOR, AND ADMIN FLOWS VERIFIED!  ')
print('======================================================')
