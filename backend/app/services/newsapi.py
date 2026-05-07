import hashlib
import json
import os

import httpx
import anthropic

NEWSAPI_BASE = "https://newsapi.org/v2/everything"

SEARCH_QUERIES = [
    "crypto conference 2025",
    "blockchain summit 2025 financial",
    "AML BSA compliance conference 2025",
    "digital assets institutional conference 2025",
    "cryptocurrency regulation summit 2025",
    "fintech compliance conference audit 2025",
]


async def _fetch_articles() -> list[dict]:
    api_key = os.getenv("NEWS_API_KEY", "")
    if not api_key:
        return []

    seen: set[str] = set()
    articles: list[dict] = []

    async with httpx.AsyncClient(timeout=20) as client:
        for query in SEARCH_QUERIES:
            try:
                resp = await client.get(
                    NEWSAPI_BASE,
                    params={
                        "q": query,
                        "language": "en",
                        "sortBy": "publishedAt",
                        "pageSize": 15,
                        "apiKey": api_key,
                    },
                )
                resp.raise_for_status()
                for article in resp.json().get("articles", []):
                    title = article.get("title", "")
                    if title and title not in seen:
                        seen.add(title)
                        articles.append(article)
            except Exception:
                continue

    return articles


async def _extract_events(articles: list[dict]) -> list[dict]:
    """Single batched Claude call to extract event details from up to 15 articles."""
    if not articles:
        return []

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not anthropic_key:
        return []

    batch = articles[:15]
    snippets = "\n".join(
        f"[{i+1}] Title: {a.get('title','')}\n"
        f"    Description: {(a.get('description') or '')[:200]}\n"
        f"    URL: {a.get('url','')}"
        for i, a in enumerate(batch)
    )

    client = anthropic.Anthropic(api_key=anthropic_key)
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=[
                {
                    "type": "text",
                    "text": (
                        "You extract specific upcoming conference/event details from news snippets. "
                        "Only extract events that have not yet occurred (future events). "
                        "Ignore general news articles that aren't announcing a specific event."
                    ),
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": (
                        "From these news snippets, identify any specific upcoming conferences or events "
                        "related to: crypto, blockchain, digital assets, AML/BSA compliance, fintech, "
                        "or financial regulation.\n\n"
                        f"{snippets}\n\n"
                        "Output ONLY a JSON array. For each identified event include:\n"
                        '{"name":"...","date_start":"YYYY-MM-DD or null","date_end":"YYYY-MM-DD or null",'
                        '"city":"...","state":"...","country":"...","venue":"...","url":"...","description":"1-2 sentences"}\n\n'
                        "Return [] if no specific events found."
                    ),
                }
            ],
        )
        raw = response.content[0].text.strip()
        extracted: list[dict] = json.loads(raw)
    except Exception:
        return []

    results: list[dict] = []
    seen_names: set[str] = set()

    for item in extracted:
        name = (item.get("name") or "").strip()
        if not name or name in seen_names:
            continue
        seen_names.add(name)

        event_id = "news_" + hashlib.md5(name.lower().encode()).hexdigest()[:12]
        results.append(
            {
                "id": event_id,
                "external_id": event_id,
                "name": name,
                "date_start": item.get("date_start"),
                "date_end": item.get("date_end"),
                "city": item.get("city"),
                "state": item.get("state"),
                "country": item.get("country") or "USA",
                "venue": item.get("venue"),
                "url": item.get("url"),
                "description": (item.get("description") or "")[:2000],
                "categories": json.dumps([]),
                "tags": json.dumps([]),
                "source": "news",
                "status": "watching",
            }
        )

    return results


async def fetch_news_events() -> list[dict]:
    articles = await _fetch_articles()
    return await _extract_events(articles)
