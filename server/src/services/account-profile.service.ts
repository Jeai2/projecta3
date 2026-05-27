import type {
  CalendarType,
  ConsultationPersonProfile,
  GenderForCalculation,
  SocialLoginProvider,
} from "../types/consultation";

export interface AccountProfileCandidateInput {
  provider: SocialLoginProvider;
  displayName?: string;
  birthDate?: string;
  calendarType?: CalendarType;
  isLeapMonth?: boolean;
  gender?: GenderForCalculation;
}

const PROVIDERS: SocialLoginProvider[] = ["kakao", "naver", "google"];
const DATE_PATTERN = /^((?:19|20)\d{2})-(\d{2})-(\d{2})$/;

function isValidBirthDate(date: string, calendarType?: CalendarType): boolean {
  const match = date.match(DATE_PATTERN);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year > new Date().getFullYear() || month < 1 || month > 12 || day < 1) return false;
  if (calendarType === "lunar") return day <= 30;

  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function createAccountProfileCandidate(
  input: AccountProfileCandidateInput,
): ConsultationPersonProfile {
  if (!PROVIDERS.includes(input.provider)) {
    throw new Error("지원하지 않는 로그인 공급자입니다.");
  }
  if (input.birthDate && !isValidBirthDate(input.birthDate, input.calendarType)) {
    throw new Error("생년월일 형식이 올바르지 않습니다.");
  }
  if (input.calendarType && !input.birthDate) {
    throw new Error("음양력 정보에는 생년월일이 필요합니다.");
  }
  if (input.isLeapMonth !== undefined && input.calendarType !== "lunar") {
    throw new Error("윤달 여부는 음력 생년월일에서만 저장할 수 있습니다.");
  }

  const displayName = input.displayName?.trim().slice(0, 40) || undefined;
  return {
    profileId: `account-${input.provider}`,
    kind: "self",
    relationToUser: "self",
    displayName,
    source: "social_login",
    socialLoginProvider: input.provider,
    birth: input.birthDate
      ? {
          date: input.birthDate,
          calendarType: input.calendarType,
          isLeapMonth: input.isLeapMonth,
        }
      : undefined,
    genderForCalculation: input.gender,
  };
}
