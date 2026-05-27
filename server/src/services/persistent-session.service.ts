import type { Prisma } from "@prisma/client";
import type { CalendarType, ConsultationPersonProfile, GenderForCalculation, SocialLoginProvider } from "../types/consultation";
import {
  exportSessionSnapshot,
  hasInMemorySession,
  restoreSessionSnapshot,
  setAccountProfileCandidate,
  type PersistedSessionSnapshot,
} from "./session.service";
import { getDatabaseClient } from "./database.service";

export type PersistentSessionLoadStatus = "disabled" | "new" | "loaded" | "forbidden";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toCandidate(record: {
  provider: string;
  displayName: string | null;
  birthDate: string | null;
  calendarType: string | null;
  isLeapMonth: boolean | null;
  genderForCalculation: string | null;
}): ConsultationPersonProfile {
  return {
    profileId: `account-${record.provider}`,
    kind: "self",
    relationToUser: "self",
    displayName: record.displayName ?? undefined,
    source: "social_login",
    socialLoginProvider: record.provider as SocialLoginProvider,
    birth: record.birthDate
      ? {
          date: record.birthDate,
          calendarType: record.calendarType as CalendarType | undefined,
          isLeapMonth: record.isLeapMonth ?? undefined,
        }
      : undefined,
    genderForCalculation: record.genderForCalculation as GenderForCalculation | undefined,
  };
}

async function ensureUser(userId: string): Promise<void> {
  const db = getDatabaseClient();
  if (!db) return;
  await db.appUser.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
}

export async function hydratePersistentSession(
  conversationId: string,
  authenticatedUserId?: string,
): Promise<PersistentSessionLoadStatus> {
  const db = getDatabaseClient();
  if (!db) return "disabled";

  const stored = await db.consultationSession.findUnique({ where: { id: conversationId } });
  if (stored && !authenticatedUserId) return "forbidden";
  if (!authenticatedUserId) return "disabled";
  if (stored && stored.userId !== authenticatedUserId) return "forbidden";

  if (stored) {
    if (!hasInMemorySession(conversationId)) {
      restoreSessionSnapshot(conversationId, stored.snapshot as unknown as PersistedSessionSnapshot);
    }
    return "loaded";
  }

  if (!hasInMemorySession(conversationId)) {
    const candidate = await db.accountProfileCandidate.findUnique({
      where: { userId: authenticatedUserId },
    });
    if (candidate) setAccountProfileCandidate(conversationId, toCandidate(candidate));
  }
  return "new";
}

export async function persistSessionForUser(
  conversationId: string,
  authenticatedUserId?: string,
): Promise<void> {
  const db = getDatabaseClient();
  const snapshot = exportSessionSnapshot(conversationId);
  if (!db || !authenticatedUserId || !snapshot) return;

  await ensureUser(authenticatedUserId);
  const stored = await db.consultationSession.findUnique({ where: { id: conversationId } });
  if (stored && stored.userId !== authenticatedUserId) {
    throw new Error("다른 사용자에게 속한 상담 세션입니다.");
  }

  await db.consultationSession.upsert({
    where: { id: conversationId },
    update: {
      snapshot: toJson(snapshot),
      lastActivityAt: new Date(snapshot.lastActivityAt),
    },
    create: {
      id: conversationId,
      userId: authenticatedUserId,
      snapshot: toJson(snapshot),
      lastActivityAt: new Date(snapshot.lastActivityAt),
    },
  });
}

export async function persistAccountCandidateForUser(
  authenticatedUserId: string | undefined,
  candidate: ConsultationPersonProfile,
): Promise<void> {
  const db = getDatabaseClient();
  if (!db || !authenticatedUserId) return;
  if (!candidate.socialLoginProvider) {
    throw new Error("소셜 로그인 공급자가 없는 후보 정보는 저장할 수 없습니다.");
  }

  await ensureUser(authenticatedUserId);
  await db.accountProfileCandidate.upsert({
    where: { userId: authenticatedUserId },
    update: {
      provider: candidate.socialLoginProvider,
      displayName: candidate.displayName,
      birthDate: candidate.birth?.date,
      calendarType: candidate.birth?.calendarType,
      isLeapMonth: candidate.birth?.isLeapMonth,
      genderForCalculation: candidate.genderForCalculation,
    },
    create: {
      userId: authenticatedUserId,
      provider: candidate.socialLoginProvider,
      displayName: candidate.displayName,
      birthDate: candidate.birth?.date,
      calendarType: candidate.birth?.calendarType,
      isLeapMonth: candidate.birth?.isLeapMonth,
      genderForCalculation: candidate.genderForCalculation,
    },
  });
}
