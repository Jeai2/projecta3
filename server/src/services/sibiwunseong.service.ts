// src/services/sibiwunseong.service.ts
// jjhome 만세력 엔진 - 십이운성 계산 서비스
// 봉법: 일간 기준 각 기둥의 지지 → 십이운성
// 거법: 각 기둥의 천간→해당 기둥의 지지 → 십이운성

import {
  SIBIWUNSEONG_TABLE,
  SIBIWUNSEONG_GEOPBEOP_TABLE,
} from '../data/saju.data';

type PillarsGanji = { year: string; month: string; day: string; hour: string };

/**
 * 십이운성 봉법(封法): 일간을 기준으로 각 기둥의 지지만 보고 십이운성을 구한다.
 * @param dayGan 일간 (기준점)
 * @param pillars 사주팔자 간지 (년월일시 각 "간지" 2글자)
 * @returns 각 기둥별 십이운성
 */
export const getSibiwunseong = (
  dayGan: string,
  pillars: PillarsGanji
): { year: string; month: string; day: string; hour: string } => {
  const calc = (ji: string): string => {
    if (!ji) return '';
    return SIBIWUNSEONG_TABLE[dayGan]?.[ji] || '';
  };

  return {
    year: calc(pillars.year[1]),
    month: calc(pillars.month[1]),
    day: calc(pillars.day[1]),
    hour: calc(pillars.hour[1]),
  };
};

/**
 * 십이운성 거법(去法): 각 기둥의 천간→그 기둥의 지지로 매칭해 십이운성을 구한다.
 * 년주: 년간→년지, 월주: 월간→월지, 일주: 일간→일지, 시주: 시간→시지
 * @param pillars 사주팔자 간지 (년월일시 각 "간지" 2글자)
 * @returns 각 기둥별 십이운성
 */
export const getSibiwunseongGeopbeop = (
  pillars: PillarsGanji
): { year: string; month: string; day: string; hour: string } => {
  const calc = (ganji: string): string => {
    if (!ganji || ganji.length < 2) return '';
    const gan = ganji[0];
    const ji = ganji[1];
    return SIBIWUNSEONG_GEOPBEOP_TABLE[gan]?.[ji] || '';
  };

  return {
    year: calc(pillars.year),
    month: calc(pillars.month),
    day: calc(pillars.day),
    hour: calc(pillars.hour),
  };
};
