import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { AUTH_COOKIE_NAME, getSessionToken } from "../middleware/authentication.middleware";
import { createAccountProfileCandidate } from "../services/account-profile.service";
import { findOrCreateUserFromVerifiedIdentity } from "../services/account-identity.service";
import {
  createAuthSession,
  createOAuthLoginAttempt,
  consumeOAuthLoginAttempt,
  revokeAuthSession,
} from "../services/auth-session.service";
import { buildNaverAuthorizationUrl, exchangeNaverAuthorizationCode, fetchNaverProfile } from "../services/naver-auth.service";
import { persistAccountCandidateForUser, persistSessionForUser } from "../services/persistent-session.service";
import { setAccountProfileCandidate, touchSession } from "../services/session.service";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function normalizeConversationId(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return randomUUID();
  return value.trim().slice(0, 128);
}

function buildAuthCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`;
}

function clearAuthCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function buildNaverCandidate(profile: Awaited<ReturnType<typeof fetchNaverProfile>>) {
  const birthDate =
    profile.birthyear && /^\d{4}$/.test(profile.birthyear) && profile.birthday && /^\d{2}-\d{2}$/.test(profile.birthday)
      ? `${profile.birthyear}-${profile.birthday}`
      : undefined;
  const gender = profile.gender === "M" ? "M" : profile.gender === "F" ? "W" : undefined;
  return createAccountProfileCandidate({
    provider: "naver",
    displayName: profile.nickname,
    birthDate,
    gender,
  });
}

export async function startNaverLoginAPI(req: Request, res: Response): Promise<void> {
  try {
    const conversationId = normalizeConversationId(req.query.conversationId);
    const state = await createOAuthLoginAttempt("naver", conversationId);
    res.redirect(buildNaverAuthorizationUrl(state));
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : "네이버 로그인을 시작할 수 없습니다.",
    });
  }
}

export async function naverLoginCallbackAPI(req: Request, res: Response): Promise<void> {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const naverError = typeof req.query.error === "string" ? req.query.error : "";
  if (naverError) {
    res.status(400).send("네이버 로그인이 취소되었거나 거부되었습니다.");
    return;
  }
  if (!code || !state) {
    res.status(400).send("네이버 로그인 결과가 올바르지 않습니다.");
    return;
  }

  try {
    const attempt = await consumeOAuthLoginAttempt("naver", state);
    if (!attempt) {
      res.status(400).send("로그인 요청이 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.");
      return;
    }

    const accessToken = await exchangeNaverAuthorizationCode(code, state);
    const profile = await fetchNaverProfile(accessToken);
    const userId = await findOrCreateUserFromVerifiedIdentity({
      provider: "naver",
      providerAccountId: profile.id,
    });
    const candidate = buildNaverCandidate(profile);
    await persistAccountCandidateForUser(userId, candidate);
    setAccountProfileCandidate(attempt.conversationId, candidate);
    touchSession(attempt.conversationId);
    await persistSessionForUser(attempt.conversationId, userId);

    const sessionToken = await createAuthSession(userId);
    res.setHeader("Set-Cookie", buildAuthCookie(sessionToken));
    res.status(200).type("html").send(`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>묵설 로그인 완료</title></head>
<body><p>네이버 로그인이 완료되었습니다. 묵설 상담으로 돌아가도 됩니다.</p></body></html>`);
  } catch (error) {
    console.error("[네이버 로그인] 콜백 오류:", error);
    res.status(500).send("네이버 로그인을 완료하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  }
}

export async function getAuthSessionAPI(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    authenticated: typeof res.locals.authenticatedUserId === "string",
  });
}

export async function logoutAPI(req: Request, res: Response): Promise<void> {
  await revokeAuthSession(getSessionToken(req));
  res.setHeader("Set-Cookie", clearAuthCookie());
  res.status(200).json({ error: false, loggedOut: true });
}
