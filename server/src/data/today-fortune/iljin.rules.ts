// server/src/data/today-fortune/iljin.rules.ts
// 오늘의 운세(일진 기반) 규칙/가중치/템플릿 스켈레톤

export type Aspect = "general" | "work" | "love" | "health" | "money";

export type Ohaeng = "木" | "火" | "土" | "金" | "水";
export type Direction = "東" | "西" | "南" | "北" | "中央";

// 일진(간지)별 기본 규칙
export interface IljinRule {
  base: number; // 기본 점수(0~100 권장)
  keywords: string[]; // 키워드(요약/조언 생성 근거)
  ohaengBias?: Partial<Record<Ohaeng, number>>; // 오행 보정치(±)
  directionBias?: Partial<Record<Direction, number>>; // 방향 보정치(±)
}

// 항목별(일반/업무/연애/건강/재물) 가중치 매트릭스
export const ASPECT_WEIGHT: Record<Aspect, number> = {
  general: 1.0,
  work: 0.9,
  love: 0.9,
  health: 0.8,
  money: 1.0,
};

// 점수 → 밴드 매핑 기준
export const SCORE_BANDS = {
  low: 0, // 0 ~ 39
  mid: 40, // 40 ~ 69
  high: 70, // 70 ~ 100
};

// 밴드별 텍스트 템플릿(간단 스켈레톤)
export const TEMPLATES: Record<
  Aspect,
  {
    low: string[];
    mid: string[];
    high: string[];
  }
> = {
  general: {
    low: ["오늘은 조심스러운 접근이 좋습니다. 계획을 재정비하세요."],
    mid: ["무난한 흐름입니다. 기본에 충실하면 안정적입니다."],
    high: ["활기가 넘칩니다. 새로운 시도를 시작하기에 좋습니다."],
  },
  work: {
    low: ["서두르지 말고 리스크를 줄이세요."],
    mid: ["협업과 정리가 성과로 이어집니다."],
    high: ["주도적 제안이 좋은 결실로 이어집니다."],
  },
  love: {
    low: ["감정적인 말은 피하고 배려에 집중하세요."],
    mid: ["소소한 대화가 관계를 단단하게 합니다."],
    high: ["마음을 표현하면 좋은 반응을 얻습니다."],
  },
  health: {
    low: ["과로를 피하고 충분한 휴식을 취하세요."],
    mid: ["가벼운 운동과 수분 섭취에 신경 쓰세요."],
    high: ["컨디션이 좋습니다. 규칙적인 루틴을 유지하세요."],
  },
  money: {
    low: ["충동 지출을 삼가고 관망이 유리합니다."],
    mid: ["지출/수입 균형에 신경 쓰면 안정적입니다."],
    high: ["기회 포착에 유리한 날입니다. 계획된 투자가 좋습니다."],
  },
};

// 60갑자 일부 샘플 규칙(확장 예정)
export const ILJIN_BASE_RULES: Record<string, IljinRule> = {
  // 갑자(甲子) — 새로움, 시작, 유연성
  甲子: {
    base: 72,
    keywords: ["시작", "성장", "유연성"],
    ohaengBias: { 木: 6, 水: 3, 金: -3 },
    directionBias: { 東: 2, 北: 1 },
  },
  // 병인(丙寅) — 추진, 활력, 낙관
  丙寅: {
    base: 78,
    keywords: ["추진", "열정", "활력"],
    ohaengBias: { 火: 6, 木: 3, 水: -4 },
    directionBias: { 南: 2, 東: 1 },
  },
  // 정유(丁酉) — 세밀, 규범, 정리
  丁酉: {
    base: 65,
    keywords: ["정리", "질서", "디테일"],
    ohaengBias: { 火: 4, 金: 3, 木: -3 },
    directionBias: { 南: 1, 西: 1 },
  },
};

// 유틸: 점수를 밴드로 변환
export function scoreToBand(score: number): keyof typeof SCORE_BANDS | "mid" {
  if (score >= SCORE_BANDS.high) return "high";
  if (score >= SCORE_BANDS.mid) return "mid";
  return "low";
}

// 유틸: 간단 점수 합성(베이스 + 오행/방향 보정)
export function computeIljinScore(
  ganji: string,
  ohaengGan: Ohaeng,
  direction: Direction
): number {
  const rule = ILJIN_BASE_RULES[ganji];
  if (!rule) return 50; // 기본값
  const base = rule.base;
  const oh = rule.ohaengBias?.[ohaengGan] ?? 0;
  const dir = rule.directionBias?.[direction] ?? 0;
  const total = Math.max(0, Math.min(100, base + oh + dir));
  return total;
}
