# Quiz DNA Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 5-vibe quiz with the 10-question SOLE DNA quiz, producing a normalized 10-axis DNA vector and persona archetype.

**Architecture:** `questions.js` becomes the single source of truth for questions, MAX_POSSIBLE, and personas. `scoring.js` is rewritten to accumulate raw scores per axis and normalize. `QuizScreen` adapts to the new option format. `VibeResult` shows persona name + tagline. `App.jsx` removes QUIZ3/RatingScreen and updates the answer accumulation pattern.

**Tech Stack:** React 18 + Vite, plain JS, FastAPI backend.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/data/questions.js` | Rewrite | 10 DNA questions + MAX_POSSIBLE + PERSONA_MAP |
| `frontend/src/utils/scoring.js` | Rewrite | DNA axis scoring + normalize + persona lookup |
| `frontend/src/components/QuizScreen.jsx` | Modify | Adapt to letter-based options, array-based answers |
| `frontend/src/components/VibeResult.jsx` | Modify | Show persona name, tagline, DNA axes |
| `frontend/src/App.jsx` | Modify | Remove QUIZ3/RatingScreen, array answers, new vibeResult shape |
| `backend/recommendations/router.py` | Modify | Add `persona` field to QuizCompleteRequest |

---

### Task 1: Replace questions data

**Files:**
- Rewrite: `frontend/src/data/questions.js`

- [ ] **Step 1: Replace the entire file**

Write `frontend/src/data/questions.js` with this content:

```js
export const QUESTIONS = [
  {
    num: 1,
    group: "Nhóm A — Động lực đi chơi",
    question: "Chuyến đi hoàn hảo với bạn bắt đầu từ cái gì?",
    options: [
      { letter: "A", label: "Ăn ngon local chuẩn chỉ", imgDesc: "Đĩa cơm tấm sườn nóng hổi, khói bốc nhẹ, quán vỉa hè Sài Gòn", img: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80", scores: { "Ẩm thực": 5 } },
      { letter: "B", label: "Ngấm văn hoá, kiến trúc", imgDesc: "Mái chùa cổ, tường rêu, phố cổ Hội An buổi sáng", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", scores: { "Văn hoá": 5 } },
      { letter: "C", label: "Nằm dài, nạp lại pin", imgDesc: "Ghế lười trong phòng mờ đèn, sách và cà phê, không ai làm phiền", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", scores: { "Thư giãn": 5 } },
      { letter: "D", label: "Mò vào chỗ chưa ai cắm ghim", imgDesc: "Cổng hẻm tối, đèn lồng leo lét, không biển hiệu", img: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&q=80", scores: { "Phiêu lưu": 5 } },
      { letter: "E", label: "Chụp ảnh đẹp, sống ảo xịn", imgDesc: "Góc cafe trắng tinh, cốc latte trên bàn gỗ, ánh sáng cửa sổ lớn", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80", scores: { "Nhiếp ảnh": 5 } },
    ],
  },
  {
    num: 2,
    group: "Nhóm A — Động lực đi chơi",
    question: "Cuối tuần này bạn cần loại năng lượng nào để sạc lại?",
    options: [
      { letter: "A", label: "Thiên nhiên, hít khí trời", imgDesc: "Công viên cây xanh Hà Nội, nắng chiều lọc qua tán lá, không ai chen", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80", scores: { "Thiên nhiên": 5 } },
      { letter: "B", label: "Đông vui ầm ĩ, gặp người mới", imgDesc: "Rooftop bar Sài Gòn đông người, đèn neon nhấp nháy, nhạc live bốc", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", scores: { "Giao lưu": 5 } },
      { letter: "C", label: "Chui vào chỗ ngách không ai biết", imgDesc: "Ngõ hẻm nhỏ Hà Nội không biển hiệu, cửa gỗ cũ ánh đèn vàng ấm", img: "https://images.unsplash.com/photo-1548079787-b5ae2e36d8ad?w=400&q=80", scores: { "Tọa độ ngách": 5 } },
      { letter: "D", label: "Được phục vụ tử tế, không gian sang", imgDesc: "Lobby khách sạn 5 sao, sofa da, đèn ấm, nhân viên chào đón", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", scores: { "Sang chảnh": 5 } },
    ],
  },
  {
    num: 3,
    group: "Nhóm B — Hy sinh để lộ ưu tiên thật",
    question: "Nếu chỉ được giữ đúng một thứ trong chuyến đi — bạn giữ cái gì?",
    options: [
      { letter: "A", label: "Chỗ ngủ phải sang, không thương lượng", imgDesc: "Phòng khách sạn view thành phố, gối trắng tinh, bồn tắm góc", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80", scores: { "Sang chảnh": 5 } },
      { letter: "B", label: "Bữa nào cũng phải ngon, không ăn bừa", imgDesc: "Bàn ăn đầy đĩa bốc khói, mọi người ăn ngon lành, quán đông ấm", img: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80", scores: { "Ẩm thực": 5 } },
      { letter: "C", label: "Trải nghiệm nhiều, không bỏ sót gì", imgDesc: "Bản đồ nhiều ghim điểm đến, balô du lịch, giày thể thao mòn gót", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80", scores: { "Phiêu lưu": 5 } },
      { letter: "D", label: "Tiết kiệm tối đa, về nhà không lo", imgDesc: "Ví tiền dày, sổ ghi ngân sách, nụ cười tự tin nhẹ đầu", img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80", scores: { "Thư giãn": 2, "Hiệu quả": 3 } },
    ],
  },
  {
    num: 4,
    group: "Nhóm B — Hy sinh để lộ ưu tiên thật",
    question: "Ngày đi chơi lý tưởng của bạn trông như thế nào?",
    options: [
      { letter: "A", label: "1–2 chỗ thôi, ngồi lâu, không ai rush", imgDesc: "Võng mắc ngoài trời, sách và cà phê kế bên, không gian vắng tanh", img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80", scores: { "Thư giãn": 5 } },
      { letter: "B", label: "Đi nhiều nhất, tối ưu từng giờ", imgDesc: "Màn hình điện thoại tuyến đường tối ưu, đồng hồ, kế hoạch dày đặc", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80", scores: { "Hiệu quả": 5 } },
      { letter: "C", label: "Lang thang không kế hoạch, thấy hay ghé", imgDesc: "Ngã tư phố cổ Hà Nội không tên đường, bước chân trên gạch cũ, ánh chiều tà", img: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400&q=80", scores: { "Phiêu lưu": 4, "Tọa độ ngách": 3 } },
    ],
  },
  {
    num: 5,
    group: "Nhóm F — Visual choice (tín hiệu mạnh nhất)",
    question: "Bức ảnh nào khiến bạn muốn book ngay không cần suy nghĩ?",
    options: [
      { letter: "A", label: "Fine dining ánh nến", imgDesc: "Nhà hàng fine dining Hà Nội: bàn ăn set tinh tế, nến, hoa tươi", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", scores: { "Sang chảnh": 4, "Ẩm thực": 2 } },
      { letter: "B", label: "Trekking sáng sớm", imgDesc: "Đường mòn trekking Sa Pa, sương sớm, ánh sáng lọc qua lá rừng", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80", scores: { "Phiêu lưu": 4, "Thiên nhiên": 2 } },
      { letter: "C", label: "Chợ local sáng sớm", imgDesc: "Chợ Bến Thành buổi sáng: tiểu thương bày hàng, màu sắc rực, mùi thức ăn", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", scores: { "Ẩm thực": 4, "Tọa độ ngách": 2 } },
      { letter: "D", label: "Resort hồ bơi vô cực", imgDesc: "Resort Phú Quốc: hồ bơi vô cực nhìn ra biển, ghế nằm trắng, cocktail", img: "https://images.unsplash.com/photo-1540541338537-1220059ddec3?w=400&q=80", scores: { "Thư giãn": 4, "Sang chảnh": 2 } },
      { letter: "E", label: "Gallery nghệ thuật", imgDesc: "Sảnh gallery Hà Nội rộng, tranh lớn treo tường, ánh sáng tự nhiên tràn vào", img: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&q=80", scores: { "Văn hoá": 4 } },
      { letter: "F", label: "Rooftop bar về đêm", imgDesc: "Rooftop Sài Gòn: city lights về đêm, cocktail khói, nhạc chill", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80", scores: { "Giao lưu": 4, "Nhiếp ảnh": 2 } },
    ],
  },
  {
    num: 6,
    group: "Nhóm F — Visual choice (tín hiệu mạnh nhất)",
    question: "Không gian nào bạn có thể ngồi cả buổi mà không thấy bị nhốt?",
    options: [
      { letter: "A", label: "Cafe minimalist, yên tĩnh", imgDesc: "Cafe trắng tối giản Hà Nội: bàn gỗ, latte art, ánh sáng cửa sổ lớn đổ vào", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80", scores: { "Nhiếp ảnh": 4, "Tọa độ ngách": 1 } },
      { letter: "B", label: "Quán nhạc live ấm áp", imgDesc: "Quán nhạc live nhỏ Sài Gòn: đông người, đèn spot, nhạc cụ trên sân khấu mini", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80", scores: { "Giao lưu": 4 } },
      { letter: "C", label: "Sân vườn cây xanh thoáng đãng", imgDesc: "Sân vườn cafe Đà Lạt: ghế gỗ, cây xanh bao quanh, gió nhẹ, tiếng chim", img: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=400&q=80", scores: { "Thiên nhiên": 4 } },
      { letter: "D", label: "Co-working tối giản", imgDesc: "Co-working space TP.HCM: bàn dài, MacBook, đèn LED trắng, yên lặng tuyệt đối", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", scores: { "Hiệu quả": 3, "Nhiếp ảnh": 1 } },
    ],
  },
  {
    num: 7,
    group: "Nhóm C — Chịu đựng đám đông",
    question: "Xếp hàng 2 tiếng để vào chỗ hot nổi tiếng — bạn nghĩ sao?",
    options: [
      { letter: "A", label: "Ổn thôi, xứng đáng nếu xịn", imgDesc: "Hàng dài trước Văn Miếu hoặc bảo tàng nổi tiếng, mọi người xếp hàng kiên nhẫn", img: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400&q=80", scores: { "Văn hoá": 3, "Hiệu quả": -2 } },
      { letter: "B", label: "Tùy hôm đó năng lượng thế nào", imgDesc: "Người đứng phân vân giữa ngã ba, nhìn bản đồ rồi lại nhìn hàng người", img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80", scores: {} },
      { letter: "C", label: "Không đời nào, mình tìm chỗ khác", imgDesc: "Hẻm vắng Sài Gòn, quán nhỏ không biển hiệu, vài khách ngồi thưa thớt", img: "https://images.unsplash.com/photo-1548079787-b5ae2e36d8ad?w=400&q=80", scores: { "Tọa độ ngách": 4 } },
    ],
  },
  {
    num: 8,
    group: "Nhóm D — Giới hạn thể lực",
    question: "Một ngày đi chơi bạn sẵn sàng cuốc bộ bao nhiêu?",
    options: [
      { letter: "A", label: "Dưới 5km — Grab cho nhanh", imgDesc: "Xe Grab dừng trước cửa quán phố Hà Nội, không cần xuống sớm", img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80", scores: { "Thư giãn": 4 } },
      { letter: "B", label: "5–10km — vừa phải, ghé được vài chỗ", imgDesc: "Hai người đi bộ thong thả trên phố Hội An, bản đồ cầm tay, nắng vừa đủ", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", scores: { "Thư giãn": 2, "Phiêu lưu": 1 } },
      { letter: "C", label: "10–15km — mệt nhưng đáng", imgDesc: "Người đi bộ qua khu phố cổ Hà Nội dài, nhà cũ rêu phong, bóng chiều dài", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", scores: { "Phiêu lưu": 3 } },
      { letter: "D", label: "Trên 15km — chân to gan lớn", imgDesc: "Giày thể thao mòn gót trên đường mòn đất đỏ Sa Pa, cây rừng hai bên", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80", scores: { "Phiêu lưu": 5, "Thư giãn": -2 } },
    ],
  },
  {
    num: 9,
    group: "Nhóm E — Hành vi chi tiêu",
    question: "Dư đột xuất 5 triệu cho chuyến đi — bạn làm gì đầu tiên?",
    options: [
      { letter: "A", label: "Nâng hạng phòng ngay — ngủ xịn mới ngon", imgDesc: "Nâng phòng khách sạn: view đẹp hơn, phòng rộng hơn, bồn tắm góc", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", scores: { "Sang chảnh": 5 } },
      { letter: "B", label: "Book bữa ăn xịn hơn — ăn cho ra hồn", imgDesc: "Bàn ăn nhà hàng ngon Hà Nội, menu tiếng Pháp, plating đẹp như ảnh", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", scores: { "Ẩm thực": 5 } },
      { letter: "C", label: "Thêm hoạt động, nhét thêm trải nghiệm", imgDesc: "Vé vào cửa nhiều điểm tham quan, lịch trình dày đặc, năng lượng cao trào", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80", scores: { "Phiêu lưu": 4 } },
      { letter: "D", label: "Để dành — đủ là đủ, không cần tiêu thêm", imgDesc: "Ví tiền còn nhiều, về nhà nhẹ đầu, không lo overdraft tháng sau", img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80", scores: { "Thư giãn": 2, "Hiệu quả": 3 } },
    ],
  },
  {
    num: 10,
    group: "Nhóm A+F — Tổng kết hành vi",
    question: "Đặt chân đến thành phố mới, việc đầu tiên bạn làm là gì?",
    options: [
      { letter: "A", label: "Tìm món signature local, ăn trước rồi tính", imgDesc: "Tô bún bò Huế bốc khói trên bàn gỗ nhỏ trong hẻm sâu, sáng sớm", img: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80", scores: { "Ẩm thực": 3, "Tọa độ ngách": 2 } },
      { letter: "B", label: "Check-in landmark nổi tiếng để đánh dấu", imgDesc: "Selfie trước Nhà thờ Đức Bà hoặc Hồ Hoàn Kiếm, trời xanh, nắng đẹp", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", scores: { "Nhiếp ảnh": 3, "Văn hoá": 2 } },
      { letter: "C", label: "Vào phòng nghỉ trước, hẵng tính chuyện ra", imgDesc: "Vali kéo vào phòng khách sạn Đà Nẵng, thả người xuống giường, thở phào", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80", scores: { "Sang chảnh": 3, "Thư giãn": 2 } },
      { letter: "D", label: "Hỏi người local — mới là real", imgDesc: "Cầm điện thoại hỏi chú xe ôm hoặc cô bán hàng địa phương, thân thiện", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80", scores: { "Tọa độ ngách": 4 } },
    ],
  },
]

export const MAX_POSSIBLE = {
  "Ẩm thực": 19,
  "Văn hoá": 12,
  "Thiên nhiên": 11,
  "Phiêu lưu": 23,
  "Sang chảnh": 19,
  "Giao lưu": 10,
  "Tọa độ ngách": 16,
  "Thư giãn": 21,
  "Nhiếp ảnh": 12,
  "Hiệu quả": 14,
}

export const PERSONA_MAP = [
  { key: ["Ẩm thực", "Tọa độ ngách", "Văn hoá"], name: "Kẻ Khám Phá Bản Địa", tagline: "Ẩm thực local, ngách, không theo đám đông", accentColor: "#BD00FF" },
  { key: ["Sang chảnh", "Thư giãn", "Nhiếp ảnh"], name: "Luxury Escapist", tagline: "Sang trọng, thẩm mỹ, nghỉ ngơi chất lượng", accentColor: "#ECB2FF" },
  { key: ["Giao lưu", "Ẩm thực", "Nhiếp ảnh"], name: "Vibe Architect", tagline: "Nightlife, food photogenic, tạo không khí", accentColor: "#BD00FF" },
  { key: ["Hiệu quả", "Văn hoá", "Sang chảnh"], name: "Power Traveler", tagline: "Tối ưu thời gian, điểm biểu tượng, premium", accentColor: "#ECB2FF" },
  { key: ["Tọa độ ngách", "Thiên nhiên", "Phiêu lưu"], name: "Urban Hermit", tagline: "Tránh đám đông, tìm tọa độ tối thượng", accentColor: "#00FFA3" },
  { key: ["Phiêu lưu", "Thiên nhiên"], name: "Adventure Nomad", tagline: "Thể lực cao, thiên nhiên, thích thử thách", accentColor: "#00FFA3" },
  { key: "default", name: "Đa Tần Số", tagline: "Bộ gen phức tạp — SOLE đang học thêm về bạn", accentColor: "#BD00FF" },
]
```

- [ ] **Step 2: Verify the file is valid JS**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
node -e "import('./src/data/questions.js').then(m => { console.log('QUESTIONS:', m.QUESTIONS.length, 'MAX_POSSIBLE axes:', Object.keys(m.MAX_POSSIBLE).length, 'PERSONA_MAP:', m.PERSONA_MAP.length); })"
```

Expected output:
```
QUESTIONS: 10 MAX_POSSIBLE axes: 10 PERSONA_MAP: 7
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/questions.js
git commit -m "feat: replace quiz questions with 10-question DNA system from PRD"
```

---

### Task 2: Rewrite scoring utility

**Files:**
- Rewrite: `frontend/src/utils/scoring.js`

- [ ] **Step 1: Replace the entire file**

Write `frontend/src/utils/scoring.js` with this content:

```js
import { QUESTIONS, MAX_POSSIBLE, PERSONA_MAP } from '../data/questions.js'

/**
 * Calculate DNA scores from quiz answers.
 * @param {Array<{questionNum: number, selectedOption: string}>} answers
 * @returns {{ axes: Record<string,number>, primary: string, secondary: string, persona: string, tagline: string, accentColor: string }}
 */
export function calculateScores(answers) {
  // Accumulate raw scores per axis
  const raw = {}
  for (const axis of Object.keys(MAX_POSSIBLE)) {
    raw[axis] = 0
  }

  for (const { questionNum, selectedOption } of answers) {
    const q = QUESTIONS.find(q => q.num === questionNum)
    if (!q) continue
    const opt = q.options.find(o => o.letter === selectedOption)
    if (!opt) continue
    for (const [axis, points] of Object.entries(opt.scores)) {
      if (raw[axis] !== undefined) {
        raw[axis] += points
      }
    }
  }

  // Clamp negatives to 0, then normalize to 0-100
  const axes = {}
  for (const [axis, maxVal] of Object.entries(MAX_POSSIBLE)) {
    const clamped = Math.max(0, raw[axis])
    axes[axis] = Math.round((clamped / maxVal) * 100)
  }

  // Sort axes descending
  const sorted = Object.entries(axes).sort((a, b) => b[1] - a[1])
  const primary = sorted[0][0]
  const secondary = sorted[1][0]
  const top3Keys = sorted.slice(0, 3).map(([k]) => k)

  // Find persona: first entry whose key array is fully contained in top3
  const matched = PERSONA_MAP.find(p => {
    if (p.key === 'default') return false
    return p.key.every(k => top3Keys.includes(k))
  }) || PERSONA_MAP.find(p => p.key === 'default')

  return {
    axes,
    primary,
    secondary,
    persona: matched.name,
    tagline: matched.tagline,
    accentColor: matched.accentColor,
  }
}
```

- [ ] **Step 2: Verify with a quick smoke test**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
node -e "
import('./src/utils/scoring.js').then(({ calculateScores }) => {
  const answers = [
    { questionNum: 1, selectedOption: 'A' },
    { questionNum: 2, selectedOption: 'C' },
    { questionNum: 3, selectedOption: 'B' },
    { questionNum: 4, selectedOption: 'C' },
    { questionNum: 5, selectedOption: 'C' },
    { questionNum: 6, selectedOption: 'A' },
    { questionNum: 7, selectedOption: 'C' },
    { questionNum: 8, selectedOption: 'C' },
    { questionNum: 9, selectedOption: 'B' },
    { questionNum: 10, selectedOption: 'A' },
  ]
  const result = calculateScores(answers)
  console.log('primary:', result.primary)
  console.log('persona:', result.persona)
  console.log('axes keys:', Object.keys(result.axes).length)
  const allPercent = Object.values(result.axes).every(v => v >= 0 && v <= 100)
  console.log('all axes 0-100:', allPercent)
})
"
```

Expected output:
```
primary: Ẩm thực
persona: Kẻ Khám Phá Bản Địa
axes keys: 10
all axes 0-100: true
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/scoring.js
git commit -m "feat: rewrite scoring for 10-axis DNA system with normalize + persona lookup"
```

---

### Task 3: Update QuizScreen for new option format

**Files:**
- Modify: `frontend/src/components/QuizScreen.jsx`

The current QuizScreen uses `opt.vibe` as the selection key and `answers` as a plain object `{ q1: 'foodie', ... }`. The new format uses `opt.letter` as the key and answers are accumulated externally — `onDone` receives `[{questionNum, selectedOption}]`.

- [ ] **Step 1: Read the current file**

Read `frontend/src/components/QuizScreen.jsx` to confirm current structure before editing.

- [ ] **Step 2: Rewrite the component**

Replace the entire file with:

```jsx
import { useState } from 'react'

export default function QuizScreen({ questions, screenIndex, totalScreens, onDone }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  const question = questions[currentIdx]
  // Global progress: each screen covers 5 questions out of 10 total
  const globalProgress = ((screenIndex - 1) * 5 + currentIdx) / 10

  function handleSelect(letter) {
    if (animating) return
    setSelected(letter)
    const newAnswer = { questionNum: question.num, selectedOption: letter }
    const newAnswers = [...answers, newAnswer]
    setAnimating(true)
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setAnswers(newAnswers)
        setCurrentIdx(i => i + 1)
        setSelected(null)
        setAnimating(false)
      } else {
        onDone(newAnswers)
      }
    }, 400)
  }

  const masonryDelay = (i) => `${(i + 1) * 0.1}s`

  return (
    <div
      className="min-h-screen bg-background pb-12 overflow-x-hidden"
      onMouseMove={(e) => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,107,107,0.05) 0%, transparent 50%)`
      }}
    >
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-container-margin h-20 flex flex-col justify-center gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="font-label text-label-md text-primary tracking-widest uppercase">Discovery</span>
          <span className="font-label text-label-md text-on-surface-variant">
            Step {screenIndex}/{totalScreens}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full sunset-gradient rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.round(globalProgress * 100)}%` }}
          />
        </div>
      </header>

      <main className="pt-28 pb-12 px-container-margin">
        <section className="mb-stack-lg">
          <h1 className="font-display text-headline-lg-mobile text-on-surface leading-tight tracking-tight">
            {question.question}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-2">
            Chọn đáp án phù hợp nhất với bạn.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 pb-24" style={{ gridAutoRows: 'auto' }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === opt.letter
            const isEven = i % 2 === 1

            return (
              <button
                key={opt.letter}
                onClick={() => handleSelect(opt.letter)}
                className={`animate-slide-in relative group flex flex-col text-left focus:outline-none transition-transform active:scale-95 ${
                  isEven ? 'mt-6' : ''
                }`}
                style={{ animationDelay: masonryDelay(i), opacity: 0, animationFillMode: 'forwards' }}
              >
                <div
                  className={`overflow-hidden rounded-lg mb-3 transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-primary scale-[1.02]' : ''
                  }`}
                  style={{ aspectRatio: i % 2 === 0 ? '4/5' : '4/6' }}
                >
                  {opt.img ? (
                    <img
                      src={opt.img}
                      alt={opt.imgDesc || opt.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-5xl"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #ff6b6b 0%, #ae2f34 100%)'
                          : 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)',
                      }}
                    >
                      {opt.letter}
                    </div>
                  )}
                </div>
                <div
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary scale-[1.02]'
                      : 'bg-surface-container-low text-on-surface border-white/40'
                  }`}
                >
                  <p className="font-body text-body-md leading-snug">{opt.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify the build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | grep -E "error|✓"
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/QuizScreen.jsx
git commit -m "feat: update QuizScreen for letter-based DNA question options with images"
```

---

### Task 4: Update VibeResult for DNA persona display

**Files:**
- Modify: `frontend/src/components/VibeResult.jsx`

The new `vibeResult` shape is `{ axes, primary, secondary, persona, tagline, accentColor }`. The old shape was `{ scores, primary, secondary }` using old vibe keys.

- [ ] **Step 1: Read the current file**

Read `frontend/src/components/VibeResult.jsx` to confirm current structure before editing.

- [ ] **Step 2: Rewrite the component**

Replace the entire file with:

```jsx
import { useEffect, useRef } from 'react'

const AXIS_ICONS = {
  "Ẩm thực": "🍜",
  "Văn hoá": "🏛️",
  "Thiên nhiên": "🌿",
  "Phiêu lưu": "⚡",
  "Sang chảnh": "💎",
  "Giao lưu": "🎉",
  "Tọa độ ngách": "🔍",
  "Thư giãn": "😌",
  "Nhiếp ảnh": "📸",
  "Hiệu quả": "🗺️",
}

export default function VibeResult({ vibeResult, onContinue }) {
  const barsRef = useRef([])

  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return
      const target = bar.dataset.target
      bar.style.width = '0%'
      setTimeout(() => {
        bar.style.transition = 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
        bar.style.width = target
      }, 400 + i * 100)
    })
  }, [])

  if (!vibeResult) return null

  const { axes, primary, persona, tagline } = vibeResult
  const sortedAxes = Object.entries(axes).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pt-20 pb-32 px-container-margin relative overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16 left-0">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <div className="mb-stack-lg text-center">
        <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full mb-stack-sm inline-block">
          Your Travel DNA
        </span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface">
          {persona}
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mt-2 italic">
          "{tagline}"
        </p>
      </div>

      <div className="relative w-full mb-stack-lg rounded-xl overflow-hidden shadow-lg group" style={{ aspectRatio: '4/3' }}>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ffe9e5 0%, #ffdad3 100%)' }}
        >
          <div className="text-9xl opacity-20">{AXIS_ICONS[primary] || '✨'}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/10">
          <div className="glass-card w-full p-stack-lg rounded-lg shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sunset-gradient rounded-full flex items-center justify-center mb-stack-md shadow-[0_8px_32px_rgba(255,107,107,0.4)] animate-float text-4xl">
                {AXIS_ICONS[primary] || '✨'}
              </div>
              <h3 className="font-display text-headline-lg text-primary mb-2">
                {persona}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant italic">
                {tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-stack-lg space-y-stack-md">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-display text-headline-md text-on-surface">Travel DNA</h4>
          <span className="font-label text-label-md text-primary">Uniquely Yours</span>
        </div>
        <div className="bg-white/50 backdrop-blur-md rounded-lg p-stack-md border border-white/40 shadow-sm space-y-6">
          {sortedAxes.map(([axis, pct], i) => (
            <div key={axis} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-label text-label-md text-on-surface-variant">
                  {AXIS_ICONS[axis]} {axis}
                </span>
                <span className="font-label text-label-md text-primary">{pct}%</span>
              </div>
              <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  ref={el => barsRef.current[i] = el}
                  data-target={`${pct}%`}
                  className="h-full sunset-gradient rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 w-full px-container-margin pb-10 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={onContinue}
          className="sunset-gradient text-on-primary w-full py-4 rounded-full font-label text-label-md uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 max-w-sm mx-auto"
        >
          Show Places For Me
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/VibeResult.jsx
git commit -m "feat: update VibeResult to show DNA persona name, tagline, 10-axis bars"
```

---

### Task 5: Update App.jsx quiz flow

**Files:**
- Modify: `frontend/src/App.jsx`

Changes: remove QUIZ3 + RatingScreen, change `singleAnswers` from `{}` to `[]`, update `handleQuiz1Done` / `handleQuiz2Done`, update `calculateScores` call, update quiz screen splits to use new `QUESTIONS` array.

- [ ] **Step 1: Read the current App.jsx**

Read `frontend/src/App.jsx` to confirm current state before editing.

- [ ] **Step 2: Update imports**

Remove the `RatingScreen` import and the old `SINGLE_CHOICE_QUESTIONS, RATING_QUESTIONS` import. Replace with:

```js
import { QUESTIONS } from './data/questions.js'
import { calculateScores } from './utils/scoring.js'
```

Remove:
```js
import RatingScreen from './components/RatingScreen.jsx'
import { SINGLE_CHOICE_QUESTIONS, RATING_QUESTIONS } from './data/questions.js'
```

- [ ] **Step 3: Update state declarations**

Change:
```js
const [singleAnswers, setSingleAnswers] = useState({})
const [ratingAnswers, setRatingAnswers] = useState({})
```

To:
```js
const [quizAnswers, setQuizAnswers] = useState([])
```

- [ ] **Step 4: Replace quiz handler functions**

Remove `handleQuiz1Done`, `handleQuiz2Done`, `handleQuiz3Done`. Replace with:

```js
function handleQuiz1Done(answers) {
  setQuizAnswers(answers)
  setScreen('QUIZ2')
}

async function handleQuiz2Done(answers) {
  const allAnswers = [...quizAnswers, ...answers]
  const result = calculateScores(allAnswers)
  setVibeResult(result)
  try {
    await api.quizComplete({
      primary_vibe: result.primary,
      secondary_vibe: result.secondary,
      scores: result.axes,
      persona: result.persona,
    })
    setUser(prev => prev ? { ...prev, has_vibe: true } : prev)
  } catch (e) {
    console.warn('Failed to save vibe:', e)
  }
  setScreen('VIBE')
}
```

- [ ] **Step 5: Update handleRestart and handleRetakeQuiz**

In `handleRestart`, replace `setSingleAnswers({})` / `setRatingAnswers({})` with:
```js
setQuizAnswers([])
```

In `handleRetakeQuiz`, replace `setSingleAnswers({})` / `setRatingAnswers({})` with:
```js
setQuizAnswers([])
```

- [ ] **Step 6: Update quiz screen splits and render block**

Replace:
```js
const screen1Qs = SINGLE_CHOICE_QUESTIONS.filter(q => q.screen === 1)
const screen2Qs = SINGLE_CHOICE_QUESTIONS.filter(q => q.screen === 2)
```

With:
```js
const screen1Qs = QUESTIONS.slice(0, 5)
const screen2Qs = QUESTIONS.slice(5, 10)
```

In the return JSX, remove:
```jsx
{screen === 'QUIZ3' && <RatingScreen screenIndex={3} totalScreens={3} onDone={handleQuiz3Done} />}
```

Change `totalScreens={3}` to `totalScreens={2}` on both QuizScreen usages.

Update handler refs:
```jsx
{screen === 'QUIZ1' && <QuizScreen questions={screen1Qs} screenIndex={1} totalScreens={2} onDone={handleQuiz1Done} />}
{screen === 'QUIZ2' && <QuizScreen questions={screen2Qs} screenIndex={2} totalScreens={2} onDone={handleQuiz2Done} />}
```

Also update `showNav` to remove `'QUIZ3'`:
```js
const showNav = !['AUTH', 'QUIZ1', 'QUIZ2'].includes(screen)
```

- [ ] **Step 7: Verify the build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | grep -E "error|✓|warn"
```

Expected: `✓ built in` with no errors. Unused variable warnings for `RATING_QUESTIONS` or old imports are acceptable only if they're fully removed.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: update App.jsx quiz flow for 2-screen DNA quiz, remove QUIZ3/RatingScreen"
```

---

### Task 6: Update backend QuizCompleteRequest schema

**Files:**
- Modify: `backend/recommendations/router.py`

Add `persona` field to `QuizCompleteRequest`.

- [ ] **Step 1: Update the Pydantic model**

In `backend/recommendations/router.py`, find the `QuizCompleteRequest` class:

```python
class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    scores: dict[str, int]
```

Replace with:

```python
class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    scores: dict[str, int]
    persona: str | None = None
```

Also update the `profile` dict inside `quiz_complete` handler to include persona:

Find:
```python
    profile = {
        "primary_vibe": req.primary_vibe,
        "secondary_vibe": req.secondary_vibe,
        "scores": req.scores,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
```

Replace with:
```python
    profile = {
        "primary_vibe": req.primary_vibe,
        "secondary_vibe": req.secondary_vibe,
        "scores": req.scores,
        "persona": req.persona,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -c "from recommendations.router import router; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/recommendations/router.py
git commit -m "feat: add persona field to QuizCompleteRequest and stored profile"
```

---

### Task 7: Update YourVibeScreen for new vibeResult shape

**Files:**
- Modify: `frontend/src/components/YourVibeScreen.jsx`

`YourVibeScreen` currently uses `vibeResult.primary` and `vibeResult.scores` (old 5-vibe shape). It needs to use `vibeResult.axes` (new 10-axis shape) and `vibeResult.persona`.

- [ ] **Step 1: Read the current YourVibeScreen.jsx**

Read `frontend/src/components/YourVibeScreen.jsx` to confirm current structure.

- [ ] **Step 2: Update VIBE_META mapping and score display**

The file uses `VIBE_META` (old 5-vibe keys: Foodie, Explorer, etc.) and `vibeResult.scores`. Update to use `vibeResult.axes` (10 DNA axes in Vietnamese).

Replace `VIBE_META` and `SCORE_LABELS` with:

```js
const AXIS_META = {
  "Ẩm thực":      { icon: "🍜", keyword: "street food vietnam" },
  "Văn hoá":      { icon: "🏛️", keyword: "ancient temple vietnam" },
  "Thiên nhiên":  { icon: "🌿", keyword: "nature vietnam" },
  "Phiêu lưu":    { icon: "⚡", keyword: "adventure vietnam" },
  "Sang chảnh":   { icon: "💎", keyword: "luxury hotel vietnam" },
  "Giao lưu":     { icon: "🎉", keyword: "rooftop bar vietnam" },
  "Tọa độ ngách": { icon: "🔍", keyword: "hidden cafe vietnam" },
  "Thư giãn":     { icon: "😌", keyword: "beach sunset vietnam" },
  "Nhiếp ảnh":    { icon: "📸", keyword: "photography vietnam" },
  "Hiệu quả":     { icon: "🗺️", keyword: "city walking vietnam" },
}
```

Replace `VIBE_META` persona mapping with:

```js
const PERSONA_META = {
  "Kẻ Khám Phá Bản Địa": { icon: "🔍", keyword: "hidden alley vietnam" },
  "Luxury Escapist":       { icon: "💎", keyword: "luxury resort vietnam" },
  "Vibe Architect":        { icon: "🎉", keyword: "rooftop bar vietnam night" },
  "Power Traveler":        { icon: "🗺️", keyword: "city landmarks vietnam" },
  "Urban Hermit":          { icon: "🌿", keyword: "hidden gem nature vietnam" },
  "Adventure Nomad":       { icon: "⚡", keyword: "trekking vietnam" },
  "Đa Tần Số":             { icon: "✨", keyword: "vietnam travel" },
}
```

Update the hero section to use `vibeResult.persona` and `vibeResult.tagline`:

```jsx
const personaMeta = PERSONA_META[vibeResult.persona] || { icon: '✨', keyword: 'vietnam travel' }
const photos = useUnsplash(personaMeta.keyword)

// Hero
<div className="text-6xl mb-3">{personaMeta.icon}</div>
<h2 className="font-display text-2xl text-primary font-bold mb-2">{vibeResult.persona}</h2>
<p className="font-body text-body-md text-on-surface-variant italic">"{vibeResult.tagline}"</p>
```

Update the score grid to use `vibeResult.axes` instead of `vibeResult.scores`:

```jsx
const scores = vibeResult.axes || {}
const maxScore = Math.max(...Object.values(scores), 1)
const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])

// In the grid:
<div className="text-2xl mb-1">{AXIS_META[vibe]?.icon || '🌟'}</div>
<div className="font-label text-label-md text-primary font-semibold">{AXIS_META[vibe]?.icon} {vibe}</div>
```

- [ ] **Step 3: Verify the build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | grep -E "error|✓"
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/YourVibeScreen.jsx
git commit -m "feat: update YourVibeScreen for 10-axis DNA vibeResult shape"
```

---

### Task 8: Update EntryScreen vibe badge

**Files:**
- Modify: `frontend/src/components/EntryScreen.jsx`

`EntryScreen` uses `VIBE_META` from `questions.js` to show the vibe badge. That export no longer exists. Update to use the new persona.

- [ ] **Step 1: Read the current EntryScreen.jsx**

Read `frontend/src/components/EntryScreen.jsx` to find the VIBE_META usage.

- [ ] **Step 2: Replace VIBE_META usage**

Remove the import of `VIBE_META` (or any import from `questions.js`).

Replace the inline `VIBE_META` map inside `EntryScreen.jsx` with:

```js
const PERSONA_ICONS = {
  "Kẻ Khám Phá Bản Địa": "🔍",
  "Luxury Escapist": "💎",
  "Vibe Architect": "🎉",
  "Power Traveler": "🗺️",
  "Urban Hermit": "🌿",
  "Adventure Nomad": "⚡",
  "Đa Tần Số": "✨",
}
```

Update the vibe badge display to use `vibeResult.persona` instead of `vibeResult.primary`:

```jsx
// Replace the badge content:
<span className="text-lg">{PERSONA_ICONS[vibeResult.persona] || '✨'}</span>
<span className="font-label text-label-md text-primary">
  {vibeResult.persona}
</span>
```

- [ ] **Step 3: Verify the build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | grep -E "error|✓"
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/EntryScreen.jsx
git commit -m "feat: update EntryScreen vibe badge for DNA persona display"
```
