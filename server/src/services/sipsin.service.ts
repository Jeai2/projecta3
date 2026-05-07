// [수석 설계자 노트]
// jjhome 만세력 엔진 (Sipsin Service)
// 이 파일은 오직 '십성'을 계산하는 책임만 가진다.
// 데이터는 saju.data.ts 에서 가져오고, 계산된 결과만 반환한다.

import { SIPSIN_TABLE, SIPSIN_SCORES } from "../data/saju.data"; // 데이터 저장소에서 십성 조견표와 점수를 가져옴

/**
 * 사주팔자 각 기둥의 십성을 계산한다.
 * @param dayGan 일간 (기준점)
 * @param pillars 사주팔자 객체
 * @returns 각 기둥별 천간과 지지의 십성
 */
export const getSipsin = (
  dayGan: string,
  pillars: { year: string; month: string; day: string; hour: string }
) => {
  const calc = (target: string, type: "h" | "e"): string | null => {
    // target 글자가 없는 경우 null 반환
    if (!target) return null;

    // SIPSIN_TABLE에서 일간(dayGan)과 대상 글자(target)로 십성을 찾음
    // 타입 추론이 가능하도록 명시적으로 타입을 지정해줌
    const tableForType: { [key: string]: { [key: string]: string } } =
      SIPSIN_TABLE[type];
    return tableForType[dayGan]?.[target] || null;
  };

  return {
    year: { gan: calc(pillars.year[0], "h"), ji: calc(pillars.year[1], "e") },
    month: {
      gan: calc(pillars.month[0], "h"),
      ji: calc(pillars.month[1], "e"),
    },
    day: { gan: "본원", ji: calc(pillars.day[1], "e") },
    hour: { gan: calc(pillars.hour[0], "h"), ji: calc(pillars.hour[1], "e") },
  };
};

/**
 * 십성 이름으로 왕쇠강약 점수를 계산한다.
 * @param sipsinName 십성 이름 (예: "비견", "정관" 등)
 * @returns 해당 십성의 점수 (-15 ~ +15)
 */
export const getSipsinScore = (sipsinName: string | null): number => {
  if (!sipsinName || sipsinName === "본원") return 0;
  return SIPSIN_SCORES[sipsinName as keyof typeof SIPSIN_SCORES] || 0;
};

/**
 * 기둥별 십성과 점수를 함께 계산한다.
 * @param dayGan 일간 (기준점)
 * @param pillars 사주팔자 객체
 * @returns 각 기둥별 십성 이름과 점수
 */
export const getSipsinWithScores = (
  dayGan: string,
  pillars: { year: string; month: string; day: string; hour: string }
) => {
  const sipsinResult = getSipsin(dayGan, pillars);

  return {
    year: {
      gan: {
        name: sipsinResult.year.gan,
        score: getSipsinScore(sipsinResult.year.gan),
      },
      ji: {
        name: sipsinResult.year.ji,
        score: getSipsinScore(sipsinResult.year.ji),
      },
    },
    month: {
      gan: {
        name: sipsinResult.month.gan,
        score: getSipsinScore(sipsinResult.month.gan),
      },
      ji: {
        name: sipsinResult.month.ji,
        score: getSipsinScore(sipsinResult.month.ji),
      },
    },
    day: {
      gan: { name: "본원", score: 0 }, // 일간은 본원이므로 0점
      ji: {
        name: sipsinResult.day.ji,
        score: getSipsinScore(sipsinResult.day.ji),
      },
    },
    hour: {
      gan: {
        name: sipsinResult.hour.gan,
        score: getSipsinScore(sipsinResult.hour.gan),
      },
      ji: {
        name: sipsinResult.hour.ji,
        score: getSipsinScore(sipsinResult.hour.ji),
      },
    },
  };
};

/** 십신 이름 10가지 (일간 제외 집계용) */
const SIPSIN_NAMES = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
] as const;

export type SipsinCount = Record<(typeof SIPSIN_NAMES)[number], number>;

/**
 * 사주원국에서 일간을 제외한 7개 위치(년간, 년지, 월간, 월지, 일지, 시간, 시지)의
 * 십신 개수를 집계한다. 선버스트 등 시각화용.
 */
export const getSipsinCountExcludingDayGan = (sipsin: {
  year: { gan: string | null; ji: string | null };
  month: { gan: string | null; ji: string | null };
  day: { gan: string | null; ji: string | null };
  hour: { gan: string | null; ji: string | null };
}): SipsinCount => {
  const count: Record<string, number> = {};
  SIPSIN_NAMES.forEach((name) => {
    count[name] = 0;
  });

  const add = (name: string | null) => {
    if (name && name !== "본원" && name in count) {
      count[name] += 1;
    }
  };

  add(sipsin.year.gan);
  add(sipsin.year.ji);
  add(sipsin.month.gan);
  add(sipsin.month.ji);
  add(sipsin.day.ji);
  add(sipsin.hour.gan);
  add(sipsin.hour.ji);

  return count as SipsinCount;
};

// 삼합/방합용: 오행 → 왕지(子午卯酉) 매핑 (십신은 왕지 십신을 따름)
const OHAENG_TO_WANGJI: Record<string, string> = {
  木: "卯",
  火: "午",
  金: "酉",
  水: "子",
};

// 삼합 그룹 유니크 (지지 3개, 합화 오행) — 반합(2개 이상) 시 보너스
const SAMHAP_GROUPS: { jis: [string, string, string]; result: string }[] = [
  { jis: ["寅", "午", "戌"], result: "火" },
  { jis: ["亥", "卯", "未"], result: "木" },
  { jis: ["巳", "酉", "丑"], result: "金" },
  { jis: ["申", "子", "辰"], result: "水" },
];

// 방합 그룹 유니크 (지지 3개, 합화 오행) — 3개 모두 있을 때만 보너스
const BANGHAP_GROUPS: { jis: [string, string, string]; result: string }[] = [
  { jis: ["寅", "卯", "辰"], result: "木" },
  { jis: ["巳", "午", "未"], result: "火" },
  { jis: ["申", "酉", "戌"], result: "金" },
  { jis: ["亥", "子", "丑"], result: "水" },
];

/**
 * 삼합(반합 포함)·방합(3개 만족 시)으로 인한 왕지(子午卯酉) 십신 보너스를 계산한다.
 * - 삼합: 2개 이상 있으면 반합으로 인정, 해당 합화 오행의 왕지 십신 +1
 * - 방합: 3개 모두 있을 때만 해당 합화 오행의 왕지 십신 +1
 */
export const getSipsinBonusFromSamhapBanghap = (
  pillars: {
    year: { ji: string | null };
    month: { ji: string | null };
    day: { ji: string | null };
    hour: { ji: string | null };
  },
  dayGan: string
): SipsinCount => {
  const count: Record<string, number> = {};
  SIPSIN_NAMES.forEach((name) => {
    count[name] = 0;
  });

  const allJis = [
    pillars.year.ji,
    pillars.month.ji,
    pillars.day.ji,
    pillars.hour.ji,
  ].filter((ji): ji is string => ji != null && ji !== "");
  const jiSet = new Set(allJis);

  const addWangjiSipsin = (ohaeng: string) => {
    const wangji = OHAENG_TO_WANGJI[ohaeng];
    if (!wangji) return;
    const tableE = (SIPSIN_TABLE as { e?: Record<string, Record<string, string>> }).e;
    const sipsinName = tableE?.[dayGan]?.[wangji];
    if (sipsinName && sipsinName in count) {
      count[sipsinName] += 1;
    }
  };

  // 삼합: 반합(2개 이상)이면 해당 합화 오행의 왕지 십신 +1
  for (const { jis, result } of SAMHAP_GROUPS) {
    const present = jis.filter((ji) => jiSet.has(ji)).length;
    if (present >= 2) {
      addWangjiSipsin(result);
    }
  }

  // 방합: 3개 모두 있을 때만 해당 합화 오행의 왕지 십신 +1
  for (const { jis, result } of BANGHAP_GROUPS) {
    const allPresent = jis.every((ji) => jiSet.has(ji));
    if (allPresent) {
      addWangjiSipsin(result);
    }
  }

  return count as SipsinCount;
};

/** 아키타입용 지지 파라미터 (대운 지지 추가 지원) */
export type ArchetypePillarsForBonus = Parameters<
  typeof getSipsinBonusFromSamhapBanghap
>[0] & { daewoon?: { ji: string | null } };

/**
 * 아키타입 전용: 삼합(반합) + 방합(반방합 포함)
 * - 삼합: 2개 이상 → 반합 인정
 * - 방합: 2개 이상 → 반방합 인정 (아키타입만)
 * - daewoon.ji 있으면 5지지로 삼합/방합 계산 (대운 포함 10글자 모드)
 */
export const getSipsinBonusFromSamhapBanghapForArchetype = (
  pillars: ArchetypePillarsForBonus,
  dayGan: string
): SipsinCount => {
  const count: Record<string, number> = {};
  SIPSIN_NAMES.forEach((name) => {
    count[name] = 0;
  });

  const allJis = [
    pillars.year.ji,
    pillars.month.ji,
    pillars.day.ji,
    pillars.hour.ji,
    ...(pillars.daewoon?.ji ? [pillars.daewoon.ji] : []),
  ].filter((ji): ji is string => ji != null && ji !== "");
  const jiSet = new Set(allJis);

  const addWangjiSipsin = (ohaeng: string) => {
    const wangji = OHAENG_TO_WANGJI[ohaeng];
    if (!wangji) return;
    const tableE = (SIPSIN_TABLE as { e?: Record<string, Record<string, string>> }).e;
    const sipsinName = tableE?.[dayGan]?.[wangji];
    if (sipsinName && sipsinName in count) {
      count[sipsinName] += 1;
    }
  };

  // 삼합: 반합(2개 이상) 인정
  for (const { jis, result } of SAMHAP_GROUPS) {
    const present = jis.filter((ji) => jiSet.has(ji)).length;
    if (present >= 2) {
      addWangjiSipsin(result);
    }
  }

  // 방합: 반방합(2개 이상) 인정 — 아키타입 전용
  for (const { jis, result } of BANGHAP_GROUPS) {
    const present = jis.filter((ji) => jiSet.has(ji)).length;
    if (present >= 2) {
      addWangjiSipsin(result);
    }
  }

  return count as SipsinCount;
};

/**
 * 일간 제외 7위치 십신 개수 + 삼합/방합 보너스를 합산한다.
 */
export const getSipsinCountWithSamhapBanghap = (
  sipsin: Parameters<typeof getSipsinCountExcludingDayGan>[0],
  pillars: Parameters<typeof getSipsinBonusFromSamhapBanghap>[0],
  dayGan: string
): SipsinCount => {
  const base = getSipsinCountExcludingDayGan(sipsin);
  const bonus = getSipsinBonusFromSamhapBanghap(pillars, dayGan);
  const result: Record<string, number> = {};
  SIPSIN_NAMES.forEach((name) => {
    result[name] = base[name] + bonus[name];
  });
  return result as SipsinCount;
};
