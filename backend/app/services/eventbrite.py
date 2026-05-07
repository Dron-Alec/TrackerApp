import hashlib
import json
import os
from typing import Any

import httpx

EVENTBRITE_BASE = "https://www.eventbriteapi.com/v3"

SEARCH_QUERIES = [
    "crypto blockchain conference",
    "digital assets financial conference",
    "AML compliance fintech",
    "cryptocurrency regulation audit",
    "BSA financial crime conference",
    "DeFi institutional finance",
    "stablecoin regulatory compliance",
]


def _make_id(external_id: str) -> str:
    return "eb_" + hashlib.md5(external_id.encode()).hexdigest()[:12]


def _parse_venue(venue: dict | None) -> dict:
    if not venue:
        return {"city": None, "state": None, "country": None, "venue": None}
    address = venue.get("address", {}) or {}
    return {
        "city": address.get("city"),
        "state": address.get("region"),
        "country": address.get("country"),
        "venue": venue.get("name"),
    }


def _parse_event(raw: dict) -> dict | None:
    name = (raw.get("name") or {}).get("text", "")
    description = (raw.get("description") or {}).get("text", "") or ""
    start = (raw.get("start") or {}).get("local", "")
    end = (raw.get("end") or {}).get("local", "")
    url = raw.get("url", "")
    external_id = raw.get("id", "")

    if not name or not external_id:
        return None

    location = _parse_venue(raw.get("venue"))

    return {
        "id": _make_id(external_id),
        "external_id": external_id,
        "name": name,
        "date_start": start[:10] if start else None,
        "date_end": end[:10] if end else None,
        "url": url,
        "description": description[:2000],
        "categories": json.dumps([]),
        "tags": json.dumps([]),
        "source": "eventbrite",
        "status": "watching",
        **location,
    }


async def fetch_eventbrite_events() -> list[dict]:
    api_key = os.getenv("EVENTBRITE_API_KEY", "")
    if not api_key:
        return []

    seen: set[str] = set()
    results: list[dict] = []

    async with httpx.AsyncClient(timeout=20, verify=False) as client:
        for query in SEARCH_QUERIES:
            try:
                resp = await client.get(
                    f"{EVENTBRITE_BASE}/events/search/",
                    headers={"Authorization": f"Bearer {api_key}"},
                    params={
                        "q": query,
                        "sort_by": "date",
                        "expand": "venue",
                        "start_date.range_start": "2025-01-01T00:00:00Z",
                        "location.address": "United States",
                        "page_size": 20,
                    },
                )
                resp.raise_for_status()
                data: dict[str, Any] = resp.json()
                for raw in data.get("events", []):
                    event = _parse_event(raw)
                    if event and event["id"] not in seen:
                        seen.add(event["id"])
                        results.append(event)
            except Exception:
                continue

    return results
