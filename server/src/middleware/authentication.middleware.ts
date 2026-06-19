import type { NextFunction, Request, Response } from "express";
import { authenticateSessionToken } from "../services/auth-session.service";

export const AUTH_COOKIE_NAME = "mookseol_session";

// OAuth 전 단계: 앱이 보내는 추측 불가능한 기기 UUID를 소유자로 인정한다(연속성용).
// 형식 검증만 하고, 진짜 토큰이 없을 때만 폴백으로 쓴다. 진짜 OAuth가 들어오면 토큰이 우선한다.
const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
export function getDeviceId(req: Request): string | undefined {
  const raw = req.header("x-device-id");
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return DEVICE_ID_PATTERN.test(trimmed) ? trimmed : undefined;
}

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
    if (userId) {
      res.locals.authenticatedUserId = userId;
    } else {
      // 토큰이 없으면 기기 UUID를 소유자로 인정(device: 접두사로 진짜 userId와 구분).
      const deviceId = getDeviceId(req);
      if (deviceId) {
        res.locals.authenticatedUserId = `device:${deviceId}`;
        res.locals.isDeviceIdentity = true;
      }
    }
    next();
  } catch (error) {
    console.error("[인증] 세션 확인 오류:", error);
    next();
  }
}
