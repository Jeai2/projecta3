// server/src/services/sipsin-v2-interpretation.service.ts
// SipsinV2 전용 해설 조합 서비스

import {
  WOLJI_INTERPRETATIONS,
  DANGNYEONG_INTERPRETATIONS,
  SARYEONG_ROLE_INTERPRETATIONS,
  CHEONGANHAP_INTERPRETATIONS,
  CHEONGANCHUNG_INTERPRETATIONS,
  SAMHAP_INTERPRETATIONS,
  BANGHAP_INTERPRETATIONS,
  YUKCHUNG_INTERPRETATIONS,
  YUKHYUNG_INTERPRETATIONS,
  YUKPA_INTERPRETATIONS,
  YUKAE_INTERPRETATIONS,
  YUKHAP_INTERPRETATIONS,
  AMHAP_CONCEPT,
  GYEOKGUK_INTERPRETATIONS,
  YONGSIN_TYPE_INTERPRETATIONS,
  SANGSIN_INTERPRETATION,
  DAEWOON_GANJI_INTERP,
  DAEWOON_GYEOKGUK_INTERP,
  MYSAJU_DANGNYEONG_INTERP,
  MYSAJU_SARYEONG_INTERP,
  type WoljiInterpretation,
  type DangnyeongInterpretation,
  type SaryeongRoleInterpretation,
  type CheonganhapInterpretation,
  type CheonganchungInterpretation,
  type JiRelInterpretation,
  type GyeokgukInterpretation,
  type YongsinTypeInterpretation,
  type SangsinInterpretation,
} from "../data/interpretation/sipsin-v2.data";
import { DAEWOON_ILGAN_INTERP } from "../data/interpretation/daewoon-ilgan.data";
import { SEWOON_GANJI_INTERP, SEWOON_ILGAN_INTERP } from "../data/interpretation/sewoon-ganji.data";
import {
  SEWOON_CHEONGANHAP_INTERP,
  SEWOON_CHEONGANCHUNG_INTERP,
} from "../data/interpretation/sewoon-cheongan.data";
import {
  DAEWOON_CHEONGANHAP_INTERP,
  DAEWOON_CHEONGANCHUNG_INTERP,
  normalizeCheonganhapKey,
  normalizeCheonganchungKey,
} from "../data/interpretation/daewoon-cheongan.data";
import {
  DAEWOON_JIJI_INTERP,
  type JijiRelType,
  type Ilgan,
} from "../data/interpretation/daewoon-jiji.data";
import type { SajuData } from "../types/saju.d";
import type { RelationshipResult } from "./relationship.service";

// ── 내부 유틸 ──────────────────────────────────────────────────────────────

/** 천간 한글 → 한자 */
const GAN_HAN: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

/** 관계 문자열 "甲己(year-month)" → char1+char2 key */
function relKey(str: string): string {
  const m = str.match(/^(..)(\(.+\))$/);
  return m ? m[1] : str.slice(0, 2);
}

/** 삼합 쌍 → 삼합 그룹 key */
function samhapGroupKey(char1: string, char2: string): string | null {
  const groups: Record<string, string[]> = {
    인오술: ["寅", "午", "戌"],
    해묘미: ["亥", "卯", "未"],
    사유축: ["巳", "酉", "丑"],
    신자진: ["申", "子", "辰"],
  };
  for (const [key, members] of Object.entries(groups)) {
    if (members.includes(char1) && members.includes(char2)) return key;
  }
  return null;
}

/** 방합 쌍 → 방합 그룹 key */
function banghapGroupKey(char1: string, char2: string): string | null {
  const groups: Record<string, string[]> = {
    인묘진: ["寅", "卯", "辰"],
    사오미: ["巳", "午", "未"],
    신유술: ["申", "酉", "戌"],
    해자축: ["亥", "子", "丑"],
  };
  for (const [key, members] of Object.entries(groups)) {
    if (members.includes(char1) && members.includes(char2)) return key;
  }
  return null;
}

// ── 출력 타입 ──────────────────────────────────────────────────────────────

export interface SipsinV2Interpretation {
  wolji: WoljiInterpretation | null;
  dangnyeong: DangnyeongInterpretation | null;
  saryeong: {
    role: SaryeongRoleInterpretation | null;
    ganNote: string | null;  // 해당 천간의 당령 해설의 meaning 재활용
  } | null;
  cheonganhap: CheonganhapInterpretation[];
  cheonganchung: CheonganchungInterpretation[];
  samhap: JiRelInterpretation[];
  banghap: JiRelInterpretation[];
  yukchung: JiRelInterpretation[];
  yukhyung: JiRelInterpretation[];
  yukpa: JiRelInterpretation[];
  yukae: JiRelInterpretation[];
  yukhap: JiRelInterpretation[];
  amhap: { concept: string; note: string };
  gyeokguk: GyeokgukInterpretation | null;
  yongsin: YongsinTypeInterpretation | null;
  sangsin: SangsinInterpretation;
  daewoonGyeokgukInterp: Record<string, string>;
  daewoonGanjiInterp: string | null;
  /** 육십갑자 대운 × 일간(日干) 조합별 해석 */
  daewoonGanjiIlganInterp: string | null;
  /** MySajuIntroV2 전용 — 월지별 당령 추가 해석 */
  mysajuDangnyeongText: string | null;
  /** MySajuIntroV2 전용 — 월지별 사령 추가 해석 */
  mysajuSaryeongText: string | null;
}

// ── 메인 함수 ──────────────────────────────────────────────────────────────

export function buildSipsinV2Interpretation(sajuData: SajuData): SipsinV2Interpretation {
  const { pillars, relationships, dangnyeong, saryeong, gyeokguk, yongsin, currentDaewoon } = sajuData;

  // ── 월지 ──
  const woljiChar = pillars.month.ji;
  const woljiInterp = WOLJI_INTERPRETATIONS[woljiChar] ?? null;

  // ── 당령 ──
  let dangnyeongInterp: DangnyeongInterpretation | null = null;
  if (dangnyeong) {
    const hanja = GAN_HAN[dangnyeong.dangnyeongGan] ?? dangnyeong.dangnyeongGan;
    dangnyeongInterp = DANGNYEONG_INTERPRETATIONS[hanja] ?? null;
  }

  // ── 사령 ──
  let saryeongInterp: SipsinV2Interpretation["saryeong"] = null;
  if (saryeong) {
    const roleInterp = SARYEONG_ROLE_INTERPRETATIONS[saryeong.role] ?? null;
    const hanja = GAN_HAN[saryeong.saryeongGan] ?? saryeong.saryeongGan;
    const ganNote = DANGNYEONG_INTERPRETATIONS[hanja]?.meaning ?? null;
    saryeongInterp = { role: roleInterp, ganNote };
  }

  // ── 천간합 ──
  const cheonganhapInterps: CheonganhapInterpretation[] = [];
  for (const s of relationships?.cheonganhap ?? []) {
    const key = relKey(s);
    const interp = CHEONGANHAP_INTERPRETATIONS[key] ?? null;
    if (interp) cheonganhapInterps.push(interp);
  }

  // ── 천간충 ──
  const cheonganchungInterps: CheonganchungInterpretation[] = [];
  for (const s of relationships?.cheonganchung ?? []) {
    const key = relKey(s);
    const interp = CHEONGANCHUNG_INTERPRETATIONS[key] ?? null;
    if (interp) cheonganchungInterps.push(interp);
  }

  // ── 삼합 ──
  const samhapInterps: JiRelInterpretation[] = [];
  const seenSamhap = new Set<string>();
  for (const s of relationships?.samhap ?? []) {
    const m = s.match(/^(.)(.)(\(.+\))$/);
    if (!m) continue;
    const gKey = samhapGroupKey(m[1], m[2]);
    if (gKey && !seenSamhap.has(gKey)) {
      const interp = SAMHAP_INTERPRETATIONS[gKey] ?? null;
      if (interp) { samhapInterps.push(interp); seenSamhap.add(gKey); }
    }
  }

  // ── 방합 ──
  const banghapInterps: JiRelInterpretation[] = [];
  const seenBanghap = new Set<string>();
  for (const s of relationships?.banghap ?? []) {
    const m = s.match(/^(.)(.)(\(.+\))$/);
    if (!m) continue;
    const gKey = banghapGroupKey(m[1], m[2]);
    if (gKey && !seenBanghap.has(gKey)) {
      const interp = BANGHAP_INTERPRETATIONS[gKey] ?? null;
      if (interp) { banghapInterps.push(interp); seenBanghap.add(gKey); }
    }
  }

  // ── 육충 ──
  const yukchungInterps = _lookupJiRels(relationships?.yukchung ?? [], YUKCHUNG_INTERPRETATIONS);
  // ── 육형 ──
  const yukhyungInterps = _lookupJiRels(relationships?.yukhyung ?? [], YUKHYUNG_INTERPRETATIONS);
  // ── 육파 ──
  const yukpaInterps = _lookupJiRels(relationships?.yukpa ?? [], YUKPA_INTERPRETATIONS);
  // ── 육해 ──
  const yukaeInterps = _lookupJiRels(relationships?.yukae ?? [], YUKAE_INTERPRETATIONS);
  // ── 육합 ──
  const yukhapInterps = _lookupJiRels(relationships?.yukhap ?? [], YUKHAP_INTERPRETATIONS);

  // ── 암합 ──
  const amhapNote = (relationships?.amhap?.length ?? 0) > 0
    ? `이 사주에는 ${relationships!.amhap.length}쌍의 암합이 존재합니다. 겉으로 드러나지 않는 숨겨진 인연과 욕망이 사주 내에 잠재되어 있습니다.`
    : "이 사주에는 암합이 없습니다. 숨겨진 연결보다 표면적 관계가 투명하게 작동하는 구조입니다.";

  // ── 격국 ──
  let gyeokgukInterp: GyeokgukInterpretation | null = null;
  if (gyeokguk?.gyeokguk) {
    gyeokgukInterp = GYEOKGUK_INTERPRETATIONS[gyeokguk.gyeokguk.code] ?? null;
  }

  // ── 용신 ──
  let yongsinInterp: YongsinTypeInterpretation | null = null;
  if (gyeokguk?.yongsinType) {
    // yongsinType은 "印", "財", "官", "食", "比" 등 한자 약어 또는 한글 문자열
    const key = _resolveYongsinKey(gyeokguk.yongsinType);
    yongsinInterp = YONGSIN_TYPE_INTERPRETATIONS[key] ?? null;
  }

  return {
    wolji: woljiInterp,
    dangnyeong: dangnyeongInterp,
    saryeong: saryeongInterp,
    cheonganhap: cheonganhapInterps,
    cheonganchung: cheonganchungInterps,
    samhap: samhapInterps,
    banghap: banghapInterps,
    yukchung: yukchungInterps,
    yukhyung: yukhyungInterps,
    yukpa: yukpaInterps,
    yukae: yukaeInterps,
    yukhap: yukhapInterps,
    amhap: { concept: AMHAP_CONCEPT, note: amhapNote },
    gyeokguk: gyeokgukInterp,
    yongsin: yongsinInterp,
    sangsin: SANGSIN_INTERPRETATION,
    daewoonGyeokgukInterp: DAEWOON_GYEOKGUK_INTERP,
    daewoonGanjiInterp: currentDaewoon
      ? (DAEWOON_GANJI_INTERP[currentDaewoon.ganji] ?? null)
      : null,
    daewoonGanjiIlganInterp: currentDaewoon
      ? (DAEWOON_ILGAN_INTERP[currentDaewoon.ganji]?.[pillars.day.gan] ?? null)
      : null,
    mysajuDangnyeongText: dangnyeong
      ? (MYSAJU_DANGNYEONG_INTERP[woljiChar]?.[GAN_HAN[dangnyeong.dangnyeongGan] ?? dangnyeong.dangnyeongGan] ?? null)
      : null,
    mysajuSaryeongText: saryeong
      ? (MYSAJU_SARYEONG_INTERP[woljiChar]?.[GAN_HAN[saryeong.saryeongGan] ?? saryeong.saryeongGan] ?? null)
      : null,
  };
}

// ── 대운 관계 해설 타입 ────────────────────────────────────────────────────

export interface DaewoonRelInterp {
  cheonganhap: CheonganhapInterpretation[];
  cheonganchung: CheonganchungInterpretation[];
  yukhap: JiRelInterpretation[];
  samhap: JiRelInterpretation[];
  banghap: JiRelInterpretation[];
  yukchung: JiRelInterpretation[];
  yukhyung: JiRelInterpretation[];
  yukpa: JiRelInterpretation[];
  yukae: JiRelInterpretation[];
  amhap: { concept: string; note: string };
  ganjiInterp?: string | null;
  ganjiIlganInterp?: string | null;
}

/** 대운과 원국 4기둥 간의 관계 해설을 조합한다. */
export function buildDaewoonRelInterp(rels: RelationshipResult, ilgan = "", ganji = "", isSewoon = false): DaewoonRelInterp {
  // ── 천간합: 합/합반/합거 타입 + 방향(간1대운/간2대운) 선택 ──
  const cheonganhapInterps: CheonganhapInterpretation[] = [];
  for (let i = 0; i < rels.cheonganhap.length; i++) {
    const rawKey = relKey(rels.cheonganhap[i]);
    const canonKey = normalizeCheonganhapKey(rawKey);
    const hapType = rels.cheonganhapTypes?.[i] ?? "합반";
    const group = (isSewoon ? SEWOON_CHEONGANHAP_INTERP : DAEWOON_CHEONGANHAP_INTERP)[canonKey] ?? null;
    if (group) {
      const dir = rawKey === canonKey ? "간1대운" : "간2대운";
      const slot = group[hapType][dir];
      const ilganText = ilgan ? ((slot.ilgan as Record<string, string>)[ilgan] ?? "") : "";
      cheonganhapInterps.push({
        pair: group.pair,
        name: group.name,
        hwaohaeng: group.hwaohaeng,
        hapType,
        essence: slot.base,
        ilganEssence: ilganText || undefined,
        description: "",
        effect: "",
        frozen: "",
      });
    }
  }

  // ── 천간충: 10종 극(克) + 방향(간1대운/간2대운) 선택 ──
  const cheonganchungInterps: CheonganchungInterpretation[] = [];
  for (const s of rels.cheonganchung) {
    const rawKey = relKey(s);
    const canonKey = normalizeCheonganchungKey(rawKey);
    const entry = (isSewoon ? SEWOON_CHEONGANCHUNG_INTERP : DAEWOON_CHEONGANCHUNG_INTERP)[canonKey] ?? null;
    if (entry) {
      const dir = rawKey === canonKey ? "간1대운" : "간2대운";
      const slot = entry[dir];
      const ilganText = ilgan ? ((slot.ilgan as Record<string, string>)[ilgan] ?? "") : "";
      cheonganchungInterps.push({
        pair: entry.pair,
        name: entry.name,
        essence: slot.base,
        ilganEssence: ilganText || undefined,
        description: "",
        effect: "",
      });
    }
  }

  const samhapInterps: JiRelInterpretation[] = [];
  const seenSamhap = new Set<string>();
  for (const s of rels.samhap) {
    const m = s.match(/^(.)(.)(\(.+\))$/);
    if (!m) continue;
    const gKey = samhapGroupKey(m[1], m[2]);
    if (gKey && !seenSamhap.has(gKey)) {
      const interp = SAMHAP_INTERPRETATIONS[gKey] ?? null;
      if (interp) {
        const ilganText = getJijiIlganText(s, "삼합", ilgan);
        samhapInterps.push(ilganText ? { ...interp, ilganEssence: ilganText } : interp);
        seenSamhap.add(gKey);
      }
    }
  }

  const banghapInterps: JiRelInterpretation[] = [];
  const seenBanghap = new Set<string>();
  for (const s of rels.banghap) {
    const m = s.match(/^(.)(.)(\(.+\))$/);
    if (!m) continue;
    const gKey = banghapGroupKey(m[1], m[2]);
    if (gKey && !seenBanghap.has(gKey)) {
      const interp = BANGHAP_INTERPRETATIONS[gKey] ?? null;
      if (interp) {
        const ilganText = getJijiIlganText(s, "방합", ilgan);
        banghapInterps.push(ilganText ? { ...interp, ilganEssence: ilganText } : interp);
        seenBanghap.add(gKey);
      }
    }
  }

  const amhapNote = rels.amhap.length > 0
    ? `대운의 지지가 원국 ${rels.amhap.length}개 지지와 암합합니다. 이 운 기간 동안 숨겨진 인연과 욕망이 은밀하게 작동합니다.`
    : "대운의 지지가 원국과 암합하지 않습니다.";

  return {
    cheonganhap: cheonganhapInterps,
    cheonganchung: cheonganchungInterps,
    yukhap: _lookupJiRels(rels.yukhap, YUKHAP_INTERPRETATIONS, "육합", ilgan),
    samhap: samhapInterps,
    banghap: banghapInterps,
    yukchung: _lookupJiRels(rels.yukchung, YUKCHUNG_INTERPRETATIONS, "충", ilgan),
    yukhyung: _lookupJiRels(rels.yukhyung, YUKHYUNG_INTERPRETATIONS, "형", ilgan),
    yukpa: _lookupJiRels(rels.yukpa, YUKPA_INTERPRETATIONS, "파", ilgan),
    yukae: _lookupJiRels(rels.yukae, YUKAE_INTERPRETATIONS, "해", ilgan),
    amhap: { concept: AMHAP_CONCEPT, note: amhapNote },
    ganjiInterp: ganji ? ((isSewoon ? SEWOON_GANJI_INTERP : DAEWOON_GANJI_INTERP)[ganji] ?? null) : null,
    ganjiIlganInterp: (ganji && ilgan) ? ((isSewoon ? SEWOON_ILGAN_INTERP : DAEWOON_ILGAN_INTERP)[ganji]?.[ilgan] ?? null) : null,
  };
}

// ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

/** 관계 문자열 "子午(daewoon-year)"에서 대운 지지 추출 */
function getDaewoonJiFromRelStr(str: string): string | null {
  const m = str.match(/^(.)(.)\((.+)-(.+)\)$/);
  if (!m) return null;
  if (m[3] === "daewoon") return m[1];
  if (m[4] === "daewoon") return m[2];
  return null;
}

/** daewoon-jiji.data.ts에서 일간별 추가 해석 조회 */
function getJijiIlganText(
  relStr: string,
  relType: JijiRelType,
  ilgan: string
): string {
  if (!ilgan) return "";
  const daewoonJi = getDaewoonJiFromRelStr(relStr);
  if (!daewoonJi) return "";
  return DAEWOON_JIJI_INTERP[daewoonJi]?.[ilgan as Ilgan]?.[relType] ?? "";
}

function _lookupJiRels(
  list: string[],
  map: Record<string, JiRelInterpretation>,
  relType?: JijiRelType,
  ilgan = ""
): JiRelInterpretation[] {
  const result: JiRelInterpretation[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const key = relKey(s);
    if (!seen.has(key)) {
      const interp = map[key] ?? null;
      if (interp) {
        const ilganText = relType ? getJijiIlganText(s, relType, ilgan) : "";
        result.push(ilganText ? { ...interp, ilganEssence: ilganText } : interp);
        seen.add(key);
      }
    }
  }
  return result;
}

/** yongsinType 문자열 → YONGSIN_TYPE_INTERPRETATIONS 키로 변환 */
function _resolveYongsinKey(type: string): string {
  if (type.includes("인성") || type === "印") return "인성용신";
  if (type.includes("재성") || type === "財") return "재성용신";
  if (type.includes("관성") || type === "官") return "관성용신";
  if (type.includes("식상") || type === "食" || type === "傷") return "식상용신";
  if (type.includes("비겁") || type === "比") return "비겁용신";
  // 부분 매칭
  if (type.includes("印") || type.includes("인")) return "인성용신";
  if (type.includes("財") || type.includes("재")) return "재성용신";
  if (type.includes("官") || type.includes("관")) return "관성용신";
  if (type.includes("食") || type.includes("傷") || type.includes("식") || type.includes("상")) return "식상용신";
  if (type.includes("比") || type.includes("劫") || type.includes("비") || type.includes("겁")) return "비겁용신";
  return type;
}
