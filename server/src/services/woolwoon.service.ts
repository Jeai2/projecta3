// src/services/woolwoon.service.ts
// jjhome 만세력 엔진 - 월운(月運) 계산 서비스
// 특정 월의 운세를 정밀하게 계산한다.

// GAN, JI는 현재 사용되지 않으므로 import 제거
import { getSipsin } from "./sipsin.service";
import { getSibiwunseong } from "./sibiwunseong.service";

// 월운 정보의 구조를 정의하는 타입
export interface WoolwoonData {
  year: number; // 해당 년도
  month: number; // 해당 월 (1-12)
  ganji: string; // 해당 월의 간지
  sipsin: { gan: string | null; ji: string | null }; // 월운 간지의 십성
  sibiwunseong: string | null; // 월운 지지의 십이운성
}

// 60갑자 배열 (정확한 순서)
const GANJI_60 = [
  "甲子",
  "乙丑",
  "丙寅",
  "丁卯",
  "戊辰",
  "己巳",
  "庚午",
  "辛未",
  "壬申",
  "癸酉",
  "甲戌",
  "乙亥",
  "丙子",
  "丁丑",
  "戊寅",
  "己卯",
  "庚辰",
  "辛巳",
  "壬午",
  "癸未",
  "甲申",
  "乙酉",
  "丙戌",
  "丁亥",
  "戊子",
  "己丑",
  "庚寅",
  "辛卯",
  "壬辰",
  "癸巳",
  "甲午",
  "乙未",
  "丙申",
  "丁酉",
  "戊戌",
  "己亥",
  "庚子",
  "辛丑",
  "壬寅",
  "癸卯",
  "甲辰",
  "乙巳",
  "丙午",
  "丁未",
  "戊申",
  "己酉",
  "庚戌",
  "辛亥",
  "壬子",
  "癸丑",
  "甲寅",
  "乙卯",
  "丙辰",
  "丁巳",
  "戊午",
  "己未",
  "庚申",
  "辛酉",
  "壬戌",
  "癸亥",
];

// 기준점: 1991년 11월 = 己亥 (인덱스 35)
const BASE_YEAR = 1991;
const BASE_MONTH = 11;
const BASE_GANJI_INDEX = 35; // 己亥의 인덱스

// 월의 간지를 계산하는 내부 함수 (60갑자 순환 방식)
const getMonthGanjiByYearMonth = (year: number, month: number): string => {
  // 기준점으로부터의 월 차이 계산
  const monthDiff = (year - BASE_YEAR) * 12 + (month - BASE_MONTH);

  // 60갑자 순환 인덱스 계산
  const ganjiIndex = (BASE_GANJI_INDEX + monthDiff) % 60;

  // 음수 처리
  const finalIndex = ganjiIndex < 0 ? ganjiIndex + 60 : ganjiIndex;

  return GANJI_60[finalIndex];
};

/**
 * 특정 년월의 월운 정보를 계산하는 메인 함수
 * @param year 월운을 계산할 년도
 * @param month 월운을 계산할 월 (1-12)
 * @param dayGan 사용자의 일간 (계산의 기준)
 * @returns 해당 년월의 월운 정보 객체
 */
export const getWoolwoonForYearMonth = (
  year: number,
  month: number,
  dayGan: string
): WoolwoonData => {
  const ganji = getMonthGanjiByYearMonth(year, month);

  // 사주 원국 정보가 아닌, 월운의 간지만을 기준으로 십성과 십이운성을 계산
  const woolwoonPillars = { year: ganji, month: "", day: "", hour: "" };

  return {
    year: year,
    month: month,
    ganji: ganji,
    sipsin: getSipsin(dayGan, woolwoonPillars).year,
    sibiwunseong: getSibiwunseong(dayGan, woolwoonPillars).year,
  };
};

/**
 * 특정 년도의 모든 월운 정보를 계산하는 함수
 * @param year 월운을 계산할 년도
 * @param dayGan 사용자의 일간 (계산의 기준)
 * @returns 해당 년도의 12개월 월운 정보 배열 (역순으로 반환)
 */
export const getAllWoolwoonForYear = (
  year: number,
  dayGan: string
): WoolwoonData[] => {
  const woolwoonList: WoolwoonData[] = [];

  // 12월부터 1월까지 역순으로 계산
  for (let month = 12; month >= 1; month--) {
    woolwoonList.push(getWoolwoonForYearMonth(year, month, dayGan));
  }

  return woolwoonList;
};
