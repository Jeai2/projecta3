// server/src/services/today-fortune.service.ts
// 오늘의 운세 전용 서비스 (일진 기반)

import { getDayGanji, getSajuDetails } from "./saju.service";
import {
  analyzeCompatibility,
  type CompatibilityResult,
} from "./compatibility.service";
import { SIPSIN_TABLE, JI } from "../data/saju.data";
import {
  getLukimInterpretation,
  type LukimInterpretation,
} from "../data/lukim-interpretations";
import type {
  TodayFortuneResponse,
  IljinData,
  IljinFortune,
  FortuneScoreMeta,
  TenGodType,
  FortuneGrade,
} from "../types/today-fortune";
import {
  calculateFortuneScores,
  fortuneGradeSummary,
  getFortuneGrade,
  getGradeTone,
  getTenGodMessage,
} from "./today-fortune.utils";
import { calcSajuIching } from "./iching.service";

// 오행 매핑
const GAN_TO_OHAENG: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const JI_TO_OHAENG: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水",
};

// 방향 매핑 (간지별)
const GANJI_TO_DIRECTION: Record<string, "東" | "西" | "南" | "北" | "中央"> = {
  甲子: "東",
  乙丑: "東",
  丙寅: "南",
  丁卯: "南",
  戊辰: "中央",
  己巳: "中央",
  庚午: "西",
  辛未: "西",
  壬申: "北",
  癸酉: "北",
  甲戌: "東",
  乙亥: "東",
  丙子: "南",
  丁丑: "南",
  戊寅: "中央",
  己卯: "中央",
  庚辰: "西",
  辛巳: "西",
  壬午: "北",
  癸未: "北",
  甲申: "東",
  乙酉: "東",
  丙戌: "南",
  丁亥: "南",
  戊子: "中央",
  己丑: "中央",
  庚寅: "西",
  辛卯: "西",
  壬辰: "北",
  癸巳: "北",
  甲午: "東",
  乙未: "東",
  丙申: "南",
  丁酉: "南",
  戊戌: "中央",
  己亥: "中央",
  庚子: "西",
  辛丑: "西",
  壬寅: "北",
  癸卯: "北",
  甲辰: "東",
  乙巳: "東",
  丙午: "南",
  丁未: "南",
  戊申: "中央",
  己酉: "中央",
  庚戌: "西",
  辛亥: "西",
  壬子: "北",
  癸丑: "北",
  甲寅: "東",
  乙卯: "東",
  丙辰: "南",
  丁巳: "南",
  戊午: "中央",
  己未: "中央",
  庚申: "西",
  辛酉: "西",
  壬戌: "北",
  癸亥: "北",
};

// 색상 매핑 (오행별)
const OHAENG_TO_COLOR: Record<string, string> = {
  木: "청색",
  火: "빨간색",
  土: "노란색",
  金: "흰색",
  水: "검은색",
};

// 숫자 매핑 (간지별)
const GANJI_TO_NUMBER: Record<string, string> = {
  甲子: "1, 3",
  乙丑: "2, 4",
  丙寅: "3, 5",
  丁卯: "4, 6",
  戊辰: "5, 7",
  己巳: "6, 8",
  庚午: "7, 9",
  辛未: "8, 10",
  壬申: "9, 1",
  癸酉: "10, 2",
  甲戌: "1, 3",
  乙亥: "2, 4",
  丙子: "3, 5",
  丁丑: "4, 6",
  戊寅: "5, 7",
  己卯: "6, 8",
  庚辰: "7, 9",
  辛巳: "8, 10",
  壬午: "9, 1",
  癸未: "10, 2",
  甲申: "1, 3",
  乙酉: "2, 4",
  丙戌: "3, 5",
  丁亥: "4, 6",
  戊子: "5, 7",
  己丑: "6, 8",
  庚寅: "7, 9",
  辛卯: "8, 10",
  壬辰: "9, 1",
  癸巳: "10, 2",
  甲午: "1, 3",
  乙未: "2, 4",
  丙申: "3, 5",
  丁酉: "4, 6",
  戊戌: "5, 7",
  己亥: "6, 8",
  庚子: "7, 9",
  辛丑: "8, 10",
  壬寅: "9, 1",
  癸卯: "10, 2",
  甲辰: "1, 3",
  乙巳: "2, 4",
  丙午: "3, 5",
  丁未: "4, 6",
  戊申: "5, 7",
  己酉: "6, 8",
  庚戌: "7, 9",
  辛亥: "8, 10",
  壬子: "9, 1",
  癸丑: "10, 2",
  甲寅: "1, 3",
  乙卯: "2, 4",
  丙辰: "3, 5",
  丁巳: "4, 6",
  戊午: "5, 7",
  己未: "6, 8",
  庚申: "7, 9",
  辛酉: "8, 10",
  壬戌: "9, 1",
  癸亥: "10, 2",
};

// 시간대 매핑 (간지별)
const GANJI_TO_TIME: Record<string, { good: string[]; bad: string[] }> = {
  甲子: { good: ["卯시", "辰시"], bad: ["午시", "未시"] },
  乙丑: { good: ["辰시", "巳시"], bad: ["未시", "申시"] },
  丙寅: { good: ["巳시", "午시"], bad: ["申시", "酉시"] },
  丁卯: { good: ["午시", "未시"], bad: ["酉시", "戌시"] },
  戊辰: { good: ["未시", "申시"], bad: ["戌시", "亥시"] },
  己巳: { good: ["申시", "酉시"], bad: ["亥시", "子시"] },
  庚午: { good: ["酉시", "戌시"], bad: ["子시", "丑시"] },
  辛未: { good: ["戌시", "亥시"], bad: ["丑시", "寅시"] },
  壬申: { good: ["亥시", "子시"], bad: ["寅시", "卯시"] },
  癸酉: { good: ["子시", "丑시"], bad: ["卯시", "辰시"] },
  // ... 나머지도 동일한 패턴으로 추가 가능
};

const createLukimValueMap = (): Record<string, number> => {
  const map: Record<string, number> = {};
  const assign = (symbols: string[], value: number) => {
    symbols.forEach((symbol) => {
      map[symbol] = value;
    });
  };

  assign(["甲", "己", "子", "午", "갑", "기", "자", "오"], 9);
  assign(["乙", "庚", "丑", "未", "을", "경", "축", "미"], 8);
  assign(["丙", "辛", "寅", "申", "병", "신", "인", "신"], 7);
  assign(["丁", "壬", "卯", "酉", "정", "임", "묘", "유"], 6);
  assign(["戊", "癸", "辰", "戌", "무", "계", "진", "술"], 5);
  assign(["巳", "亥", "사", "해"], 4);

  return map;
};

const LUKIM_VALUE_MAP = createLukimValueMap();

type LukimComponentType = "birthYearGan" | "birthYearJi" | "dayGan" | "hourJi";

interface LukimComponentDetail {
  type: LukimComponentType;
  label: string;
  symbol: string;
  value: number;
}

interface LukimCalculationResult {
  total: number;
  interpretation: LukimInterpretation | null;
  components: LukimComponentDetail[];
}

const getLukimNumericValue = (symbol: string): number | null => {
  if (!symbol) return null;
  return LUKIM_VALUE_MAP[symbol] ?? null;
};

const getHourBranchSymbol = (date: Date): string => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const adjustedMinutes = (totalMinutes + 30) % 1440;
  const hourJiIndex = Math.floor(adjustedMinutes / 120);
  return JI[hourJiIndex];
};

const calculateLukimResult = (
  gender: "M" | "W",
  userPillars: {
    year: { gan: string; ji: string };
  },
  iljin: IljinData,
  referenceDate: Date
): LukimCalculationResult | null => {
  const birthSymbol =
    gender === "M" ? userPillars.year.gan : userPillars.year.ji;
  const birthComponent: LukimComponentDetail = {
    type: gender === "M" ? "birthYearGan" : "birthYearJi",
    label: gender === "M" ? "생년간" : "생년지",
    symbol: birthSymbol,
    value: getLukimNumericValue(birthSymbol) ?? 0,
  };

  const dayComponent: LukimComponentDetail = {
    type: "dayGan",
    label: "점일간",
    symbol: iljin.gan,
    value: getLukimNumericValue(iljin.gan) ?? 0,
  };

  const hourBranch = getHourBranchSymbol(referenceDate);
  const hourComponent: LukimComponentDetail = {
    type: "hourJi",
    label: "점시지",
    symbol: hourBranch,
    value: getLukimNumericValue(hourBranch) ?? 0,
  };

  const components = [birthComponent, dayComponent, hourComponent];

  if (components.some((component) => component.value === 0)) {
    return null;
  }

  const total = components.reduce((sum, component) => sum + component.value, 0);
  const interpretation = getLukimInterpretation(total);

  if (!interpretation) {
    return null;
  }

  return {
    total,
    interpretation,
    components,
  };
};

interface FortuneGenerationOptions {
  sipsinOfToday?: {
    dayGan: string;
    gan?: string | null;
    ji?: string | null;
  };
  fortuneScores?: FortuneScoreMeta;
}

// 일진 데이터 생성
export const generateIljinData = (date: Date): IljinData => {
  const ganji = getDayGanji(date);
  const gan = ganji[0];
  const ji = ganji[1];

  return {
    date: date.toISOString().split("T")[0], // YYYY-MM-DD 형식
    ganji,
    gan,
    ji,
    ohaeng: {
      gan: GAN_TO_OHAENG[gan] || "木",
      ji: JI_TO_OHAENG[ji] || "水",
    },
    direction: GANJI_TO_DIRECTION[ganji] || "東",
    color: OHAENG_TO_COLOR[GAN_TO_OHAENG[gan] || "木"],
    number: GANJI_TO_NUMBER[ganji] || "1, 3",
    time: GANJI_TO_TIME[ganji] || {
      good: ["卯시", "辰시"],
      bad: ["午시", "未시"],
    },
  };
};

// 운세 풀이 생성 (상성 분석 반영)
export const generateFortuneWithCompatibility = (
  iljin: IljinData,
  compatibility: CompatibilityResult,
  lukim: LukimCalculationResult | null,
  options?: FortuneGenerationOptions
): IljinFortune => {
  const { analysis } = compatibility;
  const fortuneScores = options?.fortuneScores;
  const grade: FortuneGrade = fortuneScores
    ? fortuneScores.grade
    : getFortuneGrade(compatibility.totalScore >= 20 ? 9 : 5);
  const gradeConfig = fortuneGradeSummary[grade];
  const tone = getGradeTone(grade);

  const tenGodKey = (options?.sipsinOfToday?.gan ??
    options?.sipsinOfToday?.ji ??
    null) as TenGodType | null;
  const tenGodMessage = getTenGodMessage(grade, tenGodKey) || "";

  const summary = lukim?.interpretation?.summary ?? gradeConfig.overview;

  const specialHarmonyText =
    analysis.specialHarmony.length > 0
      ? `특히 ${analysis.specialHarmony.join(", ")} 기운이 함께합니다.`
      : "";

  const general = [
    tenGodMessage,
    analysis.ganRelation,
    analysis.jiRelation,
    specialHarmonyText,
    analysis.daewoonEffect ? `대운 영향: ${analysis.daewoonEffect}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isVeryPositive = tone === "very_positive";
  const isPositive = tone === "positive" || tone === "very_positive";
  const isNegative = tone === "negative" || tone === "very_negative";

  const workFortune = isVeryPositive
    ? "업무에서 과감한 시도가 큰 성과로 이어집니다. 중요한 결정도 자신 있게 밀고 나가세요."
    : isPositive
    ? "업무가 순조롭게 풀립니다. 계획했던 일을 차근차근 실행하세요."
    : isNegative
    ? "업무에서는 변수에 대비해야 합니다. 급한 결정보다는 충분히 검토한 후 진행하세요."
    : "업무가 평소처럼 무난하게 진행됩니다. 기본에 충실하면 안정적인 흐름을 유지할 수 있습니다.";

  const loveFortune = isVeryPositive
    ? "인간관계에서 특별한 만남이나 진전이 기대됩니다. 진심을 담아 표현해 보세요."
    : isPositive
    ? "주변 사람들과 조화롭게 교류할 수 있습니다. 마음을 열고 대화를 나눠보세요."
    : isNegative
    ? "오해가 생기기 쉬운 날입니다. 말과 행동을 한 번 더 점검하세요."
    : "큰 변화 없이 평온한 흐름입니다. 기존 관계를 소중히 챙기는 것이 좋습니다.";

  const healthFortune = isVeryPositive
    ? "컨디션이 최상입니다. 활동량을 늘려도 무리가 없습니다."
    : isPositive
    ? "안정적인 컨디션을 유지할 수 있습니다. 규칙적인 생활을 이어가세요."
    : isNegative
    ? "피로가 쌓이기 쉬운 날입니다. 충분한 휴식과 수분 섭취가 필요합니다."
    : "컨디션이 다소 무거울 수 있습니다. 무리하지 말고 몸 상태를 세심히 살피세요.";

  const moneyFortune = isVeryPositive
    ? "재물운이 크게 상승합니다. 투자나 새로운 수익 기회를 적극적으로 검토해 보세요."
    : isPositive
    ? "수입과 지출이 안정적으로 관리됩니다. 다만 과한 지출은 피하세요."
    : isNegative
    ? "재정적인 변동성이 큽니다. 큰 지출이나 투자는 미루는 것이 좋습니다."
    : "재물 운이 다소 약할 수 있습니다. 예산을 다시 점검하고 지출을 조절하세요.";

  const relationsFortune = isVeryPositive
    ? "네트워크 확장이 기대됩니다. 새로운 연결이 큰 도움을 줄 수 있습니다."
    : isPositive
    ? "대인관계가 원만하게 흐릅니다. 협업이나 소통에 힘을 실어보세요."
    : isNegative
    ? "관계 갈등이 생기기 쉽습니다. 감정적으로 반응하지 않도록 주의하세요."
    : "조용한 흐름입니다. 꼭 필요한 소통만 정리하는 것이 좋습니다.";

  const documentsFortune = isVeryPositive
    ? "계약과 문서 작업이 모두 유리하게 진행됩니다. 중요한 서류도 자신 있게 처리하세요."
    : isPositive
    ? "문서 업무가 순조롭게 처리됩니다. 세부 사항만 다시 한 번 확인하세요."
    : isNegative
    ? "서류나 계약에서 실수가 나올 수 있습니다. 서두르지 말고 꼼꼼히 검토하세요."
    : "문서 업무가 부담스럽게 느껴질 수 있습니다. 체크리스트를 활용해 놓치는 부분이 없도록 하세요.";

  const advice = [
    analysis.daewoonEffect,
    isVeryPositive
      ? "이 기회를 놓치지 말고 적극적으로 움직이세요."
      : isPositive
      ? "기회를 현실로 만들 수 있게 한 걸음 더 나아가세요."
      : isNegative
      ? "무리한 확장은 피하고 리스크 관리를 우선하세요."
      : "균형 감각을 잃지 않도록 마음을 다스리세요.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    summary,
    general,
    work: workFortune,
    love: loveFortune,
    health: healthFortune,
    money: moneyFortune,
    relations: relationsFortune,
    documents: documentsFortune,
    advice,
    lucky: {
      direction: iljin.direction,
      color: iljin.color,
      number: iljin.number,
      time: iljin.time.good.join(", "),
    },
    avoid: {
      direction: iljin.direction === "東" ? "西" : "東",
      color: iljin.color === "청색" ? "빨간색" : "청색",
      time: iljin.time.bad.join(", "),
    },
    grade,
    scoreMeta: fortuneScores,
    tenGodKey,
  };
};

// 메인 서비스 함수
export const getTodayFortune = async (userInfo: {
  name: string;
  gender: "M" | "W";
  calendarType: "solar" | "lunar";
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}) => {
  const today = new Date();
  const iljin = generateIljinData(today);

  // 사용자 사주 계산 (음력이면 양력으로 변환)
  let birthDateObj: Date;
  if (userInfo.calendarType === "lunar") {
    try {
      const [yearStr, monthStr, dayStr] = userInfo.birthDate.split("-");
      const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
      const cal = new KoreanLunarCalendar();
      cal.setLunarDate(parseInt(yearStr), parseInt(monthStr), parseInt(dayStr), false);
      const solar = cal.getSolarCalendar();
      birthDateObj = new Date(
        `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}T${userInfo.birthTime || "12:00"}:00`
      );
    } catch {
      birthDateObj = new Date(`${userInfo.birthDate}T${userInfo.birthTime || "12:00"}:00`);
    }
  } else {
    birthDateObj = new Date(`${userInfo.birthDate}T${userInfo.birthTime || "12:00"}:00`);
  }
  const sajuResult = await getSajuDetails(birthDateObj, userInfo.gender);
  const userPillars = sajuResult.sajuData.pillars;
  const userDayGan = userPillars.day.gan;

  // PillarData를 Pillars 형식으로 변환
  const simplePillars = {
    year: userPillars.year.gan + userPillars.year.ji,
    month: userPillars.month.gan + userPillars.month.ji,
    day: userPillars.day.gan + userPillars.day.ji,
    hour: userPillars.hour.gan + userPillars.hour.ji,
  };

  // 1단계: 사용자 사주와 일진 상성 분석
  const compatibility = analyzeCompatibility(
    simplePillars,
    iljin,
    birthDateObj,
    userInfo.gender
  );

  // 기존 십성 계산
  const calcSipsin = (
    dayGan: string,
    target: string,
    type: "h" | "e"
  ): string | null => {
    if (!dayGan || !target) return null;
    const tableForType: { [key: string]: { [key: string]: string } } =
      SIPSIN_TABLE[type];
    return tableForType[dayGan]?.[target] || null;
  };

  const sipsinOfToday = {
    dayGan: userDayGan,
    gan: calcSipsin(userDayGan, iljin.gan, "h"),
    ji: calcSipsin(userDayGan, iljin.ji, "e"),
  };

  const fortuneScores = calculateFortuneScores({
    daewoon: sajuResult.sajuData.currentDaewoon,
    sewoon: sajuResult.sajuData.currentSewoon,
    sajuData: sajuResult.sajuData,
    todayIljinGanji: iljin.ganji,
    referenceDate: today,
  });

  const lukimResult = calculateLukimResult(
    userInfo.gender,
    {
      year: {
        gan: userPillars.year.gan,
        ji: userPillars.year.ji,
      },
    },
    iljin,
    today
  );

  // 상성 분석을 반영한 운세 생성
  const fortune = generateFortuneWithCompatibility(
    iljin,
    compatibility,
    lukimResult,
    {
      sipsinOfToday,
      fortuneScores,
    }
  );

  // 사주 기반 괘 계산
  const [birthYear, birthMonth, birthDay] = userInfo.birthDate
    .split("-")
    .map(Number);
  const birthHour = userInfo.birthTime
    ? parseInt(userInfo.birthTime.split(":")[0], 10)
    : undefined;
  const ichingResult = calcSajuIching({
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    userDayJi: userPillars.day.ji,
    iljinJi: iljin.ji,
    currentYear: today.getFullYear(),
    currentMonth: today.getMonth() + 1,
    currentDay: today.getDate(),
  });

  return {
    userInfo: {
      ...userInfo,
      timeUnknown: !userInfo.birthTime,
    },
    iljin,
    fortune,
    sipsinOfToday,
    compatibility, // 상성 분석 결과 추가
    lukim: lukimResult
      ? {
          name: lukimResult.interpretation?.name ?? "",
          value: lukimResult.total,
          summary: lukimResult.interpretation?.summary ?? "",
          components: lukimResult.components,
        }
      : null,
    fortuneScore: fortuneScores,
    iching: ichingResult,
    generatedAt: new Date().toISOString(),
  };
};
