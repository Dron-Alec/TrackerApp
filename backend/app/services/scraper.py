import asyncio
import hashlib
import json
import re
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

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _make_id(source: str, name: str) -> str:
    key = f"{source}_{name}"
    return source[:3] + "_" + hashlib.md5(key.encode()).hexdigest()[:12]


def _parse_date_range(text: str) -> tuple[str | None, str | None]:
    """Parse 'Month DD[-DD], YYYY' into (date_start, date_end). Returns (None, None) on failure."""
    # Range: "Oct 18-21, 2026" / "May 12–13, 2026" / "May 14 - 15, 2026"
    m = re.search(r"([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(20\d{2})", text)
    if m:
        month_str, d1, d2, year = m.groups()
        month = _MONTHS.get(month_str[:3].lower())
        if month:
            return (
                f"{year}-{month:02d}-{int(d1):02d}",
                f"{year}-{month:02d}-{int(d2):02d}",
            )
    # Single day: "October 1, 2026"
    m = re.search(r"([A-Za-z]+)\s+(\d{1,2}),?\s*(20\d{2})", text)
    if m:
        month_str, day, year = m.groups()
        month = _MONTHS.get(month_str[:3].lower())
        if month:
            date = f"{year}-{month:02d}-{int(day):02d}"
            return date, date
    return None, None


async def scrape_acams() -> list[dict]:
    """Scrape ACAMS upcoming conferences from the events listing page."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://www.acams.org/en/events")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.select(".event-listing-card"):
                name_el = card.select_one("h3 a")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name:
                    continue

                url = name_el.get("href", "") or "https://www.acams.org/en/events"
                if not url.startswith("http"):
                    url = "https://www.acams.org" + url

                # Date range lives in the last .type-sm-paragraph that contains a year
                date_text = ""
                for el in card.select(".type-sm-paragraph"):
                    t = el.get_text(strip=True)
                    if re.search(r"20\d{2}", t):
                        date_text = t
                        break
                date_start, date_end = _parse_date_range(date_text)

                desc_el = card.select_one(".content-stack p")
                description = desc_el.get_text(strip=True) if desc_el else f"ACAMS event: {name}"

                # Location often embedded as "in City, Country" in the description
                city, country = None, None
                loc = re.search(r"\bin ([A-Z][^,\.]{2,}),\s*([^\.]{2,})", description)
                if loc:
                    city = loc.group(1).strip()
                    country = loc.group(2).strip()

                results.append({
                    "id": _make_id("acams", name),
                    "name": name,
                    "date_start": date_start,
                    "date_end": date_end,
                    "city": city,
                    "country": country,
                    "venue": None,
                    "url": url,
                    "description": description,
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
                "https://www.theiia.org/en/learning/conferences/",
                follow_redirects=True,
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.select(".card.conference"):
                name_el = card.select_one(".content h3 a strong") or card.select_one(".content h3 a")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name or len(name) < 5:
                    continue

                link_el = card.select_one(".content h3 a[href]")
                url = link_el["href"] if link_el else "https://www.theiia.org/conferences/"

                # ".date h4" contains "May 14 - 15, 2026 | Guatemala City, Guatemala"
                date_el = card.select_one(".date h4")
                date_location = date_el.get_text(strip=True) if date_el else ""
                parts = date_location.split("|")
                date_start, date_end = _parse_date_range(parts[0]) if parts else (None, None)

                city, country = None, None
                if len(parts) > 1:
                    loc_parts = [p.strip() for p in parts[1].split(",")]
                    city = loc_parts[0] if loc_parts else None
                    country = loc_parts[-1] if len(loc_parts) > 1 else None

                desc_el = card.select_one(".content p")
                description = desc_el.get_text(strip=True) if desc_el else f"IIA Conference: {name}"

                results.append({
                    "id": _make_id("iia", name),
                    "name": name,
                    "date_start": date_start,
                    "date_end": date_end,
                    "city": city,
                    "country": country,
                    "venue": None,
                    "url": url,
                    "description": description,
                    "categories": json.dumps(["audit", "risk_consulting"]),
                    "tags": json.dumps(["internal audit", "CAE", "risk"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("iia", name),
                })
    except Exception:
        pass
    return results


async def scrape_money2020() -> list[dict]:
    """Scrape Money20/20 USA date and location from the landing page title."""
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://us.money2020.com")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            # Title format: "Money20/20 USA in Las Vegas | October 18-21, 2026"
            title = soup.title.get_text(strip=True) if soup.title else ""
            date_start, date_end = _parse_date_range(title)
            if not date_start:
                return []

            year_m = re.search(r"(20\d{2})", title)
            year = year_m.group(1) if year_m else ""
            name = f"Money20/20 USA {year}".strip()

            city_m = re.search(r"\bin ([^|]+)", title)
            city = city_m.group(1).strip() if city_m else "Las Vegas"

            return [{
                "id": _make_id("m2020", name),
                "name": name,
                "date_start": date_start,
                "date_end": date_end,
                "city": city,
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
                "source": "scraped",
                "status": "watching",
                "external_id": _make_id("m2020", name),
            }]
    except Exception:
        return []


# IIA, ACAMS, and Money20/20 are scraped live from their websites.
# CURATED_EVENTS covers only conferences whose sites actively block scraping
# or whose next edition isn't yet announced far enough ahead for automation.
CURATED_EVENTS: list[dict] = [
    {
        "id": "curated_sifma2026",
        "name": "SIFMA Annual Meeting 2026",
        "date_start": "2026-10-26",
        "date_end": "2026-10-28",
        "city": "Washington",
        "state": "DC",
        "country": "USA",
        "venue": "Walter E. Washington Convention Center",
        "url": "https://www.sifma.org/event/sifma-annual-meeting/",
        "description": (
            "Securities industry flagship event. Growing digital assets track with "
            "strong SEC and CFTC presence. Excellent for audit and regulatory advisory BD."
        ),
        "categories": json.dumps(["audit", "advisory", "bsa_aml"]),
        "tags": json.dumps(["securities", "regulation", "SEC", "CFTC", "digital assets"]),
        "source": "manual",
        "status": "watching",
        "external_id": "sifma_annual_2026",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "SIFMA Member", "price": "~$1,295"},
                {"label": "Non-Member", "price": "~$2,295"},
            ],
            "registrationUrl": "https://www.sifma.org",
            "notes": "Pricing varies by membership tier. Early registration discounts typically available.",
        }),
    },
    # ── 2026 edition already passed — showing 2027 editions ───────────────────
    {
        "id": "curated_chainalysis2027",
        "name": "Chainalysis Links 2027",
        "date_start": "2027-02-09",
        "date_end": "2027-02-10",
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
        "external_id": "chainalysis_links_2027",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "General", "price": "~$899"},
                {"label": "VIP", "price": "~$1,499"},
            ],
            "registrationUrl": "https://links.chainalysis.com",
            "notes": "Chainalysis user conference. Complimentary passes sometimes available for qualified law enforcement and government attendees.",
        }),
    },
    {
        "id": "curated_das2027",
        "name": "Digital Asset Summit (DAS) 2027",
        "date_start": "2027-03-16",
        "date_end": "2027-03-17",
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
        "external_id": "das_2027",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "Conference Pass", "price": "~$1,499–$2,499"},
            ],
            "registrationUrl": "https://www.coindesk.com/das",
            "notes": "CoinDesk Digital Asset Summit. Institutional-focused; pricing varies by tier and timing.",
        }),
    },
    {
        "id": "curated_consensus2027",
        "name": "Consensus 2027",
        "date_start": "2027-05-04",
        "date_end": "2027-05-06",
        "city": "Miami",
        "state": "FL",
        "country": "USA",
        "venue": "Miami Beach Convention Center",
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
        "external_id": "consensus2027",
        "cost_of_attendance": json.dumps({
            "tiers": [
                {"label": "Pro Pass", "price": "~$999"},
                {"label": "Platinum Pass", "price": "~$1,799"},
                {"label": "Piranha Pass", "price": "~$5,499"},
            ],
            "registrationUrl": "https://consensus.coindesk.com/register/",
            "notes": "Estimated pricing based on prior years. Group discounts available for 5+ attendees.",
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


async def scrape_rwa_summit() -> list[dict]:
    """Scrape upcoming events from RWA Summit (rwasummit.io)."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get("https://www.rwasummit.io/")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            # Each event card is an <a> containing an <h3> title and <p> date
            for card in soup.find_all("a"):
                name_el = card.find("h3")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name or len(name) < 3:
                    continue

                date_el = card.find("p")
                date_text = date_el.get_text(strip=True) if date_el else ""

                href = card.get("href", "")
                if href and not href.startswith("http"):
                    href = "https://www.rwasummit.io" + href
                if not href or href == "#":
                    href = "https://www.rwasummit.io"

                # "Cannes 2026" → city = "Cannes"; "New York 2026" → "New York"
                city = name.rsplit(" ", 1)[0].strip() if " " in name else name

                results.append({
                    "id": _make_id("rwa", name),
                    "name": f"RWA Summit — {name}",
                    "date_start": None,
                    "date_end": None,
                    "city": city,
                    "country": None,
                    "venue": None,
                    "url": href,
                    "description": f"RWA Summit {name}. {date_text}".strip(),
                    "categories": json.dumps(["crypto_general", "advisory"]),
                    "tags": json.dumps(["RWA", "real world assets", "tokenization", "blockchain"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("rwa", name),
                })
    except Exception:
        pass
    return results


async def scrape_bankers_institute() -> list[dict]:
    """Scrape upcoming events from Bankers Institute Compliance Alliance."""
    results: list[dict] = []
    try:
        async with httpx.AsyncClient(**CLIENT_KWARGS) as client:
            resp = await client.get(
                "https://bankersinstitute.compliancealliance.com/events-2/"
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            for h3 in soup.select("h3"):
                link_el = h3.select_one("a[href]")
                if not link_el:
                    continue
                name = link_el.get_text(strip=True)
                if not name or len(name) < 5:
                    continue
                url = link_el["href"]

                # Date is in the <p> immediately following the <h3>
                date_text = ""
                sibling = h3.find_next_sibling("p")
                if sibling:
                    date_text = sibling.get_text(strip=True)

                date_start = None
                if date_text:
                    try:
                        date_start = datetime.strptime(date_text, "%B %d, %Y").strftime("%Y-%m-%d")
                    except ValueError:
                        pass

                results.append({
                    "id": _make_id("bica", name),
                    "name": name,
                    "date_start": date_start,
                    "date_end": None,
                    "city": None,
                    "country": "USA",
                    "venue": None,
                    "url": url,
                    "description": f"Bankers Institute compliance conference: {name}. {date_text}".strip(),
                    "categories": json.dumps(["bsa_aml", "audit", "risk_consulting"]),
                    "tags": json.dumps(["banking", "compliance", "BSA", "audit"]),
                    "source": "scraped",
                    "status": "watching",
                    "external_id": _make_id("bica", name),
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
    acams, iia, money2020, cnews, cmc, rwa, bica = await asyncio.gather(
        scrape_acams(),
        scrape_iia(),
        scrape_money2020(),
        scrape_crypto_news(),
        scrape_coinmarketcap(),
        scrape_rwa_summit(),
        scrape_bankers_institute(),
    )
    # Newly scraped events land in pending_review; upsert preserves status for existing rows.
    scraped = acams + iia + money2020 + cnews + cmc + rwa + bica
    for event in scraped:
        event["status"] = "pending_review"
    return CURATED_EVENTS + scraped
