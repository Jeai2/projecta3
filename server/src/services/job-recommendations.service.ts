// server/src/services/job-recommendations.service.ts
// 4가지 출처(당령, 사령, 아키타입6, 부족 오행)별 직업 추천 조합

import { DANGNYEONG_JOB_MAP } from "../data/dangnyeong-job-map.data";
import { SARYEONG_JOB_MAP } from "../data/saryeong-job-map.data";
import { ARCHETYPE_JOB_MAP } from "../data/archetype-job-map.data";
import {
  DEFICIENT_OHAENG_JOB_MAP,
  type Ohaeng,
} from "../data/deficient-ohaeng-job-map.data";
import type { ArchetypeCode } from "../data/archetype-map.data";
import type { OhaengCount } from "../data/yongsin.data";

export type JobCategoryItem = {
  title: string;
  professions: string;
  icon: string;
};

export type JobRecommendationsBySource = {
  dangnyeong: { source: string; label: string; items: JobCategoryItem[] };
  saryeong: { source: string; label: string; items: JobCategoryItem[] };
  archetype: { source: string; label: string; items: JobCategoryItem[] };
  deficientOhaeng: { source: string; label: string; items: JobCategoryItem[] };
};

const OHAENG_LIST: Ohaeng[] = ["木", "火", "土", "金", "水"];

function hanjaToHangul(gan: string): string {
  const map: Record<string, string> = {
    甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
    己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
  };
  return map[gan] ?? gan;
}

/**
 * 당령 천간 → 직업 추천
 */
function getDangnyeongJobs(dangnyeongGan: string | null): JobCategoryItem[] {
  if (!dangnyeongGan) return [];
  const hangul = hanjaToHangul(dangnyeongGan);
  const map = DANGNYEONG_JOB_MAP as Record<string, JobCategoryItem[]>;
  return map[hangul] ?? [];
}

/**
 * 사령 천간 → 직업 추천
 */
function getSaryeongJobs(saryeongGan: string | null): JobCategoryItem[] {
  if (!saryeongGan) return [];
  const hangul = hanjaToHangul(saryeongGan);
  const map = SARYEONG_JOB_MAP as Record<string, JobCategoryItem[]>;
  return map[hangul] ?? [];
}

/**
 * 아키타입 상위 2개 → 직업 추천 (중복 제거하여 합침)
 */
function getArchetypeJobs(
  scores: Record<ArchetypeCode, number> | undefined
): JobCategoryItem[] {
  if (!scores || typeof scores !== "object") return [];
  const sorted = (["R", "I", "A", "S", "E", "C"] as const)
    .map((code) => ({ code, score: scores[code] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.code);
  const seen = new Set<string>();
  const items: JobCategoryItem[] = [];
  for (const code of sorted) {
    const list = ARCHETYPE_JOB_MAP[code] ?? [];
    for (const item of list) {
      const key = `${item.title}|${item.professions}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }
  return items;
}

/**
 * 부족한 오행 (breakdown에서 count<=1) → 직업 추천
 */
function getDeficientOhaengJobs(
  breakdown: { gan: OhaengCount; ji: OhaengCount } | null | undefined
): { deficient: Ohaeng[]; items: JobCategoryItem[] } {
  if (!breakdown?.gan || !breakdown?.ji) return { deficient: [], items: [] };
  const deficient = OHAENG_LIST.filter((o) => {
    const total = (breakdown.gan[o] ?? 0) + (breakdown.ji[o] ?? 0);
    return total <= 1;
  });
  if (deficient.length === 0) return { deficient: [], items: [] };
  const seen = new Set<string>();
  const items: JobCategoryItem[] = [];
  for (const oh of deficient) {
    const list = DEFICIENT_OHAENG_JOB_MAP[oh] ?? [];
    for (const item of list) {
      const key = `${item.title}|${item.professions}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }
  return { deficient, items };
}

export interface BuildJobRecommendationsInput {
  dangnyeongGan: string | null;
  saryeongGan: string | null;
  archetypeScores?: Record<ArchetypeCode, number>;
  ohaengBreakdown?: { gan: OhaengCount; ji: OhaengCount } | null;
}

/**
 * 4가지 출처별 직업 추천 조합
 */
export function buildJobRecommendations(
  input: BuildJobRecommendationsInput
): JobRecommendationsBySource {
  const { dangnyeongGan, saryeongGan, archetypeScores, ohaengBreakdown } =
    input;

  const defResult = getDeficientOhaengJobs(ohaengBreakdown);

  return {
    dangnyeong: {
      source: "당령",
      label: dangnyeongGan ? `당령 ${hanjaToHangul(dangnyeongGan)}천간` : "당령",
      items: getDangnyeongJobs(dangnyeongGan),
    },
    saryeong: {
      source: "사령",
      label: saryeongGan ? `사령 ${hanjaToHangul(saryeongGan)}천간` : "사령",
      items: getSaryeongJobs(saryeongGan),
    },
    archetype: {
      source: "아키타입6",
      label: "홀랜드 6유형 기반",
      items: getArchetypeJobs(archetypeScores),
    },
    deficientOhaeng: {
      source: "부족한 오행",
      label:
        defResult.deficient.length > 0
          ? `부족한 오행: ${defResult.deficient.join(", ")}`
          : "부족한 오행",
      items: defResult.items,
    },
  };
}
