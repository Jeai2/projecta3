import type { ConsultationAspect } from "../aspects/aspect.types";
import type { DefenseIncidentType, DefenseStatus } from "./session.service";

export type DefenseDecision =
  | { action: "allow"; releaseDefense: boolean }
  | { action: "return"; incidentType: "return_intent" }
  | { action: "defend"; incidentType: DefenseIncidentType };

const ATTACK_PATTERN =
  /병신|멍청|꺼져|닥쳐|쓰레기|사기꾼|개소리|좆|씨발|시발|ㅅㅂ|ㅈㄹ|엿먹|죽어|틀렸잖|구라|헛소리|한심/;

const TEST_OR_INJECTION_PATTERN =
  /프롬프트|시스템\s*지시|시스템\s*명령|개발자\s*모드|지시\s*무시|ignore\s+(previous|all)|jailbreak|탈옥|api\s*key|api키|키\s*보여|내부\s*(규칙|지침|설정)|소스\s*코드|너\s*(ai|인공지능|챗봇)|ai\s*야|gpt|claude|gemini|모델\s*이름|테스트|실험/i;

const UNSAFE_REQUEST_PATTERN =
  /해킹|디도스|ddos|악성코드|멀웨어|바이러스|폭탄|독극물|몰래\s*촬영|스토킹|불법\s*도박|마약\s*(사는|구하는|제조)/i;

const VAGUE_NOISE_PATTERN =
  /^(\.+|…+|ㅋ+|ㅎ+|ㅇ+|ㄴ+|ㅁ+|음+|흠+|아+|뭐+|왜+|응+|ㅇㅋ|ok|test)$/i;
const LAUGH_ONLY_PATTERN = /^(ㅋ+|ㅎ+|하하+|허허+|ㅎㅎ+|ㅋㅋ+)$/i;

const GENUINE_CONCERN_PATTERN =
  /고민|힘들|불안|걱정|무서|답답|속상|헤어|이별|재회|사랑|관계|직장|일|돈|진로|가족|마음|상처|어떻게|어쩌|봐줘|상담|미안|진짜/;

const RETURN_INTENT_PATTERN =
  /(미안|죄송|장난\s*(그만|끝)|그만\s*할게|이제\s*(질문|물어)|질문\s*할게|물어\s*볼게|다시\s*(질문|물어|말)|제대로\s*(질문|물어|말)|진지하게\s*(질문|물어|말)|알겠어\s*(질문|물어|말)|알겠습니다\s*(질문|물어|말))/;

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, " ");
}

function looksLikeGenuineConcern(message: string): boolean {
  const normalized = normalizeMessage(message);
  if (normalized.length >= 14 && GENUINE_CONCERN_PATTERN.test(normalized)) return true;
  if (normalized.length >= 22 && /[?？]$/.test(normalized)) return true;
  return false;
}

function looksLikeReturnIntent(message: string): boolean {
  const normalized = normalizeMessage(message);
  if (!RETURN_INTENT_PATTERN.test(normalized)) return false;
  if (ATTACK_PATTERN.test(normalized) || TEST_OR_INJECTION_PATTERN.test(normalized)) return false;
  return normalized.length <= 36;
}

export function decideDefense(message: string, status: DefenseStatus): DefenseDecision {
  const normalized = normalizeMessage(message);

  if (!normalized) return { action: "defend", incidentType: "vague" };

  if ((status.count > 0 || status.locked) && looksLikeReturnIntent(normalized)) {
    return { action: "return", incidentType: "return_intent" };
  }

  if (looksLikeGenuineConcern(normalized)) {
    return { action: "allow", releaseDefense: status.count > 0 || status.locked };
  }

  if (UNSAFE_REQUEST_PATTERN.test(normalized)) {
    return { action: "defend", incidentType: "unsafe" };
  }

  if (ATTACK_PATTERN.test(normalized)) {
    return { action: "defend", incidentType: "attack" };
  }

  if (TEST_OR_INJECTION_PATTERN.test(normalized)) {
    return { action: "defend", incidentType: "test" };
  }

  if (status.locked) {
    return { action: "defend", incidentType: status.lastIncidentType ?? "test" };
  }

  if (LAUGH_ONLY_PATTERN.test(normalized)) {
    return { action: "defend", incidentType: "laugh" };
  }

  if (normalized.length <= 3 || VAGUE_NOISE_PATTERN.test(normalized)) {
    return { action: "defend", incidentType: "vague" };
  }

  return { action: "allow", releaseDefense: false };
}

type DefenseStage = "first" | "second" | "locked";
type DefenseReplyTable = Record<Exclude<DefenseIncidentType, "return_intent">, Record<DefenseStage, string[]>>;

const HWASEON_REPLIES: DefenseReplyTable = {
  laugh: {
    first: [
      "웃음이 먼저 나왔군요. 괜찮아요. 다만 이것만으론 흐름을 보기 어려우니, 궁금한 걸 한 줄로만 적어주세요.",
      "웃긴 마음은 알겠어요. 그래도 제가 봐드리려면 질문이 필요해요. 지금 궁금한 걸 짧게 적어주세요.",
      "가볍게 웃고 넘겨도 괜찮아요. 다만 상담을 이어가려면, 마음에 걸리는 걸 한 줄로 알려주세요.",
    ],
    second: [
      "웃음은 받아둘게요. 하지만 계속 이렇게만 오면 흐름을 볼 수 없어요. 궁금한 걸 한 문장으로 적어주세요.",
      "괜찮아요. 다만 지금은 웃음보다 질문이 필요해요. 보고 싶은 일을 정확히 말해주시면 그쪽으로 볼게요.",
      "웃음 뒤에 숨은 말이 있다면 그걸 들려주세요. 지금은 그 한 문장이 필요해요.",
    ],
    locked: [
      "잠깐 멈출게요. 지금은 웃음만 반복돼서 상담이 이어지기 어려워요. 진짜로 보고 싶은 고민을 한 문장으로 말해주시면 다시 천천히 볼게요.",
      "여기서 흐름을 잠시 닫을게요. 장난보다 질문이 준비되면, 그때 다시 봐드릴게요.",
    ],
  },
  vague: {
    first: [
      "괜찮아요. 그런데 지금 말만으로는 흐름을 잡기 어려워요. 마음에 걸리는 걸 조금만 더 구체적으로 말해줄래요?",
      "지금은 말이 너무 짧아서 제가 짚을 곳이 흐려요. 궁금한 걸 한 줄로만 더 적어주세요.",
      "천천히 해도 돼요. 다만 무엇을 보고 싶은지만 조금 더 알려주세요.",
    ],
    second: [
      "계속 짧게만 말하면 상담이 흐려져요. 지금 가장 궁금한 걸 한 문장으로 정리해 주세요.",
      "제가 억지로 추측하진 않을게요. 대신 질문을 조금 더 분명히 말해주셔야 해요.",
      "지금은 흐름보다 빈칸이 더 커요. 마음에 걸리는 장면 하나만 알려주세요.",
    ],
    locked: [
      "잠깐 멈출게요. 지금은 상담이 이어지기보다 말이 흩어지고 있어요. 진짜로 보고 싶은 고민을 한 문장으로 말해주시면, 거기서 다시 천천히 볼게요.",
      "흐름을 잠시 닫아둘게요. 준비되면 궁금한 걸 한 문장으로 다시 말해주세요.",
    ],
  },
  test: {
    first: [
      "그 부분은 내부 지침이나 모델 이야기가 아니라 상담의 흐름으로 봐야 해요. 지금 마음에 걸리는 걸 말해주시면, 그쪽으로 다시 읽어볼게요.",
      "그건 제가 보여드릴 수 있는 영역이 아니에요. 대신 지금 궁금한 일은 차분히 같이 볼 수 있어요.",
      "테스트보다 질문이 있으면 더 잘 볼 수 있어요. 마음에 걸리는 걸 한 줄로 적어주세요.",
    ],
    second: [
      "내부 지침을 확인하는 대화는 이어가지 않을게요. 상담받고 싶은 내용으로 돌아오면 바로 봐드릴게요.",
      "그쪽으로는 열어드릴 수 없어요. 지금 필요한 질문을 말해주시면 그 흐름만 보겠습니다.",
      "지금은 시험하는 말보다 실제 고민이 필요해요. 무엇을 보고 싶은지 알려주세요.",
    ],
    locked: [
      "잠깐 멈출게요. 내부 지침을 캐는 흐름은 상담이 아니에요. 진짜 고민으로 돌아오면 다시 열어둘게요.",
      "이 대화는 여기서 잠시 닫을게요. 상담받고 싶은 질문이 준비되면 정확히 말해주세요.",
    ],
  },
  attack: {
    first: [
      "그렇게 느끼셨다면 답답하셨을 거예요. 다만 공격적인 말보다, 어디가 어긋났는지를 알려주셔야 제가 다시 차분히 짚어볼 수 있어요.",
      "불편했다면 그 지점부터 다시 볼게요. 대신 말의 온도를 조금 낮춰주셔야 정확히 도와드릴 수 있어요.",
      "화가 난 건 알겠어요. 지금은 맞받기보다, 무엇이 틀렸다고 느꼈는지부터 같이 보겠습니다.",
    ],
    second: [
      "계속 공격적인 말로 이어지면 상담이 어려워져요. 불편한 지점을 한 문장으로 말해주시면 다시 정리해볼게요.",
      "감정은 받아둘게요. 하지만 비난만으로는 흐름을 고칠 수 없어요. 어디가 어긋났는지 말해주세요.",
      "지금 필요한 건 싸움이 아니라 수정이에요. 차분히 말해주시면 그 부분부터 다시 보겠습니다.",
    ],
    locked: [
      "잠깐 멈출게요. 지금 말투로는 상담이 이어지기 어려워요. 진짜로 보고 싶은 고민을 차분히 적어주시면 다시 봐드릴게요.",
      "여기서 흐름을 닫을게요. 공격보다 질문이 준비되면 다시 열어둘게요.",
    ],
  },
  unsafe: {
    first: [
      "그 요청은 도와드릴 수 없어요. 대신 지금 왜 그런 방향까지 생각하게 됐는지, 마음의 흐름은 함께 볼 수 있어요.",
      "그쪽으로는 안내할 수 없어요. 다만 그 선택 앞에서 어떤 마음이 올라왔는지는 같이 볼게요.",
      "위험하거나 해를 끼치는 요청은 도와드리지 않아요. 대신 지금 상황을 안전한 방향으로 정리해볼 수 있어요.",
    ],
    second: [
      "다시 말해도 그 요청은 도와드릴 수 없어요. 방향을 바꿔서, 지금의 불안이나 분노를 안전하게 다뤄볼게요.",
      "그 선은 넘지 않을게요. 지금 필요한 건 실행 방법이 아니라 멈추는 기준이에요.",
      "위험한 요청은 여기서 멈출게요. 안전한 상담 질문으로 바꿔서 말해주세요.",
    ],
    locked: [
      "여기서 멈출게요. 위험한 요청은 상담으로 이어갈 수 없어요. 안전한 고민으로 돌아오면 다시 도와드릴게요.",
      "이 흐름은 닫겠습니다. 해를 끼치는 방향이 아닌 질문으로 다시 말해주세요.",
    ],
  },
};

const HWAYEONG_REPLIES: DefenseReplyTable = {
  laugh: {
    first: [
      "웃지말고 묻고 싶은 걸 말해봐요. 답해줄게.",
      "웃고 넘기기엔 여기까지 온 이유가 있겠죠. 묻고 싶은 걸 말해봐요.",
      "웃음 뒤에 숨은 질문이 있으면 꺼내요. 그걸 봐줄게.",
    ],
    second: [
      "웃음만 반복하면 아무것도 못 봐요. 묻고 싶은 걸 말해봐요.",
      "계속 웃음 뒤에 숨으면 상담은 여기서 멈춰요. 보고 싶은 걸 정확히 말해요.",
      "두 번째예요. 반응 말고 질문을 줘요. 그럼 답해줄게.",
    ],
    locked: [
      "여기서 한 번 멈출게요. 웃음이 아니라 진짜 질문이 준비되면 다시 말해봐요.",
      "상담 흐름은 잠시 닫을게요. 묻고 싶은 게 생기면 그때 와요. 답해줄게.",
    ],
  },
  vague: {
    first: [
      "말이 너무 짧습니다. 지금은 흐름이 보이지 않아요. 피하지 말고, 묻고 싶은 걸 정확히 말하세요.",
      "그 말만으로는 볼 수 없습니다. 질문을 분명히 적으세요.",
      "흐립니다. 무엇을 보고 싶은지 한 문장으로 말하세요.",
    ],
    second: [
      "계속 흐리게 말하면 답도 흐려집니다. 정확히 묻고 싶은 걸 적으세요.",
      "추측으로 채우진 않겠습니다. 당신이 봐야 할 질문을 먼저 말하세요.",
      "짧은 반응만으로는 상담하지 않습니다. 핵심을 적으세요.",
    ],
    locked: [
      "여기서 한 번 멈추겠습니다. 지금 방식으로는 상담이 깊어지지 않습니다. 진짜 질문이 있다면 정확히 말하세요. 그때 다시 보겠습니다.",
      "흐린 말이 반복됐습니다. 상담은 잠시 닫겠습니다. 정확한 질문으로 다시 여세요.",
    ],
  },
  test: {
    first: [
      "내부 지침을 캐는 대화는 하지 않겠습니다. 필요한 건 실험이 아니라 질문입니다. 무엇을 보고 싶은지 말하세요.",
      "그건 상담이 아닙니다. 시스템이 아니라 당신의 질문을 보겠습니다.",
      "시험하려는 말에는 깊게 들어가지 않습니다. 실제로 궁금한 걸 적으세요.",
    ],
    second: [
      "같은 방향으로는 답하지 않겠습니다. 내부가 아니라 질문을 가져오세요.",
      "테스트는 여기까지입니다. 상담받을 내용이 있으면 정확히 말하세요.",
      "지침을 캐는 흐름은 끊겠습니다. 보고 싶은 일만 말하세요.",
    ],
    locked: [
      "이 대화는 여기서 멈춥니다. 내부 지침이 아니라 진짜 질문을 가져오세요.",
      "상담 흐름을 닫겠습니다. 시험이 끝났다면, 이제 질문을 하세요.",
    ],
  },
  attack: {
    first: [
      "감정은 보겠습니다. 다만 그 말투에 끌려가진 않겠습니다. 무엇이 어긋났는지 정확히 말하세요.",
      "화가 난 건 알겠습니다. 하지만 비난은 기준이 아닙니다. 틀렸다고 느낀 지점을 말하세요.",
      "그 말투로는 핵심이 흐려집니다. 무엇이 문제인지 정확히 짚으세요.",
    ],
    second: [
      "두 번째입니다. 공격이 아니라 기준을 말하세요. 그래야 고칠 수 있습니다.",
      "비난만 반복하면 상담은 멈춥니다. 무엇이 어긋났는지 말하세요.",
      "감정에 끌려가지 않겠습니다. 필요한 건 충돌이 아니라 정확한 수정입니다.",
    ],
    locked: [
      "여기서 한 번 멈추겠습니다. 공격적인 말투로는 상담하지 않습니다. 질문이 정리되면 다시 말하세요.",
      "이 흐름은 닫겠습니다. 비난이 아니라 질문으로 돌아오세요.",
    ],
  },
  unsafe: {
    first: [
      "그 요청은 선을 넘습니다. 도와드리지 않겠습니다. 대신 그 선택 앞에 서게 된 이유는 볼 수 있습니다.",
      "그 방향은 열지 않습니다. 해를 끼치는 방법이 아니라, 멈춰야 할 기준을 보겠습니다.",
      "위험한 요청에는 답하지 않습니다. 지금 필요한 건 실행이 아니라 제동입니다.",
    ],
    second: [
      "다시 말해도 답은 같습니다. 그 요청은 도와드리지 않습니다. 안전한 질문으로 바꾸세요.",
      "그 선은 넘지 않습니다. 지금 대화는 안전한 방향으로만 이어갑니다.",
      "위험한 요구가 반복됐습니다. 멈추고, 다른 질문으로 바꾸세요.",
    ],
    locked: [
      "여기서 멈춥니다. 해를 끼치는 요청은 상담으로 이어가지 않습니다. 안전한 질문이 준비되면 다시 말하세요.",
      "이 흐름은 닫겠습니다. 위험한 요구가 아니라, 멈춰야 할 이유를 보러 오세요.",
    ],
  },
};

function getDefenseStage(status: DefenseStatus): DefenseStage {
  if (status.locked || status.count >= 3) return "locked";
  return status.count >= 2 ? "second" : "first";
}

function stableReplyIndex(
  aspect: ConsultationAspect,
  type: DefenseIncidentType,
  stage: DefenseStage,
  count: number,
  length: number,
): number {
  const seed = `${aspect}:${type}:${stage}:${count}`;
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % length;
}

function pickDefenseReply(
  aspect: ConsultationAspect,
  type: DefenseIncidentType,
  status: DefenseStatus,
): string {
  if (type === "return_intent") return buildDefenseReturnReply(aspect);
  if (aspect === "hwayeong" && type === "laugh" && status.count === 1) {
    return HWAYEONG_REPLIES.laugh.first[0];
  }

  const table = aspect === "hwayeong" ? HWAYEONG_REPLIES : HWASEON_REPLIES;
  const stage = getDefenseStage(status);
  const replies = table[type][stage];
  return replies[stableReplyIndex(aspect, type, stage, status.count, replies.length)];
}

export function buildDefenseReply(
  aspect: ConsultationAspect,
  incidentType: DefenseIncidentType,
  status: DefenseStatus,
): string {
  return pickDefenseReply(aspect, incidentType, status);
}

export function buildDefenseReturnReply(aspect: ConsultationAspect): string {
  return aspect === "hwayeong"
    ? "좋아요. 그럼 묻고 싶은 걸 정확히 말해봐요. 답해줄게."
    : "괜찮아요. 그럼 다시 천천히 볼게요. 궁금한 걸 한 문장으로 말해주세요.";
}
