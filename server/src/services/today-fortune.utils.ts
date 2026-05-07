import {
  CHEONGANHAP,
  CHEONGANCHUNG,
  SAMHAP,
  SAMHAPHWA,
  BANGHAP,
  BANGHAPHWA,
  YUKHAP,
  YUKCHUNG,
  YUKHYUNG,
  YUKPA,
  YUKAE,
} from "../data/relationship.data";
import { GAN_OHENG, JI_OHENG } from "../data/saju.data";
import {
  OHAENG_SAENGSAENG,
  OHAENG_SANGGEUK,
} from "../data/yongsin.data";
import type {
  AlignmentElementDetail,
  FortuneAlignmentDetail,
  FortuneGrade,
  FortuneScoreMeta,
  TenGodType,
  YongsinRole,
} from "../types/today-fortune";
import type { Daewoon } from "./daewoon.service";
import type { SewoonData } from "./sewoon.service";
import type { SajuData } from "../types/saju.d";
import { getWoolwoonForYearMonth } from "./woolwoon.service";
import { NAPEUM_OHENG_DATA } from "../hwa-eui/data/napeum-oheng.data";

const BRANCH_ORDER = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

const BRANCH_BASE_VALUES: Record<string, number> = {
  子: 1.0,
  丑: 0.7,
  寅: 0.8,
  卯: 0.9,
  辰: 0.7,
  巳: 0.9,
  午: 1.0,
  未: 0.7,
  申: 0.8,
  酉: 0.9,
  戌: 0.7,
  亥: 0.9,
};

const BRANCH_ELEMENT_MAP: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

const BRANCH_TIME_RANGES: Record<string, string> = {
  子: "23:00 – 01:00",
  丑: "01:00 – 03:00",
  寅: "03:00 – 05:00",
  卯: "05:00 – 07:00",
  辰: "07:00 – 09:00",
  巳: "09:00 – 11:00",
  午: "11:00 – 13:00",
  未: "13:00 – 15:00",
  申: "15:00 – 17:00",
  酉: "17:00 – 19:00",
  戌: "19:00 – 21:00",
  亥: "21:00 – 23:00",
};

const GAN_HANJA_TO_HANGUL: Record<string, string> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
};

const JI_HANJA_TO_HANGUL: Record<string, string> = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
};

const convertGanjiToHangul = (ganji: string | null | undefined): string | null => {
  if (!ganji || ganji.length < 2) return null;
  const gan = GAN_HANJA_TO_HANGUL[ganji[0]];
  const ji = JI_HANJA_TO_HANGUL[ganji[1]];
  if (!gan || !ji) return null;
  return `${gan}${ji}`;
};

const getNapeumElement = (ganji: string | null | undefined): string | null => {
  const hangulKey = convertGanjiToHangul(ganji);
  if (!hangulKey) return null;
  return NAPEUM_OHENG_DATA[hangulKey]?.oheng ?? null;
};

const deriveMainElement = (elements: string[]): string | null => {
  if (elements.length === 0) return null;
  const counts: Record<string, number> = {};
  elements.forEach((element) => {
    if (!element) return;
    counts[element] = (counts[element] ?? 0) + 1;
  });
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  const maxCount = Math.max(...entries.map(([, count]) => count));
  const candidates = entries
    .filter(([, count]) => count === maxCount)
    .map(([element]) => element);
  if (candidates.length === 1) {
    return candidates[0];
  }

  const producedCandidates = candidates.filter((candidate) =>
    elements.some((element) => OHAENG_SAENGSAENG[element] === candidate)
  );
  if (producedCandidates.length > 0) {
    return producedCandidates[0];
  }

  return candidates[0];
};

const matchElements = (a: string | null, b: string | null): number => {
  if (!a || !b) return 0;
  if (a === b) return 2;
  if (OHAENG_SAENGSAENG[a] === b) return 1;
  if (a === "土" || b === "土") return 0;
  if (OHAENG_SANGGEUK[b] === a) return -1;
  return 0;
};

const computeEventBonus = (branch: string, iljinBranch: string | null): number => {
  if (!iljinBranch) return 0;
  let bonus = 0;
  if (SAMHAP[branch]?.includes(iljinBranch)) bonus += 0.5;
  if (BANGHAP[branch]?.includes(iljinBranch)) bonus += 0.4;
  if (YUKHAP[branch] === iljinBranch) bonus += 0.3;
  if (YUKCHUNG[branch] === iljinBranch) bonus += 0.2;
  const hasMinorConflict =
    (YUKHYUNG[branch]?.includes(iljinBranch) ?? false) ||
    YUKPA[branch] === iljinBranch ||
    YUKAE[branch] === iljinBranch;
  if (hasMinorConflict) bonus += 0.1;
  return bonus;
};

const computeEventBonusAgainstBase = (
  branch: string | null,
  baseSet: Set<string>
): number => {
  if (!branch) return 0;
  let bonus = 0;
  const hasHap = YUKHAP[branch] && baseSet.has(YUKHAP[branch]!);
  if (hasHap) bonus += 0.3;
  const hasChung = YUKCHUNG[branch] && baseSet.has(YUKCHUNG[branch]!);
  if (hasChung) bonus += 0.2;
  const hasMinor =
    (YUKHYUNG[branch]?.some((partner) => baseSet.has(partner)) ?? false) ||
    (YUKPA[branch] ? baseSet.has(YUKPA[branch]!) : false) ||
    (YUKAE[branch] ? baseSet.has(YUKAE[branch]!) : false);
  if (hasMinor) bonus += 0.1;
  return bonus;
};

const ALPHA = 0.7;
const BETA = 0.3;

type GradeTone =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

interface RoleMap {
  primary?: string;
  hui?: string;
  han?: string;
  gi?: string;
  gu?: string;
}

interface AlignmentResult {
  totalScore: number;
  gan: AlignmentElementDetail;
  ji: AlignmentElementDetail;
}

interface RelationshipResult {
  detail?: {
    type: string;
    score: number;
    target: string;
  };
  score: number;
}

interface FortuneScoreParams {
  daewoon?: Daewoon | null;
  sewoon?: SewoonData | null;
  sajuData: SajuData;
  todayIljinGanji?: string | null;
  referenceDate?: Date;
}

const ROLE_SCORE_MAP: Record<YongsinRole, number> = {
  용신: 5,
  희신: 4,
  한신: 3,
  기신: 2,
  구신: 1,
};

const TEN_GOD_KEYS: TenGodType[] = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const invertRecord = (record: Record<string, string>) => {
  const inverted: Record<string, string> = {};
  Object.entries(record).forEach(([key, value]) => {
    inverted[value] = key;
  });
  return inverted;
};

const PRODUCER_MAP = invertRecord(OHAENG_SAENGSAENG);
const CONTROLLER_MAP = invertRecord(OHAENG_SANGGEUK);

const normalizeGan = (gan: string | undefined | null): string =>
  gan ? gan.trim() : "";

const normalizeJi = (ji: string | undefined | null): string =>
  ji ? ji.trim() : "";

const getElementFromGan = (gan: string): string | undefined =>
  GAN_OHENG[normalizeGan(gan)];

const getElementFromJi = (ji: string): string | undefined =>
  JI_OHENG[normalizeJi(ji)];

const deriveRoleMap = (primaryYongsin?: string | null): RoleMap => {
  if (!primaryYongsin) {
    return {};
  }
  const primaryElement = getElementFromGan(primaryYongsin);
  if (!primaryElement) {
    return {};
  }
  const hui = PRODUCER_MAP[primaryElement];
  const gi = CONTROLLER_MAP[primaryElement];
  const gu = gi ? PRODUCER_MAP[gi] : undefined;
  const han = gi ? CONTROLLER_MAP[gi] : undefined;

  return {
    primary: primaryElement,
    hui,
    han,
    gi,
    gu,
  };
};

const getRoleForElement = (element?: string, roles?: RoleMap): YongsinRole => {
  if (!element || !roles) return "기신";
  if (roles.primary && roles.primary === element) return "용신";
  if (roles.hui && roles.hui === element) return "희신";
  if (roles.han && roles.han === element) return "한신";
  if (roles.gi && roles.gi === element) return "기신";
  if (roles.gu && roles.gu === element) return "구신";
  return "기신";
};

const calculateAlignmentScore = (
  gan: string,
  ji: string,
  roles: RoleMap
): AlignmentResult => {
  const ganElement = getElementFromGan(gan);
  const jiElement = getElementFromJi(ji);

  const ganRole = getRoleForElement(ganElement, roles);
  const jiRole = getRoleForElement(jiElement, roles);

  const ganScore = ROLE_SCORE_MAP[ganRole];
  const jiScore = ROLE_SCORE_MAP[jiRole];
  const sameElementBonus =
    ganElement && jiElement && ganElement === jiElement ? 1 : 0;

  const totalScore = Math.min(ganScore + jiScore + sameElementBonus, 10);

  return {
    totalScore,
    gan: {
      value: gan,
      element: ganElement,
      role: ganRole,
      score: ganScore,
    },
    ji: {
      value: ji,
      element: jiElement,
      role: jiRole,
      score: jiScore,
    },
  };
};

const pickStrongestRelation = (
  relations: RelationshipResult["detail"][]
): RelationshipResult => {
  if (!relations || relations.length === 0) {
    return { score: 0 };
  }

  const normalized = relations.filter(
    (relation): relation is NonNullable<typeof relation> =>
      relation !== undefined && relation !== null
  );

  if (normalized.length === 0) {
    return { score: 0 };
  }

  const sorted = [...normalized].sort((a, b) => {
    const scoreA = a?.score ?? 0;
    const scoreB = b?.score ?? 0;
    const absDiff = Math.abs(scoreB) - Math.abs(scoreA);
    if (absDiff !== 0) return absDiff;
    return scoreB - scoreA; // 양수 우선
  });

  const best = sorted[0];
  return {
    detail: best,
    score: best?.score ?? 0,
  };
};

const evaluateJiRelationship = (
  targetJi: string,
  baseJis: string[]
): RelationshipResult => {
  if (!targetJi) return { score: 0 };

  const relations: RelationshipResult["detail"][] = [];
  const baseSet = new Set(baseJis.filter(Boolean));

  baseJis.forEach((baseJi) => {
    if (!baseJi) return;

    if (YUKHAP[targetJi] === baseJi) {
      relations.push({ type: "육합", score: 2, target: baseJi });
    }

    const samhapPartners = SAMHAP[targetJi];
    if (samhapPartners?.includes(baseJi)) {
      const fullInfo = SAMHAPHWA[targetJi];
      const isFull =
        fullInfo?.partners?.every((partner) => baseSet.has(partner)) ?? false;
      relations.push({
        type: isFull ? "삼합" : "삼합(반합)",
        score: isFull ? 2 : 1,
        target: baseJi,
      });
    }

    const banghapPartners = BANGHAP[targetJi];
    if (banghapPartners?.includes(baseJi)) {
      const fullInfo = BANGHAPHWA[targetJi];
      const isFull =
        fullInfo?.partners?.every((partner) => baseSet.has(partner)) ?? false;
      relations.push({
        type: isFull ? "방합" : "방합(반합)",
        score: isFull ? 2 : 1,
        target: baseJi,
      });
    }

    if (YUKCHUNG[targetJi] === baseJi) {
      relations.push({ type: "충", score: -2, target: baseJi });
    }

    if (YUKHYUNG[targetJi]?.includes(baseJi)) {
      relations.push({ type: "형", score: -2, target: baseJi });
    }

    if (YUKPA[targetJi] === baseJi) {
      relations.push({ type: "파", score: -1, target: baseJi });
    }

    if (YUKAE[targetJi] === baseJi) {
      relations.push({ type: "해", score: -1, target: baseJi });
    }
  });

  return pickStrongestRelation(relations);
};

const evaluateGanRelationship = (
  targetGan: string,
  baseGans: string[]
): RelationshipResult => {
  if (!targetGan) return { score: 0 };

  const relations: RelationshipResult["detail"][] = [];

  baseGans.forEach((baseGan) => {
    if (!baseGan) return;

    if (CHEONGANHAP[targetGan] === baseGan) {
      relations.push({ type: "천간합", score: 0.5, target: baseGan });
    }

    if (CHEONGANCHUNG[targetGan] === baseGan) {
      relations.push({ type: "천간충", score: -0.5, target: baseGan });
    }
  });

  return pickStrongestRelation(relations);
};

const calculateCollapseComponent = (
  targetGanji: string | null,
  sajuData: SajuData
): { score: number; element: string | null } => {
  if (!targetGanji) return { score: 0, element: null };

  const baseGans = [
    sajuData.pillars.year.gan,
    sajuData.pillars.month.gan,
    sajuData.pillars.day.gan,
    sajuData.pillars.hour.gan,
  ];
  const baseJis = [
    sajuData.pillars.year.ji,
    sajuData.pillars.month.ji,
    sajuData.pillars.day.ji,
    sajuData.pillars.hour.ji,
  ];

  const baseGanSet = new Set(baseGans);
  const baseJiSet = new Set(baseJis);

  const gan = targetGanji[0] ?? "";
  const ji = targetGanji[1] ?? "";

  let score = 0;

  // 지지 양성 관계
  const yukhapPartner = YUKHAP[ji];
  if (yukhapPartner && baseJiSet.has(yukhapPartner)) {
    score += 2.0;
  }

  const samhapPartners = SAMHAP[ji];
  if (samhapPartners && samhapPartners.length > 0) {
    const matches = samhapPartners.filter((partner) => baseJiSet.has(partner));
    if (matches.length === samhapPartners.length) {
      score += 2.0;
    } else if (matches.length > 0) {
      score += 1.0;
    }
  }

  const banghapPartners = BANGHAP[ji];
  if (banghapPartners && banghapPartners.length > 0) {
    const full = banghapPartners.every((partner) => baseJiSet.has(partner));
    if (full) {
      score += 2.0;
    }
  }

  // 지지 부정 관계
  if (YUKCHUNG[ji] && baseJiSet.has(YUKCHUNG[ji]!)) {
    score -= 0.2;
  }

  if (YUKHYUNG[ji]) {
    const matches = YUKHYUNG[ji].filter((partner) => baseJiSet.has(partner)).length;
    if (matches > 0) {
      score -= 0.2;
    }
  }

  if (YUKPA[ji] && baseJiSet.has(YUKPA[ji]!)) {
    score -= 0.1;
  }

  if (YUKAE[ji] && baseJiSet.has(YUKAE[ji]!)) {
    score -= 0.1;
  }

  // 천간 관계
  if (CHEONGANHAP[gan] && baseGanSet.has(CHEONGANHAP[gan]!)) {
    score += 0.5;
  }

  if (CHEONGANCHUNG[gan] && baseGanSet.has(CHEONGANCHUNG[gan]!)) {
    score -= 0.5;
  }

  const targetElement = GAN_OHENG[gan];
  baseGans.forEach((baseGan) => {
    const baseElement = GAN_OHENG[baseGan];
    if (!targetElement || !baseElement) return;
    if (OHAENG_SANGGEUK[targetElement] === baseElement) {
      score -= 0.5;
    } else if (OHAENG_SANGGEUK[baseElement] === targetElement) {
      score -= 0.5;
    }
  });

  const element = JI_OHENG[ji] ?? null;

  return {
    score,
    element,
  };
};

const ENTANGLEMENT_WEIGHTS = {
  year: 0.4,
  month: 0.35,
  day: 0.25,
};

const ENTANGLEMENT_OFFSET = 0.7;
const ENTANGLEMENT_SCALE = 2.0;

const computeEntanglementData = (
  options: {
    sewoonGanji: string | null;
    wolwoonGanji: string | null;
    iljinGanji: string | null;
    mainElement: string | null;
    mainStrength: number;
    baseJis: string[];
    dayGan?: string;
    monthJi?: string;
    dayJi?: string;
  }
): {
  mainElement: string | null;
  externalElement: string | null;
  mainStrength: number;
  connectionStrength: number;
  resonanceStrength: number;
  components: Array<{
    type: string;
    label: string;
    ganji: string | null;
    branch: string | null;
    element: string | null;
    weight: number;
    match: number;
    event: number;
    score: number;
    range?: string;
  }>;
} => {
  const { sewoonGanji, wolwoonGanji, iljinGanji, mainElement, mainStrength, baseJis, dayGan, monthJi, dayJi } = options;
  const baseJiSet = new Set(baseJis.filter(Boolean));

  const components: Array<{
    type: string;
    label: string;
    ganji: string | null;
    branch: string | null;
    element: string | null;
    weight: number;
    match: number;
    event: number;
    score: number;
    range?: string;
  }> = [];

  const pushComponent = (
    type: string,
    label: string,
    weight: number,
    ganji: string | null,
    branch: string | null,
    element: string | null,
    range?: string
  ) => {
    if (!branch) {
      components.push({
        type,
        label,
        ganji,
        branch: null,
        element,
        weight,
        match: 0,
        event: 0,
        score: 0,
        range,
      });
      return;
    }

    const match = matchElements(element, mainElement);
    const event = computeEventBonusAgainstBase(branch, baseJiSet);
    const score = weight * (ALPHA * match + BETA * event);

    components.push({
      type,
      label,
      ganji,
      branch,
      element,
      weight,
      match,
      event,
      score,
      range,
    });
  };

  const sewoonBranch = sewoonGanji ? sewoonGanji[1] : null;
  const sewoonElement =
    getNapeumElement(sewoonGanji) ?? (sewoonBranch ? BRANCH_ELEMENT_MAP[sewoonBranch] : null);
  pushComponent("세운", "세운", ENTANGLEMENT_WEIGHTS.year, sewoonGanji, sewoonBranch, sewoonElement);

  const wolwoonBranch = wolwoonGanji ? wolwoonGanji[1] : null;
  const wolwoonElement = getNapeumElement(wolwoonGanji) ?? (wolwoonBranch ? BRANCH_ELEMENT_MAP[wolwoonBranch] : null);
  pushComponent("월운", "월운", ENTANGLEMENT_WEIGHTS.month, wolwoonGanji, wolwoonBranch, wolwoonElement);

  const iljinBranch = iljinGanji ? iljinGanji[1] : null;
  const iljinElement = getNapeumElement(iljinGanji) ?? (iljinBranch ? BRANCH_ELEMENT_MAP[iljinBranch] : null);
  pushComponent("일운", "일운", ENTANGLEMENT_WEIGHTS.day, iljinGanji, iljinBranch, iljinElement);

  const totalScore = components.reduce((sum, component) => sum + component.score, 0);
  const connectionStrength = clamp(
    (totalScore + ENTANGLEMENT_OFFSET) / ENTANGLEMENT_SCALE,
    0,
    1
  );
  const resonanceStrength = clamp(
    0.6 * connectionStrength + 0.4 * mainStrength,
    0,
    1
  );

  const dayGanElement = dayGan ? GAN_OHENG[dayGan] ?? null : null;
  const monthJiElement = monthJi ? JI_OHENG[monthJi] ?? null : null;
  const dayJiElement = dayJi ? JI_OHENG[dayJi] ?? null : null;
  const externalWeights: Array<{ element: string | null; weight: number }> = [
    { element: dayGanElement, weight: 0.40 },
    { element: monthJiElement, weight: 0.35 },
    { element: dayJiElement, weight: 0.25 },
  ];
  const externalCounts: Record<string, number> = {};
  externalWeights.forEach(({ element, weight }) => {
    if (element) {
      externalCounts[element] = (externalCounts[element] ?? 0) + weight;
    }
  });
  const externalElement = Object.entries(externalCounts).length > 0
    ? Object.entries(externalCounts).reduce((a, b) => (a[1] >= b[1] ? a : b))[0]
    : null;

  return {
    mainElement,
    externalElement,
    mainStrength,
    connectionStrength,
    resonanceStrength,
    components,
  };
};

const buildAlignmentDetail = (
  label: "대운" | "세운" | "월운" | "일운",
  ganji: string | null,
  roles: RoleMap,
  baseGans: string[],
  baseJis: string[]
): FortuneAlignmentDetail | null => {
  if (!ganji) return null;
  const gan = ganji[0] ?? "";
  const ji = ganji[1] ?? "";

  const alignment = calculateAlignmentScore(gan, ji, roles);
  const jiRelation = evaluateJiRelationship(ji, baseJis);
  const ganRelation = evaluateGanRelationship(gan, baseGans);

  const relationshipScore = clamp(
    (jiRelation.score ?? 0) + (ganRelation.score ?? 0),
    -3,
    3
  );

  return {
    label,
    ganji,
    alignmentScore: alignment.totalScore,
    relationshipScore,
    totalScore: clamp(alignment.totalScore + relationshipScore, 0, 10),
    gan: alignment.gan,
    ji: alignment.ji,
    relationship: jiRelation.detail,
    ganRelationship: ganRelation.detail,
  };
};

export const getFortuneGrade = (score: number): FortuneGrade => {
  if (score >= 9) return "대길";
  if (score >= 7) return "길";
  if (score >= 5) return "평";
  if (score >= 3) return "흉";
  return "대흉";
};

export const calculateFortuneScores = ({
  daewoon,
  sewoon,
  sajuData,
  todayIljinGanji,
  referenceDate,
}: FortuneScoreParams): FortuneScoreMeta => {
  const baseGans = [
    sajuData.pillars.year.gan,
    sajuData.pillars.month.gan,
    sajuData.pillars.day.gan,
    sajuData.pillars.hour.gan,
  ];
  const baseJis = [
    sajuData.pillars.year.ji,
    sajuData.pillars.month.ji,
    sajuData.pillars.day.ji,
    sajuData.pillars.hour.ji,
  ];

  const eokbuYongsin = sajuData.yongsin?.allAnalyses?.find(a => a.tier === 1)?.yongsin;
  const johuYongsin = sajuData.yongsin?.allAnalyses?.find(a => a.tier === 2)?.yongsin;
  const roles = deriveRoleMap(eokbuYongsin || johuYongsin);

  const daewoonDetail = daewoon
    ? buildAlignmentDetail("대운", daewoon.ganji ?? null, roles, baseGans, baseJis)
    : null;

  const sewoonDetail = sewoon
    ? buildAlignmentDetail("세운", sewoon.ganji ?? null, roles, baseGans, baseJis)
    : null;

  const refDate = referenceDate ?? new Date();
  const referenceYear = refDate.getFullYear();
  const referenceMonth = refDate.getMonth() + 1;
  const wolwoonGanji = getWoolwoonForYearMonth(
    referenceYear,
    referenceMonth,
    sajuData.pillars.day.gan
  ).ganji;

  const wolwoonDetail = wolwoonGanji
    ? buildAlignmentDetail("월운", wolwoonGanji, roles, baseGans, baseJis)
    : null;

  const iljinDetail = todayIljinGanji
    ? buildAlignmentDetail("일운", todayIljinGanji, roles, baseGans, baseJis)
    : null;

  const daewoonAlignment = daewoonDetail?.alignmentScore ?? 5;
  const sewoonAlignment = sewoonDetail?.alignmentScore ?? 5;
  const wolwoonAlignment = wolwoonDetail?.alignmentScore ?? 5;
  const iljinAlignment = iljinDetail?.alignmentScore ?? 5;
  const daewoonRelation = daewoonDetail?.relationshipScore ?? 0;
  const sewoonRelation = sewoonDetail?.relationshipScore ?? 0;
  const wolwoonRelation = wolwoonDetail?.relationshipScore ?? 0;
  const iljinRelation = iljinDetail?.relationshipScore ?? 0;

  const collapseWolwoon = calculateCollapseComponent(wolwoonGanji, sajuData);
  const collapseIljin = calculateCollapseComponent(todayIljinGanji ?? null, sajuData);
  const sewoonElement = getNapeumElement(sewoon?.ganji ?? null);
  const wolwoonElement = getNapeumElement(wolwoonGanji);
  const iljinElement = getNapeumElement(todayIljinGanji ?? null);
  const mainElement = deriveMainElement(
    [sewoonElement, wolwoonElement, iljinElement].filter(Boolean) as string[]
  );

  const totalScore = clamp(
    0.40 * daewoonAlignment +
      0.30 * sewoonAlignment +
      0.18 * wolwoonAlignment +
      0.12 * iljinAlignment +
      0.40 * daewoonRelation +
      0.30 * sewoonRelation +
      0.18 * wolwoonRelation +
      0.12 * iljinRelation,
    0,
    10
  );

  const mainStrength = clamp(totalScore / 10, 0, 1);
  const entanglement = computeEntanglementData({
    sewoonGanji: sewoon?.ganji ?? null,
    wolwoonGanji,
    iljinGanji: todayIljinGanji ?? null,
    mainElement,
    mainStrength,
    baseJis,
    dayGan: sajuData.pillars.day.gan,
    monthJi: sajuData.pillars.month.ji,
    dayJi: sajuData.pillars.day.ji,
  });

  const iljinBranch = todayIljinGanji ? todayIljinGanji[1] : null;
  const collapseSlotsDetailed = BRANCH_ORDER.map((branch) => {
    const element = BRANCH_ELEMENT_MAP[branch];
    const baseValue = BRANCH_BASE_VALUES[branch] ?? 0;
    const matchScore = matchElements(element, mainElement ?? null);
    const eventBonus = computeEventBonus(branch, iljinBranch);
    const eventValue = baseValue + eventBonus;
    const value = ALPHA * matchScore + BETA * eventValue;
    return {
      branch,
      element,
      value,
      match: matchScore,
      base: baseValue,
      bonus: eventBonus,
      range: BRANCH_TIME_RANGES[branch],
    };
  });

  const maxSlotValue = collapseSlotsDetailed.reduce(
    (max, slot) => (slot.value > max ? slot.value : max),
    Number.NEGATIVE_INFINITY
  );
  const topBranches = maxSlotValue > 0
    ? collapseSlotsDetailed
        .filter((slot) => slot.value === maxSlotValue)
        .map((slot) => slot.branch)
    : [];

  return {
    finalScore: totalScore,
    grade: getFortuneGrade(totalScore),
    breakdown: {
      daewoon: daewoonDetail,
      sewoon: sewoonDetail,
      wolwoon: wolwoonDetail,
      iljin: iljinDetail,
    },
    collapse: {
      wolwoon: collapseWolwoon,
      iljin: collapseIljin,
      mainElement,
      slots: collapseSlotsDetailed,
      topBranches,
    },
    entanglement,
  };
};

export const fortuneGradeSummary: Record<
  FortuneGrade,
  {
    overview: string;
    tone: GradeTone;
    tenGod: Record<TenGodType, string>;
  }
> = {
  대길: {
    overview:
      "오늘은 큰 흐름이 모두 당신을 돕습니다. 과감하게 움직여도 좋은 날입니다.",
    tone: "very_positive",
    tenGod: {
      비견: "동료와의 협업이 폭발력을 더합니다. 주도권을 놓지 마세요.",
      겁재: "경쟁 속에서도 당신의 진가가 드러납니다. 과감한 승부수를 두세요.",
      식신: "아이디어가 현실이 됩니다. 실무에 집중하면 성과가 큽니다.",
      상관: "표현력이 최고조입니다. 대중 앞에서 자신감을 드러내세요.",
      편재: "예상치 못한 수익과 기회가 다가옵니다. 유연한 투자 감각이 빛납니다.",
      정재: "안정적인 수입과 누적된 신뢰가 결실을 맺습니다. 계획대로 밀고 가세요.",
      편관: "도전적인 과제가 고속 성장의 발판이 됩니다. 책임감을 즐기세요.",
      정관: "리더십이 인정받는 날입니다. 원칙을 지키면 더 크게 인정받습니다.",
      편인: "호기심이 풍성한 인사이트로 이어집니다. 새로운 배움을 시작해 보세요.",
      정인: "조언자들의 도움과 귀인이 연결됩니다. 겸손하게 배우면 길이 열립니다.",
    },
  },
  길: {
    overview:
      "전반적으로 순조로운 하루입니다. 안정 속에서 한 걸음 더 나아가세요.",
    tone: "positive",
    tenGod: {
      비견: "주변과 보조를 맞추면 자연스럽게 성과가 납니다.",
      겁재: "경쟁이 자극이 됩니다. 과열만 피하면 승산이 큽니다.",
      식신: "차분히 실행하면 실속 있는 결과를 얻습니다.",
      상관: "센 감각을 적절히 조절해 지혜롭게 표현해 보세요.",
      편재: "빠른 판단이 돋보입니다. 다만 무리한 투자는 피하세요.",
      정재: "꾸준함이 빛납니다. 기존 거래처 관리에 집중해도 좋습니다.",
      편관: "긴장감이 있으나 통제 가능한 수준입니다. 책임감이 힘이 됩니다.",
      정관: "규칙과 절차를 지키면 신뢰도가 올라갑니다.",
      편인: "새로운 공부나 취미가 좋은 자극을 줍니다.",
      정인: "멘토와의 대화에서 유용한 힌트를 얻습니다.",
    },
  },
  평: {
    overview: "무난한 흐름입니다. 기복이 적으니 기본기에 집중하세요.",
    tone: "neutral",
    tenGod: {
      비견: "동료와 균형을 유지하세요. 지나친 양보나 고집은 피하는 게 좋습니다.",
      겁재: "경쟁보다는 협업이 더 유리한 날입니다.",
      식신: "루틴을 지키면 무탈합니다. 욕심만 줄이면 됩니다.",
      상관: "말실수에 주의하세요. 표현은 부드럽게, 내용은 분명하게.",
      편재: "소소한 수입은 기대할 만하지만 큰 기회는 다음을 노려보세요.",
      정재: "지출과 수입을 점검하기 좋은 시기입니다.",
      편관: "작은 스트레스가 있으나 충분히 관리할 수 있습니다.",
      정관: "규범을 지키되 융통성도 잃지 않도록 신경 쓰세요.",
      편인: "새 아이디어는 초안만 잡고 실행은 보류하는 편이 안정적입니다.",
      정인: "배움에 집중하면 마음이 안정됩니다.",
    },
  },
  흉: {
    overview:
      "기운이 불안정합니다. 무리한 확장은 피하고 방어적으로 움직이세요.",
    tone: "negative",
    tenGod: {
      비견: "사소한 다툼에 주의하세요. 감정 관리가 핵심입니다.",
      겁재: "경쟁에서 무리하면 손해가 큽니다. 적당히 물러나세요.",
      식신: "컨디션이 떨어질 수 있습니다. 쉬어가는 날로 삼으세요.",
      상관: "말이 화근이 되기 쉽습니다. 핵심만 간결히 전하세요.",
      편재: "충동 소비나 무리한 투자에 신중하세요.",
      정재: "예산을 재조정하고 지출을 최소화하세요.",
      편관: "외부 압박이 거셀 수 있습니다. 원칙을 재정비하세요.",
      정관: "상사의 눈치를 볼 수 있습니다. 보고 체계를 꼼꼼히 따르세요.",
      편인: "정보 과잉으로 흐트러지기 쉽습니다. 중요도에 따라 정리하세요.",
      정인: "조언을 남용하면 오히려 혼란스러울 수 있습니다. 스스로 판단을 확인하세요.",
    },
  },
  대흉: {
    overview:
      "에너지가 크게 꺾이는 날입니다. 위험 요소를 피하고 컨디션을 지키세요.",
    tone: "very_negative",
    tenGod: {
      비견: "주위와 격돌하기 쉬우니 거리를 두고 혼자 정리하는 시간을 가지세요.",
      겁재: "무리한 경쟁은 큰 손실로 이어질 수 있습니다. 과감히 철수하는 것도 방법입니다.",
      식신: "체력 관리가 최우선입니다. 무조건 휴식과 건강을 챙기세요.",
      상관: "거친 표현은 돌이킬 수 없는 갈등을 부릅니다. 침묵이 금입니다.",
      편재: "재정적 리스크가 큽니다. 모든 계약과 투자에 제동을 거세요.",
      정재: "기존 자산을 지키는 데 집중하고 새로운 지출은 미루세요.",
      편관: "권위와 부딪히기 쉬운 날입니다. 먼저 한 발 물러서세요.",
      정관: "규칙을 어기면 큰 불이익이 따릅니다. 절차를 철저히 지키세요.",
      편인: "잡념이 심해지기 쉬우니 정보 다이어트를 하세요.",
      정인: "조언자에게 의존을 줄이고 내면 정리에 집중하세요.",
    },
  },
};

export const getGradeTone = (grade: FortuneGrade): GradeTone =>
  fortuneGradeSummary[grade].tone;

export const getTenGodMessage = (
  grade: FortuneGrade,
  tenGod?: string | null
): string => {
  if (!tenGod || !TEN_GOD_KEYS.includes(tenGod as TenGodType)) {
    return "";
  }
  return fortuneGradeSummary[grade].tenGod[tenGod as TenGodType] ?? "";
};

