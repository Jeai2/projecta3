// server/src/services/saju.service.ts (최종 완성본)

import { getSipsin } from "./sipsin.service";
import {
  getSibiwunseong,
  getSibiwunseongGeopbeop,
} from "./sibiwunseong.service";
import { getDaewoon } from "./daewoon.service";
import { getSewoonForYear } from "./sewoon.service";
import { getAllWoolwoonForYear } from "./woolwoon.service";
import { getAllSinsals } from "./sinsal.service.new";
import { calculateNewWangseStrength } from "./wangse-strength.service";
import { analyzeGyeokguk } from "./gyeokguk.service";
import { analyzeDangnyeong } from "./dangnyeong.service"; // ✅ 당령 분석 import
import { analyzeSaryeong } from "./saryeong.service"; // ✅ 사령 분석 import
import { calculateJinsin } from "./jinsin.service"; // ✅ 진신 분석 import
import { analyzeYongsin } from "./yongsin.service";
import { buildSipsinV2Interpretation, buildDaewoonRelInterp } from "./sipsin-v2-interpretation.service"; // ✅ SipsinV2 해설
import { getJijiRelationships, getDaewoonRelationships, getSewoonRelationships } from "./relationship.service"; // ✅ 지지 관계 계산
import {
  getSeasonalDataForYear,
  getLoadedSeasonalData,
} from "./seasonal-data.loader";
import { GAN, JI, GANJI, GAN_OHENG, JI_OHENG } from "../data/saju.data"; // ✅ 오행 데이터 import
import { interpretSaju } from "./sajuInterpret.service";
import { getIljuData, type IljuData } from "../data/ilju.data";
import { ILJU_FULL } from "../data/interpretation/ilju-full";
import { getNapeumFromPillars } from "../hwa-eui/data/hwa-eui.data";
import { JIJANGGAN_DATA } from "../data/jijanggan"; // ✅ 지장간 데이터 import
import {
  SajuData,
  InterpretationResult,
  FortuneResult,
  IljuDayMasterTexts,
} from "../types/saju.d";

type SeasonalData = { [year: number]: { name: string; date: Date }[] };

/** 종합사주 일주 해석 문구 — ILJU_FULL 우선, 없으면 ilju.data.ts 폴백 */
function buildIljuDayMasterTexts(ganji: string, raw: IljuData): IljuDayMasterTexts {
  const full = ILJU_FULL[ganji];

  const traitsText = raw.traits
    ? [raw.traits.base, raw.traits.psychological, raw.traits.emotionPattern]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const legacyText =
    raw.characteristic ||
    (raw.personality && raw.tendency
      ? `${raw.personality} ${raw.tendency}`
      : raw.personality || raw.tendency || "");

  const fallbackSummary =
    raw.overallSummary ||
    [raw.wealth, raw.health].filter(Boolean).join(" ");

  return {
    summary: fallbackSummary.trim(),
    detail: (full?.detail || traitsText || legacyText).trim(),
    iljuSummary: (full?.summary || raw.summary || "").trim(),
  };
}

// 내부 계산 함수 (수정 없음)
const getYearGanjiByYear = (year: number): string => {
  const ganIndex = (year - 4) % 10;
  const jiIndex = (year - 4) % 12;
  return GAN[(ganIndex + 10) % 10] + JI[(jiIndex + 12) % 12];
};

const getMonthGanji = (
  date: Date,
  yearGan: string,
  seasonalData: SeasonalData
): string => {
  const year = date.getFullYear();
  const seasons = seasonalData[year] || seasonalData[year - 1];
  if (!seasons) return "";
  let foundingIndex = -1;
  for (let i = seasons.length - 1; i >= 0; i--) {
    if (i % 2 === 0 && date >= seasons[i].date) {
      foundingIndex = i;
      break;
    }
  }
  const DONGJI_INDEX = seasons.length > 0 ? seasons.length - 2 : -1;
  if (foundingIndex === -1 && DONGJI_INDEX !== -1) {
    foundingIndex = DONGJI_INDEX;
  }

  const monthOrder = Math.floor(foundingIndex / 2);
  const monthJiIndex = (monthOrder + 1) % 12;
  const monthJi = JI[monthJiIndex];

  const yearGanIndex = GAN.indexOf(yearGan);
  const monthGanStartIndex = [0, 5].includes(yearGanIndex)
    ? 2
    : [1, 6].includes(yearGanIndex)
    ? 4
    : [2, 7].includes(yearGanIndex)
    ? 6
    : [3, 8].includes(yearGanIndex)
    ? 8
    : 0;

  const monthIndexFromTiger = (monthJiIndex + 12 - 2) % 12;
  const finalGanIndex = (monthGanStartIndex + monthIndexFromTiger) % 10;
  const monthGan = GAN[finalGanIndex];

  return monthGan + monthJi;
};

const getJulianDay = (y: number, m: number, d: number): number => {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5
  );
};

// 일주 계산 함수 (선생님께서 찾아주신 정확한 기준점이 적용된 최종 버전)
export const getDayGanji = (date: Date): string => {
  // 기준점: 1982년 8월 9일 (월요일)은 '갑자일'
  // 해당 날짜 자정(0시)의 율리우스력(JD)은 2445190.5 입니다.
  const BASE_JD = 2445190.5;
  // '갑자'는 60갑자 배열(GANJI)에서 0번째에 위치합니다.
  const BASE_GANJI_INDEX = 0;

  const jd = getJulianDay(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const dayDifference = jd - BASE_JD;

  const idx = (BASE_GANJI_INDEX + dayDifference) % 60;
  const correctedIdx = Math.floor((idx + 60) % 60);

  return GANJI[correctedIdx];
};

const getHourGanji = (date: Date, dayGan: string): string => {
  const hour = date.getHours();
  const min = date.getMinutes();
  const totalMinutes = hour * 60 + min;
  const adjustedMinutes = (totalMinutes + 30) % 1440;
  const hourJiIndex = Math.floor(adjustedMinutes / 120);
  const hourJi = JI[hourJiIndex];

  const dayGanIndex = GAN.indexOf(dayGan);
  const startGanIndex = [0, 5].includes(dayGanIndex)
    ? 0
    : [1, 6].includes(dayGanIndex)
    ? 2
    : [2, 7].includes(dayGanIndex)
    ? 4
    : [3, 8].includes(dayGanIndex)
    ? 6
    : 8;

  const hourGan = GAN[(startGanIndex + hourJiIndex) % 10];
  return hourGan + hourJi;
};

// 메인 엔진 (getSajuDetails)
export const getSajuDetails = async (
  birthDate: Date,
  gender: "M" | "W"
): Promise<FortuneResult> => {
  await getSeasonalDataForYear(birthDate.getFullYear());
  await getSeasonalDataForYear(birthDate.getFullYear() - 1);
  const SEASONAL_DATA = getLoadedSeasonalData();

  let sajuYear = birthDate.getFullYear();
  const yearSeasons = SEASONAL_DATA[sajuYear];
  if (yearSeasons && birthDate < yearSeasons[2].date) {
    sajuYear -= 1;
  }
  const yearPillar = getYearGanjiByYear(sajuYear);
  const monthPillar = getMonthGanji(birthDate, yearPillar[0], SEASONAL_DATA);
  let dayPillar: string;
  if (birthDate.getHours() === 23 && birthDate.getMinutes() >= 30) {
    const nextDay = new Date(birthDate);
    nextDay.setDate(nextDay.getDate() + 1);
    dayPillar = getDayGanji(nextDay);
  } else {
    dayPillar = getDayGanji(birthDate);
  }
  const hourPillar = getHourGanji(birthDate, dayPillar[0]);
  const pillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
  const dayGan = dayPillar[0];

  const sipsin = getSipsin(dayGan, pillars);
  const sibiwunseong = getSibiwunseong(dayGan, pillars);
  const sibiwunseongGeopbeop = getSibiwunseongGeopbeop(pillars);
  const sinsal = getAllSinsals(pillars, gender);
  const napeum = getNapeumFromPillars(pillars);

  // ✅ 지장간 데이터 계산
  const getJijangganForPillar = (ji: string): string[] => {
    const jijangganData = JIJANGGAN_DATA[ji];
    if (!jijangganData) return [];

    const result: string[] = [];
    const 초기 = jijangganData.find((item) => item.role === "초기");
    const 중기 = jijangganData.find((item) => item.role === "중기");
    const 정기 = jijangganData.find((item) => item.role === "정기");

    if (초기) result.push(초기.gan);
    if (중기) result.push(중기.gan);
    if (정기) result.push(정기.gan);
    return result;
  };

  const jijanggan = {
    year: getJijangganForPillar(yearPillar[1]),
    month: getJijangganForPillar(monthPillar[1]),
    day: getJijangganForPillar(dayPillar[1]),
    hour: getJijangganForPillar(hourPillar[1]),
  };

  // 디버깅: 지장간 데이터 확인
  console.log("🔍 지장간 계산 결과:", {
    pillars: {
      year: yearPillar[1],
      month: monthPillar[1],
      day: dayPillar[1],
      hour: hourPillar[1],
    },
    jijanggan,
  });

  const daewoonFull = getDaewoon(
    birthDate,
    gender,
    { yearPillar, monthPillar, dayPillar },
    SEASONAL_DATA
  );
  const currentYear = new Date().getFullYear();
  const currentDaewoon =
    daewoonFull.find(
      (d) => currentYear >= d.year && currentYear < d.year + 10
    ) || null;
  const currentSewoon = getSewoonForYear(currentYear, dayGan);

  // 월운 데이터 계산 (현재 연도와 다음 연도)
  const currentWoolwoon = getAllWoolwoonForYear(currentYear, dayGan);
  const nextYearWoolwoon = getAllWoolwoonForYear(currentYear + 1, dayGan);

  // ✅ 왕쇠강약 계산
  const wangseStrength = calculateNewWangseStrength(pillars, dayGan);

  // ✅ 당령 분석 (절기별 사령 천간)
  const dangnyeongResult = analyzeDangnyeong(birthDate);

  // ✅ 사령 분석 (월지 지장간 기준 사령 천간)
  const saryeongResult = analyzeSaryeong(birthDate, monthPillar[1]);

  // ✅ 진신 분석 (가장 강한 십성)
  const jinsinResult = calculateJinsin(pillars);

  // ✅ 격국 분석 (임시 sajuData로 먼저 생성 후 분석)
  const tempSajuData = {
    pillars: {
      year: { gan: yearPillar[0], ji: yearPillar[1] },
      month: { gan: monthPillar[0], ji: monthPillar[1] },
      day: { gan: dayPillar[0], ji: dayPillar[1] },
      hour: { gan: hourPillar[0], ji: hourPillar[1] },
    },
    sipsin,
  };
  const gyeokgukAnalysis = await analyzeGyeokguk(
    tempSajuData as SajuData,
    birthDate
  );

  // ✅ 3. 최종 sajuData 객체를 조립하는 부분을 오행 정보가 포함되도록 수정합니다.
  const sajuData: SajuData = {
    pillars: {
      year: {
        gan: yearPillar[0],
        ji: yearPillar[1],
        ganOhaeng: GAN_OHENG[yearPillar[0]],
        jiOhaeng: JI_OHENG[yearPillar[1]],
        ganSipsin: sipsin.year.gan,
        jiSipsin: sipsin.year.ji,
        sibiwunseong: sibiwunseong.year,
        sibiwunseongGeopbeop: sibiwunseongGeopbeop.year,
        sinsal: sinsal.year,
      },
      month: {
        gan: monthPillar[0],
        ji: monthPillar[1],
        ganOhaeng: GAN_OHENG[monthPillar[0]],
        jiOhaeng: JI_OHENG[monthPillar[1]],
        ganSipsin: sipsin.month.gan,
        jiSipsin: sipsin.month.ji,
        sibiwunseong: sibiwunseong.month,
        sibiwunseongGeopbeop: sibiwunseongGeopbeop.month,
        sinsal: sinsal.month,
      },
      day: {
        gan: dayPillar[0],
        ji: dayPillar[1],
        ganOhaeng: GAN_OHENG[dayPillar[0]],
        jiOhaeng: JI_OHENG[dayPillar[1]],
        ganSipsin: sipsin.day.gan,
        jiSipsin: sipsin.day.ji,
        sibiwunseong: sibiwunseong.day,
        sibiwunseongGeopbeop: sibiwunseongGeopbeop.day,
        sinsal: sinsal.day,
      },
      hour: {
        gan: hourPillar[0],
        ji: hourPillar[1],
        ganOhaeng: GAN_OHENG[hourPillar[0]],
        jiOhaeng: JI_OHENG[hourPillar[1]],
        ganSipsin: sipsin.hour.gan,
        jiSipsin: sipsin.hour.ji,
        sibiwunseong: sibiwunseong.hour,
        sibiwunseongGeopbeop: sibiwunseongGeopbeop.hour,
        sinsal: sinsal.hour,
      },
    },
    sipsin,
    sibiwunseong,
    sibiwunseongGeopbeop,
    sinsal,
    napeum,
    jijanggan, // ✅ 지장간 데이터 추가
    wangseStrength, // ✅ 왕쇠강약 분석 추가
    dangnyeong: dangnyeongResult, // ✅ 당령 분석 추가
    saryeong: saryeongResult, // ✅ 사령 분석 추가
    jinsin: jinsinResult, // ✅ 진신 분석 추가
    gyeokguk: gyeokgukAnalysis, // ✅ 격국 분석 추가
    currentDaewoon,
    currentSewoon,
    daewoonFull,
    currentWoolwoon,
    nextYearWoolwoon,
  };

  // ✅ 지지 관계 계산 (sipsinV2Interpretation 이전에 반드시 선행)
  sajuData.relationships = getJijiRelationships({
    year:  yearPillar[0]  + yearPillar[1],
    month: monthPillar[0] + monthPillar[1],
    day:   dayPillar[0]   + dayPillar[1],
    hour:  hourPillar[0]  + hourPillar[1],
  });

  // ✅ 용신 분석 추가 (용희기구한 데이터)
  try {
    sajuData.yongsin = analyzeYongsin(sajuData, currentDaewoon);
  } catch (error) {
    console.error("용신 분석 중 오류 발생:", error);
  }

  // ✅ SipsinV2 전용 해설 추가 (relationships 계산 이후)
  try {
    sajuData.sipsinV2Interpretation = buildSipsinV2Interpretation(sajuData);
  } catch (error) {
    console.error("SipsinV2 해설 생성 중 오류 발생:", error);
  }

  // ✅ 현재 대운-원국 관계 계산
  if (currentDaewoon) {
    try {
      const daewoonRels = getDaewoonRelationships(currentDaewoon.ganji, {
        year:  yearPillar[0]  + yearPillar[1],
        month: monthPillar[0] + monthPillar[1],
        day:   dayPillar[0]   + dayPillar[1],
        hour:  hourPillar[0]  + hourPillar[1],
      });
      sajuData.currentDaewoonRelationships = daewoonRels;
      sajuData.currentDaewoonInterp = buildDaewoonRelInterp(daewoonRels, dayPillar[0]);
    } catch (error) {
      console.error("대운 관계 계산 중 오류 발생:", error);
    }
  }

  // ✅ 현재 세운-원국+대운 관계 계산
  try {
    const sajuPillars = {
      year:  yearPillar[0]  + yearPillar[1],
      month: monthPillar[0] + monthPillar[1],
      day:   dayPillar[0]   + dayPillar[1],
      hour:  hourPillar[0]  + hourPillar[1],
    };
    const sewoonRels = getSewoonRelationships(
      currentSewoon.ganji,
      sajuPillars,
      currentDaewoon?.ganji
    );
    sajuData.currentSewoonRelationships = sewoonRels;
    sajuData.currentSewoonInterp = buildDaewoonRelInterp(sewoonRels, dayPillar[0], currentSewoon.ganji, true);
  } catch (error) {
    console.error("세운 관계 계산 중 오류 발생:", error);
  }

  // ✅ 현재 대운 기간 10년 세운 목록 계산
  if (currentDaewoon) {
    try {
      sajuData.sewoonForCurrentDaewoon = Array.from({ length: 10 }, (_, i) => {
        const year = currentDaewoon.year + i;
        return getSewoonForYear(year, dayPillar[0]);
      });
    } catch (error) {
      console.error("세운 목록 계산 중 오류 발생:", error);
    }
  }

  const interpretationBase: InterpretationResult = interpretSaju(sajuData);

  const dayGanji = sajuData.pillars.day.gan + sajuData.pillars.day.ji;
  const iljuRaw = getIljuData(sajuData.pillars.day.gan, sajuData.pillars.day.ji);
  const iljuDayMaster = iljuRaw ? buildIljuDayMasterTexts(dayGanji, iljuRaw) : null;

  const interpretation: InterpretationResult = {
    ...interpretationBase,
    iljuDayMaster,
  };

  return {
    sajuData,
    interpretation,
  };
};

// 대운별 세운 데이터 계산 함수
export const getSewoonForDaewoon = (
  daewoonStartYear: number,
  dayGan: string
): Array<{
  year: number;
  ganji: string;
  ganSipsin: string;
  jiSipsin: string;
  sibiwunseong: string;
}> => {
  const sewoonData = [];

  // 10년간의 세운 데이터 계산 (역순으로 표시하기 위해 역순으로 계산)
  for (let i = 9; i >= 0; i--) {
    const year = daewoonStartYear + i;
    const sewoon = getSewoonForYear(year, dayGan);

    sewoonData.push({
      year: year,
      ganji: sewoon.ganji,
      ganSipsin: sewoon.sipsin?.gan || "-",
      jiSipsin: sewoon.sipsin?.ji || "-",
      sibiwunseong: sewoon.sibiwunseong || "-",
    });
  }

  return sewoonData;
};
