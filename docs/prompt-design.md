# Prompt Design — Tìm Địa Điểm & Lịch Trình (search_and_plan)

> Tài liệu này mô tả chi tiết cách SOLE prompt LLM để tìm địa điểm và xây dựng lịch trình trong một lần gọi duy nhất.
> File triển khai: `backend/agent/tools.py` — hàm `search_and_plan()`

---

## Tổng quan kiến trúc

```
User Input
  └─ persona, axes, location, trip_type, duration, user_need, budget
       │
       ▼
  describe_vibe()          ← lookup dict, không gọi LLM
       │
       ▼
  search_and_plan()        ← 1 lần gọi LLM duy nhất
       │
       ▼
  { places: [...], itinerary: [...] }
```

Trước đây có 2 lần gọi LLM riêng biệt (`search_locations` + `build_itinerary`). Hiện tại đã gộp thành 1 lần gọi (`search_and_plan`) để giảm latency ~40–50%.

---

## Input của hàm

| Tham số | Kiểu | Ví dụ | Mô tả |
|---------|------|-------|-------|
| `persona` | str | `"Urban Hermit"` | Tên persona DNA của user |
| `axes` | dict[str, int] | `{"Tọa độ ngách": 60, "Thư giãn": 25, ...}` | Điểm % cho mỗi trục travel DNA |
| `location` | str | `"Hà Nội"` | Địa điểm muốn khám phá |
| `trip_type` | str | `"inday"` hoặc `"multiday"` | Loại chuyến đi |
| `duration` | int | `8` | Số giờ (inday) hoặc số ngày (multiday) |
| `user_need` | str \| None | `"Tôi cần không gian yên tĩnh để làm việc"` | Tâm trạng/nhu cầu hiện tại của user |
| `budget` | str \| None | `"500000"` | Tổng ngân sách (VNĐ) |

---

## Tiền xử lý trước khi prompt

### 1. Lấy top 3 axes theo điểm cao nhất

```python
top3 = sorted(axes.items(), key=lambda x: x[1], reverse=True)[:3]
# Ví dụ: [("Tọa độ ngách", 60), ("Thư giãn", 25), ("Nhiếp ảnh", 15)]
```

Chỉ truyền top 3 vào prompt để tránh nhiễu. Trục nào điểm thấp không ảnh hưởng kết quả.

### 2. Build axes_context

```
- Tọa độ ngách (60%): địa điểm ít người biết tọa độ ẩn
- Thư giãn (25%): không gian yên tĩnh nghỉ ngơi thư giãn
- Nhiếp ảnh (15%): góc đẹp ánh sáng tốt photogenic
```

Mỗi trục được dịch sang tiếng Việt mô tả qua dict `AXIS_VI` để LLM hiểu context.

### 3. Xác định place_type_hint từ trục cao nhất

| Top axis | place_type_hint |
|----------|----------------|
| Ẩm thực | restaurants, local eateries, food markets, specialty cafes |
| Văn hoá | museums, heritage sites, old quarters, art galleries, architecture |
| Thiên nhiên | parks, lakes, mountains, gardens, eco spots |
| Phiêu lưu | challenging terrain, outdoor activities, hiking, kayaking |
| Sang chảnh | boutique hotels, spas, fine dining, rooftop lounges |
| Giao lưu | rooftop bars, live music venues, community spaces, night markets |
| Tọa độ ngách | hidden cafes, back-alley spots, local-only places |
| Thư giãn | quiet cafes, gardens, reading spaces, small resorts |
| Nhiếp ảnh | scenic streets, unique architecture, aesthetic cafes, viewpoints |
| Hiệu quả | central hubs, well-connected areas, clustered attractions |

Hint này giúp LLM biết nên ưu tiên loại địa điểm nào khi có nhiều lựa chọn.

### 4. Xử lý user_need và budget

```python
need_line  = f"\nUser's current mood/need: {user_need}" if user_need else ""
budget_line = f"\nTotal budget: {budget} VND"         if budget   else ""
```

Nếu user không nhập thì 2 dòng này sẽ rỗng, không xuất hiện trong prompt.

---

## Cấu trúc prompt

Prompt gồm 2 message: **System** và **Human**.

### System message

```
You are a Vietnam travel expert and itinerary planner with up-to-date local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist
2. NEVER invent place names, addresses, or districts
3. MUST include specific address (street + district/ward) for each place
4. Prioritize authentic, less-touristy spots matching the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it
6. Return 5-6 places maximum

Output: valid JSON object only, no markdown, no explanation.
```

**Mục đích từng rule:**
- Rule 1–2: Ngăn LLM hallucinate địa điểm không tồn tại
- Rule 3: Bắt buộc có địa chỉ cụ thể (đường + quận/phường) — không chỉ tên địa điểm chung chung
- Rule 4: Ưu tiên spot authentic thay vì landmark du lịch phổ biến — phù hợp với DNA user
- Rule 5: Fallback an toàn — tốt hơn bỏ qua còn hơn bịa địa chỉ sai
- Rule 6: Giới hạn 5–6 địa điểm để response không quá dài và dễ render trên mobile

### Human message (template)

```
Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
Duration: {duration} {unit}
Priority place type: {place_type_hint}

Return a JSON object:
{
  "places": [...],
  "itinerary": [...]
}
```

**Các biến được inject vào template:**

| Biến | Giá trị ví dụ | Ghi chú |
|------|--------------|---------|
| `{location}` | `Hà Nội` | Trực tiếp từ user |
| `{trip_type}` | `day trip` hoặc `multi-day trip` | Chuyển đổi từ `inday`/`multiday` |
| `{persona}` | `Urban Hermit` | Tên persona DNA |
| `{axes_context}` | (xem ví dụ trên) | Top 3 trục có điểm % và mô tả |
| `{need_line}` | `\nUser's current mood/need: cần yên tĩnh` | Rỗng nếu user không nhập |
| `{budget_line}` | `\nTotal budget: 500000 VND` | Rỗng nếu user không nhập |
| `{duration}` | `8` | Số giờ hoặc số ngày |
| `{unit}` | `hours` hoặc `days` | Tùy trip_type |
| `{place_type_hint}` | `hidden cafes, back-alley spots, local-only places` | Từ top axis |

---

## Output schema mong đợi từ LLM

```json
{
  "places": [
    {
      "name": "Tên địa điểm",
      "address": "Địa chỉ đường phố cụ thể",
      "district": "Quận/phường",
      "type": "food | sightseeing | activity | cafe | bar | nature",
      "description": "Mô tả 1-2 câu",
      "why_match": "Lý do phù hợp với DNA của user",
      "best_for": "Trục phù hợp nhất (ví dụ: Tọa độ ngách)",
      "price_range": "$ | $$ | $$$ | $$$$"
    }
  ],
  "itinerary": [
    {
      "time": "9:00 hoặc Day 1 - Morning",
      "name": "Tên từ danh sách places",
      "address": "Địa chỉ từ danh sách places",
      "description": "Mô tả ngắn gợi cảm xúc",
      "duration_note": "~45 min",
      "distance_from_prev": "~1.2km, 15 min đi bộ hoặc 5 min Grab",
      "tip": "Mẹo hữu ích (không bắt buộc)"
    }
  ]
}
```

---

## Hậu xử lý response

```python
text = result.content.strip()

# Strip markdown code block nếu LLM vẫn trả về dù đã dặn không
if text.startswith("```"):
    lines = text.split("\n")
    text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

return json.loads(text)
```

LLM đôi khi vẫn wrap JSON trong ```json ... ``` dù đã dặn. Đoạn này strip block đó ra trước khi parse.

---

## Tham số LLM

| Tham số | Giá trị |
|---------|---------|
| Model | `qwen/qwen3-5-27b` (cấu hình qua env `LLM_MODEL`) |
| Temperature | `0.3` — thấp để output ổn định, ít sáng tạo random |
| Base URL | GreenNode MAAS endpoint |

Temperature 0.3 được chọn để cân bằng giữa:
- Đủ deterministic để địa chỉ/tên chính xác
- Đủ linh hoạt để mô tả không bị lặp khuôn

---

## Ví dụ prompt thực tế (rendered)

**Input:** Urban Hermit, Hà Nội, inday 6 giờ, cần chỗ yên tĩnh làm việc, budget 300k

**System message:** *(như trên)*

**Human message:**
```
Find places and build an itinerary in Hà Nội for a day trip.

Traveler DNA persona: Urban Hermit
Top travel axes:
- Tọa độ ngách (55%): địa điểm ít người biết tọa độ ẩn
- Thư giãn (30%): không gian yên tĩnh nghỉ ngơi thư giãn
- Nhiếp ảnh (15%): góc đẹp ánh sáng tốt photogenic

User's current mood/need: cần chỗ yên tĩnh để làm việc
Total budget: 300000 VND
Duration: 6 hours
Priority place type: hidden cafes, back-alley spots, local-only places

Return a JSON object:
{ "places": [...], "itinerary": [...] }
```

---

## Điểm cần cải thiện tiềm năng

| Vấn đề | Hiện tại | Có thể làm |
|--------|----------|-----------|
| LLM không biết ngày/mùa | Không có ngữ cảnh thời gian | Inject ngày hiện tại vào prompt |
| Địa điểm lặp lại giữa các lần gọi | Không có memory | Đọc rating history từ AgentBase Memory và exclude chỗ đã dislike |
| Không biết user đang ở đâu chính xác | Chỉ có tên thành phố | Inject tên quận nếu user cho phép geolocation |
| Budget không được dùng để lọc price_range | LLM chỉ biết budget, không enforce | Có thể post-filter places theo `price_range` sau khi parse |
