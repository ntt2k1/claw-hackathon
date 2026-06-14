import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/gemini/smart-prompt", async (req, res) => {
    try {
      const { userInput, normalizedDNA, budget, buildRuleInstructionsText, tripMode, totalDays, location } = req.body;
      const budgetLabel = 
        budget < 500000 ? 'dưới 500.000 VNĐ tổng chuyến' :
        budget < 1000000 ? '500.000–1.000.000 VNĐ tổng chuyến' :
        budget < 2000000 ? '1–2 triệu VNĐ tổng chuyến' :
        budget < 5000000 ? '2–5 triệu VNĐ tổng chuyến' :
        budget < 10000000 ? '5–10 triệu VNĐ tổng chuyến' :
        'trên 10 triệu VNĐ tổng chuyến';

      const locText = location ? `\nNgười dùng đang ở: Phường ${location.ward || '...'}, Quận ${location.district || '...'}, ${location.province || '...'}.` : "";
      const modeText = tripMode === "single" 
        ? "Chỉ gợi ý địa điểm trong vòng 30km (đi trong ngày)." 
        : `Người dùng muốn đi xa > 100km (đi dài ngày ${totalDays} ngày).`;

      const prompt = `
Bạn là AI gợi ý địa điểm của SOLE — Soul Map for Gen Z Việt Nam.
Ngôn ngữ: tiếng Việt, tone Gen Z, thân thiện, không ủy mị, không sáo rỗng.
Từ khoá đặc trưng SOLE: "tần số", "tọa độ", "hợp rơ", "bộ gen du lịch" — dùng tự nhiên.

PROFILE NGƯỜI DÙNG (DNA đã chuẩn hoá 0–100):
${Object.entries(normalizedDNA).map(([k,v]) => `${k}: ${v}`).join(' | ')}${locText}
${modeText}

Tổng ngân sách cả chuyến: ${budgetLabel}. Phân bổ hợp lý cho ăn uống, di chuyển, chỗ ở (nếu dài ngày), vui chơi.
Không vượt tổng ngân sách này. Ưu tiên đề xuất địa điểm có mức giá phù hợp — tự tính ngược ra mức giá từng chỗ.

${buildRuleInstructionsText}

YÊU CẦU CỦA NGƯỜI DÙNG: "${userInput}"

${tripMode === "multiday" ? `
Người dùng lên kế hoạch chuyến đi ${totalDays} ngày. BẮT BUỘC trả về đầy đủ ${totalDays} ngày.
User is planning a ${totalDays}-day trip. You MUST return a full itinerary covering exactly ${totalDays} days. Structure your response with Day 1, Day 2... Day ${totalDays} clearly separated. Each day must have: morning activity, lunch spot, afternoon activity, dinner spot, and accommodation recommendation if budget allows. Total cost across all days must not exceed ${budgetLabel}. Distance from current location must be over 100km.

Trả về JSON (không markdown):
{
  "tripMode": "multiday",
  "totalDays": ${totalDays},
  "destination": "Thành phố được gợi ý (xa > 100km)",
  "days": [
    {
      "day": 1,
      "title": "Tên ngày",
      "places": [
        {
          "name": "Tên địa điểm", "address": "Địa chỉ", "district": "Quận/Huyện", "city": "Thành phố", "matchScore": 95,
          "whyMatch": "1 câu Gen Z", "tags": ["#tag1", "#tag2"], "category": "morning activity | lunch spot | afternoon activity | dinner spot", "priceRange": "$ | $$ | $$$",
          "estimatedStay": "45 phút", "openNow": true, "dnaMatch": { "TrụcCao1": 90, "TrụcCao2": 80 }
        }
      ],
      "accommodation": { "name": "Tên khách sạn", "pricePerNight": 350000 }
    }
    // LƯU Ý: NẾU totalDays > 1, BẠN PHẢI SINH THÊM MẢNG CHO NGÀY 2, 3, 4 TƯƠNG TỰ ĐẾN KHI ĐỦ SỐ NGÀY.
  ],
  "totalEstimatedCost": 1850000,
  "budgetBreakdown": { "food": 600000, "transport": 400000, "accommodation": 700000, "activities": 150000 },
  "aiVibe": "1 câu vibe"
}
` : `
Trả về JSON đúng format sau (không markdown):
{
  "tripMode": "single",
  "places": [
    {
      "name": "Tên địa điểm", "address": "Địa chỉ", "district": "Quận/Huyện", "city": "Thành phố", "matchScore": 95,
      "whyMatch": "1 câu Gen Z giải thích", "tags": ["#tag1", "#tag2"], "category": "Cafe | Ăn uống | Giải trí", "priceRange": "$ | $$ | $$$",
      "estimatedStay": "45 phút", "openNow": true, "dnaMatch": { "TrụcCao1": 90, "TrụcCao2": 80 }
    }
  ],
  "routeNote": "Gợi ý tuyến đường",
  "aiVibe": "1 câu vibe"
}
`}
`;

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro-latest", 
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json"
        }
      });
      
      const rawText = response.text || "{}";
      const cleanedText = rawText.replace(/```(json)?\n?/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(cleanedText));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/persona", async (req, res) => {
    try {
      const { normalizedDNA, personaName, top3 } = req.body;
      const prompt = `
Bạn là copywriter của SOLE — bản đồ tần số Gen Z Việt Nam.
Tone: khách quan, sắc bén, không ủy mị. Gen Z Việt Nam.
KHÔNG dùng: "hành trình", "trải nghiệm tuyệt vời", "khám phá bản thân", "đam mê".
DÙNG: "tần số", "tọa độ", "hợp rơ", "bộ gen", "quét".

Persona: "${personaName}"
Top 3 DNA: ${top3}
Full DNA: ${Object.entries(normalizedDNA).map(([k,v]) => `${k}(${v})`).join(', ')}

Viết mô tả đúng 2 câu về người có persona này.
Câu 1: Họ là ai trong thế giới địa điểm & ẩm thực.
Câu 2: SOLE sẽ giúp họ như thế nào.

Trả về JSON (không markdown):
{
  "description": "2 câu mô tả",
  "superpower": "Siêu năng lực du lịch — 4–6 chữ tiếng Việt"
}
`;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro-latest",
        contents: prompt,
        config: {
            temperature: 0.8,
            responseMimeType: "application/json"
        }
      });
      
      const pRawText = response.text || "{}";
      const pCleanedText = pRawText.replace(/```(json)?\n?/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(pCleanedText));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
