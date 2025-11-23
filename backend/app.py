from flask import Flask
from flask_cors import CORS
from config import PORT
from database import init_db, close_connection
from routes_enhanced import api_bp  # Use enhanced routes

app = Flask(__name__)
CORS(app)

# Register Blueprint
app.register_blueprint(api_bp, url_prefix="/api")

# Register Teardown
app.teardown_appcontext(close_connection)

if __name__ == "__main__":
    init_db(app)
    app.run(host="0.0.0.0", port=PORT, debug=True)
