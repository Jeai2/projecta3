/**
 * 낙서구궁 운기 엔진 — 중궁 신패 방사 + 대로/횡액/사정사간.
 *
 * 운용(양=화선/낮, 음=화영/밤)에 따라 "원소"와 "관계"가 달라진다:
 *  - 양: 진패=납음오행, 신패=천간 오행 → 오행 상생(폭발)/상극(하락)
 *  - 음: 진패·신패=지지 지장간 본기(천간) → 천간합(폭발)/천간충(하락)
 *
 * 운기 수치 모델은 내부 정성 등급(폭발/순행/평/횡액)으로만 둔다(숫자 미노출).
 * 입력: reading + 자리별 한글 간지 맵(상위 divination이 getSinpaeGanji로 해소해 넘김 → 순환 import 회피).
 */

import type { CheoneumReading } from "./cheoneum.types";
import { NAPEUM_OHENG_DATA } from "../hwa-eui/data/napeum-oheng.data";
import { CHEONGANHAP, CHEONGANCHUNG } from "../data/relationship.data";
import {
  CHEONEUM_GUGUNG,
  CHEONEUM_NAKSEO_AXES,
  CHEONEUM_SAJEONG,
  CHEONEUM_SAGAN,
  JIJANGGAN_BONGI,
} from "./cheoneum-nakseo.data";
import { CHEONEUM_SINPAE_ATTRIBUTES } from "./cheoneum-sinpae-attributes.data";

const GAN_OHENG_KO: Record<string, string> = { 갑: "木", 을: "木", 병: "火", 정: "火", 무: "土", 기: "土", 경: "金", 신: "金", 임: "水", 계: "水" };
const GAN_KO_TO_HANJA: Record<string, string> = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
const OHENG_SAENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const OHENG_GEUK: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

type Radiate = "생" | "극" | "무"; // 생=상생/합(폭발쪽), 극=상극/충(하락), 무=무관
type Verdict = "폭발" | "순행" | "평" | "횡액";

// ── 운용별 원소 추출(한글) ──
function jinpaeElement(ganji: string | null | undefined, yin: boolean): string | null {
  if (!ganji || ganji.length < 2) return null;
  if (yin) return JIJANGGAN_BONGI[ganji[1]] ?? null; // 지장간 본기 천간(한글)
  return NAPEUM_OHENG_DATA[ganji]?.oheng ?? null;     // 납음 오행(한자)
}
function sinpaeElement(ganji: string | null | undefined, yin: boolean): string | null {
  if (!ganji || ganji.length < 2) return null;
  if (yin) return JIJANGGAN_BONGI[ganji[1]] ?? null;  // 지장간 본기 천간(한글)
  return GAN_OHENG_KO[ganji[0]] ?? null;              // 천간 오행(한자)
}

function ganHap(aKo: string, bKo: string): boolean {
  const a = GAN_KO_TO_HANJA[aKo], b = GAN_KO_TO_HANJA[bKo];
  return !!a && !!b && CHEONGANHAP[a] === b;
}
function ganChung(aKo: string, bKo: string): boolean {
  const a = GAN_KO_TO_HANJA[aKo], b = GAN_KO_TO_HANJA[bKo];
  return !!a && !!b && (CHEONGANCHUNG[a] === b || CHEONGANCHUNG[b] === a);
}

// 중궁 → 궁 방사 관계(center가 gung을 생/극 또는 합/충). noClash면 흉(극/충) 무효.
function radiate(centerEl: string | null, gungEl: string | null, yin: boolean, noClash: boolean): Radiate {
  if (!centerEl || !gungEl) return "무";
  if (yin) {
    if (ganHap(centerEl, gungEl)) return "생";
    if (ganChung(centerEl, gungEl)) return noClash ? "무" : "극";
    return "무";
  }
  if (OHENG_SAENG[centerEl] === gungEl) return "생";
  if (OHENG_GEUK[centerEl] === gungEl) return noClash ? "무" : "극";
  return "무";
}

export function buildNakseoEngineInsight(
  reading: CheoneumReading,
  ganjiByPosition: Record<string, string | null>,
): string | null {
  if (reading.spread !== "nakseo-gugung") return null;
  const yin = reading.polarity === "yin";

  const centerCard = reading.cards.find((c) => c.position === "junggung");
  if (!centerCard) return null;
  const centerAttr = CHEONEUM_SINPAE_ATTRIBUTES[centerCard.card.id];
  const noClash = centerAttr?.noClash ?? false;
  const centerEl = sinpaeElement(ganjiByPosition["junggung"], yin);

  // 1) 방사: 각 궁에 중궁 관계 + 기본 등급
  const radiateBy: Record<string, Radiate> = {};
  const verdict: Record<string, Verdict> = {};
  for (const key of Object.keys(CHEONEUM_GUGUNG)) {
    if (key === "junggung") continue;
    const r = radiate(centerEl, jinpaeElement(ganjiByPosition[key], yin), yin, noClash);
    radiateBy[key] = r;
    verdict[key] = r === "생" ? "순행" : r === "극" ? "횡액" : "평";
  }

  // 2) 대로(大擄): 축의 양끝을 중궁이 둘 다 생/합 → 그 2궁 폭발
  const daero: string[] = [];
  for (const axis of CHEONEUM_NAKSEO_AXES) {
    const [a, b] = axis.ends;
    if (radiateBy[a] === "생" && radiateBy[b] === "생") {
      verdict[a] = "폭발";
      verdict[b] = "폭발";
      daero.push(axis.name);
    }
  }

  // 3) 사정/사간: 그룹 4궁 모두 생 → 폭발 / 모두 극 → 제압(하락). noClash면 제압 없음.
  const groupNotes: string[] = [];
  const groups: Array<[string, string[]]> = [["사정방", CHEONEUM_SAJEONG], ["사간방", CHEONEUM_SAGAN]];
  for (const [label, group] of groups) {
    if (group.every((k) => radiateBy[k] === "생")) {
      group.forEach((k) => (verdict[k] = "폭발"));
      groupNotes.push(`${label} 전체 폭발`);
    } else if (!noClash && group.every((k) => radiateBy[k] === "극")) {
      group.forEach((k) => (verdict[k] = "횡액"));
      groupNotes.push(`${label} 전체 제압(하락)`);
    }
  }

  const gungLabel = (k: string) => `${CHEONEUM_GUGUNG[k].name}(${CHEONEUM_GUGUNG[k].vectorFlow})`;
  const pokbal = Object.keys(verdict).filter((k) => verdict[k] === "폭발").map(gungLabel);
  const hoengaek = Object.keys(verdict).filter((k) => verdict[k] === "횡액").map(gungLabel);

  const lines: string[] = [];
  lines.push(`- 운용: ${yin ? "음(화영) — 지장간 본기 합충" : "양(화선) — 납음오행 상생상극"}`);
  lines.push(
    `- 중궁 신패: ${centerAttr?.name ?? centerCard.card.name}${centerEl ? `(${centerEl})` : ""}${centerAttr ? ` · ${centerAttr.fortune}` : ""} — ${centerAttr?.effect ?? "사방에 고유 성질을 방사한다."}${noClash ? " (상극·충 면제 최상위 길성)" : ""}`,
  );
  if (pokbal.length) lines.push(`- 운기 폭발(밀어줄 자리): ${pokbal.join(" / ")}`);
  if (hoengaek.length) lines.push(`- 횡액(조심할 자리): ${hoengaek.join(" / ")}`);
  if (daero.length) lines.push(`- 대로(大擄) 라인: ${daero.join(", ")} — 중궁을 경유해 양끝이 폭발`);
  if (groupNotes.length) lines.push(`- 방위 그룹: ${groupNotes.join(", ")}`);
  lines.push(`- 읽기: 중궁 신패의 성질이 사방을 끌고 가는 축으로 본다. 폭발 자리는 밀고, 횡액 자리는 지킨다. 9자리를 다 나열하지 말고 가장 센 자리부터.`);

  return `[낙서구궁 운기 판독]\n${lines.join("\n")}`;
}
