// server/src/services/sajuInterpret.service.ts (최종 완성본)

import {
  interpretDayGan,
  interpretDayMasterCharacter,
  interpretSipsinPresence,
  interpretSibiwunseong,
  interpretSinsal,
  interpretDayPillar,
  interpretCombinations,
  createLandscapePrompt,
} from "../logic/rule-engine";
import type { SajuData, InterpretationResult } from "../types/saju.d";

export const interpretSaju = (sajuData: SajuData): InterpretationResult => {
  // ✅ 3. 모든 로직은 최종 수정본과 동일하게 유지합니다.
  const dayGan = sajuData.pillars.day.gan;
  const dayMasterNature = interpretDayGan(dayGan);
  const dayMasterCharacter = interpretDayMasterCharacter(dayGan);
  const sibiwunseongAnalysis = interpretSibiwunseong(sajuData.sibiwunseong);
  const allStarData = interpretSinsal(sajuData.sinsal);
  const gilsinAnalysis = allStarData.filter((star) => star.type === "길신");
  const sinsalAnalysis = allStarData.filter((star) => star.type === "흉살");
  const dayPillarAnalysis = interpretDayPillar(sajuData);

  // --- 🕵️‍♂️ 디버깅 로그 #1 ---
  console.log("--- [1단계] 최종 관문 (sajuInterpret.service) ---");
  console.log(
    "생성된 전체 StarData 배열:",
    JSON.stringify(allStarData, null, 2)
  );
  console.log("필터링된 길신:", gilsinAnalysis);
  console.log("필터링된 흉살(살의):", sinsalAnalysis);
  // --------------------------

  const sipsinAnalysis = interpretSipsinPresence(sajuData.sipsin);
  const combinationAnalysis = interpretCombinations(sajuData);
  const hwaEuiPrompt = createLandscapePrompt(sajuData.napeum);

  const result: InterpretationResult = {
    dayMasterNature: dayMasterNature,
    dayMasterCharacter: dayMasterCharacter, // ✅ 최종 결과에 포함
    sipsinAnalysis: sipsinAnalysis,
    sibiwunseongAnalysis: sibiwunseongAnalysis,
    combinationAnalysis: combinationAnalysis,
    hwaEuiPrompt: hwaEuiPrompt,
    sinsalAnalysis: sinsalAnalysis,
    gilsinAnalysis: gilsinAnalysis,
    dayPillar: dayPillarAnalysis || undefined,
  };

  return result;
};
