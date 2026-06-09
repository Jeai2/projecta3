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
} from "../services/session.service";
import { buildDefenseReply, buildDefenseReturnReply, decideDefense } from "../services/defense.service";
import { createCheoneumReading, getCheoneumCardCounts } from "../cheoneum/cheoneum.service";
import { buildCheoneumClientHint, buildCheoneumInsight, createTodayCheoneumDecision, decideCheoneumIntervention } from "../cheoneum/cheoneum-consultation.service";
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
    const defenseDecision = decideDefense(combinedMessage, getDefenseStatus(sessionUserId));
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

    if (defenseDecision.action === "defend") {
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

    if (defenseDecision.releaseDefense) {
      releaseDefense(sessionUserId);
    }

    const conversationHistory = getConversationHistory(sessionUserId);
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
    const cheoneumDecision = isTodayFortuneRequest
      ? createTodayCheoneumDecision(cheoneumSession)
      : decideCheoneumIntervention({
          message: combinedMessage,
          turnCount,
          session: cheoneumSession,
        });
    let cheoneumReading: ReturnType<typeof createCheoneumReading> | undefined;
    let cheoneumInsight: string | undefined;

    if (cheoneumDecision.shouldUse && cheoneumDecision.spread) {
      cheoneumReading = createCheoneumReading({ aspect, spread: cheoneumDecision.spread });
      cheoneumInsight = buildCheoneumInsight(cheoneumReading, cheoneumDecision);
    }

    const cheoneumState = updateCheoneumSessionState(sessionUserId, {
      resonanceDelta: cheoneumDecision.resonanceDelta,
      depthLevel: cheoneumDecision.depthLevel,
      usedSpread: cheoneumReading?.spread,
      currentTurn: turnCount,
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
    await saveAuthorizedSession(sessionUserId, res);
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

    // 서울 날씨 — wttr.in (무료, API 키 불필요)
    let weather: string | undefined;
    try {
      const weatherRes = await fetch('https://wttr.in/Seoul?format=j1', {
        signal: AbortSignal.timeout(4000),
      });
      const weatherData = await weatherRes.json() as any;
      const current = weatherData.current_condition[0];
      const tempC = current.temp_C;
      const desc =
        (current.lang_ko?.[0]?.value as string | undefined) ??
        (current.weatherDesc[0].value as string);
      weather = `기온 ${tempC}°C, ${desc}`;
    } catch {
      // 날씨 fetch 실패 시 맥락 없이 진행
    }

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
