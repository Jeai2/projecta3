import { randomUUID } from "crypto";
import type { SocialLoginProvider } from "../types/consultation";
import { getDatabaseClient } from "./database.service";

export interface VerifiedSocialIdentity {
  provider: SocialLoginProvider;
  providerAccountId: string;
}

/**
 * OAuth 토큰이 공급자 서버에서 검증된 뒤에만 호출한다.
 * 외부 계정 식별자를 내부 사용자 ID에 한 번만 결합한다.
 */
export async function findOrCreateUserFromVerifiedIdentity(
  identity: VerifiedSocialIdentity,
): Promise<string> {
  const db = getDatabaseClient();
  if (!db) {
    throw new Error("DATABASE_URL이 설정되지 않아 로그인 사용자를 저장할 수 없습니다.");
  }

  const providerAccountId = identity.providerAccountId.trim();
  if (!providerAccountId) throw new Error("검증된 로그인 계정 식별자가 필요합니다.");

  const existing = await db.socialAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: identity.provider,
        providerAccountId,
      },
    },
  });
  if (existing) return existing.userId;

  const userId = randomUUID();
  await db.appUser.create({
    data: {
      id: userId,
      socialAccounts: {
        create: {
          provider: identity.provider,
          providerAccountId,
        },
      },
    },
  });
  return userId;
}
