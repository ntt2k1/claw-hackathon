from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
import json
import logging
import os

logger = logging.getLogger(__name__)

def _allowed_price_ranges(budget: str | None) -> set[str] | None:
    """Map a budget string to allowed price_range tiers, or None for no filter."""
    if not budget:
        return None
    b = budget.upper().strip()
    # Remove trailing +
    b = b.rstrip("+")

    if b.endswith("K"):
        try:
            val = float(b[:-1].replace(",", "")) * 1_000
        except ValueError:
            return None
    elif b.endswith("M"):
        try:
            val = float(b[:-1].replace(",", "")) * 1_000_000
        except ValueError:
            return None
    else:
        # Raw number — remove commas and dots used as thousands separators
        # Dots as thousands separators only appear in patterns like 1.500.000 (no decimal)
        raw = b.replace(",", "").replace(".", "")
        try:
            val = float(raw)
        except ValueError:
            return None
    if val <= 500_000:
        return {"$"}
    elif val <= 2_000_000:
        return {"$", "$$"}
    elif val < 5_000_000:
        return {"$", "$$", "$$$"}
    return None  # 5M+ = no filter

def _get_llm(temperature: float = 0.4) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=LLM_BASE_URL,
        api_key=LLM_API_KEY,
        model=LLM_MODEL,
        temperature=temperature,
    )

PERSONA_DESCRIPTIONS = {
    "Kẻ Khám Phá Bản Địa": ("🔍", "Bạn ăn local, đi ngách, và không bao giờ vào chỗ có hàng dài tourist."),
    "Luxury Escapist":      ("💎", "Bạn muốn không gian đẹp, dịch vụ tốt — trải nghiệm chất lượng cao là ưu tiên."),
    "Vibe Architect":       ("🎉", "Bạn tạo ra không khí — nightlife, ăn ngon photogenic, và những nơi có năng lượng."),
    "Power Traveler":       ("🗺️", "Bạn tối ưu từng giờ, ghé đủ điểm đáng, và không bỏ lỡ gì quan trọng."),
    "Urban Hermit":         ("🌿", "Bạn tránh đám đông, tìm tọa độ ít người biết, và thích không gian tĩnh lặng."),
    "Adventure Nomad":      ("⚡", "Bạn cần chuyển động, thử thách, thiên nhiên — adrenaline là nhiên liệu."),
    "Đa Tần Số":            ("✨", "Bạn đa chiều — SOLE đang khám phá thêm về bạn từng chuyến đi."),
}

AXIS_VI = {
    "Ẩm thực": "ăn uống local chất lượng",
    "Văn hoá": "văn hoá lịch sử kiến trúc",
    "Thiên nhiên": "thiên nhiên không gian xanh",
    "Phiêu lưu": "hoạt động phiêu lưu thử thách",
    "Sang chảnh": "không gian sang trọng dịch vụ cao cấp",
    "Giao lưu": "không khí sôi động giao lưu kết nối",
    "Tọa độ ngách": "địa điểm ít người biết tọa độ ẩn",
    "Thư giãn": "không gian yên tĩnh nghỉ ngơi thư giãn",
    "Nhiếp ảnh": "góc đẹp ánh sáng tốt photogenic",
    "Hiệu quả": "lịch trình tối ưu tiết kiệm thời gian",
}

async def describe_vibe(persona: str, axes: dict[str, int]) -> dict:
    """Returns personality description and top axes for a DNA persona."""
    icon, desc = PERSONA_DESCRIPTIONS.get(persona, ("✨", "Bạn là một traveler độc đáo."))
    top_axes = sorted(axes.items(), key=lambda x: x[1], reverse=True)[:3]
    hashtags = ["#" + a.replace(" ", "") for a, _ in top_axes]
    return {"icon": icon, "description": desc, "hashtags": hashtags}

async def search_and_plan(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
    duration: int,
    user_need: str | None = None,
    budget: str | None = None,
    disliked_places: list[str] | None = None,
) -> dict:
    """Returns {"places": [...], "itinerary": [...]} in a single LLM call."""
    llm = _get_llm(temperature=0.3)

    top3 = sorted(axes.items(), key=lambda x: x[1], reverse=True)[:3]
    axes_context = "\n".join(
        f"- {axis} ({score}%): {AXIS_VI.get(axis, axis)}"
        for axis, score in top3
    )

    top_axis = top3[0][0] if top3 else "Phiêu lưu"
    place_type_hint = {
        "Ẩm thực": "restaurants, local eateries, food markets, specialty cafes",
        "Văn hoá": "museums, heritage sites, old quarters, art galleries, architecture",
        "Thiên nhiên": "parks, lakes, mountains, gardens, eco spots",
        "Phiêu lưu": "challenging terrain, outdoor activities, hiking, kayaking",
        "Sang chảnh": "boutique hotels, spas, fine dining, rooftop lounges",
        "Giao lưu": "rooftop bars, live music venues, community spaces, night markets",
        "Tọa độ ngách": "hidden cafes, back-alley spots, local-only places",
        "Thư giãn": "quiet cafes, gardens, reading spaces, small resorts",
        "Nhiếp ảnh": "scenic streets, unique architecture, aesthetic cafes, viewpoints",
        "Hiệu quả": "central hubs, well-connected areas, clustered attractions",
    }.get(top_axis, "notable, distinctive spots")

    need_line = f"\nUser's current mood/need: {user_need}" if user_need else ""
    budget_line = f"\nTotal budget: {budget} VND" if budget else ""
    if disliked_places:
        avoid_line = "\nDo NOT suggest these places (user has previously disliked them):\n" + "\n".join(f"- {p}" for p in disliked_places)
    else:
        avoid_line = ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Vietnam travel expert and itinerary planner with up-to-date local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist
2. NEVER invent place names, addresses, or districts
3. MUST include specific address (street + district/ward) for each place
4. Prioritize authentic, less-touristy spots matching the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it
6. Return 5-6 places maximum, at least 3 places

Output: valid JSON object only, no markdown, no explanation.
All descriptive text fields in the JSON output (description, why_match, tip) MUST be written in Vietnamese, for both places and itinerary items. Place names and addresses keep their original form."""),
        ("human", """Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
{avoid_line}
Duration: {duration} {unit}
Priority place type: {place_type_hint}

Return a JSON object:
{{
  "places": [
    {{
      "name": "place name",
      "address": "specific street address",
      "district": "district/ward",
      "type": "food/sightseeing/activity/cafe/bar/nature",
      "description": "1-2 sentence description",
      "why_match": "one sentence why it matches the DNA",
      "best_for": "which axis fits best (e.g. Ẩm thực)",
      "price_range": "$ / $$ / $$$ / $$$$"
    }}
  ],
  "itinerary": [
    {{
      "time": "9:00 (or Day 1 - Morning)",
      "name": "place name from places list",
      "address": "address from places list",
      "description": "short engaging description",
      "duration_note": "e.g. ~45 min",
      "distance_from_prev": "e.g. ~1.2km, 15 min walk or 5 min Grab",
      "tip": "optional useful tip"
    }}
  ]
}}"""),
    ])

    chain = prompt | llm
    invoke_vars = {
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
        "avoid_line": avoid_line,
    }

    rendered = prompt.format_messages(**invoke_vars)
    for msg in rendered:
        logger.info("[PROMPT] [%s]\n%s", msg.type.upper(), msg.content)
    result = await chain.ainvoke(invoke_vars)

    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    data = json.loads(text)

    allowed = _allowed_price_ranges(budget)
    if allowed:
        places = [p for p in data["places"] if p.get("price_range") in allowed]
        kept_names = {p["name"] for p in places}
        itinerary = [s for s in data["itinerary"] if s.get("name") in kept_names]
    else:
        places = data["places"]
        itinerary = data["itinerary"]

    return {"places": places, "itinerary": itinerary}
