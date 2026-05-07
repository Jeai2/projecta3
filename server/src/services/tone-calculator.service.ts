// server/src/services/tone-calculator.service.ts
// 종합 점수 계산으로 tone 결정 시스템

import { CompatibilityResult } from "./compatibility.service";
import { calculateTimeEnergyScore } from "./time-energy.service";
import type { IljinData } from "../types/today-fortune";

// 톤 결정 결과 인터페이스
export interface ToneCalculationResult {
  finalTone: "positive" | "neutral" | "negative";
  totalScore: number; // 최종 종합 점수 (-100 ~ +100)
  breakdown: {
    compatibilityScore: number; // 상성 점수 (-50 ~ +65)
    timeEnergyScore: number; // 시간 에너지 점수 (-30 ~ +30)
    hexagramBonus: number; // 주역 보너스 (-15 ~ +15)
  };
  confidence: number; // 신뢰도 (0-100%)
  analysis: {
    summary: string; // 종합 분석
    strengths: string[]; // 강점 요소
    weaknesses: string[]; // 약점 요소
    recommendations: string[]; // 추천사항
  };
}

// 주역 괘별 길흉성 (임시 데이터 - 나중에 확장 가능)
const HEXAGRAM_AUSPICIOUSNESS: Record<string, number> = {
  "111111": 10, // 乾為天 - 매우 길함
  "111011": 8, // 천택리 - 길함
  "111101": 6, // 천화동인 - 약간 길함
  "111001": -2, // 천뢰무망 - 약간 흉함
  "111110": 4, // 천풍구 - 중립적
  "111010": -5, // 천수송 - 흉함
  "111100": 5, // 천산돈 - 약간 길함
  "111000": -8, // 천지비 - 흉함
  "000000": -10, // 곤위지 - 매우 흉함
  // 나머지 괘들도 필요시 추가
};

// 시간대별 길흉성 보정
const TIME_AUSPICIOUSNESS: Record<string, number> = {
  새벽: 3, // 새로운 시작의 기운
  오전: 8, // 가장 길한 시간
  오후: 5, // 안정적
  저녁: 2, // 온화함
  밤: -2, // 수렴, 조심스러움
};

/**
 * 종합 점수를 계산하여 최종 tone을 결정합니다
 */
export function calculateFinalTone(
  compatibility: CompatibilityResult,
  currentTime: Date,
  userDayGan: string,
  hexagramKey?: string
): ToneCalculationResult {
  // 1. 시간 에너지 점수 계산
  const timeEnergyResult = calculateTimeEnergyScore(currentTime, userDayGan);

  // 2. 각 구성 요소 점수
  const compatibilityScore = compatibility.totalScore; // -50 ~ +65
  const timeEnergyScore = timeEnergyResult.totalScore; // -30 ~ +30

  // 3. 주역 보너스 계산
  let hexagramBonus = 0;
  if (hexagramKey && HEXAGRAM_AUSPICIOUSNESS[hexagramKey] !== undefined) {
    hexagramBonus = HEXAGRAM_AUSPICIOUSNESS[hexagramKey];
  }

  // 4. 시간대 보너스
  const timeBonus =
    TIME_AUSPICIOUSNESS[timeEnergyResult.timeEnergy.period] || 0;
  hexagramBonus += Math.round(timeBonus * 0.3); // 시간대 보너스는 30% 반영

  // 5. 최종 점수 계산 (가중 평균)
  const totalScore = Math.round(
    compatibilityScore * 0.5 + // 상성 50%
      timeEnergyScore * 0.3 + // 시간 에너지 30%
      hexagramBonus * 0.2 // 주역 20%
  );

  // 6. 톤 결정
  let finalTone: "positive" | "neutral" | "negative";
  if (totalScore >= 20) finalTone = "positive";
  else if (totalScore >= -10) finalTone = "neutral";
  else finalTone = "negative";

  // 7. 신뢰도 계산 (점수의 절댓값이 클수록 신뢰도 높음)
  const confidence = Math.min(100, Math.abs(totalScore) * 2 + 50);

  // 8. 분석 데이터 생성
  const analysis = generateAnalysis(
    finalTone,
    compatibility,
    timeEnergyResult,
    hexagramBonus,
    totalScore
  );

  return {
    finalTone,
    totalScore,
    breakdown: {
      compatibilityScore,
      timeEnergyScore,
      hexagramBonus,
    },
    confidence,
    analysis,
  };
}

/**
 * 상세 분석을 생성합니다
 */
function generateAnalysis(
  tone: "positive" | "neutral" | "negative",
  compatibility: CompatibilityResult,
  timeEnergyResult: ReturnType<typeof calculateTimeEnergyScore>,
  hexagramBonus: number,
  totalScore: number
): ToneCalculationResult["analysis"] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // 상성 분석
  if (compatibility.totalScore > 15) {
    strengths.push(
      `사주와 일진의 상성이 매우 좋습니다 (${compatibility.totalScore}점)`
    );
    if (compatibility.analysis.specialHarmony.length > 0) {
      strengths.push(
        `${compatibility.analysis.specialHarmony.join(
          ", "
        )} 관계로 특별한 길운이 있습니다`
      );
    }
  } else if (compatibility.totalScore < -10) {
    weaknesses.push(
      `사주와 일진의 상성이 좋지 않습니다 (${compatibility.totalScore}점)`
    );
    recommendations.push("신중한 판단과 차분한 행동이 필요합니다");
  }

  // 시간 에너지 분석
  const timeCompatibility = timeEnergyResult.compatibility;
  if (timeCompatibility.harmonyScore > 10) {
    strengths.push(`현재 시간의 에너지가 당신과 잘 맞습니다`);
    recommendations.push(...timeCompatibility.recommendations);
  } else if (timeCompatibility.harmonyScore < -5) {
    weaknesses.push(`현재 시간의 에너지가 당신과 맞지 않습니다`);
    recommendations.push(...timeCompatibility.warnings);
  }

  // 주역 분석
  if (hexagramBonus > 5) {
    strengths.push("주역의 기운이 길하게 작용하고 있습니다");
  } else if (hexagramBonus < -5) {
    weaknesses.push("주역의 기운이 조심스럽게 작용하고 있습니다");
    recommendations.push("무리한 행동보다는 신중함을 택하세요");
  }

  // 대운 분석
  if (compatibility.daewoonSupport > 0) {
    strengths.push(compatibility.analysis.daewoonEffect);
  } else if (compatibility.daewoonSupport < 0) {
    weaknesses.push(compatibility.analysis.daewoonEffect);
  }

  // 기본 추천사항 추가
  if (tone === "positive") {
    recommendations.push("이 좋은 기운을 놓치지 말고 적극적으로 행동하세요");
    recommendations.push(
      "새로운 도전이나 중요한 결정을 내리기에 좋은 시기입니다"
    );
  } else if (tone === "negative") {
    recommendations.push("조심스럽게 행동하되 너무 위축되지는 마세요");
    recommendations.push(
      "현재 상황을 정리하고 다음 기회를 준비하는 시간으로 활용하세요"
    );
  } else {
    recommendations.push("평상심을 유지하며 꾸준히 노력하세요");
    recommendations.push(
      "급하지 않은 일들을 차근차근 처리하기 좋은 시기입니다"
    );
  }

  // 종합 분석 요약
  let summary = "";
  if (tone === "positive") {
    summary = `전체적으로 길한 운세입니다 (${totalScore}점). `;
    summary +=
      "여러 요소들이 조화롭게 작용하여 좋은 결과를 기대할 수 있습니다.";
  } else if (tone === "negative") {
    summary = `전체적으로 조심스러운 운세입니다 (${totalScore}점). `;
    summary += "신중한 접근과 차분한 대응이 필요한 시기입니다.";
  } else {
    summary = `전체적으로 평온한 운세입니다 (${totalScore}점). `;
    summary += "특별한 변화보다는 안정적인 일상을 유지하는 것이 좋겠습니다.";
  }

  return {
    summary,
    strengths,
    weaknesses,
    recommendations,
  };
}

/**
 * 톤에 따른 주역 해석 선택
 */
export function selectHexagramInterpretation(
  hexagramKey: string,
  tone: "positive" | "neutral" | "negative"
): {
  selectedTone: "positive" | "neutral" | "negative";
  reason: string;
} {
  // 실제로는 hexagrams.ts에서 해당 톤의 해석을 선택
  return {
    selectedTone: tone,
    reason: `종합 분석 결과 ${tone} 톤이 적절합니다`,
  };
}
