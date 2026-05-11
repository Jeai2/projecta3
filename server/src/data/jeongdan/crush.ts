/**
 * 육임정단 해석 — 짝사랑 (연애 카테고리)
 *
 * 방재이 스승님 실전 해석 flow 기반.
 * 사과/삼전/천지반도를 종합하여 Q1~Q7 각 질문에 대해 해석을 생성.
 *
 * 용어:
 * - 천반(sangsin): 사과 각 과의 상신
 * - 천장(cheonjang): 12천장 (貴蛇朱合句靑空白常玄陰后)
 * - 둔간(dunggan): 숨은 천간 또는 "공망"
 * - 기궁(gigung): 일간의 체(體) 자리
 */

import type { Sagwa, Samjeon, CheonjibandoPair, WoljangJi, Cheonjang } from "../../services/lukim.service";

// ══════════════════════════════════════════════════════════════════════════════
// 점수 체계 (10점 만점)
// ══════════════════════════════════════════════════════════════════════════════

const YUKHAP_SCORE: Record<string, number> = {
  "子丑": 10, "丑子": 10,
  "午未": 9.5, "未午": 9.5,
  "辰酉": 9, "酉辰": 9,
  "寅亥": 9, "亥寅": 9,
  "卯戌": 8, "戌卯": 8,
  "巳申": 8, "申巳": 8,
};

const BANHAP_SCORE: Record<string, number> = {
  "寅午": 9, "午寅": 9,
  "午戌": 9, "戌午": 9,
  "申子": 9, "子申": 9,
  "子辰": 5, "辰子": 5,
  "亥卯": 9, "卯亥": 9,
  "卯未": 5, "未卯": 5,
  "巳酉": 5, "酉巳": 5,
  "酉丑": 9, "丑酉": 9,
};

/** 오행 생하는 관계 쌍 (모두 8점) */
const SAENG_PAIRS = new Set([
  "子寅", "丑申", "丑酉", "寅午", "卯巳", "辰申", "辰酉",
  "巳辰", "巳丑", "巳未", "午辰", "午戌", "午未",
  "未申", "未酉", "申子", "酉亥", "戌申", "亥卯",
]);

/** 충 (0점 - 최우선) */
const CHUNG_PAIRS = new Set([
  "丑未", "未丑", "寅申", "申寅", "卯酉", "酉卯",
  "辰戌", "戌辰", "巳亥", "亥巳", "午子", "子午",
]);

/** 오행 극하는 관계 (2점) */
const GEUK_PAIRS = new Set([
  "辰亥", "辰子", "戌亥", "戌子", "亥午", "子巳",
  "午申", "午酉", "申卯", "酉寅", "寅丑", "寅未", "卯丑",
]);

/** 형 (2점) */
const HYUNG_PAIRS = new Set([
  "寅巳", "巳寅", "申寅", "寅申", // 인사형 중 인사/신인
  "丑戌", "戌丑", "戌未", "未戌", "未丑", "丑未",
  "子卯", "卯子",
  "辰辰", "午午", "酉酉", "亥亥",
]);

/** 파 (2.5점) */
const PA_PAIRS = new Set([
  "子酉", "酉子", "丑辰", "辰丑", "寅亥", "亥寅",
  "午卯", "卯午", "戌未", "未戌",
]);

/** 해 (3점) */
const HAE_PAIRS = new Set([
  "子未", "未子", "丑午", "午丑", "申亥", "亥申",
  "卯辰", "辰卯", "酉戌", "戌酉",
]);

/**
 * 두 지지 간 관계 점수를 계산한다.
 * 충이 있으면 무조건 0점 (최우선).
 * 나머지는 가장 높은 점수를 반환.
 */
export function calculateRelationScore(ji1: string, ji2: string): number {
  const key = `${ji1}${ji2}`;

  // 충이 최우선 (0점)
  if (CHUNG_PAIRS.has(key)) return 0;

  let maxScore = -1;

  // 육합
  const yukhapScore = YUKHAP_SCORE[key];
  if (yukhapScore !== undefined) maxScore = Math.max(maxScore, yukhapScore);

  // 반합
  const banhapScore = BANHAP_SCORE[key];
  if (banhapScore !== undefined) maxScore = Math.max(maxScore, banhapScore);

  // 생
  if (SAENG_PAIRS.has(key) || SAENG_PAIRS.has(`${ji2}${ji1}`)) {
    maxScore = Math.max(maxScore, 8);
  }

  // 해
  if (HAE_PAIRS.has(key)) maxScore = Math.max(maxScore, 3);

  // 파
  if (PA_PAIRS.has(key)) maxScore = Math.max(maxScore, 2.5);

  // 형
  if (HYUNG_PAIRS.has(key)) maxScore = Math.max(maxScore, 2);

  // 극
  if (GEUK_PAIRS.has(key) || GEUK_PAIRS.has(`${ji2}${ji1}`)) {
    maxScore = Math.max(maxScore, 2);
  }

  // 아무 관계도 없으면 기본 5점 (중립)
  return maxScore >= 0 ? maxScore : 5;
}

// ══════════════════════════════════════════════════════════════════════════════
// 보너스/패널티
// ══════════════════════════════════════════════════════════════════════════════

/** 일간 → 기궁 */
const GIGUNG_MAP: Record<string, string> = {
  "甲": "寅", "乙": "辰", "丙": "巳", "丁": "未",
  "戊": "巳", "己": "未", "庚": "申", "辛": "戌",
  "壬": "亥", "癸": "丑",
};

/** 일간을 돕는 지지 (생해주는 + 뿌리) */
const HELPING_JI: Record<string, string[]> = {
  "甲": ["子", "亥", "寅", "卯"], "乙": ["子", "亥", "寅", "卯"],
  "丙": ["寅", "卯", "巳", "午"], "丁": ["寅", "卯", "巳", "午"],
  "戊": ["巳", "午", "辰", "戌", "丑", "未"], "己": ["巳", "午", "辰", "戌", "丑", "未"],
  "庚": ["辰", "戌", "丑", "未", "申", "酉"], "辛": ["辰", "戌", "丑", "未", "申", "酉"],
  "壬": ["申", "酉", "子", "亥"], "癸": ["申", "酉", "子", "亥"],
};

/** 보너스 판정 */
function calcBonus(
  ilgan: string,
  ilji: string,
  sagwa: Sagwa,
): number {
  let bonus = 0;
  const gigung = GIGUNG_MAP[ilgan];

  // 일간 기궁과 3과 천반이 같을 때 +5
  if (gigung && sagwa.gw3.sangsin === gigung) bonus += 5;

  // 일지와 1과 천반이 같을 때 +5
  if (sagwa.gw1.sangsin === ilji) bonus += 5;

  return bonus;
}

/** 패널티 판정 */
function calcPenalty(sagwa: Sagwa): { gw1Penalty: number; gw3Penalty: number } {
  let gw1Penalty = 0;
  let gw3Penalty = 0;

  // 1과 둔간 공망 또는 천장 천공
  if (sagwa.gw1.dunggan === "공망" || sagwa.gw1.cheonjang === "空") gw1Penalty -= 3;

  // 3과 둔간 공망 또는 천장 천공
  if (sagwa.gw3.dunggan === "공망" || sagwa.gw3.cheonjang === "空") gw3Penalty -= 3;

  return { gw1Penalty, gw3Penalty };
}

// ══════════════════════════════════════════════════════════════════════════════
// 과 1차 판단
// ══════════════════════════════════════════════════════════════════════════════

export type GwaType = "원수과" | "중심과" | "지일과" | "지일과2"
  | "섭해과" | "요극과" | "묘성과" | "별책과"
  | "팔전과" | "복음과" | "반음과";

const GWA_FIRST_IMPRESSION: Record<string, string> = {
  "원수과": "비교적 순탄한 흐름. 한쪽의 마음이 명확하게 향하고 있어요.",
  "중심과": "상대방이 먼저 의식하고 있을 수 있어요. 흐름이 들어오고 있는 상태.",
  "지일과": "갈림길. 두 가지 감정 사이에서 흔들리고 있어요.",
  "지일과2": "강한 끌림이 있지만, 그만큼 충돌도 예상돼요.",
  "섭해과": "엇갈림. 타이밍이 안 맞거나 서로 다른 곳을 보고 있어요.",
  "요극과": "밀고 당기는 기운. 긴장감 속에 관심이 숨어 있어요.",
  "묘성과": "미묘하고 읽기 어려운 상태. 아직 흐름이 정해지지 않았어요.",
  "별책과": "특수한 인연. 일반적인 방법으로는 접근이 어려워요.",
  "팔전과": "정체. 서로 움직이지 않고 있는 상태예요.",
  "복음과": "마음속에 담아두기만 하는 상태. 표현이 안 되고 있어요.",
  "반음과": "급변. 갑자기 상황이 뒤집히거나 예상 밖의 전개가 올 수 있어요.",
  "불비과": "극구 반대. 가능성이 거의 없는 흐름이에요.",
};

// ══════════════════════════════════════════════════════════════════════════════
// 십성 판별 (둔간 기준)
// ══════════════════════════════════════════════════════════════════════════════

const GAN_OHENG: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火",
  "戊": "土", "己": "土", "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
};

const OHENG_GEUK: Record<string, string> = {
  "木": "土", "土": "水", "水": "火", "火": "金", "金": "木",
};

const OHENG_SAENG: Record<string, string> = {
  "木": "火", "火": "土", "土": "金", "金": "水", "水": "木",
};

export type Sipsin = "비겁" | "식상" | "재성" | "관성" | "인성";

export function getSipsinOfGan(ilgan: string, targetGan: string): Sipsin | null {
  if (!ilgan || !targetGan || targetGan === "공망") return null;
  const ilOheng = GAN_OHENG[ilgan];
  const targetOheng = GAN_OHENG[targetGan];
  if (!ilOheng || !targetOheng) return null;

  if (ilOheng === targetOheng) return "비겁";
  if (OHENG_SAENG[ilOheng] === targetOheng) return "식상";
  if (OHENG_GEUK[ilOheng] === targetOheng) return "재성";
  if (OHENG_GEUK[targetOheng] === ilOheng) return "관성";
  if (OHENG_SAENG[targetOheng] === ilOheng) return "인성";
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 12신살 판별 (일지 기준)
// ══════════════════════════════════════════════════════════════════════════════

const SINSAL_ORDER = ["겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];

const SINSAL_START: Record<string, string> = {
  "申子辰": "巳", "寅午戌": "亥", "亥卯未": "申", "巳酉丑": "寅",
};

const SAMHAP_GROUP_MAP: Record<string, string> = {
  "申": "申子辰", "子": "申子辰", "辰": "申子辰",
  "寅": "寅午戌", "午": "寅午戌", "戌": "寅午戌",
  "亥": "亥卯未", "卯": "亥卯未", "未": "亥卯未",
  "巳": "巳酉丑", "酉": "巳酉丑", "丑": "巳酉丑",
};

const JI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export function getSinsalOfJi(baseJi: string, targetJi: string): string | null {
  const group = SAMHAP_GROUP_MAP[baseJi];
  if (!group) return null;
  const startJi = SINSAL_START[group];
  if (!startJi) return null;

  const startIdx = JI_ORDER.indexOf(startJi);
  const targetIdx = JI_ORDER.indexOf(targetJi);
  if (startIdx < 0 || targetIdx < 0) return null;

  const offset = (targetIdx - startIdx + 12) % 12;
  return SINSAL_ORDER[offset] ?? null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 길장/흉장 분류
// ══════════════════════════════════════════════════════════════════════════════

const GILJANG: Cheonjang[] = ["貴", "合", "靑", "常", "陰", "后"];
const GILJANG_MALE: Cheonjang[] = ["貴", "合", "靑", "常", "陰", "后"];
const GILJANG_FEMALE: Cheonjang[] = ["貴", "合", "靑", "常"];

export function isGiljang(cheonjang: Cheonjang | undefined, gender: "M" | "W"): boolean {
  if (!cheonjang) return false;
  return gender === "M"
    ? GILJANG_MALE.includes(cheonjang)
    : GILJANG_FEMALE.includes(cheonjang);
}

// ══════════════════════════════════════════════════════════════════════════════
// Q1~Q7 해석 함수
// ══════════════════════════════════════════════════════════════════════════════

export interface CrushInterpretationInput {
  sagwa: Sagwa;
  samjeon: Samjeon;
  cheonjibando: CheonjibandoPair[];
  ilgan: string;
  ilji: string;
  gender: "M" | "W"; // 질문자 성별
}

export interface CrushInterpretationResult {
  gwaFirstImpression: string;
  q1: { score: number; positive: boolean; summary: string };
  q2: { suspicious: boolean; reason: string };
  q3: { possible: boolean; conditions: string[] };
  q4: { score: number; positive: boolean; summary: string };
  q5: { action: "approach" | "wait"; reasons: string[] };
  q6: { bestDay: string | null; method: string };
  q7: { warning: string; detail: string };
}

/**
 * 짝사랑 육임정단 해석을 생성한다.
 */
export function interpretCrush(input: CrushInterpretationInput): CrushInterpretationResult {
  const { sagwa, samjeon, cheonjibando, ilgan, ilji, gender } = input;

  // 1차 판단: 과 이름
  const gwaFirstImpression = GWA_FIRST_IMPRESSION[samjeon.gwaName] ?? "흐름을 읽고 있어요.";

  // 보너스/패널티
  const bonus = calcBonus(ilgan, ilji, sagwa);
  const { gw1Penalty, gw3Penalty } = calcPenalty(sagwa);

  // ── Q1: 이성으로 보는가? ──
  const q1 = interpretQ1(sagwa, gender, bonus, gw1Penalty, gw3Penalty);

  // ── Q2: 다른 사람 있는가? ──
  const q2 = interpretQ2(sagwa, gender);

  // ── Q3: 사귈 수 있는가? ──
  const q3 = interpretQ3(sagwa, samjeon, ilgan);

  // ── Q4: 오래 가는가? ──
  const q4 = interpretQ4(sagwa, ilgan, ilji, gender, bonus);

  // ── Q5: 들이대야 하는가? ──
  const q5 = interpretQ5(sagwa, samjeon, ilgan, gender);

  // ── Q6: 최적 타이밍 ──
  const q6 = interpretQ6(sagwa, samjeon, cheonjibando, ilgan, gender);

  // ── Q7: 절대 하지 말 것 ──
  const q7 = interpretQ7(sagwa, ilgan, ilji, gender);

  return { gwaFirstImpression, q1, q2, q3, q4, q5, q6, q7 };
}

// ── Q1 ──
function interpretQ1(
  sagwa: Sagwa, gender: "M" | "W",
  bonus: number, gw1Penalty: number, gw3Penalty: number,
): { score: number; positive: boolean; summary: string } {
  // 질문자 남 → 1과 천반 → 3과 천반 비교
  // 질문자 여 → 3과 천반 → 1과 천반 비교
  const from = gender === "M" ? sagwa.gw1.sangsin : sagwa.gw3.sangsin;
  const to = gender === "M" ? sagwa.gw3.sangsin : sagwa.gw1.sangsin;

  let score = calculateRelationScore(from, to) + bonus;
  score += gender === "M" ? gw3Penalty : gw1Penalty;
  score = Math.max(0, Math.min(15, score));

  const positive = score >= 7;
  const summary = score >= 9 ? "상대방이 이성으로 의식하고 있을 가능성이 높아요."
    : score >= 7 ? "호감은 있어요. 다만 아직 확신은 아닌 상태."
    : score >= 4 ? "지금은 편한 사이에 가까워요. 이성으로 넘어가려면 계기가 필요해요."
    : "아직 이성으로 보고 있지 않은 흐름이에요.";

  return { score, positive, summary };
}

// ── Q2 ──
function interpretQ2(
  sagwa: Sagwa, gender: "M" | "W",
): { suspicious: boolean; reason: string } {
  // 상대방 과: 남질문자 → 3과, 여질문자 → 1과
  const targetGwa = gender === "M" ? sagwa.gw3 : sagwa.gw1;

  // 조건 1: 상대방 과 둔간 공망 또는 천장 천공 → 의심
  if (targetGwa.dunggan === "공망" || targetGwa.cheonjang === "空") {
    // 천공 + 천반 酉 → 더 강한 의심
    if (targetGwa.cheonjang === "空" && targetGwa.sangsin === "酉") {
      return { suspicious: true, reason: "겉으로는 비어 보이는데, 다른 인연의 기운이 느껴져요." };
    }
    return { suspicious: true, reason: "상대방 주변이 비어 있어요. 숨기고 있는 게 있을 수 있어요." };
  }

  // 조건 3: 천장 천후 + 천반 巳 또는 戌 → 위험
  if (targetGwa.cheonjang === "后" && (targetGwa.sangsin === "巳" || targetGwa.sangsin === "戌")) {
    return { suspicious: true, reason: "주변에 다른 이성 관계의 기운이 강해요. 주의가 필요해요." };
  }

  return { suspicious: false, reason: "지금은 다른 사람의 기운이 뚜렷하게 보이지 않아요." };
}

// ── Q3 ──
function interpretQ3(
  sagwa: Sagwa, samjeon: Samjeon, ilgan: string,
): { possible: boolean; conditions: string[] } {
  const conditions: string[] = [];
  const jeons = [samjeon.cho, samjeon.jung, samjeon.mal];

  // 조건1: 삼전에 관성과 재성이 같이 있을 경우
  const sipsinList = jeons.map((j) => j.dunggan ? getSipsinOfGan(ilgan, j.dunggan) : null);
  const hasGwansung = sipsinList.includes("관성");
  const hasJaesung = sipsinList.includes("재성");
  const gongmangInSamjeon = jeons.some((j) => j.dunggan === "공망");

  if (hasGwansung && hasJaesung && !gongmangInSamjeon) {
    conditions.push("관성과 재성이 함께 있어요. 서로 끌리는 힘이 존재해요.");
  }

  // 조건2: 삼전에 청룡과 천후가 같이 있을 경우
  const cheonjangList = jeons.map((j) => j.cheonjang);
  const hasCheongryong = cheonjangList.includes("靑");
  const hasCheonhu = cheonjangList.includes("后");

  if (hasCheongryong && hasCheonhu && !gongmangInSamjeon) {
    conditions.push("청룡과 천후가 함께 있어요. 연인이 될 인연의 기운이 보여요.");
  }

  // 조건3: 삼전에 육합이나 삼합이 있을 경우
  const jeonJibans = jeons.map((j) => j.jiban);
  let hasHap = false;
  for (let i = 0; i < jeonJibans.length; i++) {
    for (let k = i + 1; k < jeonJibans.length; k++) {
      const key = `${jeonJibans[i]}${jeonJibans[k]}`;
      if (YUKHAP_SCORE[key] !== undefined) hasHap = true;
      if (BANHAP_SCORE[key] !== undefined) hasHap = true;
    }
  }

  if (hasHap && !gongmangInSamjeon) {
    conditions.push("합의 기운이 있어요. 만남이 이루어질 가능성이 있어요.");
  }

  return {
    possible: conditions.length > 0,
    conditions: conditions.length > 0 ? conditions : ["지금은 사귀기까지의 흐름이 아직 만들어지지 않았어요."],
  };
}

// ── Q4 ──
function interpretQ4(
  sagwa: Sagwa, ilgan: string, ilji: string, gender: "M" | "W", bonus: number,
): { score: number; positive: boolean; summary: string } {
  const gigung = GIGUNG_MAP[ilgan] ?? "";

  // 남자: 일간 기궁과 3과 천반 비교
  // 여자: 일지와 1과 천반 비교
  const from = gender === "M" ? gigung : ilji;
  const to = gender === "M" ? sagwa.gw3.sangsin : sagwa.gw1.sangsin;

  let score = calculateRelationScore(from, to) + bonus;
  score = Math.max(0, Math.min(15, score));

  const positive = score >= 7;
  const summary = score >= 9 ? "오래 갈 수 있는 인연이에요. 깊어질 가능성이 있어요."
    : score >= 7 ? "유지는 되지만, 서로 노력이 필요한 관계예요."
    : score >= 4 ? "짧을 수 있어요. 한 번 크게 흔들리는 시점이 올 수 있어요."
    : "지속이 어려운 흐름이에요. 시작 전에 신중하게 생각해보세요.";

  return { score, positive, summary };
}

// ── Q5 ──
function interpretQ5(
  sagwa: Sagwa, samjeon: Samjeon, ilgan: string, gender: "M" | "W",
): { action: "approach" | "wait"; reasons: string[] } {
  const reasons: string[] = [];
  const targetGwa = gender === "M" ? sagwa.gw3 : sagwa.gw1;
  const myGwa = gender === "M" ? sagwa.gw1 : sagwa.gw3;

  // 들이대야 하는 조건들
  // 1. 상대방 과 둔간이 丁
  if (targetGwa.dunggan === "丁") {
    reasons.push("approach: 상대방에게 불꽃(丁) 기운이 있어요. 적극적으로 다가가세요.");
  }

  // 2. 초전에 청룡 또는 주작
  if (samjeon.cho.cheonjang === "靑" || samjeon.cho.cheonjang === "朱") {
    reasons.push("approach: 지금 움직이면 좋은 흐름을 탈 수 있어요.");
  }

  // 3. 상대방 과 둔간이 재성(남) / 관성(여)
  const targetSipsin = targetGwa.dunggan ? getSipsinOfGan(ilgan, targetGwa.dunggan) : null;
  if (gender === "M" && targetSipsin === "재성") {
    reasons.push("approach: 상대방 쪽에 끌어당기는 기운이 있어요.");
  }
  if (gender === "W" && targetSipsin === "관성") {
    reasons.push("approach: 상대방 쪽에 끌어당기는 기운이 있어요.");
  }

  // 4. 1과-3과 충이지만 상대방에 길장
  const isChung = CHUNG_PAIRS.has(`${sagwa.gw1.sangsin}${sagwa.gw3.sangsin}`);
  if (isChung && isGiljang(targetGwa.cheonjang, gender)) {
    reasons.push("approach: 충돌이 있지만, 길한 기운이 감싸고 있어요. 시도해볼 만해요.");
  }

  // 기다려야 하는 조건들
  // 1. 상대방 천반이 내 천반을 생함
  const targetCheonban = targetGwa.sangsin;
  const myCheonban = myGwa.sangsin;
  if (SAENG_PAIRS.has(`${targetCheonban}${myCheonban}`)) {
    reasons.push("wait: 상대방이 먼저 다가올 기운이에요. 기다리는 게 좋아요.");
  }

  // 2. 상대방에 백호, 구진
  if (targetGwa.cheonjang === "白" || targetGwa.cheonjang === "句") {
    reasons.push("wait: 상대방이 부담을 느끼고 있어요. 여유를 주세요.");
  }

  // 3. 초전 흉하고 말전 길함
  const choHeung = !isGiljang(samjeon.cho.cheonjang, gender);
  const malGil = isGiljang(samjeon.mal.cheonjang, gender);
  if (choHeung && malGil) {
    reasons.push("wait: 지금은 아니지만 나중에 좋아져요. 시간을 두세요.");
  }

  const approachCount = reasons.filter((r) => r.startsWith("approach")).length;
  const waitCount = reasons.filter((r) => r.startsWith("wait")).length;

  const action = approachCount > waitCount ? "approach" : "wait";
  const cleanReasons = reasons.map((r) => r.replace(/^(approach|wait): /, ""));

  return { action, reasons: cleanReasons.length > 0 ? cleanReasons : ["상황을 좀 더 지켜보세요."] };
}

// ── Q6 ──
function interpretQ6(
  sagwa: Sagwa, samjeon: Samjeon, cheonjibando: CheonjibandoPair[],
  ilgan: string, gender: "M" | "W",
): { bestDay: string | null; method: string } {
  const helpingJi = HELPING_JI[ilgan] ?? [];
  const jeons = [samjeon.cho, samjeon.mal];

  // 우선순위 1: 삼전 초전/말전에 길장 → 해당 지반이 일간을 돕는 지지면 그 날
  for (const jeon of jeons) {
    if (isGiljang(jeon.cheonjang, gender)) {
      if (helpingJi.includes(jeon.jiban)) {
        return { bestDay: jeon.jiban, method: `삼전의 길한 기운(${jeon.cheonjang})이 있는 ${jeon.jiban}일이 좋아요.` };
      }
    }
  }

  // 우선순위 2: 천지반도에서 태상 찾기
  const taesangPair = cheonjibando.find((p) => p.cheonjang === "常");
  if (taesangPair) {
    const taesangSipsin = taesangPair.dunggan ? getSipsinOfGan(ilgan, taesangPair.dunggan) : null;
    const requiredSipsin = gender === "M" ? "재성" : "관성";
    if (taesangSipsin === requiredSipsin) {
      return { bestDay: taesangPair.jiban, method: `태상의 기운이 ${requiredSipsin}과 맞닿아 있어요. ${taesangPair.jiban}일이 좋아요.` };
    }
  }

  // 우선순위 3: 천지반도 공망 구간의 충 지지
  const CHUNG_MAP: Record<string, string> = {
    "子": "午", "午": "子", "丑": "未", "未": "丑",
    "寅": "申", "申": "寅", "卯": "酉", "酉": "卯",
    "辰": "戌", "戌": "辰", "巳": "亥", "亥": "巳",
  };

  for (const pair of cheonjibando) {
    if (pair.dunggan === "공망") {
      const chungJi = CHUNG_MAP[pair.jiban];
      if (chungJi) {
        return { bestDay: chungJi, method: `공망을 깨는 ${chungJi}일에 움직이면 막힌 게 뚫려요.` };
      }
    }
  }

  return { bestDay: null, method: "특별히 강한 날이 보이지 않아요. 마음이 편한 날을 고르세요." };
}

// ── Q7 ──
function interpretQ7(
  sagwa: Sagwa, ilgan: string, ilji: string, gender: "M" | "W",
): { warning: string; detail: string } {
  // 상대방 상황의 과: 남질문자 → 4과, 여질문자 → 2과
  const reasonGwa = gender === "M" ? sagwa.gw4 : sagwa.gw2;

  // 천장 기반 경고
  if (reasonGwa.cheonjang === "白") {
    return { warning: "급발진 금지", detail: "무리한 속도감이나 부담을 주면 상대방이 도망가요. 천천히." };
  }
  if (reasonGwa.cheonjang === "句") {
    return { warning: "집착 금지", detail: "옭아매려 하면 할수록 멀어져요. 자유를 존중해주세요." };
  }
  if (reasonGwa.cheonjang === "蛇") {
    return { warning: "떠보기 금지", detail: "불안해서 밀당하거나 떠보는 행동은 역효과예요. 솔직하게." };
  }

  // 신살 기반 경고 (상대방 상황의 천반을 기준으로)
  const baseJi = gender === "M" ? GIGUNG_MAP[ilgan] ?? ilji : ilji;
  const targetCheonban = reasonGwa.sangsin;
  const sinsal = getSinsalOfJi(baseJi, targetCheonban);

  const SINSAL_WARNING: Record<string, { warning: string; detail: string }> = {
    "겁살": { warning: "억지 상황 연출 금지", detail: "조급함에 일을 벌이면 오히려 밀려나요." },
    "재살": { warning: "수싸움 금지", detail: "피해자 코스프레, 잔머리는 바로 들통나요." },
    "천살": { warning: "과도한 의미 부여 금지", detail: "사소한 것에 큰 의미를 붙이면 상대방이 부담스러워해요." },
    "지살": { warning: "찔러보기 금지", detail: "돌려서 물어보거나 떠보는 행동은 신뢰를 깎아요." },
    "년살": { warning: "과도한 어필 금지", detail: "관심 받으려고 과하게 나서면 역효과예요." },
    "월살": { warning: "징징거림 금지", detail: "힘든 상황 어필, 한숨, 고민 상담은 부담만 줘요." },
    "망신살": { warning: "100% 다 주기 금지", detail: "치부나 약점을 일찍 보여주면 매력이 사라져요." },
    "장성살": { warning: "지적 금지", detail: "자존심 세우거나 고집부리면 관계가 멀어져요." },
    "반안살": { warning: "안일함 금지", detail: "김칫국부터 마시면 안 돼요. 아직 확정된 게 없어요." },
    "역마살": { warning: "잠수/회피 금지", detail: "피하거나 변덕부리면 상대방이 지쳐요." },
    "육해살": { warning: "짜증/과민반응 금지", detail: "사소한 것에 예민하게 굴면 피곤한 사람이 돼요." },
    "화개살": { warning: "혼자 끙끙 앓기 금지", detail: "머릿속으로만 소설 쓰지 말고, 표현하세요." },
  };

  if (sinsal && SINSAL_WARNING[sinsal]) {
    return SINSAL_WARNING[sinsal];
  }

  return { warning: "조급함 금지", detail: "지금은 흐름을 읽고 기다리는 것이 최선이에요." };
}
