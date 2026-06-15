import type { CheoneumReading, CheoneumSpreadId } from "./cheoneum.types";
import type { CheoneumSessionState } from "../services/session.service";
import { buildCheoneumDivinationInsight } from "./cheoneum-divination.service";
import {
  CHEONEUM_SINPAE_MEANINGS,
  type CheoneumReadingContext,
} from "./cheoneum-interpretation.data";

export type CheoneumInputType =
  | "greeting"
  | "smalltalk"
  | "noise"
  | "tool_question"
  | "profile_answer"
  | "avoidant"
  | "vague_concern"
  | "today_fortune"
  | "first_concern"
  | "choice"
  | "relationship_conflict"
  | "cause_structure"
  | "flow_timing"
  | "repeating_pattern"
  | "big_picture";

export interface CheoneumInterventionInput {
  message: string;
  turnCount: number;
  session: CheoneumSessionState;
}

export interface CheoneumInterventionDecision {
  inputType: CheoneumInputType;
  depthLevel: number;
  resonanceDelta: number;
  shouldUse: boolean;
  spread?: CheoneumSpreadId;
  reason: string;
  resonanceAfter: number;
}

export interface CheoneumClientHint {
  title: string;
  description: string;
  question: string;
}

type CheoneumQuestionDomain =
  | "daily"
  | "relationship"
  | "choice"
  | "career"
  | "business"
  | "money"
  | "study"
  | "health"
  | "general";

type CheoneumQuestionTimeScope =
  | "now"
  | "today"
  | "this_week"
  | "this_month"
  | "this_year"
  | "long_term"
  | "unspecified";

interface CheoneumQuestionProfile {
  domain: CheoneumQuestionDomain;
  timeScope: CheoneumQuestionTimeScope;
  escalation: CheoneumSpreadId | null;
  normalizedQuestion: string;
  firstChoice?: string;
  secondChoice?: string;
}

const GREETING_PATTERN = /^(안녕|하이|ㅎㅇ|hello|hi|반가워|처음|왔어)/i;
const SMALLTALK_PATTERN = /(뭐해|심심|재밌|ㅋㅋ|ㅎㅎ|농담|테스트|test|그냥 왔|말 걸어)/i;
const NOISE_PATTERN = /^[ㅋㅎㅠㅜ.,!?~\s]+$/;
const TODAY_FORTUNE_PATTERN = /!?\s*오늘\s*운세|오늘의?\s*운세|오늘\s*운세\s*봐/i;
const PROFILE_ANSWER_PATTERN =
  /(\d{4}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}|양력|음력|윤달|평달|남성|여성|성별|태어났|생일|생년월일|^남자$|^여자$|남자입니다|여자입니다)/i;
const AVOIDANT_PATTERN = /(몰라|알아서|아무거나|말하기 싫|그냥 봐|대충|네가 맞춰|묻지 말고)/i;
const CHOICE_PATTERN = /(할까|말까|해야\s*해|그만둘까|계속할까|헤어질까|만날까|고백할까|연락할까|둘 중|선택|A\s*\/\s*B|나을까)/i;
const RELATIONSHIP_PATTERN =
  /(남자친구|여자친구|남친|여친|연인|상대|그 사람|썸|짝사랑|재회|이별|연락|마음|권태기|바람|싸웠|갈등|환승|전남친|전여친|연애운|연애)/i;
const CAREER_PATTERN = /(직장|회사|상사|동료|커리어|이직|퇴사|취업|합격|면접|일운|직업|프로젝트)/i;
const BUSINESS_PATTERN = /(사업|창업|장사|매출|거래처|계약|투자|확장|마케팅|고객|매장|법인)/i;
const MONEY_PATTERN = /(돈|재물|금전|수입|지출|월급|연봉|부업|재테크|주식|코인|부동산|재물운)/i;
const STUDY_PATTERN = /(공부|시험|성적|자격증|논문|학교|입시|학업)/i;
const HEALTH_PATTERN = /(건강|몸|컨디션|병원|회복|피로|잠|수면|스트레스)/i;
const CAUSE_PATTERN = /(왜|이유|원인|속마음|무슨 생각|진짜 마음|본심|문제의 핵심|어디서 꼬였)/i;
const FLOW_PATTERN = /(언제|시기|앞으로|흐름|결과|미래|될까|오나|나타나|이번 달|올해|내년|기다리면)/i;
const REPEAT_PATTERN = /(계속|항상|반복|또|매번|늘|왜 .*만|패턴|되풀이)/i;
const BIG_PICTURE_PATTERN = /(전체|종합|큰 판|깊게|심층|낙서구궁|구궁|대운|인생|운세 전체|판을 봐|크게 봐)/i;
const VAGUE_CONCERN_PATTERN = /(답답|불안|걱정|고민|힘들|막혀|모르겠|불편|혼란|마음이 이상|잠이 안)/i;
const EXPLICIT_CHEONEUM_PATTERN = /(천음|카드|패를|뽑아|펼쳐|깊게|더 봐|의식|스프레드)/i;
const TOOL_QUESTION_PATTERN = /(타로|천음|무슨\s*점|무슨\s*점사|어떤\s*점|이거\s*무슨|이건\s*무슨|카드점|점\s*방식|어떻게\s*보는\s*거|카드.*뭐)/i;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function classifyMessage(message: string, turnCount: number): CheoneumInputType {
  const text = message.trim();

  if (!text) return "noise";
  if (NOISE_PATTERN.test(text)) return "noise";
  if (GREETING_PATTERN.test(text) && text.length <= 16) return "greeting";
  if (TOOL_QUESTION_PATTERN.test(text)) return "tool_question";
  if (SMALLTALK_PATTERN.test(text) && !VAGUE_CONCERN_PATTERN.test(text)) return "smalltalk";
  if (PROFILE_ANSWER_PATTERN.test(text) && text.length <= 40) return "profile_answer";
  if (BIG_PICTURE_PATTERN.test(text)) return "big_picture";
  if (REPEAT_PATTERN.test(text)) return "repeating_pattern";
  if (CHOICE_PATTERN.test(text)) return "choice";
  if (RELATIONSHIP_PATTERN.test(text)) return CAUSE_PATTERN.test(text) ? "cause_structure" : "relationship_conflict";
  if (FLOW_PATTERN.test(text)) return "flow_timing";
  if (CAUSE_PATTERN.test(text)) return "cause_structure";
  if (AVOIDANT_PATTERN.test(text)) return "avoidant";
  if (VAGUE_CONCERN_PATTERN.test(text)) return "vague_concern";

  return turnCount <= 1 ? "first_concern" : "smalltalk";
}

function getBaseDepth(inputType: CheoneumInputType): number {
  switch (inputType) {
    case "greeting":
    case "smalltalk":
    case "noise":
    case "tool_question":
    case "profile_answer":
      return 0;
    case "avoidant":
    case "vague_concern":
    case "today_fortune":
      return 1;
    case "first_concern":
      return 2;
    case "choice":
    case "relationship_conflict":
    case "cause_structure":
    case "flow_timing":
      return 3;
    case "repeating_pattern":
      return 4;
    case "big_picture":
      return 5;
  }
}

function inferDepth(message: string, inputType: CheoneumInputType): number {
  let depth = getBaseDepth(inputType);
  const text = message.trim();

  if (text.length >= 24) depth += 1;
  if (text.length >= 70) depth += 1;
  if (/[?？]/.test(text)) depth += 1;
  if (RELATIONSHIP_PATTERN.test(text) && CAUSE_PATTERN.test(text)) depth += 1;
  if (EXPLICIT_CHEONEUM_PATTERN.test(text)) depth += 1;

  return clamp(depth, 0, 5);
}

function mapSpread(inputType: CheoneumInputType, depthLevel: number): CheoneumSpreadId | undefined {
  switch (inputType) {
    case "choice":
      return "yangeui";
    case "relationship_conflict":
      return depthLevel >= 5 ? "tonggwan" : "ilgi";
    case "cause_structure":
      return depthLevel >= 5 ? "cheonjiin" : "ilgi";
    case "flow_timing":
      return depthLevel >= 5 ? "wonhyeongijeong" : "ilgi";
    case "repeating_pattern":
      return depthLevel >= 5 ? "sunhwan" : "ilgi";
    case "big_picture":
      return "nakseo-gugung";
    case "vague_concern":
    case "today_fortune":
    case "first_concern":
      return "ilgi";
    default:
      return undefined;
  }
}

function getResonanceDelta(inputType: CheoneumInputType, depthLevel: number): number {
  if (["noise", "smalltalk", "profile_answer"].includes(inputType)) return -1;
  if (inputType === "tool_question") return 0;
  if (inputType === "greeting") return 0;
  if (inputType === "avoidant") return -2;
  return clamp(depthLevel, 1, 5);
}

export function decideCheoneumIntervention(input: CheoneumInterventionInput): CheoneumInterventionDecision {
  const inputType = classifyMessage(input.message, input.turnCount);
  const depthLevel = inferDepth(input.message, inputType);
  const resonanceDelta = getResonanceDelta(inputType, depthLevel);
  const resonanceAfter = clamp(input.session.resonance + resonanceDelta, 0, 100);
  const spread = mapSpread(inputType, depthLevel);
  const explicit = EXPLICIT_CHEONEUM_PATTERN.test(input.message);
  const usedRecently =
    input.session.lastUsedAtTurn !== null && input.turnCount - input.session.lastUsedAtTurn <= 1;

  const shouldUse = !!spread && depthLevel >= 1 && (!usedRecently || explicit || depthLevel >= 4);
  const reason = shouldUse
    ? `${inputType} input mapped to ${spread}`
    : usedRecently
      ? "cooldown"
      : `${inputType} input does not need Cheoneum`;

  return {
    inputType,
    depthLevel,
    resonanceDelta,
    shouldUse,
    spread: shouldUse ? spread : undefined,
    reason,
    resonanceAfter,
  };
}

export function createTodayCheoneumDecision(
  session: CheoneumSessionState,
): CheoneumInterventionDecision {
  const resonanceDelta = 1;
  return {
    inputType: "today_fortune",
    depthLevel: 1,
    resonanceDelta,
    shouldUse: true,
    spread: "ilgi",
    reason: "today fortune uses Cheoneum ilgi",
    resonanceAfter: clamp(session.resonance + resonanceDelta, 0, 100),
  };
}

function analyzeCheoneumQuestion(message: string, decision: CheoneumInterventionDecision): CheoneumQuestionProfile {
  const text = message.trim().replace(/\s+/g, " ");
  const choices = extractYangeuiChoices(text);
  const domain: CheoneumQuestionDomain = decision.inputType === "choice"
    ? "choice"
    : RELATIONSHIP_PATTERN.test(text)
      ? "relationship"
      : BUSINESS_PATTERN.test(text)
        ? "business"
        : MONEY_PATTERN.test(text)
          ? "money"
          : CAREER_PATTERN.test(text)
            ? "career"
            : STUDY_PATTERN.test(text)
              ? "study"
              : HEALTH_PATTERN.test(text)
                ? "health"
                : TODAY_FORTUNE_PATTERN.test(text)
                  ? "daily"
                  : "general";

  const timeScope: CheoneumQuestionTimeScope = /(오늘|금일|하루|일진)/i.test(text)
    ? "today"
    : /(이번\s*주|이번주|주간)/i.test(text)
      ? "this_week"
      : /(이번\s*달|이번달|월간|이달)/i.test(text)
        ? "this_month"
        : /(올해|금년|연간|연해운|일년|1년)/i.test(text)
          ? "this_year"
          : /(앞으로|장기|미래|내년|대운|인생)/i.test(text)
            ? "long_term"
            : /(지금|현재|요즘|당장)/i.test(text)
              ? "now"
              : "unspecified";

  const escalation: CheoneumSpreadId | null = decision.inputType === "choice" || domain === "choice"
    ? "yangeui"
    : domain === "relationship"
      ? "tonggwan"
      : domain === "business" || domain === "career" || domain === "money" || domain === "study" || domain === "health"
        ? "wonhyeongijeong"
      : decision.inputType === "flow_timing" || timeScope === "this_month" || timeScope === "this_year" || timeScope === "long_term"
        ? "wonhyeongijeong"
        : decision.inputType === "repeating_pattern"
          ? "sunhwan"
          : null;

  return {
    domain,
    timeScope,
    escalation,
    normalizedQuestion: text.slice(0, 160),
    ...choices,
  };
}

function cleanChoiceSubject(value: string): string {
  return value
    .replace(/^(나는|나|내가|제가|저는|우리|우리가)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function actionToFutureLabel(action: string): string {
  const cleaned = cleanChoiceSubject(action).replace(/[?？.!,，、]+$/g, "").trim();
  if (!cleaned) return "먼저 말한 선택을 했을 때";

  const replacements: Array<[RegExp, string]> = [
    [/그만둘$/i, "그만두었을 때"],
    [/퇴사할$/i, "퇴사했을 때"],
    [/이직할$/i, "이직했을 때"],
    [/연락할$/i, "연락했을 때"],
    [/고백할$/i, "고백했을 때"],
    [/헤어질$/i, "헤어졌을 때"],
    [/만날$/i, "만났을 때"],
    [/시작할$/i, "시작했을 때"],
    [/확장할$/i, "확장했을 때"],
    [/투자할$/i, "투자했을 때"],
    [/말할$/i, "말했을 때"],
    [/할$/i, "했을 때"],
    [/갈$/i, "갔을 때"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(cleaned)) return cleaned.replace(pattern, replacement);
  }

  return `${cleaned} 선택했을 때`;
}

function actionToOppositeFutureLabel(action: string): string {
  const cleaned = cleanChoiceSubject(action).replace(/[?？.!,，、]+$/g, "").trim();
  if (!cleaned) return "그 선택을 하지 않았을 때";

  const replacements: Array<[RegExp, string]> = [
    [/그만둘$/i, "그만두지 않았을 때"],
    [/퇴사할$/i, "퇴사하지 않았을 때"],
    [/이직할$/i, "이직하지 않았을 때"],
    [/연락할$/i, "연락하지 않았을 때"],
    [/고백할$/i, "고백하지 않았을 때"],
    [/헤어질$/i, "헤어지지 않았을 때"],
    [/만날$/i, "만나지 않았을 때"],
    [/시작할$/i, "시작하지 않았을 때"],
    [/확장할$/i, "확장하지 않았을 때"],
    [/투자할$/i, "투자하지 않았을 때"],
    [/말할$/i, "말하지 않았을 때"],
    [/할$/i, "하지 않았을 때"],
    [/갈$/i, "가지 않았을 때"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(cleaned)) return cleaned.replace(pattern, replacement);
  }

  return `${cleaned} 선택하지 않았을 때`;
}

function extractYangeuiChoices(text: string): Pick<CheoneumQuestionProfile, "firstChoice" | "secondChoice"> {
  const slashMatch = text.match(/(.+?)\s*(?:\/| vs | VS | 아니면 | 혹은 | 또는 )\s*(.+?)(?:\s*중|\s*뭐|\s*어느|\s*나아|\s*좋아|[?？]|$)/);
  if (slashMatch) {
    return {
      firstChoice: `${cleanChoiceSubject(slashMatch[1])} 선택했을 때`,
      secondChoice: `${cleanChoiceSubject(slashMatch[2])} 선택했을 때`,
    };
  }

  const kkMatch = text.match(/(.+?(?:그만둘|퇴사할|이직할|연락할|고백할|헤어질|만날|시작할|확장할|투자할|말할|할|갈))까\s*말까/i);
  if (kkMatch) {
    const action = kkMatch[1];
    return {
      firstChoice: actionToFutureLabel(action),
      secondChoice: actionToOppositeFutureLabel(action),
    };
  }

  return {};
}

function getCheoneumReadingContext(
  decision: CheoneumInterventionDecision,
  question: CheoneumQuestionProfile,
): CheoneumReadingContext {
  if (question.domain === "relationship") return "relationship";
  if (question.domain === "choice") return "choice";
  if (question.timeScope !== "today" && question.timeScope !== "unspecified") return "flow";

  switch (decision.inputType) {
    case "choice":
      return "choice";
    case "relationship_conflict":
    case "cause_structure":
      return "relationship";
    case "flow_timing":
    case "repeating_pattern":
    case "big_picture":
      return "flow";
    case "avoidant":
      return "caution";
    default:
      return "daily";
  }
}

function formatSeedList(values: string[] | undefined, limit: number): string {
  if (!values?.length) return "없음";
  return values.slice(0, limit).join(" / ");
}

function buildCheoneumCardMeaningInsight(
  reading: CheoneumReading,
  decision: CheoneumInterventionDecision,
  question: CheoneumQuestionProfile,
): string | null {
  const context = getCheoneumReadingContext(decision, question);
  const lines = reading.cards
    .map((placed) => {
      if (placed.card.arcana !== "sinpae") {
        return `- ${placed.card.name} / ${placed.label}: 진패 의미 씨앗은 아직 연결되지 않음`;
      }

      const meaning = CHEONEUM_SINPAE_MEANINGS[placed.card.id];
      if (!meaning) {
        return `- ${placed.card.name} / ${placed.label}: 신패 의미 씨앗 미작성`;
      }

      const spreadBias = meaning.spreadBias?.[reading.spread];
      const avoidExactPhrases = meaning.avoidExactPhrases?.length
        ? `\n  · 그대로 반복 금지: ${formatSeedList(meaning.avoidExactPhrases, 2)}`
        : "";

      return `- ${placed.card.name}(${placed.card.hanja ?? placed.card.name}) / ${placed.label}
  · 중심 장면: ${meaning.coreImage}
  · 의미 영역: ${formatSeedList(meaning.semanticField, 6)}
  · 표현 씨앗: ${formatSeedList(meaning.expressionSeeds, 3)}
  · 질문 맥락(${context}): ${formatSeedList(meaning.readingBias[context], 2)}
  · 스프레드(${reading.spread}): ${formatSeedList(spreadBias, 2)}${avoidExactPhrases}`;
    })
    .join("\n");

  if (!lines) return null;

  return `[천음 카드 의미 씨앗]
- 적용 맥락: ${context}
- 아래 문장은 완성 답변이 아니라 의미 재료다. 그대로 복사하지 말고 화선/화영 말투로 변주한다.
${lines}`;
}

function formatQuestionProfile(question: CheoneumQuestionProfile): string {
  return `[사용자 질문 보정]
- 원문 질문: ${question.normalizedQuestion || "없음"}
- 분야: ${question.domain}
- 시간 범위: ${question.timeScope}
- 추천 다음 스프레드: ${question.escalation ?? "없음"}
- 먼저 말한 선택: ${question.firstChoice ?? "미감지"}
- 반대 선택: ${question.secondChoice ?? "미감지"}
- 이 정보는 사용자의 질문을 오늘 운세로 고정하지 않고, 연애/사업/일/돈/건강/장기 흐름 등 실제 질문 범위에 맞게 보정하기 위한 내부 힌트다.`;
}

function buildYangeuiChoiceMap(reading: CheoneumReading, question: CheoneumQuestionProfile): string {
  const firstChoice = question.firstChoice ?? "사용자가 먼저 말한 선택을 택했을 때";
  const secondChoice = question.secondChoice ?? "그 반대 선택을 택했을 때";
  const leftFuture = reading.polarity === "yin" ? secondChoice : firstChoice;
  const rightFuture = reading.polarity === "yin" ? firstChoice : secondChoice;

  return `[양의 좌우 미래 매핑]
- 운용: ${reading.polarity === "yin" ? "화영/음" : "화선/양"}
- 원칙: 양의는 두 선택 이후의 미래를 비교한다. 단순히 좋다/나쁘다만 말하지 않는다.
- 왼쪽의 흐름: ${leftFuture}
- 오른쪽의 흐름: ${rightFuture}
- 화선/양에서는 왼쪽이 먼저 말한 선택, 오른쪽이 반대 선택이다.
- 화영/음에서는 반대로 해석한다. 왼쪽이 반대 선택, 오른쪽이 먼저 말한 선택이다.`;
}

function buildCheoneumResponseGuide(reading: CheoneumReading, question: CheoneumQuestionProfile): string {
  if (reading.spread === "ilgi") {
    const escalationLine = question.escalation
      ? `- 마지막 유도 질문은 더 깊은 스프레드로 자연스럽게 이어지게 한다. 추천 방향: ${question.escalation}. 예: "이걸 두 갈래로 나눠서 더 볼까요?", "관계 안쪽까지 더 펼쳐볼까요?", "시기 흐름까지 더 볼까요?"`
      : `- 마지막 유도 질문은 사용자가 어느 부분을 더 보고 싶은지 탐색하게 한다. 예: "조심할 점을 더 볼까요?", "어느 쪽이 제일 마음에 걸려요?"`;

    return `[천음 일기 출력 지침 - 공통 짧은 답변 지침보다 우선]
- 일기는 오늘 운세 전용이 아니라, 사용자의 질문을 한 장으로 압축해 보는 기본 단일패 스프레드다.
- 사용자가 "오늘"을 묻지 않았다면 오늘 운세처럼 말하지 않는다. 질문의 시간 범위와 분야에 맞게 해석한다.
- 예: 올해 연애운은 장기적인 관계 흐름으로, 사업운은 확장/돈/리스크/거래 흐름으로, 직장운은 책임/평가/업무 흐름으로 보정한다.
- 이번 응답은 단일패의 첫 탐색 답변이다. 너무 짧게 끝내지 말고 5~7문장으로 말한다.
- 첫 문장은 카드가 열린 뒤 잠깐 해석을 가늠하는 짧은 리액션으로 시작한다. 예: "흠...", "음...", "잠깐만요.", "오늘은... 조금 선명하네요."
- 리액션만 단독 문장으로 끝내지 말고, 같은 흐름에서 바로 오늘의 해석으로 이어간다.
- 구성은 1) 짧은 리액션 + 질문 분야의 전체 기운 1~2문장, 2) 카드 상징 1~2문장, 3) 점사일/십성 계산에서 나온 현실 작용 2문장, 4) 지금 적용할 조언 1문장 순서로 잡는다.
- 내부 용어인 일주, 일간, 십성, 천음 간지는 사용자에게 표처럼 설명하지 않는다. 대신 "오늘은 이런 식으로 드러나요"처럼 자연어로 풀어 말한다.
- [천음 카드 의미 씨앗]의 상징과 [천음 점사 계산]의 십성 골격을 반드시 둘 다 반영한다. 한쪽만 보고 말하지 않는다.
- 모든 주의점과 세부 해석을 첫 응답에서 전부 소진하지 않는다. 단일패는 입구이고, 더 깊은 스프레드는 세부를 보는 다음 단계다.
${escalationLine}
- 유도 질문은 상담 질문기법처럼 부담 없이 묻는다. 탐색적 질문, 촉진 질문, 소크라테스식 질문을 섞되 영업처럼 노골적으로 말하지 않는다.
- 단, 사용자가 이미 "조심할 것", "주의할 것", "피해야 할 것"을 물었다면 유도 질문보다 주의점을 4~6문장으로 바로 답한다.`;
  }

  if (reading.spread === "yangeui") {
    return `[천음 양의 출력 지침]
- 양의는 단일패보다 한 단계 깊은 비교 스프레드다. 두 선택 이후의 미래 장면을 나란히 보여준다.
- 왼쪽/오른쪽은 [양의 좌우 미래 매핑]을 반드시 따른다.
- 답변 구조는 1) 두 갈래가 갈라진 첫인상, 2) 왼쪽의 흐름이 펼치는 미래, 3) 오른쪽의 흐름이 펼치는 미래, 4) 얻는 것/잃는 것/감정 비용/현실 비용 비교, 5) "제 생각에는 ~쪽이 더 좋아 보입니다" 형식의 판단, 6) 단서와 후속 질문 순서로 한다.
- 양의에서는 각 패의 천간을 그 흐름의 일간/나로 둔다. 점사일 일간을 공통 기준으로 쓰지 않는다.
- 왼쪽의 흐름은 [양의 왼쪽 패 천간-점사시간 기준]을 반영한다. 왼쪽 패의 천간을 그 흐름의 나로 두고, 왼쪽 패 지지와 점사시간 지지를 비교한다.
- 오른쪽의 흐름은 [양의 오른쪽 패 천간-점사시간 기준]을 우선 반영한다. 오른쪽 패의 천간을 그 흐름의 나로 두고, 오른쪽 패 지지와 점사시간 지지를 비교한다.
- 양의에서 점사시간은 시간 천간을 기준으로 쓰는 것이 아니라, 좌우 패 지지가 맞부딪히는 현재 시점의 지지로 쓴다.
- 분야가 relationship이면 감정 비용, 자존심, 대화 온도, 관계의 회복 가능성을 비교한다.
- 분야가 business/career/money면 현실 기반, 돈의 빈틈, 평판, 다음 자리, 리스크 회수 가능성을 비교한다.
- 단순히 "왼쪽 좋음/오른쪽 나쁨"처럼 말하지 말고, 두 미래가 각각 어떤 대가를 요구하는지 보여준다.
- 판단은 하되 절대론으로 말하지 않는다. "지금 카드로는", "현재 흐름만 보면", "제 생각에는" 같은 완충을 둔다.`;
  }

  if (reading.spread === "tonggwan") {
    return `[천음 통관 출력 지침]
- 통관은 관계나 두 대상 사이의 막힘과 연결점을 보는 더 깊은 스프레드다. 단일패나 양의보다 구체적으로 말한다.
- 분야가 relationship이면 내 흐름, 상대 흐름, 사이를 막거나 잇는 통관패를 분리해서 해석한다.
- 분야가 business/career면 나/상대방 또는 내부/외부 사이에서 거래, 협상, 책임, 조건이 어디서 막히는지 본다.
- 답변 구조는 1) 관계/상황의 현재 병목, 2) 한쪽 흐름, 3) 반대쪽 흐름, 4) 통하게 만드는 열쇠, 5) 사용자가 취할 수 있는 작은 행동 순서로 한다.
- 마지막은 "어느 쪽의 마음을 더 보고 싶은지", "막힌 지점을 더 파고들지"를 묻는다.`;
  }

  if (reading.spread === "wonhyeongijeong") {
    return `[천음 원형이정 출력 지침]
- 원형이정은 시간 흐름을 단계별로 보는 상위 스프레드다. 일기보다 장기적이고, 양의보다 시계열이 중요하다.
- 분야에 맞춰 시작, 확장, 걸림, 결말의 흐름을 분리한다. 올해/이번 달/장기 질문이면 특히 시기별 변화를 강조한다.
- 답변 구조는 1) 전체 흐름, 2) 시작의 씨앗, 3) 커지는 구간, 4) 조심할 구간, 5) 정리되는 방향, 6) 다음 확인 질문 순서로 한다.`;
  }

  if (reading.spread === "sunhwan") {
    return `[천음 순환 출력 지침]
- 순환은 반복 패턴을 보는 상위 스프레드다. 사용자가 왜 같은 흐름을 반복하는지 탐색한다.
- 답변 구조는 1) 반복되는 고리, 2) 반복을 강화하는 감정/행동, 3) 빠져나오는 작은 행동, 4) 더 깊게 볼 질문 순서로 한다.
- 비난하지 말고, 사용자가 스스로 패턴을 알아차리게 하는 소크라테스식 질문으로 마무리한다.`;
  }

  if (reading.spread === "cheonjiin" || reading.spread === "nakseo-gugung") {
    return `[천음 상위 스프레드 출력 지침]
- 이 스프레드는 단일패보다 훨씬 디테일한 구조를 보는 단계다. 카드별 위치 의미를 살려 구체적으로 말한다.
- 천지인은 하늘의 흐름, 현실의 조건, 사람의 선택을 나누어 본다.
- 낙서구궁은 큰 판의 배치를 보는 최고 단계에 가깝다. 문제 하나만이 아니라 주변 조건과 장기 흐름까지 연결한다.
- 답변은 충분히 구체적으로 하되, 한 번에 모든 것을 소진하지 말고 다음에 더 좁힐 지점을 남긴다.`;
  }

  return `[천음 출력 지침]
- 카드 의미 씨앗과 점사 계산 근거를 함께 사용하되, 현재 스프레드의 목적에 맞춰 핵심만 말한다.
- 답변은 너무 장황하게 늘이지 말고, 사용자가 다음 말을 이어가기 쉽게 마무리한다.`;
}

export function buildCheoneumInsight(
  reading: CheoneumReading,
  decision: CheoneumInterventionDecision,
  userMessage: string,
): string {
  const question = analyzeCheoneumQuestion(userMessage, decision);
  const divinationInsight = buildCheoneumDivinationInsight(reading);
  const cardMeaningInsight = buildCheoneumCardMeaningInsight(reading, decision, question);
  const responseGuide = buildCheoneumResponseGuide(reading, question);
  const cardLines = reading.cards
    .map((placed) => {
      const hidden = placed.orientation === "hidden" ? " / hidden" : "";
      return `- ${placed.label}: ${placed.card.name} (${placed.card.arcana}${hidden})`;
    })
    .join("\n");

  return `[카드 의식 개입 v0]
- 운용: ${reading.polarity === "yang" ? "낮의 카드" : "밤의 카드"}
- 스프레드: ${reading.spreadName} (${reading.spread})
- 대화 유형: ${decision.inputType}
- 대화 깊이: ${decision.depthLevel}/5
- 동조도 변화: ${decision.resonanceDelta >= 0 ? "+" : ""}${decision.resonanceDelta}, 현재 ${decision.resonanceAfter}/100
- 선택된 패:
${cardLines}

${formatQuestionProfile(question)}

${reading.spread === "yangeui" ? `${buildYangeuiChoiceMap(reading, question)}\n` : ""}

${cardMeaningInsight ?? "[천음 카드 의미 씨앗]\n- 이번 카드에 연결된 의미 씨앗이 없습니다."}

${divinationInsight ?? "[천음 점사 계산]\n- 이번 스프레드에서는 아직 계산 가능한 신패 간지가 없습니다."}

${responseGuide}

[응답 지침]
- 천음은 내부 도구 이름이다. 사용자가 묻기 전에는 "천음"이라는 이름을 직접 말하지 말고, "카드", "패", "한 장", "펼쳐보기"로 표현한다.
- 사용자가 "이게 타로야?", "무슨 점이야?", "천음이 뭐야?"처럼 묻는 경우에만 천음을 동양적 카드 점사 무구라고 짧게 설명한다.
- [천음 카드 의미 씨앗]은 카드 상징의 1차 재료이고, [천음 점사 계산]은 점사 계산 근거다. 둘을 함께 사용한다.
- 카드 의미 씨앗의 문장을 그대로 복사하지 말고, 질문 맥락과 십성 골격에 맞춰 자연스럽게 재구성한다.
- 사용자에게 동조도 수치를 직접 말하지 마라.
- [천음 일기 출력 지침]이 있는 경우, 기존의 짧은 대화 지침보다 그 지침을 우선한다.`;
}

export function buildCheoneumClientHint(
  decision: CheoneumInterventionDecision,
  userMessage: string,
): CheoneumClientHint {
  const normalizedQuestion = userMessage.trim().replace(/\s+/g, " ").slice(0, 120);

  switch (decision.inputType) {
    case "today_fortune":
      return {
        title: "오늘의 한 기운",
        description: "오늘의 흐름을 카드 한 장으로 봅니다.",
        question: normalizedQuestion,
      };
    case "choice":
      return {
        title: "선택의 갈림길",
        description: "두 방향 사이에서 흔들리는 기운을 봅니다.",
        question: normalizedQuestion,
      };
    case "relationship_conflict":
      return {
        title: "관계 사이의 흐름",
        description: "두 사람 사이를 막거나 잇는 기운을 봅니다.",
        question: normalizedQuestion,
      };
    case "cause_structure":
      return {
        title: "문제의 속자리",
        description: "겉으로 보이는 말보다 안쪽 원인을 봅니다.",
        question: normalizedQuestion,
      };
    case "flow_timing":
      return {
        title: "흐름과 때",
        description: "지금부터 이어질 방향과 시기를 봅니다.",
        question: normalizedQuestion,
      };
    case "repeating_pattern":
      return {
        title: "반복되는 고리",
        description: "계속 되풀이되는 마음의 자리를 봅니다.",
        question: normalizedQuestion,
      };
    case "big_picture":
      return {
        title: "큰 판의 배치",
        description: "흩어진 고민을 넓은 판 위에 펼쳐 봅니다.",
        question: normalizedQuestion,
      };
    default:
      return {
        title: "지금의 기운",
        description: "현재 말 속에 걸린 흐름을 카드로 봅니다.",
        question: normalizedQuestion,
      };
  }
}
