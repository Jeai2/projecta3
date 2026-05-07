// src/services/daewoon.service.ts
import { GANJI } from "../data/saju.data";
import { getSipsin } from "./sipsin.service";
import { getSibiwunseong } from "./sibiwunseong.service";

// 타입 정의는 유지합니다.
type SeasonalData = { [key: number]: { name: string; date: Date }[] };
type Pillars = { yearPillar: string; monthPillar: string; dayPillar: string };

export interface Daewoon {
  age: number; // 대운이 시작되는 나이 (만 나이 기준)
  year: number; // 해당 대운이 시작되는 년도
  ganji: string; // 해당 대운의 간지
  sipsin: { gan: string | null; ji: string | null }; // sipsin.service.ts의 반환 타입과 일치
  sibiwunseong: string | null; // sibiwunseong.service.ts의 반환 타입과 일치
}

// 모든 로직을 이 함수 하나로 통합합니다.
export const getDaewoon = (
  birthDate: Date,
  gender: "M" | "W",
  pillars: Pillars,
  seasonalData: SeasonalData
): Daewoon[] => {
  const { yearPillar, monthPillar, dayPillar } = pillars;
  const yearGan = yearPillar[0];

  // 1. 년간의 음양 확인 (한자/한글 모두 지원)
  const yangGanHanja = ["甲", "丙", "戊", "庚", "壬"];
  const yangGanHangul = ["갑", "병", "무", "경", "임"];
  const isYangYearGan =
    yangGanHanja.includes(yearGan) || yangGanHangul.includes(yearGan);

  // 2. 대운의 방향(순행/역행) 결정
  const isForward =
    (isYangYearGan && gender === "M") || (!isYangYearGan && gender === "W");

  // 3. 대운수 계산을 위한 현재 절기 인덱스 찾기
  const year = birthDate.getFullYear();
  const seasons = seasonalData[year] || seasonalData[year - 1];
  if (!seasons || seasons.length === 0) return [];

  let currentSeasonIndex = -1;
  for (let i = seasons.length - 1; i >= 0; i--) {
    if (i % 2 === 0 && birthDate >= seasons[i].date) {
      currentSeasonIndex = i;
      break;
    }
  }

  // 동지 이후 출생자 보정
  if (currentSeasonIndex === -1 && seasons.length > 0) {
    const dongjiIndex = seasons.findIndex((s) => s.name === "동지");
    if (dongjiIndex !== -1) currentSeasonIndex = dongjiIndex;
    else currentSeasonIndex = seasons.length - 2; // Fallback
  }

  // 4. 대운수(첫 대운 시작 나이) 계산
  const timeDiff = isForward
    ? (seasons[currentSeasonIndex + 2]?.date.getTime() || 0) -
      birthDate.getTime()
    : birthDate.getTime() - seasons[currentSeasonIndex].date.getTime();

  // [수정된 부분] 반올림(Math.round) 대신 내림(Math.floor)을 사용하여 정확도 향상
  let daewoonNum = Math.floor(timeDiff / (1000 * 60 * 60 * 24) / 3);
  if (daewoonNum < 1) daewoonNum = 1;
  if (daewoonNum > 10) daewoonNum = 10;

  // 5. 100년치 대운 간지 리스트 생성
  const daewoonResult: Daewoon[] = [];
  const startGanjiIndex = GANJI.indexOf(monthPillar);
  const dayGan = dayPillar[0];

  for (let i = 0; i < 10; i++) {
    // 대운은 월주 '다음' 또는 '이전' 간지부터 시작
    const ganjiOffset = isForward ? i + 1 : -(i + 1);
    const ganjiIndex = (startGanjiIndex + ganjiOffset + 60) % 60;
    const ganji = GANJI[ganjiIndex];

    // 대운에 대한 십성, 십이운성 계산을 위해 임시 기둥 정보 생성
    const daewoonPillars = { year: ganji, month: "", day: "", hour: "" };

    daewoonResult.push({
      age: daewoonNum + i * 10,
      year: birthDate.getFullYear() + daewoonNum + i * 10 - 1,
      ganji: ganji,
      sipsin: getSipsin(dayGan, daewoonPillars).year,
      sibiwunseong: getSibiwunseong(dayGan, daewoonPillars).year,
    });
  }

  return daewoonResult;
};
