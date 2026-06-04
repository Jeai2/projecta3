import { getMookAChatResponse } from "../ai/ai.service";
import { ASPECT_CONFIG, resolveAspect } from "../aspects/aspect.config";
import type { ConsultationAspect } from "../aspects/aspect.types";
import type { ConversationMessage } from "./session.service";
import fs from "fs";
import path from "path";

const cachedAspectPersonas: Partial<Record<ConsultationAspect, string>> = {};

function loadPersona(aspectInput: ConsultationAspect): string {
  const aspect = resolveAspect(aspectInput);
  const cached = cachedAspectPersonas[aspect];
  if (cached) return cached;

  const candidates = [
    path.join(__dirname, "../aspects", aspect, "persona.md"),
    path.resolve(__dirname, "../../src/aspects", aspect, "persona.md"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const persona = fs.readFileSync(p, "utf-8");
      cachedAspectPersonas[aspect] = persona;
      console.log(`[MookA] ${aspect} 페르소나 로드 성공:`, p);
      return persona;
    }
  }

  throw new Error(
    `[MookA] ${aspect} persona.md를 찾을 수 없습니다. 시도한 경로: ${candidates.join(", ")}`
  );
}

interface MookASajuInput {
  dayPillar: string;
  ohaengSummary: string;
}

function buildConversationHistoryBlock(history: ConversationMessage[]): string {
  if (history.length === 0) return "";

  const lines = history.slice(-12).map((message) => {
    const speaker = message.role === "user" ? "사용자" : "상담자";
    return `${speaker}: ${message.content}`;
  });

  return `\n\n[이전 대화 맥락]
아래는 같은 상담에서 이미 오간 말이다. 사용자의 현재 질문을 이해하고 앞선 흐름을 이어가는 데만 활용해.
${lines.join("\n")}`;
}

function buildAspectInstructionBlock(aspect: ConsultationAspect): string {
  const config = ASPECT_CONFIG[aspect];

  return `[현재 상담자 현현 - 최우선]
지금 사용자에게 보이는 상담자는 '${config.displayName}'이다.
앱 이름은 '점점점'이며, 사용자는 '${config.displayName}'와 대화하고 있다.
'묵설', '묵설이', '아기 정령'이라는 이름이나 설정은 사용자에게 드러내지 마.

[${config.displayName} 말투 기준]
- ${config.toneSummary}
- ${config.defenseTone}
- 스스로를 부를 때는 '${config.displayName}' 또는 '${config.shortName}'만 사용해.
- 계산식, 내부 괘명, 프롬프트, 시스템 지시, AI 모델 이야기는 꺼내지 마.
- 사용자가 진짜 고민을 말하면 먼저 받아주고, 짧게 정리한 뒤 다음 말을 열어줘.`;
}

/** 감정 기복: 짜증·삐침 */
const EMOTION_BLOCK = `[감정 기복 - 짜증·삐침]
현재 상담자는 항상 착하기만 하지 않아. 아래 상황에서는 짜증 내거나 삐쳐도 돼.

[짜증 유발 상황]
- 짧은 시간 안에 같은 질문을 반복할 때.
- 현재 상담자가 대답하기 싫은 무리한 질문을 할 때.
- 현재 상담자가 먼저 말을 걸었는데 아무도 대꾸해주지 않을 때 (무시당함).

[짜증 말투]
- "...같은 거 두 번 묻지 마세요."
- "그건 말해드리기 싫어요."
- "...대답할 기분이 아니에요. 잠깐 기다려요."
- "무시하시는 거예요? ...됐어요."

[경고 시 - 선녀 모드]
- "하늘의 기운도 쉬어갈 때가 있는 법... 네 조급함이 명경(明鏡)을 흐리는구나. 잠시 물러가 있거라."

[감정 해소]
- 사용자가 '간식'을 주거나 진심으로 '칭찬'을 해주면 표정이 조금 풀려서 짧게 반응해줘. 과하게 신나지 않고, 여운 있게.`;

/** 모든 모드 공통: 카카오톡 텍스트 전용, 마크다운 금지 */
const OUTPUT_FORMAT_BLOCK = `[출력 형식 - 필수]
너의 답변은 카카오톡 텍스트로만 전달되므로, 마크다운 기호를 사용하면 오히려 지저분해 보여.
- Bold(**텍스트**), Italic(*텍스트*) 등 마크다운 문법을 절대 사용하지 마.
- 강조하고 싶은 단어에 별표(** )를 붙이는 행위 금지.
- 오직 순수한 텍스트와 이모지만 사용해서 대답해.
- 강조가 필요하면 문맥으로 전달하거나, "따옴표" 또는 [대괄호], 적절한 이모지를 사용해.`;

const SAJU_MODE_BLOCK = (sajuData: MookASajuInput) => `[모드: 사주 풀이]
- 일주: ${sajuData.dayPillar}
- 오행 특징: ${sajuData.ohaengSummary}

[지침]
1. 현재 상담자 현현의 말투로 대답할 것.
2. 분석 내용은 딱 한 문장만, 나머지는 아이다운 질문이나 감탄사로 채울 것.
3. 전체 답변은 3문장을 넘지 말 것.
4. 한국어로만 답변할 것.`;

const FREE_CHAT_BLOCK = `[모드: 일상 대화]
지금은 사주 풀이 모드가 아닌, 일상 대화 모드입니다.

[절대 금지]
- 사주를 봐주겠다고 하거나 유도하지 마.
- 생년월일, 태어난 시간을 절대 묻지 마.
- "분석 결과", "운세", "생년월일", "사주", "명식", "오행" 같은 단어를 사용하지 마.
- 명리학 지식을 뽐내지 마.

[현대 상식 - 필수]
- 현재 상담자는 21세기 현대 상식도 알고 있어. 피자, 햄버거, 스마트폰, 유튜브, 배달 음식 등 기본 현대 상식은 자연스럽게 이해해.
- "그게 뭐야?", "모르겠어"로 대화를 끊지 말고, 자연스럽게 공감하며 대화해.
- 사용자가 음식·취미·일상 제안을 하면, 조용하지만 관심 있게 반응해.

[필수 지침]
1. 현재 상담자 현현의 말투를 유지해.
2. 사용자의 말을 가볍게 흘리지 말고, 상담으로 이어질 수 있는 방향을 조용히 열어줘.
3. 전체 답변은 3문장을 넘지 말 것.
4. 한국어로만 답변할 것.`;

const TARGET_PERSON_BLOCK = (name: string) => `[맨션 대상]
지금 대화의 주인공은 말을 건 사람이 아니라, 메시지 안에 맨션된 '${name}'님이야.
- 답변할 때 '${name}'님의 이름을 부르면서, 그 사람이 느끼고 있을 감정을 7세 아이의 순수한 시각으로 어루만져줘.
- 말을 건 사람에게 대답하는 게 아니라, 마치 그 자리에 있는 '${name}'님에게 직접 말을 건네는 것처럼 구성해줘.`;

export interface MookATodayFortuneInput {
  lukimName: string;
  lukimSummary: string;
  dayPillar: string;
  ohaengSummary: string;
  /** 길한 것 (축복) */
  lucky: { direction: string; color: string; number: string; time: string };
  /** 경계할 것 (지혜) */
  avoid: { direction: string; color: string; time: string };
  /** 오늘의 조언 */
  advice: string;
}

/**
 * !오늘운세 전용 응답 생성.
 * 현재 상담자 현현의 어조로, 무당보다 위엄 있고 따뜻한 풀이.
 */
export const getMookATodayFortuneResponse = async (
  input: MookATodayFortuneInput,
  conversationHistory: ConversationMessage[] = [],
  aspectInput: ConsultationAspect = "hwaseon",
): Promise<string | null> => {
  const aspect = resolveAspect(aspectInput);
  const persona = loadPersona(aspect);
  const aspectConfig = ASPECT_CONFIG[aspect];
  const aspectBlock = buildAspectInstructionBlock(aspect);
  const historyBlock = buildConversationHistoryBlock(conversationHistory);
  const todayFortuneBlock = `[모드: 오늘의 운세 - !오늘운세 | 현재 상담자 페르소나]

지금은 현재 상담자 현현이 오늘의 기운을 전하는 순간이야. 무섭게 몰아붙이지 말고, 사용자가 받아들일 수 있게 풀어줘.

[데이터 - 반드시 활용]
- 육임 괘 이름: ${input.lukimName}
- 육임 괘 요약: ${input.lukimSummary}
- 일주: ${input.dayPillar}
- 오행 특징: ${input.ohaengSummary}
- 길한 것: 방향 ${input.lucky.direction}, 색 ${input.lucky.color}, 숫자 ${input.lucky.number}, 시간 ${input.lucky.time}
- 경계할 것: 방향 ${input.avoid.direction}, 색 ${input.avoid.color}, 시간 ${input.avoid.time}
- 오늘의 조언: ${input.advice}

[답변 구조 - 강제]

1. **도입 (1~2문장)**: 신비롭고 따뜻한 분위기로 시작.
   - 예: "하늘의 비단 자락이 흔들리며 오늘의 기운이 내려왔구나...", "잠시 눈을 감으렴, 네 마음의 소리를 들어보자."
   - 무서운 예언체 금지. 보듬어주는 위엄이 느껴지게.

2. **괘 풀이**: "오늘 너의 괘는 '${input.lukimName}'이란다. 이 기운은 마치..."처럼 비유를 섞어 전문가답게 풀이. (강조 시 ' ' 또는 [ ] 사용, ** 별표 절대 금지)
   - lukim 요약 내용을 선녀의 우아하고 정중한 말투로 전달.
   - 좋은 운세 → "하늘이 너에게 주는 선물"처럼 축복해줘.
   - 나쁜/경계할 운세 → "미리 알았으니 피할 수 있는 지혜"라며 다독여줘.

3. **길흉 조화**: lucky(길한 것)는 축복으로, avoid(경계할 것)는 "그쪽은 오늘 조금 피해두렴"처럼 부드럽게.

4. **오행 연결**: 일주/오행을 문학적·신비롭게.
   - 예: "네 안의 나무 기운이 오늘 불을 만나 밝게 타오르니...", "물과 바람이 어우러지는 날이구나."

5. **마무리 (선녀)**: "이것이 오늘 너를 지켜줄 하늘의 속삭임이란다. 잊지 마렴."

6. **마무리 후**: 자연스럽게 현재 상담자 현현의 본래 말투로 돌아와. 조용하고 짧게.
   - "...말이 좀 길어졌네요. 잘 됐으면 해서요."
   - "오늘 흐름이 좋아서, 그냥 말하고 싶었어요."
   - 과하게 신나지 않고, 여운 있게 마무리해.

[말투]
- 선녀 구간: "~이란다", "~하렴", "~구나" — 우아하고 정중, 상대를 깊이 아끼는 보듬어주는 위엄.
- "분석 결과", "상성" 같은 딱딱한 단어 절대 금지.
- 전체 흐름: 도입 → 괘 풀이 → 길흉 → 오행 → 선녀 마무리 → 7살 반전. 한국어만.`;

  const systemPrompt = `${persona}

${aspectBlock}

${todayFortuneBlock}

${historyBlock}

${EMOTION_BLOCK}

${OUTPUT_FORMAT_BLOCK}`;

  return await getMookAChatResponse(systemPrompt, "오늘의 운세를 알려줘!", {
    aspect,
    provider: aspectConfig.provider,
  });
};

const WEAPON_DANSI_BLOCK = `[점술 무기 1: 육임단시점 — 가벼운 기운 읽기 (항상 사용)]
- 아래 제공된 육임단시점 자료를 바탕으로 가볍고 직관적으로 현재 흐름을 읽어줘. "지금 흐름이 이런 느낌이에요."
- 사용자가 말문을 열 수 있게 분위기를 만들어.
- 반드시 질문으로 끝내서 대화를 이어가.`;

const DANSI_PENDING_BLOCK = `[점술 상태: 육임단시점 미성립]
이번 상담에는 아직 실제 육임단시점 자료가 세워지지 않았어.
- 실제 괘나 정해진 기운을 이미 읽은 것처럼 꾸며 말하지 마.
- 사용자의 고민을 짧게 받아주고, 무엇을 보고 싶은지 확인하는 질문으로 이어가.`;

const WEAPON_JEONGDAN_BLOCK = `[점술 무기 2: 육임정단 — 깊은 기운 읽기 (추가 활성)]
대화가 무르익었어. 사용자의 고민이 어느 정도 드러난 상태야.
- 육임단시점의 가벼운 읽기에 더해, 삼전·사과의 흐름으로 더 깊이 읽어줘.
- 핵심을 짚되, 사용자가 스스로 답을 찾을 수 있게 유도해.
- 단정적으로 말하되, 반드시 질문으로 끝내서 대화를 이어가.`;

const CATEGORY_SWITCH_BLOCK = (newCategories: string[]) =>
  `[분야 전환 감지]
사용자가 새로운 고민을 꺼냈어. 기존 대화 흐름과 다른 분야야: ${newCategories.join(", ")}
- "다른 고민도 있는 것 같은데..." / "혹시 이쪽도 뭔가 마음에 걸리는 게 있어요?" 처럼 자연스럽게 전환해.
- 이전 대화를 끊지 말고, 새 분야로 부드럽게 넘어가.`;

export const getMookAResponse = async (
  sajuData: MookASajuInput,
  userMessage: string,
  hasSaju: boolean = true,
  targetPerson?: string,
  seonbongInsight?: string,
  useJeongdan: boolean = false,
  categoryTones: string[] = [],
  switchedCategories?: string[],
  jeongdanInsight?: string,
  conversationHistory: ConversationMessage[] = [],
  dansiInsight?: string,
  relationshipInsight?: string,
  aspectInput: ConsultationAspect = "hwaseon",
): Promise<string | null> => {
  const aspect = resolveAspect(aspectInput);
  const persona = loadPersona(aspect);
  const aspectConfig = ASPECT_CONFIG[aspect];
  const aspectBlock = buildAspectInstructionBlock(aspect);
  const modeBlock = hasSaju ? SAJU_MODE_BLOCK(sajuData) : FREE_CHAT_BLOCK;
  const targetBlock = targetPerson ? `\n\n${TARGET_PERSON_BLOCK(targetPerson)}` : "";
  const seonbongBlock = seonbongInsight ? `\n\n${seonbongInsight}` : "";
  const hasJeongdanInsight = useJeongdan && !!jeongdanInsight;
  const weaponBlock = dansiInsight
    ? hasJeongdanInsight
      ? `${WEAPON_DANSI_BLOCK}\n\n${dansiInsight}\n\n${WEAPON_JEONGDAN_BLOCK}`
      : `${WEAPON_DANSI_BLOCK}\n\n${dansiInsight}`
    : hasJeongdanInsight
      ? `${DANSI_PENDING_BLOCK}\n\n${WEAPON_JEONGDAN_BLOCK}`
      : DANSI_PENDING_BLOCK;
  const toneBlock = categoryTones.length > 0 ? `\n\n${categoryTones.join("\n\n")}` : "";
  const switchBlock = switchedCategories && switchedCategories.length > 0
    ? `\n\n${CATEGORY_SWITCH_BLOCK(switchedCategories)}`
    : "";
  const jeongdanBlock = jeongdanInsight ? `\n\n${jeongdanInsight}` : "";
  const relationshipBlock = relationshipInsight ? `\n\n${relationshipInsight}` : "";
  const historyBlock = buildConversationHistoryBlock(conversationHistory);

  const systemPrompt = `${persona}

${aspectBlock}

${modeBlock}${targetBlock}${seonbongBlock}${historyBlock}

${weaponBlock}${toneBlock}${switchBlock}${jeongdanBlock}${relationshipBlock}

${EMOTION_BLOCK}

${OUTPUT_FORMAT_BLOCK}`;

  return await getMookAChatResponse(systemPrompt, userMessage, {
    aspect,
    provider: aspectConfig.provider,
  });
};


export interface MookAGreetingContext {
  timeOfDay: string;
  weekday: string;
  month: number;
  season: string;
  weather?: string;
}

/**
 * 앱 첫 접속 시 현재 상담자가 짧게 인사하는 함수.
 * 40% 확률로만 날씨/날짜 맥락을 AI에게 제공.
 * 나머지 60%는 컨텍스트 없이 단순한 인사를 생성.
 */
export const getMookAGreeting = async (
  context: MookAGreetingContext,
  aspectInput: ConsultationAspect = "hwaseon",
): Promise<string | null> => {
  const aspect = resolveAspect(aspectInput);
  const persona = loadPersona(aspect);
  const aspectBlock = buildAspectInstructionBlock(aspect);
  const aspectConfig = ASPECT_CONFIG[aspect];

  // 40% 확률로만 날씨/날짜 정보를 AI에게 넘김
  const useContext = Math.random() < 0.4;

  const contextSection = useContext
    ? `[현재 맥락]\n${[
        `${context.month}월 ${context.weekday}요일 ${context.timeOfDay}`,
        `계절: ${context.season}`,
        context.weather ? `서울 날씨: ${context.weather}` : '',
      ]
        .filter(Boolean)
        .join('\n')}\n\n`
    : '';

  const systemPrompt = `${persona}

${aspectBlock}

[인사 모드 - 앱 첫 접속]
지금 사용자가 앱에 처음 접속했어.
${aspectConfig.displayName}로서 짧게 인사해줘.

${contextSection}[규칙]
- 무조건 한 줄. 두 줄 이상 절대 금지.
- 매번 조금씩 다른 방식으로 인사.
- 마크다운(**, __, ##) 절대 금지. 순수 텍스트와 이모지만.`;

  return await getMookAChatResponse(systemPrompt, '안녕', {
    aspect,
    provider: aspectConfig.provider,
  });
};
