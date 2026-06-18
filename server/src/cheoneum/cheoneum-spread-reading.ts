/**
 * 천음 스프레드 구조 판독 (기둥 A 위층) — 포지션 역할 + 카드 사이 관계를 결합한다.
 *
 * `buildCheoneumRelations`가 만든 관계 엣지(앱 공용 관계표 기반)를 받아,
 * 각 스프레드의 자리 의미에 맞춰 "구조 판독" 사실 블록을 만든다.
 * 3장 이상 스프레드에서만 호출한다. 완성 문장이 아니라 사실 골격만 공급한다.
 */

import type { CheoneumReading } from "./cheoneum.types";
import type { RelationEdge } from "./cheoneum-relations";

const HAP_KINDS: string[] = ["천간합", "육합", "삼합", "반합", "방합", "암합"];
const CHUNG_KINDS: string[] = ["천간충", "충", "삼형", "파", "해"];

type Bond = "합" | "충형" | "혼재" | "무";

function labelAt(reading: CheoneumReading, position: string): string | null {
  return reading.cards.find((c) => c.position === position)?.label ?? null;
}
function labelStartsWith(reading: CheoneumReading, prefix: string): string | null {
  return reading.cards.find((c) => c.position.startsWith(prefix))?.label ?? null;
}
function relsBetween(edges: RelationEdge[], a: string | null, b: string | null): RelationEdge[] {
  if (!a || !b) return [];
  return edges.filter((e) => e.members.includes(a) && e.members.includes(b));
}
function bondOf(edges: RelationEdge[]): Bond {
  const kinds = edges.map((e) => e.kind);
  const hap = kinds.some((k) => HAP_KINDS.includes(k));
  const chung = kinds.some((k) => CHUNG_KINDS.includes(k));
  if (hap && chung) return "혼재";
  if (hap) return "합";
  if (chung) return "충형";
  return "무";
}
function bondPhrase(b: Bond): string {
  switch (b) {
    case "합": return "이어지고 풀림(합)";
    case "충형": return "부딪치고 건드림(충/형/파/해)";
    case "혼재": return "이으면서도 건드림(합+충 혼재)";
    case "무": return "직접 닿는 관계 없음";
  }
}

function block(title: string, lines: string[]): string {
  return `[${title}]\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

// ── 통관: 통관패(신패)가 두 주체 사이를 통하게 하는 열쇠 ──
function tonggwan(reading: CheoneumReading, edges: RelationEdge[]): string {
  const key = labelAt(reading, "tonggwan-key");
  const a = labelAt(reading, "subject-a");
  const b = labelAt(reading, "subject-b");
  const ab = bondOf(relsBetween(edges, a, b));
  const ka = bondOf(relsBetween(edges, key, a));
  const kb = bondOf(relsBetween(edges, key, b));
  const keyVerdict =
    ka === "합" && kb === "합" ? "양쪽을 다 잇는 열쇠"
      : (ka === "합") !== (kb === "합") ? "한쪽으로 기운 열쇠(합인 쪽을 먼저 통하게 함)"
        : (ka === "충형" || kb === "충형") ? "건드려 흔드는 열쇠(풀기 전에 먼저 휘저음)"
          : "헛도는 열쇠(두 주체에 깊이 닿지 못함)";
  return block("스프레드 구조 판독 — 통관", [
    `축: 통관패(${key ?? "신패"})가 두 주체 ${a ?? "A"}·${b ?? "B"} 사이를 통하게 하는 열쇠다.`,
    `${a ?? "A"} ↔ ${b ?? "B"}: ${bondPhrase(ab)} — 이게 갈등/관계의 본 성격.`,
    `열쇠 → ${a ?? "A"}: ${bondPhrase(ka)}`,
    `열쇠 → ${b ?? "B"}: ${bondPhrase(kb)}`,
    `종합: ${keyVerdict}.`,
  ]);
}

// ── 천지인: 천(하늘 흐름)·인(사람 선택)·지(현실 조건). 음의 천음은 위/아래 의미 반전 ──
function cheonjiin(reading: CheoneumReading, edges: RelationEdge[]): string {
  const top = labelStartsWith(reading, "top");
  const mid = labelStartsWith(reading, "middle");
  const bottom = labelStartsWith(reading, "bottom");
  const yin = reading.polarity === "yin";
  const topRole = yin ? "지(현실 조건)" : "천(하늘 흐름)";
  const bottomRole = yin ? "천(하늘 흐름)" : "지(현실 조건)";
  return block("스프레드 구조 판독 — 천지인", [
    `축: 천(하늘 흐름)·인(사람의 선택)·지(현실 조건) 세 층. ${yin ? "음의 천음이라 위=지, 아래=천으로 뒤집어 읽는다." : "위=천, 아래=지."}`,
    `위(${top ?? "?"})=${topRole} ↔ 중간(${mid ?? "?"})=인: ${bondPhrase(bondOf(relsBetween(edges, top, mid)))}`,
    `중간=인 ↔ 아래(${bottom ?? "?"})=${bottomRole}: ${bondPhrase(bondOf(relsBetween(edges, mid, bottom)))}`,
    `위 ↔ 아래(${topRole}↔${bottomRole}): ${bondPhrase(bondOf(relsBetween(edges, top, bottom)))}`,
    `읽기: 인(사람)이 천·지 중 어느 쪽과 합/충인지로, 선택이 하늘 뜻과 현실 조건 중 어디로 끌리는지 본다.`,
  ]);
}

// ── 원형이정: 元→亨→利→貞 시계열 + 숨은 신패(바닥 기운) ──
function wonhyeong(reading: CheoneumReading, edges: RelationEdge[]): string {
  const won = labelAt(reading, "won");
  const hyeong = labelAt(reading, "hyeong");
  const i = labelAt(reading, "i");
  const jeong = labelAt(reading, "jeong");
  const hidden = reading.cards.find((c) => c.orientation === "hidden")?.label;
  const seg = (x: string | null, y: string | null) => bondPhrase(bondOf(relsBetween(edges, x, y)));
  return block("스프레드 구조 판독 — 원형이정", [
    `축: 元(시작)→亨(자람)→利(거둠)→貞(맺음) 시계열.${reading.polarity === "yin" ? " 음의 천음이라 포지션 의미를 역순으로 읽는다." : ""}`,
    `元(${won ?? "?"}) → 亨(${hyeong ?? "?"}): ${seg(won, hyeong)}`,
    `亨(${hyeong ?? "?"}) → 利(${i ?? "?"}): ${seg(hyeong, i)}`,
    `利(${i ?? "?"}) → 貞(${jeong ?? "?"}): ${seg(i, jeong)}`,
    `읽기: 합인 구간은 흐름이 순조, 충/형인 구간은 그 단계에서 꺾이거나 갈린다.`,
    `숨은 신패(${hidden ?? "뒤집힌 패"}): 이 흐름의 바닥에 깔린 큰 기운/결말 씨앗.`,
  ]);
}

// ── 순환: 중앙이 사방을 돌린다. 막힌/터진 방위 찾기 ──
function sunhwan(reading: CheoneumReading, edges: RelationEdge[]): string {
  const center = labelAt(reading, "center");
  const dirs: Array<[string, string]> = [
    ["북", "north"], ["동", "east"], ["남", "south"], ["서", "west"],
  ];
  const lines = dirs.map(([ko, pos]) => {
    const label = labelAt(reading, pos);
    return `중앙 ↔ ${ko}(${label ?? "?"}): ${bondPhrase(bondOf(relsBetween(edges, center, label)))}`;
  });
  return block("스프레드 구조 판독 — 순환", [
    `축: 중앙(${center ?? "?"})이 사방을 돌린다. 중앙과 각 방위 관계로 순환이 막힌/터진 곳을 본다.`,
    ...lines,
    `읽기: 충/형인 방위 = 순환이 부딪혀 막힌 곳, 합인 방위 = 기운이 도는 곳.`,
  ]);
}

// ── 낙서구궁: 중앙 신패가 판의 중심. 중앙과 강한 관계 맺은 방위만 추림 ──
function nakseo(reading: CheoneumReading, edges: RelationEdge[]): string {
  const center = labelAt(reading, "center");
  const outerPositions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const strong = outerPositions
    .map((pos) => {
      const label = labelAt(reading, pos);
      const b = bondOf(relsBetween(edges, center, label));
      return b === "무" ? null : `중앙 ↔ ${label ?? pos}: ${bondPhrase(b)}`;
    })
    .filter((x): x is string => x !== null);
  return block("스프레드 구조 판독 — 낙서구궁", [
    `축: 중앙 신패(${center ?? "?"})가 판 전체의 중심. 중앙과 8방의 관계로 판의 쏠림을 본다.`,
    ...(strong.length ? strong : ["중앙이 8방과 직접 맺는 강한 관계는 적음 — 판이 분산되어 있음."]),
    `읽기: 중앙과 합인 방위로 힘이 모이고, 충/형인 방위에서 판이 흔들린다.`,
  ]);
}

export function buildSpreadStructureInsight(reading: CheoneumReading, edges: RelationEdge[]): string | null {
  switch (reading.spread) {
    case "tonggwan": return tonggwan(reading, edges);
    case "cheonjiin": return cheonjiin(reading, edges);
    case "wonhyeongijeong": return wonhyeong(reading, edges);
    case "sunhwan": return sunhwan(reading, edges);
    case "nakseo-gugung": return nakseo(reading, edges);
    default: return null;
  }
}
