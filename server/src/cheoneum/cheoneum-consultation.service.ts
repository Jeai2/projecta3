import type { CheoneumReading, CheoneumSpreadId } from "./cheoneum.types";
import type { CheoneumSessionState } from "../services/session.service";
import { buildCheoneumDivinationInsight } from "./cheoneum-divination.service";

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

const GREETING_PATTERN = /^(안녕|하이|ㅎㅇ|hello|hi|반가워|처음|왔어)/i;
const SMALLTALK_PATTERN = /(뭐해|심심|재밌|ㅋㅋ|ㅎㅎ|농담|테스트|test|그냥 왔|말 걸어)/i;
const NOISE_PATTERN = /^[ㅋㅎㅠㅜ.,!?~\s]+$/;
const PROFILE_ANSWER_PATTERN =
  /(\d{4}[-./년]\s*\d{1,2}[-./월]\s*\d{1,2}|양력|음력|윤달|평달|남성|여성|성별|태어났|생일|생년월일|^남자$|^여자$|남자입니다|여자입니다)/i;
const AVOIDANT_PATTERN = /(몰라|알아서|아무거나|말하기 싫|그냥 봐|대충|네가 맞춰|묻지 말고)/i;
const CHOICE_PATTERN = /(할까|말까|해야\s*해|그만둘까|계속할까|헤어질까|만날까|고백할까|연락할까|둘 중|선택|A\s*\/\s*B|나을까)/i;
const RELATIONSHIP_PATTERN =
  /(남자친구|여자친구|남친|여친|연인|상대|그 사람|썸|짝사랑|재회|이별|연락|마음|권태기|바람|싸웠|갈등|환승|전남친|전여친)/i;
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
      return depthLevel >= 4 ? "tonggwan" : "ilgi";
    case "cause_structure":
      return "cheonjiin";
    case "flow_timing":
      return "wonhyeongijeong";
    case "repeating_pattern":
      return "sunhwan";
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

export function buildCheoneumInsight(
  reading: CheoneumReading,
  decision: CheoneumInterventionDecision,
): string {
  const divinationInsight = buildCheoneumDivinationInsight(reading);
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

${divinationInsight ?? "[천음 점사 계산]\n- 이번 스프레드에서는 아직 계산 가능한 신패 간지가 없습니다."}

[응답 지침]
- 천음은 내부 도구 이름이다. 사용자가 묻기 전에는 "천음"이라는 이름을 직접 말하지 말고, "카드", "패", "한 장", "펼쳐보기"로 표현한다.
- 사용자가 "이게 타로야?", "무슨 점이야?", "천음이 뭐야?"처럼 묻는 경우에만 천음을 동양적 카드 점사 무구라고 짧게 설명한다.
- 카드 상세 문장 데이터는 아직 비어 있으므로, 카드명만 억지로 해석하지 말고 [천음 점사 계산]의 십성 골격과 사용자의 말을 먼저 연결한다.
- 사용자에게 동조도 수치를 직접 말하지 마라.
- 이번 응답은 상담을 이어가기 위한 한두 문장과 다음 질문으로 마무리한다.`;
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
