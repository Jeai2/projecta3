// server/src/services/compatibility.service.ts
// 사용자 사주와 일진 간의 상성 분석 서비스

import {
  CHEONGANHAP,
  CHEONGANHAPHWA,
  CHEONGANCHUNG,
  SAMHAP,
  BANGHAP,
  YUKHAP,
  YUKCHUNG,
  YUKHYUNG,
  YUKPA,
  YUKAE,
  YUKHAPHWA,
} from "../data/relationship.data";
import { getDaewoon } from "./daewoon.service";
// Pillars 타입 정의 (간단한 버전)
interface Pillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}
import type { IljinData } from "../types/today-fortune";
import { OHAENG_SANGGEUK } from "../data/yongsin.data";

// 천간 오행 매핑
const GAN_TO_OHAENG: Record<string, string> = {
  갑: "목",
  을: "목",
  병: "화",
  정: "화",
  무: "토",
  기: "토",
  경: "금",
  신: "금",
  임: "수",
  계: "수",
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
};

// 지지 오행 매핑
const JI_TO_OHAENG: Record<string, string> = {
  자: "수",
  축: "토",
  인: "목",
  묘: "목",
  진: "토",
  사: "화",
  오: "화",
  미: "토",
  신: "금",
  유: "금",
  술: "토",
  해: "수",
  子: "수",
  丑: "토",
  寅: "목",
  卯: "목",
  辰: "토",
  巳: "화",
  午: "화",
  未: "토",
  申: "금",
  酉: "금",
  戌: "토",
  亥: "수",
};

// 오행 상생상극 관계
const OHAENG_RELATIONS: Record<string, Record<string, number>> = {
  목: { 목: 10, 화: 5, 토: -10, 금: -15, 수: 15 },
  화: { 목: 15, 화: 10, 토: 5, 금: -10, 수: -15 },
  토: { 목: -15, 화: 15, 토: 10, 금: 5, 수: -10 },
  금: { 목: -10, 화: -15, 토: 15, 금: 10, 수: 5 },
  수: { 목: 5, 화: -10, 토: -15, 금: 15, 수: 10 },
};

// 한글-한자 변환 매핑
const HANGUL_TO_HANJA: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신지: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

interface HarmonyDetail {
  type: string;
  base: string;
  target: string;
  context: string;
  description?: string;
  label?: string;
}

// 상성 분석 결과 인터페이스
export interface CompatibilityResult {
  ganCompatibility: number; // 천간 상성 점수 (-20 ~ +20)
  jiCompatibility: number; // 지지 상성 점수 (-20 ~ +20)
  harmonyBonus: number; // 합화/삼합/육합 보너스 (0 ~ +15)
  daewoonSupport: number; // 현재 대운 지원도 (-10 ~ +10)
  totalScore: number; // 총 상성 점수 (-50 ~ +65)
  analysis: {
    ganRelation: string; // 천간 관계 설명
    jiRelation: string; // 지지 관계 설명
    specialHarmony: HarmonyDetail[]; // 특별한 조화 관계
    daewoonEffect: string; // 대운 영향 설명
  };
}

/**
 * 사용자 사주와 오늘 일진의 상성을 분석합니다
 */
export function analyzeCompatibility(
  userPillars: Pillars,
  todayIljin: IljinData,
  birthDate: Date,
  gender: "M" | "W"
): CompatibilityResult {
  const userDayGan = userPillars.day[0]; // 사용자 일간
  const userDayJi = userPillars.day[1]; // 사용자 일지
  const todayGan = todayIljin.gan; // 오늘 일진 천간
  const todayJi = todayIljin.ji; // 오늘 일진 지지

  // 1. 천간 상성 분석 (일간 vs 일진천간)
  const userGanOhaeng = GAN_TO_OHAENG[userDayGan];
  const todayGanOhaeng = GAN_TO_OHAENG[todayGan];
  const ganCompatibility = OHAENG_RELATIONS[userGanOhaeng][todayGanOhaeng];

  // 2. 지지 상성 분석 (일지 vs 일진지지)
  const userJiOhaeng = JI_TO_OHAENG[userDayJi];
  const todayJiOhaeng = JI_TO_OHAENG[todayJi];
  const jiCompatibility = OHAENG_RELATIONS[userJiOhaeng][todayJiOhaeng];

  // 3. 특별한 조화 관계 확인 (기존 데이터 활용)
  let harmonyBonus = 0;
  const specialHarmony: HarmonyDetail[] = [];
  const seenRelations = new Set<string>();

  const toHanja = (value: string): string =>
    HANGUL_TO_HANJA[value] || value || "";

  const addRelation = (
    type: string,
    base: string,
    target: string,
    context: string,
    description?: string
  ) => {
    if (!type || !base || !target) return;
    const key = `${type}|${base}|${target}|${context}|${description ?? ""}`;
    if (seenRelations.has(key)) return;
    seenRelations.add(key);
    specialHarmony.push({
      type,
      base,
      target,
      context,
      description,
      label: `${base}${target}`,
    });
  };

  const todayGanHanja = toHanja(todayGan);
  const todayJiHanja = toHanja(todayJi);

  const pillarInfos = [
    {
      labelGan: "년간",
      labelJi: "년지",
      gan: userPillars.year[0],
      ji: userPillars.year[1],
    },
    {
      labelGan: "월간",
      labelJi: "월지",
      gan: userPillars.month[0],
      ji: userPillars.month[1],
    },
    {
      labelGan: "일간",
      labelJi: "일지",
      gan: userPillars.day[0],
      ji: userPillars.day[1],
    },
    {
      labelGan: "시간",
      labelJi: "시지",
      gan: userPillars.hour[0],
      ji: userPillars.hour[1],
    },
  ];

  const allJiHanja = pillarInfos.map((info) => toHanja(info.ji));

  const HYUNG_TRIPLE_SETS: string[][] = [
    ["寅", "巳", "申"],
    ["丑", "未", "戌"],
  ];

  const evaluateJiRelationships = () => {
    const hyungCandidates: Array<{ base: string; context: string }> = [];

    pillarInfos.forEach(({ labelJi, ji }) => {
      const baseJiHanja = toHanja(ji);
      if (!baseJiHanja) return;

      if (YUKHAP[baseJiHanja] === todayJiHanja) {
        harmonyBonus += labelJi === "일지" ? 8 : 0;
        const yukhapInfo = YUKHAPHWA[baseJiHanja];
        addRelation(
          "육합",
          baseJiHanja,
          todayJiHanja,
          labelJi,
          yukhapInfo?.resultName
        );
      }

      const samhapPartners = SAMHAP[baseJiHanja];
      if (samhapPartners?.includes(todayJiHanja)) {
        const others = samhapPartners.filter((partner) => partner !== todayJiHanja);
        const hasAll =
          others.length > 0 &&
          others.every((partner) =>
            partner === baseJiHanja
              ? false
              : allJiHanja.some((item) => item === partner)
          );
        const type = hasAll ? "삼합" : "반합";
        if (labelJi === "일지") {
          harmonyBonus += hasAll ? 10 : 0;
        }
        const samhapGroup = getSamhapGroupName(baseJiHanja, todayJiHanja);
        addRelation(
          type,
          baseJiHanja,
          todayJiHanja,
          labelJi,
          samhapGroup !== "미상" ? samhapGroup : undefined
        );
      }

      const banghapPartners = BANGHAP[baseJiHanja];
      if (banghapPartners?.includes(todayJiHanja)) {
        addRelation("방합", baseJiHanja, todayJiHanja, labelJi);
      }

      if (YUKCHUNG[baseJiHanja] === todayJiHanja) {
        addRelation("충", baseJiHanja, todayJiHanja, labelJi);
      }

      if (YUKHYUNG[baseJiHanja]?.includes(todayJiHanja)) {
        hyungCandidates.push({ base: baseJiHanja, context: labelJi });
      }

      if (YUKPA[baseJiHanja] === todayJiHanja) {
        addRelation("파", baseJiHanja, todayJiHanja, labelJi);
      }

      if (YUKAE[baseJiHanja] === todayJiHanja) {
        addRelation("해", baseJiHanja, todayJiHanja, labelJi);
      }
    });

    if (hyungCandidates.length > 0) {
      const usedHyungBases = new Set<string>();
      HYUNG_TRIPLE_SETS.forEach((triple) => {
        if (!triple.includes(todayJiHanja)) return;
        const others = triple.filter((ji) => ji !== todayJiHanja);
        const matches = hyungCandidates.filter((candidate) =>
          others.includes(candidate.base)
        );
        if (matches.length === others.length) {
          const combinedBase = others.join("");
          const combinedContext = matches
            .map((candidate) => candidate.context)
            .filter(Boolean)
            .join(" · ");
          addRelation("삼형", combinedBase, todayJiHanja, combinedContext || "지지");
          others.forEach((base) => usedHyungBases.add(base));
        }
      });

      hyungCandidates.forEach(({ base, context }) => {
        if (usedHyungBases.has(base)) return;
        addRelation("형", base, todayJiHanja, context);
      });
    }
  };

  const evaluateGanRelationships = () => {
    pillarInfos.forEach(({ labelGan, gan }) => {
      const baseGanHanja = toHanja(gan);
      if (!baseGanHanja) return;

      if (CHEONGANHAP[baseGanHanja] === todayGanHanja) {
        if (labelGan === "일간") {
          harmonyBonus += 15;
        }
        const hwaInfo = CHEONGANHAPHWA[baseGanHanja];
        addRelation(
          "천간합",
          baseGanHanja,
          todayGanHanja,
          labelGan,
          hwaInfo?.resultName
        );
      }

      if (CHEONGANCHUNG[baseGanHanja] === todayGanHanja) {
        addRelation("천간충", baseGanHanja, todayGanHanja, labelGan);
      }

      const baseGanElement = GAN_TO_OHAENG[baseGanHanja];
      const todayGanElement = GAN_TO_OHAENG[todayGanHanja] || GAN_TO_OHAENG[todayGan];

      if (baseGanElement && todayGanElement) {
        if (OHAENG_SANGGEUK[baseGanElement] === todayGanElement) {
          addRelation("천간극", baseGanHanja, todayGanHanja, labelGan);
        } else if (OHAENG_SANGGEUK[todayGanElement] === baseGanElement) {
          addRelation("천간극", baseGanHanja, todayGanHanja, labelGan);
        }
      }
    });
  };

  evaluateGanRelationships();
  evaluateJiRelationships();

  // 4. 현재 대운 지원도 분석
  const currentAge = new Date().getFullYear() - birthDate.getFullYear() + 1;
  const daewoonPillars = {
    yearPillar: userPillars.year,
    monthPillar: userPillars.month,
    dayPillar: userPillars.day,
  };
  const daewoonList = getDaewoon(birthDate, gender, daewoonPillars, {});
  const currentDaewoon = daewoonList.find(
    (d) => currentAge >= d.age && currentAge < d.age + 10
  );

  let daewoonSupport = 0;
  let daewoonEffect = "대운 정보 없음";

  if (currentDaewoon) {
    const daewoonGan = currentDaewoon.ganji[0];
    const daewoonGanOhaeng = GAN_TO_OHAENG[daewoonGan];
    const daewoonTodayRelation =
      OHAENG_RELATIONS[daewoonGanOhaeng][todayGanOhaeng];

    daewoonSupport = Math.round(daewoonTodayRelation * 0.5); // 대운 영향도는 50%로 조정
    daewoonEffect =
      daewoonSupport > 0
        ? "대운이 오늘을 지원"
        : daewoonSupport < 0
        ? "대운이 오늘과 충돌"
        : "대운 중립";
  }

  // 5. 총 점수 계산
  const totalScore =
    ganCompatibility + jiCompatibility + harmonyBonus + daewoonSupport;

  // 6. 관계 설명 생성
  const ganRelation = getRelationDescription(
    userGanOhaeng,
    todayGanOhaeng,
    ganCompatibility
  );
  const jiRelation = getRelationDescription(
    userJiOhaeng,
    todayJiOhaeng,
    jiCompatibility
  );

  return {
    ganCompatibility,
    jiCompatibility,
    harmonyBonus,
    daewoonSupport,
    totalScore,
    analysis: {
      ganRelation,
      jiRelation,
      specialHarmony,
      daewoonEffect,
    },
  };
}

/**
 * 오행 관계에 따른 설명을 생성합니다
 */
function getRelationDescription(
  userOhaeng: string,
  todayOhaeng: string,
  score: number
): string {
  if (score > 5) {
    return `${userOhaeng}이 ${todayOhaeng}을 생하여 매우 조화로움`;
  } else if (score > 0) {
    return `${userOhaeng}과 ${todayOhaeng}이 서로 도움을 줌`;
  } else if (score === 0) {
    return `${userOhaeng}과 ${todayOhaeng}이 중립적 관계`;
  } else if (score > -10) {
    return `${userOhaeng}이 ${todayOhaeng}과 약간 충돌`;
  } else {
    return `${userOhaeng}이 ${todayOhaeng}에게 강하게 극을 당함`;
  }
}

/**
 * 상성 점수를 기반으로 전반적인 운세 톤을 결정합니다
 */
/**
 * 삼합 그룹 이름을 반환합니다
 */
function getSamhapGroupName(ji1: string, ji2: string): string {
  const groups = {
    寅午戌: "화국",
    亥卯未: "목국",
    巳酉丑: "금국",
    申子辰: "수국",
  };

  for (const [group, name] of Object.entries(groups)) {
    if (group.includes(ji1) && group.includes(ji2)) {
      return name;
    }
  }
  return "미상";
}

/**
 * 상성 점수를 기반으로 전반적인 운세 톤을 결정합니다
 */
export function getCompatibilityTone(
  totalScore: number
): "positive" | "neutral" | "negative" {
  if (totalScore >= 20) return "positive";
  if (totalScore >= -10) return "neutral";
  return "negative";
}
