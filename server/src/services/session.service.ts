/**
 * 세션 관리 서비스
 * - 턴 수 추적 → 육임단시점 / 육임정단 무기 전환
 * - 30분 무입력 → 넛지 알림 → 30분 추가 무응답 → 리셋
 */

const NUDGE_TIMEOUT_MS = 30 * 60 * 1000; // 30분

type SessionState = "active" | "nudged" | "waiting";

interface Session {
  turnCount: number;
  state: SessionState;
  lastActivityAt: number;
  nudgeTimer: NodeJS.Timeout | null;
  resetTimer: NodeJS.Timeout | null;
  pendingNudge: boolean;
  previousCategories: string[];
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

export function getSessionInfo(userId: string): { turnCount: number; state: SessionState } | null {
  const session = sessions.get(userId);
  if (!session) return null;
  return { turnCount: session.turnCount, state: session.state };
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
