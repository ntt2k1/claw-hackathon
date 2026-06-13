# Travel Vibe Agent — Design Spec

## Overview

AI Agent web app gợi ý địa điểm du lịch/ăn uống/vui chơi dựa trên personality của user. User trả lời bộ câu hỏi tính cách (không hỏi thẳng về du lịch), hệ thống xác định "vibe" của họ trong 5 nhóm, rồi LangChain Agent sinh ra lịch trình + địa điểm phù hợp.

---

## 5 Nhóm Vibe

| Vibe | Mô tả ngắn |
|------|------------|
| 🍜 Foodie | Sống qua ẩm thực, luôn biết chỗ ngon |
| 🗺️ Explorer | Thích khám phá những nơi chưa ai biết |
| 🏛️ Culture | Muốn hiểu chiều sâu văn hóa, lịch sử |
| ⚡ Adventure | Cần adrenaline, không thể ngồi yên |
| 🌿 Relaxation | Cần được nạp lại năng lượng, không drama |

---

## Bộ Câu Hỏi + Scoring

### Cấu trúc: 3 màn × 5 câu = 15 câu tổng

**Màn 1 & 2** — Single choice, mỗi đáp án cộng điểm cho 1 nhóm (+2 điểm).  
**Màn 3** — Rating scale 1–5, mỗi phát biểu map trực tiếp 1 nhóm.

### Màn 1 — Bạn là ai? (Q1–Q5)

| # | Câu hỏi | A→ | B→ | C→ | D→ | E→ |
|---|---------|----|----|----|----|-----|
| Q1 | Buổi chiều tự do, bạn cảm thấy...? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q2 | Khi stress nặng, bạn giải tỏa bằng cách...? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q3 | Bạn bè hay mô tả bạn là người...? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q4 | Bộ phim/series bạn có thể xem đi xem lại? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q5 | Tâm trạng của bạn lúc này gần giống nhất với...? | Foodie | Explorer | Culture | Adventure | Relaxation |

**Đáp án Màn 1:**
- Q1: A=Hứng khởi tìm chỗ ăn, B=Tò mò đi lang thang, C=Muốn làm gì có ý nghĩa, D=Bứt rứt cần làm gì đó, E=Nhẹ nhõm được không làm gì
- Q2: A=Ăn bữa ngon/vào bếp, B=Ra ngoài đi dù chẳng biết đâu, C=Đọc sách/xem phim, D=Tập thể thao đổ mồ hôi, E=Nằm im tắt điện thoại
- Q3: A="Biết ăn" hay chọn chỗ ngon, B=Hay rủ đi đâu đó bất ngờ, C=Hay kể chuyện lịch sử, D=Luôn đề xuất gì đó "crazy", E=Bình thản không bao giờ drama
- Q4: A=Chef's Table/food vlog, B=Phim hành trình/road trip, C=Tài liệu lịch sử/drama cổ trang, D=Phim hành động/survival, E=Anime slice-of-life/ASMR
- Q5: A=Đói (nghĩa đen hoặc bóng), B=Tò mò có gì đang chờ khám phá, C=Suy tư muốn chiều sâu, D=Phấn khích cần xả năng lượng, E=Mệt cần được chăm sóc

### Màn 2 — Bạn phản ứng thế nào? (Q6–Q10)

| # | Câu hỏi | A→ | B→ | C→ | D→ | E→ |
|---|---------|----|----|----|----|-----|
| Q6 | Bạn bè rủ ra ngoài lúc 10 giờ tối, bạn...? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q7 | Khi lướt Instagram, bạn hay dừng ở post nào? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q8 | Được tặng 1 triệu đồng tiêu trong ngày, bạn...? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q9 | Câu nào dưới đây bạn hay nói nhất? | Foodie | Explorer | Culture | Adventure | Relaxation |
| Q10 | Nếu bạn là một loại thời tiết, bạn là...? | Foodie | Explorer | Culture | Adventure | Relaxation |

**Đáp án Màn 2:**
- Q6: A="Đi ăn gì không?", B="Đi đâu cũng được miễn là đi", C="Chiếu phim gì/nghe nhạc sống?", D="Chỗ nào vui nhiều người?", E="Chỗ yên tĩnh một chút nha"
- Q7: A=Ảnh đồ ăn đẹp và save ngay, B=Ảnh góc phố lạ chưa thấy, C=Ảnh kiến trúc cổ/triển lãm/nghệ thuật, D=Clip thể thao/parkour/outdoor, E=Ảnh view buổi sáng/cà phê/thiên nhiên
- Q8: A=Book nhà hàng xịn/food tour, B=Thuê xe máy đi không cần đích, C=Mua vé concert/triển lãm/kịch, D=Book hoạt động mạo hiểm chưa dám thử, E=Booking spa/staycation
- Q9: A="Ăn gì đã rồi tính", B="Ủa chỗ này mình chưa thấy bao giờ", C="Thật ra cái này có nguồn gốc từ...", D="Đã thử chưa? Không thử hối hận đó!", E="Thôi mình cần nghỉ một chút"
- Q10: A=Ngày thu se lạnh, B=Buổi sáng sớm có sương mù, C=Chiều tà ánh vàng, D=Cơn giông trước khi mưa, E=Ngày nắng nhẹ gió mát

### Màn 3 — Rating 1–5 (R1–R5)

| # | Phát biểu | Nhóm |
|---|-----------|------|
| R1 | "Một bữa ăn ngon có thể thay đổi hoàn toàn tâm trạng của tôi" | Foodie |
| R2 | "Tôi thấy bất an nếu quá lâu không có gì mới để khám phá" | Explorer |
| R3 | "Tôi muốn hiểu 'tại sao' hơn là chỉ thấy 'cái gì'" | Culture |
| R4 | "Adrenaline là thứ tôi cần để cảm thấy mình đang sống" | Adventure |
| R5 | "Không làm gì cũng là một lựa chọn hoàn toàn hợp lệ" | Relaxation |

### Scoring

- Single choice (Q1–Q10): đáp án đúng nhóm = **+2 điểm**, sai nhóm = **0 điểm**. Max: 20 điểm/nhóm.
- Rating (R1–R5): cộng trực tiếp giá trị 1–5. Max: 5 điểm/nhóm.
- **Tổng max mỗi nhóm: 25 điểm.**
- Nhóm điểm cao nhất = **Primary Vibe**.
- Nếu 2 nhóm chênh nhau ≤ 3 điểm → hiển thị **Hybrid Profile** (cả 2 vibe).

---

## Luồng Ứng Dụng (5 Màn)

```
Màn 0 (Entry)
  ├── Chọn trip type: "Trong ngày (giờ)" | "Chuyến xa (ngày)"
  └── Nhập địa điểm hiện tại (text input)
       ↓
Màn 1–3 (Quiz)
  ├── Màn 1: Q1–Q5 (single choice, masonry card grid)
  ├── Màn 2: Q6–Q10 (single choice, masonry card grid)
  └── Màn 3: R1–R5 (rating 1–5)
       ↓
[Frontend tự tính điểm — không cần API]
       ↓
Màn 4 (Vibe Result)
  ├── Hiển thị Primary Vibe + mô tả personality
  ├── Travel DNA bars (animate on load)
  ├── Hashtag pills (#StreetFood, #HiddenCafés, ...)
  └── CTA: "Xem địa điểm cho tôi" → trigger API
       ↓
POST /api/recommendations
  └── LangChain Agent chạy 3 tools
       ↓
Màn 5 (Địa điểm & Lịch trình)
  ├── Loading skeleton trong khi agent chạy
  ├── Timeline dọc (in-day: theo giờ | multi-day: theo ngày)
  ├── Mỗi địa điểm: tên + mô tả + giờ + distance từ vị trí user
  └── CTA: "Lên kế hoạch lại" → về Màn 0
```

---

## Kiến Trúc Hệ Thống

### Frontend — React SPA (Vite)

- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS với custom config — copy từ example UI (Plus Jakarta Sans + Montserrat, sunset-gradient, glass-card)
- **State:** `useState` + `useReducer` cho quiz state machine, không cần Redux
- **5 màn hình** = 5 component, chuyển đổi bằng state (không dùng router)
- **Scoring:** pure JS, chạy hoàn toàn client-side
- **API call:** duy nhất 1 lần tại Màn 4 → Màn 5

### Backend — FastAPI + LangChain

```
POST /api/recommendations
  Body: {
    vibe: "explorer",
    secondary_vibe: "foodie" | null,
    location: "Quận 1, TP.HCM",
    trip_type: "inday" | "multiday",
    duration: 8  // hours nếu inday, days nếu multiday
  }
  Response: {
    places: [...],
    itinerary: [...],
    vibe_description: "..."
  }
```

### LangChain Agent — 3 Tools

**Tool 1: `describe_vibe(vibe, secondary_vibe)`**
- Input: tên vibe chính + phụ
- Output: mô tả personality 2–3 câu, hashtags phù hợp
- Dùng cho: Màn 4 (personality description)

**Tool 2: `search_locations(vibe, location, trip_type)`**
- Input: vibe + địa điểm user + loại chuyến đi
- Output: list 6–8 địa điểm với tên, mô tả ngắn, loại địa điểm, lý do phù hợp với vibe
- LLM tự generate dựa trên knowledge về địa điểm

**Tool 3: `build_itinerary(places, location, trip_type, duration)`**
- Input: list địa điểm + vị trí user + loại chuyến + thời lượng
- Output: lịch trình theo giờ (inday) hoặc theo ngày (multiday), ước tính distance giữa các điểm theo thứ tự tối ưu

**Agent flow:**
1. Agent nhận request → gọi `describe_vibe` → gọi `search_locations` → gọi `build_itinerary`
2. Agent trả về JSON tổng hợp từ 3 tools
3. Sequence cố định (không cần ReAct loop), dùng `LangChain SequentialChain` hoặc custom agent executor

### LLM Configuration

- Provider: OpenAI-compatible
- Config qua environment variables: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`
- Default model: `gpt-4o-mini` (configurable)

### Deploy — GreenNode AgentBase

- **Docker:** single container, FastAPI serve cả API lẫn React static files — unified port 8080
- **Build process:** `vite build` → `dist/` → FastAPI mount tại `/` bằng `StaticFiles`, fallback `index.html` cho SPA routing
- **Port:** 8080 (duy nhất, GreenNode chỉ expose 1 port)
- **Env vars:** `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `JWT_SECRET`, `GREENNODE_CLIENT_ID`, `GREENNODE_CLIENT_SECRET`
- **Mode:** PUBLIC (không cần VPC cho hackathon)

```
Dockerfile build stages:
  Stage 1 (node): npm install + vite build → /app/dist
  Stage 2 (python): copy /app/dist + pip install + uvicorn main:app --port 8080
```

FastAPI routing:
```
/api/*        → backend handlers
/*            → serve dist/index.html (catch-all cho React Router)
```

---

## UI Design Language

Copy trực tiếp từ `example/ui/page1.html` và `example/ui/page2.html`:

| Token | Giá trị |
|-------|---------|
| Font heading | Plus Jakarta Sans 700/800 |
| Font body | Montserrat 400/500/600 |
| Primary color | `#9d4241` |
| Sunset gradient | `linear-gradient(135deg, #ff6b6b 0%, #ae2f34 100%)` |
| Surface | `#fff8f6` |
| Glass card | `rgba(255,255,255,0.7)` + `backdrop-blur(24px)` |
| Card animation | `slideIn 0.5s ease-out` với stagger 0.1s/card |
| Vibe icon | `float 4s ease-in-out infinite` |
| DNA bars | Animate từ 0% → target width, `1.5s cubic-bezier(0.22, 1, 0.36, 1)` |
| Action bar | Slide-up khi chọn card (`translate-y-full → translate-y-0`) |
| Background | Ambient `radial-gradient` theo vị trí chuột |

---

## Cấu Trúc Project

```
/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntryScreen.jsx
│   │   │   ├── QuizScreen.jsx      # dùng cho màn 1,2,3
│   │   │   ├── VibeResult.jsx
│   │   │   └── Itinerary.jsx
│   │   ├── data/
│   │   │   └── questions.js        # bộ câu hỏi + scoring rules
│   │   ├── utils/
│   │   │   └── scoring.js          # tính điểm, xác định vibe
│   │   └── App.jsx                 # state machine 5 màn
│   └── tailwind.config.js          # copy từ example
│
├── backend/               # FastAPI + LangChain
│   ├── main.py
│   ├── agent/
│   │   ├── tools.py                # 3 LangChain tools
│   │   └── executor.py             # agent setup
│   └── requirements.txt
│
├── Dockerfile
├── docker-compose.yml
└── example/ui/            # design reference (không sửa)
```

---

## Upgrade Path C (nếu còn thời gian)

- Thêm **SSE streaming** cho Màn 5: itinerary xuất hiện từng dòng (typewriter effect)
- Thêm **chat box** dưới Màn 5: user có thể nhắn "đổi sang chỗ gần hơn", "thêm option ăn chay" → agent xử lý tiếp với ConversationMemory
- Backend: thêm `POST /api/chat` với `session_id`, LangChain `ConversationBufferMemory`

---

## Authentication & User Profile

### Auth Flow — Email + Password

```
Màn hình Login/Register (trước Màn 0)
  ├── Register: email + password → tạo account → vào Màn 0 (quiz)
  ├── Login: email + password → kiểm tra vibe profile
  │     ├── Đã có vibe → skip quiz → vào Màn 0 (chỉ nhập location + trip type) → Màn 5
  │     └── Chưa có vibe → vào Màn 0 → quiz → Màn 4 → Màn 5
  └── Token: JWT lưu trong localStorage, gửi kèm mọi API request
```

### Dữ liệu lưu trữ

Chỉ lưu **vibe profile** của user — không lưu lịch sử recommend.

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "password_hash": "bcrypt hash",
  "vibe_profile": {
    "primary_vibe": "explorer",
    "secondary_vibe": "foodie",
    "scores": {
      "foodie": 18,
      "explorer": 23,
      "culture": 12,
      "adventure": 9,
      "relaxation": 7
    },
    "completed_at": "2026-06-13T..."
  }
}
```

`vibe_profile` là `null` cho user mới chưa làm quiz.

### API Endpoints bổ sung

```
POST /api/auth/register   → tạo user, trả JWT
POST /api/auth/login      → xác thực, trả JWT
GET  /api/auth/me         → trả user info + vibe_profile (dùng để check skip quiz)
POST /api/quiz/complete   → lưu vibe_profile sau khi làm quiz xong
```

### Storage — Hybrid Architecture

| Dữ liệu | Lưu ở đâu | Lý do |
|---------|-----------|-------|
| Email + password_hash | SQLite (local) | Memory Service không hỗ trợ auth credentials |
| Vibe profile (scores, vibes) | AgentBase Memory Service | Platform-native, agent query trực tiếp |

**SQLite** — chỉ 1 bảng tối giản:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,   -- UUID, dùng làm actorId cho Memory Service
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  has_vibe BOOLEAN DEFAULT FALSE,
  created_at TEXT
);
```

**AgentBase Memory Service** — lưu vibe profile qua `insert-directly`:

```json
{
  "actorId": "<user_id từ SQLite>",
  "content": {
    "primary_vibe": "explorer",
    "secondary_vibe": "foodie",
    "scores": { "foodie": 18, "explorer": 23, "culture": 12, "adventure": 9, "relaxation": 7 },
    "completed_at": "2026-06-13T..."
  }
}
```

Truy xuất: `GET /memory-records?namespace=.../actors/{user_id}` → agent dùng trực tiếp trong tool `describe_vibe` mà không cần query DB nội bộ.

### Frontend Auth State

- Màn login/register hiển thị trước toàn bộ app (route `/login`)
- Sau login: `GET /api/auth/me` → nếu `vibe_profile != null` → hiện Màn 0 rút gọn (chỉ location + trip type, không có quiz)
- User có thể "Làm lại quiz" từ profile menu để cập nhật vibe

---

## Out of Scope

- Social login (Google/Facebook)
- Lưu lịch sử chuyến đi
- Tích hợp Google Maps API thực (distance là ước tính từ LLM)
- Multi-language (chỉ tiếng Việt)
