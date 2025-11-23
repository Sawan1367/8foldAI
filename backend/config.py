import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY")
SERPER_API_KEY = os.environ.get("SERPER_API_KEY")
DB_PATH = os.environ.get("ACCOUNTS_DB", "accounts.db")
PORT = int(os.environ.get("PORT", 5000))
