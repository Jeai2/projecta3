// server/src/services/ohaeng-chart.service.ts
// 사주 원국의 오행 그래프 데이터 생성 서비스

import { SajuData } from "../types/saju.d";
import { countOhaeng, OhaengCount, GAN_TO_OHAENG } from "../data/yongsin.data";
import { JI_OHENG, GAN_OHENG } from "../data/saju.data";
import {
  SAMHAP,
  SAMHAPHWA,
  BANGHAP,
  BANGHAPHWA,
} from "../data/relationship.data";
import { JIJANGGAN_DATA, INWON_YONGSA_DATA } from "../data/jijanggan";

/**
 * 천간 한글을 한자로 변환
 */
const HANGUL_TO_HANJA_GAN: Record<string, string> = {
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

/**
 * 천간을 한자로 정규화 (한글/한자 모두 지원)
 */
function normalizeGanToHanja(gan: string): string {
  return HANGUL_TO_HANJA_GAN[gan] || gan;
}

/**
 * 천간의 오행 반환 (한글/한자 모두 지원)
 */
function getGanOhaeng(gan: string): string | undefined {
  const hanjaGan = normalizeGanToHanja(gan);
  return GAN_TO_OHAENG[hanjaGan] || GAN_OHENG[hanjaGan];
}

/**
 * 오행 그래프 데이터 인터페이스
 */
export interface OhaengChartData {
  data: {
    label: string; // "木 (성장)" 형식
    value: number; // 0-100 사이의 백분율 값
    count: number; // 실제 개수
    ohaeng: "木" | "火" | "土" | "金" | "水"; // 오행 한자
  }[];
  total: number; // 전체 오행 개수
  breakdown: {
    gan: OhaengCount; // 천간 오행 개수
    ji: OhaengCount; // 지지 오행 개수
    jijanggan?: OhaengCount; // 지장간 오행 개수 (선택적)
  };
}

/**
 * 가중치 옵션
 */
export interface OhaengChartOptions {
  includeJijanggan?: boolean; // 지장간 포함 여부
  /** true면 시주 제외, 년월일 6글자만 사용 */
  excludeHour?: boolean;
  weights?: {
    gan?: number; // 천간 가중치 (기본값: 1.0)
    ji?: number; // 지지 가중치 (기본값: 1.0)
    jijanggan?: number; // 지장간 가중치 (기본값: 0.5)
    monthPillar?: number; // 월지 가중치 (기본값: 1.2)
  };
  normalization?: "percentage" | "ratio"; // 정규화 방식 (기본값: "percentage")
}

/**
 * 사주 데이터에서 오행 그래프 데이터를 생성합니다
 *
 * @param sajuData 사주 데이터
 * @param options 옵션 (가중치, 지장간 포함 여부 등)
 * @returns 오행 그래프 데이터
 */
export function calculateOhaengChart(
  sajuData: SajuData,
  options: OhaengChartOptions = {},
): OhaengChartData {
  const {
    includeJijanggan = false,
    excludeHour = false,
    weights = {},
    normalization = "percentage",
  } = options;

  const pillarKeys = excludeHour
    ? (["year", "month", "day"] as const)
    : (["year", "month", "day", "hour"] as const);

  const ganWeight = weights.gan ?? 1.0;
  const jiWeight = weights.ji ?? 1.0;
  const jijangganWeight = weights.jijanggan ?? 0.5;
  const monthPillarWeight = weights.monthPillar ?? 1.2;

  // 1. 기본 오행 개수 계산은 나중에 천간+지지 합산으로 계산 (삼합/방합 포함)

  // 2. 천간 오행 개수만 계산
  const ganOhaengCount: OhaengCount = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
    total: 0,
  };

  pillarKeys.forEach((key) => {
    const pillar = sajuData.pillars[key];
    if (pillar?.ganOhaeng) {
      ganOhaengCount[pillar.ganOhaeng as keyof OhaengCount]++;
      ganOhaengCount.total++;
    }
  });

  // 3. 지지 오행 개수 계산 (삼합/방합 포함)
  const jiOhaengCount: OhaengCount = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
    total: 0,
  };

  // 원국 지지들 수집 (시주 제외 시 3개)
  const allJis = pillarKeys
    .map((key) => sajuData.pillars[key]?.ji)
    .filter(Boolean);
  const jiSet = new Set(allJis);

  // 각 지지의 오행 계산 (본래 오행 + 삼합/방합 합화 오행)
  pillarKeys.forEach((key) => {
    const pillar = sajuData.pillars[key];
    if (!pillar.ji || !pillar.jiOhaeng) return;

    const ji = pillar.ji;
    const baseOhaeng = pillar.jiOhaeng;

    // 1. 본래 오행 추가
    jiOhaengCount[baseOhaeng as keyof OhaengCount]++;
    jiOhaengCount.total++;

    // 2. 삼합 확인 (반합 포함: 파트너 중 1개만 있어도 가능)
    const samhapPartners = SAMHAP[ji];
    if (samhapPartners) {
      // 반합 확인: 파트너 중 하나라도 원국에 있으면 반합으로 인정
      const hasAnyPartner = samhapPartners.some((partner) =>
        jiSet.has(partner),
      );
      if (hasAnyPartner) {
        const samhaphwa = SAMHAPHWA[ji];
        if (samhaphwa && samhaphwa.result) {
          // 합화 오행 추가 (반합도 포함)
          jiOhaengCount[samhaphwa.result as keyof OhaengCount]++;
          jiOhaengCount.total++;
        }
      }
    }

    // 3. 방합 확인 (3개가 모두 모여야 함)
    const banghapPartners = BANGHAP[ji];
    if (banghapPartners) {
      // 방합 파트너들이 모두 원국에 있는지 확인
      const hasAllPartners = banghapPartners.every((partner) =>
        jiSet.has(partner),
      );
      if (hasAllPartners) {
        const banghaphwa = BANGHAPHWA[ji];
        if (banghaphwa && banghaphwa.result) {
          // 합화 오행 추가
          jiOhaengCount[banghaphwa.result as keyof OhaengCount]++;
          jiOhaengCount.total++;
        }
      }
    }
  });

  // 4. 지장간 오행 개수 계산 (통근 조건 적용)
  let jijangganOhaengCount: OhaengCount | undefined;
  if (includeJijanggan) {
    jijangganOhaengCount = {
      木: 0,
      火: 0,
      土: 0,
      金: 0,
      水: 0,
      total: 0,
    };

    // 원국 천간들의 오행 수집 (통근 확인용)
    const allGanOhaengs = pillarKeys
      .map((key) => sajuData.pillars[key]?.ganOhaeng)
      .filter(Boolean) as string[];

    // 각 지지별로 지장간 처리
    pillarKeys.forEach((key) => {
      const pillar = sajuData.pillars[key];
      if (!pillar?.ji) return;

      const ji = pillar.ji;
      let jijangganGans: string[] = [];

      // 월지는 월률분야 (기존 JIJANGGAN_DATA), 나머지는 인원용사
      if (key === "month") {
        // 월지: 월률분야 사용 (기존 데이터)
        const jijangganData = JIJANGGAN_DATA[ji];
        if (jijangganData) {
          jijangganGans = jijangganData.map((item) => item.gan);
        }
      } else {
        // 년지, 일지, 시지: 인원용사 사용
        jijangganGans = INWON_YONGSA_DATA[ji] || [];
      }

      // 각 지장간에 대해 통근 확인 및 오행 카운트
      jijangganGans.forEach((gan) => {
        // 한글/한자 모두 지원하도록 오행 확인
        const ganOhaeng = getGanOhaeng(gan);
        if (!ganOhaeng) return;

        // 통근 확인: 지장간 오행이 원국 천간 오행 중 하나와 같은지
        const hasTonggeun = allGanOhaengs.includes(ganOhaeng);

        // 통근이 있는 경우만 카운트
        if (hasTonggeun) {
          jijangganOhaengCount![ganOhaeng as keyof OhaengCount]++;
          jijangganOhaengCount!.total++;
        }
      });
    });
  }

  // 5. 가중치 적용하여 최종 오행 점수 계산
  const weightedScores: Record<string, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };

  // 천간 가중치 적용
  Object.entries(ganOhaengCount).forEach(([ohaeng, count]) => {
    if (ohaeng !== "total") {
      weightedScores[ohaeng] += count * ganWeight;
    }
  });

  // 지지 가중치 적용 (월지는 추가 가중치, 삼합/방합 합화 오행 포함)
  pillarKeys.forEach((key) => {
    const pillar = sajuData.pillars[key];
    if (!pillar?.ji || !pillar?.jiOhaeng) return;

    const ji = pillar.ji;
    const baseOhaeng = pillar.jiOhaeng;
    const weight =
      key === "month" ? jiWeight * monthPillarWeight : jiWeight;

    // 1. 본래 오행 가중치 적용
    weightedScores[baseOhaeng as keyof typeof weightedScores] += weight;

    // 2. 삼합 합화 오행 가중치 적용 (반합 포함: 파트너 중 1개만 있어도 가능)
    const samhapPartners = SAMHAP[ji];
    if (samhapPartners) {
      // 반합 확인: 파트너 중 하나라도 원국에 있으면 반합으로 인정
      const hasAnyPartner = samhapPartners.some((partner) =>
        jiSet.has(partner),
      );
      if (hasAnyPartner) {
        const samhaphwa = SAMHAPHWA[ji];
        if (samhaphwa && samhaphwa.result) {
          weightedScores[samhaphwa.result as keyof typeof weightedScores] +=
            weight;
        }
      }
    }

    // 3. 방합 합화 오행 가중치 적용 (3개가 모두 모여야 함)
    const banghapPartners = BANGHAP[ji];
    if (banghapPartners) {
      // 방합 파트너들이 모두 원국에 있는지 확인
      const hasAllPartners = banghapPartners.every((partner) =>
        jiSet.has(partner),
      );
      if (hasAllPartners) {
        const banghaphwa = BANGHAPHWA[ji];
        if (banghaphwa && banghaphwa.result) {
          weightedScores[banghaphwa.result as keyof typeof weightedScores] +=
            weight;
        }
      }
    }
  });

  // 지장간 가중치 적용 (통근 조건 적용)
  if (includeJijanggan) {
    // 원국 천간들의 오행 수집 (통근 확인용)
    const allGanOhaengsForWeight = pillarKeys
      .map((k) => sajuData.pillars[k]?.ganOhaeng)
      .filter(Boolean) as string[];

    // 각 지지별로 지장간 처리
    pillarKeys.forEach((key) => {
      const pillar = sajuData.pillars[key];
      if (!pillar?.ji) return;

      const ji = pillar.ji;
      let jijangganGans: string[] = [];

      // 월지는 월률분야 (기존 JIJANGGAN_DATA), 나머지는 인원용사
      if (key === "month") {
        // 월지: 월률분야 사용 (기존 데이터)
        const jijangganData = JIJANGGAN_DATA[ji];
        if (jijangganData) {
          jijangganGans = jijangganData.map((item) => item.gan);
        }
      } else {
        // 년지, 일지, 시지: 인원용사 사용
        jijangganGans = INWON_YONGSA_DATA[ji] || [];
      }

      // 각 지장간에 대해 통근 확인 및 가중치 적용
      jijangganGans.forEach((gan) => {
        // 한글/한자 모두 지원하도록 오행 확인
        const ganOhaeng = getGanOhaeng(gan);
        if (!ganOhaeng) return;

        // 통근 확인: 지장간 오행이 원국 천간 오행 중 하나와 같은지
        const hasTonggeun = allGanOhaengsForWeight.includes(ganOhaeng);

        // 통근이 있는 경우만 가중치 적용 (없으면 0, 제외와 동일)
        if (hasTonggeun) {
          weightedScores[ganOhaeng as keyof typeof weightedScores] +=
            jijangganWeight;
        }
      });
    });
  }

  // 6. 정규화 (백분율 또는 비율)
  const totalScore = Object.values(weightedScores).reduce(
    (sum, score) => sum + score,
    0,
  );

  const chartData = [
    {
      ohaeng: "木" as const,
      label: "木 (성장)",
      description: "새로운 시작과 성장의 기운",
    },
    {
      ohaeng: "火" as const,
      label: "火 (발산)",
      description: "활동과 창조의 기운",
    },
    {
      ohaeng: "土" as const,
      label: "土 (안정)",
      description: "안정과 포용의 기운",
    },
    {
      ohaeng: "金" as const,
      label: "金 (결실)",
      description: "정리와 완성의 기운",
    },
    {
      ohaeng: "水" as const,
      label: "水 (지혜)",
      description: "지혜와 적응의 기운",
    },
  ].map(({ ohaeng, label }) => {
    const score = weightedScores[ohaeng];
    // 기본 오행 개수 = 천간 개수 + 지지 개수 (삼합/방합 포함)
    const count = ganOhaengCount[ohaeng] + jiOhaengCount[ohaeng];

    let value: number;
    if (normalization === "percentage") {
      // 백분율로 정규화 (0-100)
      value = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
    } else {
      // 비율로 정규화 (0-1)
      value =
        totalScore > 0 ? Math.round((score / totalScore) * 1000) / 1000 : 0;
    }

    return {
      label,
      value,
      count,
      ohaeng,
    };
  });

  // 전체 오행 개수 = 천간 total + 지지 total
  const totalOhaengCount = ganOhaengCount.total + jiOhaengCount.total;

  return {
    data: chartData,
    total: totalOhaengCount,
    breakdown: {
      gan: ganOhaengCount,
      ji: jiOhaengCount,
      ...(jijangganOhaengCount && { jijanggan: jijangganOhaengCount }),
    },
  };
}

/**
 * 간단한 오행 그래프 데이터 생성 (가중치 없이 기본 계산)
 */
export function calculateSimpleOhaengChart(
  sajuData: SajuData,
): OhaengChartData {
  return calculateOhaengChart(sajuData, {
    includeJijanggan: false,
    normalization: "percentage",
  });
}
