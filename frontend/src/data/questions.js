export const VIBES = ['foodie', 'explorer', 'culture', 'adventure', 'relaxation']

export const VIBE_META = {
  foodie:      { label: '🍜 Foodie',      color: '#f97316' },
  explorer:    { label: '🗺️ Explorer',    color: '#8b5cf6' },
  culture:     { label: '🏛️ Culture',     color: '#0ea5e9' },
  adventure:   { label: '⚡ Adventure',   color: '#ef4444' },
  relaxation:  { label: '🌿 Relaxation',  color: '#22c55e' },
}

// Single-choice questions (Q1-Q10)
export const SINGLE_CHOICE_QUESTIONS = [
  // --- Screen 1 (Q1-Q5) ---
  {
    id: 'q1', screen: 1,
    question: 'Bạn có một buổi chiều hoàn toàn tự do, không kế hoạch. Bạn cảm thấy...?',
    options: [
      { text: '😋 Hứng khởi — ngay lập tức nghĩ tới nơi muốn thử ăn', vibe: 'foodie' },
      { text: '🧭 Tò mò — muốn đi lang thang xem có gì mới', vibe: 'explorer' },
      { text: '📖 Suy nghĩ — muốn làm gì đó có ý nghĩa', vibe: 'culture' },
      { text: '⚡ Bứt rứt — cần làm gì đó, ngồi yên không được', vibe: 'adventure' },
      { text: '😌 Nhẹ nhõm — cuối cùng cũng được không làm gì', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q2', screen: 1,
    question: 'Khi stress nặng, bạn thường giải tỏa bằng cách...?',
    options: [
      { text: '🍳 Ăn một bữa ngon, hoặc vào bếp tự nấu', vibe: 'foodie' },
      { text: '🚶 Ra ngoài đi, dù chẳng biết đi đâu', vibe: 'explorer' },
      { text: '📚 Đọc sách, xem phim, nghe nhạc', vibe: 'culture' },
      { text: '🏃 Tập thể thao, đổ mồ hôi cho hết', vibe: 'adventure' },
      { text: '🛌 Nằm im, tắt điện thoại, ngủ thêm', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q3', screen: 1,
    question: 'Bạn bè hay mô tả bạn là người...?',
    options: [
      { text: '😋 "Biết ăn" — luôn biết chỗ ngon, gọi món không bao giờ sai', vibe: 'foodie' },
      { text: '🗺️ Hay rủ đi đâu đó vào những lúc bất ngờ nhất', vibe: 'explorer' },
      { text: '🏛️ Hay kể chuyện lịch sử, văn hóa lúc không ai hỏi', vibe: 'culture' },
      { text: '⚡ Luôn đề xuất thứ gì đó "hơi crazy"', vibe: 'adventure' },
      { text: '😌 Bình thản, dễ tính, không bao giờ cần drama', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q4', screen: 1,
    question: "Một bộ phim/series bạn có thể xem đi xem lại?",
    options: [
      { text: "🎬 Chef's Table, Ugly Delicious — bất kỳ thứ gì về ẩm thực", vibe: 'foodie' },
      { text: '🌍 Phim về hành trình, road trip, khám phá thế giới', vibe: 'explorer' },
      { text: '📜 Tài liệu lịch sử, drama cổ trang, phim nghệ thuật', vibe: 'culture' },
      { text: '💥 Phim hành động, survival, leo núi, đua xe', vibe: 'adventure' },
      { text: '🌸 Anime slice-of-life, sitcom nhẹ nhàng, ASMR', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q5', screen: 1,
    question: 'Tâm trạng của bạn lúc này gần giống nhất với...?',
    options: [
      { text: '🍜 Đói — theo nghĩa đen hoặc nghĩa bóng', vibe: 'foodie' },
      { text: '🔍 Tò mò — có gì đó đang chờ được khám phá', vibe: 'explorer' },
      { text: '💭 Suy tư — muốn có chiều sâu, không phải bề mặt', vibe: 'culture' },
      { text: '⚡ Phấn khích — cần xả năng lượng, không thể ngồi yên', vibe: 'adventure' },
      { text: '🌿 Mệt — nhưng là cái mệt cần được chăm sóc', vibe: 'relaxation' },
    ],
  },
  // --- Screen 2 (Q6-Q10) ---
  {
    id: 'q6', screen: 2,
    question: 'Một người bạn rủ ra ngoài lúc 10 giờ tối. Bạn...?',
    options: [
      { text: '🍽️ "Đi ăn gì không?" là câu đầu tiên bạn hỏi', vibe: 'foodie' },
      { text: '🚀 "Đi đâu cũng được, miễn là đi"', vibe: 'explorer' },
      { text: '🎵 "Chiếu phim gì không, hay nghe nhạc sống?"', vibe: 'culture' },
      { text: '🎉 "Có chỗ nào vui vẻ, nhiều người không?"', vibe: 'adventure' },
      { text: '☕ "Ừ nhưng chỗ nào yên tĩnh một chút nha"', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q7', screen: 2,
    question: 'Khi lướt Instagram, bạn hay dừng lại ở loại post nào?',
    options: [
      { text: '🍣 Ảnh đồ ăn đẹp — và ngay lập tức save lại', vibe: 'foodie' },
      { text: '🏙️ Ảnh góc phố, địa điểm lạ chưa thấy bao giờ', vibe: 'explorer' },
      { text: '🏛️ Ảnh kiến trúc cổ, triển lãm, nghệ thuật', vibe: 'culture' },
      { text: '🤸 Clip thể thao, parkour, outdoor cực đỉnh', vibe: 'adventure' },
      { text: '🌅 Ảnh view buổi sáng, cà phê, thiên nhiên yên bình', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q8', screen: 2,
    question: 'Được tặng 1 triệu đồng để tiêu trong ngày hôm nay. Bạn...?',
    options: [
      { text: '🍽️ Booking bàn nhà hàng xịn hoặc đặt food tour', vibe: 'foodie' },
      { text: '🛵 Thuê xe máy, đổ xăng đầy, đi không cần đích đến', vibe: 'explorer' },
      { text: '🎭 Mua vé xem concert, triển lãm hoặc vé kịch tối nay', vibe: 'culture' },
      { text: '🪂 Book ngay một hoạt động mạo hiểm chưa dám thử', vibe: 'adventure' },
      { text: '💆 Booking spa hoặc staycation khách sạn đẹp', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q9', screen: 2,
    question: 'Câu nào dưới đây bạn hay nói nhất?',
    options: [
      { text: '🍜 "Mình ăn gì đã rồi tính tiếp"', vibe: 'foodie' },
      { text: '🗺️ "Ủa chỗ này mình chưa thấy bao giờ, vào xem thử không?"', vibe: 'explorer' },
      { text: '📖 "Thật ra cái này có nguồn gốc từ..."', vibe: 'culture' },
      { text: '⚡ "Đã thử chưa? Không thử hối hận đó!"', vibe: 'adventure' },
      { text: '😌 "Thôi mình cần nghỉ một chút"', vibe: 'relaxation' },
    ],
  },
  {
    id: 'q10', screen: 2,
    question: 'Nếu bạn là một loại thời tiết, bạn là...?',
    options: [
      { text: '🍂 Ngày thu se lạnh — đủ mát để ngồi ăn uống thật lâu', vibe: 'foodie' },
      { text: '🌫️ Buổi sáng sớm có sương mù — bí ẩn, chờ được khám phá', vibe: 'explorer' },
      { text: '🌇 Chiều tà ánh vàng — đẹp, trầm, đáng ngẫm', vibe: 'culture' },
      { text: '⛈️ Cơn giông trước khi mưa — căng, kịch tính, đầy năng lượng', vibe: 'adventure' },
      { text: '☀️ Ngày nắng nhẹ, gió mát — không quá, vừa đủ', vibe: 'relaxation' },
    ],
  },
]

// Rating questions (R1-R5, screen 3)
export const RATING_QUESTIONS = [
  { id: 'r1', vibe: 'foodie',     statement: 'Một bữa ăn ngon có thể thay đổi hoàn toàn tâm trạng của tôi' },
  { id: 'r2', vibe: 'explorer',   statement: 'Tôi thấy bất an nếu quá lâu không có gì mới để khám phá' },
  { id: 'r3', vibe: 'culture',    statement: 'Tôi muốn hiểu "tại sao" hơn là chỉ thấy "cái gì"' },
  { id: 'r4', vibe: 'adventure',  statement: 'Adrenaline là thứ tôi cần để cảm thấy mình đang sống' },
  { id: 'r5', vibe: 'relaxation', statement: 'Không làm gì cũng là một lựa chọn hoàn toàn hợp lệ' },
]
