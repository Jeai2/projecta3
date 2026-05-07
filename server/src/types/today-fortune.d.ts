// src/types/today-fortune.d.ts
// 오늘의 운세(일진 기반) 전용 타입 정의

export interface IljinData {
  date: string; // YYYY-MM-DD 형식
  ganji: string; // 일진 간지 (예: "甲子")
  gan: string; // 천간
  ji: string; // 지지
  ohaeng: {
    gan: "木" | "火" | "土" | "金" | "水"; // 천간 오행
    ji: "木" | "火" | "土" | "金" | "水"; // 지지 오행
  };
  direction: "東" | "西" | "南" | "北" | "中央"; // 방향
  color: string; // 길한 색상
  number: string; // 길한 숫자
  time: {
    good: string[]; // 좋은 시간대
    bad: string[]; // 피해야 할 시간대
  };
}

export type FortuneGrade = "대길" | "길" | "평" | "흉" | "대흉";

export type TenGodType =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export type YongsinRole = "용신" | "희신" | "한신" | "기신" | "구신";

export interface AlignmentElementDetail {
  value: string;
  element?: string;
  role: YongsinRole;
  score: number;
}

export interface RelationshipDetail {
  type: string;
  target: string;
  score: number;
}

export interface FortuneAlignmentDetail {
  label: "대운" | "세운" | "월운" | "일운";
  ganji: string | null;
  alignmentScore: number;
  relationshipScore: number;
  totalScore: number;
  gan: AlignmentElementDetail;
  ji: AlignmentElementDetail;
  relationship?: RelationshipDetail;
  ganRelationship?: RelationshipDetail;
}

export interface FortuneScoreMeta {
  finalScore: number;
  grade: FortuneGrade;
  breakdown: {
    daewoon: FortuneAlignmentDetail | null;
    sewoon: FortuneAlignmentDetail | null;
    wolwoon: FortuneAlignmentDetail | null;
    iljin: FortuneAlignmentDetail | null;
  };
  collapse?: {
    wolwoon: { score: number; element: string | null };
    iljin: { score: number; element: string | null };
    mainElement: string | null;
    slots: Array<{
      branch: string;
      element: string;
      value: number;
      match: number;
      base: number;
      bonus: number;
      range: string;
    }>;
    topBranches: string[];
  };
  entanglement?: {
    mainElement: string | null;
    externalElement: string | null;
    mainStrength: number;
    connectionStrength: number;
    resonanceStrength: number;
    components: Array<{
      type: string;
      label: string;
      ganji: string | null;
      branch: string | null;
      element: string | null;
      weight: number;
      match: number;
      event: number;
      score: number;
      range?: string;
    }>;
  };
}

export interface IljinFortune {
  summary: string; // 일진 요약
  general: string; // 일반적인 운세
  work: string; // 업무/사업 운세
  love: string; // 연애/인간관계 운세
  health: string; // 건강 운세
  money: string; // 재물 운세
  relations: string; // 인간관계 운세
  documents: string; // 문서/계약 운세
  advice: string; // 오늘의 조언
  lucky: {
    direction: string; // 길한 방향
    color: string; // 길한 색상
    number: string; // 길한 숫자
    time: string; // 길한 시간대
  };
  avoid: {
    direction: string; // 피해야 할 방향
    color: string; // 피해야 할 색상
    time: string; // 피해야 할 시간대
  };
  grade?: FortuneGrade;
  scoreMeta?: FortuneScoreMeta;
  tenGodKey?: TenGodType | null;
}

export interface LukimComponent {
  type: "birthYearGan" | "birthYearJi" | "dayGan" | "hourJi";
  label: string;
  symbol: string;
  value: number;
}

export interface LukimFortune {
  name: string;
  value: number;
  summary: string;
  components: LukimComponent[];
}

export interface IchingLucky {
  direction: string;
  color: string;
  number: string;
  time: string;
}

export interface IchingAvoid {
  direction: string;
  color: string;
  time: string;
}

export interface IchingResult {
  hexagramKey: string;
  tone: "positive" | "neutral" | "negative";
  todaySummary?: string;
  details: {
    money?: string;
    love?: string;
    work?: string;
    relations?: string;
    health?: string;
    documents?: string;
  };
  lucky?: IchingLucky;
  avoid?: IchingAvoid;
}

export interface TodayFortuneResponse {
  userInfo: {
    name?: string;
    birthDate: string;
    gender: "M" | "W";
    calendarType: "solar" | "lunar";
    birthTime?: string;
    timeUnknown?: boolean;
  };
  iljin: IljinData;
  fortune: IljinFortune;
  sipsinOfToday?: {
    dayGan: string; // 사용자 일간
    gan?: string | null; // 일진 천간의 십성
    ji?: string | null; // 일진 지지의 십성
  };
  compatibility?: {
    ganCompatibility: number;
    jiCompatibility: number;
    harmonyBonus: number;
    daewoonSupport: number;
    totalScore: number;
    analysis: {
      ganRelation: string;
      jiRelation: string;
      specialHarmony: Array<{
        type: string;
        base: string;
        target: string;
        context: string;
        description?: string;
        label?: string;
      }>;
      daewoonEffect: string;
    };
  };
  lukim?: LukimFortune | null;
  iching?: IchingResult;
  generatedAt: string; // 생성 시간
  fortuneScore?: FortuneScoreMeta;
}
