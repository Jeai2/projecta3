// server/src/hwa-eui/services/hwa-eui.service.ts
// 화의론의 기반이 되는 납음오행을 계산하는 서비스

import {
  NAPEUM_OHENG_DATA,
  NapeumOhengElement,
} from "../data/napeum-oheng.data";

// 사주 네 기둥의 타입을 명확하게 정의합니다.
// 나중에 다른 서비스에서도 이 타입을 공유해야 할 수 있으므로,
// 추후 /common/types/saju.types.ts 같은 공통 파일로 옮기는 것을 고려할 수 있습니다.
interface Pillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

// 각 기둥별 납음오행 결과를 담을 타입
export interface NapeumResult {
  year: NapeumOhengElement | null;
  month: NapeumOhengElement | null;
  day: NapeumOhengElement | null;
  hour: NapeumOhengElement | null;
}

/**
 * 사주 네 기둥을 입력받아 각 기둥의 납음오행을 반환하는 함수
 * @param pillars 사주 원국의 네 기둥 { year, month, day, hour }
 * @returns 각 기둥의 납음오행 정보가 담긴 객체
 */
export const getNapeumFromPillars = (pillars: Pillars): NapeumResult => {
  // 각 기둥의 간지를 키(key)로 사용하여 NAPEUM_OHENG_DATA에서 해당 납음오행 정보를 찾습니다.
  const yearNapeum = NAPEUM_OHENG_DATA[pillars.year] || null;
  const monthNapeum = NAPEUM_OHENG_DATA[pillars.month] || null;
  const dayNapeum = NAPEUM_OHENG_DATA[pillars.day] || null;
  const hourNapeum = NAPEUM_OHENG_DATA[pillars.hour] || null;

  return {
    year: yearNapeum,
    month: monthNapeum,
    day: dayNapeum,
    hour: hourNapeum,
  };
};
