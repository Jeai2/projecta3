// server/src/services/wangse-strength.service.ts
// 왕쇠강약 계산 전용 서비스

import { getSipsinWithScores } from "./sipsin.service";
import { WANGSE_WEIGHTS, YANGGAN_LIST } from "../data/saju.data";

// 왕쇠강약 결과 인터페이스
export interface WangseResult {
  ganType: "양간" | "음간";
  rawScore: number; // Raw 총점 (4로 나누기 전)
  finalScore: number; // 최종 점수 (0-10)
  level: string; // "극왕", "왕", "중", "쇠", "극쇠" 등
  levelDetail: string; // "극왕", "태왕", "왕", "중화(왕)" 등
  deukryeongGan?: string; // 득령한 천간 (지장간 중)
  breakdown: {
    pillarScores: PillarScore[]; // 각 기둥별 점수
    bonuses: number; // 월령 보너스
    penalties: number; // 패널티
    weightedTotal: number; // 가중치 적용 총점
    baseScore: number; // 기본 점수 (÷4 후)
    ganyjidongBonus: number; // 간여지동 보너스
    ohaengCounts?: Record<string, number>; // 오행 카운트
    sameOhaengCount?: number; // 일간과 같은 오행 개수
    supportOhaengCount?: number; // 일간을 생해주는 오행 개수
  };
  analysis: string; // 분석 설명
}

// 기둥별 점수 상세
export interface PillarScore {
  pillar: string; // "년간", "년지", "월간", "월지", "일지", "시간", "시지"
  sipsinName: string | null; // 십성 이름
  baseScore: number; // 기본 십성 점수
  weight: number; // 가중치
  weightedScore: number; // 가중치 적용 점수
}

// 월령 득령 확인 (간단한 버전 - 나중에 확장 가능)
const SEASONAL_SUPPORT: Record<string, string[]> = {
  春: ["甲", "乙"], // 봄: 목 왕성
  夏: ["丙", "丁"], // 여름: 화 왕성
  秋: ["庚", "辛"], // 가을: 금 왕성
  冬: ["壬", "癸"], // 겨울: 수 왕성
};

/**
 * 현재 월에 해당하는 계절을 반환
 */
function getCurrentSeason(month: number): string {
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

/**
 * 월령 보너스 계산
 */
function getSeasonalBonus(dayGan: string, month: number): number {
  const season = getCurrentSeason(month);
  const supportedGans = SEASONAL_SUPPORT[season];
  return supportedGans.includes(dayGan) ? 5 : 0;
}

/**
 * 오행 매핑 (간여지동 확인용)
 */
const GAN_TO_OHAENG: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const JI_TO_OHAENG: Record<string, string> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水",
};

/**
 * 버전1: 새로운 왕쇠강약 계산을 위한 유틸리티 함수들
 */

/**
 * 오행 생극 관계 확인
 */
const OHAENG_SUPPORT: Record<string, string[]> = {
  木: ["木", "水"], // 목은 목과 수(수생목)의 도움을 받음
  火: ["火", "木"], // 화는 화와 목(목생화)의 도움을 받음
  土: ["土", "火"], // 토는 토와 화(화생토)의 도움을 받음
  金: ["金", "土"], // 금은 금과 토(토생금)의 도움을 받음
  水: ["水", "金"], // 수는 수와 금(금생수)의 도움을 받음
};

/**
 * 일간을 도와주는 오행인지 확인
 */
function isSupportingOhaeng(
  dayGanOhaeng: string,
  targetOhaeng: string
): boolean {
  return OHAENG_SUPPORT[dayGanOhaeng]?.includes(targetOhaeng) || false;
}

/**
 * 패널티 계산 (현재는 세력만 고려하여 패널티 없음)
 */
function calculatePenalties(): number {
  // 순수 세력만 고려하므로 패널티 없음
  return 0;
}

/**
 * 8단계 레벨 분류 - 주석처리 (새 테이블로 교체 예정)
 * 삭제 금지: 사용자 승인 필요
 */
/*
function classifyWangseLevel(
  score: number,
  isYanggan: boolean
): { level: string; levelDetail: string } {
  const yangganLevels = [
    { level: "극쇠", detail: "극쇠" }, // 0.0-1.25
    { level: "쇠", detail: "태쇠" }, // 1.25-2.5
    { level: "쇠", detail: "쇠" }, // 2.5-3.75
    { level: "중", detail: "중화(쇠)" }, // 3.75-5.0
    { level: "중", detail: "중화(왕)" }, // 5.0-6.25
    { level: "왕", detail: "왕" }, // 6.25-7.5
    { level: "왕", detail: "태왕" }, // 7.5-8.75
    { level: "극왕", detail: "극왕" }, // 8.75-10.0
  ];

  const eumganLevels = [
    { level: "신약", detail: "극약" }, // 0.0-1.25
    { level: "약", detail: "신약" }, // 1.25-2.5
    { level: "약", detail: "약" }, // 2.5-3.75
    { level: "중", detail: "중화(약)" }, // 3.75-5.0
    { level: "중", detail: "중화(강)" }, // 5.0-6.25
    { level: "강", detail: "강" }, // 6.25-7.5
    { level: "강", detail: "신강" }, // 7.5-8.75
    { level: "신강", detail: "극강" }, // 8.75-10.0
  ];

  const levels = isYanggan ? yangganLevels : eumganLevels;
  const index = Math.min(7, Math.max(0, Math.floor(score * 0.8)));

  return { level: levels[index].level, levelDetail: levels[index].detail };
}
*/

/**
 * 버전1: 신강신약 7단계 레벨 분류 (자평진전 기반)
 * 양간/음간 구분 없이 통합된 신강신약 체계
 */
function classifyNewWangseLevel(score: number): {
  level: string;
  levelDetail: string;
} {
  if (score < 0) {
    return { level: "극약", levelDetail: "극약" };
  } else if (score >= 0 && score < 7) {
    return { level: "태약", levelDetail: "태약" };
  } else if (score >= 7 && score < 14) {
    return { level: "신약", levelDetail: "신약" };
  } else if (score >= 14 && score < 21) {
    return { level: "중화", levelDetail: "중화" };
  } else if (score >= 21 && score < 28) {
    return { level: "신강", levelDetail: "신강" };
  } else if (score >= 28 && score <= 35) {
    return { level: "태강", levelDetail: "태강" };
  } else {
    return { level: "극왕", levelDetail: "극왕" };
  }
}

/**
 * 새로운 오행 기반 단순 계산 함수들
 */

// 득령 계산 (월지 오행 기준)
function calculateSimpleDeukryeong(
  dayGanOhaeng: string,
  monthJiOhaeng: string
): number {
  if (dayGanOhaeng === monthJiOhaeng) {
    return 10; // 일간과 같은 오행
  }
  if (isSupportingOhaeng(dayGanOhaeng, monthJiOhaeng)) {
    return 8; // 일간을 도와주는 오행
  }
  return 0; // 해치는 오행이나 나머지 (음수 방지)
}

// 득지 계산 (일지 오행 기준)
function calculateSimpleDeukji(
  dayGanOhaeng: string,
  dayJiOhaeng: string
): number {
  if (dayGanOhaeng === dayJiOhaeng) {
    return 8; // 일간과 같은 오행
  }
  if (isSupportingOhaeng(dayGanOhaeng, dayJiOhaeng)) {
    return 6; // 일간을 도와주는 오행
  }
  return 0; // 해치는 오행이나 나머지 (음수 방지)
}

// 득세 계산 (나머지 오행들)
function calculateSimpleDeukse(
  dayGanOhaeng: string,
  pillars: { year: string; month: string; day: string; hour: string }
): number {
  let totalScore = 0;

  // 천간 (년간, 월간, 시간) - 각 2-3점
  const gans = [pillars.year[0], pillars.month[0], pillars.hour[0]];
  for (const gan of gans) {
    const ganOhaeng = GAN_TO_OHAENG[gan];
    if (dayGanOhaeng === ganOhaeng) {
      totalScore += 3; // 같은 오행
    } else if (isSupportingOhaeng(dayGanOhaeng, ganOhaeng)) {
      totalScore += 2; // 도움 오행
    }
    // 해치는 오행은 0점 (음수 방지)
  }

  // 지지 (년지, 시지) - 각 3-4점
  const jis = [pillars.year[1], pillars.hour[1]];
  for (const ji of jis) {
    const jiOhaeng = JI_TO_OHAENG[ji];
    if (dayGanOhaeng === jiOhaeng) {
      totalScore += 4; // 같은 오행
    } else if (isSupportingOhaeng(dayGanOhaeng, jiOhaeng)) {
      totalScore += 3; // 도움 오행
    }
    // 해치는 오행은 0점 (음수 방지)
  }

  return totalScore;
}

// 간여지동 보너스 계산
function calculateSimpleGanyjidongBonus(
  dayGanOhaeng: string,
  pillars: { year: string; month: string; day: string; hour: string }
): number {
  let bonus = 0;

  const pillarPositions = [
    { gan: pillars.year[0], ji: pillars.year[1] },
    { gan: pillars.month[0], ji: pillars.month[1] },
    { gan: pillars.day[0], ji: pillars.day[1] },
    { gan: pillars.hour[0], ji: pillars.hour[1] },
  ];

  for (const pillar of pillarPositions) {
    const ganOhaeng = GAN_TO_OHAENG[pillar.gan];
    const jiOhaeng = JI_TO_OHAENG[pillar.ji];

    // 간여지동 확인: 천간과 지지가 같은 오행
    if (ganOhaeng === jiOhaeng) {
      if (
        dayGanOhaeng === ganOhaeng ||
        isSupportingOhaeng(dayGanOhaeng, ganOhaeng)
      ) {
        bonus += 5; // 도움되는 간여지동
      }
    }
  }

  return bonus;
}

// 지지합 보너스 계산 (간소화)
function calculateSimpleJijiHapBonus(): number {
  // 간소화: 지지합 계산 생략 (복잡성 제거)
  return 0;
}

// 삭감 계산 (간소화)
function calculateSimplePenalties(): number {
  // 간소화: 충형해파 삭감 생략 (복잡성 제거)
  return 0;
}

function calculateOhaengRelationCounts(
  dayGanOhaeng: string,
  pillars: { year: string; month: string; day: string; hour: string }
): {
  ohaengCounts: Record<string, number>;
  sameOhaengCount: number;
  supportOhaengCount: number;
} {
  const ohaengCounts: Record<string, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };
  let sameOhaengCount = 0;
  let supportOhaengCount = 0;

  const pillarPositions = [
    { gan: pillars.year[0], ji: pillars.year[1] },
    { gan: pillars.month[0], ji: pillars.month[1] },
    { gan: pillars.day[0], ji: pillars.day[1] },
    { gan: pillars.hour[0], ji: pillars.hour[1] },
  ];

  for (const pillar of pillarPositions) {
    const ganOhaeng = GAN_TO_OHAENG[pillar.gan];
    const jiOhaeng = JI_TO_OHAENG[pillar.ji];

    if (ganOhaeng) {
      ohaengCounts[ganOhaeng]++;
      if (ganOhaeng === dayGanOhaeng) sameOhaengCount++;
      else if (isSupportingOhaeng(dayGanOhaeng, ganOhaeng))
        supportOhaengCount++;
    }

    if (jiOhaeng) {
      ohaengCounts[jiOhaeng]++;
      if (jiOhaeng === dayGanOhaeng) sameOhaengCount++;
      else if (isSupportingOhaeng(dayGanOhaeng, jiOhaeng)) supportOhaengCount++;
    }
  }

  return { ohaengCounts, sameOhaengCount, supportOhaengCount };
}

/**
 * 버전2: 새로운 오행 기반 신강신약 계산 함수
 */
export function calculateNewWangseStrength(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string
): WangseResult {
  // 0. 양간/음간 판별 (UI 호환성을 위해 유지)
  const isYanggan = YANGGAN_LIST.includes(dayGan);
  const ganType: "양간" | "음간" = isYanggan ? "양간" : "음간";

  console.log("🔍 [왕쇠강약 v2] pillars:", pillars);
  console.log("🔍 [왕쇠강약 v2] dayGan:", dayGan);

  // 1. 오행 매핑
  const dayGanOhaeng = GAN_TO_OHAENG[dayGan];
  const monthJiOhaeng = JI_TO_OHAENG[pillars.month[1]];
  const dayJiOhaeng = JI_TO_OHAENG[pillars.day[1]];

  // 2. 득령 (월지 오행 기준)
  const deukryeong = calculateSimpleDeukryeong(dayGanOhaeng, monthJiOhaeng);

  // 3. 득지 (일지 오행 기준)
  const deukji = calculateSimpleDeukji(dayGanOhaeng, dayJiOhaeng);

  // 4. 득세 (나머지 오행들)
  const deukse = calculateSimpleDeukse(dayGanOhaeng, pillars);

  // 5. 보너스 계산
  const ganyjidongBonus = calculateSimpleGanyjidongBonus(dayGanOhaeng, pillars);
  const jijiHapBonus = calculateSimpleJijiHapBonus();
  const ohaengRelationCounts = calculateOhaengRelationCounts(
    dayGanOhaeng,
    pillars
  );

  // 6. 삭감 계산
  const penalties = calculateSimplePenalties();

  // 7. 최종 점수 계산
  const baseScore = deukryeong + deukji + deukse;
  const totalBonus = ganyjidongBonus + jijiHapBonus;
  const finalScore = Math.max(0, baseScore + totalBonus - penalties);

  console.log(
    "🔍 [왕쇠강약 v2] 득령:",
    deukryeong,
    "득지:",
    deukji,
    "득세:",
    deukse
  );
  console.log(
    "🔍 [왕쇠강약 v2] 보너스:",
    totalBonus,
    "삭감:",
    penalties,
    "최종:",
    finalScore
  );

  // 8. 레벨 분류
  const { level, levelDetail } = classifyNewWangseLevel(finalScore);

  // 9. 결과 반환
  return {
    ganType,
    rawScore: baseScore + totalBonus,
    finalScore,
    level,
    levelDetail,
    deukryeongGan: undefined, // 간소화
    breakdown: {
      pillarScores: [],
      bonuses: totalBonus,
      penalties: penalties,
      weightedTotal: baseScore,
      baseScore: baseScore,
      ganyjidongBonus: ganyjidongBonus,
      ohaengCounts: ohaengRelationCounts.ohaengCounts,
      sameOhaengCount: ohaengRelationCounts.sameOhaengCount,
      supportOhaengCount: ohaengRelationCounts.supportOhaengCount,
    },
    analysis: `신강신약 ${level} (${finalScore.toFixed(1)}점)`,
  };
}

/**
 * 왕쇠강약 메인 계산 함수 (기존 버전 - 호환성 유지)
 */
export function calculateWangseStrength(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string,
  birthMonth: number
): WangseResult {
  // 1. 양간/음간 판별
  const isYanggan = YANGGAN_LIST.includes(dayGan);
  const ganType: "양간" | "음간" = isYanggan ? "양간" : "음간";

  // 2. 가중치 선택
  const weights = isYanggan ? WANGSE_WEIGHTS.YANGGAN : WANGSE_WEIGHTS.EUMGAN;

  // 3. 십성과 점수 계산
  const sipsinScores = getSipsinWithScores(dayGan, pillars);

  // 4. 기둥별 점수 계산
  const pillarScores: PillarScore[] = [
    {
      pillar: "년간",
      sipsinName: sipsinScores.year.gan.name,
      baseScore: sipsinScores.year.gan.score,
      weight: weights.yearGan,
      weightedScore: sipsinScores.year.gan.score * weights.yearGan,
    },
    {
      pillar: "년지",
      sipsinName: sipsinScores.year.ji.name,
      baseScore: sipsinScores.year.ji.score,
      weight: weights.yearJi,
      weightedScore: sipsinScores.year.ji.score * weights.yearJi,
    },
    {
      pillar: "월간",
      sipsinName: sipsinScores.month.gan.name,
      baseScore: sipsinScores.month.gan.score,
      weight: weights.monthGan,
      weightedScore: sipsinScores.month.gan.score * weights.monthGan,
    },
    {
      pillar: "월지",
      sipsinName: sipsinScores.month.ji.name,
      baseScore: sipsinScores.month.ji.score,
      weight: weights.monthJi,
      weightedScore: sipsinScores.month.ji.score * weights.monthJi,
    },
    {
      pillar: "일지",
      sipsinName: sipsinScores.day.ji.name,
      baseScore: sipsinScores.day.ji.score,
      weight: weights.dayJi,
      weightedScore: sipsinScores.day.ji.score * weights.dayJi,
    },
    {
      pillar: "시간",
      sipsinName: sipsinScores.hour.gan.name,
      baseScore: sipsinScores.hour.gan.score,
      weight: weights.hourGan,
      weightedScore: sipsinScores.hour.gan.score * weights.hourGan,
    },
    {
      pillar: "시지",
      sipsinName: sipsinScores.hour.ji.name,
      baseScore: sipsinScores.hour.ji.score,
      weight: weights.hourJi,
      weightedScore: sipsinScores.hour.ji.score * weights.hourJi,
    },
  ];

  // 5. 가중치 적용 총점
  const weightedTotal = pillarScores.reduce(
    (sum, p) => sum + p.weightedScore,
    0
  );

  // 6. 월령 보너스
  const bonuses = getSeasonalBonus(dayGan, birthMonth);

  // 7. 패널티
  const penalties = calculatePenalties();

  // 8. 기본 점수 계산 (가중치 총점 + 월령 보너스) ÷ 4
  const baseScore = Math.max(
    0,
    Math.min(10, (weightedTotal + bonuses + penalties) / 4)
  );

  // 9. 최종 점수 (간여지동 보너스 제거)
  const finalScore = baseScore;

  // 11. 레벨 분류 - 새로운 신강신약 체계 적용
  const { level, levelDetail } = classifyNewWangseLevel(finalScore);

  // 12. 분석 설명 생성
  const analysis = generateAnalysis(
    ganType,
    level,
    levelDetail,
    finalScore,
    bonuses,
    0 // ganyjidongBonus 제거
  );

  return {
    ganType,
    rawScore: weightedTotal + bonuses + penalties, // Raw 점수 (4로 나누기 전)
    finalScore,
    level,
    levelDetail,
    breakdown: {
      pillarScores,
      bonuses,
      penalties,
      weightedTotal,
      baseScore, // 기본 점수 추가
      ganyjidongBonus: 0, // 간여지동 보너스 제거
    },
    analysis,
  };
}

/**
 * 분석 설명 생성
 */
function generateAnalysis(
  ganType: "양간" | "음간",
  level: string,
  levelDetail: string,
  finalScore: number,
  bonuses: number,
  ganyjidongBonus: number
): string {
  let analysis = `${ganType} 일간의 `;

  if (ganType === "양간") {
    analysis += `왕쇠 상태는 "${levelDetail}"입니다. `;
    if (level === "극왕" || level === "왕") {
      analysis += "매우 강한 상태로 기운이 넘치지만 과도할 수 있습니다.";
    } else if (level === "중") {
      analysis += "균형 잡힌 상태로 안정적인 기운을 보입니다.";
    } else {
      analysis += "약한 상태로 도움과 지원이 필요합니다.";
    }
  } else {
    analysis += `강약 상태는 "${levelDetail}"입니다. `;
    if (level === "신강" || level === "강") {
      analysis += "매우 강한 상태로 자립심과 추진력이 뛰어납니다.";
    } else if (level === "중") {
      analysis += "균형 잡힌 상태로 조화로운 기운을 보입니다.";
    } else {
      analysis += "약한 상태로 인성의 도움이나 비겁의 지원이 필요합니다.";
    }
  }

  if (bonuses > 0) {
    analysis += ` 현재 계절의 도움을 받고 있습니다(+${bonuses}).`;
  }

  if (ganyjidongBonus > 0) {
    analysis += ` 간여지동으로 인한 추가 도움이 있습니다(+${ganyjidongBonus.toFixed(
      1
    )}).`;
  } else if (ganyjidongBonus < 0) {
    analysis += ` 간여지동으로 인한 약화 요소가 있습니다(${ganyjidongBonus.toFixed(
      1
    )}).`;
  }

  analysis += ` (점수: ${finalScore.toFixed(2)}/10)`;

  return analysis;
}
