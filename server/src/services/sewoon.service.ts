// src/services/sewoon.service.ts
// jjhome 만세력 엔진 - 세운(歲運) 계산 서비스
// 특정 연도의 운세를 정밀하게 계산한다.

import { GAN, JI } from '../data/saju.data';
import { getSipsin } from './sipsin.service';
import { getSibiwunseong } from './sibiwunseong.service';

// 세운 정보의 구조를 정의하는 타입
export interface SewoonData {
  year: number;     // 해당 년도
  ganji: string;    // 해당 년도의 간지
  sipsin: { gan: string | null; ji: string | null; }; // 세운 간지의 십성
  sibiwunseong: string | null; // 세운 지지의 십이운성
}

// 연도의 간지를 계산하는 내부 함수
const getYearGanjiByYear = (year: number): string => {
  const ganIndex = (year - 4) % 10;
  const jiIndex = (year - 4) % 12;
  return GAN[(ganIndex + 10) % 10] + JI[(jiIndex + 12) % 12];
};

/**
 * 특정 연도의 세운 정보를 계산하는 메인 함수
 * @param year 세운을 계산할 특정 연도
 * @param dayGan 사용자의 일간 (계산의 기준)
 * @returns 해당 연도의 세운 정보 객체
 */
export const getSewoonForYear = (
    year: number,
    dayGan: string,
): SewoonData => {
    const ganji = getYearGanjiByYear(year);
    
    // 사주 원국 정보가 아닌, 세운의 간지만을 기준으로 십성과 십이운성을 계산
    const sewoonPillars = { year: ganji, month: '', day: '', hour: '' };

    return {
        year: year,
        ganji: ganji,
        sipsin: getSipsin(dayGan, sewoonPillars).year,
        sibiwunseong: getSibiwunseong(dayGan, sewoonPillars).year,
    };
}
