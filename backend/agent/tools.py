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

async def search_locations(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
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

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Bạn là chuyên gia địa điểm du lịch Việt Nam với kiến thức thực tế và cập nhật.

QUY TẮC QUAN TRỌNG VỀ ĐỘ CHÍNH XÁC:
1. CHỈ gợi ý những địa điểm bạn CHẮC CHẮN tồn tại tại địa điểm được yêu cầu
2. KHÔNG tạo ra hoặc phỏng đoán tên địa điểm — chỉ dùng địa điểm bạn biết chắc
3. PHẢI bao gồm địa chỉ cụ thể (đường phố, quận/huyện) để user có thể tìm được
4. Ưu tiên địa điểm đặc trưng, ít tourist, phù hợp DNA thay vì landmark nổi tiếng quá mức
5. Nếu không biết địa chỉ chính xác, ĐỪNG thêm địa điểm đó vào danh sách
6. Trả về JSON array thuần túy, không markdown"""),
        ("human", """User profile DNA:
Persona: {persona}
Top 3 priorities:
{axes_context}

Yêu cầu: Gợi ý 6-8 địa điểm tại {location} phù hợp với profile trên.
Loại chuyến: {trip_type}
Ưu tiên loại địa điểm: {place_type_hint}

Quan trọng: Tránh gợi ý những landmark quá nổi tiếng trừ khi thực sự phù hợp với DNA.
Ưu tiên địa điểm đặc trưng, authentic, match với persona "{persona}".

Trả về JSON array:
[{{
  "name": "tên địa điểm",
  "address": "địa chỉ đường phố cụ thể",
  "district": "quận/huyện",
  "type": "loại (ăn uống/tham quan/hoạt động/cafe/bar/thiên nhiên)",
  "description": "mô tả 1-2 câu",
  "why_match": "lý do phù hợp với DNA của user (1 câu)",
  "best_for": "axis nào phù hợp nhất (ví dụ: Ẩm thực)",
  "price_range": "$ / $$ / $$$ / $$$$"
}}]

Chỉ trả về JSON array, không text khác."""),
    ])

    chain = prompt | llm
    result = await chain.ainvoke({
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "trong ngày" if trip_type == "inday" else "nhiều ngày",
        "place_type_hint": place_type_hint,
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
    unit = "giờ" if trip_type == "inday" else "ngày"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là chuyên gia lên lịch trình du lịch tại Việt Nam. Trả về JSON array thuần túy, không markdown."),
        ("human", """Lên lịch trình từ: {origin}
Thời lượng: {duration} {unit}
Địa điểm: {places}

Sắp xếp theo thứ tự địa lý tối ưu (gần nhau, hợp lý về thời gian trong ngày).

Trả về JSON array:
[{{
  "time": "9:00" (hoặc "Ngày 1 - Sáng"),
  "name": "tên địa điểm",
  "address": "địa chỉ từ danh sách",
  "description": "mô tả ngắn hấp dẫn",
  "duration_note": "ví dụ: ~45 phút",
  "distance_from_prev": "ví dụ: ~1.2km, đi bộ 15 phút hoặc Grab 5 phút",
  "tip": "mẹo nhỏ hữu ích (optional)"
}}]

Chỉ trả về JSON array."""),
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
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)
