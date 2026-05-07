// src/services/sinsal.service.ts
// jjhome 만세력 엔辰 - 통합 申살(神殺) 계산 서비스 v3 (타입-안전, 전체 규칙 적용)
// 12申살과 酉산 코드의 모든 길申/흉살을 명확한 타입과 구조로 계산한다.

/* import { GANJI } from "../data/saju.data"; */
import type { StarElement } from "../types/saju.d";

// -----------------------------------------------------------------------------
// 1. 타입 및 데이터 정의 (Types & Data Definitions)
// -----------------------------------------------------------------------------

type PillarKey = "year" | "month" | "day" | "hour" | "daewoon" | "sewoon";
type Pillar = { key: PillarKey; gan: string; ji: string; ganji: string };
type SajuInfo = {
  pillars: Pillar[];
  dayGan: string;
  dayJi: string;
  monthJi: string;
  yearJi: string;
  dayGanji: string;
  gender: "M" | "W";
};
export type SinsalHit = { name: string; elements: StarElement[] };
export type SinsalResult = { [key in PillarKey]: SinsalHit[] };

type BaseKey = "dayGan" | "dayJi" | "monthJi" | "yearJi";

// 申살 규칙의 종류를 명확한 타입으로 정의
type GanjiRule = { type: "ganji"; values: string[] };
type PairRule = {
  type: "pair";
  base: "dayJi" | "yearJi";
  pairs: { [key: string]: string };
  allowedPositions?: ("year" | "month" | "day" | "hour")[];
};
type AdjacentPairRule = {
  type: "adjacentPair";
  base: "dayJi" | "yearJi";
  pairs: { [key: string]: string };
  // 인접한 기둥만 확인: year-month, month-day, day-hour
};
type DayHourPairRule = {
  type: "dayHourPair";
  base: "dayGan";
  target: "ji";
  rules: { [key: string]: string[] };
  // 일주(일간+일지)와 시주(시간+시지) 간의 관계만 확인
};
type PillarPairRule = {
  type: "pillarPair";
  pillar1: "day"; // 첫 번째 기둥 (일주)
  pillar2: "hour"; // 두 번째 기둥 (시주)
  rules: { [key: string]: string[] }; // 일주-시주 조합 규칙
  // 예: { "丙午": ["甲子", "庚子"], "丁未": ["乙丑", "辛丑"] }
};
type MonthBasedRule = {
  type: "monthBased";
  base: "monthJi"; // 월지 기준
  target: "dayHour"; // 일지 또는 시지 중 하나
  rules: { [key: string]: string }; // 월지 -> 일지/시지 규칙
  // 예: { "子": "巳", "午": "巳", "卯": "巳", "酉": "巳" }
};
type AllGanRule = {
  type: "allGan";
  base: "allGan"; // 모든 천간 기준
  target: "ji"; // 지지에서 확인
  rules: { [key: string]: string | string[] }; // 천간 -> 찾을 지지 규칙 (단일 또는 배열)
  // 예: { "甲": "午", "乙": ["寅", "申"] }
};
type CriteriaRule = {
  type: "criteria";
  base: BaseKey;
  target: "gan" | "ji";
  rules: { [key: string]: string | string[] };
};
type ComplexCriteriaRule = {
  type: "complexCriteria";
  base: BaseKey;
  target: "gan" | "ji";
  rules: { [key: string]: string[] }; // 모든 조건이 동시에 만족되어야 함
};
type ComplexRule = {
  type: "complex";
  conditions: {
    hasAny?: string[]; // 하나라도 있으면
    hasRepeat?: string[]; // 같은 글자 반복
    hasAll?: string[]; // 모두 있어야 함
  };
};
type GongmangRule = { type: "gongmang" };
type SinsalRule = GanjiRule | PairRule | AdjacentPairRule | DayHourPairRule | PillarPairRule | MonthBasedRule | AllGanRule | CriteriaRule | ComplexCriteriaRule | ComplexRule | GongmangRule;

// [주석] 규칙 데이터 분리: 길신/흉신/12신살
import {
  SINSAL_12_MAP,
  getSamhapGroup,
  SINSAL_RULES_AUSPICIOUS,
  SINSAL_RULES_INAUSPICIOUS,
} from "../data/sinsal";
const SINSAL_RULES: Record<string, SinsalRule> = {
  ...(SINSAL_RULES_AUSPICIOUS as unknown as Record<string, SinsalRule>),
  ...(SINSAL_RULES_INAUSPICIOUS as unknown as Record<string, SinsalRule>),
};

// 12신살 맵/그룹 판정은 데이터 모듈에서 import

/* // 12申살 규칙 데이터
const SINSAL_12_NAMES = [
  "겁살",
  "재살",
  "천살",
  "지살",
  "연살",
  "월살",
  "망申살",
  "장성살",
  "반안살",
  "역마살",
  "육亥살",
  "화개살",
];
const SINSAL_12_GROUP_START_INDEX: { [key: string]: number } = {
  亥: 9,
  卯: 9,
  未: 9,
  寅: 0,
  午: 0,
  戌: 0,
  巳: 3,
  酉: 3,
  丑: 3,
  申: 6,
  子: 6,
  辰: 6,
};
const JIJI_ORDER_FOR_12SINSAL = [
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
  "子",
  "丑",
]; */

// -----------------------------------------------------------------------------
// 2. 申살 계산 엔辰 (Sinsal Calculation Engine)
// -----------------------------------------------------------------------------

// [주석] 성별에 따라 달라지는 특수 申살(고申, 과숙)을 계산하는 함수
/* function calculateGoshinGwasuk(saju: SajuInfo, result: SinsalResult) {
  const { gender, yearJi, pillars } = saju;
  const GOSHIN_RULE: { [key: string]: string } = {
    "寅,卯,辰": "巳",
    "巳,午,未": "申",
    "申,酉,戌": "亥",
    "亥,子,丑": "寅",
  };
  const GWASUK_RULE: { [key: string]: string } = {
    "寅,卯,辰": "丑",
    "巳,午,未": "辰",
    "申,酉,戌": "未",
    "亥,子,丑": "戌",
  };

  const rule = gender === "M" ? GOSHIN_RULE : GWASUK_RULE;
  const sinsalName = gender === "M" ? "고申" : "과숙";

  for (const [key, targetJi] of Object.entries(rule)) {
    if (key.split(",").includes(yearJi)) {
      pillars.forEach((p) => {
        if (p.ji === targetJi) {
          // 이름(string) 대申, 근원지 정보를 담은 객체(SinsalHit)를 push 합니다.
          result[p.key].push({
            name: sinsalName,
            elements: [
              { pillar: "year", type: "ji", character: yearJi }, // 기준이 된 년지
              { pillar: p.key, type: "ji", character: p.ji }, // 결과가 나타난 지지
            ],
          });
        }
      });
    }
  }
}

// [주석] 일주를 기준으로 공망을 계산하는 함수
function calculateGongmang(saju: SajuInfo, result: SinsalResult) {
  const GONGMANG_MAP: { [key: string]: string[] } = {
    갑子순: ["戌", "亥"],
    갑戌순: ["申", "酉"],
    갑申순: ["午", "未"],
    갑午순: ["辰", "巳"],
    갑辰순: ["寅", "卯"],
    갑寅순: ["子", "丑"],
  };
  const cycleStart = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
  let currentCycle = "";
  const dayGanjiIndex = GANJI.indexOf(saju.dayGanji);

  for (const start of cycleStart) {
    const startIndex = GANJI.indexOf(start);
    if (dayGanjiIndex >= startIndex && dayGanjiIndex < startIndex + 10) {
      currentCycle = start + "순";
      break;
    }
  }

  const gongmangPair = GONGMANG_MAP[currentCycle];
  if (gongmangPair) {
    saju.pillars.forEach((p) => {
      if (gongmangPair.includes(p.ji)) {
        // 이름(string) 대申, 근원지 정보를 담은 객체(SinsalHit)를 push 합니다.
        result[p.key].push({
          name: "공망",
          elements: [
            { pillar: "day", type: "gan", character: saju.dayGan }, // 기준이 된 일간
            { pillar: "day", type: "ji", character: saju.dayJi }, // 기준이 된 일지
            { pillar: p.key, type: "ji", character: p.ji }, // 결과가 나타난 지지
          ],
        });
      }
    });
  }
} */

/**
 * 모든 申살을 계산하여 반환하는 메寅 함수
 */
export const getAllSinsals = (
  pillars: { year: string; month: string; day: string; hour: string },
  gender: "M" | "W",
  additionalPillars?: { name: string; gan: string; ji: string }[] // 대운, 세운 등 추가 기둥
): SinsalResult => {
  const pillarArray: Pillar[] = [
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

  // 추가 기둥들 (대운, 세운 등)을 pillarArray에 추가
  if (additionalPillars) {
    additionalPillars.forEach(additionalPillar => {
      pillarArray.push({
        key: additionalPillar.name as PillarKey, // "daewoon", "sewoon" 등
        gan: additionalPillar.gan,
        ji: additionalPillar.ji,
        ganji: additionalPillar.gan + additionalPillar.ji,
      });
    });
  }
  const saju: SajuInfo = {
    pillars: pillarArray,
    dayGan: pillars.day[0],
    dayJi: pillars.day[1],
    monthJi: pillars.month[1],
    yearJi: pillars.year[1],
    dayGanji: pillars.day,
    gender,
  };

  const result: SinsalResult = { 
    year: [], 
    month: [], 
    day: [], 
    hour: [], 
    daewoon: [], 
    sewoon: [] 
  };
  if (!saju.dayJi) return result;

  // 1. 12申살 계산 (각 기둥별 기준으로 다른 기둥들과의 관계 계산)
  // 년지 기준
  const yearGroup = getSamhapGroup(saju.yearJi);
  if (yearGroup) {
    const yearRuleSet = SINSAL_12_MAP[yearGroup];
    saju.pillars.forEach((p) => {
      const sinsalName = yearRuleSet[p.ji];
      if (sinsalName && !result[p.key].some((h) => h.name === sinsalName)) {
        result[p.key].push({
          name: sinsalName,
          elements: [
            { pillar: "year", type: "ji", character: saju.yearJi },
            { pillar: p.key, type: "ji", character: p.ji },
          ],
        });
      }
    });
  }

  // 월지 기준
  const monthGroup = getSamhapGroup(saju.monthJi);
  if (monthGroup) {
    const monthRuleSet = SINSAL_12_MAP[monthGroup];
    saju.pillars.forEach((p) => {
      const sinsalName = monthRuleSet[p.ji];
      if (sinsalName && !result[p.key].some((h) => h.name === sinsalName)) {
        result[p.key].push({
          name: sinsalName,
          elements: [
            { pillar: "month", type: "ji", character: saju.monthJi },
            { pillar: p.key, type: "ji", character: p.ji },
          ],
        });
      }
    });
  }

  // 일지 기준
  const dayGroup = getSamhapGroup(saju.dayJi);
  if (dayGroup) {
    const dayRuleSet = SINSAL_12_MAP[dayGroup];
    saju.pillars.forEach((p) => {
      const sinsalName = dayRuleSet[p.ji];
      if (sinsalName && !result[p.key].some((h) => h.name === sinsalName)) {
        result[p.key].push({
          name: sinsalName,
          elements: [
            { pillar: "day", type: "ji", character: saju.dayJi },
            { pillar: p.key, type: "ji", character: p.ji },
          ],
        });
      }
    });
  }

  // 시지 기준
  const hourPillar = saju.pillars.find(p => p.key === "hour");
  if (hourPillar) {
    const hourGroup = getSamhapGroup(hourPillar.ji);
    console.log(`🔍 시지 기준 계산: 시지=${hourPillar.ji}, 그룹=${hourGroup}`);
    if (hourGroup) {
      const hourRuleSet = SINSAL_12_MAP[hourGroup];
      saju.pillars.forEach((p) => {
        const sinsalName = hourRuleSet[p.ji];
        console.log(`🔍 시지 기준으로 ${p.key}(${p.ji}) → ${sinsalName}`);
        if (sinsalName && !result[p.key].some((h) => h.name === sinsalName)) {
          result[p.key].push({
            name: sinsalName,
            elements: [
              { pillar: "hour", type: "ji", character: hourPillar.ji },
              { pillar: p.key, type: "ji", character: p.ji },
            ],
          });
          console.log(`✅ 시지 기준 신살 추가: ${sinsalName} → ${p.key}`);
        }
      });
    }
  }

  // 2. 기타 申살 계산
  Object.entries(SINSAL_RULES).forEach(([sinsalName, rule]) => {
    switch (rule.type) {
      case "ganji": {
        saju.pillars.forEach((p) => {
          if (rule.values.includes(p.ganji)) {
            result[p.key].push({
              name: sinsalName,
              elements: [
                { pillar: p.key, type: "gan", character: p.gan },
                { pillar: p.key, type: "ji", character: p.ji },
              ],
            });
          }
        });
        break;
      }
      case "pair": {
        const baseValue = saju[rule.base];
        const basePillarKey = rule.base === "dayJi" ? "day" : "year";
        const pairValue = rule.pairs[baseValue];
        if (pairValue) {
          saju.pillars.forEach((p) => {
            if (
              p.ji === pairValue &&
              !result[p.key].some((h) => h.name === sinsalName)
            ) {
              result[p.key].push({
                name: sinsalName,
                elements: [
                  { pillar: basePillarKey, type: "ji", character: baseValue },
                  { pillar: p.key, type: "ji", character: p.ji },
                ],
              });
            }
          });
        }
        break;
      }
      case "adjacentPair": {
        const baseValue = saju[rule.base];
        const basePillarKey = rule.base === "dayJi" ? "day" : "year";
        const pairValue = rule.pairs[baseValue];
        
        if (pairValue) {
          // 인접한 기둥 조합만 확인: year-month, month-day, day-hour
          // 추가로 대운/세운과의 인접 관계도 확인
          const adjacentPairs = [
            { from: "year", to: "month" },
            { from: "month", to: "day" },
            { from: "day", to: "hour" },
            // 대운과의 인접 관계 (대운은 월주 다음/이전이므로 월주와 인접)
            { from: "month", to: "daewoon" },
            { from: "daewoon", to: "month" },
            // 세운과의 인접 관계 (세운은 대운 내에서 년도별이므로 대운과 인접)
            { from: "daewoon", to: "sewoon" },
            { from: "sewoon", to: "daewoon" }
          ];
          
          adjacentPairs.forEach(({ from, to }) => {
            const fromPillar = saju.pillars.find(p => p.key === from);
            const toPillar = saju.pillars.find(p => p.key === to);
            
            if (fromPillar && toPillar) {
              // base가 dayJi인 경우: dayJi와 pairValue가 인접한 기둥에 있는지 확인
              if (rule.base === "dayJi") {
                if ((fromPillar.ji === baseValue && toPillar.ji === pairValue) ||
                    (fromPillar.ji === pairValue && toPillar.ji === baseValue)) {
                  // 두 기둥 모두에 신살 추가
                  [fromPillar, toPillar].forEach(pillar => {
                    if (!result[pillar.key].some((h) => h.name === sinsalName)) {
                      result[pillar.key].push({
                        name: sinsalName,
                        elements: [
                          { pillar: basePillarKey, type: "ji", character: baseValue },
                          { pillar: pillar.key, type: "ji", character: pillar.ji },
                        ],
                      });
                    }
                  });
                }
              }
              // base가 yearJi인 경우: yearJi와 pairValue가 인접한 기둥에 있는지 확인
              else if (rule.base === "yearJi") {
                if ((fromPillar.ji === baseValue && toPillar.ji === pairValue) ||
                    (fromPillar.ji === pairValue && toPillar.ji === baseValue)) {
                  // 두 기둥 모두에 신살 추가
                  [fromPillar, toPillar].forEach(pillar => {
                    if (!result[pillar.key].some((h) => h.name === sinsalName)) {
                      result[pillar.key].push({
                        name: sinsalName,
                        elements: [
                          { pillar: "year", type: "ji", character: baseValue },
                          { pillar: pillar.key, type: "ji", character: pillar.ji },
                        ],
                      });
                    }
                  });
                }
              }
            }
          });
        }
        break;
      }
      case "dayHourPair": {
        const dayGan = saju.dayGan;
        const dayJi = saju.dayJi;
        const hourJi = saju.pillars.find(p => p.key === "hour")?.ji;
        
        if (!hourJi) break;
        
        for (const [key, targets] of Object.entries(rule.rules)) {
          if (key.split(",").includes(dayGan)) {
            // 일간이 조건에 맞고, 일지와 시지가 targets에 포함되는지 확인
            if (targets.includes(dayJi) && targets.includes(hourJi)) {
              // 일주와 시주 모두에 신살 추가
              const dayPillar = saju.pillars.find(p => p.key === "day");
              const hourPillar = saju.pillars.find(p => p.key === "hour");
              
              if (dayPillar && !result.day.some((h) => h.name === sinsalName)) {
                result.day.push({
                  name: sinsalName,
                  elements: [
                    { pillar: "day", type: "gan", character: dayGan },
                    { pillar: "day", type: "ji", character: dayJi },
                    { pillar: "hour", type: "ji", character: hourJi },
                  ],
                });
              }
              
              if (hourPillar && !result.hour.some((h) => h.name === sinsalName)) {
                result.hour.push({
                  name: sinsalName,
                  elements: [
                    { pillar: "day", type: "gan", character: dayGan },
                    { pillar: "day", type: "ji", character: dayJi },
                    { pillar: "hour", type: "ji", character: hourJi },
                  ],
                });
              }
            }
          }
        }
        break;
      }
      case "pillarPair": {
        const pillar1Pillar = saju.pillars.find(p => p.key === rule.pillar1);
        const pillar2Pillar = saju.pillars.find(p => p.key === rule.pillar2);
        
        if (!pillar1Pillar || !pillar2Pillar) break;
        
        const pillar1Ganji = pillar1Pillar.gan + pillar1Pillar.ji;
        const pillar2Ganji = pillar2Pillar.gan + pillar2Pillar.ji;
        
        // 일주-시주 조합이 규칙에 있는지 확인
        for (const [pillar1Key, pillar2Targets] of Object.entries(rule.rules)) {
          if (pillar1Key === pillar1Ganji && pillar2Targets.includes(pillar2Ganji)) {
            // 두 기둥 모두에 신살 추가
            if (!result[rule.pillar1].some((h) => h.name === sinsalName)) {
              result[rule.pillar1].push({
                name: sinsalName,
                elements: [
                  { pillar: rule.pillar1, type: "gan", character: pillar1Pillar.gan },
                  { pillar: rule.pillar1, type: "ji", character: pillar1Pillar.ji },
                  { pillar: rule.pillar2, type: "gan", character: pillar2Pillar.gan },
                  { pillar: rule.pillar2, type: "ji", character: pillar2Pillar.ji },
                ],
              });
            }
            
            if (!result[rule.pillar2].some((h) => h.name === sinsalName)) {
              result[rule.pillar2].push({
                name: sinsalName,
                elements: [
                  { pillar: rule.pillar1, type: "gan", character: pillar1Pillar.gan },
                  { pillar: rule.pillar1, type: "ji", character: pillar1Pillar.ji },
                  { pillar: rule.pillar2, type: "gan", character: pillar2Pillar.gan },
                  { pillar: rule.pillar2, type: "ji", character: pillar2Pillar.ji },
                ],
              });
            }
          }
        }
        break;
      }
      case "monthBased": {
        const monthJi = saju.monthJi;
        const targetJi = rule.rules[monthJi];
        
        if (targetJi) {
          // 일지와 시지 중 하나에 targetJi가 있는지 확인
          const dayPillar = saju.pillars.find(p => p.key === "day");
          const hourPillar = saju.pillars.find(p => p.key === "hour");
          
          if (dayPillar && dayPillar.ji === targetJi) {
            // 일지에 부벽살 적용
            if (!result.day.some((h) => h.name === sinsalName)) {
              result.day.push({
                name: sinsalName,
                elements: [
                  { pillar: "month", type: "ji", character: monthJi },
                  { pillar: "day", type: "ji", character: targetJi },
                ],
              });
            }
          }
          
          if (hourPillar && hourPillar.ji === targetJi) {
            // 시지에 부벽살 적용
            if (!result.hour.some((h) => h.name === sinsalName)) {
              result.hour.push({
                name: sinsalName,
                elements: [
                  { pillar: "month", type: "ji", character: monthJi },
                  { pillar: "hour", type: "ji", character: targetJi },
                ],
              });
            }
          }
        }
        break;
      }
      case "allGan": {
        // 모든 천간(년간, 월간, 일간, 시간)에서 해당 천간이 있으면 그 기둥의 지지 확인
        saju.pillars.forEach(pillar => {
          for (const [ganKey, targetJiValue] of Object.entries(rule.rules)) {
            const ganList = ganKey.split(",");
            if (ganList.includes(pillar.gan)) {
              // targetJiValue가 배열인지 문자열인지 확인
              const targetJiList = Array.isArray(targetJiValue) ? targetJiValue : [targetJiValue];
              
              if (targetJiList.includes(pillar.ji)) {
                if (!result[pillar.key].some((h) => h.name === sinsalName)) {
                  result[pillar.key].push({
                    name: sinsalName,
                    elements: [
                      { pillar: pillar.key, type: "gan", character: pillar.gan },
                      { pillar: pillar.key, type: "ji", character: pillar.ji },
                    ],
                  });
                }
              }
            }
          }
        });
        break;
      }
      case "criteria": {
        const criteriaBase = saju[rule.base];

        if (sinsalName === "천을귀인") {
          console.log(`\n--- [디버깅] '천을귀인' 규칙 확인 시작 ---`);
          console.log(`- 기준 글자 (일간): "${criteriaBase}"`);
        }

        for (const [key, target] of Object.entries(rule.rules)) {
          if (key.split(",").includes(criteriaBase)) {
            if (sinsalName === "천을귀인") {
              console.log(
                `- 일치하는 규칙 발견: key="${key}", target="${target}"`
              );
            }

            saju.pillars.forEach((p) => {
              const targetValue = rule.target === "gan" ? p.gan : p.ji;
              const targets = Array.isArray(target) ? target : [target];

              if (sinsalName === "천을귀인") {
                console.log(
                  `- 기둥 "${
                    p.key
                  }" 확인 중... 지지: "${targetValue}". 규칙: [${targets.join(
                    ","
                  )}] 포함 여부: ${targets.includes(targetValue)}`
                );
              }

              if (
                targets.includes(targetValue) &&
                !result[p.key].some((h) => h.name === sinsalName)
              ) {
                const basePillarKey = rule.base
                  .replace("Gan", "")
                  .replace("Ji", "") as PillarKey;
                const baseType = rule.base.includes("Gan") ? "gan" : "ji";
                result[p.key].push({
                  name: sinsalName,
                  elements: [
                    {
                      pillar: basePillarKey,
                      type: baseType,
                      character: criteriaBase,
                    },
                    {
                      pillar: p.key,
                      type: rule.target,
                      character: targetValue,
                    },
                  ],
                });
              }
            });
          }
        }
        break;
      }
      case "complexCriteria": {
        const criteriaBase = saju[rule.base];

        for (const [key, targets] of Object.entries(rule.rules)) {
          if (key.split(",").includes(criteriaBase)) {
            // 모든 조건이 동시에 만족되는지 확인
            const allTargetsPresent = targets.every((target) =>
              saju.pillars.some((p) => {
                const targetValue = rule.target === "gan" ? p.gan : p.ji;
                return targetValue === target;
              })
            );

            if (allTargetsPresent) {
              // 모든 조건이 만족되면 각 기둥에 신살 추가
              saju.pillars.forEach((p) => {
                const targetValue = rule.target === "gan" ? p.gan : p.ji;
                if (
                  targets.includes(targetValue) &&
                  !result[p.key].some((h) => h.name === sinsalName)
                ) {
                  const basePillarKey = rule.base
                    .replace("Gan", "")
                    .replace("Ji", "") as PillarKey;
                  const baseType = rule.base.includes("Gan") ? "gan" : "ji";
                  result[p.key].push({
                    name: sinsalName,
                    elements: [
                      {
                        pillar: basePillarKey,
                        type: baseType,
                        character: criteriaBase,
                      },
                      {
                        pillar: p.key,
                        type: rule.target,
                        character: targetValue,
                      },
                    ],
                  });
                }
              });
            }
          }
        }
        break;
      }
      case "complex": {
        const { conditions } = rule;
        let isMatched = false;

        // hasAny 조건: 하나라도 있으면 성립
        if (conditions.hasAny) {
          const hasAnyMatch = conditions.hasAny.some((char) =>
            saju.pillars.some((p) => p.ji === char || p.gan === char)
          );
          if (hasAnyMatch) isMatched = true;
        }

        // hasRepeat 조건: 같은 글자 반복
        if (conditions.hasRepeat) {
          const hasRepeatMatch = conditions.hasRepeat.some((char) => {
            const charCount = saju.pillars.filter(
              (p) => p.ji === char || p.gan === char
            ).length;
            return charCount >= 2;
          });
          if (hasRepeatMatch) isMatched = true;
        }

        // hasAll 조건: 모두 있어야 함
        if (conditions.hasAll) {
          const hasAllMatch = conditions.hasAll.every((char) =>
            saju.pillars.some((p) => p.ji === char || p.gan === char)
          );
          if (hasAllMatch) isMatched = true;
        }

        // 조건이 성립되면 모든 기둥에 신살 추가
        if (isMatched) {
          saju.pillars.forEach((p) => {
            if (!result[p.key].some((h) => h.name === sinsalName)) {
              result[p.key].push({
                name: sinsalName,
                elements: saju.pillars.map((pillar) => ({
                  pillar: pillar.key,
                  type: "ji" as const,
                  character: pillar.ji,
                })),
              });
            }
          });
        }
        break;
      }
      case "gongmang": {
        // 6개 갑(甲) 시작 10순 기준 공망 지지쌍 판정
        const GONGMANG_MAP: { [key: string]: string[] } = {
          "甲子": ["戌", "亥"],
          "甲戌": ["申", "酉"],
          "甲申": ["午", "未"],
          "甲午": ["辰", "巳"],
          "甲辰": ["寅", "卯"],
          "甲寅": ["子", "丑"],
        };
        const cycleStart = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
        const GANJI_60 = [
          "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
          "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
          "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
          "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
          "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
          "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥",
        ];

        const idx = GANJI_60.indexOf(saju.dayGanji);
        if (idx >= 0) {
          let startKey = "";
          for (const start of cycleStart) {
            const sIdx = GANJI_60.indexOf(start);
            if (idx >= sIdx && idx < sIdx + 10) { startKey = start; break; }
          }
          const pair = startKey ? GONGMANG_MAP[startKey] : undefined;
          if (pair) {
            saju.pillars.forEach((p) => {
              if (pair.includes(p.ji) && !result[p.key].some((h) => h.name === sinsalName)) {
                result[p.key].push({
                  name: sinsalName,
                  elements: [
                    { pillar: "day", type: "gan", character: saju.dayGan },
                    { pillar: "day", type: "ji", character: saju.dayJi },
                    { pillar: p.key, type: "ji", character: p.ji },
                  ],
                });
              }
            });
          }
        }
        break;
      }
    }
  });

  return result;
};
