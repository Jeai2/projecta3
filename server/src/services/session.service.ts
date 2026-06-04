/**
 * 세션 관리 서비스
 * - 턴 수 추적 → 육임단시점 / 육임정단 무기 전환
 * - 30분 무입력 → 넛지 알림 → 30분 추가 무응답 → 리셋
 */

import {
  createEmptyConsultationContext,
  type ConsultationContext,
  type ConsultationIntakeStage,
  type ConsultationPersonProfile,
} from "../types/consultation";

const NUDGE_TIMEOUT_MS = 30 * 60 * 1000; // 30분
const MAX_CONVERSATION_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 2000;

export type SessionState = "active" | "nudged" | "waiting";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export type DefenseIncidentType = "vague" | "laugh" | "test" | "attack" | "unsafe" | "return_intent";

export interface DefenseStatus {
  count: number;
  locked: boolean;
  lastIncidentType: DefenseIncidentType | null;
  updatedAt: number | null;
}

interface Session {
  turnCount: number;
  state: SessionState;
  lastActivityAt: number;
  nudgeTimer: NodeJS.Timeout | null;
  resetTimer: NodeJS.Timeout | null;
  pendingNudge: boolean;
  previousCategories: string[];
  currentJeomsi: string | null; // 다이스로 결정된 현재 시진 (null = 실시간 사용)
  currentDansiInterpretationId: number | null;
  defense: DefenseStatus;
  consultation: ConsultationContext;
  messages: ConversationMessage[];
}

export interface PersistedSessionSnapshot {
  turnCount: number;
  state: SessionState;
  lastActivityAt: number;
  pendingNudge: boolean;
  previousCategories: string[];
  currentJeomsi: string | null;
  currentDansiInterpretationId: number | null;
  defense?: DefenseStatus;
  consultation: ConsultationContext;
  messages: ConversationMessage[];
}

const sessions = new Map<string, Session>();

function createSession(): Session {
  return {
    turnCount: 0,
    state: "active",
    lastActivityAt: Date.now(),
    nudgeTimer: null,
    resetTimer: null,
    pendingNudge: false,
    previousCategories: [],
    currentJeomsi: null,
    currentDansiInterpretationId: null,
    defense: {
      count: 0,
      locked: false,
      lastIncidentType: null,
      updatedAt: null,
    },
    consultation: createEmptyConsultationContext(),
    messages: [],
  };
}

function clearTimers(session: Session): void {
  if (session.nudgeTimer) clearTimeout(session.nudgeTimer);
  if (session.resetTimer) clearTimeout(session.resetTimer);
  session.nudgeTimer = null;
  session.resetTimer = null;
}

function startNudgeTimer(userId: string, session: Session): void {
  clearTimers(session);
  session.nudgeTimer = setTimeout(() => {
    session.state = "nudged";
    session.pendingNudge = true;

    session.resetTimer = setTimeout(() => {
      resetSession(userId);
    }, NUDGE_TIMEOUT_MS);
  }, NUDGE_TIMEOUT_MS);
}

function resetSession(userId: string): void {
  const session = sessions.get(userId);
  if (session) clearTimers(session);
  sessions.delete(userId);
}

export function recordTurn(userId: string): { turnCount: number; useDansi: boolean; useJeongdan: boolean } {
  let session = sessions.get(userId);
  if (!session) {
    session = createSession();
    sessions.set(userId, session);
  }

  session.turnCount += 1;
  session.lastActivityAt = Date.now();
  session.state = "active";
  session.pendingNudge = false;

  startNudgeTimer(userId, session);

  return {
    turnCount: session.turnCount,
    useDansi: true,
    useJeongdan: session.turnCount >= 3,
  };
}

export function handleNudgeResponse(userId: string, intent: "wait" | "continue"): void {
  const session = sessions.get(userId);
  if (!session) return;

  if (intent === "wait") {
    session.state = "waiting";
    session.pendingNudge = false;
    clearTimers(session);
    // waiting 상태: 리셋 안 함, 다음 메시지 올 때까지 대기
  }
  // intent === "continue"는 recordTurn에서 처리됨
}

export function consumeNudge(userId: string): boolean {
  const session = sessions.get(userId);
  if (!session || !session.pendingNudge) return false;
  session.pendingNudge = false;
  return true;
}

export function getSessionInfo(userId: string): {
  turnCount: number;
  state: SessionState;
  messageCount: number;
  hasDansi: boolean;
    hasAccountProfileCandidate: boolean;
  hasReadingSubject: boolean;
  hasRelationshipTarget: boolean;
  intakeStage: ConsultationIntakeStage;
  defenseCount: number;
  defenseLocked: boolean;
} | null {
  const session = sessions.get(userId);
  if (!session) return null;
  return {
    turnCount: session.turnCount,
    state: session.state,
    messageCount: session.messages.length,
    hasDansi: session.currentDansiInterpretationId !== null,
    hasAccountProfileCandidate: session.consultation.accountProfileCandidate !== null,
    hasReadingSubject: session.consultation.readingSubject !== null,
    hasRelationshipTarget: session.consultation.relationshipTarget !== null,
    intakeStage: session.consultation.intake.stage,
    defenseCount: session.defense.count,
    defenseLocked: session.defense.locked,
  };
}

export function appendConversationMessage(
  userId: string,
  role: ConversationMessage["role"],
  content: string,
): void {
  let session = sessions.get(userId);
  if (!session) {
    session = createSession();
    sessions.set(userId, session);
  }

  const trimmedContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmedContent) return;

  session.messages.push({
    role,
    content: trimmedContent,
    createdAt: Date.now(),
  });

  if (session.messages.length > MAX_CONVERSATION_MESSAGES) {
    session.messages.splice(0, session.messages.length - MAX_CONVERSATION_MESSAGES);
  }
}

export function getConversationHistory(userId: string): ConversationMessage[] {
  const session = sessions.get(userId);
  return session ? [...session.messages] : [];
}

function ensureSession(userId: string): Session {
  let session = sessions.get(userId);
  if (!session) {
    session = createSession();
    sessions.set(userId, session);
  }
  return session;
}

function cloneProfile(profile: ConsultationPersonProfile | null): ConsultationPersonProfile | null {
  if (!profile) return null;
  return {
    ...profile,
    birth: profile.birth ? { ...profile.birth } : undefined,
    birthYearPillar: profile.birthYearPillar ? { ...profile.birthYearPillar } : undefined,
  };
}

function cloneConsultation(context: ConsultationContext): ConsultationContext {
  return {
    accountProfileCandidate: cloneProfile(context.accountProfileCandidate),
    readingSubject: cloneProfile(context.readingSubject),
    knownSubjects: context.knownSubjects
      .map((profile) => cloneProfile(profile))
      .filter((profile): profile is ConsultationPersonProfile => profile !== null),
    pendingReadingSubject: cloneProfile(context.pendingReadingSubject),
    relationshipTarget: cloneProfile(context.relationshipTarget),
    intake: { ...context.intake },
  };
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

function hasReadingBasisChanged(
  previous: ConsultationPersonProfile | null,
  next: ConsultationPersonProfile | null,
): boolean {
  if (previous?.profileId !== next?.profileId) return true;
  if (!previous || !next) return false;

  return (
    previous.genderForCalculation !== next.genderForCalculation ||
    previous.birth?.date !== next.birth?.date ||
    previous.birth?.calendarType !== next.birth?.calendarType ||
    previous.birth?.isLeapMonth !== next.birth?.isLeapMonth ||
    previous.birthYearPillar?.gan !== next.birthYearPillar?.gan ||
    previous.birthYearPillar?.ji !== next.birthYearPillar?.ji ||
    previous.birthYearPillar?.solarBirthDate !== next.birthYearPillar?.solarBirthDate
  );
}

export function getConsultationContext(userId: string): ConsultationContext | null {
  const session = sessions.get(userId);
  if (!session) return null;
  return cloneConsultation(session.consultation);
}

export function hasInMemorySession(userId: string): boolean {
  return sessions.has(userId);
}

export function exportSessionSnapshot(userId: string): PersistedSessionSnapshot | null {
  const session = sessions.get(userId);
  if (!session) return null;
  return {
    turnCount: session.turnCount,
    state: session.state,
    lastActivityAt: session.lastActivityAt,
    pendingNudge: session.pendingNudge,
    previousCategories: [...session.previousCategories],
    currentJeomsi: session.currentJeomsi,
    currentDansiInterpretationId: session.currentDansiInterpretationId,
    defense: { ...session.defense },
    consultation: cloneConsultation(session.consultation),
    messages: session.messages.map((message) => ({ ...message })),
  };
}

export function restoreSessionSnapshot(userId: string, snapshot: PersistedSessionSnapshot): void {
  const previous = sessions.get(userId);
  if (previous) clearTimers(previous);
  sessions.set(userId, {
    turnCount: snapshot.turnCount,
    state: snapshot.state,
    lastActivityAt: snapshot.lastActivityAt,
    nudgeTimer: null,
    resetTimer: null,
    pendingNudge: false,
    previousCategories: [...snapshot.previousCategories],
    currentJeomsi: snapshot.currentJeomsi,
    currentDansiInterpretationId: snapshot.currentDansiInterpretationId,
    defense: snapshot.defense
      ? { ...snapshot.defense }
      : {
          count: 0,
          locked: false,
          lastIncidentType: null,
          updatedAt: null,
        },
    consultation: cloneConsultation(snapshot.consultation),
    messages: snapshot.messages
      .slice(-MAX_CONVERSATION_MESSAGES)
      .map((message) => ({ ...message })),
  });
}

export function setAccountProfileCandidate(
  userId: string,
  profile: ConsultationPersonProfile | null,
): void {
  const session = ensureSession(userId);
  session.consultation.accountProfileCandidate = cloneProfile(profile);
}

export function setReadingSubject(
  userId: string,
  profile: ConsultationPersonProfile | null,
): void {
  const session = ensureSession(userId);
  const nextProfile = cloneProfile(profile);
  const shouldResetReading = hasReadingBasisChanged(session.consultation.readingSubject, nextProfile);
  session.consultation.readingSubject = nextProfile;

  if (nextProfile) {
    const index = session.consultation.knownSubjects.findIndex((known) =>
      identifiesSamePerson(known, nextProfile)
    );
    if (index >= 0) {
      session.consultation.knownSubjects[index] = nextProfile;
    } else {
      session.consultation.knownSubjects.push(nextProfile);
    }
  }

  if (shouldResetReading) {
    // 기준 인물이나 출생 기준이 바뀌면 이전 대상의 결과는 재사용할 수 없다.
    session.currentDansiInterpretationId = null;
    session.currentJeomsi = null;
  }
}

export function setPendingReadingSubject(
  userId: string,
  profile: ConsultationPersonProfile | null,
): void {
  const session = ensureSession(userId);
  session.consultation.pendingReadingSubject = cloneProfile(profile);
}

export function setRelationshipTarget(
  userId: string,
  profile: ConsultationPersonProfile | null,
): void {
  const session = ensureSession(userId);
  session.consultation.relationshipTarget = cloneProfile(profile);
}

export function setConsultationIntake(
  userId: string,
  stage: ConsultationIntakeStage,
  initialQuestion?: string,
): void {
  const session = ensureSession(userId);
  session.consultation.intake = {
    stage,
    initialQuestion: initialQuestion ?? session.consultation.intake.initialQuestion,
  };
}

export function touchSession(userId: string): void {
  const session = ensureSession(userId);
  session.lastActivityAt = Date.now();
  session.state = "active";
  session.pendingNudge = false;
  startNudgeTimer(userId, session);
}

/**
 * 현재 턴의 분야를 기록하고, 이전과 다른 새 분야가 있으면 전환 목록 반환.
 */
export function trackCategories(userId: string, currentCategories: string[]): string[] {
  const session = sessions.get(userId);
  if (!session || currentCategories.length === 0) return [];

  const newCategories = currentCategories.filter(
    (c) => !session.previousCategories.includes(c)
  );

  for (const c of currentCategories) {
    if (!session.previousCategories.includes(c)) {
      session.previousCategories.push(c);
    }
  }

  return newCategories;
}

export function getPreviousCategories(userId: string): string[] {
  const session = sessions.get(userId);
  return session?.previousCategories ?? [];
}

export function manualReset(userId: string): void {
  resetSession(userId);
}

export function getDefenseStatus(userId: string): DefenseStatus {
  return { ...ensureSession(userId).defense };
}

export function recordDefenseIncident(
  userId: string,
  type: DefenseIncidentType,
): DefenseStatus {
  const session = ensureSession(userId);
  session.defense.count += 1;
  session.defense.locked = session.defense.count >= 3;
  session.defense.lastIncidentType = type;
  session.defense.updatedAt = Date.now();
  touchSession(userId);
  return { ...session.defense };
}

export function releaseDefense(userId: string): DefenseStatus {
  const session = ensureSession(userId);
  session.defense = {
    count: 0,
    locked: false,
    lastIncidentType: null,
    updatedAt: Date.now(),
  };
  touchSession(userId);
  return { ...session.defense };
}

export function setCurrentJeomsi(userId: string, jeomsi: string): void {
  const session = sessions.get(userId);
  if (session) session.currentJeomsi = jeomsi;
}

export function getCurrentJeomsi(userId: string): string | null {
  return sessions.get(userId)?.currentJeomsi ?? null;
}

export function setCurrentDansiInterpretationId(userId: string, interpretationId: number): void {
  const session = sessions.get(userId);
  if (session && session.currentDansiInterpretationId === null) {
    session.currentDansiInterpretationId = interpretationId;
  }
}

export function getCurrentDansiInterpretationId(userId: string): number | null {
  return sessions.get(userId)?.currentDansiInterpretationId ?? null;
}
