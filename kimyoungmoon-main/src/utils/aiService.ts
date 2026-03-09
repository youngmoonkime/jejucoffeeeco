import { GoogleGenerativeAI } from "@google/generative-ai";
import distilledHistory from "../data/distilled_history_2025.json";

// API 키는 환경 변수나 사용자 입력을 통해 관리해야 함
const API_KEY = "AkcdBoKyK3L38po4smn4rKKYoQ6vXUDUyLvbkvg2"; // 사용자가 제공한 키

const genAI = new GoogleGenerativeAI(API_KEY);

export const getAIInsights = async (storeName: string) => {
  if (!API_KEY) return "Gemini API 키가 설정되지 않았습니다.";

  const storeData = (distilledHistory as any)[storeName];
  if (!storeData) return "해당 매장의 2025년 기록이 없습니다.";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = `
    매장명: ${storeName}
    2025년 월별 수거량: ${JSON.stringify(storeData.monthlyTotals)}
    2025년 메모 기록: ${JSON.stringify(storeData.memos)}
  `;

  const prompt = `
    당신은 제주도 커피박 수거 전문가 AI입니다. 
    제시된 2025년 데이터를 바탕으로 다음 내용을 분석해주세요:
    1. 수거량 추이 및 특징
    2. 메모에 기록된 이슈나 특이사항 분석
    3. 2026년 효율적인 수거를 위한 제언 (날씨나 시즌 고려)

    한국어로 정중하고 전문적인 어조로 답변해주세요.
    마크다운 형식을 사용해 가독성 있게 작성해주세요.

    데이터:
    ${context}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다.";
  }
};
