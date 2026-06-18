/**
 * 천음 관계 엔진 어댑터 (기둥 A) — 패와 패가 간지로 엮인다.
 *
 * 관계 "탐지"의 데이터 원천은 만들지 않는다. 앱 공용 canonical 표인
 * `../data/relationship.data.ts`(천간합/합화/충, 육합/삼합/방합/암합, 육충/형/파/해)와
 * `../data/saju.data.ts`(천간 오행)를 재사용한다.
 * "그 관계가 천음에서 무슨 뜻인가"는 `./cheoneum-relation-interpretation.data.ts`가 담당한다(사용자 편집 파일).
 *
 * 3장 이상 스프레드(통관/천지인/원형이정/순환/낙서구궁)에서만 사용한다.
 * 일기(1장)·양의(2장)는 카드 간 관계를 쓰지 않는다.
 */

import {
  CHEONGANHAP,
  CHEONGANHAPHWA,
  CHEONGANCHUNG,
  YUKHAP,
  YUKHAPHWA,
  SAMHAP,
  SAMHAPHWA,
  BANGHAP,
  BANGHAPHWA,
  AMHAP,
  YUKCHUNG,
  YUKHYUNG,
  YUKPA,
  YUKAE,
} from "../data/relationship.data";
import { GAN_OHENG } from "../data/saju.data";
import {
  CHEONEUM_GUK_MEANINGS,
  getCheoneumRelationSeed,
  type GukOhaeng,
} from "./cheoneum-relation-interpretation.data";

// 천음 카드 간지는 한글("갑자")로 들어오고, canonical 관계 데이터는 한자("甲","子") 키다.
const GAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
const JI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

// 오행 상생/상극 (한자 오행) — 보편 정의. GAN_OHENG(천간→오행)는 canonical 재사용.
const OHENG_SAENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const OHENG_GEUK: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export type RelationKind =
  | "천간합" | "천간충"
  | "육합" | "삼합" | "반합" | "방합" | "암합" | "충" | "삼형" | "파" | "해";
export type CombinationKind = "신생진" | "신극진" | "진생신" | "진극신" | "비화";

export interface RelationEdge {
  kind: RelationKind | CombinationKind;
  /** 관련된 카드들의 라벨 (예: ["주체 A", "통관패"]) */
  members: string[];
  /** 간지 사실(예: "甲己 천간합 → 갑기합화토", "寅巳申 삼형") */
  detail: string;
  /** 합화 결과 오행(한자) — 합 계열일 때만 */
  guk?: GukOhaeng;
}

export interface CardGanji {
  label: string;
  /** 한글 간지 2글자 (예: "갑자"). 없으면 관계 계산에서 제외된다. */
  ganji: string | null;
  arcana: "sinpae" | "jinpae";
}

interface Parsed {
  label: string;
  arcana: "sinpae" | "jinpae";
  gan: string; // 한자 천간
  ji: string; // 한자 지지
}

function uniqueGroups(map: Record<string, string[]>): string[][] {
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const key of Object.keys(map)) {
    const group = [key, ...map[key]].slice().sort();
    const k = group.join("");
    if (!seen.has(k)) {
      seen.add(k);
      groups.push(group);
    }
  }
  return groups;
}

const SAMHAP_GROUPS = uniqueGroups(SAMHAP);
const BANGHAP_GROUPS = uniqueGroups(BANGHAP);
const HYEONG_GROUPS = uniqueGroups(YUKHYUNG);

function pairKey(a: string, b: string): string {
  return [a, b].slice().sort().join("");
}

function asGuk(result: string | undefined): GukOhaeng | undefined {
  return result && result in CHEONEUM_GUK_MEANINGS ? (result as GukOhaeng) : undefined;
}

/**
 * 3장 이상 스프레드의 카드들 사이 관계(수평: 합/충 등)와 결합 양태(수직: 신패↔진패 오행 생극)를 산출한다.
 */
export function buildCheoneumRelations(cards: CardGanji[]): RelationEdge[] {
  const parsed: Parsed[] = cards
    .filter((c): c is CardGanji & { ganji: string } => typeof c.ganji === "string" && c.ganji.length >= 2)
    .map((c) => ({
      label: c.label,
      arcana: c.arcana,
      gan: GAN_HANJA[c.ganji[0]] ?? c.ganji[0],
      ji: JI_HANJA[c.ganji[1]] ?? c.ganji[1],
    }));

  if (parsed.length < 2) return [];

  const edges: RelationEdge[] = [];
  const jis = parsed.map((p) => p.ji);
  const has = (ch: string) => jis.includes(ch);
  const labelOf = (ch: string) => parsed.find((p) => p.ji === ch)?.label ?? ch;
  const coveredPairs = new Set<string>();

  // ── 완전 삼합 / 방합 (그룹) ──
  for (const group of SAMHAP_GROUPS) {
    if (group.every(has)) {
      const guk = asGuk(SAMHAPHWA[group[0]]?.result);
      edges.push({ kind: "삼합", members: group.map(labelOf), detail: `${group.join("")} 삼합${guk ? ` → ${guk}국` : ""}`, guk });
      for (let i = 0; i < group.length; i += 1)
        for (let j = i + 1; j < group.length; j += 1) coveredPairs.add(pairKey(group[i], group[j]));
    }
  }
  for (const group of BANGHAP_GROUPS) {
    if (group.every(has)) {
      const guk = asGuk(BANGHAPHWA[group[0]]?.result);
      edges.push({ kind: "방합", members: group.map(labelOf), detail: `${group.join("")} 방합${guk ? ` → ${guk}국` : ""}`, guk });
      for (let i = 0; i < group.length; i += 1)
        for (let j = i + 1; j < group.length; j += 1) coveredPairs.add(pairKey(group[i], group[j]));
    }
  }
  for (const group of HYEONG_GROUPS) {
    if (group.length === 3 && group.every(has)) {
      edges.push({ kind: "삼형", members: group.map(labelOf), detail: `${group.join("")} 삼형` });
    }
  }

  // ── 쌍 단위 (수평 관계 + 결합 양태) ──
  for (let i = 0; i < parsed.length; i += 1) {
    for (let j = i + 1; j < parsed.length; j += 1) {
      const a = parsed[i];
      const b = parsed[j];
      const members = [a.label, b.label];

      // 천간
      if (CHEONGANHAP[a.gan] === b.gan) {
        const hwa = CHEONGANHAPHWA[a.gan];
        edges.push({ kind: "천간합", members, detail: `${a.gan}${b.gan} 천간합${hwa ? ` → ${hwa.resultName}` : ""}`, guk: asGuk(hwa?.result) });
      } else if (CHEONGANCHUNG[a.gan] === b.gan || CHEONGANCHUNG[b.gan] === a.gan) {
        edges.push({ kind: "천간충", members, detail: `${a.gan}${b.gan} 천간충(극)` });
      }

      // 지지 — 충 우선, 그다음 합/암합/반합/방합부분
      const pk = pairKey(a.ji, b.ji);
      if (YUKCHUNG[a.ji] === b.ji) {
        edges.push({ kind: "충", members, detail: `${a.ji}${b.ji} 충` });
      } else if (YUKHAP[a.ji] === b.ji) {
        const guk = asGuk(YUKHAPHWA[a.ji]?.result);
        edges.push({ kind: "육합", members, detail: `${a.ji}${b.ji} 육합${guk ? `(${guk})` : ""}`, guk });
      } else if (!coveredPairs.has(pk) && SAMHAP[a.ji]?.includes(b.ji)) {
        const guk = asGuk(SAMHAPHWA[a.ji]?.result);
        edges.push({ kind: "반합", members, detail: `${a.ji}${b.ji} 반합${guk ? `(${guk})` : ""}`, guk });
      } else if (!coveredPairs.has(pk) && BANGHAP[a.ji]?.includes(b.ji)) {
        edges.push({ kind: "방합", members, detail: `${a.ji}${b.ji} 방합(부분)` });
      } else if (AMHAP[a.ji]?.includes(b.ji)) {
        edges.push({ kind: "암합", members, detail: `${a.ji}${b.ji} 암합` });
      }

      if (YUKPA[a.ji] === b.ji) edges.push({ kind: "파", members, detail: `${a.ji}${b.ji} 파` });
      if (YUKAE[a.ji] === b.ji) edges.push({ kind: "해", members, detail: `${a.ji}${b.ji} 해` });

      // ── 결합 양태(수직): 신패↔진패 천간 오행 생극 ──
      if (a.arcana !== b.arcana) {
        const sin = a.arcana === "sinpae" ? a : b;
        const jin = a.arcana === "jinpae" ? a : b;
        const oS = GAN_OHENG[sin.gan];
        const oJ = GAN_OHENG[jin.gan];
        if (oS && oJ) {
          let kind: CombinationKind | null = null;
          if (oS === oJ) kind = "비화";
          else if (OHENG_SAENG[oS] === oJ) kind = "신생진";
          else if (OHENG_SAENG[oJ] === oS) kind = "진생신";
          else if (OHENG_GEUK[oS] === oJ) kind = "신극진";
          else if (OHENG_GEUK[oJ] === oS) kind = "진극신";
          if (kind) {
            edges.push({ kind, members: [sin.label, jin.label], detail: `신패 ${sin.gan}(${oS}) ↔ 진패 ${jin.gan}(${oJ})` });
          }
        }
      }
    }
  }

  return edges;
}

/** 관계 엣지를 프롬프트용 블록으로 변환한다(해석은 천음 관계 해석 데이터에서 가져옴). */
export function formatCheoneumRelations(edges: RelationEdge[]): string | null {
  if (!edges.length) return null;

  const lines = edges.map((e) => {
    const seed = getCheoneumRelationSeed(e.kind);
    const meaning = seed ? ` — ${seed.reading}` : "";
    return `- [${e.members.join(" ↔ ")}] ${e.detail}${meaning}`;
  });

  // 합화 국(局): 완전 삼합/방합이 만든 큰 쏠림만 요약 (#2)
  const guks = Array.from(
    new Set(edges.filter((e) => (e.kind === "삼합" || e.kind === "방합") && e.guk).map((e) => e.guk as GukOhaeng)),
  );
  const gukBlock = guks.length
    ? `\n\n[합화 국(局) — 이 펼침의 큰 쏠림]\n` +
      guks.map((g) => `- ${CHEONEUM_GUK_MEANINGS[g].label}: ${CHEONEUM_GUK_MEANINGS[g].reading}`).join("\n")
    : "";

  return `[카드 사이 관계]
- 아래는 뽑힌 패들이 간지로 서로 어떻게 엮였는지의 사실 골격이다(앱 공용 관계표 기준). 각 카드를 따로 풀지 말고, 이 관계를 해석의 축으로 삼는다.
- "신패 ↔ 진패"로 표시된 줄은 큰 흐름(신패)과 현실 사건(진패)의 결합 양태다.
${lines.join("\n")}${gukBlock}`;
}
