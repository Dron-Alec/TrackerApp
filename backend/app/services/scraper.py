import asyncio
import hashlib
import json
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

# Corporate SSL inspection proxy presents a self-signed cert; disable verification.
CLIENT_KWARGS = {"timeout": 15, "headers": HEADERS, "verify": False}


def _make_id(source: str, name: str) -> str:
    key = f"{source}_{name}"
    return source[:3] + "_" + hashlib.md5(key.encode()).hexdigest()[:12]


async def scrape_acams() -> list[dict]:
    """Scrape ACAMS upcoming conferences and events."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://www.acams.org/en/events")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.select("article.event-card, div.event-item, li.event"):
                name_el = card.select_one("h2, h3, .event-title, .title")
                date_el = card.select_one(".event-date, .date, time")
                location_el = card.select_one(".event-location, .location")
                link_el = card.select_one("a[href]")

                if not name_el:
                    continue

                name = name_el.get_text(strip=True)
                date_text = date_el.get_text(strip=True) if date_el else ""
                location_text = location_el.get_text(strip=True) if location_el else ""
                url = link_el["href"] if link_el else "https://www.acams.org/en/events"

                if not url.startswith("http"):
                    url = "https://www.acams.org" + url

                results.append({
                    "id": _make_id("acams", name),
                    "name": name,
                    "date_start": None,
                    "date_end": None,
                    "city": location_text.split(",")[0].strip() if location_text else None,
                    "country": "USA",
                    "venue": None,
                    "url": url,
                    "description": f"ACAMS event: {name}. {date_text}. {location_text}",
                    "categories": json.dumps(["bsa_aml", "risk_consulting"]),
                    "tags": json.dumps(["AML", "BSA", "compliance", "FinCEN"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("acams", name),
                })
    except Exception:
        pass
    return results


async def scrape_iia() -> list[dict]:
    """Scrape IIA (Institute of Internal Auditors) upcoming conferences."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get(
                "https://www.theiia.org/en/events/conferences-and-seminars/"
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.select("article, .event-card, .conference-item, li.event"):
                name_el = card.select_one("h2, h3, h4, .title, .event-name")
                date_el = card.select_one(".date, time, .event-date")
                link_el = card.select_one("a[href]")

                if not name_el:
                    continue

                name = name_el.get_text(strip=True)
                if not name or len(name) < 5:
                    continue

                date_text = date_el.get_text(strip=True) if date_el else ""
                url = link_el["href"] if link_el else "https://www.theiia.org/en/events/"

                if not url.startswith("http"):
                    url = "https://www.theiia.org" + url

                results.append({
                    "id": _make_id("iia", name),
                    "name": name,
                    "date_start": None,
                    "date_end": None,
                    "city": None,
                    "country": "USA",
                    "venue": None,
                    "url": url,
                    "description": f"IIA Conference: {name}. {date_text}",
                    "categories": json.dumps(["audit", "risk_consulting"]),
                    "tags": json.dumps(["internal audit", "CAE", "risk"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("iia", name),
                })
    except Exception:
        pass
    return results


CURATED_EVENTS: list[dict] = [
    {
        "id": "curated_consensus2025",
        "name": "Consensus 2025",
        "date_start": "2025-05-14",
        "date_end": "2025-05-16",
        "city": "Austin",
        "state": "TX",
        "country": "USA",
        "venue": "Austin Convention Center",
        "url": "https://consensus.coindesk.com",
        "description": (
            "CoinDesk's flagship annual crypto conference. Draws 15,000+ attendees "
            "including executives, regulators, compliance officers, and institutional "
            "investors. Key conversations around digital asset regulation, audit "
            "standards, and institutional adoption."
        ),
        "categories": json.dumps(["audit", "bsa_aml", "risk_consulting", "advisory", "crypto_general"]),
        "tags": json.dumps(["institutional", "regulatory", "DeFi", "stablecoins"]),
        "source": "manual",
        "status": "watching",
        "external_id": "consensus2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "Pro Pass", "price": "$799"},
                {"label": "Platinum Pass", "price": "$1,499"},
                {"label": "Piranha Pass", "price": "$4,999"},
            ],
            "registrationUrl": "https://consensus.coindesk.com/register/",
            "notes": "2025 Austin pricing (estimated). Group discounts available for 5+ attendees.",
        }),
    },
    {
        "id": "curated_acams2025",
        "name": "ACAMS Annual AML and Financial Crime Conference 2025",
        "date_start": "2025-09-15",
        "date_end": "2025-09-17",
        "city": "Las Vegas",
        "state": "NV",
        "country": "USA",
        "venue": "Caesars Palace",
        "url": "https://www.acams.org",
        "description": (
            "The premier global event for AML and financial crime professionals. "
            "Attracts CCOs, BSA officers, regulators, and law enforcement from top "
            "financial institutions. Growing digital asset compliance track."
        ),
        "categories": json.dumps(["bsa_aml", "risk_consulting", "audit"]),
        "tags": json.dumps(["BSA", "AML", "compliance", "FinCEN", "sanctions"]),
        "source": "manual",
        "status": "watching",
        "external_id": "acams_annual_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "ACAMS Member", "price": "$1,295"},
                {"label": "Non-Member", "price": "$2,095"},
            ],
            "registrationUrl": "https://www.acams.org/en/events/the-assembly",
            "notes": "Flagship ACAMS annual conference. Member pricing requires active ACAMS membership.",
        }),
    },
    {
        "id": "curated_money2020_2025",
        "name": "Money20/20 USA 2025",
        "date_start": "2025-10-26",
        "date_end": "2025-10-29",
        "city": "Las Vegas",
        "state": "NV",
        "country": "USA",
        "venue": "The Venetian Expo",
        "url": "https://us.money2020.com",
        "description": (
            "Global fintech and payments conference with a major digital assets track. "
            "Heavy institutional attendance — banks, fintechs, card networks, and "
            "regulators. Strong opportunity for BSA/AML and advisory conversations."
        ),
        "categories": json.dumps(["bsa_aml", "advisory", "audit", "crypto_general"]),
        "tags": json.dumps(["fintech", "payments", "digital assets", "banking"]),
        "source": "manual",
        "status": "watching",
        "external_id": "money2020_usa_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "Standard Pass", "price": "~$2,000–$2,500"},
                {"label": "Executive Pass", "price": "~$3,500+"},
            ],
            "registrationUrl": "https://us.money2020.com",
            "notes": "Prices in USD. Early-bird and group discounts available.",
        }),
    },
    {
        "id": "curated_das2025",
        "name": "Digital Asset Summit (DAS) 2025",
        "date_start": "2025-03-18",
        "date_end": "2025-03-19",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "venue": "Marriott Marquis Times Square",
        "url": "https://www.coindesk.com/das",
        "description": (
            "Institutional digital assets conference by CoinDesk. Focused on custody, "
            "trading, and regulatory clarity. CFOs, CROs, and legal executives from "
            "major banks, asset managers, and exchanges."
        ),
        "categories": json.dumps(["audit", "advisory", "risk_consulting"]),
        "tags": json.dumps(["institutional", "custody", "CFO", "CRO"]),
        "source": "manual",
        "status": "watching",
        "external_id": "das_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "Conference Pass", "price": "~$1,499–$2,499"},
            ],
            "registrationUrl": "https://www.coindesk.com/das",
            "notes": "CoinDesk Digital Asset Summit. Institutional-focused; pricing varies by tier and timing.",
        }),
    },
    {
        "id": "curated_sifma2025",
        "name": "SIFMA Annual Meeting 2025",
        "date_start": "2025-10-27",
        "date_end": "2025-10-29",
        "city": "Washington",
        "state": "DC",
        "country": "USA",
        "venue": "Walter E. Washington Convention Center",
        "url": "https://www.sifma.org",
        "description": (
            "Securities industry flagship event. Growing digital assets track with "
            "strong SEC and CFTC presence. Excellent for audit and regulatory advisory BD."
        ),
        "categories": json.dumps(["audit", "advisory", "bsa_aml"]),
        "tags": json.dumps(["securities", "regulation", "SEC", "CFTC", "digital assets"]),
        "source": "manual",
        "status": "watching",
        "external_id": "sifma_annual_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "SIFMA Member", "price": "~$1,295"},
                {"label": "Non-Member", "price": "~$2,295"},
            ],
            "registrationUrl": "https://www.sifma.org",
            "notes": "Pricing varies by membership tier. Early registration discounts typically available.",
        }),
    },
    {
        "id": "curated_iia2025",
        "name": "IIA International Conference 2025",
        "date_start": "2025-07-14",
        "date_end": "2025-07-16",
        "city": "Orlando",
        "state": "FL",
        "country": "USA",
        "venue": "Orange County Convention Center",
        "url": "https://www.theiia.org",
        "description": (
            "Institute of Internal Auditors global conference. Crypto and digital asset "
            "audit track growing significantly. CAEs and heads of internal audit from "
            "Fortune 500 companies. Prime BD target for Crowe audit practice."
        ),
        "categories": json.dumps(["audit", "risk_consulting"]),
        "tags": json.dumps(["internal audit", "CAE", "Fortune 500", "crypto audit"]),
        "source": "manual",
        "status": "watching",
        "external_id": "iia_intl_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "IIA Member", "price": "~$1,595"},
                {"label": "Non-Member", "price": "~$2,395"},
                {"label": "Student / Emerging Professional", "price": "~$795"},
            ],
            "registrationUrl": "https://www.theiia.org/en/events/conferences-and-seminars/",
            "notes": "IIA membership required for member pricing. Group rates available for 5+ from the same organization.",
        }),
    },
    {
        "id": "curated_chainalysis2025",
        "name": "Chainalysis Links 2025",
        "date_start": "2025-02-11",
        "date_end": "2025-02-12",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "venue": "New York Marriott Marquis",
        "url": "https://links.chainalysis.com",
        "description": (
            "Chainalysis annual user conference. Heavy law enforcement, regulatory, and "
            "compliance audience. Sessions on crypto investigations, sanctions, and AML "
            "tooling. Excellent for BSA/AML and risk consulting conversations."
        ),
        "categories": json.dumps(["bsa_aml", "risk_consulting"]),
        "tags": json.dumps(["investigations", "sanctions", "AML", "law enforcement"]),
        "source": "manual",
        "status": "watching",
        "external_id": "chainalysis_links_2025",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "General", "price": "~$899"},
                {"label": "VIP", "price": "~$1,499"},
            ],
            "registrationUrl": "https://links.chainalysis.com",
            "notes": "Chainalysis user conference. Complimentary passes sometimes available for qualified law enforcement and government attendees.",
        }),
    },
]


async def scrape_crypto_news() -> list[dict]:
    """Scrape featured events from crypto.news/events/ (div.event-card slider)."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://crypto.news/events/")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.select("div.event-card"):
                name_el = card.select_one(".event-card__title")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name or len(name) < 5:
                    continue

                times = card.select("time[datetime]")
                date_start = times[0]["datetime"] if len(times) > 0 else None
                date_end = times[1]["datetime"] if len(times) > 1 else None

                location_el = card.select_one(".event-card__location")
                location_text = location_el.get_text(strip=True) if location_el else ""
                parts = [p.strip() for p in location_text.split(",")]

                link_el = card.select_one("a.event-card__link[href], a.event-card__button[href]")
                url = link_el["href"] if link_el else "https://crypto.news/events/"
                if not url.startswith("http"):
                    url = "https://crypto.news" + url

                results.append({
                    "id": _make_id("cnews", name),
                    "name": name,
                    "date_start": date_start,
                    "date_end": date_end,
                    "city": parts[0] if parts else None,
                    "country": parts[-1] if len(parts) > 1 else None,
                    "venue": None,
                    "url": url,
                    "description": f"{name} — {location_text}".strip()[:2000],
                    "categories": json.dumps(["crypto_general"]),
                    "tags": json.dumps(["crypto", "blockchain"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("cnews", name),
                })
    except Exception:
        pass
    return results


async def scrape_coinmarketcap() -> list[dict]:
    """Scrape events from CoinMarketCap's headlines/events page (__NEXT_DATA__).

    NOTE: CMC loads its events calendar entirely client-side. The pre-rendered
    Next.js payload has an 'events' key but it is always empty. Without a
    headless browser or a private CMC API key this scraper will return nothing.
    It is retained here as a no-op placeholder until one of those options is
    available.
    """
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://coinmarketcap.com/headlines/events/")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            nd = soup.find("script", id="__NEXT_DATA__")
            if not nd or not nd.string:
                return results
            data = json.loads(nd.string)
            events_list = data.get("props", {}).get("pageProps", {}).get("events", [])
            for item in events_list:
                name = item.get("name") or item.get("title") or ""
                if not name:
                    continue

                def _date(val: str | None) -> str | None:
                    if not val:
                        return None
                    try:
                        return datetime.fromisoformat(val.replace("Z", "+00:00")).strftime("%Y-%m-%d")
                    except Exception:
                        return val[:10] if val and len(val) >= 10 else None

                results.append({
                    "id": _make_id("cmc", name),
                    "name": name,
                    "date_start": _date(item.get("startDate") or item.get("startedAt")),
                    "date_end": _date(item.get("endDate") or item.get("endedAt")),
                    "city": item.get("city") or None,
                    "country": item.get("country") or None,
                    "venue": item.get("venue") or None,
                    "url": item.get("url") or "https://coinmarketcap.com/events/",
                    "description": str(item.get("description", ""))[:2000],
                    "categories": json.dumps(["crypto_general"]),
                    "tags": json.dumps(["crypto", "blockchain"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("cmc", name),
                })
    except Exception:
        pass
    return results


async def get_all_scraped_events() -> list[dict]:
    acams, iia, cnews, cmc = await asyncio.gather(
        scrape_acams(),
        scrape_iia(),
        scrape_crypto_news(),
        scrape_coinmarketcap(),
    )
    return CURATED_EVENTS + acams + iia + cnews + cmc
