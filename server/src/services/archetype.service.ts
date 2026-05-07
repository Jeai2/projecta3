// server/src/services/archetype.service.ts
// Archetype 6 (홀랜드 6유형) 점수 산출 서비스

import { analyzeDangnyeong } from "./dangnyeong.service";
import { analyzeSaryeong } from "./saryeong.service";
import {
  getSipsinCountExcludingDayGan,
  getSipsinBonusFromSamhapBanghapForArchetype,
  type SipsinCount,
} from "./sipsin.service";
import { JOB_MAP_BY_CATEGORY, moveJiByMonth } from "../data/job-map.data";
import type { Ji } from "../data/job-map.data";
import { calculateOhaengChart } from "./ohaeng-chart.service";
import type { SajuData } from "../types/saju.d";
import type { Daewoon } from "./daewoon.service";
import { getSipsin } from "./sipsin.service";
import { GAN_OHENG, JI_OHENG } from "../data/saju.data";
import {
  DANGNYEONG_TO_ARCHETYPE,
  SARYEONG_GAN_TO_ARCHETYPE,
  SIPSIN_TO_ARCHETYPE,
  JOB_LEGACY_KEY_TO_ARCHETYPE,
  ARCHETYPE_PRIMARY_OHAENG,
  OHAENG_TO_ARCHETYPE,
  ARCHETYPE_AUX_SIPSIN,
  HANGUL_TO_HANJA_GAN,
  type ArchetypeCode,
} from "../data/archetype-map.data";

const ARCHETYPE_CODES: ArchetypeCode[] = ["R", "I", "A", "S", "E", "C"];

export interface Archetype6Result {
  scores: Record<ArchetypeCode, number>;
  daewoonScores?: Record<ArchetypeCode, number>;
  /** 시주(시간) 미입력 시 true — 6글자 기준, 십신·오행 점수 축소 */
  timeUnknown?: boolean;
}

function zeroScores(): Record<ArchetypeCode, number> {
  return Object.fromEntries(ARCHETYPE_CODES.map((c) => [c, 0])) as Record<
    ArchetypeCode,
    number
  >;
}

function hanjaGan(gan: string): string {
  return HANGUL_TO_HANJA_GAN[gan] || gan;
}

/**
 * 전승(직군) category key 조회
 */
function getJobLegacyCategoryKey(
  yearGan: string,
  yearJi: string,
  lunarMonth: number,
  gender: "M" | "W",
): string | null {
  const GanList = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const JiList = [
    "子",
    "丑",
    "寅",
    "卯",
    "辰",
    "巳",
    "午",
    "未",
    "申",
    "酉",
    "戌",
    "亥",
  ];
  const gan = GanList.includes(yearGan) ? yearGan : null;
  const ji = JiList.includes(yearJi) ? yearJi : null;
  if (!gan || !ji) return null;

  const month = Math.max(1, Math.min(12, lunarMonth));
  const targetJi =
    gender === "M"
      ? moveJiByMonth(ji as Ji, month, "forward")
      : moveJiByMonth(ji as Ji, month, "backward");

  const cat = JOB_MAP_BY_CATEGORY.find(
    (c) => c.ganToJi[gan as keyof typeof c.ganToJi] === targetJi,
  );
  return cat?.key ?? null;
}

/**
 * 십신 개수 → 아키타입별 점수 배분 (합화 우선: base + 2*bonus)
 */
function sipsinToScores(
  base: SipsinCount,
  bonus: SipsinCount,
  totalPts: number,
): Record<ArchetypeCode, number> {
  const scores = zeroScores();
  let effectiveTotal = 0;
  const effectiveCount: Record<string, number> = {};

  (Object.keys(base) as (keyof SipsinCount)[]).forEach((name) => {
    const eff = base[name] + 2 * bonus[name];
    effectiveCount[name] = eff;
    effectiveTotal += eff;
  });

  if (effectiveTotal <= 0) return scores;

  (Object.keys(effectiveCount) as (keyof SipsinCount)[]).forEach((name) => {
    const share = (effectiveCount[name] / effectiveTotal) * totalPts;
    const archetypes = SIPSIN_TO_ARCHETYPE[name];
    if (!archetypes || archetypes.length === 0) return;
    const per = share / archetypes.length;
    archetypes.forEach((a) => {
      scores[a] += per;
    });
  });

  return scores;
}

/** 년월일 3기둥(6글자)에서 오행 개수 집계 — 시주 없을 때 사용 */
function countOhaengFrom6Chars(
  pillars: Pick<SajuData["pillars"], "year" | "month" | "day">
): Record<"木" | "火" | "土" | "金" | "水", number> {
  const ohaeng: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const add = (oh: string | undefined) => {
    if (oh && oh in ohaeng) ohaeng[oh]++;
  };
  [pillars.year, pillars.month, pillars.day].forEach((p) => {
    add(p.ganOhaeng);
    add(p.jiOhaeng);
  });
  return ohaeng as Record<"木" | "火" | "土" | "金" | "水", number>;
}

/**
 * Archetype 6 점수 산출
 * @param hasHourInput false면 시주 없음 — 6글자 기준, 십신 250·오행 40 (총 890)
 */
export function calculateArchetype6(
  sajuData: SajuData,
  birthDate: Date,
  lunarMonth: number,
  gender: "M" | "W",
  options?: { hasHourInput?: boolean },
): Archetype6Result {
  const hasHourInput = options?.hasHourInput !== false;
  const scores = zeroScores();
  const pillars = sajuData.pillars;
  const dayGan = pillars.day.gan;

  // 1. 십신 — 시주 없으면 5 positions, 250 pts / 있으면 7 positions, 350 pts
  const sipsinForCount = hasHourInput
    ? sajuData.sipsin
    : { ...sajuData.sipsin, hour: { gan: null, ji: null } };
  const baseCount = getSipsinCountExcludingDayGan(sipsinForCount);
  const sipsinPillarsForBonus = hasHourInput
    ? { year: { ji: pillars.year.ji }, month: { ji: pillars.month.ji }, day: { ji: pillars.day.ji }, hour: { ji: pillars.hour.ji } }
    : { year: { ji: pillars.year.ji }, month: { ji: pillars.month.ji }, day: { ji: pillars.day.ji }, hour: { ji: null } };
  const sipsinBonusCount = getSipsinBonusFromSamhapBanghapForArchetype(
    sipsinPillarsForBonus,
    dayGan,
  );
  const sipsinTotalPts = hasHourInput ? 350 : 250;
  const sipsinScores = sipsinToScores(baseCount, sipsinBonusCount, sipsinTotalPts);
  ARCHETYPE_CODES.forEach((c) => {
    scores[c] += sipsinScores[c];
  });

  // 2. 사령 (200 pts) — 복수 매칭 시 균등 분할
  const saryeongResult = analyzeSaryeong(birthDate, pillars.month.ji ?? "");
  const saryeongHanja = hanjaGan(saryeongResult.saryeongGan);
  const saryeongArchs = SARYEONG_GAN_TO_ARCHETYPE[saryeongHanja];
  if (saryeongArchs && saryeongArchs.length > 0) {
    const per = 200 / saryeongArchs.length;
    saryeongArchs.forEach((a) => {
      scores[a] += per;
    });
  }

  // 3. 당령 (150 pts) — 복수 매칭 시 균등 분할
  const dangnyeongResult = analyzeDangnyeong(birthDate);
  const dangnyeongHanja = hanjaGan(dangnyeongResult.dangnyeongGan);
  const dangnyeongArchs = DANGNYEONG_TO_ARCHETYPE[dangnyeongHanja];
  if (dangnyeongArchs && dangnyeongArchs.length > 0) {
    const per = 150 / dangnyeongArchs.length;
    dangnyeongArchs.forEach((a) => {
      scores[a] += per;
    });
  }

  // 4. 보조십신 (150 pts) — 미존재/부족(1개 이하) 오행일 때
  const ohaengCounts = hasHourInput
    ? (() => {
        const ohaengChart = calculateOhaengChart(sajuData, { includeJijanggan: false });
        const ganCount = ohaengChart.breakdown.gan;
        const jiCount = ohaengChart.breakdown.ji;
        return {
          木: (ganCount?.木 ?? 0) + (jiCount?.木 ?? 0),
          火: (ganCount?.火 ?? 0) + (jiCount?.火 ?? 0),
          土: (ganCount?.土 ?? 0) + (jiCount?.土 ?? 0),
          金: (ganCount?.金 ?? 0) + (jiCount?.金 ?? 0),
          水: (ganCount?.水 ?? 0) + (jiCount?.水 ?? 0),
        };
      })()
    : countOhaengFrom6Chars(pillars);
  const minCount = Math.min(...Object.values(ohaengCounts));
  const maxCount = Math.max(...Object.values(ohaengCounts));
  const DEFICIENT_THRESHOLD_ORIGIN = 1; // 원국 8글자: 1개 이하
  const auxQualified: ArchetypeCode[] = [];
  ARCHETYPE_CODES.forEach((arch) => {
    const primaryOhaeng = ARCHETYPE_PRIMARY_OHAENG[arch];
    const hasMissing = primaryOhaeng.some(
      (oh) => ohaengCounts[oh as keyof typeof ohaengCounts] === 0,
    );
    const hasDeficient = primaryOhaeng.some(
      (oh) =>
        ohaengCounts[oh as keyof typeof ohaengCounts] === minCount &&
        minCount < maxCount &&
        minCount <= DEFICIENT_THRESHOLD_ORIGIN,
    );
    if (!hasMissing && !hasDeficient) return;
    const auxSipsin = ARCHETYPE_AUX_SIPSIN[arch];
    const hasAuxInChart = auxSipsin.some(
      (s) =>
        (baseCount[s as keyof SipsinCount] ?? 0) +
          2 * (sipsinBonusCount[s as keyof SipsinCount] ?? 0) >
        0,
    );
    if (hasAuxInChart) auxQualified.push(arch);
  });
  if (auxQualified.length > 0) {
    const auxPer = 150 / auxQualified.length;
    auxQualified.forEach((a) => {
      scores[a] += auxPer;
    });
  }

  // 5. 전승 (100 pts)
  const jobKey = getJobLegacyCategoryKey(
    pillars.year.gan,
    pillars.year.ji ?? "",
    lunarMonth,
    gender,
  );
  if (jobKey && jobKey in JOB_LEGACY_KEY_TO_ARCHETYPE) {
    const archs =
      JOB_LEGACY_KEY_TO_ARCHETYPE[
        jobKey as keyof typeof JOB_LEGACY_KEY_TO_ARCHETYPE
      ];
    if (archs && archs.length > 0) {
      const per = 100 / archs.length;
      archs.forEach((a) => {
        scores[a] += per;
      });
    }
  }

  // 6. 오행 — 시주 없으면 40 pts / 있으면 50 pts, 방법 B
  const ohaengTotalPts = hasHourInput ? 50 : 40;
  let totalOhaeng: number;
  if (hasHourInput) {
    const ohaengChart = calculateOhaengChart(sajuData, { includeJijanggan: false });
    totalOhaeng = (ohaengChart.breakdown.gan?.total ?? 0) + (ohaengChart.breakdown.ji?.total ?? 0);
    const ganCount = ohaengChart.breakdown.gan;
    const jiCount = ohaengChart.breakdown.ji;
    if (totalOhaeng > 0) {
      (["木", "火", "土", "金", "水"] as const).forEach((oh) => {
        const count = (ganCount?.[oh] ?? 0) + (jiCount?.[oh] ?? 0);
        if (count <= 0) return;
        const share = (count / totalOhaeng) * ohaengTotalPts;
        const archs = OHAENG_TO_ARCHETYPE[oh];
        if (!archs?.length) return;
        const per = share / archs.length;
        archs.forEach((a) => {
          scores[a] += per;
        });
      });
    }
  } else {
    totalOhaeng = Object.values(ohaengCounts).reduce((a, b) => a + b, 0);
    if (totalOhaeng > 0) {
      (["木", "火", "土", "金", "水"] as const).forEach((oh) => {
        const count = ohaengCounts[oh] ?? 0;
        if (count <= 0) return;
        const share = (count / totalOhaeng) * ohaengTotalPts;
        const archs = OHAENG_TO_ARCHETYPE[oh];
        if (!archs?.length) return;
        const per = share / archs.length;
        archs.forEach((a) => {
          scores[a] += per;
        });
      });
    }
  }

  // 대운 포함 아키타입 (시주 있으면 10글자, 없으면 8글자)
  let daewoonScores: Record<ArchetypeCode, number> | undefined;
  const currentDaewoon = sajuData.currentDaewoon;
  if (currentDaewoon?.ganji && currentDaewoon.ganji.length >= 2) {
    daewoonScores = calculateArchetype6WithDaewoon(
      sajuData,
      currentDaewoon,
      birthDate,
      lunarMonth,
      gender,
      { hasHourInput },
    );
  }

  return {
    scores,
    daewoonScores,
    timeUnknown: !hasHourInput,
  };
}

/**
 * 대운 아키타입 점수 — 시주 있으면 10글자, 없으면 8글자(6+대운2)
 * 시주 없으면 십신 250, 오행 40
 */
function calculateArchetype6WithDaewoon(
  sajuData: SajuData,
  currentDaewoon: Daewoon,
  birthDate: Date,
  lunarMonth: number,
  gender: "M" | "W",
  options?: { hasHourInput?: boolean },
): Record<ArchetypeCode, number> {
  const hasHourInput = options?.hasHourInput !== false;
  const scores = zeroScores();
  const pillars = sajuData.pillars;
  const dayGan = pillars.day.gan;
  const dg = currentDaewoon.ganji[0];
  const dj = currentDaewoon.ganji[1];

  // 1. 주력십신 — 시주 있으면 350 (9 positions), 없으면 250 (7 positions)
  const sipsinForCount = hasHourInput
    ? sajuData.sipsin
    : { ...sajuData.sipsin, hour: { gan: null, ji: null } };
  const baseCount = getSipsinCountExcludingDayGan(sipsinForCount);
  const daewoonSipsin = getSipsin(dayGan, {
    year: dg + dj,
    month: "",
    day: "",
    hour: "",
  }).year;
  const addSipsinToCount = (name: string | null) => {
    if (name && name !== "본원" && name in baseCount) {
      baseCount[name as keyof SipsinCount] += 1;
    }
  };
  addSipsinToCount(daewoonSipsin.gan);
  addSipsinToCount(daewoonSipsin.ji);

  const bonusPillars = hasHourInput
    ? { year: { ji: pillars.year.ji }, month: { ji: pillars.month.ji }, day: { ji: pillars.day.ji }, hour: { ji: pillars.hour.ji }, daewoon: { ji: dj } }
    : { year: { ji: pillars.year.ji }, month: { ji: pillars.month.ji }, day: { ji: pillars.day.ji }, hour: { ji: null } as { ji: string | null }, daewoon: { ji: dj } };
  const bonusCount = getSipsinBonusFromSamhapBanghapForArchetype(
    bonusPillars,
    dayGan,
  );
  const sipsinTotalPts = hasHourInput ? 350 : 250;
  const sipsinSc = sipsinToScores(baseCount, bonusCount, sipsinTotalPts);
  ARCHETYPE_CODES.forEach((c) => {
    scores[c] += sipsinSc[c];
  });

  // 2. 사령 (200 pts) — 출생 기반, 원국과 동일
  const saryeongResult = analyzeSaryeong(birthDate, pillars.month.ji ?? "");
  const saryeongHanja = hanjaGan(saryeongResult.saryeongGan);
  const saryeongArchs = SARYEONG_GAN_TO_ARCHETYPE[saryeongHanja];
  if (saryeongArchs?.length > 0) {
    saryeongArchs.forEach((a) => {
      scores[a] += 200 / saryeongArchs.length;
    });
  }

  // 3. 당령 (150 pts) — 출생 기반, 원국과 동일
  const dangnyeongResult = analyzeDangnyeong(birthDate);
  const dangnyeongHanja = hanjaGan(dangnyeongResult.dangnyeongGan);
  const dangnyeongArchs = DANGNYEONG_TO_ARCHETYPE[dangnyeongHanja];
  if (dangnyeongArchs?.length > 0) {
    dangnyeongArchs.forEach((a) => {
      scores[a] += 150 / dangnyeongArchs.length;
    });
  }

  // 4. 보조십신 (150 pts) — 시주 있으면 10글자, 없으면 8글자(6+대운2), 부족 = 2개 이하
  const ohaengCounts = hasHourInput
    ? countOhaengFrom10Chars(pillars, dg, dj)
    : (() => {
        const base = { ...countOhaengFrom6Chars(pillars) };
        const dOh = GAN_OHENG[dg];
        const djOh = JI_OHENG[dj];
        if (dOh && dOh in base) base[dOh as keyof typeof base]++;
        if (djOh && djOh in base) base[djOh as keyof typeof base]++;
        return base;
      })();
  const minCount = Math.min(...Object.values(ohaengCounts));
  const maxCount = Math.max(...Object.values(ohaengCounts));
  const DEFICIENT_THRESHOLD_DAEWOON = 2; // 대운 포함 10글자: 2개 이하
  const auxQualified: ArchetypeCode[] = [];
  ARCHETYPE_CODES.forEach((arch) => {
    const primaryOhaeng = ARCHETYPE_PRIMARY_OHAENG[arch];
    const hasMissing = primaryOhaeng.some(
      (oh) => ohaengCounts[oh as keyof typeof ohaengCounts] === 0,
    );
    const hasDeficient = primaryOhaeng.some(
      (oh) =>
        ohaengCounts[oh as keyof typeof ohaengCounts] === minCount &&
        minCount < maxCount &&
        minCount <= DEFICIENT_THRESHOLD_DAEWOON,
    );
    if (!hasMissing && !hasDeficient) return;
    const auxSipsin = ARCHETYPE_AUX_SIPSIN[arch];
    const hasAux = auxSipsin.some(
      (s) =>
        (baseCount[s as keyof SipsinCount] ?? 0) +
          2 * (bonusCount[s as keyof SipsinCount] ?? 0) >
        0,
    );
    if (hasAux) auxQualified.push(arch);
  });
  if (auxQualified.length > 0) {
    auxQualified.forEach((a) => {
      scores[a] += 150 / auxQualified.length;
    });
  }

  // 5. 전승 (100 pts) — 출생 기반, 원국과 동일
  const jobKey = getJobLegacyCategoryKey(
    pillars.year.gan,
    pillars.year.ji ?? "",
    lunarMonth,
    gender,
  );
  if (jobKey && jobKey in JOB_LEGACY_KEY_TO_ARCHETYPE) {
    const archs =
      JOB_LEGACY_KEY_TO_ARCHETYPE[
        jobKey as keyof typeof JOB_LEGACY_KEY_TO_ARCHETYPE
      ];
    if (archs?.length > 0) {
      archs.forEach((a) => {
        scores[a] += 100 / archs.length;
      });
    }
  }

  // 6. 오행 — 시주 있으면 50 pts, 없으면 40 pts, 방법 B
  const ohaengTotalPts = hasHourInput ? 50 : 40;
  const totalOhaeng = Object.values(ohaengCounts).reduce((a, b) => a + b, 0);
  if (totalOhaeng > 0) {
    (["木", "火", "土", "金", "水"] as const).forEach((oh) => {
      const count = ohaengCounts[oh] ?? 0;
      if (count <= 0) return;
      const share = (count / totalOhaeng) * ohaengTotalPts;
      const archs = OHAENG_TO_ARCHETYPE[oh];
      if (!archs?.length) return;
      const per = share / archs.length;
      archs.forEach((a) => {
        scores[a] += per;
      });
    });
  }

  return scores;
}

/** 원국 8글자 + 대운 2글자에서 오행 개수 집계 */
function countOhaengFrom10Chars(
  pillars: SajuData["pillars"],
  daewoonGan: string,
  daewoonJi: string,
): Record<"木" | "火" | "土" | "金" | "水", number> {
  const ohaeng: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const add = (oh: string | undefined) => {
    if (oh && oh in ohaeng) ohaeng[oh]++;
  };
  Object.values(pillars).forEach((p) => {
    add(p.ganOhaeng);
    add(p.jiOhaeng);
  });
  add(GAN_OHENG[daewoonGan]);
  add(JI_OHENG[daewoonJi]);
  return ohaeng as Record<"木" | "火" | "土" | "金" | "水", number>;
}
