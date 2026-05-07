// server/src/types/saju.d.ts (신규 생성)

import type { NapeumResult } from "../hwa-eui/data/hwa-eui.data";
import type { Daewoon } from "../services/daewoon.service";
import type { SewoonData } from "../services/sewoon.service";

// --- 데이터 타입 정의 ---
export interface PillarData {
  gan: string;
  ji: string;
  ganOhaeng: string;
  jiOhaeng: string;
  ganSipsin: string | null;
  jiSipsin: string | null;
  sibiwunseong: string;
  /** 십이운성 거법(去法): 해당 기둥의 천간→지지 매칭 */
  sibiwunseongGeopbeop?: string;
  sinsal: SinsalHit[];
}

export interface StarElement {
  pillar: "year" | "month" | "day" | "hour" | "daewoon" | "sewoon";
  type: "gan" | "ji";
  character: string;
}

export interface SinsalHit {
  name: string;
  elements: StarElement[];
}

// 지지 간 관계 타입 정의
export interface RelationshipResult {
  cheonganhap: string[]; // 천간합 관계
  cheonganchung: string[]; // 천간충 관계
  cheonganhapTypes?: ("합" | "합반" | "합거")[]; // 천간합 종류 (대운 전용)
  yukhap: string[]; // 육합 관계
  samhap: string[]; // 삼합 관계
  amhap: string[]; // 암합 관계
  banghap: string[]; // 방합 관계
  yukchung: string[]; // 육충 관계
  yukhyung: string[]; // 육형 관계
  yukpa: string[]; // 육파 관계
  yukae: string[]; // 육해 관계
}

export interface RelationshipDetail {
  type: string; // 관계 유형 (yukhap, samhap, etc.)
  ji1: string; // 첫 번째 지지
  ji2: string; // 두 번째 지지
  pillar1: string; // 첫 번째 기둥 (year, month, day, hour)
  pillar2: string; // 두 번째 기둥
}

export interface StarData {
  name: string;
  type: "길신" | "흉살";
  description: string;
  details: string;
  elements: StarElement[];
  illustration: string;
}

export interface SajuData {
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData;
  };
  sipsin: {
    year: { gan: string | null; ji: string | null };
    month: { gan: string | null; ji: string | null };
    day: { gan: string | null; ji: string | null };
    hour: { gan: string | null; ji: string | null };
  };
  sibiwunseong: { year: string; month: string; day: string; hour: string };
  /** 십이운성 거법(去法) */
  sibiwunseongGeopbeop?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  sinsal: import("../services/sinsal.service").SinsalResult; // ✅ sinsal.service의 결과 타입을 직접 사용
  napeum: NapeumResult;
  jijanggan: { year: string[]; month: string[]; day: string[]; hour: string[] }; // ✅ 지장간 데이터 추가
  relationships?: RelationshipResult; // ✅ 지지 간 관계 데이터 추가 (선택적)
  wangseStrength?: import("../services/wangse-strength.service").WangseResult; // ✅ 왕쇠강약 분석 추가 (선택적)
  dangnyeong?: import("../services/dangnyeong.service").DangnyeongResult; // ✅ 당령 분석 추가 (선택적)
  saryeong?: import("../services/saryeong.service").SaryeongResult; // ✅ 사령 분석 추가 (선택적)
  jinsin?: import("../services/jinsin.service").JinsinResult; // ✅ 진신 분석 추가 (선택적)
  gyeokguk?: import("../services/gyeokguk.service").GyeokgukAnalysis; // ✅ 격국 분석 추가 (선택적)
  yongsin?: import("../data/yongsin.data").YongsinResult; // ✅ 용희기구한 분석 추가 (선택적)
  sipsinV2Interpretation?: import("../services/sipsin-v2-interpretation.service").SipsinV2Interpretation; // ✅ SipsinV2 전용 해설
  currentDaewoonRelationships?: RelationshipResult; // ✅ 현재 대운-원국 관계
  currentDaewoonInterp?: import("../services/sipsin-v2-interpretation.service").DaewoonRelInterp; // ✅ 현재 대운 관계 해설
  currentSewoonRelationships?: RelationshipResult; // ✅ 현재 세운-원국+대운 관계
  currentSewoonInterp?: import("../services/sipsin-v2-interpretation.service").DaewoonRelInterp; // ✅ 현재 세운 관계 해설
  sewoonForCurrentDaewoon?: SewoonData[]; // ✅ 현재 대운 기간 10년 세운 목록
  currentDaewoon: Daewoon | null;
  currentSewoon: SewoonData;
  daewoonFull: Daewoon[];
  currentWoolwoon: import("../services/woolwoon.service").WoolwoonData[];
  nextYearWoolwoon: import("../services/woolwoon.service").WoolwoonData[];
}

export interface DayPillarContent {
  title: string;
  symbol: string;
  keywords: string[];
  personality: {
    summary: string;
    strengths: string;
    weaknesses: string;
  };
  lifeTheme: {
    wealth: string;
    love: string;
    spouse: string;
    health: string;
    career: string;
  };
  advice: string;
}

export interface DayPillarInterpretation {
  title: string; // 예: "갑자(甲子) 일주"
  imageUrl: string; // 일주를 상징하는 이미지 URL
  summary: string; // 일주에 대한 한 줄 요약
  detailedAnalysis: {
    dayGan: string; // 일간(甲)의 특징 요약
    dayJi: string; // 일지(子)의 특징 요약
    interaction: string; // 일간과 일지의 관계(십신, 십이운성 등)로 본 핵심 해석
  };
  advice: string; // 해당 일주를 위한 조언
}

/** 일주론(ilju.data)에서 뽑아 종합사주 일간 해석(요약/자세한 해석)에 쓰는 문구 */
export interface IljuDayMasterTexts {
  summary: string;
  detail: string;
  iljuSummary: string;
}

// --- 해석 결과 타입 정의 ---
export interface InterpretationResult {
  dayMasterNature: { base: string; custom: string | null };
  /** 있으면 DayMasterV2에서 요약/자세한 해석에 우선 사용 (ilju.data.ts 기반) */
  iljuDayMaster?: IljuDayMasterTexts | null;
  dayMasterCharacter: string;
  sipsinAnalysis: string;
  sibiwunseongAnalysis: string;
  combinationAnalysis: string[];
  hwaEuiPrompt: string;
  sinsalAnalysis: StarData[];
  gilsinAnalysis: StarData[];
  dayPillar?: DayPillarContent;
}

// --- 최종 결과물 타입 정의 ---
export interface FortuneResult {
  sajuData: SajuData;
  interpretation: InterpretationResult;
}
