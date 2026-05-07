// src/services/sinsal.service.new.ts
// A/B 테스트용 새로운 신살 계산 서비스 (B 버전)
// 기존 sinsal.service.ts의 복잡한 로직을 간단하고 명확하게 재작성

import type { StarElement } from "../types/saju.d";
import { SINSAL_12_MAP, getSamhapGroup } from "../data/sinsal/12sinsal.map";
import { SINSAL_RULES_AUSPICIOUS } from "../data/sinsal/rules.auspicious";
import { SINSAL_RULES_INAUSPICIOUS } from "../data/sinsal/rules.inauspicious";
import type { SinsalRule } from "../data/sinsal/types";

// ============================================================================
// 타입 정의 (Types)
// ============================================================================

type PillarKey = "year" | "month" | "day" | "hour" | "daewoon" | "sewoon";
type Pillar = { key: PillarKey; gan: string; ji: string; ganji: string };

export type SinsalHit = {
  name: string;
  elements: StarElement[];
  category: "auspicious" | "inauspicious" | "neutral";
};
export type SinsalResult = { [key in PillarKey]: SinsalHit[] };

interface SajuInfo {
  pillars: Pillar[];
  dayGan: string;
  dayJi: string;
  monthJi: string;
  yearJi: string;
  dayGanji: string;
  gender: "M" | "W";
}

// ============================================================================
// 12신살 매핑 데이터 (12 Sinsal Mapping Data)
// ============================================================================
// 기존 data/sinsal/12sinsal.map.ts에서 import하여 사용

// ============================================================================
// 유틸리티 함수 (Utility Functions)
// ============================================================================

// getSamhapGroup 함수는 기존 data/sinsal/12sinsal.map.ts에서 import하여 사용

/**
 * 사주 정보를 표준화된 형태로 변환
 * @param pillars 사주 기둥 데이터
 * @param gender 성별
 * @returns 표준화된 사주 정보
 */
function createSajuInfo(
  pillars: { year: string; month: string; day: string; hour: string },
  gender: "M" | "W",
  additionalPillars?: { name: string; gan: string; ji: string }[]
): SajuInfo {
  const sajuPillars: Pillar[] = [
    {
      key: "year",
      gan: pillars.year[0],
      ji: pillars.year[1],
      ganji: pillars.year,
    },
    {
      key: "month",
      gan: pillars.month[0],
      ji: pillars.month[1],
      ganji: pillars.month,
    },
    { key: "day", gan: pillars.day[0], ji: pillars.day[1], ganji: pillars.day },
    {
      key: "hour",
      gan: pillars.hour[0],
      ji: pillars.hour[1],
      ganji: pillars.hour,
    },
  ];

  // 추가 기둥 (대운, 세운) 추가
  if (additionalPillars) {
    additionalPillars.forEach((pillar) => {
      sajuPillars.push({
        key: pillar.name as PillarKey,
        gan: pillar.gan,
        ji: pillar.ji,
        ganji: pillar.gan + pillar.ji,
      });
    });
  }

  return {
    pillars: sajuPillars,
    dayGan: pillars.day[0],
    dayJi: pillars.day[1],
    monthJi: pillars.month[1],
    yearJi: pillars.year[1],
    dayGanji: pillars.day,
    gender,
  };
}

// ============================================================================
// 12신살 계산 (12 Sinsal Calculation)
// ============================================================================

/**
 * 12신살 계산 - 각 기둥을 기준으로 다른 기둥들과의 관계 계산
 * @param saju 사주 정보
 * @returns 12신살 결과
 */
function calculate12Sinsal(saju: SajuInfo): SinsalResult {
  const allHits: SinsalHit[] = []; // ✅ 모든 신살 결과를 임시 배열에 저장합니다.

  const result: SinsalResult = {
    year: [],
    month: [],
    day: [],
    hour: [],
    daewoon: [],
    sewoon: [],
  };

  saju.pillars.forEach((basePillar) => {
    const group = getSamhapGroup(basePillar.ji);
    if (!group) return;

    const ruleSet = SINSAL_12_MAP[group];

    saju.pillars.forEach((targetPillar) => {
      const sinsalName = ruleSet[targetPillar.ji];
      if (sinsalName) {
        // ✅ 중복 체크 로직을 제거하고 모든 히트를 임시 배열에 추가합니다.
        //    이제 모든 관계에서 발생한 신살이 누락 없이 기록됩니다.
        allHits.push({
          name: sinsalName,
          elements: [
            { pillar: basePillar.key, type: "ji", character: basePillar.ji },
            {
              pillar: targetPillar.key,
              type: "ji",
              character: targetPillar.ji,
            },
          ],
          category: "neutral", // 12신살은 중립적
        });
      }
    });
  });

  // ✅ 기둥별로 결과를 분류
  saju.pillars.forEach((pillar) => {
    // 해당 기둥이 타겟 기둥인 신살들만 필터링 (elements의 두 번째 요소가 타겟 기둥)
    const sinsalsForPillar = allHits.filter(
      (hit) => hit.elements.length >= 2 && hit.elements[1].pillar === pillar.key
    );

    result[pillar.key].push(...sinsalsForPillar);
  });

  return result;
}

// ============================================================================
// 기타 신살 계산 (Other Sinsal Calculation)
// ============================================================================

/**
 * 기타 신살 계산 (흉신, 길신 등)
 * @param saju 사주 정보
 * @returns 기타 신살 결과
 */
function calculateOtherSinsal(saju: SajuInfo): SinsalResult {
  const result: SinsalResult = {
    year: [],
    month: [],
    day: [],
    hour: [],
    daewoon: [],
    sewoon: [],
  };

  // 모든 신살 규칙을 하나로 합치기
  const allRules = { ...SINSAL_RULES_AUSPICIOUS, ...SINSAL_RULES_INAUSPICIOUS };

  // 흉신/길신 계산 통계
  let totalHits = 0;
  let auspiciousHits = 0;
  let inauspiciousHits = 0;

  // 각 신살 규칙에 대해 계산
  Object.entries(allRules).forEach(([sinsalName, rule]) => {
    try {
      const hits = calculateSinsalByRule(saju, sinsalName, rule);
      totalHits += hits.length;

      // 길신/흉신 분류
      if (SINSAL_RULES_AUSPICIOUS[sinsalName]) {
        auspiciousHits += hits.length;
      } else if (SINSAL_RULES_INAUSPICIOUS[sinsalName]) {
        inauspiciousHits += hits.length;
      }

      hits.forEach((hit) => {
        // 해당 기둥에 신살 추가
        const targetPillar = hit.elements[hit.elements.length - 1]?.pillar;
        if (targetPillar && result[targetPillar]) {
          result[targetPillar].push(hit);
        }
      });
    } catch (error) {
      console.warn(`⚠️ 신살 ${sinsalName} 계산 중 오류:`, error);
    }
  });

  // 흉신/길신 계산 결과 로그
  console.log("🔍 흉신/길신 계산 완료:", {
    총계산: totalHits,
    길신: auspiciousHits,
    흉신: inauspiciousHits,
    기둥별분포: {
      year: result.year.length,
      month: result.month.length,
      day: result.day.length,
      hour: result.hour.length,
      daewoon: result.daewoon.length,
      sewoon: result.sewoon.length,
    },
  });

  // 길신/흉신 상세 로그 (계산된 것만)
  if (totalHits > 0) {
    const allSinsalNames = [
      ...result.year,
      ...result.month,
      ...result.day,
      ...result.hour,
      ...result.daewoon,
      ...result.sewoon,
    ].map((h) => h.name);

    const uniqueSinsalNames = [...new Set(allSinsalNames)];
    console.log("🔍 계산된 신살 목록:", uniqueSinsalNames);
  }

  return result;
}

/**
 * 특정 신살 규칙에 따른 계산
 * @param saju 사주 정보
 * @param sinsalName 신살 이름
 * @param rule 신살 규칙
 * @returns 계산된 신살 결과
 */

function calculateSinsalByRule(
  saju: SajuInfo,
  sinsalName: string,
  rule: SinsalRule
): SinsalHit[] {
  const hits: SinsalHit[] = [];

  // 신살의 카테고리 결정
  const category = SINSAL_RULES_AUSPICIOUS[sinsalName]
    ? "auspicious"
    : SINSAL_RULES_INAUSPICIOUS[sinsalName]
    ? "inauspicious"
    : "neutral";

  switch (rule.type) {
    case "ganji":
      // 간지 규칙: 특정 간지 조합이 있으면 해당 기둥에 신살 추가
      rule.values.forEach((ganji: string) => {
        saju.pillars.forEach((pillar) => {
          if (pillar.ganji === ganji) {
            hits.push({
              name: sinsalName,
              elements: [
                { pillar: pillar.key, type: "gan", character: pillar.gan },
                { pillar: pillar.key, type: "ji", character: pillar.ji },
              ],
              category,
            });
          }
        });
      });
      break;

    case "criteria": {
      // 기준 규칙: 특정 기준에 따라 신살 계산
      const baseValue = getBaseValue(saju, rule.base);
      if (baseValue && rule.rules[baseValue]) {
        const targets = Array.isArray(rule.rules[baseValue])
          ? rule.rules[baseValue]
          : [rule.rules[baseValue]];

        targets.forEach((target) => {
          saju.pillars.forEach((pillar) => {
            const checkValue = rule.target === "gan" ? pillar.gan : pillar.ji;
            if (checkValue === target) {
              hits.push({
                name: sinsalName,
                elements: [
                  {
                    pillar: getBasePillar(rule.base),
                    type: rule.base.includes("Gan") ? "gan" : "ji",
                    character: baseValue,
                  },
                  { pillar: pillar.key, type: rule.target, character: target },
                ],
                category,
              });
            }
          });
        });
      }
      break;
    }

    case "complexCriteria": {
      // 복합 기준 규칙: 모든 조건이 동시에 만족되어야 함
      const baseValue2 = getBaseValue(saju, rule.base);
      if (baseValue2 && rule.rules[baseValue2]) {
        const requiredTargets = rule.rules[baseValue2];
        const foundTargets = saju.pillars
          .map((pillar) => (rule.target === "gan" ? pillar.gan : pillar.ji))
          .filter((target) => requiredTargets.includes(target));

        if (foundTargets.length === requiredTargets.length) {
          // 모든 조건이 만족되면 각 타겟에 대해 신살 추가
          foundTargets.forEach((target) => {
            const targetPillar = saju.pillars.find(
              (pillar) =>
                (rule.target === "gan" ? pillar.gan : pillar.ji) === target
            );
            if (targetPillar) {
              hits.push({
                name: sinsalName,
                elements: [
                  {
                    pillar: getBasePillar(rule.base),
                    type: rule.base.includes("Gan") ? "gan" : "ji",
                    character: baseValue2,
                  },
                  {
                    pillar: targetPillar.key,
                    type: rule.target,
                    character: target,
                  },
                ],
                category,
              });
            }
          });
        }
      }
      break;
    }

    case "pair": {
      // 쌍 규칙: 특정 쌍이 있으면 신살 추가
      const baseValue3 = getBaseValue(saju, rule.base);
      if (baseValue3 && rule.pairs[baseValue3]) {
        const target = rule.pairs[baseValue3];
        saju.pillars.forEach((pillar) => {
          const checkValue = rule.base.includes("Gan") ? pillar.gan : pillar.ji;
          if (checkValue === target) {
            hits.push({
              name: sinsalName,
              elements: [
                {
                  pillar: getBasePillar(rule.base),
                  type: rule.base.includes("Gan") ? "gan" : "ji",
                  character: baseValue3,
                },
                {
                  pillar: pillar.key,
                  type: rule.base.includes("Gan") ? "gan" : "ji",
                  character: target,
                },
              ],
              category,
            });
          }
        });
      }
      break;
    }

    case "adjacentPair": {
      // 인접 쌍 규칙: 인접한 기둥만 확인
      const baseValue4 = getBaseValue(saju, rule.base);
      if (baseValue4 && rule.pairs[baseValue4]) {
        const target = rule.pairs[baseValue4];
        const basePillarKey = getBasePillar(rule.base); // "year" | "month" | "day" | "hour" | "daewoon" | "sewoon"
        const adjacentPairs = [
          { from: "year", to: "month" },
          { from: "month", to: "day" },
          { from: "day", to: "hour" },
        ];

        adjacentPairs.forEach((pair) => {
          const fromPillar = saju.pillars.find((p) => p.key === pair.from);
          const toPillar = saju.pillars.find((p) => p.key === pair.to);

          if (fromPillar && toPillar) {
            const fromValue = rule.base.includes("Gan")
              ? fromPillar.gan
              : fromPillar.ji;
            const toValue = rule.base.includes("Gan")
              ? toPillar.gan
              : toPillar.ji;

            // 기준 기둥이 왼쪽(from)인지 오른쪽(to)인지에 따라 비교 방향 결정
            const isBaseOnFrom = basePillarKey === pair.from;
            const isBaseOnTo = basePillarKey === pair.to;

            const matchesWhenBaseOnFrom =
              isBaseOnFrom && fromValue === baseValue4 && toValue === target;
            const matchesWhenBaseOnTo =
              isBaseOnTo && toValue === baseValue4 && fromValue === target;

            if (matchesWhenBaseOnFrom || matchesWhenBaseOnTo) {
              hits.push({
                name: sinsalName,
                elements: [
                  {
                    pillar: isBaseOnFrom ? fromPillar.key : toPillar.key,
                    type: rule.base.includes("Gan") ? "gan" : "ji",
                    character: baseValue4,
                  },
                  {
                    pillar: isBaseOnFrom ? toPillar.key : fromPillar.key,
                    type: rule.base.includes("Gan") ? "gan" : "ji",
                    character: target,
                  },
                ],
                category,
              });
            }
          }
        });
      }
      break;
    }

    case "monthBased":
      // 월지 기준 규칙: 월지에 따라 일지 또는 시지 확인
      if (rule.rules[saju.monthJi]) {
        const target = rule.rules[saju.monthJi];
        saju.pillars.forEach((pillar) => {
          if (
            (pillar.key === "day" || pillar.key === "hour") &&
            pillar.ji === target
          ) {
            hits.push({
              name: sinsalName,
              elements: [
                { pillar: "month", type: "ji", character: saju.monthJi },
                { pillar: pillar.key, type: "ji", character: target },
              ],
              category,
            });
          }
        });
      }
      break;

    case "allGan":
      // 모든 천간 기준 규칙: 모든 천간을 확인하여 지지에서 찾기
      Object.entries(rule.rules).forEach(([ganPattern, target]) => {
        const gans = ganPattern.split(",").map((g) => g.trim());
        const targets = Array.isArray(target) ? target : [target];

        gans.forEach((gan) => {
          saju.pillars.forEach((pillar) => {
            if (pillar.gan === gan) {
              targets.forEach((t) => {
                saju.pillars.forEach((targetPillar) => {
                  if (targetPillar.ji === t) {
                    hits.push({
                      name: sinsalName,
                      elements: [
                        { pillar: pillar.key, type: "gan", character: gan },
                        { pillar: targetPillar.key, type: "ji", character: t },
                      ],
                      category,
                    });
                  }
                });
              });
            }
          });
        });
      });
      break;

    case "gongmang": {
      // 공망살: 60갑자 기준으로 공망 지지 계산
      const gongmangHits = calculateGongmang(saju);
      hits.push(...gongmangHits);
      break;
    }

    case "complex":
      // 복합 규칙: 여러 조건을 조합
      if (rule.conditions.hasAny) {
        const hasAny = rule.conditions.hasAny.some((item: string) =>
          saju.pillars.some(
            (pillar) => pillar.gan === item || pillar.ji === item
          )
        );
        if (hasAny) {
          // hasAny 조건이 만족되면 해당 기둥에 신살 추가
          rule.conditions.hasAny.forEach((item: string) => {
            saju.pillars.forEach((pillar) => {
              if (pillar.gan === item || pillar.ji === item) {
                hits.push({
                  name: sinsalName,
                  elements: [
                    {
                      pillar: pillar.key,
                      type: pillar.gan === item ? "gan" : "ji",
                      character: item,
                    },
                  ],
                  category,
                });
              }
            });
          });
        }
      }
      break;

    default:
      console.warn(`⚠️ 알 수 없는 신살 규칙 타입: ${rule.type}`);
  }

  return hits;
}

/**
 * 기준 값 가져오기
 * @param saju 사주 정보
 * @param base 기준
 * @returns 기준 값
 */
function getBaseValue(saju: SajuInfo, base: string): string | null {
  switch (base) {
    case "dayGan":
      return saju.dayGan;
    case "dayJi":
      return saju.dayJi;
    case "monthJi":
      return saju.monthJi;
    case "yearJi":
      return saju.yearJi;
    default:
      return null;
  }
}

/**
 * 기준 기둥 가져오기
 * @param base 기준
 * @returns 기준 기둥
 */
function getBasePillar(base: string): PillarKey {
  switch (base) {
    case "dayGan":
    case "dayJi":
      return "day";
    case "monthJi":
      return "month";
    case "yearJi":
      return "year";
    default:
      return "day";
  }
}

/**
 * 공망살 계산
 * @param saju 사주 정보
 * @returns 공망살 결과
 */
function calculateGongmang(saju: SajuInfo): SinsalHit[] {
  const hits: SinsalHit[] = [];
  const category = SINSAL_RULES_AUSPICIOUS["공망"]
    ? "auspicious"
    : SINSAL_RULES_INAUSPICIOUS["공망"]
    ? "inauspicious"
    : "neutral";

  // 공망 지지 매핑
  const GONGMANG_MAP: { [key: string]: string[] } = {
    甲子: ["戌", "亥"],
    甲戌: ["申", "酉"],
    甲申: ["午", "未"],
    甲午: ["辰", "巳"],
    甲辰: ["寅", "卯"],
    甲寅: ["子", "丑"],
    乙丑: ["戌", "亥"],
    乙亥: ["申", "酉"],
    乙酉: ["午", "未"],
    乙未: ["辰", "巳"],
    乙巳: ["寅", "卯"],
    乙卯: ["子", "丑"],
    丙寅: ["戌", "亥"],
    丙子: ["申", "酉"],
    丙戌: ["午", "未"],
    丙申: ["辰", "巳"],
    丙午: ["寅", "卯"],
    丙辰: ["寅", "卯"],
    丁卯: ["戌", "亥"],
    丁丑: ["申", "酉"],
    丁亥: ["午", "未"],
    丁酉: ["辰", "巳"],
    丁未: ["寅", "卯"],
    丁巳: ["卯", "辰"],
    戊辰: ["戌", "亥"],
    戊寅: ["申", "酉"],
    戊子: ["午", "未"],
    戊戌: ["辰", "巳"],
    戊申: ["寅", "卯"],
    戊午: ["子", "丑"],
    己巳: ["戌", "亥"],
    己卯: ["申", "酉"],
    己丑: ["午", "未"],
    己亥: ["辰", "巳"],
    己酉: ["寅", "卯"],
    己未: ["巳", "午"],
    庚午: ["戌", "亥"],
    庚辰: ["申", "酉"],
    庚寅: ["午", "未"],
    庚子: ["辰", "巳"],
    庚戌: ["寅", "卯"],
    庚申: ["午", "未"],
    辛未: ["戌", "亥"],
    辛巳: ["申", "酉"],
    辛卯: ["午", "未"],
    辛丑: ["辰", "巳"],
    辛亥: ["寅", "卯"],
    辛酉: ["未", "申"],
    壬申: ["戌", "亥"],
    壬午: ["申", "酉"],
    壬辰: ["午", "未"],
    壬寅: ["辰", "巳"],
    壬子: ["寅", "卯"],
    壬戌: ["申", "酉"],
    癸酉: ["戌", "亥"],
    癸未: ["申", "酉"],
    癸巳: ["午", "未"],
    癸卯: ["辰", "巳"],
    癸丑: ["寅", "卯"],
    癸亥: ["酉", "戌"],
  };

  // 일주 기준으로 공망 지지 찾기
  const dayGanji = saju.dayGanji;
  const gongmangJis = GONGMANG_MAP[dayGanji];

  if (gongmangJis) {
    gongmangJis.forEach((gongmangJi) => {
      saju.pillars.forEach((pillar) => {
        if (pillar.ji === gongmangJi) {
          hits.push({
            name: "공망",
            elements: [
              { pillar: "day", type: "gan", character: saju.dayGan },
              { pillar: "day", type: "ji", character: saju.dayJi },
              { pillar: pillar.key, type: "ji", character: gongmangJi },
            ],
            category,
          });
        }
      });
    });
  }

  return hits;
}

// ============================================================================
// 메인 함수 (Main Function)
// ============================================================================

/**
 * 모든 신살 계산 (12신살 + 기타 신살)
 * @param pillars 사주 기둥 데이터
 * @param gender 성별
 * @param additionalPillars 추가 기둥 (대운, 세운)
 * @returns 전체 신살 결과
 */
export const getAllSinsals = (
  pillars: { year: string; month: string; day: string; hour: string },
  gender: "M" | "W",
  additionalPillars?: { name: string; gan: string; ji: string }[]
): SinsalResult => {
  // 사주 정보 생성
  const saju = createSajuInfo(pillars, gender, additionalPillars);

  // 12신살 계산
  const sinsal12 = calculate12Sinsal(saju);

  // 기타 신살 계산 (흉신/길신)
  const sinsalOther = calculateOtherSinsal(saju);

  // 결과 병합
  const result: SinsalResult = {
    year: [...sinsal12.year, ...sinsalOther.year],
    month: [...sinsal12.month, ...sinsalOther.month],
    day: [...sinsal12.day, ...sinsalOther.day],
    hour: [...sinsal12.hour, ...sinsalOther.hour],
    daewoon: [...sinsal12.daewoon, ...sinsalOther.daewoon],
    sewoon: [...sinsal12.sewoon, ...sinsalOther.sewoon],
  };

  // 최종 요약 로그
  const total12Sinsal =
    sinsal12.year.length +
    sinsal12.month.length +
    sinsal12.day.length +
    sinsal12.hour.length;
  const totalOtherSinsal =
    sinsalOther.year.length +
    sinsalOther.month.length +
    sinsalOther.day.length +
    sinsalOther.hour.length;

  console.log("🎉 신살 계산 완료:", {
    "12신살": total12Sinsal,
    "흉신/길신": totalOtherSinsal,
    총계: total12Sinsal + totalOtherSinsal,
  });

  return result;
};

// ============================================================================
// A/B 테스트용 비교 함수 (A/B Test Comparison Function)
// ============================================================================

/**
 * A 버전과 B 버전 결과 비교
 * @param resultA A 버전 결과
 * @param resultB B 버전 결과
 * @returns 비교 결과
 */
export function compareSinsalResults(
  resultA: SinsalResult,
  resultB: SinsalResult
): {
  isEqual: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  Object.keys(resultA).forEach((key) => {
    const pillarKey = key as PillarKey;
    const aNames = resultA[pillarKey].map((hit) => hit.name).sort();
    const bNames = resultB[pillarKey].map((hit) => hit.name).sort();

    if (JSON.stringify(aNames) !== JSON.stringify(bNames)) {
      differences.push(
        `${pillarKey}: A[${aNames.join(",")}] vs B[${bNames.join(",")}]`
      );
    }
  });

  return {
    isEqual: differences.length === 0,
    differences,
  };
}
