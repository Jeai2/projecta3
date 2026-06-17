import type { ConsultationAspect } from "../aspects/aspect.types";

/**
 * 주체(主體) 확인 되물음 — A안.
 *
 * 추론(inferSubject 등)이 처리하는 90% 케이스 위에 얹는 "확실한 대비책".
 * User가 제3자(남편/짝남/친구 등)를 언급했는데, 그 점사가 본인 얘기인지
 * 그 사람 얘기인지 불분명할 때만, 화선/화영이 한 줄 되물어 주체를 고정한다.
 *
 * - 화선(낮): 듣다가 놓친 듯 미안해하는 톤
 * - 화영(밤): 직설적으로 다시 말해달라는 톤
 *
 * 과하게 묻지 않도록 보수적으로 판정하고, 쿨다운으로 연속 되물음을 막는다.
 */

// 제3자(주체 후보) 단어 → 되물음에서 쓸 호칭
const TARGET_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /엄마|어머니|모친/, label: "어머니" },
  { pattern: /아빠|아버지|부친/, label: "아버지" },
  { pattern: /남편|신랑/, label: "남편분" },
  { pattern: /아내|와이프|마누라/, label: "아내분" },
  { pattern: /남자친구|남친/, label: "남자친구" },
  { pattern: /여자친구|여친/, label: "여자친구" },
  { pattern: /짝남|짝녀|짝사랑|좋아하는\s*사람/, label: "그 사람" },
  { pattern: /썸남|썸녀|썸\s*타|썸\s*남|썸\s*녀/, label: "그 사람" },
  { pattern: /그\s*사람|그사람|그분|그\s*애|걔/, label: "그 사람" },
  { pattern: /친구|지인/, label: "친구분" },
  { pattern: /동료|상사|선배|후배|사장|팀장|직장\s*사람|회사\s*사람/, label: "그분" },
  { pattern: /언니|누나|오빠|형|동생|아들|딸|자녀|부모님|시어머니|시댁|장모|장인/, label: "그분" },
];

// 본인 얘기로 분명한 신호
const SELF_PATTERN =
  /(^|\s)(나|나는|난|내|내가|저|저는|전|제|제가|본인|내\s*거|제\s*거|내\s*꺼|제\s*꺼)(\s|의|도|가|는|를|에게|한테|$)/;
// 관계/궁합 프레이밍 → 관계 풀이로 보고 되묻지 않음
const RELATIONSHIP_FRAME =
  /랑|이랑|와\s|과\s|하고|우리|사이|관계|궁합|잘\s*될|잘\s*맞|결혼|혼인|부부|연애|헤어|이별|재회|마음|속마음|좋아|사랑/;
// "남편 운세/사주" 처럼 제3자가 주체로 분명한 경우
const READING_WORD = /운세|사주|점\s*(봐|보|쳐)|풀이|팔자|신수/;
// "~ 때문에/탓에" → 제3자는 맥락일 뿐, 주체는 본인
const CONTEXT_NOT_SUBJECT = /때문|탓|덕분|덕에/;

function findTargetLabel(message: string): string | null {
  const hit = TARGET_LABELS.find(({ pattern }) => pattern.test(message));
  return hit ? hit.label : null;
}

/**
 * 주체가 모호한지 판정한다. 모호할 때만 되물을 호칭과 함께 반환한다.
 * 보수적으로: 제3자 단어가 떠 있고, 본인/관계/그사람-점사/맥락 신호가 모두 없을 때만 모호로 본다.
 */
export function detectAmbiguousSubject(message: string): { targetLabel: string } | null {
  const targetLabel = findTargetLabel(message);
  if (!targetLabel) return null; // 제3자 언급 자체가 없음
  if (SELF_PATTERN.test(message)) return null; // "나/내가 …" → 본인 얘기
  if (CONTEXT_NOT_SUBJECT.test(message)) return null; // "~ 때문에" → 제3자는 맥락
  if (RELATIONSHIP_FRAME.test(message)) return null; // 관계/궁합 프레이밍
  if (READING_WORD.test(message)) return null; // "남편 운세/사주" → 그 사람이 주체로 분명
  return { targetLabel };
}

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function buildSubjectClarifyReply(aspect: ConsultationAspect, targetLabel: string): string {
  if (aspect === "hwayeong") {
    // 화영: 직설적으로 다시 말해달라
    return pick([
      `잠깐. 다시 한 번 — 이거 네 얘기야, 아니면 ${targetLabel} 얘기야?`,
      `흐름이 갈렸어. 본인 걸 볼지, ${targetLabel} 걸 볼지 분명히 말해줘.`,
      `누구 걸 보라는 거야? 너야, ${targetLabel}야? 정확히 말해주면 거기서부터 봐줄게.`,
    ]);
  }
  // 화선: 듣다가 놓친 듯 미안해하며
  return pick([
    `아, 잠깐만요. 제가 흐름을 잠깐 놓쳤어요 — 지금 보려는 건 본인 쪽이에요, 아니면 ${targetLabel} 쪽이에요?`,
    `어머, 미안해요. 한 박자 놓친 것 같아요. 본인 얘기로 볼까요, ${targetLabel} 얘기로 볼까요?`,
    `잠깐만요, 제가 살짝 놓쳤네요. 이건 본인 흐름인가요, ${targetLabel} 흐름인가요? 알려주시면 그쪽으로 펼쳐볼게요.`,
  ]);
}

const COOLDOWN_TURNS = 4;
const lastClarifyTurn = new Map<string, number>();

/**
 * 주체가 모호하면 되물음 멘트를 반환한다(쿨다운 통과 시). 아니면 null.
 * 카드 뽑기 직전에 호출해서, 모호한 턴에는 뽑지 않고 먼저 주체를 확인한다.
 */
export function decideSubjectClarify(
  userId: string,
  message: string,
  turnCount: number,
  aspect: ConsultationAspect,
): { reply: string; targetLabel: string } | null {
  const detected = detectAmbiguousSubject(message);
  if (!detected) return null;

  const last = lastClarifyTurn.get(userId);
  if (last !== undefined && turnCount - last < COOLDOWN_TURNS) return null; // 너무 자주 되묻지 않음

  lastClarifyTurn.set(userId, turnCount);
  return {
    reply: buildSubjectClarifyReply(aspect, detected.targetLabel),
    targetLabel: detected.targetLabel,
  };
}
