import { createHash, randomBytes } from "crypto";
import type { SocialLoginProvider } from "../types/consultation";
import { getDatabaseClient } from "./database.service";

const OAUTH_ATTEMPT_LIFETIME_MS = 10 * 60 * 1000;
const AUTH_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function createSecret(): string {
  return randomBytes(32).toString("base64url");
}

export async function createOAuthLoginAttempt(
  provider: SocialLoginProvider,
  conversationId: string,
): Promise<string> {
  const db = getDatabaseClient();
  if (!db) throw new Error("DATABASE_URL이 설정되지 않아 로그인을 시작할 수 없습니다.");

  const state = createSecret();
  await db.oAuthLoginAttempt.create({
    data: {
      stateHash: hashSecret(state),
      provider,
      conversationId,
      expiresAt: new Date(Date.now() + OAUTH_ATTEMPT_LIFETIME_MS),
    },
  });
  return state;
}

export async function consumeOAuthLoginAttempt(
  provider: SocialLoginProvider,
  state: string,
): Promise<{ conversationId: string } | null> {
  const db = getDatabaseClient();
  if (!db || !state.trim()) return null;

  const attempt = await db.oAuthLoginAttempt.findUnique({
    where: { stateHash: hashSecret(state) },
  });
  if (!attempt || attempt.provider !== provider || attempt.expiresAt.getTime() <= Date.now()) {
    if (attempt) await db.oAuthLoginAttempt.delete({ where: { stateHash: attempt.stateHash } });
    return null;
  }

  await db.oAuthLoginAttempt.delete({ where: { stateHash: attempt.stateHash } });
  return { conversationId: attempt.conversationId };
}

export async function createAuthSession(userId: string): Promise<string> {
  const db = getDatabaseClient();
  if (!db) throw new Error("DATABASE_URL이 설정되지 않아 로그인 세션을 만들 수 없습니다.");

  const token = createSecret();
  await db.authSession.create({
    data: {
      tokenHash: hashSecret(token),
      userId,
      expiresAt: new Date(Date.now() + AUTH_SESSION_LIFETIME_MS),
    },
  });
  return token;
}

export async function authenticateSessionToken(token?: string): Promise<string | null> {
  const db = getDatabaseClient();
  if (!db || !token?.trim()) return null;

  const stored = await db.authSession.findUnique({
    where: { tokenHash: hashSecret(token) },
  });
  if (!stored) return null;
  if (stored.expiresAt.getTime() <= Date.now()) {
    await db.authSession.delete({ where: { tokenHash: stored.tokenHash } });
    return null;
  }

  await db.authSession.update({
    where: { tokenHash: stored.tokenHash },
    data: { lastUsedAt: new Date() },
  });
  return stored.userId;
}

export async function revokeAuthSession(token?: string): Promise<void> {
  const db = getDatabaseClient();
  if (!db || !token?.trim()) return;
  await db.authSession.deleteMany({ where: { tokenHash: hashSecret(token) } });
}
