# SOLE — Travel Vibe Agent

Trợ lý lập lịch trình du lịch cá nhân hoá bằng AI, chạy 24/7 trên AgentBase — triển khai một click, không cần biết code.

**Vấn đề giải quyết:** Lập kế hoạch du lịch mất thời gian và thường cho ra kết quả chung chung — danh sách "top 10 phải ghé" không phản ánh đúng phong cách của từng người. Context bị mất giữa các chuyến, và không có công cụ nào thực sự hiểu bạn thích gì.

**Giải pháp:**

- **DNA du lịch cá nhân** — quiz ngắn phân tích phong cách du lịch theo 10 trục (Ẩm thực, Văn hoá, Thiên nhiên, Sang chảnh, Tọa độ ngách...) và gán persona phù hợp
- **Lịch trình AI theo đúng chất bạn** — AI tự build lịch trình hoàn chỉnh với địa điểm thật, địa chỉ cụ thể, sắp xếp theo thứ tự hợp lý, không backtrack
- **Lọc theo ngân sách** — tự động loại bỏ địa điểm không phù hợp túi tiền
- **Chia sẻ lịch trình** — tạo link ngắn chia sẻ với bạn đi cùng trong 1 tap
- **Bộ nhớ lâu dài** — ghi nhớ vibe profile và lịch sử rating qua các phiên để gợi ý ngày càng chuẩn hơn
- **Bỏ qua những nơi bạn không thích** — học từ feedback để không bao giờ gợi ý lại địa điểm bạn đã dislike

**Điểm đặc biệt:** Chạy hoàn toàn trên GreenNode AgentBase với LangChain + web search thật — không phải hallucinate địa điểm, không template cứng. Mỗi lịch trình được sinh ra từ đúng DNA du lịch của người dùng, kết hợp real-time search để đảm bảo địa điểm tồn tại và có địa chỉ xác minh được.

**Công nghệ:** GreenNode AgentBase · GreenNode MaaS · LangChain · FastAPI · React · SQLite · aiosqlite
