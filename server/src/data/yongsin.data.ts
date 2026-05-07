// server/src/data/yongsin.data.ts
// 용신 시스템 전용 데이터 파일

// =================================================================
// 용신 시스템 인터페이스 정의
// =================================================================

// 개별 Tier 분석 결과
export interface TierAnalysis {
  tier: number; // 1~6
  name: string; // "전왕용신", "조후용신" 등
  isDominant: boolean; // 이 Tier가 주체가 될 수 있는가?
  yongsin: string; // 결정된 용신 천간 (단일)
  confidence: number; // 확신도 (0-100)
  reason: string; // 선정 이유
  details?: Record<string, unknown>; // 추가 분석 데이터
}

// 최종 용신 결과
export interface YongsinResult {
  primaryYongsin: string; // 최종 선정된 용신 천간 (단일)
  selectedTier: TierAnalysis | null; // 선정된 Tier 분석 결과
  allAnalyses: TierAnalysis[]; // 전체 Tier 분석 결과
  confidence: number; // 최종 확신도
  summary: string; // 요약 설명
}

// 오행 카운트 인터페이스
export interface OhaengCount {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
  total: number;
}

// =================================================================
// Tier별 판단 기준값
// =================================================================

// 조후용신 맵핑 (일간 × 월지 → 용신 후보)
export const JOHU_DAY_MONTH_YONGSIN_MAP: Record<
  string,
  Record<string, string[]>
> = {
  甲: {
    寅: ["丙", "癸"],
    卯: ["庚", "戊"],
    辰: ["庚", "壬"],
    巳: ["癸", "丁"],
    午: ["癸", "丁"],
    未: ["癸", "丁"],
    申: ["庚", "丁"],
    酉: ["丁", "丙"],
    戌: ["丁", "癸"],
    亥: ["庚", "丁"],
    子: ["丁", "庚"],
    丑: ["庚", "丁"],
  },
  乙: {
    寅: ["丙", "癸"],
    卯: ["丙", "癸"],
    辰: ["癸", "丙"],
    巳: ["癸", "辛"],
    午: ["癸", "辛"],
    未: ["癸", "辛"],
    申: ["己", "丙"],
    酉: ["癸", "丙"],
    戌: ["癸", "辛"],
    亥: ["癸", "辛"],
    子: ["癸", "丙"],
    丑: ["癸", "丙"],
  },
  丙: {
    寅: ["壬", "庚"],
    卯: ["壬", "癸"],
    辰: ["壬", "甲"],
    巳: ["壬", "庚"],
    午: ["壬", "庚"],
    未: ["壬", "庚"],
    申: ["壬", "戊"],
    酉: ["壬", "癸"],
    戌: ["甲", "壬"],
    亥: ["甲", "戊"],
    子: ["壬", "戊"],
    丑: ["壬", "甲"],
  },
  丁: {
    寅: ["庚", "甲"],
    卯: ["庚", "甲"],
    辰: ["甲", "庚"],
    巳: ["甲", "庚"],
    午: ["甲", "庚"],
    未: ["甲", "壬"],
    申: ["甲", "庚"],
    酉: ["甲", "壬"],
    戌: ["甲", "庚"],
    亥: ["甲", "庚"],
    子: ["甲", "庚"],
    丑: ["甲", "庚"],
  },
  戊: {
    寅: ["丙", "癸"],
    卯: ["丙", "癸"],
    辰: ["甲", "丙"],
    巳: ["甲", "丙"],
    午: ["壬", "甲"],
    未: ["癸", "丙"],
    申: ["甲", "壬"],
    酉: ["丙", "癸"],
    戌: ["甲", "癸"],
    亥: ["甲", "丙"],
    子: ["丙"],
    丑: ["甲", "丙"],
  },
  己: {
    寅: ["丙", "庚"],
    卯: ["壬", "癸"],
    辰: ["甲", "庚"],
    巳: ["壬", "丙"],
    午: ["壬", "丙"],
    未: ["壬", "丙"],
    申: ["甲", "癸"],
    酉: ["壬", "丙"],
    戌: ["甲", "壬"],
    亥: ["甲", "壬"],
    子: ["丙"],
    丑: ["甲", "壬"],
  },
  庚: {
    寅: ["丙", "甲"],
    卯: ["丙", "甲"],
    辰: ["甲", "庚"],
    巳: ["壬", "丙"],
    午: ["壬", "丙"],
    未: ["壬", "丙"],
    申: ["丙", "甲"],
    酉: ["丙", "甲"],
    戌: ["壬", "甲"],
    亥: ["丙", "甲"],
    子: ["壬", "甲"],
    丑: ["丙", "甲"],
  },
  辛: {
    寅: ["己", "壬"],
    卯: ["甲", "壬"],
    辰: ["壬", "甲"],
    巳: ["壬", "辛"],
    午: ["壬", "己"],
    未: ["辛", "甲"],
    申: ["壬", "戊"],
    酉: ["壬", "甲"],
    戌: ["壬", "甲"],
    亥: ["戊", "壬"],
    子: ["壬", "戊"],
    丑: ["壬", "甲"],
  },
  壬: {
    寅: ["庚", "丙"],
    卯: ["庚", "辛"],
    辰: ["甲", "壬"],
    巳: ["癸", "丙"],
    午: ["壬", "癸"],
    未: ["庚", "壬"],
    申: ["壬", "庚"],
    酉: ["壬", "辛"],
    戌: ["壬", "庚"],
    亥: ["壬", "庚"],
    子: ["壬", "戊"],
    丑: ["壬", "庚"],
  },
  癸: {
    寅: ["辛", "丙"],
    卯: ["庚", "辛"],
    辰: ["丙", "辛"],
    巳: ["辛", "癸"],
    午: ["辛", "壬"],
    未: ["庚", "壬"],
    申: ["戊", "甲"],
    酉: ["辛", "丙"],
    戌: ["壬", "甲"],
    亥: ["庚", "辛"],
    子: ["丙", "辛"],
    丑: ["壬", "癸"],
  },
};

// Tier 1: 억부용신 (抑扶) 기준 (디폴트)
export const EOKBU_CRITERIA = {
  // 신강신약 점수 기준 (새 35점 체계)
  WEAK_THRESHOLD: 14.0, // 14.0 미만 = 신약 → 扶 (도움 필요)
  STRONG_THRESHOLD: 21.0, // 21.0 초과 = 신강 → 抑 (억제 필요)
  // 14.0 ~ 20.0 = 중화

  // 십신 과다 판단 기준 (임시값, 추후 조정 가능)
  EXCESS_THRESHOLD: 3, // 특정 십신 카테고리가 3개 이상이면 "과다"
};

// =================================================================
// 억부용신 십신 관련 매핑 데이터
// =================================================================

// 십신명 → 십신 카테고리 매핑
export const SIPSIN_CATEGORY_MAP: Record<string, string> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  정재: "재성",
  편재: "재성",
  정관: "관성",
  편관: "관성",
  정인: "인성",
  편인: "인성",
};

// 일간별 십신 카테고리 → 오행 매핑
// 일간의 오행을 기준으로 각 십신 카테고리가 어떤 오행인지 정의
export const DAYGAN_SIPSIN_TO_OHAENG: Record<
  string,
  Record<string, string>
> = {
  // 木 일간 (甲, 乙)
  甲: { 비겁: "木", 식상: "火", 재성: "土", 관성: "金", 인성: "水" },
  乙: { 비겁: "木", 식상: "火", 재성: "土", 관성: "金", 인성: "水" },
  // 火 일간 (丙, 丁)
  丙: { 비겁: "火", 식상: "土", 재성: "金", 관성: "水", 인성: "木" },
  丁: { 비겁: "火", 식상: "土", 재성: "金", 관성: "水", 인성: "木" },
  // 土 일간 (戊, 己)
  戊: { 비겁: "土", 식상: "金", 재성: "水", 관성: "木", 인성: "火" },
  己: { 비겁: "土", 식상: "金", 재성: "水", 관성: "木", 인성: "火" },
  // 金 일간 (庚, 辛)
  庚: { 비겁: "金", 식상: "水", 재성: "木", 관성: "火", 인성: "土" },
  辛: { 비겁: "金", 식상: "水", 재성: "木", 관성: "火", 인성: "土" },
  // 水 일간 (壬, 癸)
  壬: { 비겁: "水", 식상: "木", 재성: "火", 관성: "土", 인성: "金" },
  癸: { 비겁: "水", 식상: "木", 재성: "火", 관성: "土", 인성: "金" },
};

// 오행 → 천간 매핑 (양간/음간)
export const OHAENG_TO_GAN: Record<string, { 양: string; 음: string }> = {
  木: { 양: "甲", 음: "乙" },
  火: { 양: "丙", 음: "丁" },
  土: { 양: "戊", 음: "己" },
  金: { 양: "庚", 음: "辛" },
  水: { 양: "壬", 음: "癸" },
};

// 천간 → 오행 매핑
export const GAN_TO_OHAENG: Record<string, string> = {
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

// 천간 음양 판별
export const GAN_YINYANG: Record<string, "양" | "음"> = {
  甲: "양",
  乙: "음",
  丙: "양",
  丁: "음",
  戊: "양",
  己: "음",
  庚: "양",
  辛: "음",
  壬: "양",
  癸: "음",
};

// 정십신 목록 (비견, 정인, 정관, 식신, 정재 - 음양이 같거나 정(正) 관계)
export const JEONG_SIPSIN_LIST = ["비견", "정인", "정관", "식신", "정재"];

// =================================================================
// 억부용신 조건 매핑
// =================================================================

// 신강일 때 용신 조건 (우선순위 순)
export const EOKBU_STRONG_CONDITIONS = [
  {
    id: "strong_1",
    name: "인성_과다",
    description: "일간을 생하는 오행(인성)이 많을 때",
    checkCategory: "인성", // 과다 여부 체크할 십신 카테고리
    yongsinCategory: "재성", // 용신으로 선정할 십신 카테고리
  },
  {
    id: "strong_2",
    name: "비겁_과다",
    description: "일간과 같은 오행(비겁)이 많을 때",
    checkCategory: "비겁",
    yongsinCategory: "재성",
  },
  // (추후 조건 추가)
];

// 신약일 때 용신 조건 (우선순위 순 - 인성 우선)
export const EOKBU_WEAK_CONDITIONS = [
  {
    id: "weak_1",
    name: "재성_과다",
    description: "일간이 극하는 오행(재성)이 많을 때 → 극당함",
    checkCategory: "재성",
    yongsinCategory: "인성", // 인성 우선
  },
  {
    id: "weak_2",
    name: "관성_과다",
    description: "일간을 극하는 오행(관성)이 많을 때 → 극당함",
    checkCategory: "관성",
    yongsinCategory: "인성", // 인성 우선
  },
  {
    id: "weak_3",
    name: "식상_과다",
    description: "일간이 생하는 오행(식상)이 많을 때 → 설기당함",
    checkCategory: "식상",
    yongsinCategory: "비겁",
  },
  // (추후 조건 추가)
];

// 중화일 때 용신 조건 (우선순위 순)
export const EOKBU_NEUTRAL_CONDITIONS = [
  {
    id: "neutral_1",
    name: "식상_부재",
    description: "원국에 식상이 없으면",
    checkCategory: "식상",
    checkType: "absence", // 부재 여부 체크
    yongsinCategory: "식상",
  },
  {
    id: "neutral_2",
    name: "관성_부재",
    description: "원국에 관성이 없으면",
    checkCategory: "관성",
    checkType: "absence",
    yongsinCategory: "관성",
  },
  {
    id: "neutral_3",
    name: "재성_부재",
    description: "원국에 재성이 없으면",
    checkCategory: "재성",
    checkType: "absence",
    yongsinCategory: "재성",
  },
  {
    id: "neutral_fallback",
    name: "월지정기",
    description: "위 조건에 해당하지 않으면 월지 정기를 용신으로",
    checkType: "fallback",
    yongsinCategory: "월지정기", // 특수 처리 필요
  },
  // (추후 조건 추가)
];

// 지장간 정기 → 천간 매핑 (한글 → 한자)
export const JIJANGGAN_JUNGGI_TO_GAN: Record<string, string> = {
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

// =================================================================
// 월지-계절 매핑 데이터
// =================================================================

export const MONTHJI_TO_SEASON: { [key: string]: string } = {
  // 춘계 (봄)
  寅: "SPRING",
  卯: "SPRING",
  辰: "SPRING",
  // 하계 (여름)
  巳: "SUMMER",
  午: "SUMMER",
  未: "SUMMER",
  // 추계 (가을)
  申: "AUTUMN",
  酉: "AUTUMN",
  戌: "AUTUMN",
  // 동계 (겨울)
  亥: "WINTER",
  子: "WINTER",
  丑: "WINTER",
};

// =================================================================
// 오행 관계 매핑
// =================================================================

// 오행 상생 관계
export const OHAENG_SAENGSAENG: { [key: string]: string } = {
  木: "火", // 木生火
  火: "土", // 火生土
  土: "金", // 土生金
  金: "水", // 金生水
  水: "木", // 水生木
};

// 오행 상극 관계
export const OHAENG_SANGGEUK: { [key: string]: string } = {
  木: "土", // 木剋土
  火: "金", // 火剋金
  土: "水", // 土剋水
  金: "木", // 金剋木
  水: "火", // 水剋火
};

// =================================================================
// 유틸리티 함수
// =================================================================

/**
 * 사주 pillars에서 오행 개수를 계산합니다
 */
export function countOhaeng(
  pillars: Record<string, { ganOhaeng?: string; jiOhaeng?: string }>
): OhaengCount {
  const count: OhaengCount = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
    total: 0,
  };

  // 각 기둥의 천간+지지 오행을 카운트
  Object.values(pillars).forEach(
    (pillar: { ganOhaeng?: string; jiOhaeng?: string }) => {
      if (pillar.ganOhaeng) {
        count[pillar.ganOhaeng as keyof OhaengCount]++;
        count.total++;
      }
      if (pillar.jiOhaeng) {
        count[pillar.jiOhaeng as keyof OhaengCount]++;
        count.total++;
      }
    }
  );

  return count;
}

/**
 * 사주 데이터에서 오행 개수를 계산합니다 (countOhaengInSaju)
 * 실제 구현은 yongsin.service.ts에서 GAN_TO_OHAENG, JI_TO_OHAENG을 import해서 사용
 */
export function countOhaengInSaju(): {
  counts: Record<string, number>;
  total: number;
} {
  // 이 함수는 yongsin.service.ts에서 실제 구현됨
  return { counts: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }, total: 0 };
}

/**
 * 월지로부터 계절을 판단합니다
 */
export function getSeasonFromMonthJi(monthJi: string): string {
  return MONTHJI_TO_SEASON[monthJi] || "UNKNOWN";
}

/**
 * 특정 오행이 고립되었는지 확인합니다
 */
export function isOhaengIsolated(
  ohaengCount: OhaengCount,
  targetOhaeng: keyof OhaengCount
): boolean {
  return ohaengCount[targetOhaeng] === 0;
}

/**
 * 특정 오행의 위치들이 연속적으로 붙어있는지 확인
 */
export function isOhaengConsecutive(positions: number[]): boolean {
  if (positions.length < 2) return true; // 1개 이하는 항상 연속

  const sorted = [...positions].sort((a, b) => a - b);

  // 1) 천간끼리 연속인지 확인 (0,2,4,6)
  const ganPositions = sorted.filter((p) => p % 2 === 0);
  if (ganPositions.length >= 2) {
    let ganConsecutive = true;
    for (let i = 1; i < ganPositions.length; i++) {
      if (ganPositions[i] - ganPositions[i - 1] !== 2) {
        ganConsecutive = false;
        break;
      }
    }
    if (ganConsecutive && ganPositions.length === positions.length) return true;
  }

  // 2) 지지끼리 연속인지 확인 (1,3,5,7)
  const jiPositions = sorted.filter((p) => p % 2 === 1);
  if (jiPositions.length >= 2) {
    let jiConsecutive = true;
    for (let i = 1; i < jiPositions.length; i++) {
      if (jiPositions[i] - jiPositions[i - 1] !== 2) {
        jiConsecutive = false;
        break;
      }
    }
    if (jiConsecutive && jiPositions.length === positions.length) return true;
  }

  // 3) 위치상 연속인지 확인 (혼합)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      return false;
    }
  }
  return true;
}

/**
 * 특정 오행이 과다한지 확인합니다 (기존 단순 버전)
 */
/**
 * 두 오행이 상극 관계인지 확인합니다
 */
export function isConflictingOhaeng(ohaeng1: string, ohaeng2: string): boolean {
  return (
    OHAENG_SANGGEUK[ohaeng1] === ohaeng2 || OHAENG_SANGGEUK[ohaeng2] === ohaeng1
  );
}

/**
 * 타겟 오행이 다른 오행에게 극당하는지 확인 (적군 판단)
 */
export function isEnemyToTarget(
  targetOhaeng: string,
  otherOhaeng: string
): boolean {
  // 나를 극하는 오행인지 확인
  return OHAENG_SANGGEUK[otherOhaeng] === targetOhaeng;
}

/**
 * 타겟 오행과 같거나 생해주는 오행인지 확인 (아군 판단)
 */
export function isFriendToTarget(
  targetOhaeng: string,
  otherOhaeng: string
): boolean {
  // 같은 오행이거나 나를 생해주는 오행
  if (targetOhaeng === otherOhaeng) return true;

  // 생생 관계 확인
  return OHAENG_SAENGSAENG[otherOhaeng] === targetOhaeng;
}

/**
 * 특정 오행이 간여지동 보너스를 받는 위치들을 확인
 */
export function getGanyjidongPositions(
  targetOhaeng: string,
  pillars: Array<{ gan: string; ji: string }>
): number[] {
  const ganyjidongPositions: number[] = [];

  // GAN_OHENG, JI_OHENG를 import해서 사용해야 하지만,
  // 순환 참조를 피하기 위해 여기서는 직접 매핑 사용
  const GAN_TO_OHAENG: Record<string, string> = {
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

  const JI_TO_OHAENG: Record<string, string> = {
    子: "水",
    丑: "土",
    寅: "木",
    卯: "木",
    辰: "土",
    巳: "火",
    午: "火",
    未: "土",
    申: "金",
    酉: "金",
    戌: "土",
    亥: "水",
  };

  pillars.forEach((pillar, index) => {
    const ganOhaeng = GAN_TO_OHAENG[pillar.gan];
    const jiOhaeng = JI_TO_OHAENG[pillar.ji];

    // 천간과 지지가 모두 타겟 오행과 같으면 간여지동
    if (ganOhaeng === targetOhaeng && jiOhaeng === targetOhaeng) {
      ganyjidongPositions.push(index * 2); // 천간 위치
      ganyjidongPositions.push(index * 2 + 1); // 지지 위치
    }
  });

  return ganyjidongPositions;
}

/**
 * 특정 오행을 생해주는 오행들의 개수를 확인
 */
export function countSupportingOhaengs(
  targetOhaeng: string,
  ohaengCount: { counts: Record<string, number>; total: number }
): number {
  let supportCount = 0;

  // 생생 관계에서 타겟을 생해주는 오행들 찾기
  Object.entries(OHAENG_SAENGSAENG).forEach(
    ([supportingOhaeng, resultOhaeng]) => {
      if (
        resultOhaeng === targetOhaeng &&
        ohaengCount.counts[supportingOhaeng] > 0
      ) {
        supportCount += ohaengCount.counts[supportingOhaeng];
      }
    }
  );

  return supportCount;
}
