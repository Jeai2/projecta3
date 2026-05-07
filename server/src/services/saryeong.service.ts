// src/services/saryeong.service.ts
// 사령(司令) 판단 서비스

import { getSeasonalData } from "./seasonal-data.loader";
import { JIJANGGAN_DATA, JijangganElement } from "../data/jijanggan";

/**
 * 사령 분석 결과
 */
export interface SaryeongResult {
  saryeongGan: string; // 사령 천간 (한글, 예: "무")
  role: "초기" | "중기" | "정기"; // 해당 구간 (여기/중기/본기)
  monthJi: string; // 월지 (예: "술")
  jeolgiStart: Date; // 절기 시작일
  jeolgiEnd: Date | null; // 절기 종료일
  daysFromStart: number; // 절기 시작일로부터 경과일수
}

/**
 * 생년월일시 기준으로 사령(司令) 천간 판단
 *
 * @param birthDate 생년월일시 (Date 객체)
 * @param monthJi 월지 (예: "술")
 * @returns 사령 분석 결과
 *
 * @example
 * // 1991년 11월 7일 → 술월 정기 구간 → 무토
 * const result = analyzeSaryeong(new Date('1991-11-07T04:00'), '술');
 * console.log(result.saryeongGan); // "무"
 * console.log(result.role); // "정기"
 */
export function analyzeSaryeong(
  birthDate: Date,
  monthJi: string
): SaryeongResult {
  const year = birthDate.getFullYear();

  // 1. 해당 연도의 절기 데이터 로드
  const seasonalData = getSeasonalData(year);
  if (!seasonalData || seasonalData.length === 0) {
    throw new Error(`해당 연도(${year})의 절기 데이터를 찾을 수 없습니다.`);
  }

  // 2. 월지의 지장간 정보 로드
  const jijangganElements = JIJANGGAN_DATA[monthJi];
  if (!jijangganElements || jijangganElements.length === 0) {
    throw new Error(`월지 "${monthJi}"의 지장간 데이터를 찾을 수 없습니다.`);
  }

  // 3. 생년월일이 속한 절기 구간 찾기
  let jeolgiStart: Date | null = null;
  let jeolgiEnd: Date | null = null;

  for (let i = 0; i < seasonalData.length; i++) {
    const jeolgi = seasonalData[i];
    const nextJeolgi = seasonalData[i + 1] || null;

    // 현재 절기 시작일 <= 생일 < 다음 절기 시작일
    if (birthDate >= jeolgi.date) {
      if (!nextJeolgi || birthDate < nextJeolgi.date) {
        jeolgiStart = jeolgi.date;
        jeolgiEnd = nextJeolgi ? nextJeolgi.date : null;
        break;
      }
    }
  }

  // 특수 케이스: 연말/연초 처리 (생일이 해당 연도의 첫 절기 이전인 경우)
  if (!jeolgiStart) {
    const prevYearData = getSeasonalData(year - 1);
    if (prevYearData && prevYearData.length > 0) {
      jeolgiStart = prevYearData[prevYearData.length - 1].date;
      jeolgiEnd = seasonalData[0].date;
    }
  }

  if (!jeolgiStart) {
    throw new Error(
      `생년월일 ${birthDate.toISOString()}에 해당하는 절기를 찾을 수 없습니다.`
    );
  }

  // 4. 절기 시작일로부터 경과일수 계산
  const timeDiff = birthDate.getTime() - jeolgiStart.getTime();
  const daysFromStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // 5. 경과일수에 따라 초기/중기/정기 판단
  let cumulativeDays = 0;
  let selectedElement: JijangganElement | null = null;

  for (const element of jijangganElements) {
    cumulativeDays += element.days;
    if (daysFromStart < cumulativeDays) {
      selectedElement = element;
      break;
    }
  }

  // 6. 기본값 처리 (경과일수가 30일을 넘는 경우 → 정기)
  if (!selectedElement) {
    selectedElement = jijangganElements[jijangganElements.length - 1]; // 마지막 요소 (정기)
  }

  return {
    saryeongGan: selectedElement.gan,
    role: selectedElement.role,
    monthJi,
    jeolgiStart,
    jeolgiEnd,
    daysFromStart,
  };
}

/**
 * 사령 천간을 한자로 변환
 *
 * @param hangulGan 천간 한글 (예: "무")
 * @returns 천간 한자 (예: "戊")
 */
export function convertSaryeongToHanja(hangulGan: string): string {
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
 * 사령 천간의 오행 반환
 *
 * @param gan 천간 (한글 또는 한자)
 * @returns 오행 (木/火/土/金/水)
 */
export function getSaryeongOhaeng(gan: string): string {
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
