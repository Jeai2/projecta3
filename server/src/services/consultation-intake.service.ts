import { randomUUID } from "crypto";
import { matchCategories } from "../data/serious-keywords";
import type {
  BirthInformation,
  CalendarType,
  ConsultationIntakeStage,
  ConsultationPersonProfile,
  GenderForCalculation,
  RelationToUser,
} from "../types/consultation";
import {
  getConsultationContext,
  setConsultationIntake,
  setPendingReadingSubject,
  setReadingSubject,
  setRelationshipTarget,
} from "./session.service";
import { isLunarLeapDateAvailable } from "./birth-date.service";

export interface ConsultationIntakeResponse {
  reply: string;
  stage: ConsultationIntakeStage;
  profileReady: boolean;
}

interface SubjectInference {
  kind: "self" | "other";
  relationToUser: RelationToUser;
  displayName?: string;
  genderForCalculation?: GenderForCalculation;
  relationshipTarget?: ConsultationPersonProfile;
}

const READING_REQUEST_PATTERN =
  /점\s*(봐|보|칠|쳐)|운세|사주|궁합|인연|재회|연애운|취업운|이직운|결혼운|금전운|건강운|사업운|시험운/;
const SELF_PATTERN = /(^|\s)(나|나는|내|내가|저|저는|제|제가|본인)(\s|의|도|가|는|를|에게|$)/;
const SELF_CENTERED_PATTERN =
  /남자친구\s*생|여자친구\s*생|남친\s*생|여친\s*생|연애운|짝사랑|썸|재회|오늘의?\s*운세|내\s*운/;
const RELATIONSHIP_PATTERN =
  /(랑|이랑|와|과|하고|와의|과의|사이|관계|궁합|잘\s*될|결혼|헤어|재회|마음|좋아)/;
const RELATIONSHIP_DETAIL_PATTERN =
  /궁합|결혼|혼인|부부|관계|사이|잘\s*될|잘\s*맞|재회|헤어|이별|속마음|마음\s*(알|궁금)|인연/;
const OTHER_READING_PATTERN = /(운세|사주|점|건강|취업|이직|결혼|재물|사업|시험)/;
const SWITCH_CONFIRM_PATTERN = /^(응|네|예|그래|좋아|맞아|바꿔|그렇게|봐줘|응\s*그렇게)/;
const SWITCH_CANCEL_PATTERN = /^(아니|아냐|아니요|됐어|그대로|바꾸지\s*마|취소)/;

const TARGETS: Array<{
  pattern: RegExp;
  displayName: string;
  relationToUser: RelationToUser;
  genderForCalculation?: GenderForCalculation;
}> = [
  { pattern: /엄마|어머니/, displayName: "어머니", relationToUser: "family", genderForCalculation: "W" },
  { pattern: /아빠|아버지/, displayName: "아버지", relationToUser: "family", genderForCalculation: "M" },
  { pattern: /남자친구|남친|남편/, displayName: "남자친구", relationToUser: "partner", genderForCalculation: "M" },
  { pattern: /여자친구|여친|아내/, displayName: "여자친구", relationToUser: "partner", genderForCalculation: "W" },
  { pattern: /짝사랑\s*(상대|하는\s*사람)?|좋아하는\s*사람/, displayName: "그 사람", relationToUser: "crush" },
  { pattern: /친구/, displayName: "친구", relationToUser: "friend" },
  { pattern: /동료|직장\s*사람|회사\s*사람/, displayName: "동료", relationToUser: "colleague" },
  { pattern: /언니|누나|오빠|형|동생|아들|딸|부모님/, displayName: "가족분", relationToUser: "family" },
];

function looksLikeReadingRequest(message: string): boolean {
  return READING_REQUEST_PATTERN.test(message) || matchCategories(message).length > 0;
}

function createRelationshipTarget(target: (typeof TARGETS)[number]): ConsultationPersonProfile {
  return {
    profileId: `relationship-${randomUUID()}`,
    kind: "other",
    relationToUser: target.relationToUser,
    displayName: target.displayName,
    source: "conversation",
    genderForCalculation: target.genderForCalculation,
  };
}

function inferSubject(message: string): SubjectInference | null {
  const target = TARGETS.find(({ pattern }) => pattern.test(message));
  if (target) {
    const isRelationshipQuestion =
      target.relationToUser !== "family" &&
      RELATIONSHIP_PATTERN.test(message) &&
      !new RegExp(`${target.displayName}(?:의)?\\s*(운세|사주|점)`).test(message);

    if (isRelationshipQuestion) {
      return {
        kind: "self",
        relationToUser: "self",
        relationshipTarget: createRelationshipTarget(target),
      };
    }

    if (OTHER_READING_PATTERN.test(message)) {
      return {
        kind: "other",
        relationToUser: target.relationToUser,
        displayName: target.displayName,
        genderForCalculation: target.genderForCalculation,
      };
    }
  }

  if (SELF_PATTERN.test(message) || SELF_CENTERED_PATTERN.test(message)) {
    return {
      kind: "self",
      relationToUser: "self",
    };
  }

  return null;
}

function inferSubjectFromAnswer(message: string): SubjectInference | null {
  const selfReply = /^(내\s*(거|꺼)|제\s*(거|꺼)|나|저|본인|내\s*흐름|제\s*흐름)(요|를|으로|$)?/;
  if (selfReply.test(message.trim()) || SELF_PATTERN.test(message)) {
    return { kind: "self", relationToUser: "self" };
  }

  const target = TARGETS.find(({ pattern }) => pattern.test(message));
  if (!target) return null;
  return {
    kind: "other",
    relationToUser: target.relationToUser,
    displayName: target.displayName,
    genderForCalculation: target.genderForCalculation,
  };
}

function identifiesSameSubject(
  profile: ConsultationPersonProfile,
  inference: SubjectInference,
): boolean {
  if (profile.kind === "self" && inference.kind === "self") return true;
  return (
    profile.kind === inference.kind &&
    profile.relationToUser === inference.relationToUser &&
    (profile.displayName ?? "") === (inference.displayName ?? "")
  );
}

function findKnownSubject(
  profiles: ConsultationPersonProfile[],
  inference: SubjectInference,
): ConsultationPersonProfile | undefined {
  return profiles.find((profile) => identifiesSameSubject(profile, inference));
}

function identifiesSamePerson(
  first: ConsultationPersonProfile | null,
  second: ConsultationPersonProfile | null,
): boolean {
  if (!first || !second) return false;
  if (first.kind === "self" && second.kind === "self") return true;
  return (
    first.kind === second.kind &&
    first.relationToUser === second.relationToUser &&
    (first.displayName ?? "") === (second.displayName ?? "")
  );
}

function mergeRelationshipTarget(
  current: ConsultationPersonProfile | null | undefined,
  next: ConsultationPersonProfile,
): ConsultationPersonProfile {
  if (!identifiesSamePerson(current ?? null, next)) return next;
  return {
    ...current!,
    genderForCalculation: current!.genderForCalculation ?? next.genderForCalculation,
  };
}

function hasCalculationBirth(profile: ConsultationPersonProfile): boolean {
  return (
    !!profile.birth?.date &&
    !!profile.birth.calendarType &&
    !!profile.genderForCalculation
  );
}

function extractCalendarType(message: string): CalendarType | undefined {
  if (/음\s*력|윤달/.test(message)) return "lunar";
  if (/양\s*력/.test(message)) return "solar";
  return undefined;
}

function isValidDateParts(year: number, month: number, day: number, calendarType?: CalendarType): boolean {
  if (year < 1900 || year > new Date().getFullYear() || month < 1 || month > 12 || day < 1) {
    return false;
  }
  if (calendarType === "lunar") return day <= 30;
  if (day > 31) return false;
  if (!calendarType) return true;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function extractBirthInformation(message: string, current?: BirthInformation): BirthInformation | undefined {
  const birth = current ? { ...current } : {};
  const calendarType = extractCalendarType(message);
  if (calendarType) birth.calendarType = calendarType;

  if (/윤달\s*(아니|아님)|평달/.test(message)) {
    birth.isLeapMonth = false;
  } else if (/윤달/.test(message)) {
    birth.isLeapMonth = true;
    birth.calendarType = "lunar";
  }

  const match = message.match(/((?:19|20)\d{2})\s*(?:년|[./-])\s*(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})\s*(?:일)?/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isValidDateParts(year, month, day, birth.calendarType)) {
      birth.date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return Object.keys(birth).length > 0 ? birth : undefined;
}

function extractGender(message: string, awaitingGender: boolean): GenderForCalculation | undefined {
  if (/(여자|여성)(분)?\s*(이에요|예요|입니다|이고|이야|임)|성별(?:은|이)?\s*(여자|여성)/.test(message)) {
    return "W";
  }
  if (/(남자|남성)(분)?\s*(이에요|예요|입니다|이고|이야|임)|성별(?:은|이)?\s*(남자|남성)/.test(message)) {
    return "M";
  }
  if (awaitingGender && /^\s*(여자|여성|여)\s*(요|입니다)?\s*$/.test(message)) return "W";
  if (awaitingGender && /^\s*(남자|남성|남)\s*(요|입니다)?\s*$/.test(message)) return "M";
  return undefined;
}

function subjectLabel(profile: ConsultationPersonProfile): string {
  return profile.kind === "self" ? "네" : `${profile.displayName ?? "그분"}의`;
}

function birthPrompt(profile: ConsultationPersonProfile): string {
  return `${subjectLabel(profile)} 생년월일을 알려줘요. 음력이면 '음력 1998년 3월 2일', 양력이면 '양력 1998년 3월 2일'처럼 말해 주세요. 윤달이라면 그것도 함께 알려줘요.`;
}

function calendarPrompt(profile: ConsultationPersonProfile): string {
  return `${subjectLabel(profile)} 생일은 음력인가요, 양력인가요? 음력 윤달이라면 윤달이라고 함께 말해줘요.`;
}

function leapMonthPrompt(profile: ConsultationPersonProfile): string {
  return `${subjectLabel(profile)} 음력 생일은 평달인가요, 윤달인가요? 그 해에는 같은 달이 두 번 있어 확인이 필요해요.`;
}

function koreanDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function genderPrompt(profile: ConsultationPersonProfile): string {
  return `마지막으로 ${profile.kind === "self" ? "본인은" : `${profile.displayName ?? "그분"}은`} 풀이 기준으로 남자분인가요, 여자분인가요?`;
}

function relationshipBirthPrompt(profile: ConsultationPersonProfile): string {
  return `${profile.displayName ?? "상대방"}의 생년월일도 알려줘요. 양력이면 '양력 1998년 3월 2일', 음력이면 '음력 1998년 3월 2일'처럼 말해 주세요. 윤달이라면 그것도 함께 알려줘요.`;
}

function relationshipCalendarPrompt(profile: ConsultationPersonProfile): string {
  return `${profile.displayName ?? "상대방"}의 생일은 음력인가요, 양력인가요? 음력 윤달이라면 윤달이라고 함께 말해줘요.`;
}

function relationshipLeapMonthPrompt(profile: ConsultationPersonProfile): string {
  return `${profile.displayName ?? "상대방"}의 음력 생일은 평달인가요, 윤달인가요? 그 해에는 같은 달이 두 번 있어 확인이 필요해요.`;
}

function relationshipGenderPrompt(profile: ConsultationPersonProfile): string {
  return `${profile.displayName ?? "상대방"}은 풀이 기준으로 남자분인가요, 여자분인가요?`;
}

function readyReply(profile: ConsultationPersonProfile): string {
  const calendarLabel = profile.birth?.calendarType === "lunar" ? "음력" : "양력";
  const leapLabel = profile.birth?.isLeapMonth ? " 윤달" : "";
  const genderLabel = profile.genderForCalculation === "M" ? "남자분" : "여자분";
  return `알겠어요. ${subjectLabel(profile)} ${calendarLabel}${leapLabel} ${profile.birth?.date} 생일과 ${genderLabel} 기준으로 받아둘게요. 이제 보고 싶은 흐름을 이어서 말해줘요.`;
}

function switchPrompt(
  current: ConsultationPersonProfile,
  next: ConsultationPersonProfile,
): string {
  return `지금은 ${subjectLabel(current)} 흐름을 보고 있어요. 이번에는 ${subjectLabel(next)} 흐름으로 바꿔 볼까요?`;
}

async function promptForMissingProfile(
  userId: string,
  profile: ConsultationPersonProfile,
  initialQuestion?: string,
): Promise<ConsultationIntakeResponse> {
  if (!profile.birth?.date) {
    setConsultationIntake(userId, "awaiting_birth", initialQuestion);
    return { reply: birthPrompt(profile), stage: "awaiting_birth", profileReady: false };
  }
  if (!profile.birth.calendarType) {
    setConsultationIntake(userId, "awaiting_calendar", initialQuestion);
    return { reply: calendarPrompt(profile), stage: "awaiting_calendar", profileReady: false };
  }
  if (profile.birth.calendarType === "lunar") {
    const leapDateAvailable = await isLunarLeapDateAvailable(profile.birth.date);
    if (profile.birth.isLeapMonth === true && !leapDateAvailable) {
      const dateLabel = koreanDateLabel(profile.birth.date);
      const correctedProfile: ConsultationPersonProfile = {
        ...profile,
        birth: {
          calendarType: "lunar",
        },
      };
      setReadingSubject(userId, correctedProfile);
      setConsultationIntake(userId, "awaiting_birth", initialQuestion);
      return {
        reply: `음력 ${dateLabel}에는 윤달이 없어요. 평달 생일이라면 '음력 평달 ${dateLabel}'이라고, 아니면 정확한 날짜를 다시 알려줘요.`,
        stage: "awaiting_birth",
        profileReady: false,
      };
    }
    if (profile.birth.isLeapMonth === undefined) {
      if (leapDateAvailable) {
        setConsultationIntake(userId, "awaiting_leap_month", initialQuestion);
        return { reply: leapMonthPrompt(profile), stage: "awaiting_leap_month", profileReady: false };
      }

      profile = {
        ...profile,
        birth: {
          ...profile.birth,
          isLeapMonth: false,
        },
      };
      setReadingSubject(userId, profile);
    }
  }
  if (!profile.genderForCalculation) {
    setConsultationIntake(userId, "awaiting_gender", initialQuestion);
    return { reply: genderPrompt(profile), stage: "awaiting_gender", profileReady: false };
  }

  setConsultationIntake(userId, "ready", initialQuestion);
  return { reply: readyReply(profile), stage: "ready", profileReady: true };
}

async function promptForMissingRelationshipTarget(
  userId: string,
  profile: ConsultationPersonProfile,
  initialQuestion?: string,
): Promise<ConsultationIntakeResponse> {
  if (!profile.birth?.date) {
    setConsultationIntake(userId, "awaiting_relationship_birth", initialQuestion);
    return { reply: relationshipBirthPrompt(profile), stage: "awaiting_relationship_birth", profileReady: false };
  }
  if (!profile.birth.calendarType) {
    setConsultationIntake(userId, "awaiting_relationship_calendar", initialQuestion);
    return { reply: relationshipCalendarPrompt(profile), stage: "awaiting_relationship_calendar", profileReady: false };
  }
  if (profile.birth.calendarType === "lunar") {
    const leapDateAvailable = await isLunarLeapDateAvailable(profile.birth.date);
    if (profile.birth.isLeapMonth === true && !leapDateAvailable) {
      const dateLabel = koreanDateLabel(profile.birth.date);
      const correctedProfile: ConsultationPersonProfile = {
        ...profile,
        birth: { calendarType: "lunar" },
      };
      setRelationshipTarget(userId, correctedProfile);
      setConsultationIntake(userId, "awaiting_relationship_birth", initialQuestion);
      return {
        reply: `음력 ${dateLabel}에는 윤달이 없어요. ${profile.displayName ?? "상대방"}의 생일이 평달이면 '음력 평달 ${dateLabel}'이라고, 아니면 정확한 날짜를 다시 알려줘요.`,
        stage: "awaiting_relationship_birth",
        profileReady: false,
      };
    }
    if (profile.birth.isLeapMonth === undefined) {
      if (leapDateAvailable) {
        setConsultationIntake(userId, "awaiting_relationship_leap_month", initialQuestion);
        return {
          reply: relationshipLeapMonthPrompt(profile),
          stage: "awaiting_relationship_leap_month",
          profileReady: false,
        };
      }
      profile = {
        ...profile,
        birth: { ...profile.birth, isLeapMonth: false },
      };
      setRelationshipTarget(userId, profile);
    }
  }
  if (!profile.genderForCalculation) {
    setConsultationIntake(userId, "awaiting_relationship_gender", initialQuestion);
    return {
      reply: relationshipGenderPrompt(profile),
      stage: "awaiting_relationship_gender",
      profileReady: false,
    };
  }

  setRelationshipTarget(userId, profile);
  setConsultationIntake(userId, "ready", initialQuestion);
  return {
    reply: `알겠어요. ${profile.displayName ?? "상대방"}의 기준도 받아뒀어요. 이제 두 사람 사이에서 가장 궁금한 것을 말해줘요.`,
    stage: "ready",
    profileReady: true,
  };
}

async function continueRequestedRelationshipCollection(
  userId: string,
  response: ConsultationIntakeResponse,
  initialQuestion?: string,
): Promise<ConsultationIntakeResponse> {
  if (!response.profileReady || !initialQuestion || !RELATIONSHIP_DETAIL_PATTERN.test(initialQuestion)) {
    return response;
  }
  const context = getConsultationContext(userId);
  const target = context?.relationshipTarget;
  if (!target || hasCalculationBirth(target)) return response;
  return await promptForMissingRelationshipTarget(userId, target, initialQuestion);
}

function buildProfile(
  inference: SubjectInference,
  message: string,
  candidate?: ConsultationPersonProfile | null,
): ConsultationPersonProfile {
  const base: ConsultationPersonProfile =
    candidate
      ? {
          ...candidate,
          kind: inference.kind,
          relationToUser: inference.relationToUser,
          displayName: inference.displayName ?? candidate.displayName,
        }
      : {
          profileId: `subject-${randomUUID()}`,
          kind: inference.kind,
          relationToUser: inference.relationToUser,
          displayName: inference.displayName,
          source: "conversation" as const,
          genderForCalculation: inference.genderForCalculation,
        };

  return {
    ...base,
    birth: extractBirthInformation(message, base.birth),
    genderForCalculation:
      extractGender(message, false) ?? base.genderForCalculation,
  };
}

export async function handleConsultationIntake(
  userId: string,
  message: string,
): Promise<ConsultationIntakeResponse | null> {
  const context = getConsultationContext(userId);
  const stage = context?.intake.stage ?? "idle";

  if (stage === "ready") {
    if (!looksLikeReadingRequest(message) || !context?.readingSubject) return null;

    const inference = inferSubject(message);
    if (!inference) return null;
    if (inference.relationshipTarget) {
      const relationshipTarget = mergeRelationshipTarget(
        context.relationshipTarget,
        inference.relationshipTarget,
      );
      setRelationshipTarget(userId, relationshipTarget);
      if (RELATIONSHIP_DETAIL_PATTERN.test(message) && !hasCalculationBirth(relationshipTarget)) {
        return await promptForMissingRelationshipTarget(userId, relationshipTarget, message);
      }
    }
    if (identifiesSameSubject(context.readingSubject, inference)) return null;

    const knownSubject =
      findKnownSubject(context.knownSubjects, inference) ??
      (context.relationshipTarget && identifiesSameSubject(context.relationshipTarget, inference)
        ? context.relationshipTarget
        : undefined);
    const candidate =
      knownSubject ?? (inference.kind === "self" ? context.accountProfileCandidate : undefined);
    const pendingProfile = buildProfile(inference, message, candidate);
    setPendingReadingSubject(userId, pendingProfile);
    setConsultationIntake(userId, "awaiting_subject_switch", message);
    return {
      reply: switchPrompt(context.readingSubject, pendingProfile),
      stage: "awaiting_subject_switch",
      profileReady: false,
    };
  }

  if (stage === "awaiting_subject_switch") {
    const pendingProfile = context?.pendingReadingSubject;
    if (!pendingProfile) {
      setConsultationIntake(userId, "ready");
      return null;
    }
    if (SWITCH_CANCEL_PATTERN.test(message.trim())) {
      setPendingReadingSubject(userId, null);
      setConsultationIntake(userId, "ready");
      return {
        reply: "알겠어요. 보고 있던 흐름을 그대로 이어갈게요. 무엇이 더 궁금해요?",
        stage: "ready",
        profileReady: true,
      };
    }
    if (!SWITCH_CONFIRM_PATTERN.test(message.trim())) {
      return {
        reply: `${subjectLabel(pendingProfile)} 흐름으로 바꿔 볼지 '네' 또는 '아니요'로 알려줘요.`,
        stage,
        profileReady: false,
      };
    }

    setPendingReadingSubject(userId, null);
    setReadingSubject(userId, pendingProfile);
    return await promptForMissingProfile(userId, pendingProfile, context?.intake.initialQuestion);
  }

  if (stage === "idle") {
    if (!looksLikeReadingRequest(message)) return null;

    const inference = inferSubject(message);
    if (!inference) {
      setConsultationIntake(userId, "awaiting_subject", message);
      return {
        reply: "네 흐름을 볼까요, 아니면 대신 봐드릴 분의 흐름을 볼까요?",
        stage: "awaiting_subject",
        profileReady: false,
      };
    }

    if (inference.relationshipTarget) {
      setRelationshipTarget(
        userId,
        mergeRelationshipTarget(context?.relationshipTarget, inference.relationshipTarget),
      );
    }

    const profile = buildProfile(
      inference,
      message,
      inference.kind === "self" ? context?.accountProfileCandidate : undefined,
    );
    setReadingSubject(userId, profile);
    const response = await promptForMissingProfile(userId, profile, message);
    return await continueRequestedRelationshipCollection(userId, response, message);
  }

  if (stage === "awaiting_subject") {
    const inference = inferSubjectFromAnswer(message);
    if (!inference) {
      return {
        reply: "본인의 흐름이면 '내 점'이라고, 다른 분이면 '엄마'나 '친구'처럼 누구인지 말해줘요.",
        stage,
        profileReady: false,
      };
    }

    const knownSubject = findKnownSubject(context?.knownSubjects ?? [], inference);
    const candidate =
      knownSubject ?? (inference.kind === "self" ? context?.accountProfileCandidate : undefined);
    const profile = buildProfile(inference, message, candidate);
    setReadingSubject(userId, profile);
    const response = await promptForMissingProfile(userId, profile, context?.intake.initialQuestion);
    return await continueRequestedRelationshipCollection(userId, response, context?.intake.initialQuestion);
  }

  if (
    stage === "awaiting_relationship_birth" ||
    stage === "awaiting_relationship_calendar" ||
    stage === "awaiting_relationship_leap_month" ||
    stage === "awaiting_relationship_gender"
  ) {
    const currentTarget = context?.relationshipTarget;
    if (!currentTarget) {
      setConsultationIntake(userId, "ready");
      return {
        reply: "함께 볼 상대가 누군지 다시 말해줘요.",
        stage: "ready",
        profileReady: true,
      };
    }
    const updatedTarget: ConsultationPersonProfile = {
      ...currentTarget,
      birth: extractBirthInformation(message, currentTarget.birth),
      genderForCalculation:
        extractGender(message, stage === "awaiting_relationship_gender") ??
        currentTarget.genderForCalculation,
    };
    setRelationshipTarget(userId, updatedTarget);
    return await promptForMissingRelationshipTarget(userId, updatedTarget, context?.intake.initialQuestion);
  }

  const currentProfile = context?.readingSubject;
  if (!currentProfile) {
    setConsultationIntake(userId, "awaiting_subject");
    return {
      reply: "누구의 흐름을 볼지 먼저 알려줘요. 네 점인지, 대신 보고 싶은 분의 점인지 궁금해요.",
      stage: "awaiting_subject",
      profileReady: false,
    };
  }

  const updatedProfile: ConsultationPersonProfile = {
    ...currentProfile,
    birth: extractBirthInformation(message, currentProfile.birth),
    genderForCalculation:
      extractGender(message, stage === "awaiting_gender") ?? currentProfile.genderForCalculation,
  };
  setReadingSubject(userId, updatedProfile);
  const response = await promptForMissingProfile(userId, updatedProfile, context?.intake.initialQuestion);
  return await continueRequestedRelationshipCollection(userId, response, context?.intake.initialQuestion);
}
