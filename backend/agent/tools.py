from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
import json

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

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Vietnam travel expert and itinerary planner with up-to-date local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist
2. NEVER invent place names, addresses, or districts
3. MUST include specific address (street + district/ward) for each place
4. Prioritize authentic, less-touristy spots matching the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it
6. Return 5-6 places maximum

Output: valid JSON object only, no markdown, no explanation."""),
        ("human", """Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
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
    result = await chain.ainvoke({
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
    })

    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)

async def search_locations(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
    user_need: str | None = None,
    budget: str | None = None,
) -> list[dict]:
    """Returns 6-8 real place recommendations matched to DNA profile."""
    llm = _get_llm(temperature=0.3)

    # Build top-3 axes context for the prompt
    top3 = sorted(axes.items(), key=lambda x: x[1], reverse=True)[:3]
    axes_context = "\n".join(
        f"- {axis} ({score}%): muốn trải nghiệm {AXIS_VI.get(axis, axis)}"
        for axis, score in top3
    )

    # Determine place type guidance based on top axis
    top_axis = top3[0][0] if top3 else "Phiêu lưu"
    place_type_hint = {
        "Ẩm thực": "quán ăn, nhà hàng, chợ ẩm thực, quán cà phê đặc trưng",
        "Văn hoá": "bảo tàng, di tích, phố cổ, gallery nghệ thuật, kiến trúc độc đáo",
        "Thiên nhiên": "công viên, hồ, núi, vườn cây, khu sinh thái",
        "Phiêu lưu": "địa hình thử thách, hoạt động outdoor, leo núi, kayak",
        "Sang chảnh": "khách sạn boutique, spa, nhà hàng fine dining, rooftop lounge",
        "Giao lưu": "rooftop bar, quán nhạc live, không gian cộng đồng, chợ đêm",
        "Tọa độ ngách": "quán không biển hiệu, hẻm ẩn, địa điểm local ít tourist",
        "Thư giãn": "cafe yên tĩnh, vườn cây, không gian đọc sách, khu nghỉ dưỡng nhỏ",
        "Nhiếp ảnh": "góc phố đẹp, kiến trúc độc đáo, cafe aesthetic, điểm view",
        "Hiệu quả": "điểm tập trung, trung tâm khu vực, tiện di chuyển",
    }.get(top_axis, "địa điểm nổi bật, đặc trưng")

    need_line = f"\nUser's current mood/need: {user_need}" if user_need else ""
    budget_line = f"\nTotal budget: {budget} VND" if budget else ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Vietnam travel expert with up-to-date, real-world local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist right now
2. NEVER invent or hallucinate place names, addresses, or districts
3. MUST include specific address (street + district/ward)
4. Prioritize authentic, less-touristy spots that match the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it entirely
6. Return 6-8 places maximum

Output: valid JSON array only, no markdown, no explanation."""),
        ("human", """Find places in {location} for a {trip_type} trip.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
Priority place type: {place_type_hint}

Return JSON array of objects with fields:
name, address, district, type, description, why_match, best_for, price_range"""),
    ])

    chain = prompt | llm
    result = await chain.ainvoke({
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
    })

    text = result.content.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


async def build_itinerary(
    places: list[dict], origin: str, trip_type: str, duration: int
) -> list[dict]:
    """Returns an ordered itinerary with time/distance estimates."""
    llm = _get_llm(temperature=0.3)
    places_json = json.dumps(places, ensure_ascii=False)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Vietnam trip itinerary planner. Return pure JSON array only, no markdown."),
        ("human", """Build an itinerary starting from: {origin}
Duration: {duration} {unit}
Places: {places}

Order stops geographically (nearby places grouped, sensible time-of-day flow).

Return JSON array:
[{{
  "time": "9:00" (or "Day 1 - Morning"),
  "name": "place name",
  "address": "address from the list",
  "description": "short engaging description",
  "duration_note": "e.g. ~45 min",
  "distance_from_prev": "e.g. ~1.2km, 15 min walk or 5 min Grab",
  "tip": "optional useful tip"
}}]

Return JSON array only."""),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "origin": origin,
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "places": places_json,
    })
    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)
