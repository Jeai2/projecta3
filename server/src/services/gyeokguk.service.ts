// server/src/services/gyeokguk.service.ts
// 격국 판단 로직

import { JIJANGGAN_DATA } from "../data/jijanggan";
import {
  GYEOKGUK_DATA,
  SIPSIN_TO_GYEOKGUK,
  GyeokgukType,
} from "../data/gyeokguk.data";
import { GAN_OHENG, SIPSIN_TABLE } from "../data/saju.data";
import { SAMHAP } from "../data/relationship.data";
import { SajuData } from "../types/saju.d";

/**
 * 격국 분석 결과
 */
export interface GyeokgukAnalysis {
  gyeokguk: GyeokgukType | null; // 확정된 격국
  monthJiSipsin: string; // 월지 십성
  saRyeongGan: string | null; // 사령 천간 (격국을 이루는 지장간 천간)
  isSuccess: boolean; // 성격 여부
  breakFactors: string[]; // 파격 요인들
  yongsinType: string; // 용신 유형 ("印", "財", "官" 등)
  confidence: number; // 신뢰도 (0-100)
  reason: string; // 판단 근거
}

/**
 * 월지 유형 분류 (한자 기준)
 */
const WANGJI = ["子", "午", "卯", "酉"]; // 왕지 (旺地)
const SAENGJI = ["寅", "申", "巳", "亥"]; // 생지 (生地)
const GOJI = ["辰", "戌", "丑", "未"]; // 고지 (庫地)

/**
 * 투출/투간 확인 함수
 */
function checkTouchul(
  monthJi: string,
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string };
  }
): {
  touchul: { role: string; gan: string; ohaeng: string }[]; // 투출 (오행 같음)
  tougan: { role: string; gan: string }[]; // 투간 (천간 같음)
} {
  const jijangganElements = JIJANGGAN_DATA[monthJi] || [];
  // ⚠️ 일간(day.gan)은 제외! 년간, 월간, 시간만 확인
  const allGans = [
    pillars.year.gan,
    pillars.month.gan,
    // pillars.day.gan, // 일간 제외!
    pillars.hour.gan,
  ];

  const touchul: { role: string; gan: string; ohaeng: string }[] = [];
  const tougan: { role: string; gan: string }[] = [];

  for (const element of jijangganElements) {
    const elementOhaeng = GAN_OHENG[element.gan as keyof typeof GAN_OHENG];

    // 투간 확인 (같은 천간)
    if (allGans.includes(element.gan)) {
      tougan.push({
        role: element.role,
        gan: element.gan,
      });
    }

    // 투출 확인 (같은 오행)
    for (const gan of allGans) {
      const ganOhaeng = GAN_OHENG[gan as keyof typeof GAN_OHENG];
      if (
        ganOhaeng === elementOhaeng &&
        !tougan.some((t) => t.gan === element.gan)
      ) {
        touchul.push({
          role: element.role,
          gan: element.gan,
          ohaeng: elementOhaeng,
        });
        break;
      }
    }
  }

  return { touchul, tougan };
}

/**
 * 삼합/반합 확인 함수 (기존 SAMHAP 데이터 활용)
 */

/**
 * 격국 판단 메인 함수
 */
export async function analyzeGyeokguk(
  sajuData: SajuData,
  _birthDate?: Date // 생년월일 추가 (선택적)
): Promise<GyeokgukAnalysis> {
  void _birthDate;
  const monthJi = sajuData.pillars.month.ji;
  const dayGan = sajuData.pillars.day.gan;

  // ✅ sipsin.month.ji는 string | null 타입 (예: "정인", "편재")
  const monthJiSipsin = sajuData.sipsin?.month?.ji || "";

  // 🔍 디버깅: 월지 십성 확인
  console.log("🔍 격국 분석 디버깅:");
  console.log("  - 월지:", monthJi);
  console.log("  - 월지 십성:", monthJiSipsin);
  console.log("  - sipsin.month:", sajuData.sipsin?.month);
  console.log("  - sipsin.month.ji:", sajuData.sipsin?.month?.ji);

  const { tougan } = checkTouchul(monthJi, sajuData.pillars);

  let selectedElement: { role: string; gan: string } | null = null;
  let reason = "";

  const jeongiElement = JIJANGGAN_DATA[monthJi]?.find((e) => e.role === "정기");
  const jungiElement = JIJANGGAN_DATA[monthJi]?.find((e) => e.role === "중기");
  const yeogiElement = JIJANGGAN_DATA[monthJi]?.find((e) => e.role === "초기");

  // 월지 유형별 판단 (A 선정)
  if (WANGJI.includes(monthJi)) {
    // 왕지: 정기 = A
    if (jeongiElement) {
      selectedElement = { role: "정기", gan: jeongiElement.gan };
      reason = `왕지(${monthJi}) - 정기(${jeongiElement.gan}) 자동 채택`;
    }
  } else if (SAENGJI.includes(monthJi)) {
    // 생지: 정기 투간 우선, 이후 여기/중기 투간
    const jeongiTougan = tougan.find((t) => t.role === "정기");
    const jungiTougan = tougan.find((t) => t.role === "중기");
    const yeogiTougan = tougan.find((t) => t.role === "초기");

    if (jeongiTougan && jeongiElement) {
      selectedElement = { role: "정기", gan: jeongiElement.gan };
      reason = `생지(${monthJi}) - 정기 투간`;
    } else if (jungiTougan || yeogiTougan) {
      if (jungiTougan && yeogiTougan && jungiElement) {
        selectedElement = { role: "중기", gan: jungiElement.gan };
        reason = `생지(${monthJi}) - 여기/중기 동시 투간, 중기 채택`;
      } else if (jungiTougan && jungiElement) {
        selectedElement = { role: "중기", gan: jungiElement.gan };
        reason = `생지(${monthJi}) - 중기 투간`;
      } else if (yeogiTougan && yeogiElement) {
        selectedElement = { role: "초기", gan: yeogiElement.gan };
        reason = `생지(${monthJi}) - 여기 투간`;
      }
    }
  } else if (GOJI.includes(monthJi)) {
    // 고지: 정기와 같은 오행이 천간에 있으면 그 천간이 A
    const allGans = [
      sajuData.pillars.year.gan,
      sajuData.pillars.month.gan,
      sajuData.pillars.day.gan,
      sajuData.pillars.hour.gan,
    ].filter(Boolean);
    const jeongiOhaeng =
      jeongiElement && GAN_OHENG[jeongiElement.gan as keyof typeof GAN_OHENG];
    const sameOhaengGan =
      jeongiOhaeng &&
      allGans.find(
        (gan) => GAN_OHENG[gan as keyof typeof GAN_OHENG] === jeongiOhaeng
      );

    if (sameOhaengGan) {
      selectedElement = { role: "정기오행", gan: sameOhaengGan };
      reason = `고지(${monthJi}) - 정기와 같은 오행 투간(${sameOhaengGan})`;
    } else {
      // 삼합 지지가 년지/일지/시지에 있으면 중기
      const samhapPartners = SAMHAP[monthJi] || [];
      const hasSamhapInPillars = [
        sajuData.pillars.year.ji,
        sajuData.pillars.day.ji,
        sajuData.pillars.hour.ji,
      ].some((ji) => samhapPartners.includes(ji));

      if (hasSamhapInPillars && jungiElement) {
        selectedElement = { role: "중기", gan: jungiElement.gan };
        reason = `고지(${monthJi}) - 삼합 지지 있음, 중기(${jungiElement.gan}) 채택`;
      } else if (jeongiElement) {
        selectedElement = { role: "정기", gan: jeongiElement.gan };
        reason = `고지(${monthJi}) - 삼합 지지 없음, 정기(${jeongiElement.gan}) 채택`;
      }
    }
  }

  const selectedGan = selectedElement?.gan || "";
  const dayGanKey = dayGan as keyof typeof SIPSIN_TABLE.h;
  const selectedGanKey =
    selectedGan as keyof (typeof SIPSIN_TABLE.h)[typeof dayGanKey];
  const selectedSipsin =
    dayGan && selectedGan
      ? SIPSIN_TABLE.h[dayGanKey]?.[selectedGanKey] || ""
      : "";

  // A의 십성으로 격국 후보 찾기 (없으면 월지 십성으로 폴백)
  const gyeokgukCodes = selectedSipsin
    ? SIPSIN_TO_GYEOKGUK[selectedSipsin]
    : SIPSIN_TO_GYEOKGUK[monthJiSipsin];
  if (!gyeokgukCodes || gyeokgukCodes.length === 0) {
    return {
      gyeokguk: null,
      monthJiSipsin,
      saRyeongGan: selectedGan || null,
      isSuccess: false,
      breakFactors: [],
      yongsinType: "",
      confidence: 0,
      reason: `십성 '${
        selectedSipsin || monthJiSipsin
      }'에 해당하는 격국이 없습니다.`,
    };
  }

  const gyeokguk =
    GYEOKGUK_DATA[gyeokgukCodes[0] as keyof typeof GYEOKGUK_DATA];
  if (!gyeokguk) {
    return {
      gyeokguk: null,
      monthJiSipsin,
      saRyeongGan: selectedGan || null,
      isSuccess: false,
      breakFactors: [],
      yongsinType: "",
      confidence: 0,
      reason: `격국 코드 '${gyeokgukCodes[0]}'에 해당하는 격국 정의를 찾을 수 없습니다.`,
    };
  }

  // 성패 판단 및 용신 선정 (간단 구현)
  const isSuccess = true; // TODO: 실제 성패 판단 로직
  const yongsinType = gyeokguk.yongsin[0] || "";

  // 선정된 요소 정보를 reason에 추가
  if (selectedElement) {
    reason += ` (선정: ${selectedElement.role} ${selectedElement.gan})`;
  }

  return {
    gyeokguk,
    monthJiSipsin,
    saRyeongGan: selectedElement?.gan || null, // 사령 천간 (격국 기준 천간)
    isSuccess,
    breakFactors: [],
    yongsinType,
    confidence: 70, // 임시값
    reason,
  };
}
