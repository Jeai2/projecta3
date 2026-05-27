import type { NextFunction, Request, Response } from "express";
import { authenticateSessionToken } from "../services/auth-session.service";

export const AUTH_COOKIE_NAME = "mookseol_session";

export function getSessionToken(req: Request): string | undefined {
  const authorization = req.header("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || undefined;
  }

  const cookie = req.header("cookie");
  if (!cookie) return undefined;
  const encoded = cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === AUTH_COOKIE_NAME)?.[1];
  return encoded ? decodeURIComponent(encoded) : undefined;
}

export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = await authenticateSessionToken(getSessionToken(req));
    if (userId) res.locals.authenticatedUserId = userId;
    next();
  } catch (error) {
    console.error("[인증] 세션 확인 오류:", error);
    next();
  }
}
