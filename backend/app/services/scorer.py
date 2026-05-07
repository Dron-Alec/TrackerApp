import json
import os
import asyncio
from typing import Any

import anthropic

SYSTEM_PROMPT = """You are a business development analyst at Crowe, a top-10 professional services firm.
Crowe's crypto and digital assets practice focuses on four service lines:

1. AUDIT — external audit of digital asset companies, exchanges, custodians, stablecoin issuers, and crypto funds
2. BSA/AML — Bank Secrecy Act and Anti-Money Laundering compliance consulting and managed services for crypto businesses and banks with crypto exposure
3. RISK CONSULTING — enterprise risk management, internal controls, SOC reports, and third-party risk for digital asset firms
4. ADVISORY — strategic advisory, M&A due diligence, valuation, regulatory strategy, and restructuring for crypto/fintech companies

Your job is to evaluate conferences and events for BD relevance — meaning: will Crowe's target clients (decision-makers who buy audit, AML, risk, or advisory services) be there in meaningful numbers?

High-value signals:
- CCOs, CLOs, CFOs, CAEs, CROs, heads of compliance, risk officers
- Exchanges, custodians, stablecoin issuers, crypto funds, banks with crypto exposure
- Regulatory presence (SEC, CFTC, FinCEN, OCC)
- Topics: regulation, compliance, audit, AML, risk management, institutional adoption

Low-value signals:
- Developer-only events, hackathons
- Retail investor conferences
- Pure tech/infrastructure events with no financial services angle"""


def _build_prompt(event: dict) -> str:
    return f"""Evaluate this conference/event for Crowe BD relevance:

Name: {event.get('name', '')}
Date: {event.get('date_start', '')} to {event.get('date_end', '')}
Location: {event.get('city', '')}, {event.get('state', '') or event.get('country', '')}
Description: {event.get('description', '')[:1500]}

Score each service line 0–100 (100 = extremely high concentration of buyers, 0 = irrelevant):
Also provide an overall relevance score, decision maker density, and recommended action.

Respond ONLY with valid JSON — no markdown, no explanation outside the JSON:
{{
  "audit": <0-100>,
  "bsa_aml": <0-100>,
  "risk_consulting": <0-100>,
  "advisory": <0-100>,
  "overall": <0-100>,
  "decision_maker_density": "low" | "medium" | "high",
  "recommended_action": "skip" | "watch" | "attend",
  "reasoning": "<1-2 sentence explanation>"
}}"""


async def score_event(event: dict) -> dict[str, Any]:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {
            "audit": 50, "bsa_aml": 50, "risk_consulting": 50,
            "advisory": 50, "overall": 50,
            "decision_maker_density": "medium",
            "recommended_action": "watch",
            "reasoning": "No Anthropic API key configured — scoring unavailable.",
        }

    client = anthropic.Anthropic(api_key=api_key)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": _build_prompt(event)}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception as e:
        return {
            "audit": 0, "bsa_aml": 0, "risk_consulting": 0,
            "advisory": 0, "overall": 0,
            "decision_maker_density": "low",
            "recommended_action": "skip",
            "reasoning": f"Scoring failed: {str(e)[:100]}",
        }


async def score_events_batch(events: list[dict], max_concurrent: int = 5) -> list[dict]:
    """Score multiple events concurrently, respecting rate limits."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def score_with_limit(event: dict) -> dict:
        async with semaphore:
            scores = await score_event(event)
            return {**event, **_apply_scores(scores)}

    return await asyncio.gather(*[score_with_limit(e) for e in events])


def _apply_scores(scores: dict) -> dict:
    categories = []
    thresholds = {
        "audit": ("audit", 40),
        "bsa_aml": ("bsa_aml", 40),
        "risk_consulting": ("risk_consulting", 40),
        "advisory": ("advisory", 40),
    }
    for key, (cat, threshold) in thresholds.items():
        if scores.get(key, 0) >= threshold:
            categories.append(cat)
    if not categories:
        categories = ["crypto_general"]

    return {
        "audit_score": scores.get("audit", 0),
        "bsa_aml_score": scores.get("bsa_aml", 0),
        "risk_consulting_score": scores.get("risk_consulting", 0),
        "advisory_score": scores.get("advisory", 0),
        "relevance_score": scores.get("overall", 0),
        "decision_maker_density": scores.get("decision_maker_density", "medium"),
        "recommended_action": scores.get("recommended_action", "watch"),
        "ai_reasoning": scores.get("reasoning", ""),
        "categories": json.dumps(categories),
    }
