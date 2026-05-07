// server/src/services/career-energy.service.ts
// 진로 직업 찾기 - 에너지 타입 결정 서비스

import { analyzeDangnyeong } from "./dangnyeong.service";
import { analyzeSaryeong } from "./saryeong.service";
import { getEnergyDataByGan, EnergyTypeData } from "../data/career-energy.data";

export interface CareerEnergyResult {
  energyData: EnergyTypeData;
  source: "saryeong" | "dangnyeong"; // 어떤 기준으로 선택되었는지
  saryeongGan: string | null; // 사령 천간
  dangnyeongGan: string | null; // 당령 천간
  saryeongInPillars: boolean; // 사령이 원국 천간에 있는지
  dangnyeongInPillars: boolean; // 당령이 원국 천간에 있는지
}

/**
 * 사주 원국 천간 배열에서 특정 천간이 있는지 확인
 * @param excludeHour true면 시주 제외, 년월일만 확인
 */
function isGanInPillars(
  gan: string,
  pillars: { year: string; month: string; day: string; hour?: string | null }
): boolean {
  const ganMap: Record<string, string> = {
    甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
    己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
  };
  const hangulGan = ganMap[gan] || gan;
  const hangulPillars = [
    ganMap[pillars.year?.[0]] || pillars.year?.[0],
    ganMap[pillars.month?.[0]] || pillars.month?.[0],
    ganMap[pillars.day?.[0]] || pillars.day?.[0],
    ...(pillars.hour ? [ganMap[pillars.hour[0]] || pillars.hour[0]] : []),
  ].filter(Boolean);
  return hangulPillars.includes(hangulGan);
}

/**
 * 진로 에너지 타입 결정
 * 
 * 우선순위:
 * 1. 사령이 원국 천간에 투간된 경우 → 사령 사용 (최우선)
 * 2. 사령 없고 당령이 원국 천간에 투간된 경우 → 당령 사용
 * 3. 당령과 사령이 모두 원국 천간에 있음 → 사령 우선 (1번)
 * 4. 당령과 사령이 모두 원국 천간에 없음 → 사령 사용 (기본값)
 * 
 * @param birthDate 생년월일시
 * @param monthJi 월지 (예: "술")
 * @param pillars 사주 원국 (년/월/일/시 천간)
 * @returns 에너지 타입 결과
 */
export function determineCareerEnergy(
  birthDate: Date,
  monthJi: string,
  pillars: { year: string; month: string; day: string; hour?: string | null }
): CareerEnergyResult {
  // 1. 당령과 사령 계산
  const dangnyeongResult = analyzeDangnyeong(birthDate);
  const saryeongResult = analyzeSaryeong(birthDate, monthJi);

  const dangnyeongGan = dangnyeongResult.dangnyeongGan;
  const saryeongGan = saryeongResult.saryeongGan;

  // 2. 원국 천간에서 당령/사령 존재 여부 확인
  const saryeongInPillars = isGanInPillars(saryeongGan, pillars);
  const dangnyeongInPillars = isGanInPillars(dangnyeongGan, pillars);

  // 3. 우선순위에 따라 에너지 타입 결정
  let selectedGan: string;
  let source: "saryeong" | "dangnyeong";

  if (saryeongInPillars) {
    // 우선순위 1: 사령이 원국 천간에 있으면 사령 사용
    selectedGan = saryeongGan;
    source = "saryeong";
  } else if (dangnyeongInPillars) {
    // 우선순위 2: 사령 없고 당령이 원국 천간에 있으면 당령 사용
    selectedGan = dangnyeongGan;
    source = "dangnyeong";
  } else {
    // 우선순위 4: 둘 다 없으면 사령 사용 (기본값)
    selectedGan = saryeongGan;
    source = "saryeong";
  }

  // 4. 에너지 데이터 조회
  const energyData = getEnergyDataByGan(selectedGan);
  if (!energyData) {
    throw new Error(`천간 "${selectedGan}"에 대한 에너지 데이터를 찾을 수 없습니다.`);
  }

  return {
    energyData,
    source,
    saryeongGan,
    dangnyeongGan,
    saryeongInPillars,
    dangnyeongInPillars,
  };
}
