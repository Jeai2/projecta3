/**
 * 묵설(MookA) 메시지 수집(디바운스) 서비스
 * - 동일 사용자가 여러 메시지를 끊어 보낼 때 2~3초 대기 후 하나로 합쳐서 처리
 * - 도배(10개 이상) 감지 시 짜증 반응
 */

const DEBOUNCE_MS = 2500; // 2.5초
const SPAM_THRESHOLD = 10; // 이 개수 이상이면 도배로 간주

export interface MookADebounceInput {
  userId: string;
  message: string;
  birthDate?: string;
  birthTime?: string;
  gender?: "M" | "W";
  calendarType?: "solar" | "lunar";
  targetPerson?: string;
}

export interface MookADebounceResult {
  combinedMessage: string;
  messageCount: number;
  isSpam: boolean;
  birthDate?: string;
  birthTime?: string;
  gender?: "M" | "W";
  calendarType?: "solar" | "lunar";
  targetPerson?: string;
}

/** primary=false: 추가 메시지로 수집 중, 클라이언트는 응답을 사용자에게 보내지 말 것 */
export type CollectResult = MookADebounceResult | { primary: false; status: "collecting" };

type Resolver = (result: CollectResult) => void;
type Rejector = (error: unknown) => void;

interface PendingSession {
  messages: string[];
  timer: NodeJS.Timeout;
  primaryResolver: { resolve: Resolver; reject: Rejector } | null;
  lastContext: Omit<MookADebounceInput, "userId" | "message">;
}

const pendingSessions = new Map<string, PendingSession>();

function flush(userId: string): void {
  const session = pendingSessions.get(userId);
  if (!session || !session.primaryResolver) return;

  clearTimeout(session.timer);
  pendingSessions.delete(userId);

  const combinedMessage = session.messages.join(" ").trim();
  const messageCount = session.messages.length;
  const isSpam = messageCount >= SPAM_THRESHOLD;

  const result: MookADebounceResult = {
    combinedMessage: combinedMessage || "(빈 메시지)",
    messageCount,
    isSpam,
    ...session.lastContext,
  };

  session.primaryResolver.resolve(result);
}

/**
 * 메시지를 수집하고, 디바운스 시간이 지나면 결과를 반환.
 * - 첫 요청(primary): 2.5초 대기 후 합쳐진 메시지로 결과 반환.
 * - 추가 요청(secondary): 즉시 { primary: false, status: "collecting" } 반환.
 *   클라이언트는 이 응답을 사용자에게 보내지 말고, '묵설이가 읽고 있어요...' 등 상태만 표시.
 */
export function collectAndWait(input: MookADebounceInput): Promise<CollectResult> {
  const { userId, message, ...context } = input;

  return new Promise((resolve, reject) => {
    let session = pendingSessions.get(userId);

    if (!session) {
      session = {
        messages: [],
        timer: null as unknown as NodeJS.Timeout,
        primaryResolver: { resolve, reject },
        lastContext: context,
      };
      pendingSessions.set(userId, session);
    } else {
      // 추가 메시지: 버퍼에만 넣고 즉시 반환 (클라이언트는 응답 미전송)
      session.messages.push(message.trim());
      session.lastContext = context;
      clearTimeout(session.timer);
      session.timer = setTimeout(() => flush(userId), DEBOUNCE_MS);
      resolve({ primary: false, status: "collecting" });
      return;
    }

    session.messages.push(message.trim());
    session.lastContext = context;

    clearTimeout(session.timer);
    session.timer = setTimeout(() => flush(userId), DEBOUNCE_MS);
  });
}

/**
 * userId 없이 즉시 처리할 때 사용 (디바운스 비활성화)
 */
export function createImmediateResult(input: Omit<MookADebounceInput, "userId">): MookADebounceResult {
  return {
    combinedMessage: input.message.trim() || "(빈 메시지)",
    messageCount: 1,
    isSpam: false,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    calendarType: input.calendarType,
    targetPerson: input.targetPerson,
  };
}
