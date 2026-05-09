import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
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
import { recordTurn, consumeNudge, handleNudgeResponse, getSessionInfo, manualReset, trackCategories } from "../services/session.service";
import { matchCategories } from "../data/serious-keywords";

interface FortuneRequestBody {
  name?: string;
  birthDate: string;
  gender: "M" | "W";
  calendarType: "solar" | "lunar";
  birthTime?: string;
  birthPlace?: string;
}

interface ErrorResponseBody {
  error: true;
  message: string;
}

async function toSolarDate(
  birthDate: string,
  calendarType: "solar" | "lunar",
  birthTime?: string,
): Promise<Date> {
  const timeStr = birthTime && birthTime.trim() !== "" ? birthTime : "12:00";
  if (calendarType === "lunar") {
    try {
      const [yearStr, monthStr, dayStr] = birthDate.split("-");
      const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
      const calendar = new KoreanLunarCalendar();
      calendar.setLunarDate(parseInt(yearStr), parseInt(monthStr), parseInt(dayStr), false);
      const solar = calendar.getSolarCalendar();
      return new Date(`${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}T${timeStr}:00`);
    } catch {
      return new Date(`${birthDate}T${timeStr}:00`);
    }
  }
  return new Date(`${birthDate}T${timeStr}:00`);
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/today — 오늘의 운세
// ══════════════════════════════════════════════════════════════════════════════
export const getTodayFortuneAPI = async (
  req: Request<ParamsDictionary, any, FortuneRequestBody>,
  res: Response,
) => {
  try {
    const { name, birthDate, gender, calendarType, birthTime, birthPlace } = req.body;

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
// POST /api/chat — 묵설이 채팅
// ══════════════════════════════════════════════════════════════════════════════

const TODAY_FORTUNE_PATTERN = /!?\s*오늘\s*운세|오늘의?\s*운세|오늘\s*운세\s*봐/i;
const SPAM_REPLY = "아우 정신없어! 스승님, 이 사람이 자꾸 말을 끊어서 해요! 짹!";

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
      userId?: string;
      birthDate?: string;
      birthTime?: string;
      gender?: "M" | "W";
      message: string;
      targetPerson?: string;
      calendarType?: "solar" | "lunar";
    }
  >,
  res: Response,
) => {
  try {
    const { userId, birthDate, birthTime, gender, message, targetPerson, calendarType } = req.body;

    if (!message) {
      return res.status(400).json({ error: true, message: "message가 필요합니다." });
    }

    const { collectAndWait, createImmediateResult } = await import("../services/mookA-debounce.service");

    const debouncedOrCollecting = userId
      ? await collectAndWait({ userId, message, birthDate, birthTime, gender, calendarType, targetPerson })
      : createImmediateResult({ message, birthDate, birthTime, gender, calendarType, targetPerson });

    if (userId && typeof debouncedOrCollecting === "object" && "primary" in debouncedOrCollecting && !debouncedOrCollecting.primary) {
      return res.status(202).json({ error: false, status: "collecting", sendToUser: false, hint: "묵설이가 읽고 있어요..." });
    }

    const debounced = debouncedOrCollecting as MookADebounceResult;
    const { combinedMessage, isSpam } = debounced;
    const effectiveBirthDate = debounced.birthDate ?? birthDate;
    const effectiveBirthTime = debounced.birthTime ?? birthTime;
    const effectiveGender = debounced.gender ?? gender;
    const effectiveTargetPerson = debounced.targetPerson ?? targetPerson;
    const effectiveCalendarType = debounced.calendarType ?? calendarType;

    if (isSpam) {
      return res.status(200).json({ error: false, reply: SPAM_REPLY });
    }

    let sajuInfo = { dayPillar: "신비", ohaengSummary: "정령의 기운" };
    const hasSaju = !!(effectiveBirthDate && effectiveGender);
    const isTodayFortuneRequest = TODAY_FORTUNE_PATTERN.test(combinedMessage.trim());

    if (hasSaju) {
      const timeStr = effectiveBirthTime || "12:00";
      const { getSajuDetails } = await import("../services/saju.service");
      const sajuResult = await getSajuDetails(
        new Date(`${effectiveBirthDate}T${timeStr}`),
        effectiveGender,
      );
      const dayPillar = sajuResult.sajuData.pillars.day;
      sajuInfo = {
        dayPillar: `${dayPillar.gan}${dayPillar.ji}`,
        ohaengSummary: `일간 ${dayPillar.ganOhaeng}, 일지 ${dayPillar.jiOhaeng}`,
      };

      if (isTodayFortuneRequest) {
        const todayResult = await getTodayFortune({
          name: "",
          birthDate: effectiveBirthDate!,
          gender: effectiveGender!,
          calendarType: effectiveCalendarType ?? "solar",
          birthTime: timeStr,
          birthPlace: "",
        });

        if (todayResult.lukim?.name && todayResult.lukim?.summary) {
          const { getMookATodayFortuneResponse } = await import("../services/mookA.service");
          const reply = await getMookATodayFortuneResponse({
            lukimName: todayResult.lukim.name,
            lukimSummary: todayResult.lukim.summary,
            dayPillar: sajuInfo.dayPillar,
            ohaengSummary: sajuInfo.ohaengSummary,
            avoid: todayResult.fortune.avoid,
            lucky: todayResult.fortune.lucky,
            advice: todayResult.fortune.advice,
          });

          if (reply) {
            return res.status(200).json({ error: false, reply, sendFairyImage: true });
          }
        }
      }
    }

    // ── 세션 턴 기록 & 무기 결정 ──
    const sessionUserId = userId ?? "anonymous";
    const RESET_PATTERN = /새로\s*봐|다시\s*봐|처음부터|리셋|새로운\s*상담/;
    if (RESET_PATTERN.test(combinedMessage)) {
      manualReset(sessionUserId);
    }
    const { turnCount, useJeongdan: turnBasedJeongdan } = recordTurn(sessionUserId);

    const matchedCategories = matchCategories(combinedMessage);
    const categoryNames = matchedCategories.map((c) => c.category);
    const keywordJeongdan = matchedCategories.length > 0;
    const useJeongdan = turnBasedJeongdan || keywordJeongdan;

    const switchedCategories = trackCategories(sessionUserId, categoryNames);
    const isCategorySwitch = switchedCategories.length > 0 && turnCount > 1 && keywordJeongdan;

    const categoryTones = matchedCategories.map((c) => c.tone);

    console.log(`[세션] userId=${sessionUserId} | 턴=${turnCount} | 정단=${useJeongdan}${keywordJeongdan ? ` (분야: ${categoryNames.join(", ")})` : ''}${isCategorySwitch ? ` [전환: ${switchedCategories.join(", ")}]` : ''}`);

    const { getMookAResponse } = await import("../services/mookA.service");
    let seonbongInsight: string | undefined;
    if (shouldInjectSeonbong(combinedMessage)) {
      seonbongInsight = (await import("../services/seonbong-insight.service")).buildSeonbongInsight(new Date());
      console.log("[선봉] 주입 여부: true | 메시지:", combinedMessage.slice(0, 30), "\n[선봉 인사이트]\n", seonbongInsight || "(빈 값)");
    } else {
      console.log("[선봉] 주입 여부: false | 메시지:", combinedMessage.slice(0, 30));
    }
    const reply = await getMookAResponse(sajuInfo, combinedMessage, hasSaju, effectiveTargetPerson, seonbongInsight, useJeongdan, categoryTones, isCategorySwitch ? switchedCategories : undefined);

    if (!reply) {
      return res.status(500).json({ error: true, message: "묵설이가 잠들었나봐요! (AI 응답 없음)" });
    }

    return res.status(200).json({ error: false, reply, turnCount, useJeongdan, categories: categoryNames.length > 0 ? categoryNames : undefined });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[묵설이] 오류:", errMsg);
    return res.status(500).json({ error: true, message: `묵설이가 잠들었나봐요! (${errMsg})` });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/session/nudge — 넛지 알림 확인 (프론트 폴링용)
// ══════════════════════════════════════════════════════════════════════════════
export const checkNudgeAPI = async (
  req: Request<ParamsDictionary, any, any, { userId?: string }>,
  res: Response,
) => {
  const userId = req.query.userId ?? "anonymous";
  const hasNudge = consumeNudge(userId as string);
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
  req: Request<ParamsDictionary, any, { userId?: string; message: string }>,
  res: Response,
) => {
  const userId = req.body.userId ?? "anonymous";
  const message = req.body.message ?? "";

  if (WAIT_PATTERN.test(message)) {
    handleNudgeResponse(userId, "wait");
    return res.status(200).json({ error: false, reply: "알겠어요. 기다리고 있을게요.", reset: false });
  }

  // "기다려" 류가 아니면 → 대화 이어감 (일반 chat으로 처리)
  handleNudgeResponse(userId, "continue");
  return res.status(200).json({ error: false, continueChat: true });
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/session — 세션 상태 조회
// ══════════════════════════════════════════════════════════════════════════════
export const getSessionAPI = async (
  req: Request<ParamsDictionary, any, any, { userId?: string }>,
  res: Response,
) => {
  const userId = req.query.userId ?? "anonymous";
  const info = getSessionInfo(userId as string);
  return res.status(200).json({
    active: !!info,
    turnCount: info?.turnCount ?? 0,
    state: info?.state ?? "none",
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/greeting — 묵설이 앱 첫 접속 인사말 생성
// ══════════════════════════════════════════════════════════════════════════════
export const getGreetingAPI = async (req: Request, res: Response) => {
  try {
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
    const greeting = await getMookAGreeting({ timeOfDay, weekday, month, season, weather });

    return res.status(200).json({
      error: false,
      greeting: greeting?.trim() || '오셨어요?',
    });
  } catch (error) {
    console.error('[인사] 오류:', error);
    return res.status(200).json({ error: false, greeting: '오셨어요?' });
  }
};
