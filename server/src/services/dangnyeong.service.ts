// src/services/dangnyeong.service.ts
// 당령(當令) 판단 서비스

import { DANGNYEONG_BY_JEOLGI } from "../data/dangnyeong.data";
import { getSeasonalData } from "./seasonal-data.loader";

/**
 * 당령 분석 결과
 */
export interface DangnyeongResult {
  dangnyeongGan: string; // 당령 천간 (한글, 예: "신")
  jeolgi: string; // 해당 절기 (예: "상강")
  jeolgiStart: Date; // 절기 시작일
  jeolgiEnd: Date | null; // 절기 종료일 (다음 절기 시작일)
}

/**
 * 생년월일 기준으로 당령(사령 천간) 판단
 *
 * @param birthDate 생년월일 (Date 객체)
 * @returns 당령 분석 결과
 *
 * @example
 * // 1991년 11월 7일 → 상강 구간 → 신금
 * const result = analyzeDangnyeong(new Date('1991-11-07'));
 * console.log(result.dangnyeongGan); // "신"
 * console.log(result.jeolgi); // "상강"
 */
export function analyzeDangnyeong(birthDate: Date): DangnyeongResult {
  const year = birthDate.getFullYear();

  // 1. 해당 연도의 절기 데이터 로드
  const seasonalData = getSeasonalData(year);
  if (!seasonalData || seasonalData.length === 0) {
    throw new Error(`해당 연도(${year})의 절기 데이터를 찾을 수 없습니다.`);
  }

  // 2. 생년월일이 속한 절기 구간 찾기
  let currentJeolgi = seasonalData[0]; // 기본값: 첫 번째 절기
  let nextJeolgi = seasonalData[1] || null;

  for (let i = 0; i < seasonalData.length; i++) {
    const jeolgi = seasonalData[i];
    const nextJeolgiData = seasonalData[i + 1] || null;

    // 현재 절기 시작일 <= 생일 < 다음 절기 시작일
    if (birthDate >= jeolgi.date) {
      if (!nextJeolgiData || birthDate < nextJeolgiData.date) {
        currentJeolgi = jeolgi;
        nextJeolgi = nextJeolgiData;
        break;
      }
    }
  }

  // 3. 특수 케이스: 연말/연초 처리
  // 생일이 해당 연도의 첫 절기(소한) 이전인 경우
  // → 전년도 동지 구간에 속함
  if (birthDate < seasonalData[0].date) {
    // 전년도 마지막 절기(동지) 확인
    const prevYearData = getSeasonalData(year - 1);
    if (prevYearData && prevYearData.length > 0) {
      currentJeolgi = prevYearData[prevYearData.length - 1]; // 동지
      nextJeolgi = seasonalData[0]; // 올해 첫 절기(소한)
    }
  }

  // 4. 절기명으로 당령 천간 조회
  const dangnyeongGan = DANGNYEONG_BY_JEOLGI[currentJeolgi.name];
  if (!dangnyeongGan) {
    throw new Error(
      `절기 "${currentJeolgi.name}"에 대한 당령 데이터를 찾을 수 없습니다.`
    );
  }

  return {
    dangnyeongGan,
    jeolgi: currentJeolgi.name,
    jeolgiStart: currentJeolgi.date,
    jeolgiEnd: nextJeolgi ? nextJeolgi.date : null,
  };
}

/**
 * 당령 천간을 한자로 변환
 *
 * @param hangulGan 천간 한글 (예: "신")
 * @returns 천간 한자 (예: "辛")
 */
export function convertDangnyeongToHanja(hangulGan: string): string {
  const map: Record<string, string> = {
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
  return map[hangulGan] || hangulGan;
}

/**
 * 당령 천간의 오행 반환
 *
 * @param gan 천간 (한글 또는 한자)
 * @returns 오행 (木/火/土/金/水)
 */
export function getDangnyeongOhaeng(gan: string): string {
  const map: Record<string, string> = {
    갑: "木",
    을: "木",
    병: "火",
    정: "火",
    무: "土",
    기: "土",
    경: "金",
    신: "金",
    임: "水",
    계: "水",
    甲: "木",
    乙: "木",
    丙: "火",
    丁: "火",
    戊: "土",
    己: "土",
    庚: "金",
    辛: "金",
    壬: "水",
    癸: "水",
  };
  return map[gan] || "土";
}
