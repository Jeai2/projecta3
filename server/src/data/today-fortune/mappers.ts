// server/src/data/today-fortune/mappers.ts
// 오늘의 운세 전용: 해석 데이터 → 요약 신호 구조로 매핑하는 빌더/유틸

import { SIPSIN_TABLE } from "../saju.data";

export type Ohaeng = "木" | "火" | "土" | "金" | "水";

// 간지 오행 매핑(필요 최소)
const GAN_TO_OHAENG: Record<string, Ohaeng> = {
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
const JI_TO_OHAENG: Record<string, Ohaeng> = {
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

type Pillars = {
  day: { gan: string; ji: string };
  month: { gan: string; ji: string };
};

export function calcSipsin(
  dayGan: string,
  target: string,
  type: "h" | "e"
): string | null {
  if (!dayGan || !target) return null;
  const tableForType: { [key: string]: { [key: string]: string } } =
    SIPSIN_TABLE[type];
  return tableForType[dayGan]?.[target] || null;
}

export function mapSipsinForToday(params: {
  dayGan: string;
  pillars: Pillars;
  today: { gan: string; ji: string };
}) {
  const { dayGan, pillars, today } = params;
  return {
    byDayGan: {
      withTodayGan: calcSipsin(dayGan, today.gan, "h"),
      withTodayJi: calcSipsin(dayGan, today.ji, "e"),
    },
    byDayJi: {
      base: pillars.day.ji,
      withTodayGan: calcSipsin(dayGan, today.gan, "h"),
      withTodayJi: calcSipsin(dayGan, today.ji, "e"),
    },
    byMonthGan: {
      base: pillars.month.gan,
      withTodayGan: calcSipsin(dayGan, today.gan, "h"),
      withTodayJi: calcSipsin(dayGan, today.ji, "e"),
    },
    byMonthJi: {
      base: pillars.month.ji,
      withTodayGan: calcSipsin(dayGan, today.gan, "h"),
      withTodayJi: calcSipsin(dayGan, today.ji, "e"),
    },
  };
}

export function mapOhengInfluence(params: {
  dayGan: string;
  today: { gan: string; ji: string };
}) {
  const dayGanOh = GAN_TO_OHAENG[params.dayGan];
  const todayGanOh = GAN_TO_OHAENG[params.today.gan];
  const todayJiOh = JI_TO_OHAENG[params.today.ji];

  const rel = (a?: Ohaeng, b?: Ohaeng): "生" | "剋" | "比" | "無" => {
    if (!a || !b) return "無";
    if (a === b) return "比"; // 동기/같은 기운
    // 상생: 木→火→土→金→水→木
    const order: Ohaeng[] = ["木", "火", "土", "金", "水"];
    const ia = order.indexOf(a),
      ib = order.indexOf(b);
    if (ia > -1 && ib > -1 && (ia + 1) % 5 === ib) return "生";
    // 상극(단순): 木剋土, 土剋水, 水剋火, 火剋金, 金剋木
    const ke: Record<Ohaeng, Ohaeng> = {
      木: "土",
      土: "水",
      水: "火",
      火: "金",
      金: "木",
    };
    if (ke[a] === b) return "剋";
    return "無";
  };

  return {
    dayGanToTodayGan: rel(dayGanOh, todayGanOh),
    dayGanToTodayJi: rel(dayGanOh, todayJiOh),
  };
}

export function mapJijiRelations(params: {
  todayJi: string;
  pillars: { year?: string; month?: string; day?: string; hour?: string };
}) {
  // 지지 관계 규칙은 별도 해석 데이터에서 매핑 예정. 스켈레톤만 반환.
  return {
    hits: [] as Array<{
      basePillar: "년" | "월" | "일" | "시";
      relation: string; // 합/충/형/파/해 등
      with: string; // 대상 지지
      note?: string;
    }>,
  };
}

export function buildSummaryBase(params: {
  date: string;
  iljin: { gan: string; ji: string; ohaeng: { gan: Ohaeng; ji: Ohaeng } };
  pillars: Pillars;
  dayGan: string;
}) {
  const sipsin = mapSipsinForToday({
    dayGan: params.dayGan,
    pillars: params.pillars,
    today: { gan: params.iljin.gan, ji: params.iljin.ji },
  });
  const oheng = mapOhengInfluence({
    dayGan: params.dayGan,
    today: params.iljin,
  });
  const relations = mapJijiRelations({
    todayJi: params.iljin.ji,
    pillars: {
      year: undefined,
      month: params.pillars.month.ji,
      day: params.pillars.day.ji,
      hour: undefined,
    },
  });

  // --- 임시 관법: 십성/오행 신호를 간단 pros/cons로 정리 ---
  const SIPSIN_TONE: Record<
    string,
    { tone: "pro" | "con" | "neutral"; hint: string }
  > = {
    정인: { tone: "pro", hint: "지원·안정·학습" },
    편인: { tone: "neutral", hint: "직관·연구" },
    비견: { tone: "neutral", hint: "동료·협력" },
    겁재: { tone: "con", hint: "경쟁·소모 주의" },
    식신: { tone: "pro", hint: "생산성·건강관리" },
    상관: { tone: "con", hint: "표현 과함 주의" },
    편재: { tone: "pro", hint: "기회·외연확장" },
    정재: { tone: "pro", hint: "안정 수익" },
    편관: { tone: "con", hint: "압박·규율" },
    정관: { tone: "neutral", hint: "규범·신뢰" },
  };

  const signals = { pros: [] as string[], cons: [] as string[] };

  const pushSipsinSignal = (
    label: string | null | undefined,
    where: string
  ) => {
    if (!label) return;
    const meta = SIPSIN_TONE[label];
    if (!meta) return;
    const text = `${where} ${label} (${meta.hint})`;
    if (meta.tone === "pro") signals.pros.push(text);
    else if (meta.tone === "con") signals.cons.push(text);
  };

  // 오늘 천간/지지 십성 신호(일간 기준)
  pushSipsinSignal(sipsin.byDayGan.withTodayGan, "오늘 천간");
  pushSipsinSignal(sipsin.byDayGan.withTodayJi, "오늘 지지");

  // 오행 상호작용을 간단 신호로 변환
  const OH_TEXT: Record<
    "生" | "剋" | "比" | "無",
    { tone: "pro" | "con" | "neutral"; text: string }
  > = {
    生: { tone: "pro", text: "일간 기운 보강(상생)" },
    比: { tone: "neutral", text: "동기·무난" },
    剋: { tone: "con", text: "부하·갈등(상극)" },
    無: { tone: "neutral", text: "특이 신호 약함" },
  };
  const oh1 = OH_TEXT[oheng.dayGanToTodayGan];
  const oh2 = OH_TEXT[oheng.dayGanToTodayJi];
  if (oh1)
    (oh1.tone === "pro"
      ? signals.pros
      : oh1.tone === "con"
      ? signals.cons
      : signals.pros
    ).push(`천간 상호작용: ${oh1.text}`);
  if (oh2)
    (oh2.tone === "pro"
      ? signals.pros
      : oh2.tone === "con"
      ? signals.cons
      : signals.pros
    ).push(`지지 상호작용: ${oh2.text}`);

  return {
    date: params.date,
    iljin: params.iljin,
    pillars: {
      dayGan: params.pillars.day.gan,
      dayJi: params.pillars.day.ji,
      monthGan: params.pillars.month.gan,
      monthJi: params.pillars.month.ji,
    },
    sipsin,
    oheng,
    relations,
    signals,
  };
}
