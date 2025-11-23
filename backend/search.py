import requests
import json
from config import SERPER_API_KEY

def google_search(query):
    url = "https://google.serper.dev/search"
    payload = {"q": query}
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        return response.json()
    except Exception as e:
        print(f"Search Error: {e}")
        return {}

def summarize_result(search_json):
    """Extract the top 1–3 results"""
    if not search_json or "organic" not in search_json:
        return "No data found."

    results = search_json["organic"][:3]
    summary = ""
    for r in results:
        title = r.get("title", "No title")
        snippet = r.get("snippet", "No snippet")
        summary += f"- {title}: {snippet}\n"
    return summary

def extract_info(company):
    """Perform all required searches"""
    print(f"Searching details for: {company}...")
    data = {}
    searches = {
        "company_overview": f"{company} company overview",
        "revenue_info": f"{company} revenue 2024",
        "competitors": f"{company} top competitors",
        "funding_info": f"{company} funding history",
        "gtm_strategy": f"{company} go to market strategy",
    }

    for key, query in searches.items():
        data[key] = summarize_result(google_search(query))
    
    return data
