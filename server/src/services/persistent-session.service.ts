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

// graceful degradation: 영속화(세션 저장/복원)는 점사 자체에 필수가 아니다.
// DB가 잠시 불통이어도 throw로 채팅을 죽이지 않고, 인메모리로 계속 진행한다.
function describeDbError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.split("\n").slice(0, 2).join(" ").slice(0, 200);
  }
  return String(error);
}

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
  // 게스트(미로그인)는 영속화 대상이 아니므로 DB 조회 자체를 건너뛴다 → 매 요청의 DB 왕복 지연 제거.
  // (로그인 도입 시: 토큰 기반 접근 제어로 forbidden 가드를 복원할 것)
  if (!authenticatedUserId) return "disabled";

  try {
    const stored = await db.consultationSession.findUnique({ where: { id: conversationId } });
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
  } catch (error) {
    // DB 불통 → 권한 검증/복원을 못 하더라도 채팅은 인메모리로 계속한다(저장만 포기).
    console.warn(`[영속화] 세션 복원 실패 — 인메모리로 계속 진행: ${describeDbError(error)}`);
    return "disabled";
  }
}

export async function persistSessionForUser(
  conversationId: string,
  authenticatedUserId?: string,
): Promise<void> {
  const db = getDatabaseClient();
  const snapshot = exportSessionSnapshot(conversationId);
  if (!db || !authenticatedUserId || !snapshot) return;

  try {
    await ensureUser(authenticatedUserId);
    const stored = await db.consultationSession.findUnique({ where: { id: conversationId } });
    if (stored && stored.userId !== authenticatedUserId) {
      // 다른 사용자 세션이면 덮어쓰지 않고 조용히 건너뛴다(안전 측면에서도 skip이 맞다).
      console.warn(`[영속화] 세션 저장 건너뜀 — 소유자 불일치 conversationId=${conversationId}`);
      return;
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
  } catch (error) {
    // DB 불통 → 이번 턴 저장만 건너뛴다. 답변/대화는 그대로 유지.
    console.warn(`[영속화] 세션 저장 실패 — 이번 턴 저장 건너뜀: ${describeDbError(error)}`);
  }
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

  try {
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
  } catch (error) {
    // DB 불통 → 로그인 후보 저장만 건너뛴다(다음 저장 시 다시 시도됨).
    console.warn(`[영속화] 계정 후보 저장 실패 — 건너뜀: ${describeDbError(error)}`);
  }
}
