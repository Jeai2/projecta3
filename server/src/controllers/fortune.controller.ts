import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { randomUUID } from "crypto";
import { getTodayFortune } from "../services/today-fortune.service";
import type { MookADebounceResult } from "../services/mookA-debounce.service";
import {
  getWoljang,
  getSeonbong,
  getCheonjibando,
  getSagwa,
  getSamjeon,
  getJeomsi,
} from "../services/lukim.service";
import {
  appendConversationMessage,
  consumeNudge,
  getCheoneumSessionState,
  getDefenseStatus,
  getConversationHistory,
  getConsultationContext,
  getCurrentDansiInterpretationId,
  getSessionInfo,
  handleNudgeResponse,
  manualReset,
  recordTurn,
  recordDefenseIncident,
  releaseDefense,
  setAccountProfileCandidate,
  setCurrentDansiInterpretationId,
  setCurrentJeomsi,
  setReadingSubject,
  setRelationshipTarget,
  touchSession,
  trackCategories,
  updateCheoneumSessionState,
  type ConversationMessage,
} from "../services/session.service";
import { buildDefenseReply, buildDefenseReturnReply, decideDefense } from "../services/defense.service";
import { createCheoneumReading, getCheoneumCardCounts } from "../cheoneum/cheoneum.service";
import { buildCheoneumClientHint, buildCheoneumInsight, buildCheoneumFocusInsight, parseFocusPosition, createTodayCheoneumDecision, decideCheoneumIntervention } from "../cheoneum/cheoneum-consultation.service";
import { decideSubjectClarify } from "../services/subject-clarify.service";
import { buildLoginRequiredReply, buildPaywallReply, consumeSpreadAccess, decideSpreadAccess, getWallet, grantCredits, setLoggedIn, setSubscribed } from "../services/cheoneum-wallet.service";
import type { CheoneumSpreadId } from "../cheoneum/cheoneum.types";
import { getLukimInterpretation, type LukimInterpretation } from "../data/lukim-interpretations";
import { matchCategories } from "../data/serious-keywords";
import { handleConsultationIntake } from "../services/consultation-intake.service";
import { resolveSolarBirthDate } from "../services/birth-date.service";
import { resolveAspect } from "../aspects/aspect.config";
import type { CalendarType, ConsultationPersonProfile, GenderForCalculation, SocialLoginProvider } from "../types/consultation";
import type { ConsultationAspect } from "../aspects/aspect.types";

interface FortuneRequestBody {
  name?: string;
  birthDate: string;
  gender: "M" | "W";
  calendarType: "solar" | "lunar";
  birthTime?: string;
  birthPlace?: string;
  isLeapMonth?: boolean;
}

interface ErrorResponseBody {
  error: true;
  message: string;
}

interface ContinuationContext {
  lastAssistant: string;
  lastUser?: string;
  message: string;
}

const CONTINUATION_QUESTION_PATTERN =
  /(무슨\s*(뜻|말)|뭐라는|뭐야|뭐\??|어떤\s*뜻|어떤\s*말|그게|그건|방금|아까|정면|다만|근데|그래서|그\s*다음|계속|이어|마저|더\s*말|설명|풀어|왜)/i;
const NEW_READING_REQUEST_PATTERN =
  /(새로\s*봐|다시\s*봐|처음부터|카드\s*(뽑|열|펼)|패를\s*(뽑|열|펼)|운세|점\s*봐|할까|말까|선택|스프레드)/i;
// 같은 판 후속(자리 콕 집기 / 더 보기) — 활성 리딩이 있을 때만 후속으로 인정
const SPREAD_FOCUS_PATTERN =
  /(동쪽|서쪽|남쪽|북쪽|북동|남동|남서|북서|동북|동남|서남|서북|중앙|가운데|중심|위쪽|아래쪽|열쇠|통관패|그\s*자리|이\s*자리|저\s*자리|왼쪽|오른쪽)/;
const SPREAD_MORE_PATTERN =
  /(더\s*(봐|보여|볼래|볼까|알려)|계속|또|다른\s*(자리|쪽|것)|나머지|딴\s*거)/;

function normalizeShortText(message: string): string {
  return message.trim().replace(/\s+/g, " ");
}

function getLastMessage(history: ConversationMessage[], role: ConversationMessage["role"]): ConversationMessage | undefined {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === role) return history[i];
  }
  return undefined;
}

function truncateForPrompt(value: string, limit: number): string {
  const normalized = normalizeShortText(value);
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit)}...`;
}

function detectContinuationQuestion(
  message: string,
  history: ConversationMessage[],
  options?: { hasActiveReading?: boolean },
): ContinuationContext | null {
  const normalized = normalizeShortText(message);
  if (!normalized) return null;

  const lastAssistant = getLastMessage(history, "assistant");
  if (!lastAssistant || lastAssistant.content.length < 20) return null;

  const lastMessage = history[history.length - 1];
  if (lastMessage?.role !== "assistant") return null;

  // 같은 판 후속: 펼친 스프레드가 있고 자리/“더 보기”를 가리키면 후속으로 본다(새로 안 뽑음).
  const spreadFollowUp =
    !!options?.hasActiveReading &&
    (SPREAD_FOCUS_PATTERN.test(normalized) || SPREAD_MORE_PATTERN.test(normalized));

  if (!spreadFollowUp && NEW_READING_REQUEST_PATTERN.test(normalized)) return null;

  const compactLength = normalized.replace(/[^\p{L}\p{N}]/gu, "").length;
  const asksFollowUp =
    CONTINUATION_QUESTION_PATTERN.test(normalized) ||
    (compactLength <= 14 && /[?？]$/.test(normalized)) ||
    /^(응|어|왜|뭐|그래서|그게|그건|계속|다음)[?？.!…\s]*$/i.test(normalized);

  if (!asksFollowUp && !spreadFollowUp) return null;

  return {
    lastAssistant: lastAssistant.content,
    lastUser: getLastMessage(history.slice(0, -1), "user")?.content,
    message: normalized,
  };
}

function buildContinuationInsight(context: ContinuationContext, lastSpread: string | null): string {
  return `[직전 답변 이어가기]
- 사용자는 새 점사나 새 카드를 요청한 것이 아니라, 직전 답변에서 끊기거나 애매했던 표현을 되물었다.
- 새 카드, 새 스프레드, 새 결론을 만들지 말고 직전 답변의 문맥을 그대로 이어서 설명한다.
- 직전 스프레드: ${lastSpread ?? "알 수 없음"}
- 직전 사용자 질문: ${context.lastUser ? truncateForPrompt(context.lastUser, 160) : "없음"}
- 직전 상담자 답변: ${truncateForPrompt(context.lastAssistant, 520)}
- 현재 사용자 후속 질문: ${context.message}
- 답변은 현재 질문의 단어를 바로 받아서 시작한다. 예: "정면이라는 건..." / "다만이라는 건..."
- "말만으로는 흐름을 잡기 어렵다", "조금 더 구체적으로 말해달라"처럼 새 질문을 요구하지 않는다.
- 직전 답변이 문장 중간에서 끊긴 것처럼 보이면, 끊긴 단어 뒤를 자연스럽게 보충해서 2~4문장으로 마무리한다.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cheoneum/draw — card layout result
// ══════════════════════════════════════════════════════════════════════════════
export const getCheoneumDrawAPI = async (
  req: Request<ParamsDictionary, any, { aspect?: ConsultationAspect; spread?: CheoneumSpreadId }>,
  res: Response,
) => {
  try {
    const reading = createCheoneumReading({
      aspect: req.body.aspect,
      spread: req.body.spread,
    });

    return res.status(200).json({
      error: false,
      data: reading,
      cardCounts: getCheoneumCardCounts(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "카드 결과를 만들 수 없습니다.";
    return res.status(400).json({ error: true, message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/today — 오늘의 운세
// ══════════════════════════════════════════════════════════════════════════════
export const getTodayFortuneAPI = async (
  req: Request<ParamsDictionary, any, FortuneRequestBody>,
  res: Response,
) => {
  try {
    const { name, birthDate, gender, calendarType, birthTime, birthPlace, isLeapMonth } = req.body;

    if (!birthDate || !gender || !calendarType) {
      return res.status(400).json({ error: true, message: "필수 필드가 누락되었습니다." });
    }

    const result = await getTodayFortune({
      name: name || "",
      birthDate,
      gender,
      calendarType,
      birthTime: birthTime || "",
      birthPlace: birthPlace || "",
      isLeapMonth,
    });

    return res.status(200).json({ error: false, data: result });
  } catch (error) {
    console.error("[오늘의 운세] 오류:", error);
    return res.status(500).json({ error: true, message: "서버 내부 오류" });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/lukim — 육임 점 결과 (삼전/사과/선봉법)
// ══════════════════════════════════════════════════════════════════════════════
export const getLukimAPI = async (
  req: Request<ParamsDictionary, any, { date?: string }>,
  res: Response,
) => {
  try {
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: true, message: "잘못된 날짜 형식입니다." });
    }

    const woljang = getWoljang(targetDate);
    const jeomsi = getJeomsi(targetDate);
    const seonbong = getSeonbong(targetDate);
    const cheonjibando = getCheonjibando(targetDate);
    const sagwa = getSagwa(targetDate);
    const samjeon = getSamjeon(targetDate);

    return res.status(200).json({
      error: false,
      data: {
        date: targetDate.toISOString(),
        woljang,
        jeomsi,
        seonbong,
        cheonjibando,
        sagwa,
        samjeon,
      },
    });
  } catch (error) {
    console.error("[육임] 오류:", error);
    return res.status(500).json({ error: true, message: "서버 내부 오류" });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/chat — 점점점 상담 채팅
// ══════════════════════════════════════════════════════════════════════════════

const TODAY_FORTUNE_PATTERN = /!?\s*오늘\s*운세|오늘의?\s*운세|오늘\s*운세\s*봐/i;
const RELATIONSHIP_READING_PATTERN =
  /궁합|결혼|혼인|부부|관계|사이|잘\s*될|잘\s*맞|재회|헤어|이별|속마음|마음\s*(알|궁금)|인연/;
const SPAM_REPLY = "말이 너무 한꺼번에 몰려왔어요. 잠깐만 멈추고, 제일 중요한 질문 하나부터 다시 말해주세요.";

function getProvidedConversationId(conversationId?: string, userId?: string): string | undefined {
  const candidate = conversationId?.trim() || userId?.trim();
  if (!candidate || candidate === "anonymous") return undefined;
  return candidate.slice(0, 128);
}

function resolveConversationId(conversationId?: string, userId?: string): string {
  return getProvidedConversationId(conversationId, userId) ?? randomUUID();
}

function getAuthenticatedUserId(res: Response): string | undefined {
  const candidate = res.locals.authenticatedUserId;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 128) : undefined;
}

const CALCULATION_READING_PATTERN =
  /육임|단시|정단|대육임|궁합/i;
const ENABLE_PROFILE_BASED_READING = false;

function shouldRunConsultationIntake(message: string, stage: string | undefined): boolean {
  if (!ENABLE_PROFILE_BASED_READING) return false;
  if (stage && stage !== "idle" && stage !== "ready") return true;
  if (CALCULATION_READING_PATTERN.test(message)) return true;
  return false;
}

async function restoreAuthorizedSession(conversationId: string, res: Response): Promise<boolean> {
  const { hydratePersistentSession } = await import("../services/persistent-session.service");
  const status = await hydratePersistentSession(conversationId, getAuthenticatedUserId(res));
  if (status !== "forbidden") return true;
  res.status(403).json({ error: true, message: "이 상담에 접근할 권한이 없습니다." });
  return false;
}

async function saveAuthorizedSession(conversationId: string, res: Response): Promise<void> {
  const { persistSessionForUser } = await import("../services/persistent-session.service");
  await persistSessionForUser(conversationId, getAuthenticatedUserId(res));
}

interface ChatCalculationProfile {
  birthDate: string;
  birthTime?: string;
  gender: GenderForCalculation;
  calendarType: CalendarType;
  isLeapMonth?: boolean;
  sessionSubject?: ConsultationPersonProfile;
}

/**
 * 선봉 인사이트 주입 여부 판단 — 4가지 트리거 중 하나라도 해당하면 true
 *
 * 1. 메시지가 짧을 때 (10자 미만)
 * 2. 모호한 키워드 포함 (그냥, 모르겠, 뭐든지 등)
 * 3. 물음표 없이 짧은 문장 (명확한 질문 아님, 20자 미만)
 * 4. 첫 인사 패턴 (안녕, 왔어요, 오셨어요 등 — 대화 문을 열기 좋은 타이밍)
 */
function shouldInjectSeonbong(message: string): boolean {
  const t = message.trim();

  // 트리거 1: 메시지가 짧을 때
  if (t.length < 10) return true;

  // 트리거 2: 모호한 키워드 포함
  const VAGUE = /그냥|모르겠|뭐든|잘 모르|아무거나|뭐랄까|별로|그냥요|음+\.*/;
  if (VAGUE.test(t)) return true;

  // 트리거 3: 물음표 없이 짧은 문장 (명확한 질문이 아닌 경우)
  const hasQuestion = t.includes("?") || t.includes("？");
  if (!hasQuestion && t.length < 20) return true;

  // 트리거 4: 첫 인사 패턴
  const GREETING = /^(안녕|왔어|왔어요|오셨|왔습니다|하이|hi|hello|ㅎㅇ)/i;
  if (GREETING.test(t)) return true;

  return false;
}

export const getMookAFortuneAPI = async (
  req: Request<
    ParamsDictionary,
    unknown,
    {
      conversationId?: string;
      userId?: string;
      birthDate?: string;
      birthTime?: string;
      gender?: "M" | "W";
      message: string;
      targetPerson?: string;
      calendarType?: "solar" | "lunar";
      isLeapMonth?: boolean;
      aspect?: ConsultationAspect;
    }
  >,
  res: Response,
) => {
  try {
    const { conversationId, userId, birthDate, birthTime, gender, message, targetPerson, calendarType, isLeapMonth } = req.body;
    const aspect = resolveAspect(req.body.aspect);

    if (!message) {
      return res.status(400).json({ error: true, message: "message가 필요합니다." });
    }

    const sessionUserId = resolveConversationId(conversationId, userId);
    if (!(await restoreAuthorizedSession(sessionUserId, res))) return;
    const useLegacyDebounce = !!getProvidedConversationId(undefined, userId);
    const { collectAndWait, createImmediateResult } = await import("../services/mookA-debounce.service");

    const debouncedOrCollecting = useLegacyDebounce
      ? await collectAndWait({ userId: sessionUserId, message, birthDate, birthTime, gender, calendarType, isLeapMonth, targetPerson })
      : createImmediateResult({ message, birthDate, birthTime, gender, calendarType, isLeapMonth, targetPerson });

    if (useLegacyDebounce && typeof debouncedOrCollecting === "object" && "primary" in debouncedOrCollecting && !debouncedOrCollecting.primary) {
      return res.status(202).json({ error: false, conversationId: sessionUserId, status: "collecting", sendToUser: false, hint: "읽고 있어요..." });
    }

    const debounced = debouncedOrCollecting as MookADebounceResult;
    const { combinedMessage, isSpam } = debounced;
    const effectiveBirthDate = debounced.birthDate ?? birthDate;
    const effectiveBirthTime = debounced.birthTime ?? birthTime;
    const effectiveGender = debounced.gender ?? gender;
    const effectiveTargetPerson = debounced.targetPerson ?? targetPerson;
    const effectiveCalendarType = debounced.calendarType ?? calendarType;
    const effectiveIsLeapMonth = debounced.isLeapMonth ?? isLeapMonth;

    if (isSpam) {
      return res.status(200).json({ error: false, conversationId: sessionUserId, reply: SPAM_REPLY });
    }

    const RESET_PATTERN = /새로\s*봐|다시\s*봐|처음부터|리셋|새로운\s*상담/;
    if (RESET_PATTERN.test(combinedMessage)) {
      manualReset(sessionUserId);
    }
    const conversationHistory = getConversationHistory(sessionUserId);
    const hasActiveReading = !!getCheoneumSessionState(sessionUserId).lastReading;
    const continuationContext = detectContinuationQuestion(combinedMessage, conversationHistory, { hasActiveReading });
    const defenseDecision = decideDefense(combinedMessage, getDefenseStatus(sessionUserId));
    const shouldBypassDefenseForContinuation =
      !!continuationContext &&
      (defenseDecision.action === "allow" ||
        (defenseDecision.action === "defend" && defenseDecision.incidentType === "vague"));

    if (defenseDecision.action === "return") {
      appendConversationMessage(sessionUserId, "user", combinedMessage);
      const defenseStatus = releaseDefense(sessionUserId);
      const reply = buildDefenseReturnReply(aspect);
      appendConversationMessage(sessionUserId, "assistant", reply);
      await saveAuthorizedSession(sessionUserId, res);
      return res.status(200).json({
        error: false,
        conversationId: sessionUserId,
        reply,
        defense: true,
        defenseType: defenseDecision.incidentType,
        defenseLocked: defenseStatus.locked,
        defenseReleased: true,
      });
    }

    if (defenseDecision.action === "defend" && !shouldBypassDefenseForContinuation) {
      appendConversationMessage(sessionUserId, "user", combinedMessage);
      const defenseStatus = recordDefenseIncident(sessionUserId, defenseDecision.incidentType);
      const reply = buildDefenseReply(aspect, defenseDecision.incidentType, defenseStatus);
      appendConversationMessage(sessionUserId, "assistant", reply);
      await saveAuthorizedSession(sessionUserId, res);
      return res.status(200).json({
        error: false,
        conversationId: sessionUserId,
        reply,
        defense: true,
        defenseType: defenseDecision.incidentType,
        defenseLocked: defenseStatus.locked,
      });
    }

    if (defenseDecision.action === "allow" && defenseDecision.releaseDefense) {
      releaseDefense(sessionUserId);
    }

    appendConversationMessage(sessionUserId, "user", combinedMessage);
    const isTodayFortuneRequest = TODAY_FORTUNE_PATTERN.test(combinedMessage.trim());
    const hasDirectReadingProfile = ENABLE_PROFILE_BASED_READING && !!(effectiveBirthDate && effectiveGender);
    const preIntakeContext = getConsultationContext(sessionUserId);
    const shouldCollectProfile = shouldRunConsultationIntake(
      combinedMessage,
      preIntakeContext?.intake.stage,
    );
    if (!hasDirectReadingProfile && shouldCollectProfile) {
      const intakeResponse = await handleConsultationIntake(sessionUserId, combinedMessage);
      if (intakeResponse) {
        touchSession(sessionUserId);
        appendConversationMessage(sessionUserId, "assistant", intakeResponse.reply);
        await saveAuthorizedSession(sessionUserId, res);
        return res.status(200).json({
          error: false,
          conversationId: sessionUserId,
          reply: intakeResponse.reply,
          collectingProfile: true,
          intakeStage: intakeResponse.stage,
          profileReady: intakeResponse.profileReady,
        });
      }
    }
    const { turnCount, useJeongdan: turnBasedJeongdan } = recordTurn(sessionUserId);

    const context = getConsultationContext(sessionUserId);
    const storedSubject = ENABLE_PROFILE_BASED_READING && context?.intake.stage === "ready" ? context.readingSubject : null;
    const storedSubjectReady =
      !!storedSubject?.birth?.date &&
      !!storedSubject.birth.calendarType &&
      !!storedSubject.genderForCalculation;
    const calculationProfile: ChatCalculationProfile | null = hasDirectReadingProfile
      ? {
          birthDate: effectiveBirthDate!,
          birthTime: effectiveBirthTime,
          gender: effectiveGender!,
          calendarType: effectiveCalendarType ?? "solar",
          isLeapMonth: effectiveIsLeapMonth,
        }
      : storedSubjectReady
        ? {
            birthDate: storedSubject.birth!.date!,
            birthTime: storedSubject.birth!.time,
            gender: storedSubject.genderForCalculation!,
            calendarType: storedSubject.birth!.calendarType!,
            isLeapMonth: storedSubject.birth!.isLeapMonth,
            sessionSubject: storedSubject,
          }
        : null;

    let sajuInfo = { dayPillar: "신비", ohaengSummary: "정령의 기운" };
    let activeDansiInterpretation: LukimInterpretation | null = null;
    let relationshipInsight: string | undefined;
    const hasSaju = calculationProfile !== null;
    const useLegacyProfileTodayFortune = false;

    if (calculationProfile) {
      const resolvedBirthDate = await resolveSolarBirthDate({
        birthDate: calculationProfile.birthDate,
        birthTime: calculationProfile.birthTime,
        calendarType: calculationProfile.calendarType,
        isLeapMonth: calculationProfile.isLeapMonth,
      });
      const { getSajuDetails } = await import("../services/saju.service");
      const sajuResult = await getSajuDetails(
        resolvedBirthDate.date,
        calculationProfile.gender,
      );
      const dayPillar = sajuResult.sajuData.pillars.day;
      sajuInfo = {
        dayPillar: `${dayPillar.gan}${dayPillar.ji}`,
        ohaengSummary: `일간 ${dayPillar.ganOhaeng}, 일지 ${dayPillar.jiOhaeng}`,
      };

      if (calculationProfile.sessionSubject) {
        setReadingSubject(sessionUserId, {
          ...calculationProfile.sessionSubject,
          birthYearPillar: {
            basis: "ipchun",
            gan: sajuResult.sajuData.pillars.year.gan,
            ji: sajuResult.sajuData.pillars.year.ji,
            solarBirthDate: resolvedBirthDate.solarBirthDate,
          },
        });
      }

      if (
        calculationProfile.sessionSubject &&
        context?.relationshipTarget &&
        RELATIONSHIP_READING_PATTERN.test(combinedMessage)
      ) {
        const { buildRelationshipConsultationInsight } = await import("../services/relationship-consultation.service");
        const result = await buildRelationshipConsultationInsight({
          readingSubject: calculationProfile.sessionSubject,
          relationshipTarget: context.relationshipTarget,
          readingSubjectPillars: sajuResult.sajuData.pillars,
        });
        if (result) {
          relationshipInsight = result.insight;
          setRelationshipTarget(sessionUserId, {
            ...context.relationshipTarget,
            birthYearPillar: result.targetBirthYearPillar,
          });
          console.log(`[관계 상담] 양쪽 출생 흐름 주입 완료 | 상대=${context.relationshipTarget.displayName ?? "상대방"}`);
        }
      }

      const storedDansiInterpretationId = getCurrentDansiInterpretationId(sessionUserId);
      if (storedDansiInterpretationId !== null) {
        activeDansiInterpretation = getLukimInterpretation(storedDansiInterpretationId);
      }

      if (!activeDansiInterpretation) {
        const { calculateDansiResult } = await import("../services/lukim-dansi.service");
        const dansiResult = calculateDansiResult({
          gender: calculationProfile.gender,
          birthYear: {
            gan: sajuResult.sajuData.pillars.year.gan,
            ji: sajuResult.sajuData.pillars.year.ji,
          },
          referenceDate: new Date(),
        });
        if (dansiResult) {
          activeDansiInterpretation = dansiResult.interpretation;
          setCurrentDansiInterpretationId(sessionUserId, dansiResult.interpretation.id);
        }
      }

      if (useLegacyProfileTodayFortune && isTodayFortuneRequest) {
        const todayResult = await getTodayFortune({
          name: "",
          birthDate: calculationProfile.birthDate,
          gender: calculationProfile.gender,
          calendarType: calculationProfile.calendarType,
          birthTime: resolvedBirthDate.birthTime,
          birthPlace: "",
          isLeapMonth: calculationProfile.isLeapMonth,
        });

        if (todayResult.lukim?.name && todayResult.lukim?.summary) {
          const { getMookATodayFortuneResponse } = await import("../services/mookA.service");
          const reply = await getMookATodayFortuneResponse(
            {
              lukimName: activeDansiInterpretation?.outputName ?? todayResult.lukim.name,
              lukimSummary: activeDansiInterpretation?.summary ?? todayResult.lukim.summary,
              dayPillar: sajuInfo.dayPillar,
              ohaengSummary: sajuInfo.ohaengSummary,
              avoid: todayResult.fortune.avoid,
              lucky: todayResult.fortune.lucky,
              advice: todayResult.fortune.advice,
            },
            conversationHistory,
            aspect,
          );

          if (reply) {
            appendConversationMessage(sessionUserId, "assistant", reply);
            await saveAuthorizedSession(sessionUserId, res);
            return res.status(200).json({ error: false, conversationId: sessionUserId, reply, turnCount, sendFairyImage: true });
          }
        }
      }
    } else {
      const storedDansiInterpretationId = getCurrentDansiInterpretationId(sessionUserId);
      if (storedDansiInterpretationId !== null) {
        activeDansiInterpretation = getLukimInterpretation(storedDansiInterpretationId);
      }
    }

    let dansiInsight: string | undefined;
    if (activeDansiInterpretation) {
      const { buildDansiInsight } = await import("../services/lukim-dansi.service");
      dansiInsight = buildDansiInsight(activeDansiInterpretation, combinedMessage);
      console.log(`[단시점] 상담 바탕 주입 완료 | id=${activeDansiInterpretation.id} | 방향=${activeDansiInterpretation.direction ?? "없음"}`);
    }

    const matchedCategories = matchCategories(combinedMessage);
    const categoryNames = matchedCategories.map((c) => c.category);
    const keywordJeongdan = matchedCategories.length > 0;
    const useJeongdan = turnBasedJeongdan || keywordJeongdan;

    const switchedCategories = trackCategories(sessionUserId, categoryNames);
    const isCategorySwitch = switchedCategories.length > 0 && turnCount > 1 && keywordJeongdan;

    const categoryTones = matchedCategories.map((c) => c.tone);
    const cheoneumSession = getCheoneumSessionState(sessionUserId);
    const rawCheoneumDecision = isTodayFortuneRequest
      ? createTodayCheoneumDecision(cheoneumSession)
      : decideCheoneumIntervention({
          message: combinedMessage,
          turnCount,
          session: cheoneumSession,
        });
    const cheoneumDecision = continuationContext
      ? {
          ...rawCheoneumDecision,
          resonanceDelta: 0,
          shouldUse: false,
          spread: undefined,
          reason: "continue previous answer without drawing a new card",
          resonanceAfter: cheoneumSession.resonance,
        }
      : rawCheoneumDecision;
    let cheoneumReading: ReturnType<typeof createCheoneumReading> | undefined;
    let cheoneumInsight: string | undefined;

    // 주체 확인 되물음(A): 카드 뽑기 직전, 점사 주체가 모호하면 먼저 한 줄 되묻고 이번 턴은 뽑지 않는다.
    if (cheoneumDecision.shouldUse && !continuationContext) {
      const subjectClarify = decideSubjectClarify(sessionUserId, combinedMessage, turnCount, aspect);
      if (subjectClarify) {
        appendConversationMessage(sessionUserId, "assistant", subjectClarify.reply);
        await saveAuthorizedSession(sessionUserId, res);
        console.log(`[주체 확인] ${aspect} | turn=${turnCount} | 대상=${subjectClarify.targetLabel} | "${combinedMessage.slice(0, 24)}"`);
        return res.status(200).json({
          error: false,
          conversationId: sessionUserId,
          reply: subjectClarify.reply,
          turnCount,
          subjectClarify: true,
        });
      }
    }

    if (cheoneumDecision.shouldUse && cheoneumDecision.spread) {
      // 결제 게이팅: 깊은 스프레드는 크레딧/구독/첫무료가 있어야 펼친다.
      const access = decideSpreadAccess(cheoneumDecision.spread, sessionUserId);
      if (!access.allowed) {
        const loginGate = access.reason === "loginRequired" || access.reason === "previewExhausted";
        const reply = loginGate ? buildLoginRequiredReply(aspect, access) : buildPaywallReply(aspect, access);
        appendConversationMessage(sessionUserId, "assistant", reply);
        await saveAuthorizedSession(sessionUserId, res);
        console.log(`[게이트] ${access.reason} | ${access.spreadName} | cost=${access.cost} | login=${access.loggedIn}`);
        return res.status(200).json({
          error: false,
          conversationId: sessionUserId,
          reply,
          turnCount,
          ...(loginGate
            ? { loginRequired: { spread: cheoneumDecision.spread, spreadName: access.spreadName } }
            : { paywall: { spread: cheoneumDecision.spread, spreadName: access.spreadName, cost: access.cost } }),
          wallet: { credits: access.credits, subscribed: access.subscribed, loggedIn: access.loggedIn },
        });
      }
      cheoneumReading = createCheoneumReading({ aspect, spread: cheoneumDecision.spread });
      cheoneumInsight = buildCheoneumInsight(cheoneumReading, cheoneumDecision, combinedMessage);
      consumeSpreadAccess(sessionUserId, access);
    } else if (continuationContext && cheoneumSession.lastReading) {
      // 같은 판 티키타카: 저장된 스프레드로 콕 집은 자리(또는 되묻기)를 이어 본다.
      const focusPosition = parseFocusPosition(combinedMessage, cheoneumSession.lastReading);
      cheoneumInsight = buildCheoneumFocusInsight(cheoneumSession.lastReading, focusPosition, cheoneumDecision, combinedMessage);
    } else if (continuationContext && cheoneumSession.lastSpread) {
      cheoneumInsight = buildContinuationInsight(continuationContext, cheoneumSession.lastSpread);
    }

    const cheoneumState = updateCheoneumSessionState(sessionUserId, {
      resonanceDelta: cheoneumDecision.resonanceDelta,
      depthLevel: cheoneumDecision.depthLevel,
      usedSpread: cheoneumReading?.spread,
      currentTurn: turnCount,
      reading: cheoneumReading, // 새로 뽑은 턴에만 저장(undefined면 직전 패 유지)
    });

    console.log(`[세션] conversationId=${sessionUserId} | 턴=${turnCount} | 정단=${useJeongdan}${keywordJeongdan ? ` (분야: ${categoryNames.join(", ")})` : ''}${isCategorySwitch ? ` [전환: ${switchedCategories.join(", ")}]` : ''}`);
    console.log(`[Cheoneum] use=${!!cheoneumReading} | type=${cheoneumDecision.inputType} | depth=${cheoneumDecision.depthLevel} | resonance=${cheoneumState.resonance} | spread=${cheoneumReading?.spread ?? "none"} | reason=${cheoneumDecision.reason}`);

    const { getMookAResponse } = await import("../services/mookA.service");
    let seonbongInsight: string | undefined;
    if (shouldInjectSeonbong(combinedMessage)) {
      seonbongInsight = (await import("../services/seonbong-insight.service")).buildSeonbongInsight(new Date());
      console.log("[선봉] 주입 여부: true | 메시지:", combinedMessage.slice(0, 30), "\n[선봉 인사이트]\n", seonbongInsight || "(빈 값)");
    } else {
      console.log("[선봉] 주입 여부: false | 메시지:", combinedMessage.slice(0, 30));
    }

    // ── 정단 시진 결정: 첫 정단=실시간, 주제 전환=d12 다이스 ──
    const JI_12 = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;
    type WoljangJiLocal = typeof JI_12[number];
    let jeomsiOverride: WoljangJiLocal | undefined;
    if (isCategorySwitch) {
      const roll = Math.floor(Math.random() * 12); // 0~11
      jeomsiOverride = JI_12[roll];
      setCurrentJeomsi(sessionUserId, jeomsiOverride);
      console.log(`[정단] 주제 전환 → d12 다이스 시진: ${jeomsiOverride} (roll=${roll + 1})`);
    }

    // ── 육임정단 해석 (짝사랑 등 세부 키워드 매칭 시) ──
    let jeongdanInsight: string | undefined;
    const CRUSH_KEYWORDS = /짝사랑|짝사|좋아하는\s*사람|이성으로|친구에서|고백/;
    if (useJeongdan && categoryNames.includes("연애") && CRUSH_KEYWORDS.test(combinedMessage) && calculationProfile?.gender) {
      try {
        const { interpretCrush } = await import("../data/jeongdan/crush");
        const now = new Date();
        const sagwa = getSagwa(now, jeomsiOverride);
        const samjeon = getSamjeon(now, jeomsiOverride);
        const cheonjibando = getCheonjibando(now, jeomsiOverride);
        const iljinGanji = (await import("../services/saju.service")).getDayGanji(now);

        if (sagwa && samjeon && cheonjibando) {
          const result = interpretCrush({
            sagwa, samjeon, cheonjibando,
            ilgan: iljinGanji[0],
            ilji: iljinGanji[1] as any,
            gender: calculationProfile.gender,
          });

          jeongdanInsight = `[육임정단 해석 — 짝사랑]
전체 흐름: ${result.gwaFirstImpression}
이성으로 보는가 (${result.q1.score}점): ${result.q1.summary}
다른 사람: ${result.q2.reason}
사귈 가능성: ${result.q3.conditions.join(" / ")}
지속 가능성 (${result.q4.score}점): ${result.q4.summary}
행동 방향: ${result.q5.action === "approach" ? "적극적으로" : "기다리기"} — ${result.q5.reasons[0] ?? ""}
최적 타이밍: ${result.q6.method}
절대 금지: ${result.q7.warning} — ${result.q7.detail}

[현재 상담자 활용 지침]
- 위 해석을 그대로 읽어주지 마. 현재 상담자 말투로 자연스럽게 풀어서 전달해.
- 한 번에 다 말하지 마. 사용자 질문에 맞는 부분만 골라서 답해.
- 점수는 절대 말하지 마. 느낌과 감각으로 표현해.
- 반드시 질문으로 끝내서 대화를 이어가.`;
          console.log("[정단] 짝사랑 해석 주입 완료");
        }
      } catch (e) {
        console.error("[정단] 짝사랑 해석 오류:", e);
      }
    }

    const reply = await getMookAResponse(sajuInfo, combinedMessage, hasSaju, effectiveTargetPerson, seonbongInsight, useJeongdan, categoryTones, isCategorySwitch ? switchedCategories : undefined, jeongdanInsight, conversationHistory, dansiInsight, relationshipInsight, aspect, cheoneumInsight);

    if (!reply) {
      return res.status(500).json({ error: true, message: "상담자가 잠시 말을 잃었어요. (AI 응답 없음)" });
    }

    appendConversationMessage(sessionUserId, "assistant", reply);
    // 세션 저장은 응답을 막지 않도록 백그라운드로 (DB 왕복을 응답 경로에서 제거)
    void saveAuthorizedSession(sessionUserId, res).catch(() => {});
    return res.status(200).json({
      error: false,
      conversationId: sessionUserId,
      reply,
      turnCount,
      useJeongdan,
      categories: categoryNames.length > 0 ? categoryNames : undefined,
      cheoneum: cheoneumReading
        ? {
            ...cheoneumReading,
            hint: buildCheoneumClientHint(cheoneumDecision, combinedMessage),
          }
        : undefined,
      wallet: (() => {
        const w = getWallet(sessionUserId);
        return { credits: w.credits, subscribed: w.subscribed, loggedIn: w.loggedIn };
      })(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[상담 채팅] 오류:", errMsg);
    return res.status(500).json({ error: true, message: `상담자가 잠시 말을 잃었어요. (${errMsg})` });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/session/nudge — 넛지 알림 확인 (프론트 폴링용)
// ══════════════════════════════════════════════════════════════════════════════
export const checkNudgeAPI = async (
  req: Request<ParamsDictionary, any, any, { conversationId?: string; userId?: string }>,
  res: Response,
) => {
  const conversationId = getProvidedConversationId(req.query.conversationId, req.query.userId);
  if (conversationId && !(await restoreAuthorizedSession(conversationId, res))) return;
  const hasNudge = conversationId ? consumeNudge(conversationId) : false;
  if (conversationId && hasNudge) await saveAuthorizedSession(conversationId, res);
  return res.status(200).json({
    nudge: hasNudge,
    message: hasNudge ? "...아직 궁금한 거 있어요?" : null,
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/session/nudge-response — 넛지에 대한 사용자 응답
// ══════════════════════════════════════════════════════════════════════════════
const WAIT_PATTERN = /기다려|나중에|잠깐|이따|좀 있다|있다가|잠시/;

export const nudgeResponseAPI = async (
  req: Request<ParamsDictionary, any, { conversationId?: string; userId?: string; message: string }>,
  res: Response,
) => {
  const conversationId = getProvidedConversationId(req.body.conversationId, req.body.userId);
  const message = req.body.message ?? "";
  if (conversationId && !(await restoreAuthorizedSession(conversationId, res))) return;

  if (WAIT_PATTERN.test(message)) {
    if (conversationId) handleNudgeResponse(conversationId, "wait");
    if (conversationId) await saveAuthorizedSession(conversationId, res);
    return res.status(200).json({ error: false, reply: "알겠어요. 기다리고 있을게요.", reset: false });
  }

  // "기다려" 류가 아니면 → 대화 이어감 (일반 chat으로 처리)
  if (conversationId) handleNudgeResponse(conversationId, "continue");
  return res.status(200).json({ error: false, continueChat: true });
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/session — 세션 상태 조회
// ══════════════════════════════════════════════════════════════════════════════
export const getSessionAPI = async (
  req: Request<ParamsDictionary, any, any, { conversationId?: string; userId?: string }>,
  res: Response,
) => {
  const conversationId = getProvidedConversationId(req.query.conversationId, req.query.userId);
  if (conversationId && !(await restoreAuthorizedSession(conversationId, res))) return;
  const info = conversationId ? getSessionInfo(conversationId) : null;
  return res.status(200).json({
    active: !!info,
    turnCount: info?.turnCount ?? 0,
    state: info?.state ?? "none",
    messageCount: info?.messageCount ?? 0,
    hasDansi: info?.hasDansi ?? false,
    hasAccountProfileCandidate: info?.hasAccountProfileCandidate ?? false,
    hasReadingSubject: info?.hasReadingSubject ?? false,
    hasRelationshipTarget: info?.hasRelationshipTarget ?? false,
    intakeStage: info?.intakeStage ?? "idle",
    defenseCount: info?.defenseCount ?? 0,
    defenseLocked: info?.defenseLocked ?? false,
    cheoneumResonance: info?.cheoneumResonance ?? 20,
    cheoneumLastSpread: info?.cheoneumLastSpread ?? null,
    cheoneumLastDepth: info?.cheoneumLastDepth ?? 0,
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/session/account-profile-candidate — 로그인에서 받은 본인 정보 후보 연결
// 실제 OAuth 검증 이후 호출되어야 하며, 이 API 자체는 인증을 대신하지 않는다.
// ══════════════════════════════════════════════════════════════════════════════
export const linkAccountProfileCandidateAPI = async (
  req: Request<
    ParamsDictionary,
    any,
    {
      conversationId?: string;
      userId?: string;
      provider: SocialLoginProvider;
      displayName?: string;
      birthDate?: string;
      calendarType?: CalendarType;
      isLeapMonth?: boolean;
      gender?: GenderForCalculation;
    }
  >,
  res: Response,
) => {
  const conversationId = getProvidedConversationId(req.body.conversationId, req.body.userId);
  if (!conversationId) {
    return res.status(400).json({ error: true, message: "conversationId가 필요합니다." });
  }

  try {
    if (!(await restoreAuthorizedSession(conversationId, res))) return;
    const { createAccountProfileCandidate } = await import("../services/account-profile.service");
    const candidate = createAccountProfileCandidate(req.body);
    setAccountProfileCandidate(conversationId, candidate);
    touchSession(conversationId);
    const { persistAccountCandidateForUser } = await import("../services/persistent-session.service");
    await persistAccountCandidateForUser(getAuthenticatedUserId(res), candidate);
    await saveAuthorizedSession(conversationId, res);

    return res.status(200).json({
      error: false,
      conversationId,
      linked: true,
      candidate: {
        provider: candidate.socialLoginProvider,
        hasBirthDate: !!candidate.birth?.date,
        hasCalendarType: !!candidate.birth?.calendarType,
        hasGender: !!candidate.genderForCalculation,
      },
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      message: error instanceof Error ? error.message : "로그인 프로필 정보를 연결할 수 없습니다.",
    });
  }
};

// 서울 날씨 캐시 (stale-while-revalidate) — wttr.in이 느려 인사가 막히는 걸 막는다.
// 신선하면 즉시 반환, 오래됐으면 옛 값 즉시 반환 + 백그라운드 갱신, 캐시 없으면 한 번만 짧게(1.5s) 대기.
let seoulWeatherCache: { value: string | undefined; at: number } | null = null;
let seoulWeatherRefreshing = false;
const WEATHER_TTL_MS = 20 * 60 * 1000;

async function fetchSeoulWeather(): Promise<string | undefined> {
  try {
    const res = await fetch("https://wttr.in/Seoul?format=j1", { signal: AbortSignal.timeout(1500) });
    const data = (await res.json()) as any;
    const current = data.current_condition[0];
    const desc =
      (current.lang_ko?.[0]?.value as string | undefined) ?? (current.weatherDesc[0].value as string);
    return `기온 ${current.temp_C}°C, ${desc}`;
  } catch {
    return undefined;
  }
}

async function getSeoulWeather(): Promise<string | undefined> {
  const now = Date.now();
  if (seoulWeatherCache && now - seoulWeatherCache.at < WEATHER_TTL_MS) {
    return seoulWeatherCache.value; // 신선 → 대기 0
  }
  if (seoulWeatherCache) {
    // 오래됨 → 옛 값 즉시 반환 + 백그라운드 갱신 (대기 0)
    if (!seoulWeatherRefreshing) {
      seoulWeatherRefreshing = true;
      fetchSeoulWeather()
        .then((v) => { seoulWeatherCache = { value: v, at: Date.now() }; })
        .finally(() => { seoulWeatherRefreshing = false; });
    }
    return seoulWeatherCache.value;
  }
  // 캐시 없음(첫 호출) → 한 번만 짧게 기다림(1.5s)
  const value = await fetchSeoulWeather();
  seoulWeatherCache = { value, at: Date.now() };
  return value;
}

// 서버 기동 시 미리 한 번 데워둔다(첫 사용자도 대기 없게).
void getSeoulWeather();

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/greeting — 앱 첫 접속 인사말 생성
// ══════════════════════════════════════════════════════════════════════════════
export const getGreetingAPI = async (req: Request<ParamsDictionary, any, any, { aspect?: ConsultationAspect }>, res: Response) => {
  try {
    const aspect = resolveAspect(req.query.aspect);
    // KST(UTC+9) 기준 현재 시각 계산
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const month = kst.getUTCMonth() + 1;
    const hour = kst.getUTCHours();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[kst.getUTCDay()];

    const timeOfDay =
      hour < 6 ? '새벽' :
      hour < 12 ? '아침' :
      hour < 18 ? '낮' :
      hour < 21 ? '저녁' : '밤';

    const season =
      month >= 3 && month <= 5 ? '봄' :
      month >= 6 && month <= 8 ? '여름' :
      month >= 9 && month <= 11 ? '가을' : '겨울';

    // 서울 날씨 — 캐시 사용(대기 거의 0). 실패하면 날씨 없이 진행.
    const weather = await getSeoulWeather();

    const { getMookAGreeting } = await import('../services/mookA.service');
    const greeting = await getMookAGreeting({ timeOfDay, weekday, month, season, weather }, aspect);

    return res.status(200).json({
      error: false,
      greeting: greeting?.trim() || '오셨어요?',
    });
  } catch (error) {
    console.error('[인사] 오류:', error);
    return res.status(200).json({ error: false, greeting: '오셨어요?' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// 천음 지갑 (크레딧 + 구독) — v0 개발용 스텁 결제. 실결제는 EAS 빌드 때 IAP로 교체.
// ══════════════════════════════════════════════════════════════════════════════
export const getWalletAPI = async (
  req: Request<ParamsDictionary, any, any, { conversationId?: string; userId?: string }>,
  res: Response,
) => {
  const id = resolveConversationId(req.query.conversationId, req.query.userId);
  const w = getWallet(id);
  return res.status(200).json({ error: false, conversationId: id, wallet: { credits: w.credits, subscribed: w.subscribed, loggedIn: w.loggedIn } });
};

export const grantCreditsAPI = async (
  req: Request<ParamsDictionary, any, { conversationId?: string; userId?: string; amount?: number }>,
  res: Response,
) => {
  const id = resolveConversationId(req.body.conversationId, req.body.userId);
  const amount = typeof req.body.amount === "number" && req.body.amount > 0 ? Math.floor(req.body.amount) : 10;
  const w = grantCredits(id, amount);
  console.log(`[지갑] 충전(스텁) +${amount} → ${w.credits} | ${id}`);
  return res.status(200).json({ error: false, conversationId: id, wallet: { credits: w.credits, subscribed: w.subscribed, loggedIn: w.loggedIn } });
};

export const setSubscriptionAPI = async (
  req: Request<ParamsDictionary, any, { conversationId?: string; userId?: string; on?: boolean }>,
  res: Response,
) => {
  const id = resolveConversationId(req.body.conversationId, req.body.userId);
  const w = setSubscribed(id, req.body.on !== false);
  console.log(`[지갑] 구독(스텁) → ${w.subscribed} | ${id}`);
  return res.status(200).json({ error: false, conversationId: id, wallet: { credits: w.credits, subscribed: w.subscribed, loggedIn: w.loggedIn } });
};

// 로그인 — v0 개발용 스텁. 실 구글 OAuth 검증 성공 시 동일하게 setLoggedIn 호출하면 됨.
export const devLoginAPI = async (
  req: Request<ParamsDictionary, any, { conversationId?: string; userId?: string }>,
  res: Response,
) => {
  const id = resolveConversationId(req.body.conversationId, req.body.userId);
  const w = setLoggedIn(id, true);
  console.log(`[로그인] dev-login(스텁) | ${id}`);
  return res.status(200).json({ error: false, conversationId: id, wallet: { credits: w.credits, subscribed: w.subscribed, loggedIn: w.loggedIn } });
};
