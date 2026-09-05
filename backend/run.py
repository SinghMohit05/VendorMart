import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    port = Config.FLASK_PORT
    print(f"==================================================")
    print(f" VendorMart Backend API running on port {port}")
    print(f" Local URL: http://localhost:{port}")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=Config.FLASK_DEBUG)
