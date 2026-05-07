// server/src/services/relationship.service.ts
// 지지 간 관계 계산 서비스

import { JIJI_RELATIONSHIPS } from "../data/relationship.data";
import { GAN_OHENG, JI_OHENG } from "../data/saju.data";
import { JIJANGGAN_DATA } from "../data/jijanggan";

// ── 합화 오행 테이블 ──────────────────────────────────────────────────────────
const CHEONGANHAP_HWA: Record<string, string> = {
  "甲己": "土", "己甲": "土",
  "庚乙": "金", "乙庚": "金",
  "丙辛": "水", "辛丙": "水",
  "戊癸": "火", "癸戊": "火",
  "壬丁": "木", "丁壬": "木",
};

/** 지장간 한글 천간 → 오행 */
const GAN_KO_OHAENG: Record<string, string> = {
  갑: "木", 을: "木",
  병: "火", 정: "火",
  무: "土", 기: "土",
  경: "金", 신: "金",
  임: "水", 계: "水",
};

/**
 * 대운 천간합의 종류를 판정한다.
 * - "합" : 사주 4기둥 지지에 대운 천간과 같은 오행이 있음 (합이 묶이지 않음)
 * - "합반": 지지에 같은 오행 없음 + 합거 조건 불충족
 * - "합거": 지지에 같은 오행 없음 + (합화오행 == 대운지지오행 OR 대운지지 지장간 오행 중 합화오행 포함)
 */
function classifyCheonganhap(
  dGan: string,
  dJi: string,
  pGan: string,
  pillars: { year: string; month: string; day: string; hour: string }
): "합" | "합반" | "합거" {
  const dGanOhaeng = GAN_OHENG[dGan] ?? "";
  const pillarKeys = ["year", "month", "day", "hour"] as const;
  const jiOhaengs = pillarKeys.map((k) => JI_OHENG[pillars[k][1]] ?? "");

  // 사주 지지에 대운 천간 오행이 있으면 → 그냥 합
  if (jiOhaengs.includes(dGanOhaeng)) return "합";

  const hwaOhaeng = CHEONGANHAP_HWA[`${dGan}${pGan}`] ?? "";
  const dJiOhaeng = JI_OHENG[dJi] ?? "";

  // 합거(1): 합화오행 == 대운 지지 오행
  if (hwaOhaeng && hwaOhaeng === dJiOhaeng) return "합거";

  // 합거(2/3): 대운 지지 지장간 오행 중 합화오행과 같은 것이 있으면
  const jijangganOhaengs = (JIJANGGAN_DATA[dJi] ?? []).map(
    (el) => GAN_KO_OHAENG[el.gan] ?? ""
  );
  if (hwaOhaeng && jijangganOhaengs.includes(hwaOhaeng)) return "합거";

  return "합반";
}

export interface RelationshipResult {
  cheonganhap: string[]; // 천간합 관계
  cheonganchung: string[]; // 천간충 관계
  cheonganhapTypes?: ("합" | "합반" | "합거")[]; // 천간합 종류 (대운 전용)
  yukhap: string[]; // 육합 관계
  samhap: string[]; // 삼합 관계
  amhap: string[]; // 암합 관계
  banghap: string[]; // 방합 관계
  yukchung: string[]; // 육충 관계
  yukhyung: string[]; // 육형 관계
  yukpa: string[]; // 육파 관계
  yukae: string[]; // 육해 관계
}

export interface RelationshipDetail {
  type: string; // 관계 유형 (yukhap, samhap, etc.)
  ji1: string; // 첫 번째 지지
  ji2: string; // 두 번째 지지
  pillar1: string; // 첫 번째 기둥 (year, month, day, hour)
  pillar2: string; // 두 번째 기둥
}

/**
 * 사주팔자의 지지 간 관계를 계산한다.
 * @param pillars 사주팔자 객체
 * @returns 지지 간 관계 결과
 */
export const getJijiRelationships = (pillars: {
  year: string;
  month: string;
  day: string;
  hour: string;
}): RelationshipResult => {
  const result: RelationshipResult = {
    cheonganhap: [],
    cheonganchung: [],
    yukhap: [],
    samhap: [],
    amhap: [],
    banghap: [],
    yukchung: [],
    yukhyung: [],
    yukpa: [],
    yukae: [],
  };

  // 천간 배열 생성
  const gans = [
    { gan: pillars.year[0], pillar: "year" },
    { gan: pillars.month[0], pillar: "month" },
    { gan: pillars.day[0], pillar: "day" },
    { gan: pillars.hour[0], pillar: "hour" },
  ];

  // 지지 배열 생성
  const jis = [
    { ji: pillars.year[1], pillar: "year" },
    { ji: pillars.month[1], pillar: "month" },
    { ji: pillars.day[1], pillar: "day" },
    { ji: pillars.hour[1], pillar: "hour" },
  ];

  // 천간 관계 계산
  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const gan1 = gans[i].gan;
      const gan2 = gans[j].gan;
      const pillar1 = gans[i].pillar;
      const pillar2 = gans[j].pillar;

      // 천간합 관계 확인
      if (JIJI_RELATIONSHIPS.cheonganhap[gan1] === gan2) {
        result.cheonganhap.push(`${gan1}${gan2}(${pillar1}-${pillar2})`);
      }

      // 천간충 관계 확인
      if (JIJI_RELATIONSHIPS.cheonganchung[gan1] === gan2) {
        result.cheonganchung.push(`${gan1}${gan2}(${pillar1}-${pillar2})`);
      }
    }
  }

  // 모든 지지 쌍을 비교
  for (let i = 0; i < jis.length; i++) {
    for (let j = i + 1; j < jis.length; j++) {
      const ji1 = jis[i].ji;
      const ji2 = jis[j].ji;
      const pillar1 = jis[i].pillar;
      const pillar2 = jis[j].pillar;

      // 육합 관계 확인
      if (JIJI_RELATIONSHIPS.yukhap[ji1] === ji2) {
        result.yukhap.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 삼합 관계 확인
      if (JIJI_RELATIONSHIPS.samhap[ji1]?.includes(ji2)) {
        result.samhap.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 암합 관계 확인
      if (JIJI_RELATIONSHIPS.amhap[ji1]?.includes(ji2)) {
        result.amhap.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 방합 관계 확인
      if (JIJI_RELATIONSHIPS.banghap[ji1]?.includes(ji2)) {
        result.banghap.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 육충 관계 확인
      if (JIJI_RELATIONSHIPS.yukchung[ji1] === ji2) {
        result.yukchung.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 육형 관계 확인
      if (JIJI_RELATIONSHIPS.yukhyung[ji1]?.includes(ji2)) {
        result.yukhyung.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 육파 관계 확인
      if (JIJI_RELATIONSHIPS.yukpa[ji1] === ji2) {
        result.yukpa.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }

      // 육해 관계 확인
      if (JIJI_RELATIONSHIPS.yukae[ji1] === ji2) {
        result.yukae.push(`${ji1}${ji2}(${pillar1}-${pillar2})`);
      }
    }
  }

  return result;
};

/**
 * 현재 대운의 천간/지지와 사주팔자 4기둥 간의 관계를 계산한다.
 * @param daewoonGanji 대운 간지 (예: "甲子")
 * @param pillars 사주팔자 4기둥
 * @returns 대운-원국 관계 결과
 */
export const getDaewoonRelationships = (
  daewoonGanji: string,
  pillars: { year: string; month: string; day: string; hour: string }
): RelationshipResult => {
  const result: RelationshipResult = {
    cheonganhap: [], cheonganchung: [],
    cheonganhapTypes: [],
    yukhap: [], samhap: [], amhap: [], banghap: [],
    yukchung: [], yukhyung: [], yukpa: [], yukae: [],
  };

  const dGan = daewoonGanji[0];
  const dJi = daewoonGanji[1];
  const pillarKeys = ["year", "month", "day", "hour"] as const;

  // ── 천간합 먼저 계산 (2-1 규칙 적용을 위해) ──
  for (const key of pillarKeys) {
    const pGan = pillars[key][0];
    if (JIJI_RELATIONSHIPS.cheonganhap[dGan] === pGan) {
      result.cheonganhap.push(`${dGan}${pGan}(daewoon-${key})`);
      result.cheonganhapTypes!.push(classifyCheonganhap(dGan, dJi, pGan, pillars));
    }
  }

  // ── 지지 관계 + 천간충 (합 없을 때만) ──
  for (const key of pillarKeys) {
    const pillarStr = pillars[key];
    const pGan = pillarStr[0];
    const pJi = pillarStr[1];

    // 2-1: 천간합이 있으면 천간충 표기하지 않음
    if (result.cheonganhap.length === 0) {
      if (JIJI_RELATIONSHIPS.cheonganchung[dGan] === pGan) {
        result.cheonganchung.push(`${dGan}${pGan}(daewoon-${key})`);
      } else if (JIJI_RELATIONSHIPS.cheonganchung[pGan] === dGan) {
        result.cheonganchung.push(`${dGan}${pGan}(daewoon-${key})`);
      }
    }

    if (JIJI_RELATIONSHIPS.yukhap[dJi] === pJi) {
      result.yukhap.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.samhap[dJi]?.includes(pJi)) {
      result.samhap.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.amhap[dJi]?.includes(pJi)) {
      result.amhap.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.banghap[dJi]?.includes(pJi)) {
      result.banghap.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.yukchung[dJi] === pJi) {
      result.yukchung.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.yukhyung[dJi]?.includes(pJi)) {
      result.yukhyung.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.yukpa[dJi] === pJi) {
      result.yukpa.push(`${dJi}${pJi}(daewoon-${key})`);
    }
    if (JIJI_RELATIONSHIPS.yukae[dJi] === pJi) {
      result.yukae.push(`${dJi}${pJi}(daewoon-${key})`);
    }
  }

  return result;
};

/**
 * 현재 세운의 천간/지지와 사주팔자 4기둥+대운 간의 관계를 계산한다.
 * @param sewoonGanji 세운 간지 (예: "甲子")
 * @param pillars 사주팔자 4기둥
 * @param daewoonGanji 현재 대운 간지 (선택)
 */
export const getSewoonRelationships = (
  sewoonGanji: string,
  pillars: { year: string; month: string; day: string; hour: string },
  daewoonGanji?: string
): RelationshipResult => {
  const result: RelationshipResult = {
    cheonganhap: [], cheonganchung: [],
    cheonganhapTypes: [],
    yukhap: [], samhap: [], amhap: [], banghap: [],
    yukchung: [], yukhyung: [], yukpa: [], yukae: [],
  };

  const sGan = sewoonGanji[0];
  const sJi = sewoonGanji[1];

  const pillarKeys = ["year", "month", "day", "hour"] as const;
  const allTargets: { key: string; gan: string; ji: string }[] = pillarKeys.map((k) => ({
    key: k, gan: pillars[k][0], ji: pillars[k][1],
  }));
  if (daewoonGanji) {
    allTargets.push({ key: "daewoon", gan: daewoonGanji[0], ji: daewoonGanji[1] });
  }

  // ── 천간합 먼저 계산 (2-1 규칙) ──
  for (const t of allTargets) {
    if (JIJI_RELATIONSHIPS.cheonganhap[sGan] === t.gan) {
      result.cheonganhap.push(`${sGan}${t.gan}(sewoon-${t.key})`);
      result.cheonganhapTypes!.push(classifyCheonganhap(sGan, sJi, t.gan, pillars));
    }
  }

  // ── 지지 관계 + 천간충 ──
  for (const t of allTargets) {
    if (result.cheonganhap.length === 0) {
      if (JIJI_RELATIONSHIPS.cheonganchung[sGan] === t.gan) {
        result.cheonganchung.push(`${sGan}${t.gan}(sewoon-${t.key})`);
      } else if (JIJI_RELATIONSHIPS.cheonganchung[t.gan] === sGan) {
        result.cheonganchung.push(`${sGan}${t.gan}(sewoon-${t.key})`);
      }
    }

    if (JIJI_RELATIONSHIPS.yukhap[sJi] === t.ji) {
      result.yukhap.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.samhap[sJi]?.includes(t.ji)) {
      result.samhap.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.amhap[sJi]?.includes(t.ji)) {
      result.amhap.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.banghap[sJi]?.includes(t.ji)) {
      result.banghap.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.yukchung[sJi] === t.ji) {
      result.yukchung.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.yukhyung[sJi]?.includes(t.ji)) {
      result.yukhyung.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.yukpa[sJi] === t.ji) {
      result.yukpa.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
    if (JIJI_RELATIONSHIPS.yukae[sJi] === t.ji) {
      result.yukae.push(`${sJi}${t.ji}(sewoon-${t.key})`);
    }
  }

  return result;
};

/**
 * 상세한 관계 정보를 반환한다.
 * @param pillars 사주팔자 객체
 * @returns 상세 관계 정보 배열
 */
export const getDetailedRelationships = (pillars: {
  year: string;
  month: string;
  day: string;
  hour: string;
}): RelationshipDetail[] => {
  const relationships: RelationshipDetail[] = [];

  // 지지 배열 생성
  const jis = [
    { ji: pillars.year[1], pillar: "year" },
    { ji: pillars.month[1], pillar: "month" },
    { ji: pillars.day[1], pillar: "day" },
    { ji: pillars.hour[1], pillar: "hour" },
  ];

  // 모든 지지 쌍을 비교
  for (let i = 0; i < jis.length; i++) {
    for (let j = i + 1; j < jis.length; j++) {
      const ji1 = jis[i].ji;
      const ji2 = jis[j].ji;
      const pillar1 = jis[i].pillar;
      const pillar2 = jis[j].pillar;

      // 각 관계 유형별로 확인
      const relationshipTypes = [
        { type: "yukhap", data: JIJI_RELATIONSHIPS.yukhap },
        { type: "yukchung", data: JIJI_RELATIONSHIPS.yukchung },
        { type: "yukpa", data: JIJI_RELATIONSHIPS.yukpa },
        { type: "yukae", data: JIJI_RELATIONSHIPS.yukae },
      ];

      // 1:1 관계 확인
      relationshipTypes.forEach(({ type, data }) => {
        if (data[ji1] === ji2) {
          relationships.push({
            type,
            ji1,
            ji2,
            pillar1,
            pillar2,
          });
        }
      });

      // 삼합 관계 확인
      if (JIJI_RELATIONSHIPS.samhap[ji1]?.includes(ji2)) {
        relationships.push({
          type: "samhap",
          ji1,
          ji2,
          pillar1,
          pillar2,
        });
      }

      // 육형 관계 확인
      if (JIJI_RELATIONSHIPS.yukhyung[ji1]?.includes(ji2)) {
        relationships.push({
          type: "yukhyung",
          ji1,
          ji2,
          pillar1,
          pillar2,
        });
      }
    }
  }

  return relationships;
};
