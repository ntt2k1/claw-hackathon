from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
import json

def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        base_url=LLM_BASE_URL,
        api_key=LLM_API_KEY,
        model=LLM_MODEL,
        temperature=0.7,
    )

VIBE_DESCRIPTIONS = {
    "foodie": ("🍜 Foodie", "Bạn sống để thưởng thức — mỗi bữa ăn là một trải nghiệm, mỗi quán là một câu chuyện. Bạn biết nơi ngon nhất trước khi nó nổi tiếng."),
    "explorer": ("🗺️ Explorer", "Bạn không đi để check-in — bạn đi để khám phá. Những con phố chưa có tên trên bản đồ mới là nơi bạn thực sự cảm thấy sống."),
    "culture": ("🏛️ Culture", "Bạn muốn hiểu hơn là chỉ nhìn. Lịch sử, kiến trúc, nghệ thuật — mỗi nơi bạn đến đều để lại một tầng hiểu biết mới."),
    "adventure": ("⚡ Adventure", "Adrenaline là ngôn ngữ của bạn. Chuyến đi mà không có gì thử thách là chuyến đi bạn sẽ quên ngay."),
    "relaxation": ("🌿 Relaxation", "Bạn biết rằng dừng lại cũng là một lựa chọn dũng cảm. Không gian yên tĩnh, không agenda — đó là bạn trong trạng thái tốt nhất."),
}

VIBE_HASHTAGS = {
    "foodie": ["#StreetFood", "#LocalFlavors", "#FoodieLife"],
    "explorer": ["#HiddenGems", "#OffTheBeatenPath", "#WanderlustVibes"],
    "culture": ["#CultureFirst", "#ArtAndHistory", "#DeepDive"],
    "adventure": ["#AdventureAwaits", "#ThrillSeeker", "#OutdoorVibes"],
    "relaxation": ["#SlowTravel", "#UnwindMode", "#PeacefulEscape"],
}

async def describe_vibe(primary_vibe: str, secondary_vibe: str | None) -> dict:
    """Returns personality description and hashtags for a vibe combination."""
    icon, desc = VIBE_DESCRIPTIONS.get(primary_vibe, ("✨", "Bạn là một người độc đáo."))
    hashtags = VIBE_HASHTAGS.get(primary_vibe, [])
    if secondary_vibe and secondary_vibe in VIBE_HASHTAGS:
        hashtags = hashtags + VIBE_HASHTAGS[secondary_vibe][:1]
    return {"icon": icon, "description": desc, "hashtags": hashtags}

async def search_locations(
    primary_vibe: str, secondary_vibe: str | None, location: str, trip_type: str
) -> list[dict]:
    """Returns 6-8 place recommendations matching the vibe."""
    llm = _get_llm()
    vibe_label = VIBE_DESCRIPTIONS.get(primary_vibe, ("", ""))[0]
    secondary_label = VIBE_DESCRIPTIONS.get(secondary_vibe or "", ("", ""))[0] if secondary_vibe else ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là chuyên gia gợi ý địa điểm du lịch tại Việt Nam. Trả về JSON array, không có markdown code block."),
        ("human", """Gợi ý 6-8 địa điểm phù hợp cho người có vibe chính là {vibe} {secondary} gần khu vực {location}.
Loại chuyến đi: {trip_type}.

Trả về JSON array với format:
[{{"name": "tên địa điểm", "type": "loại (ăn uống/tham quan/hoạt động/nghỉ ngơi)", "description": "mô tả 1-2 câu thú vị", "why_vibe": "lý do phù hợp với vibe 1 câu"}}]

Chỉ trả về JSON, không giải thích thêm."""),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "vibe": vibe_label,
        "secondary": f"và phụ là {secondary_label}" if secondary_label else "",
        "location": location,
        "trip_type": "trong ngày" if trip_type == "inday" else "nhiều ngày",
    })
    text = result.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)

async def build_itinerary(
    places: list[dict], origin: str, trip_type: str, duration: int
) -> list[dict]:
    """Returns an ordered itinerary with time/distance estimates."""
    llm = _get_llm()
    places_json = json.dumps(places, ensure_ascii=False)
    unit = "giờ" if trip_type == "inday" else "ngày"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là chuyên gia lên lịch trình du lịch. Trả về JSON array, không có markdown code block."),
        ("human", """Lên lịch trình từ địa điểm xuất phát: {origin}
Thời lượng: {duration} {unit}
Địa điểm gợi ý: {places}

Sắp xếp theo thứ tự tối ưu (gần nhau, hợp lý về thời gian).
Trả về JSON array với format:
[{{"time": "9:00" hoặc "Ngày 1", "name": "tên địa điểm", "description": "mô tả ngắn", "duration_note": "ví dụ: 45 phút", "distance_from_prev": "ví dụ: ~1.2km (đi bộ 15 phút)"}}]

Chỉ trả về JSON, không giải thích thêm."""),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "origin": origin,
        "duration": duration,
        "unit": unit,
        "places": places_json,
    })
    text = result.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)
