/**
 * 천음 지갑 (크레딧 + 구독) — v0 개발용 스텁.
 *
 * ⚠️ 실결제 아님. 잔액/구독을 in-memory로만 관리한다(앱 재시작 시 초기화).
 * 실결제는 EAS 빌드 단계에서 Google Play 결제(react-native-iap) + 서버 영수증 검증 +
 * DB 영속화로 교체한다. 게이팅/UI 흐름을 지금 폰에서 테스트하기 위한 발판이다.
 */

import type { ConsultationAspect } from "../aspects/aspect.types";
import type { CheoneumSpreadId } from "../cheoneum/cheoneum.types";

export interface Wallet {
  credits: number;
  subscribed: boolean;
  usedFirstDeepFree: boolean;
}

const STARTING_CREDITS = 5; // 개발용 시작 크레딧
const wallets = new Map<string, Wallet>();

export function getWallet(userId: string): Wallet {
  let w = wallets.get(userId);
  if (!w) {
    w = { credits: STARTING_CREDITS, subscribed: false, usedFirstDeepFree: false };
    wallets.set(userId, w);
  }
  return w;
}

export function grantCredits(userId: string, amount: number): Wallet {
  const w = getWallet(userId);
  w.credits += Math.max(0, Math.floor(amount));
  return w;
}

export function setSubscribed(userId: string, on: boolean): Wallet {
  const w = getWallet(userId);
  w.subscribed = !!on;
  return w;
}

// 무료 스프레드(일기·양의) + 유료 깊은 스프레드 비용
const SPREAD_COST: Partial<Record<CheoneumSpreadId, number>> = {
  tonggwan: 2,
  cheonjiin: 3,
  wonhyeongijeong: 3,
  sunhwan: 3,
  "nakseo-gugung": 5,
};
const SPREAD_NAMES: Record<CheoneumSpreadId, string> = {
  ilgi: "일기",
  yangeui: "양의",
  tonggwan: "통관",
  cheonjiin: "천지인",
  wonhyeongijeong: "원형이정",
  sunhwan: "순환",
  "nakseo-gugung": "낙서구궁",
};

export function getSpreadName(spread: CheoneumSpreadId): string {
  return SPREAD_NAMES[spread] ?? spread;
}

export type AccessReason = "free" | "subscribed" | "firstFree" | "credits" | "blocked";
export interface SpreadAccess {
  allowed: boolean;
  cost: number;
  reason: AccessReason;
  credits: number;
  subscribed: boolean;
  spreadName: string;
}

/** 이 스프레드를 펼칠 수 있는지 판단(소비는 하지 않음). */
export function decideSpreadAccess(spread: CheoneumSpreadId, userId: string): SpreadAccess {
  const w = getWallet(userId);
  const base = { credits: w.credits, subscribed: w.subscribed, spreadName: getSpreadName(spread) };
  const cost = SPREAD_COST[spread] ?? 0;

  if (cost === 0) return { allowed: true, cost: 0, reason: "free", ...base };
  if (w.subscribed) return { allowed: true, cost, reason: "subscribed", ...base };
  if (!w.usedFirstDeepFree) return { allowed: true, cost, reason: "firstFree", ...base };
  if (w.credits >= cost) return { allowed: true, cost, reason: "credits", ...base };
  return { allowed: false, cost, reason: "blocked", ...base };
}

/** 펼침이 실제로 확정됐을 때 소비(첫 무료 소진 또는 크레딧 차감). */
export function consumeSpreadAccess(userId: string, access: SpreadAccess): Wallet {
  const w = getWallet(userId);
  if (access.reason === "firstFree") w.usedFirstDeepFree = true;
  else if (access.reason === "credits") w.credits = Math.max(0, w.credits - access.cost);
  return w;
}

/** 페이월 멘트(명확하게 — 가격/잔액을 분명히). */
export function buildPaywallReply(aspect: ConsultationAspect, access: SpreadAccess): string {
  const head = aspect === "hwayeong" ? "이건 깊은 펼침이야." : "이건 깊은 펼침이에요.";
  const tail =
    aspect === "hwayeong"
      ? "충전하거나 구독하면 바로 펼쳐줄게."
      : "충전하거나 구독하시면 바로 펼쳐드릴게요.";
  return `${head} ${access.spreadName}은(는) ${access.cost}크레딧이 필요해요. (보유 ${access.credits}크레딧) ${tail}`;
}
