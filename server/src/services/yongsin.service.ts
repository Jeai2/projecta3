// server/src/services/yongsin.service.ts
// 용신 분석 메인 서비스

import {
  YongsinResult,
  TierAnalysis,
  EOKBU_CRITERIA,
  JOHU_DAY_MONTH_YONGSIN_MAP,
  SIPSIN_CATEGORY_MAP,
  DAYGAN_SIPSIN_TO_OHAENG,
  OHAENG_TO_GAN,
  GAN_TO_OHAENG,
  JEONG_SIPSIN_LIST,
  EOKBU_STRONG_CONDITIONS,
  EOKBU_WEAK_CONDITIONS,
  EOKBU_NEUTRAL_CONDITIONS,
  JIJANGGAN_JUNGGI_TO_GAN,
} from "../data/yongsin.data";
import { SIPSIN_TABLE } from "../data/saju.data";
import { JIJANGGAN_DATA } from "../data/jijanggan";
import type { SajuData } from "../types/saju.d";

// =================================================================
// 십신 카운트 관련 함수들
// =================================================================

/**
 * 사주 원국에서 십신 카테고리별 개수를 계산합니다
 * @param sajuData 사주 데이터
 * @returns 십신 카테고리별 개수
 */
function countSipsinCategories(sajuData: SajuData): Record<string, number> {
  const counts: Record<string, number> = {
    비겁: 0,
    식상: 0,
    재성: 0,
    관성: 0,
    인성: 0,
  };

  // 각 기둥의 천간/지지 십신을 카운트
  const pillars = sajuData.pillars;
  const sipsinPositions = [
    pillars.year.ganSipsin,
    pillars.year.jiSipsin,
    pillars.month.ganSipsin,
    pillars.month.jiSipsin,
    pillars.day.jiSipsin, // 일간은 본원이므로 제외, 일지만 카운트
    pillars.hour.ganSipsin,
    pillars.hour.jiSipsin,
  ];

  sipsinPositions.forEach((sipsin) => {
    if (sipsin && sipsin !== "본원") {
      const category = SIPSIN_CATEGORY_MAP[sipsin];
      if (category) {
        counts[category]++;
      }
    }
  });

  return counts;
}

/**
 * 특정 십신 카테고리가 과다한지 확인합니다 (3개 이상)
 */
function isCategoryExcess(
  counts: Record<string, number>,
  category: string
): boolean {
  return (counts[category] || 0) >= EOKBU_CRITERIA.EXCESS_THRESHOLD;
}

/**
 * 특정 십신 카테고리가 부재인지 확인합니다 (0개)
 */
function isCategoryAbsent(
  counts: Record<string, number>,
  category: string
): boolean {
  return (counts[category] || 0) === 0;
}

// =================================================================
// 용신 천간 선택 함수 (우선순위 로직)
// =================================================================

/**
 * 용신 오행이 결정된 후, 실제 천간을 선택합니다
 * 우선순위:
 * 1차 - 원국 천간에 해당 오행 천간 1개만 있으면 그것
 * 2차 - 원국 천간에 양/음 둘 다 있으면 정십신(비견,정인,정관,식신,정재) 해당 천간
 * 3차 - 원국 천간에 없으면, 지장간 천간 중 1개만 있으면 그것
 * 4차 - 지장간에 양/음 둘 다 있으면 정십신 해당 천간
 * 5차 - 원국+지장간에도 없으면 양간
 */
function selectYongsinGan(
  yongsinOhaeng: string,
  dayGan: string,
  pillars: SajuData["pillars"],
  jijanggan: SajuData["jijanggan"]
): string {
  const ganPair = OHAENG_TO_GAN[yongsinOhaeng];
  if (!ganPair) {
    return ""; // 오행 매핑 실패
  }

  const yangGan = ganPair.양;
  const eumGan = ganPair.음;

  // 원국 천간들 (일간 제외: 년간, 월간, 시간)
  const wonGukGans = [pillars.year.gan, pillars.month.gan, pillars.hour.gan];

  const hasYangInWonGuk = wonGukGans.includes(yangGan);
  const hasEumInWonGuk = wonGukGans.includes(eumGan);

  // 1차/2차: 원국 천간 확인
  if (hasYangInWonGuk && hasEumInWonGuk) {
    // 2차: 둘 다 있으면 정십신 해당 천간 선택
    return selectByJeongSipsin(yangGan, eumGan, dayGan);
  } else if (hasYangInWonGuk) {
    // 1차: 양간만 있으면 양간
    return yangGan;
  } else if (hasEumInWonGuk) {
    // 1차: 음간만 있으면 음간
    return eumGan;
  }

  // 3차/4차: 지장간 천간 확인
  // 지장간 전체 천간 수집 (한글 → 한자 변환)
  const allJijangganGans: string[] = [];
  const jijangganArrays = [
    jijanggan.year,
    jijanggan.month,
    jijanggan.day,
    jijanggan.hour,
  ];

  jijangganArrays.forEach((jjgArray) => {
    jjgArray.forEach((ganKor) => {
      const ganHanja = JIJANGGAN_JUNGGI_TO_GAN[ganKor];
      if (ganHanja) {
        allJijangganGans.push(ganHanja);
      }
    });
  });

  const hasYangInJijanggan = allJijangganGans.includes(yangGan);
  const hasEumInJijanggan = allJijangganGans.includes(eumGan);

  if (hasYangInJijanggan && hasEumInJijanggan) {
    // 4차: 지장간에 둘 다 있으면 정십신 해당 천간 선택
    return selectByJeongSipsin(yangGan, eumGan, dayGan);
  } else if (hasYangInJijanggan) {
    // 3차: 양간만 있으면 양간
    return yangGan;
  } else if (hasEumInJijanggan) {
    // 3차: 음간만 있으면 음간
    return eumGan;
  }

  // 5차: 원국+지장간에도 없으면 양간
  return yangGan;
}

/**
 * 일간 기준으로 정십신(비견,정인,정관,식신,정재)에 해당하는 천간을 선택합니다
 */
function selectByJeongSipsin(
  yangGan: string,
  eumGan: string,
  dayGan: string
): string {
  // SIPSIN_TABLE.h에서 일간 기준으로 양간/음간의 십신을 조회
  const sipsinTableH = SIPSIN_TABLE.h as Record<
    string,
    Record<string, string>
  >;
  const dayGanTable = sipsinTableH[dayGan];

  if (!dayGanTable) {
    return yangGan; // 테이블 없으면 양간 기본값
  }

  const yangSipsin = dayGanTable[yangGan];
  const eumSipsin = dayGanTable[eumGan];

  // 정십신(비견,정인,정관,식신,정재)에 해당하는 쪽 선택
  if (JEONG_SIPSIN_LIST.includes(yangSipsin)) {
    return yangGan;
  } else if (JEONG_SIPSIN_LIST.includes(eumSipsin)) {
    return eumGan;
  }

  // 둘 다 정십신이 아니면 양간 기본값
  return yangGan;
}

/**
 * 월지 정기 천간을 가져옵니다
 */
function getMonthJiJunggiGan(monthJi: string): string {
  const jijangganData = JIJANGGAN_DATA[monthJi];
  if (!jijangganData) {
    return "";
  }

  const junggi = jijangganData.find((item) => item.role === "정기");
  if (!junggi) {
    return "";
  }

  // 한글 → 한자 변환
  return JIJANGGAN_JUNGGI_TO_GAN[junggi.gan] || "";
}

// =================================================================
// 억부용신 (Tier 1) 분석 함수
// =================================================================

/**
 * Tier 1: 억부용신 분석 (새로운 로직)
 */
export function analyzeTier1_Eokbu(sajuData: SajuData): TierAnalysis {
  const wangseScore = sajuData.wangseStrength?.finalScore ?? 17.5;
  const dayGan = sajuData.pillars.day.gan;
  const monthJi = sajuData.pillars.month.ji;

  // 십신 카테고리별 개수 계산
  const sipsinCounts = countSipsinCategories(sajuData);

  let yongsinOhaeng = "";
  let yongsinGan = "";
  let confidence = 0;
  let reason = "";
  let isDominant = false;
  let matchedCondition = "";
  let strengthType: "신강" | "신약" | "중화" = "중화";

  // =================================================================
  // 1. 신강 (21 초과) → 억제 필요
  // =================================================================
  if (wangseScore > EOKBU_CRITERIA.STRONG_THRESHOLD) {
    strengthType = "신강";

    for (const condition of EOKBU_STRONG_CONDITIONS) {
      if (isCategoryExcess(sipsinCounts, condition.checkCategory)) {
        // 조건 매칭! 용신 카테고리 → 오행 변환
        yongsinOhaeng =
          DAYGAN_SIPSIN_TO_OHAENG[dayGan]?.[condition.yongsinCategory] || "";
        matchedCondition = condition.name;
        reason = `${condition.description} → ${condition.yongsinCategory}`;
        isDominant = true;
        confidence = Math.min(Math.floor((wangseScore - 21) * 5) + 70, 95);
        break;
      }
    }

    // 조건에 해당하지 않으면 기본 재성 용신
    if (!yongsinOhaeng) {
      yongsinOhaeng = DAYGAN_SIPSIN_TO_OHAENG[dayGan]?.["재성"] || "";
      matchedCondition = "기본_신강";
      reason = "신강 기본 → 재성";
      isDominant = true;
      confidence = 65;
    }
  }
  // =================================================================
  // 2. 신약 (14 미만) → 부조 필요
  // =================================================================
  else if (wangseScore < EOKBU_CRITERIA.WEAK_THRESHOLD) {
    strengthType = "신약";

    for (const condition of EOKBU_WEAK_CONDITIONS) {
      if (isCategoryExcess(sipsinCounts, condition.checkCategory)) {
        yongsinOhaeng =
          DAYGAN_SIPSIN_TO_OHAENG[dayGan]?.[condition.yongsinCategory] || "";
        matchedCondition = condition.name;
        reason = `${condition.description} → ${condition.yongsinCategory}`;
        isDominant = true;
        confidence = Math.max(90 - Math.floor(wangseScore * 2), 60);
        break;
      }
    }

    // 조건에 해당하지 않으면 기본 인성 용신 (인성 우선)
    if (!yongsinOhaeng) {
      yongsinOhaeng = DAYGAN_SIPSIN_TO_OHAENG[dayGan]?.["인성"] || "";
      matchedCondition = "기본_신약";
      reason = "신약 기본 → 인성";
      isDominant = true;
      confidence = 65;
    }
  }
  // =================================================================
  // 3. 중화 (14 ~ 20) → 부족한 십신 보충
  // =================================================================
  else {
    strengthType = "중화";

    for (const condition of EOKBU_NEUTRAL_CONDITIONS) {
      // fallback 조건 (월지정기)
      if (condition.checkType === "fallback") {
        // 월지 정기를 용신으로
        yongsinGan = getMonthJiJunggiGan(monthJi);
        matchedCondition = "월지정기";
        reason = `중화 상태, 조건 미해당 → 월지(${monthJi}) 정기(${yongsinGan})`;
        isDominant = true;
        confidence = 60;
        break;
      }

      // 부재 조건 확인
      if (
        condition.checkType === "absence" &&
        condition.checkCategory &&
        isCategoryAbsent(sipsinCounts, condition.checkCategory)
      ) {
        yongsinOhaeng =
          DAYGAN_SIPSIN_TO_OHAENG[dayGan]?.[condition.yongsinCategory] || "";
        matchedCondition = condition.name;
        reason = `${condition.description} → ${condition.yongsinCategory} 보충`;
        isDominant = true;
        confidence = 70;
        break;
      }
    }
  }

  // =================================================================
  // 용신 천간 선택 (오행 → 천간 변환)
  // =================================================================
  if (yongsinOhaeng && !yongsinGan) {
    yongsinGan = selectYongsinGan(
      yongsinOhaeng,
      dayGan,
      sajuData.pillars,
      sajuData.jijanggan
    );
  }

  // 최종 reason 구성
  const dayGanOhaeng = GAN_TO_OHAENG[dayGan] || "";
  const fullReason = `일간 ${dayGan}(${dayGanOhaeng}) ${strengthType}(${wangseScore.toFixed(1)}점) - ${reason} → ${yongsinGan || "없음"}`;

  return {
    tier: 1,
    name: "억부용신",
    isDominant,
    yongsin: yongsinGan,
    confidence,
    reason: fullReason,
    details: {
      wangseScore,
      strengthType,
      dayGan,
      dayGanOhaeng,
      sipsinCounts,
      matchedCondition,
      yongsinOhaeng,
      threshold: {
        weak: EOKBU_CRITERIA.WEAK_THRESHOLD,
        strong: EOKBU_CRITERIA.STRONG_THRESHOLD,
      },
    },
  };
}

// =================================================================
// 조후용신 (Tier 2) 분석 함수
// =================================================================

/**
 * Tier 2: 조후용신 분석
 */
export function analyzeTier2_Johu(sajuData: SajuData): TierAnalysis {
  const dayGan = sajuData.pillars.day.gan;
  const monthJi = sajuData.pillars.month.ji;
  const mappedCandidates = JOHU_DAY_MONTH_YONGSIN_MAP[dayGan]?.[monthJi] || [];

  if (mappedCandidates.length > 0) {
    const primaryMapped = mappedCandidates[0];
    return {
      tier: 2,
      name: "조후용신",
      isDominant: true,
      yongsin: primaryMapped,
      confidence: 80,
      reason: `${dayGan}일간 ${monthJi}월 맵핑 → ${mappedCandidates.join("/")}`,
      details: {
        mappedCandidates,
      },
    };
  }

  return {
    tier: 2,
    name: "조후용신",
    isDominant: false,
    yongsin: "",
    confidence: 0,
    reason: "조후용신 맵핑 없음",
    details: {
      mappedCandidates: [],
    },
  };
}

// =================================================================
// 메인 용신 분석 함수
// =================================================================

/**
 * 메인 용신 분석 함수
 */
export function analyzeYongsin(
  sajuData: SajuData,
  currentDaewoon: { ganji: string } | null = null
): YongsinResult {
  void currentDaewoon;

  // 억부/조후 분석
  const eokbu = analyzeTier1_Eokbu(sajuData);
  const johu = analyzeTier2_Johu(sajuData);
  const analyses = [eokbu, johu];

  // 우선순위: 억부용신 > 조후용신
  const primaryYongsin = eokbu.yongsin || johu.yongsin || "";
  const selectedTier = eokbu.isDominant ? eokbu : johu.isDominant ? johu : null;
  const confidence = Math.max(eokbu.confidence, johu.confidence);

  return {
    primaryYongsin,
    selectedTier,
    allAnalyses: analyses,
    confidence,
    summary: `억부용신: ${eokbu.yongsin || "-"} / 조후용신: ${johu.yongsin || "-"}`,
  };
}
