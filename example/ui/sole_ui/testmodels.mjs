import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI();
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: 'hello',
    });
    console.log("gemini-1.5-pro ok");
  } catch(e) {
    console.error("gemini-1.5-pro failed", e.message);
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro-latest',
      contents: 'hello',
    });
    console.log("gemini-1.5-pro-latest ok");
  } catch(e) {
    console.error("gemini-1.5-pro-latest failed", e.message);
  }
}
run();
