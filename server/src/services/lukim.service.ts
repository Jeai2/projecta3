/**
 * 육임정단(六壬精斷) 계산 엔진
 *
 * A. 월장 (月將) - 절기 기준 월장 지지 결정
 * B. 천지반도 - 월장가시 + 시계방향 짝꿍1 + 천장 짝꿍2 + 둔간 짝꿍3
 * C. 사과 (四課) - 4개의 과
 * D. 삼전 (三傳) - 10과 판별 + 초·중·말전
 */

import { getSeasonalData } from "./seasonal-data.loader";
import { getDayGanji } from "./saju.service";
import { GAN, JI_OHENG, GAN_OHENG, YANGGAN_LIST, SIPSIN_TABLE } from "../data/saju.data";
import { YUKHAP, YUKCHUNG, YUKHYUNG, YUKPA, YUKAE } from "../data/relationship.data";
import { SINSAL_12_MAP, getSamhapGroup } from "../data/sinsal";
import {
  getSeonbongInterpretation,
  type SeonbongInterpretation,
} from "../data/seonbong-interpretations";

export type WoljangJi = "子" | "亥" | "戌" | "酉" | "申" | "未" | "午" | "巳" | "辰" | "卯" | "寅" | "丑";

/** 월장 범위: [시작절기, 끝절기] - target >= 시작절기.date && target < 끝절기.date */
const WOLJANG_RANGES: { ji: WoljangJi; start: string; end: string }[] = [
  { ji: "子", start: "대한", end: "우수" } /* 대한 ~ 입춘 */,
  { ji: "亥", start: "우수", end: "경칩" },
  { ji: "戌", start: "춘분", end: "청명" },
  { ji: "酉", start: "곡우", end: "입하" },
  { ji: "申", start: "소만", end: "망종" },
  { ji: "未", start: "하지", end: "소서" },
  { ji: "午", start: "대서", end: "입추" },
  { ji: "巳", start: "처서", end: "백로" },
  { ji: "辰", start: "추분", end: "한로" },
  { ji: "卯", start: "상강", end: "입동" },
  { ji: "寅", start: "소설", end: "대설" },
  { ji: "丑", start: "동지", end: "소한" } /* 동지 ~ 소한 (연말~연초) */,
];

function getJeolgiDate(
  seasonal: { name: string; date: Date }[],
  name: string
): Date | null {
  const found = seasonal.find((s) => s.name === name);
  return found ? found.date : null;
}

/**
 * 절기 기준 월장(月將) 지지를 반환한다.
 *
 * @param targetDate 점시(占時) 또는 대상 날짜
 * @returns 월장 지지 (子, 亥, 戌, ... 등) 또는 null (데이터 부족 시)
 *
 * @example
 * // 2026-02-04 12:00 (입춘 당일) → 子
 * // 2026-03-15 (춘분~청명 구간) → 戌
 */
export function getWoljang(targetDate: Date): WoljangJi | null {
  const year = targetDate.getFullYear();

  const seasonalThis = getSeasonalData(year);
  const seasonalNext = getSeasonalData(year + 1);

  if (!seasonalThis.length) return null;

  for (const range of WOLJANG_RANGES) {
    const startDate = getJeolgiDate(seasonalThis, range.start);
    let endDate: Date | null;

    if (range.end === "소한" && range.start === "동지") {
      // 丑: 동지 ~ (다음해) 소한
      endDate = getJeolgiDate(seasonalNext, "소한");
    } else {
      endDate = getJeolgiDate(seasonalThis, range.end);
    }

    if (!startDate || !endDate) continue;

    if (targetDate >= startDate && targetDate < endDate) {
      return range.ji;
    }
  }

  return null;
}

/**
 * 현실 시간을 점시(占時) 지지로 변환한다.
 * 한국 기준: 동경(일본) 시간대 +30분 적용.
 * 경계: 각 지지 끝 29분, 다음 지지 시작 30분. 전자/후자 구분 없음.
 *
 * @param targetDate 점치 시각 (로컬 시간)
 * @returns 점시 지지 (子, 丑, 寅, ... 등)
 *
 * @example
 * // 2026-02-26 00:17 → 子
 * // 2026-02-26 12:00 → 午
 */
export function getJeomsi(targetDate: Date): WoljangJi {
  const h = targetDate.getHours();
  const m = targetDate.getMinutes();
  const total = h * 60 + m;

  // 子: 23:30~01:29
  if (total >= 1410 || total < 90) return "子";
  if (total < 210) return "丑"; // 01:30~03:29
  if (total < 330) return "寅"; // 03:30~05:29
  if (total < 450) return "卯"; // 05:30~07:29
  if (total < 570) return "辰"; // 07:30~09:29
  if (total < 690) return "巳"; // 09:30~11:29
  if (total < 810) return "午"; // 11:30~13:29
  if (total < 930) return "未"; // 13:30~15:29
  if (total < 1050) return "申"; // 15:30~17:29
  if (total < 1170) return "酉"; // 17:30~19:29
  if (total < 1290) return "戌"; // 19:30~21:29
  return "亥"; // 21:30~23:29
}

/** 일지-시지 간 형충파해합 관계 */
export type JijiRelationType = "육합" | "육충" | "육형" | "육파" | "육해";

/**
 * 선봉법(先鋒法) - 질문자의 고민을 먼저 알아내는 육임술법
 *
 * 기준: 일진의 천간(일간). 일간을 기준으로 일지·시지의 십성을 대입하고,
 * 일지와 시지 간 형충파해합도 함께 판단한다.
 *
 * @param targetDate 점치 시각 (날짜+시간). 예: 2026-03-07 16:30 → 庚辰日 + 申시
 * @returns 선봉법 결과 (일진, 십성, 지지관계, 해석은 사용자 작성)
 *
 * @example
 * // 2026-03-07 16:30 → 일진 庚辰, 정단 시지 申
 * // sipsinOfIlji: 편인(庚+辰), sipsinOfJeomsi: 비견(庚+申)
 * // jijiRelations: ["육해"] (辰-申)
 */
export interface SeonbongResult {
  iljinGanji: string;
  ilgan: string;
  ilji: string;
  jeomsiJi: WoljangJi;
  /** 일간 기준 일지의 십성 */
  sipsinOfIlji: string;
  /** 일간 기준 시지(정단 시지)의 십성 */
  sipsinOfJeomsi: string;
  /** 일지-시지 간 형충파해합 (육합, 육충, 육형, 육파, 육해) */
  jijiRelations: JijiRelationType[];
  /** 일지 기준 시지의 12신살 (지살, 년살, 월살, 망신, 장성, 반안, 역마, 육해, 화개, 겁살, 재살, 천살) */
  sinsalOfJeomsi: string;
  /** 해석 (seonbong-interpretations.ts에서 사용자가 작성) */
  interpretation: ReturnType<typeof getSeonbongInterpretation> extends infer T
    ? T extends SeonbongInterpretation | null
      ? T
      : never
    : never;
}

function getJijiRelations(ilji: string, jeomsiJi: string): JijiRelationType[] {
  const relations: JijiRelationType[] = [];
  if (YUKHAP[ilji] === jeomsiJi) relations.push("육합");
  if (YUKCHUNG[ilji] === jeomsiJi) relations.push("육충");
  if (YUKPA[ilji] === jeomsiJi) relations.push("육파");
  if (YUKAE[ilji] === jeomsiJi) relations.push("육해");
  if (YUKHYUNG[ilji]?.includes(jeomsiJi)) relations.push("육형");
  return relations;
}

export function getSeonbong(targetDate: Date): SeonbongResult {
  const iljinGanji = getDayGanji(targetDate);
  const ilgan = iljinGanji[0];
  const ilji = iljinGanji.charAt(1) as WoljangJi;
  const jeomsiJi = getJeomsi(targetDate);

  const tableE = SIPSIN_TABLE.e as Record<string, Record<string, string>>;
  const sipsinOfIlji = tableE[ilgan]?.[ilji] ?? "";
  const sipsinOfJeomsi = tableE[ilgan]?.[jeomsiJi] ?? "";
  const jijiRelations = getJijiRelations(ilji, jeomsiJi);

  const samhapGroup = getSamhapGroup(ilji);
  const sinsalOfJeomsi =
    samhapGroup && SINSAL_12_MAP[samhapGroup]
      ? SINSAL_12_MAP[samhapGroup][jeomsiJi] ?? ""
      : "";

  const interpretation = getSeonbongInterpretation(sipsinOfJeomsi);

  return {
    iljinGanji,
    ilgan,
    ilji,
    jeomsiJi,
    sipsinOfIlji,
    sipsinOfJeomsi,
    jijiRelations,
    sinsalOfJeomsi,
    interpretation,
  };
}

/** 12지지 표준 순서 (시계방향: 子→丑→寅→…→亥) */
const JI_STANDARD_ORDER: WoljangJi[] = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
];

/**
 * 천반 배치: 점시 위치에 월장을 두고, 시계방향(子→丑→寅→…→亥)으로 이어 붙인다.
 * 예: 午시 亥월장 → 천반 순서 亥,子,丑,寅,卯,辰,巳,午,未,申,酉,戌
 */

/** 12천장 (天將) */
export type Cheonjang =
  | "貴"
  | "蛇"
  | "朱"
  | "合"
  | "句"
  | "靑"
  | "空"
  | "白"
  | "常"
  | "玄"
  | "陰"
  | "后";

const CHEONJANG_ORDER: Cheonjang[] = [
  "貴", "蛇", "朱", "合", "句", "靑", "空", "白", "常", "玄", "陰", "后",
];

/** 귀인(貴人) 지지: [낮, 밤] - 일간별 */
const GWIGIN_MAP: Record<string, [WoljangJi, WoljangJi]> = {
  甲: ["丑", "未"],
  乙: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  戊: ["丑", "未"],
  己: ["子", "申"],
  庚: ["丑", "未"],
  辛: ["午", "寅"],
  壬: ["巳", "卯"],
  癸: ["巳", "卯"],
};

/** 낮 시진: 묘진사오미신 (05:30~17:29) */
const DAY_JIS: WoljangJi[] = ["卯", "辰", "巳", "午", "未", "申"];
/** 시계방향(해자축인묘진) 지반 → 귀인 지반이 여기 있으면 시계방향 */
const CW_JIBAN: WoljangJi[] = ["亥", "子", "丑", "寅", "卯", "辰"];

/** 둔간(遁干) 또는 공망(空亡) - 짝꿍3 */
export type Dunggan = string; // 甲~癸 또는 "공망"

export interface CheonjibandoPair {
  /** 지반(地盤) - 고정 위치의 지지 */
  jiban: WoljangJi;
  /** 천반(天盤) - 월장가시로 배치된 지지 */
  cheonban: WoljangJi;
  /** 천장(天將) - 짝꿍2 */
  cheonjang?: Cheonjang;
  /** 둔간(遁干) 또는 공망(空亡) - 짝꿍3 */
  dunggan?: Dunggan;
}

/**
 * 천지반도(天地盤圖)를 계산한다.
 * 짝꿍1: 월장가시 + 시계방향 지반↔천반
 * 짝꿍2: 일운 일간 기준 귀인 배치 + 천장 매칭
 * 짝꿍3: 일운 일지 기준 둔간(甲~癸) + 공망(2자리)
 *
 * @param targetDate 점치 시각 (로컬 시간)
 * @returns 12개 짝꿍 배열 (지반↔천반↔천장↔둔간/공망), 또는 null (월장 데이터 부족 시)
 */
export function getCheonjibando(targetDate: Date): CheonjibandoPair[] | null {
  const jeomsi = getJeomsi(targetDate);
  const woljang = getWoljang(targetDate);
  if (!woljang) return null;

  // 점시에서 시작하는 시계방향 지지 순서 (지반)
  const jeomsiIdx = JI_STANDARD_ORDER.indexOf(jeomsi);
  const jibanOrder: WoljangJi[] = [];
  for (let i = 0; i < 12; i++) {
    jibanOrder.push(JI_STANDARD_ORDER[(jeomsiIdx + i) % 12]);
  }

  // 천반: 월장을 맨 앞에 두고 시계방향(子→丑→…→亥)으로 이어 붙임
  const woljangIdx = JI_STANDARD_ORDER.indexOf(woljang);
  const cheonbanOrder: WoljangJi[] = [];
  for (let i = 0; i < 12; i++) {
    cheonbanOrder.push(JI_STANDARD_ORDER[(woljangIdx + i) % 12]);
  }

  const pairs: CheonjibandoPair[] = jibanOrder.map((jiban, i) => ({
    jiban,
    cheonban: cheonbanOrder[i],
  }));

  // 짝꿍2: 천장 배치
  const iljinGanji = getDayGanji(targetDate);
  const ilwoonGan = iljinGanji[0]; // 일운의 일간
  const gwiginEntry = GWIGIN_MAP[ilwoonGan];
  if (!gwiginEntry) return pairs;

  const [dayGwigin, nightGwigin] = gwiginEntry;
  const isDay = DAY_JIS.includes(jeomsi);
  const gwiginJi = isDay ? dayGwigin : nightGwigin;

  // 천반 === 귀인 지지인 위치 찾기 (귀인 배치)
  const gwiginPairIdx = pairs.findIndex((p) => p.cheonban === gwiginJi);
  if (gwiginPairIdx < 0) return pairs;

  const gwiginJiban = pairs[gwiginPairIdx].jiban;
  const isClockwise = CW_JIBAN.includes(gwiginJiban);

  // 귀인 위치에 貴, 나머지 천장을 방향에 따라 배치
  const jibanToCheonjang = new Map<WoljangJi, Cheonjang>();
  for (let i = 0; i < 12; i++) {
    const idx = isClockwise
      ? (gwiginPairIdx + i) % 12
      : (gwiginPairIdx - i + 12) % 12;
    jibanToCheonjang.set(pairs[idx].jiban, CHEONJANG_ORDER[i]);
  }

  let result = pairs.map((p) => ({
    ...p,
    cheonjang: jibanToCheonjang.get(p.jiban),
  }));

  // 짝꿍3: 둔간(遁干) + 공망(空亡)
  const ilwoonJi = iljinGanji.charAt(1) as WoljangJi; // 일운의 일지
  const dungganStartIdx = result.findIndex((p) => p.cheonban === ilwoonJi);
  if (dungganStartIdx >= 0) {
    const cheonbanToDunggan = new Map<WoljangJi, Dunggan>();
    for (let i = 0; i < 12; i++) {
      const idx = (dungganStartIdx + i) % 12;
      const pair = result[idx];
      cheonbanToDunggan.set(
        pair.cheonban,
        i < 10 ? GAN[i] : "공망"
      );
    }
    result = result.map((p) => ({
      ...p,
      dunggan: cheonbanToDunggan.get(p.cheonban),
    }));
  }

  return result;
}

/** 기궁(基宮) 도표: 일간 → 기궁 (일간의 體) */
const GIGUNG_MAP: Record<string, WoljangJi> = {
  甲: "寅",
  乙: "辰",
  丙: "巳",
  丁: "未",
  戊: "巳",
  己: "未",
  庚: "申",
  辛: "戌",
  壬: "亥",
  癸: "丑",
};

/** 천지반도에서 지반으로 행 조회 */
function findPairByJiban(
  cheonjibando: CheonjibandoPair[],
  jiban: WoljangJi
): CheonjibandoPair | undefined {
  return cheonjibando.find((p) => p.jiban === jiban);
}

/** 1과: 일간(기궁) + 일간 상신 + 1과 천장 + 1과 둔간 */
export interface Sagwa1 {
  gan: string;
  gigung: WoljangJi;
  sangsin: WoljangJi;
  cheonjang?: Cheonjang;
  dunggan?: Dunggan;
}

/** 2과: 2과 지반 + 2과 상신 + 2과 천장 + 2과 둔간 */
export interface Sagwa2 {
  jiban: WoljangJi;
  sangsin: WoljangJi;
  cheonjang?: Cheonjang;
  dunggan?: Dunggan;
}

/** 3과: 일지 + 일지 상신 + 일지 천장 + 일지 둔간 */
export interface Sagwa3 {
  jiban: WoljangJi; // 일지
  sangsin: WoljangJi;
  cheonjang?: Cheonjang;
  dunggan?: Dunggan;
}

/** 4과: 4과 지반 + 4과 상신 + 4과 천장 + 4과 둔간 */
export interface Sagwa4 {
  jiban: WoljangJi;
  sangsin: WoljangJi;
  cheonjang?: Cheonjang;
  dunggan?: Dunggan;
}

export interface Sagwa {
  gw1: Sagwa1;
  gw2: Sagwa2;
  gw3: Sagwa3;
  gw4: Sagwa4;
}

/**
 * 사과(四課)를 계산한다.
 * 천지반도(B)를 기반으로 4개의 과를 도출.
 *
 * @param targetDate 점치 시각 (로컬 시간)
 * @returns 사과 4개 (gw1~gw4), 또는 null (천지반도/기궁 데이터 부족 시)
 */
export function getSagwa(targetDate: Date): Sagwa | null {
  const cheonjibando = getCheonjibando(targetDate);
  if (!cheonjibando) return null;

  const iljinGanji = getDayGanji(targetDate);
  const ilwoonGan = iljinGanji.charAt(0);
  const ilwoonJi = iljinGanji.charAt(1) as WoljangJi;

  const gigung = GIGUNG_MAP[ilwoonGan];
  if (!gigung) return null;

  // 1과: 지반=기궁
  const pair1 = findPairByJiban(cheonjibando, gigung);
  if (!pair1) return null;

  const gw1: Sagwa1 = {
    gan: ilwoonGan,
    gigung,
    sangsin: pair1.cheonban,
    cheonjang: pair1.cheonjang,
    dunggan: pair1.dunggan,
  };

  // 2과: 지반=1과 상신
  const pair2 = findPairByJiban(cheonjibando, gw1.sangsin);
  if (!pair2) return null;

  const gw2: Sagwa2 = {
    jiban: gw1.sangsin,
    sangsin: pair2.cheonban,
    cheonjang: pair2.cheonjang,
    dunggan: pair2.dunggan,
  };

  // 3과: 지반=일지
  const pair3 = findPairByJiban(cheonjibando, ilwoonJi);
  if (!pair3) return null;

  const gw3: Sagwa3 = {
    jiban: ilwoonJi,
    sangsin: pair3.cheonban,
    cheonjang: pair3.cheonjang,
    dunggan: pair3.dunggan,
  };

  // 4과: 지반=3과 상신
  const pair4 = findPairByJiban(cheonjibando, gw3.sangsin);
  if (!pair4) return null;

  const gw4: Sagwa4 = {
    jiban: gw3.sangsin,
    sangsin: pair4.cheonban,
    cheonjang: pair4.cheonjang,
    dunggan: pair4.dunggan,
  };

  return { gw1, gw2, gw3, gw4 };
}

// =================================================================
// D. 삼전 (三傳)
// =================================================================

/** 오행 상극 관계: key가 value를 극한다 */
const OHENG_GEUK: Record<string, string> = {
  木: "土", 土: "水", 水: "火", 火: "金", 金: "木",
};

/** 지지 → 오행 */
function jiToOheng(ji: WoljangJi): string {
  return JI_OHENG[ji];
}

/** 천간 → 오행 */
function ganToOheng(gan: string): string {
  return GAN_OHENG[gan];
}

/** a가 b를 극하는지 */
function doesGeuk(aOheng: string, bOheng: string): boolean {
  return OHENG_GEUK[aOheng] === bOheng;
}

/** 양천간 여부 */
function isYangGan(gan: string): boolean {
  return YANGGAN_LIST.includes(gan);
}

/** 양지지 여부 */
const YANG_JI: WoljangJi[] = ["子", "寅", "辰", "午", "申", "戌"];
function isYangJi(ji: WoljangJi): boolean {
  return YANG_JI.includes(ji);
}

/** 충(沖) 매핑 */
const CHUNG_MAP: Record<WoljangJi, WoljangJi> = {
  子: "午", 午: "子", 丑: "未", 未: "丑",
  寅: "申", 申: "寅", 卯: "酉", 酉: "卯",
  辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳",
};

/** 삼합 그룹 */
const SAMHAP_GROUPS: WoljangJi[][] = [
  ["亥", "卯", "未"],
  ["寅", "午", "戌"],
  ["巳", "酉", "丑"],
  ["申", "子", "辰"],
];

/** 삼합 역마(생지) */
const SAMHAP_YEOKMA: Record<string, WoljangJi> = {
  "亥卯未": "巳", "寅午戌": "申", "巳酉丑": "亥", "申子辰": "寅",
};

/** 삼형 매핑 (다음 글자) */
const SAMHYUNG_NEXT: Record<WoljangJi, WoljangJi> = {
  寅: "巳", 巳: "申", 申: "寅",
  丑: "戌", 戌: "未", 未: "丑",
} as Record<WoljangJi, WoljangJi>;

/** 자형 지지 */
const JAHYUNG_JI: WoljangJi[] = ["辰", "午", "酉", "亥"];

/** 지반 우선순위 그룹: 인신사해 > 자오묘유 > 진술축미 */
const JIBAN_PRIORITY_GROUPS: WoljangJi[][] = [
  ["寅", "申", "巳", "亥"],
  ["子", "午", "卯", "酉"],
  ["辰", "戌", "丑", "未"],
];

/** 팔전과 양 매핑: 1과 천반 → 천지반도 지반 (+2) */
const PALJEON_YANG_MAP: Record<WoljangJi, WoljangJi> = {
  子: "寅", 丑: "卯", 寅: "辰", 卯: "巳", 辰: "午", 巳: "未",
  午: "申", 未: "酉", 申: "戌", 酉: "亥", 戌: "子", 亥: "丑",
};

/** 팔전과 음 매핑: 4과 천반 → 천지반도 지반 (-2) */
const PALJEON_EUM_MAP: Record<WoljangJi, WoljangJi> = {
  子: "戌", 丑: "亥", 寅: "子", 卯: "丑", 辰: "寅", 巳: "卯",
  午: "辰", 未: "巳", 申: "午", 酉: "未", 戌: "申", 亥: "酉",
};

/** 별책과 양 매핑: 천간 → 천지반도 지반 */
const BYEOLCHAEK_YANG_MAP: Record<string, WoljangJi> = {
  甲: "未", 丙: "戌", 戊: "丑", 庚: "辰", 壬: "未",
};

/** 사과 각 과의 지반/상신(천반) 추출 (1과는 기궁이 지반) */
interface GwaEntry {
  gwNum: number;
  jiban: WoljangJi;
  sangsin: WoljangJi;
}

function sagwaToEntries(sagwa: Sagwa): GwaEntry[] {
  return [
    { gwNum: 1, jiban: sagwa.gw1.gigung, sangsin: sagwa.gw1.sangsin },
    { gwNum: 2, jiban: sagwa.gw2.jiban, sangsin: sagwa.gw2.sangsin },
    { gwNum: 3, jiban: sagwa.gw3.jiban, sangsin: sagwa.gw3.sangsin },
    { gwNum: 4, jiban: sagwa.gw4.jiban, sangsin: sagwa.gw4.sangsin },
  ];
}

/** 극·적 판별 결과 */
interface GeukJeok {
  gwNum: number;
  type: "극" | "적";
  jiban: WoljangJi;
  sangsin: WoljangJi;
}

/** 사과 4개의 극·적 분석 */
function analyzeGeukJeok(entries: GwaEntry[]): GeukJeok[] {
  const result: GeukJeok[] = [];
  for (const e of entries) {
    const jibanOheng = jiToOheng(e.jiban);
    const sangsinOheng = jiToOheng(e.sangsin);
    if (doesGeuk(sangsinOheng, jibanOheng)) {
      result.push({ gwNum: e.gwNum, type: "극", jiban: e.jiban, sangsin: e.sangsin });
    } else if (doesGeuk(jibanOheng, sangsinOheng)) {
      result.push({ gwNum: e.gwNum, type: "적", jiban: e.jiban, sangsin: e.sangsin });
    }
  }
  return result;
}

/** 불비 판정 */
function isBulbi(sagwa: Sagwa): boolean {
  const e = sagwaToEntries(sagwa);
  const eq14 = e[0].jiban === e[3].jiban && e[0].sangsin === e[3].sangsin;
  const eq23 = e[1].jiban === e[2].jiban && e[1].sangsin === e[2].sangsin;
  return eq14 || eq23;
}

/** 사과 동일쌍 판정 (팔전과 조건) */
function hasTwoPairs(sagwa: Sagwa): boolean {
  const e = sagwaToEntries(sagwa);
  const same = (a: GwaEntry, b: GwaEntry) =>
    a.jiban === b.jiban && a.sangsin === b.sangsin;
  return (same(e[0], e[2]) && same(e[1], e[3])) ||
         (same(e[0], e[3]) && same(e[1], e[2]));
}

/** 삼합 그룹에서 다음 글자 */
function samhapNext(ji: WoljangJi): WoljangJi | null {
  for (const group of SAMHAP_GROUPS) {
    const idx = group.indexOf(ji);
    if (idx >= 0) return group[(idx + 1) % 3];
  }
  return null;
}

/** 삼합 역마 조회 */
function getYeokma(ji: WoljangJi): WoljangJi | null {
  for (const group of SAMHAP_GROUPS) {
    if (group.includes(ji)) {
      const key = group.join("");
      return SAMHAP_YEOKMA[key] ?? null;
    }
  }
  return null;
}

/** 삼전 결과 */
export type SamjeonGwaName =
  | "원수과" | "중심과" | "지일과" | "지일과2"
  | "섭해과" | "요극과" | "묘성과" | "별책과"
  | "팔전과" | "복음과" | "반음과";

export interface SamjeonJeon {
  jiban: WoljangJi;
  cheonban: WoljangJi;
  cheonjang?: Cheonjang;
  dunggan?: Dunggan;
}

export interface Samjeon {
  gwaName: SamjeonGwaName;
  cho: SamjeonJeon;
  jung: SamjeonJeon;
  mal: SamjeonJeon;
}

/** 천지반도 지반 행 → SamjeonJeon */
function pairToJeon(pair: CheonjibandoPair): SamjeonJeon {
  return {
    jiban: pair.jiban,
    cheonban: pair.cheonban,
    cheonjang: pair.cheonjang,
    dunggan: pair.dunggan,
  };
}

/** 사과 과 → SamjeonJeon */
function gwaToJeon(sagwa: Sagwa, gwNum: number): SamjeonJeon {
  const e = sagwaToEntries(sagwa);
  const entry = e[gwNum - 1];
  const gw = gwNum === 1 ? sagwa.gw1
    : gwNum === 2 ? sagwa.gw2
    : gwNum === 3 ? sagwa.gw3
    : sagwa.gw4;
  return {
    jiban: entry.jiban,
    cheonban: entry.sangsin,
    cheonjang: gw.cheonjang,
    dunggan: gw.dunggan,
  };
}

/** 기본 중·말전: 초전 천반 → 천지반도 지반 → 중전, 중전 천반 → 지반 → 말전 */
function defaultJungMal(
  cho: SamjeonJeon,
  cheonjibando: CheonjibandoPair[]
): { jung: SamjeonJeon; mal: SamjeonJeon } {
  const jungPair = findPairByJiban(cheonjibando, cho.cheonban);
  const jung = jungPair ? pairToJeon(jungPair) : cho;
  const malPair = findPairByJiban(cheonjibando, jung.cheonban);
  const mal = malPair ? pairToJeon(malPair) : jung;
  return { jung, mal };
}

/** 음양 일치 과 필터: 천반 음양이 일진 천간 음양과 일치하는 과 */
function filterByYinYang(items: GeukJeok[], ganIsYang: boolean): GeukJeok[] {
  return items.filter((g) => isYangJi(g.sangsin) === ganIsYang);
}

/** 지반 우선순위로 선택 */
function pickByJibanPriority(items: GeukJeok[]): GeukJeok | null {
  for (const group of JIBAN_PRIORITY_GROUPS) {
    const found = items.find((g) => group.includes(g.jiban));
    if (found) return found;
  }
  return items[0] ?? null;
}

/**
 * 삼전(三傳)을 계산한다.
 * 사과 + 천지반도를 기반으로 10과 중 하나를 판별하고 초·중·말전을 결정.
 */
export function getSamjeon(targetDate: Date): Samjeon | null {
  const cheonjibando = getCheonjibando(targetDate);
  if (!cheonjibando) return null;

  const sagwa = getSagwa(targetDate);
  if (!sagwa) return null;

  const iljinGanji = getDayGanji(targetDate);
  const ilGan = iljinGanji.charAt(0);
  const ilJi = iljinGanji.charAt(1) as WoljangJi;
  const ganIsYang = isYangGan(ilGan);

  const jeomsi = getJeomsi(targetDate);
  const woljang = getWoljang(targetDate);

  const entries = sagwaToEntries(sagwa);
  const geukJeokList = analyzeGeukJeok(entries);
  const geukList = geukJeokList.filter((g) => g.type === "극");
  const jeokList = geukJeokList.filter((g) => g.type === "적");

  const bulbi = isBulbi(sagwa);
  const twoPairs = hasTwoPairs(sagwa);

  const isBokeum = sagwa.gw1.gigung === sagwa.gw1.sangsin;
  const isBaneum = woljang ? CHUNG_MAP[jeomsi] === woljang : false;

  // --- 과 판별 트리 ---

  // 1. 복음과
  if (isBokeum) {
    return calcBokeum(sagwa, cheonjibando, geukJeokList, jeokList, geukList, ganIsYang, entries);
  }

  // 2. 반음과
  if (isBaneum) {
    return calcBaneum(sagwa, cheonjibando, geukJeokList, jeokList, geukList, ilJi);
  }

  // 3. 원수과: 극이 정확히 1개
  if (geukList.length === 1 && jeokList.length === 0) {
    const cho = gwaToJeon(sagwa, geukList[0].gwNum);
    const { jung, mal } = defaultJungMal(cho, cheonjibando);
    return { gwaName: "원수과", cho, jung, mal };
  }

  // 4. 중심과: 적이 정확히 1개
  if (jeokList.length === 1 && geukList.length === 0) {
    const cho = gwaToJeon(sagwa, jeokList[0].gwNum);
    const { jung, mal } = defaultJungMal(cho, cheonjibando);
    return { gwaName: "중심과", cho, jung, mal };
  }

  // 5. 지일과: 적이 2개
  if (jeokList.length === 2) {
    const matched = filterByYinYang(jeokList, ganIsYang);
    if (matched.length > 0) {
      const cho = gwaToJeon(sagwa, matched[0].gwNum);
      const { jung, mal } = defaultJungMal(cho, cheonjibando);
      return { gwaName: "지일과", cho, jung, mal };
    }
    // 음양 불일치 → 섭해과
    return calcSeophae(jeokList, sagwa, cheonjibando);
  }

  // 6. 지일과2: 극이 2개 이상
  if (geukList.length >= 2) {
    const matched = filterByYinYang(geukList, ganIsYang);
    if (matched.length > 0) {
      const cho = gwaToJeon(sagwa, matched[0].gwNum);
      const { jung, mal } = defaultJungMal(cho, cheonjibando);
      return { gwaName: "지일과2", cho, jung, mal };
    }
    // 음양 불일치 → 섭해과
    return calcSeophae(geukList, sagwa, cheonjibando);
  }

  // 7. 극·적 0개 → 요극과 판별
  if (geukJeokList.length === 0) {
    const ilGanOheng = ganToOheng(ilGan);
    const tansakList: { gwNum: number; sangsin: WoljangJi }[] = [];
    const hoshiList: { gwNum: number; sangsin: WoljangJi }[] = [];

    for (let i = 1; i < 4; i++) {
      const e = entries[i];
      const sangsinOheng = jiToOheng(e.sangsin);
      if (doesGeuk(ilGanOheng, sangsinOheng)) {
        tansakList.push({ gwNum: e.gwNum, sangsin: e.sangsin });
      } else if (doesGeuk(sangsinOheng, ilGanOheng)) {
        hoshiList.push({ gwNum: e.gwNum, sangsin: e.sangsin });
      }
    }

    if (hoshiList.length > 0 || tansakList.length > 0) {
      const primary = hoshiList.length > 0 ? hoshiList : tansakList;

      let choGwNum: number;
      if (primary.length === 1) {
        choGwNum = primary[0].gwNum;
      } else {
        const matched = primary.filter((p) => isYangJi(p.sangsin) === ganIsYang);
        choGwNum = matched.length > 0 ? matched[0].gwNum : primary[0].gwNum;
      }

      const cho = gwaToJeon(sagwa, choGwNum);
      const { jung, mal } = defaultJungMal(cho, cheonjibando);
      return { gwaName: "요극과", cho, jung, mal };
    }

    // 요극과에도 해당 안 됨
    if (bulbi) {
      return calcByeolchaek(sagwa, cheonjibando, ilGan, ilJi, ganIsYang);
    }

    return calcMyoseong(sagwa, cheonjibando, ganIsYang);
  }

  // 8. 팔전과: 동일 모습 2쌍
  if (twoPairs) {
    return calcPaljeon(sagwa, cheonjibando, ganIsYang);
  }

  // 9. 별책과: 불비 + 극·적 없음은 위에서 처리됨, 여기는 극·적 있으나 조건 불일치 잔여
  if (bulbi) {
    return calcByeolchaek(sagwa, cheonjibando, ilGan, ilJi, ganIsYang);
  }

  // 10. 묘성과: 위에 어디에도 해당 안 됨
  return calcMyoseong(sagwa, cheonjibando, ganIsYang);
}

// --- 과별 계산 함수 ---

function calcSeophae(
  items: GeukJeok[],
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[]
): Samjeon {
  const picked = pickByJibanPriority(items);
  const cho = picked ? gwaToJeon(sagwa, picked.gwNum) : gwaToJeon(sagwa, 1);
  const { jung, mal } = defaultJungMal(cho, cheonjibando);
  return { gwaName: "섭해과", cho, jung, mal };
}

function calcMyoseong(
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[],
  ganIsYang: boolean
): Samjeon {
  const yuPair = findPairByJiban(cheonjibando, "酉");
  if (!yuPair) {
    const cho = gwaToJeon(sagwa, 1);
    const { jung, mal } = defaultJungMal(cho, cheonjibando);
    return { gwaName: "묘성과", cho, jung, mal };
  }

  if (ganIsYang) {
    const cho = pairToJeon(yuPair);
    const jung = gwaToJeon(sagwa, 3);
    const mal = gwaToJeon(sagwa, 1);
    return { gwaName: "묘성과", cho, jung, mal };
  } else {
    const nextPair = findPairByJiban(cheonjibando, yuPair.cheonban);
    const cho = nextPair ? pairToJeon(nextPair) : pairToJeon(yuPair);
    const jung = gwaToJeon(sagwa, 1);
    const mal = gwaToJeon(sagwa, 3);
    return { gwaName: "묘성과", cho, jung, mal };
  }
}

function calcByeolchaek(
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[],
  ilGan: string,
  ilJi: WoljangJi,
  ganIsYang: boolean
): Samjeon {
  const jung = gwaToJeon(sagwa, 1);
  const mal = gwaToJeon(sagwa, 1);

  if (ganIsYang) {
    const targetJiban = BYEOLCHAEK_YANG_MAP[ilGan];
    if (targetJiban) {
      const pair = findPairByJiban(cheonjibando, targetJiban);
      if (pair) {
        return { gwaName: "별책과", cho: pairToJeon(pair), jung, mal };
      }
    }
  } else {
    const nextJi = samhapNext(ilJi);
    if (nextJi) {
      const pair = findPairByJiban(cheonjibando, nextJi);
      if (pair) {
        return { gwaName: "별책과", cho: pairToJeon(pair), jung, mal };
      }
    }
  }

  return { gwaName: "별책과", cho: gwaToJeon(sagwa, 1), jung, mal };
}

function calcPaljeon(
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[],
  ganIsYang: boolean
): Samjeon {
  const jung = gwaToJeon(sagwa, 1);
  const mal = gwaToJeon(sagwa, 1);

  let targetJiban: WoljangJi;
  if (ganIsYang) {
    targetJiban = PALJEON_YANG_MAP[sagwa.gw1.sangsin];
  } else {
    targetJiban = PALJEON_EUM_MAP[sagwa.gw4.sangsin];
  }

  const pair = findPairByJiban(cheonjibando, targetJiban);
  const cho = pair ? pairToJeon(pair) : gwaToJeon(sagwa, 1);

  return { gwaName: "팔전과", cho, jung, mal };
}

function calcBokeum(
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[],
  geukJeokList: GeukJeok[],
  jeokList: GeukJeok[],
  geukList: GeukJeok[],
  ganIsYang: boolean,
  entries: GwaEntry[]
): Samjeon {
  // 초전
  let choGwNum: number;
  if (jeokList.length > 0) {
    choGwNum = jeokList[0].gwNum;
  } else if (geukList.length > 0) {
    choGwNum = geukList[0].gwNum;
  } else {
    choGwNum = ganIsYang ? 1 : 3;
  }
  const cho = gwaToJeon(sagwa, choGwNum);

  // 중전
  const choJiban = cho.jiban;
  const gw1Jiban = entries[0].jiban;
  const gw3Jiban = entries[2].jiban;

  let jung: SamjeonJeon;
  if (JAHYUNG_JI.includes(choJiban) && choJiban === gw1Jiban) {
    jung = gwaToJeon(sagwa, 3);
  } else if (JAHYUNG_JI.includes(choJiban) && choJiban === gw3Jiban) {
    jung = gwaToJeon(sagwa, 1);
  } else if (choJiban === "子") {
    const p = findPairByJiban(cheonjibando, "卯");
    jung = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
  } else if (choJiban === "卯") {
    const p = findPairByJiban(cheonjibando, "子");
    jung = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
  } else if (SAMHYUNG_NEXT[choJiban]) {
    const nextJi = SAMHYUNG_NEXT[choJiban];
    const p = findPairByJiban(cheonjibando, nextJi);
    jung = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
  } else {
    jung = gwaToJeon(sagwa, 1);
  }

  // 말전
  const jungJiban = jung.jiban;
  let mal: SamjeonJeon;
  if (JAHYUNG_JI.includes(jungJiban)) {
    const chungJi = CHUNG_MAP[jungJiban];
    const p = findPairByJiban(cheonjibando, chungJi);
    mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
  } else if (jungJiban === "子") {
    if (JAHYUNG_JI.includes(choJiban)) {
      const p = findPairByJiban(cheonjibando, "卯");
      mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
    } else {
      const p = findPairByJiban(cheonjibando, "午");
      mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
    }
  } else if (jungJiban === "卯") {
    if (JAHYUNG_JI.includes(choJiban)) {
      const p = findPairByJiban(cheonjibando, "子");
      mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
    } else {
      const p = findPairByJiban(cheonjibando, "酉");
      mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
    }
  } else {
    const chungJi = CHUNG_MAP[jungJiban];
    if (chungJi) {
      const p = findPairByJiban(cheonjibando, chungJi);
      mal = p ? pairToJeon(p) : gwaToJeon(sagwa, 1);
    } else {
      mal = gwaToJeon(sagwa, 1);
    }
  }

  return { gwaName: "복음과", cho, jung, mal };
}

function calcBaneum(
  sagwa: Sagwa,
  cheonjibando: CheonjibandoPair[],
  geukJeokList: GeukJeok[],
  jeokList: GeukJeok[],
  geukList: GeukJeok[],
  ilJi: WoljangJi
): Samjeon {
  const hasGeukJeok = geukJeokList.length > 0;

  let cho: SamjeonJeon;
  let usedYeokma = false;

  if (hasGeukJeok) {
    const primary = jeokList.length > 0 ? jeokList : geukList;
    cho = gwaToJeon(sagwa, primary[0].gwNum);
  } else {
    const yeokma = getYeokma(ilJi);
    if (yeokma) {
      const pair = findPairByJiban(cheonjibando, yeokma);
      cho = pair ? pairToJeon(pair) : gwaToJeon(sagwa, 1);
    } else {
      cho = gwaToJeon(sagwa, 1);
    }
    usedYeokma = true;
  }

  let jung: SamjeonJeon;
  let mal: SamjeonJeon;

  if (!usedYeokma) {
    const { jung: j, mal: m } = defaultJungMal(cho, cheonjibando);
    jung = j;
    mal = m;
  } else {
    jung = gwaToJeon(sagwa, 3);
    mal = gwaToJeon(sagwa, 1);
  }

  return { gwaName: "반음과", cho, jung, mal };
}

// =================================================================
// E. 본명·행년 (本命·行年)
// =================================================================

/**
 * 본명(本命): 태어난 띠(지지)를 천지반도 지반에서 찾은 행.
 *
 * @param ddi 이용자의 띠 지지 (예: 1991년생 辛未년 → "未")
 * @param cheonjibando 천지반도 12행
 */
export function getBonmyeong(
  ddi: WoljangJi,
  cheonjibando: CheonjibandoPair[]
): CheonjibandoPair | null {
  return findPairByJiban(cheonjibando, ddi) ?? null;
}

/**
 * 행년(行年): 한 해의 운을 보는 자리.
 * 나이 ÷ 12의 나머지 값으로 지지를 결정하고, 천지반도에서 해당 지반 행을 반환.
 *
 * @param age 이용자 나이 (한국 나이)
 * @param gender 'M' (남) 또는 'F' (여)
 * @param cheonjibando 천지반도 12행
 */
export function getHaengnyeon(
  age: number,
  gender: "M" | "F",
  cheonjibando: CheonjibandoPair[]
): CheonjibandoPair | null {
  const remainder = age % 12;

  let targetJi: WoljangJi;
  if (gender === "M") {
    const inIdx = JI_STANDARD_ORDER.indexOf("寅");
    targetJi = JI_STANDARD_ORDER[(inIdx + remainder - 1 + 12) % 12];
  } else {
    const sinIdx = JI_STANDARD_ORDER.indexOf("申");
    targetJi = JI_STANDARD_ORDER[(sinIdx - (remainder - 1) + 12) % 12];
  }

  return findPairByJiban(cheonjibando, targetJi) ?? null;
}
