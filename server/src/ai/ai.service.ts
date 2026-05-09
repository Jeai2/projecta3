// server/src/ai/ai.service.ts
// Google Gemini AI 서비스를 호출하는 실제 로직

import { GoogleGenerativeAI } from "@google/generative-ai";

// AI가 생성한 결과물의 타입을 정의합니다.
export interface AiGeneratedOutput {
  refinedText: string; // AI가 다듬어준 새로운 해석 텍스트
  imageUrl: string; // AI가 생성(했다고 가정한) 이미지의 URL
}

/**
 * 텍스트 프롬프트를 받아 Gemini 텍스트 생성 API를 호출하고,
 * 다듬어진 텍스트와 예시 이미지 URL을 반환합니다.
 * @param prompt '풍경 묘사 프롬프트' 텍스트
 * @returns { refinedText, imageUrl } 객체
 */
export const getAiGeneratedResponse = async (
  prompt: string,
): Promise<AiGeneratedOutput | null> => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("Gemini API Key is not configured in .env file.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // AI에게 전달할 최종 지시문
    const finalPrompt = `You are a wise and warm storyteller. Based on the following landscape description, write a single, beautiful, and metaphorical paragraph about the person's inner world and potential. Do not mention the landscape itself, but use its mood and elements as metaphors. Respond in Korean. \n\n Landscape Description: "${prompt}"`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const refinedText = response.text();

    // 이미지 생성은 나중에 실제 API로 교체할 수 있도록 예시 URL을 사용합니다.
    const placeholderImageUrl =
      "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_flash_card.width-1300.jpg";

    return {
      refinedText: refinedText,
      imageUrl: placeholderImageUrl,
    };
  } catch (error) {
    console.error("Error generating response from AI:", error);
    return null;
  }
};

/**
 * 묵설 전용 AI 호출.
 * 시스템 프롬프트를 그대로 전달하고, 텍스트만 반환한다.
 * 기존 getAiGeneratedResponse와 달리 풍경 묘사 래핑 없음.
 */
export const getMookAChatResponse = async (
  systemPrompt: string,
  userMessage: string,
): Promise<string | null> => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("[MookA] GEMINI_API_KEY가 .env에 설정되지 않았습니다.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[MookA] AI 응답 생성 실패:", error);
    return null;
  }
};
