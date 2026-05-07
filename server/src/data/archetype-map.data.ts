// server/src/data/archetype-map.data.ts
// Archetype 6 (홀랜드 6유형) 매핑 데이터

import type { JobMapCategoryKey } from "./job-map.data";

export type ArchetypeCode = "R" | "I" | "A" | "S" | "E" | "C";

/** 당령 → 아키타입 (Potential / 잠재력) — 복수 매칭 시 균등 분할 */
export const DANGNYEONG_TO_ARCHETYPE: Record<string, ArchetypeCode[]> = {
  庚: ["R", "C"],
  辛: ["R", "C"],
  癸: ["I", "A"],
  甲: ["I", "S"],
  丁: ["A", "C"],
  乙: ["S", "E"],
  丙: ["S", "E"],
  壬: ["E"],
};

/** 사령 → 아키타입 (Mission / 실무 미션) - 복수 매칭 시 균등 분할 */
export const SARYEONG_GAN_TO_ARCHETYPE: Record<string, ArchetypeCode[]> = {
  庚: ["R"],
  丁: ["C", "A"],
  戊: ["E", "S"],
  癸: ["I", "A"],
  甲: ["I", "S"],
  己: ["C"],
  乙: ["S"],
  丙: ["S", "E"],
  壬: ["R", "I"],
  辛: ["C", "R"],
};

/** 주력십신 → 아키타입 (복수 시 균등 분할) */
export const SIPSIN_TO_ARCHETYPE: Record<string, ArchetypeCode[]> = {
  비견: ["R"],
  겁재: ["S"],
  식신: ["I"],
  상관: ["A"],
  편재: ["E"],
  정재: ["R", "C"],
  편관: ["E"],
  정관: ["C"],
  편인: ["A"],
  정인: ["I", "S"],
};

/** 아키타입별 보조십신 — 원국 미존재/부족 오행일 때, 해당 십신이 있으면 보조 점수 */
export const ARCHETYPE_AUX_SIPSIN: Record<ArchetypeCode, string[]> = {
  R: ["겁재", "편재"],
  I: ["편인", "정재"],
  A: ["식신", "상관"],
  S: ["비견", "겁재"],
  E: ["편인", "상관"],
  C: ["정인", "식신"],
};

/** 전승(직군 Key) → 아키타입 (복수 시 균등 분할) */
export const JOB_LEGACY_KEY_TO_ARCHETYPE: Record<
  JobMapCategoryKey,
  ArchetypeCode[]
> = {
  dojae_eoup: ["R", "S"],
  tacheol_uigi: ["R", "C"],
  sujak_bojo: ["R", "A"],
  sujae_jori: ["I", "R"],
  seungdo_seonsaeng: ["I", "A"],
  eumyak_gyeongong: ["A", "S"],
  sasul_doin: ["S", "I"],
  jebong_gyosa: ["S", "C"],
  guanin_nongup: ["S", "C"],
  jugwan_uieop: ["A", "S"],
  uibok_posu: ["I", "E"],
  misang_sangin: ["E", "C"],
};

/** 오행 → 아키타입 (주력 오행) */
export const OHAENG_TO_ARCHETYPE: Record<string, ArchetypeCode[]> = {
  金: ["R", "C"],
  土: ["S", "E"],
  水: ["I", "A"],
  木: ["I", "S"],
  火: ["E", "A"],
};

/** 아키타입별 주력 오행 (점수 산출용) */
export const ARCHETYPE_PRIMARY_OHAENG: Record<ArchetypeCode, string[]> = {
  R: ["金", "土"],
  I: ["水", "木"],
  A: ["火", "木"],
  S: ["木", "土"],
  E: ["火", "金"],
  C: ["土", "金"],
};

/** 천간 한글 → 한자 */
export const HANGUL_TO_HANJA_GAN: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};
