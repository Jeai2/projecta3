import { JI } from "../data/saju.data";
import {
  getLukimInterpretation,
  type LukimInterpretation,
  type LukimKeyword,
} from "../data/lukim-interpretations";
import { getDayGanji } from "./saju.service";

const LUKIM_VALUE_MAP: Record<string, number> = {
  甲: 9,
  己: 9,
  子: 9,
  午: 9,
  갑: 9,
  기: 9,
  자: 9,
  오: 9,
  乙: 8,
  庚: 8,
  丑: 8,
  未: 8,
  을: 8,
  경: 8,
  축: 8,
  미: 8,
  丙: 7,
  辛: 7,
  寅: 7,
  申: 7,
  병: 7,
  신: 7,
  인: 7,
  丁: 6,
  壬: 6,
  卯: 6,
  酉: 6,
  정: 6,
  임: 6,
  묘: 6,
  유: 6,
  戊: 5,
  癸: 5,
  辰: 5,
  戌: 5,
  무: 5,
  계: 5,
  진: 5,
  술: 5,
  巳: 4,
  亥: 4,
  사: 4,
  해: 4,
};

type DansiComponentType = "birthYearGan" | "birthYearJi" | "dayGan" | "hourJi";

export interface DansiComponentDetail {
  type: DansiComponentType;
  label: string;
  symbol: string;
  value: number;
}

export interface DansiCalculationResult {
  total: number;
  interpretation: LukimInterpretation;
  components: DansiComponentDetail[];
}

export interface DansiCalculationInput {
  gender: "M" | "W";
  birthYear: {
    gan: string;
    ji: string;
  };
  referenceDate: Date;
}

const KEYWORD_PATTERNS: Array<{ keyword: LukimKeyword; pattern: RegExp }> = [
  { keyword: "breakup", pattern: /이별|헤어|재회|전\s*(남친|여친|애인)|차였|차임|차단|미련/ },
  { keyword: "marriage", pattern: /결혼|이혼|약혼|혼사|상견례|파혼|재혼|배우자/ },
  { keyword: "pregnancy", pattern: /임신|출산|유산|난임/ },
  { keyword: "illness", pattern: /건강|병|수술|입원|질환|통증|검진|재활/ },
  { keyword: "lawsuit", pattern: /소송|재판|고소|고발|판결|송사|손해배상|내용증명/ },
  { keyword: "moving", pattern: /이사|이민|거주지|전세|월세|이삿날|터전/ },
  { keyword: "jobSearch", pattern: /취업|구직|면접|채용|입사|합격/ },
  { keyword: "career", pattern: /이직|퇴사|직장|진로|승진|해고|커리어|전직/ },
  { keyword: "business", pattern: /사업|창업|개업|경영|동업|매매|거래처|폐업/ },
  { keyword: "money", pattern: /돈|금전|재물|투자|주식|코인|복권|대출|채무|자산/ },
  { keyword: "family", pattern: /가족|부모|자녀|형제|가정|육아|집안/ },
  { keyword: "exam", pattern: /시험|수능|자격증|임용|고시|입시|성적/ },
  { keyword: "travel", pattern: /여행|출장|출행|해외/ },
  { keyword: "lostItem", pattern: /잃어버|분실|도난|물건\s*찾/ },
  { keyword: "missingPerson", pattern: /가출|행방|실종|사람\s*찾/ },
  { keyword: "waitingPerson", pattern: /기다리는\s*사람|연락\s*(올까|오나|와)|소식\s*(올까|오나|와)/ },
  { keyword: "love", pattern: /사랑|짝사랑|썸|고백|연애|애인|남친|여친|남자친구|여자친구|데이트|인연/ },
  { keyword: "psychology", pattern: /우울|불안|공황|공허|번아웃|무기력|스트레스|외로/ },
  { keyword: "talent", pattern: /재능|적성|예술|명예|귀인|운의\s*흐름/ },
];

function getLukimNumericValue(symbol: string): number | null {
  return LUKIM_VALUE_MAP[symbol] ?? null;
}

function getHourBranchSymbol(date: Date): string {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const hourJiIndex = Math.floor(((totalMinutes + 30) % 1440) / 120);
  return JI[hourJiIndex];
}

export function calculateDansiResult(input: DansiCalculationInput): DansiCalculationResult | null {
  const birthSymbol = input.gender === "M" ? input.birthYear.gan : input.birthYear.ji;
  const dayGan = getDayGanji(input.referenceDate)[0];
  const hourBranch = getHourBranchSymbol(input.referenceDate);
  const components: DansiComponentDetail[] = [
    {
      type: input.gender === "M" ? "birthYearGan" : "birthYearJi",
      label: input.gender === "M" ? "생년간" : "생년지",
      symbol: birthSymbol,
      value: getLukimNumericValue(birthSymbol) ?? 0,
    },
    {
      type: "dayGan",
      label: "점일간",
      symbol: dayGan,
      value: getLukimNumericValue(dayGan) ?? 0,
    },
    {
      type: "hourJi",
      label: "점시지",
      symbol: hourBranch,
      value: getLukimNumericValue(hourBranch) ?? 0,
    },
  ];

  if (components.some((component) => component.value === 0)) return null;

  const total = components.reduce((sum, component) => sum + component.value, 0);
  const interpretation = getLukimInterpretation(total);
  return interpretation ? { total, interpretation, components } : null;
}

export function findDansiKeyword(message: string): LukimKeyword | undefined {
  return KEYWORD_PATTERNS.find(({ pattern }) => pattern.test(message))?.keyword;
}

export function buildDansiInsight(interpretation: LukimInterpretation, message: string): string {
  const keyword = findDansiKeyword(message);
  const topicReading = keyword ? interpretation.byKeyword?.[keyword] : undefined;
  const forbiddenExpressions = interpretation.mookseol?.forbiddenExpressions?.join(" / ");
  const deepenWhen = interpretation.deepenWhen?.join(" / ");

  return `[육임단시점 - 현재 상담의 바탕]
이 자료는 사용자의 현재 흐름을 가볍게 짚기 위한 내부 근거다.
- 사용자에게 원괘 이름, 한자명, 계산값, 계산 방법을 노출하지 마.
- 출력용 표상은 필요할 때만 자연스러운 비유로 사용해: ${interpretation.outputName ?? "표상 없음"}
- 큰 방향: ${interpretation.direction ?? "판단 보류"}
- 기본 흐름: ${interpretation.reading?.basic ?? interpretation.summary}
${topicReading ? `- 현재 질문에 맞닿은 흐름: ${topicReading}` : ""}
${interpretation.reading?.caution ? `- 경계할 점: ${interpretation.reading.caution}` : ""}
${interpretation.mookseol?.toneHint ? `- 말투 방향: ${interpretation.mookseol.toneHint}` : ""}
${interpretation.mookseol?.followUpQuestion ? `- 자연스럽게 이어갈 질문 참고: ${interpretation.mookseol.followUpQuestion}` : ""}
${deepenWhen ? `- 더 깊은 정단을 검토할 조건: ${deepenWhen}` : ""}
${forbiddenExpressions ? `- 피해야 할 표현: ${forbiddenExpressions}` : ""}

[단시점 사용 규칙]
- 이 해석은 상담의 첫 바탕이지, 사건의 최종 판정이 아니다.
- 한 답변에 전체 내용을 쏟지 말고 현재 질문과 맞는 핵심만 골라 말해.
- 타인의 속마음, 정확한 시기, 승패를 단시점만으로 확정하지 마.
- 건강, 임신, 법률, 투자처럼 현실 결과가 큰 주제에서는 점술 표현으로 전문가 판단이나 현실적 확인을 대신하지 마.`;
}
