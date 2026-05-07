// server/src/data/sinsal/types.ts
// 통합된 신살 규칙 타입 정의

export type GanjiRule = { type: "ganji"; values: string[] };

export type PairRule = {
  type: "pair";
  base: "dayJi" | "yearJi" | "ji"; // 통합된 base 타입
  pairs: { [key: string]: string };
  allowedPositions?: ("year" | "month" | "day" | "hour")[];
};

export type AdjacentPairRule = {
  type: "adjacentPair";
  base: "dayJi" | "yearJi";
  pairs: { [key: string]: string };
  // 인접한 기둥만 확인: year-month, month-day, day-hour
};

export type DayHourPairRule = {
  type: "dayHourPair";
  base: "dayGan";
  target: "ji";
  rules: { [key: string]: string[] };
  // 일주(일간+일지)와 시주(시간+시지) 간의 관계만 확인
};

export type PillarPairRule = {
  type: "pillarPair";
  pillar1: "day"; // 첫 번째 기둥 (일주)
  pillar2: "hour"; // 두 번째 기둥 (시주)
  rules: { [key: string]: string[] }; // 일주-시주 조합 규칙
  // 예: { "丙午": ["甲子", "庚子"], "丁未": ["乙丑", "辛丑"] }
};

export type MonthBasedRule = {
  type: "monthBased";
  base: "monthJi"; // 월지 기준
  target: "dayHour"; // 일지 또는 시지 중 하나
  rules: { [key: string]: string }; // 월지 -> 일지/시지 규칙
  // 예: { "子": "巳", "午": "巳", "卯": "巳", "酉": "巳" }
};

export type AllGanRule = {
  type: "allGan";
  base: "allGan"; // 모든 천간 기준
  target: "ji"; // 지지에서 확인
  rules: { [key: string]: string | string[] }; // 천간 -> 찾을 지지 규칙 (단일 또는 배열)
  // 예: { "甲": "午", "乙": ["寅", "申"] }
};

export type CriteriaRule = {
  type: "criteria";
  base:
    | "dayGan"
    | "dayJi"
    | "monthJi"
    | "yearJi"
    | "hourJi"
    | "hourGan"
    | "yearGan"
    | "monthGan"; // 통합된 base 타입
  target: "gan" | "ji"; // 통합된 target 타입 (dayji는 ji로 처리)
  rules: { [key: string]: string | string[] };
};

export type ComplexCriteriaRule = {
  type: "complexCriteria";
  base: "dayGan" | "dayJi" | "monthJi" | "yearJi";
  target: "gan" | "ji";
  rules: { [key: string]: string[] }; // 모든 조건이 동시에 만족되어야 함
};

export type ComplexRule = {
  type: "complex";
  conditions: {
    hasAny?: string[]; // 하나라도 있으면
    hasRepeat?: string[]; // 같은 글자 반복
    hasAll?: string[]; // 모두 있어야 함
  };
};

export type GongmangRule = { type: "gongmang" };

// 통합된 SinsalRule 타입
export type SinsalRule =
  | GanjiRule
  | PairRule
  | AdjacentPairRule
  | DayHourPairRule
  | PillarPairRule
  | MonthBasedRule
  | AllGanRule
  | CriteriaRule
  | ComplexCriteriaRule
  | ComplexRule
  | GongmangRule;
