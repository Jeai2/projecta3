/**
 * 궁합 교차 신살
 * - 기준자(A)의 일간·일지(및 년지)를 기준으로 상대(B)의 각 기둥 지지에 걸리는 신살을 표기
 * - 길신: 천을귀인만
 * - 신살: 12신살 (기준자 년지 삼합군으로 상대 지지 매핑 — 기존 엔진과 동일한 12신살 표)
 * - 흉살: 일간 criteria / 일지 complexCriteria / allGan(홍염) / pair(혈인) 등 지지 단일 매칭 가능 규칙
 */

import { SINSAL_12_MAP, getSamhapGroup } from "../data/sinsal/12sinsal.map";
import { SINSAL_RULES_AUSPICIOUS } from "../data/sinsal/rules.auspicious";
import { SINSAL_RULES_INAUSPICIOUS } from "../data/sinsal/rules.inauspicious";
import type { CriteriaRule, ComplexCriteriaRule, AllGanRule, PairRule } from "../data/sinsal/types";

export type CrossPillarKey = "year" | "month" | "day" | "hour";

export interface CrossPillarSinsal {
  gan: string;
  ji: string;
  /** 길신 — 천을귀인 (일간 기준) */
  cheonEulGwiin: boolean;
  /** 12신살 (기준자 년지 삼합군 → 상대 해당 지지) */
  sinsal12: string | null;
  /** 흉살 이름 목록 */
  hyungSal: string[];
}

export interface CrossSinsalDirection {
  refDayGan: string;
  refDayJi: string;
  refYearJi: string;
  pillars: Record<CrossPillarKey, CrossPillarSinsal>;
}

export interface CoupleCrossSinsalResult {
  /** 나(A) 일간·일지 기준 → 상대(B) 년·월·일·시 */
  aToB: CrossSinsalDirection;
  /** 상대(B) 일간·일지 기준 → 나(A) 년·월·일·시 */
  bToA: CrossSinsalDirection;
}

type PillarsLike = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string };
};

function isCheonEulGwiin(dayGan: string, ji: string): boolean {
  const rule = SINSAL_RULES_AUSPICIOUS.천을귀인;
  if (!rule || rule.type !== "criteria") return false;
  const cr = rule as CriteriaRule;
  if (cr.base !== "dayGan" || cr.target !== "ji") return false;
  for (const [key, val] of Object.entries(cr.rules)) {
    const gans = key.split(",").map((s) => s.trim());
    if (!gans.includes(dayGan)) continue;
    const targets = Array.isArray(val) ? val : [val];
    if (targets.includes(ji)) return true;
  }
  return false;
}

function getSinsal12ForJi(refYearJi: string, targetJi: string): string | null {
  const group = getSamhapGroup(refYearJi);
  if (!group) return null;
  const map = SINSAL_12_MAP[group];
  if (!map) return null;
  return map[targetJi] ?? null;
}

function normalizeJiToken(v: string): string {
  return v.replace(/[)）]/g, "").trim();
}

function collectHyungSal(
  refDayGan: string,
  refDayJi: string,
  targetJi: string,
  targetGan: string,
): string[] {
  const hits: string[] = [];

  for (const [name, rule] of Object.entries(SINSAL_RULES_INAUSPICIOUS)) {
    if (name === "공망") continue;

    if (rule.type === "criteria") {
      const r = rule as CriteriaRule;
      if (r.base === "dayGan" && r.target === "ji") {
        for (const [key, val] of Object.entries(r.rules)) {
          const gans = key.split(",").map((s) => s.trim());
          if (!gans.includes(refDayGan)) continue;
          const targets = (Array.isArray(val) ? val : [val]).map(normalizeJiToken);
          if (targets.includes(targetJi)) hits.push(name);
        }
      }
    } else if (rule.type === "complexCriteria") {
      const r = rule as ComplexCriteriaRule;
      if (r.base === "dayJi" && r.target === "ji") {
        const list = r.rules[refDayJi];
        if (list?.includes(targetJi)) hits.push(name);
      }
    } else if (rule.type === "allGan") {
      const r = rule as AllGanRule;
      if (r.base === "allGan" && r.target === "ji") {
        const v = r.rules[refDayGan];
        if (v !== undefined) {
          const arr = Array.isArray(v) ? v : [v];
          if (arr.includes(targetJi)) hits.push(name);
        }
      }
    } else if (rule.type === "pair") {
      const r = rule as PairRule;
      if (r.base === "ji" || r.base === "dayJi") {
        const pair = r.pairs[refDayJi];
        if (pair === targetJi) hits.push(name);
      }
    }
  }

  return [...new Set(hits)];
}

function oneDirection(
  ref: PillarsLike,
  target: PillarsLike,
): CrossSinsalDirection {
  const refDayGan = ref.day.gan;
  const refDayJi = ref.day.ji;
  const refYearJi = ref.year.ji;
  const keys: CrossPillarKey[] = ["year", "month", "day", "hour"];
  const pillars = {} as Record<CrossPillarKey, CrossPillarSinsal>;

  for (const k of keys) {
    const t = target[k];
    const ji = t.ji;
    const gan = t.gan;
    pillars[k] = {
      gan,
      ji,
      cheonEulGwiin: isCheonEulGwiin(refDayGan, ji),
      sinsal12: getSinsal12ForJi(refYearJi, ji),
      hyungSal: collectHyungSal(refDayGan, refDayJi, ji, gan),
    };
  }

  return { refDayGan, refDayJi, refYearJi, pillars };
}

export function calcCoupleCrossSinsalAnalysis(
  myPillars: PillarsLike,
  partnerPillars: PillarsLike,
): CoupleCrossSinsalResult {
  return {
    aToB: oneDirection(myPillars, partnerPillars),
    bToA: oneDirection(partnerPillars, myPillars),
  };
}
