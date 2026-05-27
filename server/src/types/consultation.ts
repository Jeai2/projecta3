export type CalendarType = "solar" | "lunar";
export type GenderForCalculation = "M" | "W";
export type PersonProfileSource = "social_login" | "conversation" | "manual";
export type SocialLoginProvider = "kakao" | "naver" | "google";
export type ReadingSubjectKind = "self" | "other";
export type RelationToUser =
  | "self"
  | "partner"
  | "crush"
  | "family"
  | "friend"
  | "colleague"
  | "other";
export type ConsultationIntakeStage =
  | "idle"
  | "awaiting_subject"
  | "awaiting_birth"
  | "awaiting_calendar"
  | "awaiting_leap_month"
  | "awaiting_gender"
  | "awaiting_subject_switch"
  | "awaiting_relationship_birth"
  | "awaiting_relationship_calendar"
  | "awaiting_relationship_leap_month"
  | "awaiting_relationship_gender"
  | "ready";

export interface BirthInformation {
  /** 사용자가 제공한 YYYY-MM-DD 날짜. calendarType과 함께 해석한다. */
  date?: string;
  calendarType?: CalendarType;
  /** 음력 입력에서 윤달 여부가 확인된 경우에만 저장한다. */
  isLeapMonth?: boolean;
  /** 더 깊은 풀이에서 제공된 경우에만 저장한다. 단시점에는 필수가 아니다. */
  time?: string;
}

export interface IpchunBirthYearPillar {
  basis: "ipchun";
  gan: string;
  ji: string;
  /** 음력 입력인 경우 변환 결과를 포함한 계산 기준 양력일. */
  solarBirthDate: string;
}

export interface ConsultationPersonProfile {
  /** 현재 상담 안에서 동일 인물을 구분하는 내부 식별자. */
  profileId: string;
  kind: ReadingSubjectKind;
  relationToUser: RelationToUser;
  displayName?: string;
  source: PersonProfileSource;
  socialLoginProvider?: SocialLoginProvider;
  birth?: BirthInformation;
  genderForCalculation?: GenderForCalculation;
  /** 기존 사주 엔진으로 계산된 뒤 저장되는 입춘 기준 출생 연주. */
  birthYearPillar?: IpchunBirthYearPillar;
}

export interface ConsultationContext {
  /** 로그인에서 얻은 본인 정보. 사용자가 본인 점사를 선택하기 전까지는 계산 대상이 아니다. */
  accountProfileCandidate: ConsultationPersonProfile | null;
  /** 현재 단시점과 정단의 기준이 되는 사람. */
  readingSubject: ConsultationPersonProfile | null;
  /** 같은 상담 안에서 이미 확인한 인물들. 대상 전환 시 출생정보를 재사용한다. */
  knownSubjects: ConsultationPersonProfile[];
  /** 현재 대상과 다른 인물의 점사 요청이 감지된 뒤, 사용자 확인을 기다리는 후보. */
  pendingReadingSubject: ConsultationPersonProfile | null;
  /** 관계 상담에서 함께 언급되는 상대. 필요해질 때만 별도 출생 정보를 받는다. */
  relationshipTarget: ConsultationPersonProfile | null;
  /** 실제 점사를 시작하기 전, 채팅으로 필요한 정보를 모으는 진행 상태. */
  intake: {
    stage: ConsultationIntakeStage;
    initialQuestion?: string;
  };
}

export function createEmptyConsultationContext(): ConsultationContext {
  return {
    accountProfileCandidate: null,
    readingSubject: null,
    knownSubjects: [],
    pendingReadingSubject: null,
    relationshipTarget: null,
    intake: {
      stage: "idle",
    },
  };
}
