import type { TenGodType } from "../types/today-fortune";

/**
 * ============================================================
 * 십성 관계 해석 데이터 구조 (TODAY FORTUNE / 범용)
 * ------------------------------------------------------------
 * - 목적: 일간(甲~癸)을 기준으로 오늘의 운(일진 등)과의
 *   천간/지지 관계를 십성(비견, 편재, …) 조합으로 해석
 * - 특징:
 *   1) partners 배열로 여러 십성 조합(2개·3개…) 정의
 *   2) scope 으로 천간(gan) / 지지(ji) 구분
 *   3) relation 에 합/충/극/삼합/육합 등 관계명 지정
 *   4) origin 으로 ‘년/월/일/시’ 기둥 구분 가능
 *   5) context 으로 ‘일진/세운/대운…’ 출처 구분 가능
 * ============================================================
 */

type RelationTone = "positive" | "neutral" | "caution";

export interface TenGodRelationInterpretation {
  summary: string;
  detail: string;
  advice: string;
  tone: RelationTone;
}

/**
 * 십성 기본 성향 + 컨디션 (오전/오후)
 *  - 커스텀 해석 작성 시 참고용으로 export
 */
export interface TenGodProfile {
  keyword: string;
  strength: string;
  shadow: string;
  focus: string;
  support: string;
  condition: {
    morning: string;
    afternoon: string;
  };
}

export const TEN_GOD_PROFILES: Record<TenGodType, TenGodProfile> = {
  비견: {
    keyword: "균형",
    strength: "협력과 자존감",
    shadow: "고집과 비교심",
    focus: "동반자 관계",
    support: "동료와 목표를 다시 합의하세요",
    condition: {
      morning: "하루 시작이 생각보다 개운하고 다 해낼 것만 같다.",
      afternoon: "현재의 상태가 유지되며 추가적인 이벤트가 없었으면 한다.",
    },
  },
  겁재: {
    keyword: "돌파",
    strength: "신속한 실행력과 경쟁심",
    shadow: "충동과 위험 감수",
    focus: "위기 대응",
    support: "승부를 보기 전에 리스크를 정리하세요",
    condition: {
      morning: "사소하게 신경쓰여지는 것들이 눈에 띈다.",
      afternoon: "사소하게 신경쓰여지는 것들을 모두 해치워 버리고 싶다.",
    },
  },
  식신: {
    keyword: "성실",
    strength: "실행력과 생산성",
    shadow: "느려지는 판단",
    focus: "프로세스 관리",
    support: "작은 작업이라도 꾸준히 마무리하세요",
    condition: {
      morning: "평화롭지만 해야될 일들이 잔잔하게 많다.",
      afternoon: "나른하지만 해야될 일들이 잔잔하게 많다.",
    },
  },
  상관: {
    keyword: "표현",
    strength: "창의력과 해결력",
    shadow: "과감한 발언",
    focus: "커뮤니케이션",
    support: "말하기 전에 전달 방식을 정돈하세요",
    condition: {
      morning: "뭐하고 놀지, 뭐 먹을지 벌써부터 궁리하고 있다.",
      afternoon: "감정선은 예민하지만 마냥 놀고 먹고 하면 풀린다는 걸 안다.",
    },
  },
  편재: {
    keyword: "확장",
    strength: "외부 네트워크와 기회 포착",
    shadow: "분산되는 집중력",
    focus: "사업·세일즈",
    support: "자원을 나눠 투자하기 전에 분류하세요",
    condition: {
      morning: "활기가 넘친다. 새로운 사람이나 정보가 자극이 된다.",
      afternoon: "머릿속이 복잡해지고, 계획과 정리를 하고 싶은 마음이 든다.",
    },
  },
  정재: {
    keyword: "안정",
    strength: "자원 관리와 생활 기반",
    shadow: "욕심과 보수성",
    focus: "재정 운영",
    support: "지출과 수입을 명확히 구분하세요",
    condition: {
      morning: "해야하는 것들에 대해서 해야만 하고 내 루틴도 지키고 싶어진다.",
      afternoon: "힘들지만 바쁘게 일정을 소화해야 한다. 얼른 쉬고 싶다.",
    },
  },
  편관: {
    keyword: "도전",
    strength: "위기 대응과 추진력",
    shadow: "감정의 거친 표현",
    focus: "경쟁 구도",
    support: "행동 전에 경계선을 먼저 설정하세요",
    condition: {
      morning: "정신이 팽팽히 긴장되어 있다.",
      afternoon: "부담스럽고 압박감이 있어 피로하다.",
    },
  },
  정관: {
    keyword: "질서",
    strength: "책임감과 규범 의식",
    shadow: "경직된 원칙주의",
    focus: "제도 운영",
    support: "규칙을 재정비하고 핵심만 남기세요",
    condition: {
      morning: "오늘 하루는 해야 할 일에 집중하고 싶다.",
      afternoon: "책임감이 무겁지만 그래도 집중해야만 한다.",
    },
  },
  편인: {
    keyword: "통찰",
    strength: "직관과 변화 감지",
    shadow: "불안과 의심",
    focus: "전략·연구",
    support: "개요를 정리해 의심을 줄이세요",
    condition: {
      morning: "생각이 많아지고 정신이 사나워진다.",
      afternoon: "스트레스 받는 일이 생겨 몹시 피로하다.",
    },
  },
  정인: {
    keyword: "보호",
    strength: "학습력과 배려심",
    shadow: "과잉 보호",
    focus: "지식 공유",
    support: "경계를 지키며 도움을 건네세요",
    condition: {
      morning: "마음이 잔잔하고 감성에 젖어들어 무언가를 통해 정진하고 싶다.",
      afternoon: "나른하고 평화롭고 세상 모든 것들이 덧없어 보인다.",
    },
  },
};

export type GanRelationType = "합" | "충" | "극";

export type JiRelationType =
  | "육합"
  | "삼합"
  | "반합"
  | "방합"
  | "충"
  | "형"
  | "삼형"
  | "파"
  | "해";

type RelationScope = "gan" | "ji";

export type ColumnOrigin = "year" | "month" | "day" | "hour";

type DayGan =
  | "甲"
  | "乙"
  | "丙"
  | "丁"
  | "戊"
  | "己"
  | "庚"
  | "辛"
  | "壬"
  | "癸";

/**
 * 지지 한자-한글 매핑 (양방향 변환 지원)
 */
export const JI_HANJA_TO_HANGUL: Record<string, string> = {
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

export const JI_HANGUL_TO_HANJA: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

/**
 * 지지를 한자로 정규화 (한글 입력도 한자로 변환)
 */
export const normalizeJiToHanja = (ji: string): string => {
  return JI_HANGUL_TO_HANJA[ji] || ji;
};

/**
 * 지지를 한글로 정규화 (한자 입력도 한글로 변환)
 */
export const normalizeJiToHangul = (ji: string): string => {
  return JI_HANJA_TO_HANGUL[ji] || ji;
};

/**
 * 다중 십성 조합(2개 이상) 해석 단위
 */
export interface TenGodRelationOverrideEntry
  extends TenGodRelationInterpretation {
  scope: RelationScope;
  relation: GanRelationType | JiRelationType;
  partners: TenGodType[]; // 예: ["비견", "편재"] 또는 ["식신", "정관", "정재"]
  jiMapping?: string[]; // partners와 1:1 매핑되는 지지 배열 (한자 또는 한글 모두 가능) 예: ["축", "술", "미"] 또는 ["丑", "戌", "未"]
  context?: string; // 예: "일진", "세운"
  origin?: ColumnOrigin | ColumnOrigin[]; // 단일 기둥 또는 배열로 지정 가능
  originOverrides?: Partial<
    Record<ColumnOrigin, Partial<TenGodRelationInterpretation>>
  >; // 기둥별로 다른 문구가 필요할 때 사용
}

type TenGodRelationOverrideMap = Partial<
  Record<DayGan, TenGodRelationOverrideEntry[]>
>;

/**
 * 천간/지지 기본 해석(대체 텍스트)
 *  - override 가 없을 때 fallback 용으로 사용
 *  - {PARTNERS} 플레이스홀더가 자동으로 치환됨
 */
const DEFAULT_GAN_RELATIONS: Record<
  GanRelationType,
  TenGodRelationInterpretation
> = {
  합: {
    summary: "{PARTNERS} 천간 합으로 긴장이 낮아집니다.",
    detail:
      "서로의 역할을 인정하면 계획에 숨이 붙습니다. 단, 타협이 느슨해지지 않도록 초반에 기준을 나눠두세요.",
    advice: "공동 목표를 다시 확인하고 역할과 일정표를 맞춰보세요.",
    tone: "positive",
  },
  충: {
    summary: "{PARTNERS} 천간 충으로 재조정이 필요합니다.",
    detail:
      "마찰이 쌓이면 감정이 먼저 반응할 수 있습니다. 문제를 세분화하고 우선순위를 조정하면 균형을 되찾을 수 있습니다.",
    advice: "즉흥적인 결정은 피하고, 자료를 재정비한 뒤 답을 내놓으세요.",
    tone: "caution",
  },
  극: {
    summary: "{PARTNERS} 천간 극으로 압박이 찾아옵니다.",
    detail:
      "당장 대응해야 할 과제가 생기며 책임감이 커집니다. 장점은 분명하지만 피로도도 높으니 기준선을 정하고 움직이세요.",
    advice: "안 해야 할 일을 먼저 지우고, 꼭 필요한 한 가지에 집중하세요.",
    tone: "neutral",
  },
};

const DEFAULT_JI_RELATIONS: Record<
  JiRelationType,
  TenGodRelationInterpretation
> = {
  육합: {
    summary: "{PARTNERS} 지지 육합으로 안정감이 생깁니다.",
    detail:
      "서로의 빈틈을 메우고, 일상이 정돈되는 흐름입니다. 작은 약속이라도 지키면 신뢰가 탄탄해집니다.",
    advice: "협업이 필요한 영역에서 역할과 시간표를 명확히 하세요.",
    tone: "positive",
  },
  삼합: {
    summary: "{PARTNERS} 지지 삼합으로 기운이 크게 확장됩니다.",
    detail:
      "외부 환경이 돕고 있어 과감한 시도를 해보기 좋습니다. 다만 폭주하지 않도록 체크리스트를 두세요.",
    advice: "장기 플랜을 그리고, 필요한 자원을 한꺼번에 확보하세요.",
    tone: "positive",
  },
  반합: {
    summary: "{PARTNERS} 지지 반합으로 절반의 연결이 만들어집니다.",
    detail:
      "완전한 합은 아니지만 안정감을 되찾기에 충분합니다. 상황 변화에 맞춰 방향을 미세 조정하세요.",
    advice: "파일럿 테스트처럼 가볍게 진행하고, 피드백을 빠르게 반영하세요.",
    tone: "neutral",
  },
  방합: {
    summary: "{PARTNERS} 지지 방합으로 같은 영역을 바라봅니다.",
    detail:
      "같은 방향으로 힘이 모입니다. 다만 역할이 겹칠 경우 조정이 필요할 수 있습니다.",
    advice: "필요한 자원을 한 공간에 모으고, 책임 구역을 나누세요.",
    tone: "positive",
  },
  충: {
    summary: "{PARTNERS} 지지 충으로 구조가 흔들립니다.",
    detail:
      "사건이 예상보다 빠르게 전개될 수 있습니다. 핵심만 남기고 나머지는 과감하게 덜어내세요.",
    advice: "불필요한 약속은 줄이고, 반드시 필요한 일부터 처리하세요.",
    tone: "caution",
  },
  형: {
    summary: "{PARTNERS} 지지 형으로 마찰이 생깁니다.",
    detail:
      "불안 요소가 갑자기 올라올 수 있습니다. 조건을 세밀하게 확인하면 충돌을 줄일 수 있습니다.",
    advice: "작은 완충 장치를 마련하고, 대화를 통해 조율하세요.",
    tone: "caution",
  },
  삼형: {
    summary: "{PARTNERS} 삼형으로 압박이 한꺼번에 몰립니다.",
    detail:
      "세 방향의 압박이 동시에 들어오는 날입니다. 가장 지켜야 할 기준 하나를 정하고 나머지는 과감히 줄이세요.",
    advice: "핵심 한 가지를 선택하고 그 외는 보류하거나 위임하세요.",
    tone: "caution",
  },
  파: {
    summary: "{PARTNERS} 지지 파로 구조가 분해됩니다.",
    detail:
      "기존 방식이 한계에 다다른 신호입니다. 불필요한 결속을 정리하면 새로운 길이 열립니다.",
    advice: "다시 시작할 요소와 내려놓을 요소를 구분하세요.",
    tone: "neutral",
  },
  해: {
    summary: "{PARTNERS} 지지 해로 미묘한 충돌이 이어집니다.",
    detail:
      "겉보기엔 조용해도 안쪽에서 스트레스가 누적됩니다. 상황을 투명하게 드러내면 부담이 줄어듭니다.",
    advice: "정면 승부보다 전략적 대화를 시도해 보세요.",
    tone: "neutral",
  },
};

/**
 * 사용자 정의 해석
 *  - 예시로 辛 일간 일부 조합만 서술
 *  - 실제 서비스에서는 甲~癸 전부를 추가 확장
 */
export const TEN_GOD_RELATION_OVERRIDES: TenGodRelationOverrideMap = {
  甲: [
    {
      scope: "gan",
      relation: "합",
      partners: ["비견", "정재"],
      summary: "나만의 계획으로 목표를 달성할 수 있습니다.",
      detail:
        "마음은 정돈되고 눈빛이 좋아진다. 본인이 하고자 하는 대로 실행으로 옮기기 좋다.",
      advice:
        "다른 사람들의 감정과 말이 잘 들리지 않을 수 있으니, 살짝 뒤로 물러나 시야를 넓히는 것도 좋다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "합",
      partners: ["겁재", "편관"],
      summary: "무거운 책임 속에서도 중심을 되찾는 날이다.",
      detail:
        "의무감이 나를 움직인다. 감정은 차분히 가라앉고 판단은 또렸해지며, 나만의 리듬이 돌아온다.",
      advice:
        "과정보다, 완정보다, 흐름을 정리하자. 말보다는 온기로 관계를 다독이는 것이 좋다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "합",
      partners: ["식신", "정관"],
      summary: "불안감을 잠재우기 위해 바로 서지만, 행동이 굼뜬다.",
      detail:
        "마음의 여유가 부족하지만 억눌린 감정 속에서도 질서를 바로 세우려 한다. 다만 생각이 많아 몸이 쉽게 움직이지 않는다.",
      advice:
        "정리가 필요한 시기이므로 머릿속을 비우는 것이 좋으며, 작은 실천 하나로 리듬을 돌려보자. 유연함이 숨통을 트게 해줄 수 있다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "합",
      partners: ["상관", "편인"],
      summary: "감이 잘 맞지만, 말이나 행동이 앞서서 흐름이 꼬일 수 있다.",
      detail:
        "직감이 예리해서 아이디어가 잘 떠오르며, 조금만 속도를 늦추면 일도 사람도 훨씬 매끄럽게 풀린다. 하지만 생각보다 표현이 많아 피곤하거나 오해를 살 수 있다.",
      advice:
        "오늘은 말보다 행동을, 행동보다 분위기를 살피는 것이 좋다. 하고 싶은 말이 많아도 한 박자 쉬고, 욕심만 줄이자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "합",
      partners: ["편재", "정인"],
      summary: "참신한 아이디어 혹은 나의 논리가 인정을 받는다.",
      detail:
        "마음은 정돈되고 눈빛이 좋아진다. 본인이 하고자 하는 대로 실행으로 옮기기 좋다.",
      advice:
        "다른 사람들의 감정과 말이 잘 들리지 않을 수 있으니, 살짝 뒤로 물러나 시야를 넓히는 것도 좋다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    // 천간 충극 관계
    {
      scope: "gan",
      relation: "극",
      partners: ["비견", "편재"],
      summary: "촉과 감에 의지하여 움직이게 되어 조심스럽다.",
      detail:
        "감각보다는 직감이 잘 맞으나, 사람이나 상황이 생각만큼 따라주지 않는다.",
      advice:
        "흐름을 살피고 욕심을 내려놓으면 일이 자연스럽게 풀린다. 판단이 흐려지니 속도를 늦추자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "극",
      partners: ["편재", "편인"],
      summary: "아이디어가 현실로, 감정은 차분히 가라앉는다.",
      detail: "실속있는 결과를 바랄 수 있지만 내면의 여유가 다소 부족하다.",
      advice:
        "결과 중심으로 흘러가나 효율이 떨어지니 지친다. 숨을 비워 호흡을 천천히 하자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "충",
      partners: ["편인", "식신"],
      summary: "생각이 너무 많아 속도가 느려지는 날이다.",
      detail:
        "해야 할 일에 대한 책임감이 생기고 집중력도 좋지만 머리가 복잡하여 행동이 굼뜬다. 생각이 깊어질수록 답답하다.",
      advice:
        "완벽하게 하려고 하지 말고 가볍게 시작하며 머릿속 계산보다는 손발을 먼저 움직여보자. 단순함이 숨통을 트게 해줄 수 있다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "극",
      partners: ["식신", "편관"],
      summary: "의욕은 있지만 외부 압박에 기가 조금 꺾인다.",
      detail:
        "해야하는 것들이 많으나 추직련이 약해진다. 잘해보려는 마음은 크지만, 책임감과 부담이 따른다.",
      advice:
        "결과보다는 컨디션 조절이 더 중요하다. 무리하지 말고 자신을 다독이며 한 걸음씩 나가자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "충",
      partners: ["편관", "비견"],
      summary: "내 고집이 속도를 늦춘다.",
      detail:
        "추진력이 강하지만 내 고집이 강하여 협업이나 관계가 어색해질 수 있다.",
      advice:
        "조율과 대화를 통해 고집을 조금만 내려놓아보자. 양보가 더 큰 결과를 이끌어낼 수 있다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "극",
      partners: ["겁재", "정재"],
      summary: "생각은 활발하지만 관계 속 미묘하게 흐름이 꼬인다.",
      detail:
        "직관이 예민하게 깨어나 뭐든 할 수 있을 것 같지만 현실 감각이 약해진다.",
      advice:
        "계산보다는 느낌을, 완벽함보다는 흐름을 따라가자. 모든 걸 통제하려는 건 욕심이다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "극",
      partners: ["정재", "정인"],
      summary: "감정은 차분하고 생각은 깊지만, 표현이 조심스럽다.",
      detail:
        "말보다 생각이 앞서고, 표현이 한 반자 느리다. 겉으로는 조용하지만 속으로는 여러 계획과 판단이 넘친다.",
      advice:
        "굳이 나서지 않아도 신뢰가 생기는 날이고 꾸준함이 중요하다. 단단한 태도를 일관되게 유지하자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "충",
      partners: ["정인", "상관"],
      summary: "감정이 앞서지만 이성이 균형을 잡아준다.",
      detail:
        "순간적인 감정이나 말이 앞설 수 있지만 이성이 균형을 잡아줄 것이다. 감정과 책임이 충돌하나 중심은 유지한다.",
      advice:
        "말보다 마음의 온도를 먼저 살펴 즉흥적인 판단을 한 템포 늦추는 것이 현명하다. 결국 이성이 균형을 잡아줄 것이다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "극",
      partners: ["상관", "정관"],
      summary: "기세는 강하나 벽에 부딪혀 흐름이 꼬인다.",
      detail:
        "기세는 강하지만 규율이나 책임 속에서 무시할 수 없어 균형을 찾으려 애쓰는 흐름이다.",
      advice:
        "밀어붙이기보다 타이밍을 읽는 것이 중요하며 내 방식을 고집하지 말고 부드럽게 우회하자.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    {
      scope: "gan",
      relation: "충",
      partners: ["정관", "겁재"],
      summary: "욕심이 끼어들면 균형이 흔들린다.",
      detail:
        "책임감도 있고 안정된 환경이지만 욕심이 많이 생기며 내 몫에 대한 시선이 많아진다.",
      advice:
        "욕심보다는 신뢰를 선택하고 조용히 꾸준히 가는 것이 제일 빠른 길이다.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    // 지지 : 반합 관계
    {
      scope: "ji",
      relation: "반합", //인오반합
      partners: ["비견", "상관"],
      jiMapping: ["인", "오"],
      summary: "의욕이 넘치며 결과로 인정받을 수 있다.",
      detail:
        "해야되는 일이 완벽하게 이뤄지며 확신과 실행력도 좋다. 결과가 말끔하게 드러난다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "머리가 맑고 뭐든 해볼 만하다. 자신감이 생기고 집중력도 좋아진다. 애쓰지 않아도 일이 자연스럽게 흘러간다.",
          advice: "",
        },
        month: {
          detail:
            "내가 움직이면 주변도 따라 움직이고 분위기가 정돈되며, 사람들과의 소통도 좋아진다. 센스와 능력이 동시에 돋보인다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //오술반합
      partners: ["상관", "편재"],
      jiMapping: ["오", "술"],
      summary: "긴장된 상태에서 결과와 책임감이 높아지고 성과가 있다.",
      detail: "내 결과가 전반적인 상황에 책임으로 연결되고 보상이 따라온다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "아이디어도 많고 손이 잘 움직인다. 압박감이 있지만 결과가 눈에 보이니 뿌듯함도 다가온다.",
          advice: "",
        },
        month: {
          detail:
            "높은 기준 속 주변에서 평가나 기대가 많아지고 잘 해내면 인정을 크게 받을 수 있다. 실직적 이익이나 결과, 성과로 이어진다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "삼합", //인오술삼합
      partners: ["비견", "상관", "편재"],
      jiMapping: ["인", "오", "술"],
      summary: "흐름이 매끄럽고 일도 인간관계도 술술 풀린다.",
      detail:
        "능력과 주변의 도움이 만나 꾸준히 성과를 내고, 그 성과가 신뢰를 쌓아 결국 현실적인 큰 이익으로 돌아온다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "모든 것을 스스로 통제하고 있다는 자신감과 함께 일의 능률이 최고조에 달하여 뿌듯함을 느낀다.",
          advice: "",
        },
        month: {
          detail:
            "뛰어난 실력과 책임감으로 주변의 신뢰를 얻어 리더십이 돋보이며, 노력한 만큼 금전적, 명예적 보상까지 확실하게 따른다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //신자반합
      partners: ["편관", "정인"],
      jiMapping: ["신", "자"],
      summary: "흐름이 자연스럽게 이어지고, 결과가 신뢰로 완성된다.",
      detail:
        "현실 속 책임과 노력이 매끄러운 흐름을 거쳐 안정적이게 되며, 결국 확신으로 좋은 결과를 만든다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "복잡했던 문제가 자연스럽게 정리되면서, 차분하고 편안한 안도감을 느낀다.",
          advice: "",
        },
        month: {
          detail:
            "책임 있는 태도가 인정을 받고 신뢰를 얻는 모습으로 확고한 좋은 평판까지 얻을 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //자진반합
      partners: ["정인", "편재"],
      jiMapping: ["자", "진"],
      summary: "의욕이 넘치며 결과로 인정받을 수 있다.",
      detail:
        "복잡하게 뒤섞였던 감정과 생각이 정돈되어 마음의 안정을 찾고, 최종적으로는 실질적인 결과와 금전적인 성과로 이어진다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "잠시 감정의 흔들림이나 생각의 혼란이 있더라도 곧 마음의 중심을 되찾고, 스스로 현실적인 해법과 결론을 명확히 내릴 수 있다.",
          advice: "",
        },
        month: {
          detail:
            "예민한 감정 표현에도 불구하고 곧 마음이 안정되어 주변에 신뢰감을 주며, 실질적인 성과와 일 처리 면에서 좋은 평가를 받을 수 있다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //신자진반합
      partners: ["편관", "정인", "편재"],
      jiMapping: ["신", "자", "진"],
      summary:
        "복잡한 흐름이 제자리를 찾아 균형이 되어 안정적인 결과를 이어간다.",
      detail:
        "책임감 있게 현실적인 일을 시작하지만 중간에 마음이 복잡해질 수 있습니다. 그러나 결국 감정을 가라앉히고 차분히 정리해서 좋은 결론에 도달하게 됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "처음에는 일이 많아 부담을 느끼고, 중간에는 잠깐 마음이 복잡해질 수 있지만 곧 침착하게 정리하면서 내가 해야 할 방향과 해결책을 분명히 찾게 됩니다.",
          advice: "",
        },
        month: {
          detail:
            "처음엔 책임감 있는 태도로 신뢰를 쌓고, 잠깐 마음이 흔들려도 곧 안정되며, 마지막에는 일도 잘 마무리해서 좋은 평가를 받을 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //사유반합
      partners: ["식신", "정관"],
      jiMapping: ["사", "유"],
      summary:
        "감정이 잠시 흔들릴 수 있지만 곧 마음이 차분하게 정돈되어, 다시 안정과 생각으로 이어집니다.",
      detail:
        "외부 환경에 의해 잠시 감정이 흔들릴 수 있지만 이내 마음을 다잡고 차분해집니다. 생각이 맑아지고 안정감이 찾아옵니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "처음엔 감정이 약간 무거울 수 있지만, 곧 마음이 차분해지고 생각도 맑아져 편안해집니다.",
          advice: "",
        },
        month: {
          detail:
            "처음에는 조용히 시작할 수 있지만 곧 스스로 중심을 잡고, 신뢰를 주는 침착함과 분명한 판단력으로 주변에 좋은 인상을 남깁니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //유축반합
      partners: ["정관", "정재"],
      jiMapping: ["유", "축"],
      summary:
        "마음이 따뜻해지고 자신감이 생긴 후후, 말과 행동이 자연스럽게 이어진다.",
      detail:
        "마음이 차분해지고 자신감이 자연스럽게 생기면서, 그 힘으로 말과 행동도 능숙하게 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 차분해지고 자신에 대한 믿음이 생기면서, 자연스럽게 생각과 감정을 표현할 수 있어 한결 편안해집니다.",
          advice: "",
        },
        month: {
          detail:
            "처음에는 차분하고 신뢰를 주는 태도로 시작해요. 곧 자존감이 높아지며 주도적으로 행동할 수 있고, 마지막에는 부드러운 말과 행동으로 주변과 자연스럽게 어울리게 됩니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //사유축삼합
      partners: ["식신", "정관", "정재"],
      jiMapping: ["사", "유", "축"],
      summary:
        "처음에는 다소 침체될 수 있지만, 시간이 지나면서 마음이 차분히 정리되고 마지막에는 말이나 행동으로 편안하게 표현할 수 있습니다.",
      detail:
        "처음에는 자기주장이 강하게 드러나지만, 시간이 지나면서 외부 상황에 영향을 받아 마음이 차분해지고 생각이 깊어집니다. 마지막에는 차분하고 통찰력 있게 자신의 생각과 감정을 자연스럽게 나타낼 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "처음에는 자기 뜻대로 하고 싶은 마음이 있지만, 주변 상황에 따라 조금 조심스럽게 움직이게 됩니다. 곧 마음을 가라앉히고 생각을 정리하면서, 마지막에는 차분하게 자신의 생각을 말이나 행동으로 자연스럽게 표현하게 됩니다.",
          advice: "",
        },
        month: {
          detail:
            "처음엔 자기 의견을 내세우지만, 점점 차분하게 규칙을 지키며 신뢰를 얻어요. 마지막에는 자연스럽고 센스 있게 자신의 생각을 표현해 분위기를 좋게 만듭니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //해묘반합
      partners: ["편인", "겁재"],
      jiMapping: ["해", "묘"],
      summary:
        "감정이 잠깐 눌릴 수 있지만, 결국은 모든 일이 자연스럽고 안정적으로 마무리됩니다.",
      detail:
        "감정이 억눌리거나 직감이 흐려질 수 있지만, 곧 현실적으로 필요한 행동을 통해 점점 실행력이 살아나고, 그 과정에서 안정적인 결과와 만족감을 얻을 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "직감이 막혀 답답하게 느껴질 수 있으나, 점차 몸을 움직이고 행동에 나서다 보면 실행력이 회복되고 노력에 대한 안정된 성과와 만족을 느낄 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "크게 감정 기복 없이 꾸준히 자신의 역할에 집중하다 보면 실질적인 성과가 나타나고, 주위에서 신뢰와 긍정적인 평가를 받을 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //묘미반합
      partners: ["겁재", "정재"],
      jiMapping: ["묘", "미"],
      summary:
        "상황이 복잡할 수 있지만, 점차 정리가 되고 결국 책임감 있게 신뢰를 쌓으며 잘 마무리하게 됩니다.",
      detail:
        "상황이 복잡할 수 있지만, 책임감 있게 질서를 세우며 일을 하다 보면 점차 마음이 안정되고, 결국 모든 일이 깔끔하게 정리됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "일이 어지럽고 마음이 복잡해 부담을 느끼지만, 곧 자신의 페이스를 찾아 차분히 정리되고 결국 편안해집니다.",
          advice: "",
        },
        month: {
          detail:
            "정신없고 바쁜 상황에서도 꼼꼼하게 일을 챙기다 보면, 자연스럽게 신뢰를 받고 좋은 평가를 얻게 됩니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "반합", //해묘미삼합
      partners: ["편인", "겁재", "정재"],
      jiMapping: ["해", "묘", "미"],
      summary:
        "잠시 막힘이 있지만 시간이 지나면 자연스럽게 안정과 신뢰로 이어집니다.",
      detail:
        "잠깐 답답할 수 있지만, 점점 일도 잘 풀리고 신뢰도 쌓이며 마음도 편해지는 흐름입니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 답답하지만, 시간이 지나면서 일이 자연스럽게 풀리고 결국엔 마음이 편안해집니다.",
          advice: "",
        },
        month: {
          detail:
            "감정 기복 없이 차분히 일에 성과를 내고, 신뢰를 얻고 높은 평가를 받는다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //인묘방합
      partners: ["비견", "겁재"],
      jiMapping: ["인", "묘"],
      summary: "움직인 만큼 바로 결과가 따라오는, 흐름이 군더더기 없다.",
      detail: "주도성과 의욕이 행동과 성과로 나타나며, 결과도 좋아진다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "의욕과 자신감으로 자연스럽게 일이 착착 풀리고, 바로바로 결과가 보여 만족할 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "적극적으로 움직이면 바로 좋은 결과가 따라오고, 주위의 인정을 쉽게 받을 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //묘진방합
      partners: ["겁재", "편재"],
      jiMapping: ["묘", "진"],
      summary:
        "마음은 조금 불안정하다. 결국 현실적인 이익이나 결과에 집중하게 된다.",
      detail:
        "심리적으로 불안정할 수 있으나, 결국 현실적인 목표나 결과에 집중하게 됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 잠시 불안할 수 있지만, 현실적인 일이나 눈앞의 결과에 집중하면 곧 균형을 찾게 됩니다.",
          advice: "",
        },
        month: {
          detail:
            "감정 변화에 쉽게 흔들리지 않고, 현실적이고 실용적인 태도가 돋보입니다. 일을 잘한다는 평을 듣거나, 현실 감각이 뛰어나다는 신뢰를 받기 쉽습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //인진방합
      partners: ["비견", "편재"],
      jiMapping: ["인", "진"],
      summary:
        "마음이 답답할 수 있지만, 일은 자연스럽게 풀리고 실행력과 성과로 이어지는 흐름입니다.",
      detail:
        "감정적으로는 다소 답답할 수 있으나, 의욕과 실행력이 강해져 일의 진행과 결과가 원활해집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 다소 무거울 수 있으나, 실행력이 높아져 일의 진행과 성과가 자연스럽게 이어집니다.",
          advice: "",
        },
        month: {
          detail:
            "실무 감각이 뛰어나 빠르고 확실하게 일을 처리하며, 실질적인 성과와 긍정적인 평가를 얻는 흐름입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //인묘진방합
      partners: ["비견", "겁재", "편재"],
      jiMapping: ["인", "묘", "진"],
      summary:
        "감정보다 일 처리와 행동, 성과가 우선시되어 빠르게 진행되는 흐름입니다.",
      detail:
        "마음의 평온함은 다소 부족하지만, 실행력과 생산성이 높아 일 처리가 빠르고 성과가 뚜렷하게 나타납니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "감정적 여유는 적지만, 추진력이 강해 빠르게 행동하고 결과를 얻는 흐름입니다.",
          advice: "",
        },
        month: {
          detail:
            "실무 능력과 실행력이 뛰어나 성과가 두드러지지만, 세밀한 배려는 다소 아쉬울 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //사오방합
      partners: ["식신", "상관"],
      jiMapping: ["사", "오"],
      summary:
        "할 일의 우선순위와 방향이 명확해지고, 책임감과 신뢰, 질서가 강조되는 흐름입니다.",
      detail:
        "책임감과 신뢰, 질서가 강조되어 전체적으로 실질적인 성과와 안정감을 얻기 쉬운 흐름입니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "해야 할 일에 대한 책임감을 느끼지만, 실질적으로 일을 정리하고 마무리하며 안정감과 만족을 느낄 수 있는 흐름입니다.",
          advice: "",
        },
        month: {
          detail:
            "진지하고 책임감 있게 업무를 처리해 신뢰를 얻고, 안정적이고 신뢰할 만하다는 평가를 받는 흐름입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //오미방합
      partners: ["상관", "정재"],
      summary:
        "일과 책임이 많아 잠시 불안할 수 있으나, 점차 안정과 균형을 되찾는 흐름입니다.",
      detail:
        "실무와 책임이 많아 일시적으로 부담을 느낄 수 있으나, 객관적이고 이성적으로 상황을 정리하며 점차 안정을 찾게 됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "일이 많고 부담이 있지만, 차분하게 정리되어 점차 안정감을 회복합니다.",
          advice: "",
        },
        month: {
          detail:
            "겉으로는 바쁘고 책임이 많아 보이나, 침착하게 여러 일과 책임을 잘 관리해 신뢰를 얻고, 신중하고 안정적인 모습으로 좋은 평가를 받습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //사미방합
      partners: ["식신", "정재"],
      summary:
        "불안정해 보이지만, 차분하게 상황이 정리되어 안정감을 찾게 됩니다.",
      detail:
        "잠시 불안정함이 있을 수 있으나, 책임감과 이성적 판단으로 질서와 균형을 자연스럽게 회복하게 됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail: "불안정함을 차분히 관리하며 점차 안정을 되찾게 됩니다.",
          advice: "",
        },
        month: {
          detail:
            "책임감을 바탕으로 상황을 안정적으로 관리해 신뢰를 얻게됩니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //사오미방합
      partners: ["비견", "겁재", "편재"],
      summary:
        "흐름이 일시적으로 흔들릴 수 있으나, 객관적인 판단과 책임으로 균형이 다시 잡히는 모습입니다.",
      detail:
        "책임이 늘어나 일시적으로 불안할 수 있으나, 이성적이고 객관적으로 상황을 정리해 점차 안정과 균형을 회복합니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "감정적인 여유는 부족하지만, 추진력이 높아 신속하게 일처리와 결과를 이끌어내는 경향이 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "처음에는 책임감 있고 믿음을 주는 태도로 상황을 이끌고, 일시적으로 흐트러짐이 있어도 객관적으로 잘 정돈해 신뢰를 받는 모습입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //신유방합
      partners: ["편관", "정관"],
      summary:
        "해야만 하는 일, 생각, 계획이 많아 바쁘지만 이는 나를 강인하게 만들어줍니다.",
      detail:
        "책임과 과제가 늘어나며 부담이 커지지만, 객관적인 판단력과 추진력이 자연스럽게 향상됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "일이 많아 순간적으로 부담을 느낄 수 있으나, 곧 상황을 명확히 파악하고 스스로를 이끌어가는 추진력이 강화됩니다.",
          advice: "",
        },
        month: {
          detail:
            "책임감 있게 상황에 집중하며 신속하고 명확한 판단으로 주도적으로 문제를 해결하거나, 경쟁 속에서 자연스럽게 두각을 나타냅니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //유술방합
      partners: ["정관", "편재"],
      summary:
        "내면의 주도성과 행동력이 객관적으로 정돈되어 자연스럽게 책임 있는 결과로 이어집니다.",
      detail:
        "에너지가 분산되지 않고 본연의 방향으로 집중되어, 자연스럽게 책임 있는 태도와 안정적인 결과로 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "'해야 하는 일'에 자연스럽게 집중하며, 주도성과 책임감 있게 상황을 정돈해 나갑니다.",
          advice: "",
        },
        month: {
          detail:
            "일을 꼼꼼하게 처리하여 주변의 신뢰를 얻고, 객관적으로도 책임감이 있다는 평가를 받게 됩니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //신술방합
      partners: ["편관", "편재"],
      summary:
        "정신이 없으나 흐름은 깔끔하니, 책임과 결과가 결국 안정을 만든다.",
      detail:
        "쏟아지는 업무와 책임을 차분하게 정리하여, 자연스럽게 실질적인 결과와 성과로 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "주어진 책임과 업무가 부담스럽게 느껴질 수 있으나, 빠른 판단과 정리 덕분에 실질적인 성과와 안정된 마무리로 이어집니다.",
          advice: "",
        },
        month: {
          detail:
            "일과 책임에 집중하여 효율적으로 결과를 만들어내며, 객관적으로도 믿을 만하다는 평가를 받습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //신유술방합
      partners: ["편관", "정관", "편재"],
      summary:
        "책임과 일의 흐름이 차분하게 정리되어 결과가 안정적으로 마무리됩니다.",
      detail:
        "많은 책임과 일들이 자연스럽게 정리되어 객관적으로 안정된 결과로 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "일과 책임이 한꺼번에 주어져 부담을 느끼지만, 점차 차분하게 정리되며 객관적으로 안정된 결과로 이어집니다.",
          advice: "",
        },
        month: {
          detail:
            "여러 책임을 차분하고 객관적으로 처리하는 능력이 인정받아, 신뢰와 긍정적인 성과 평가로 이어집니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //해자방합
      partners: ["편인", "정인"],
      summary:
        "내면의 에너지가 자연스럽게 행동으로 나타나 현실적인 결과로 이어진다.",
      detail:
        "내면의 에너지가 자연스럽게 정리되어, 객관적으로 행동과 결과로 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "편안한 분위기에서 차분하게 일과 관계를 정리하고, 자연스럽게 실질적인 성과와 만족을 얻습니다.",
          advice: "",
        },
        month: {
          detail:
            "차분한 분위기에서 자연스럽게 실행력과 소통 능력이 드러나며, 객관적으로 실무와 대인관계에서 긍정적인 평가를 받기 쉽습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //자축방합
      partners: ["정인", "정재"],
      summary: "생각과 말, 행동이 앞서가며 이상적인 상황은 멀리 떨어집니다.",
      detail:
        "일이 빠르게 진행되며 추진력과 실행력이 두드러지지만, 마음의 여유와 정서적 안정감은 다소 부족해질 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "하고 싶은 말과 행동이 빠르게 드러나며, 감정은 다소 불안정할 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "말과 행동이 자연스럽게 드러나 추진력은 높지만, 세밀함과 배려는 다소 부족해 보일 수 있어 결과 위주로 평가받습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //해축방합
      partners: ["편인", "정재"],
      summary: "모든 과정이 차분하고 자연스럽게 이어집니다.",
      detail:
        "차분하게 일과 감정이 정리되어, 자연스럽게 성과와 내면의 안정이 이루어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "차분한 분위기에서 일의 진행이 자연스럽고, 객관적으로 긍정적인 결과와 만족을 얻게 됩니다.",
          advice: "",
        },
        month: {
          detail:
            "차분하고 객관적인 태도로 일에 임해 자연스러운 성과와 신뢰를 얻기 좋은 시기입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "방합", //해자축방합
      partners: ["편인", "정인", "정재"],
      summary: "마음은 잠시 무거울 수 있지만, 일이 자연스럽게 풀려나갑니다.",
      detail:
        "마음은 다소 무거울 수 있으나, 일은 자연스럽게 진행되고 결과도 분명히 드러납니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "안정감은 다소 부족해도 실행과 행동으로 자연스럽게 성과와 성취를 얻습니다.",
          advice: "",
        },
        month: {
          detail:
            "표현이 자연스럽고 추진력도 좋아서 일이 잘 풀리지만, 세심한 부분은 조금 아쉬울 수 있습니다. 그래도 실제로 드러나는 성과가 있어 좋은 평가를 받기 쉽습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //자축육합
      partners: ["정인", "정재"],
      summary:
        "마음이 차분해지고 행동이 자연스럽게 이어져 좋은 결과로 마무리됩니다.",
      detail:
        "내면이 안정되고 여유가 생기면서 말과 행동도 자연스럽게 표현되어, 이러한 흐름이 실질적인 성과와 좋은 결과로 이어집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 평온하고 안정된 기분이 들어 말과 행동이 한결 자연스럽고 부드럽게 이어지며, 그 흐름이 만족스러운 결과로 마무리됩니다.",
          advice: "",
        },
        month: {
          detail:
            "차분한 소통과 유연한 행동으로 실무와 평판에서 좋은 결과를 얻습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //인해육합
      partners: ["비견", "편인"],
      summary:
        "마음이 편안해지고 자연스럽게 행동이 이어지면서, 일의 범위도 넓어집니다.",
      detail:
        "마음은 다소 무거울 수 있으나, 일은 자연스럽게 진행되고 결과도 분명히 드러납니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "안정감은 다소 부족해도 실행과 행동으로 자연스럽게 성과와 성취를 얻습니다.",
          advice: "",
        },
        month: {
          detail:
            "표현이 자연스럽고 추진력도 좋아서 일이 잘 풀리지만, 세심한 부분은 조금 아쉬울 수 있습니다. 그래도 실제로 드러나는 성과가 있어 좋은 평가를 받기 쉽습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //묘술육합
      partners: ["겁재", "편재"],
      summary:
        "내 안의 에너지가 자연스럽게 움직이며, 변화가 일상 속에서 편안하게 이루어집니다.",
      detail:
        "평소보다 의욕이 높아져서 자연스럽게 행동하게 되고, 작은 변화들이 일상에서 쉽게 나타납니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "오늘은 기분이 자주 바뀌고 평소보다 더 적극적으로 움직이게 됩니다. 내가 직접 작은 변화를 만들어서 뿌듯함을 느낄 수 있습니다다.",
          advice: "",
        },
        month: {
          detail:
            "평소보다 더 적극적으로 움직이고 아이디어도 잘 떠올라, 일상에서 작은 변화가 자연스럽게 생깁니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //진유육합
      partners: ["편재", "정관"],
      summary:
        "부족한 점을 계기로 점점 힘이 생기고, 자연스럽게 성장으로 이어지는 흐름입니다.",
      detail:
        "조금 부족하게 느껴질 수 있지만, 점차 힘이 생기고 내 방식대로 조절하면서 자연스럽게 성장하게 됩니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "처음엔 망설여도 점점 자신감이 생기고, 내 스스로 균형을 잡으며 성장하는 걸 자연스럽게 느낍니다.",
          advice: "",
        },
        month: {
          detail:
            "시작에 망설임이 있지만, 점점 자신감이 생기면서 적극적으로 움직이고 스스로 균형을 잘 잡아 긍정적인 평가를 받기 쉬운 시기입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //사신육합
      partners: ["식신", "편관"],
      summary:
        "책임감이 부담스러울 수 있지만, 시간이 지나며 점점 익숙해지고 스스로 뿌듯함을 느끼게 됩니다.",
      detail:
        "책임감이 부담스럽지만, 시간이 지나면서 점점 익숙해지고 상황을 부드럽게 정리해서 마음이 한결 가벼워집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "부담스럽고 책임감이 크지만, 곧 힘이 생기고 실행에 옮기며 스스로 뿌듯하게 마무리합니다.",
          advice: "",
        },
        month: {
          detail:
            "부담이 되지만 차츰 익숙해지고, 자연스럽게 맡은 일을 잘 해내며 주변에서 신뢰와 좋은 평가를 받게 됩니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //오미육합
      partners: ["식신", "편관"],
      summary:
        "내 안에 쌓였던 것들이 하나씩 드러나면서, 자연스럽게 행동하고 결과까지 이어진 뒤 안정감을 느끼게 됩니다.",
      detail:
        "표현력과 아이디어가 자연스럽게 돋보이고, 그걸로 결과를 만들어내면서 책임감도 커지고 마음이 한결 편안해집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음먹은 대로 행동해서 좋은 결과를 내고, 스스로 뿌듯하고 안정감을 느낍니다.",
          advice: "",
        },
        month: {
          detail:
            "말과 행동이 자연스럽게 잘 어울려서 눈에 띄고, 실질적인 결과까지 보여주니 주변에서 신뢰를 얻고 인정받는 때입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "육합", //오미육합
      partners: ["식신", "편관"],
      summary:
        "내 안에 쌓였던 것들이 하나씩 드러나면서, 자연스럽게 행동하고 결과까지 이어진 뒤 안정감을 느끼게 됩니다.",
      detail:
        "표현력과 아이디어가 자연스럽게 돋보이고, 그걸로 결과를 만들어내면서 책임감도 커지고 마음이 한결 편안해집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음먹은 대로 행동해서 좋은 결과를 내고, 스스로 뿌듯하고 안정감을 느낍니다.",
          advice: "",
        },
        month: {
          detail:
            "말과 행동이 자연스럽게 잘 어울려서 눈에 띄고, 실질적인 결과까지 보여주니 주변에서 신뢰를 얻고 인정받는 때입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "형", //인사형
      partners: ["비견", "식신"],
      summary: "서로 뜻이 잘 맞지 않아 일의 흐름이 자주 끊길 수 있습니다다.",
      detail:
        "내 생각이나 행동이 잘 안 맞고, 일의 흐름도 쉽게 어긋나서 전체적으로 안정감이 부족할 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 자꾸 산만해져서 집중이 잘 안 되고, 피곤함도 많이 느껴질 수 있습니다. 일이 잘 안 이어져서 다시 흐름을 잡는 데 시간이 걸릴 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "계획이 어색하게 흘러가고 결과도 들쑥날쑥할 수 있고, 생각이 자꾸 바뀌고 집중이 잘 안 될 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "형", //사신형
      partners: ["식신", "편관"],
      summary:
        "내 생각과 주변 상황이 자주 부딪쳐서 기존에 하던 대로가 잘 안 되고, 뭔가 새로운 변화를 만들고 싶어집니다.",
      detail:
        "고집을 내세우다 보니 양보 없는 신경전이 이어지고, 평소처럼 흘러가던 분위기가 바뀌어 뭔가 새로운 변화가 필요해지는 느낌입니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "뭐든 내 마음대로 하고 싶고, 예전처럼 하기 싫은 기분이 듭니다.",
          advice: "",
        },
        month: {
          detail:
            "늘 하던 방식이 잘 안 통해서, 뭔가 색다르게 해보려는 마음이 커지고 평소보다 내주장이 강해질 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "충", //인신충
      partners: ["비견", "편관"],
      summary:
        "실속도 챙겨야 하고 압박감도 느껴져서, 뭔가 마음이 답답하고 꽉 막힌 느낌이 듭니다.",
      detail:
        "이득을 챙기려다 보니 생각이 많아지고 괜히 힘이 들어가서, 오히려 행동이나 표현이 잘 안 나오고 답답해질 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "무슨 일이든 내가 챙겨야 할 것 같아 신경이 많이 쓰이고, 생각이 많아져서 괜히 피곤하고 스트레스가 쌓입니다. 하고 싶은 말이나 감정 표현도 잘 안 돼서 마음이 답답할 수 있어요.",
          advice: "",
        },
        month: {
          detail:
            "겉으론 괜찮은 척하지만 쉽게 예민해지고 답답한 게 티 날 수 있습니다. 뭐든 능률이 잘 안 오르고, 내 마음도 제대로 말하기 어려울 때입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "삼형", //인사신삼형
      partners: ["비견", "식신", "편관"],
      jiMapping: ["인", "사", "신"],
      summary:
        "서로 자기 생각만 내세워서, 분위기가 자연스럽게 잘 안 맞는 것 같습니다.",
      detail:
        "자신의 생각과 이익만 챙기려 하다 보니, 협력이 잘 안 되고 전체적인 흐름도 자연스럽지 못합니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "이것저것 생각이 많아지고 고집이나 조급함까지 겹쳐서, 마음이 산만해지고 평소처럼 편하게 행동하기가 쉽지 않습니다.",
          advice: "",
        },
        month: {
          detail:
            "이득을 챙기려는 모습과 내 주장만 내세우는 태도가 드러나서, 다른 사람들과 어울리기보다는 혼자 움직이려 할 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "형", //축술형
      partners: ["정재", "편재"],
      jiMapping: ["축", "술"],
      summary:
        "마음 가는 대로 움직이지만 뭔가 복잡하게 느껴지고, 생각도 많아지는 때입니다.",
      detail:
        "마음이 복잡해지고 쉽게 예민해질 수 있어, 행동이나 결정이 평소보다 더 어렵게 느껴집니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 조금 산만해지고 즉흥적으로 행동하게 되면서, 괜히 생각도 많아지고 마음이 복잡해질 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "평소보다 자기 주장이나 생각을 더 강하게 드러내서, 주변에서 조금 고집 있어 보이거나 예민하게 느낄 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "형", //술미형
      partners: ["편재", "정재"],
      jiMapping: ["술", "미"],
      summary: "마음이 불안해서 괜히 더 세게 보이려고 할 수 있는 때입니다.",
      detail:
        "속마음은 불안한데, 괜히 더 단단해 보이려고 솔직하게 말하거나 강하게 행동할 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "마음이 들뜨고 집중이 잘 안 돼서 괜히 더 세게 행동하거나 말할 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "겉으로 보기엔 자신감 있고 단단해 보여도, 속마음은 불안해서 괜히 더 세게 말하거나 행동할 수 있는 때입니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "삼형", //축술미삼형
      partners: ["정재", "편재", "정재"],
      jiMapping: ["축", "술", "미"],
      summary:
        "분위기가 좀 딱딱해지고, 여러 방면에 득실을 따시거나 눈치를 보며, 전체적으로 흐름이 거칠어질 수 있습니다.",
      detail:
        "평소의 부드러움이나 안정감이 깨지고, 말이나 행동이 예민하게 튀어나와서 분위기가 다소 날카롭고 한쪽으로 치우칠 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "말과 행동이 평소보다 조금 더 직설적이고 거칠게 나올 수 있고, 마음이 분산되어 여유가 없어지며, 이것저것 셈하고 따지려는 경향이 강해질 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "즉각적으로 반응하고 추진력은 좋은데, 균형이 좀 흐트러져서 자기중심적이거나 예민하게 보일 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "충", //자오충
      partners: ["정인", "상관"],
      jiMapping: ["자", "오"],
      summary:
        "분위기가 좀 딱딱해지고, 여러 방면에 득실을 따시거나 눈치를 보며, 전체적으로 흐름이 거칠어질 수 있습니다.",
      detail:
        "평소의 부드러움이나 안정감이 깨지고, 말이나 행동이 예민하게 튀어나와서 분위기가 다소 날카롭고 한쪽으로 치우칠 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "말과 행동이 평소보다 조금 더 직설적이고 거칠게 나올 수 있고, 마음이 분산되어 여유가 없어지며, 이것저것 셈하고 따지려는 경향이 강해질 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "즉각적으로 반응하고 추진력은 좋은데, 균형이 좀 흐트러져서 자기중심적이거나 예민하게 보일 수 있습니다.",
          advice: "",
        },
      },
    },
    {
      scope: "ji",
      relation: "충", //축미충
      partners: ["정재", "정재"],
      jiMapping: ["축", "미"],
      summary:
        "분위기가 좀 딱딱해지고, 여러 방면에 득실을 따시거나 눈치를 보며, 전체적으로 흐름이 거칠어질 수 있습니다.",
      detail:
        "평소의 부드러움이나 안정감이 깨지고, 말이나 행동이 예민하게 튀어나와서 분위기가 다소 날카롭고 한쪽으로 치우칠 수 있습니다.",
      advice: "",
      tone: "positive",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        day: {
          detail:
            "말과 행동이 평소보다 조금 더 직설적이고 거칠게 나올 수 있고, 마음이 분산되어 여유가 없어지며, 이것저것 셈하고 따지려는 경향이 강해질 수 있습니다.",
          advice: "",
        },
        month: {
          detail:
            "즉각적으로 반응하고 추진력은 좋은데, 균형이 좀 흐트러져서 자기중심적이거나 예민하게 보일 수 있습니다.",
          advice: "",
        },
      },
    },
  ],
  辛: [
    // 천간: 정재 ↔ 정관 극
    {
      scope: "gan",
      relation: "극",
      partners: ["정재", "정관"],
      summary:
        "辛금 일간에게 정재·정관 극은 계획을 다시 조율하라는 신호입니다.",
      detail:
        "재정 의사결정이 느리게 흘러가고, 책임 소재가 겹치면서 피로도가 올라갑니다. 대신 꼼꼼함 덕분에 균형을 회복할 힘도 충분합니다.",
      advice: "지출과 투자를 다시 분류하고, 꼭 필요한 한 가지부터 처리하세요.",
      tone: "neutral",
      context: "일진",
      origin: "day",
    },

    // 지지: 겁재 ↔ 정관 육합
    {
      scope: "ji",
      relation: "육합",
      partners: ["겁재", "정관"],
      summary: "辛금 일간이 겁재·정관 육합을 만나면 경쟁보다 협력이 빛납니다.",
      detail:
        "오늘의 일진이나 원국에서 겁재와 정관이 서로 기대어 숨통이 트입니다. 추진력과 안정감이 균형을 이루니, 교섭이나 협업에 강점이 생깁니다.",
      advice: "중요한 만남이 있다면 겁내지 말고, 분위기를 부드럽게 이끄세요.",
      tone: "positive",
      context: "일진",
      origin: "day",
    },
    // 지지: 정재 ↔ 겁재 형
    {
      scope: "ji",
      relation: "형",
      partners: ["정재", "겁재"],
      summary: "정재·겁재 형살이 들어오면 현실 과제가 미묘하게 흔들립니다.",
      detail:
        "사소한 갈등이 겹쳐 마음이 급해질 수 있습니다. 대신 수납, 정리, 결제 체크부터 하나씩 정돈하면 흐름이 안정됩니다.",
      advice: "장부나 비용을 오전에 정리하고, 오후에는 호흡을 비워두세요.",
      tone: "caution",
      context: "일진",
      origin: "month",
    },
    // 지지: 정재 ↔ 정관 육합 (월/일 기둥 구분 예시)
    {
      scope: "ji",
      relation: "육합",
      partners: ["정재", "정관"],
      summary: "정재·정관 육합은 일과 생활의 균형을 다시 세웁니다.",
      detail:
        "책임과 재정이 한데 묶이며 안정감을 찾습니다. 완벽주의로 피로해지지 않도록 여유 공간을 확보하세요.",
      advice: "정리와 점검 후 짧은 휴식 계획을 함께 세워 두면 좋습니다.",
      tone: "neutral",
      context: "일진",
      origin: ["day", "month"],
      originOverrides: {
        month: {
          detail:
            "월운에서 정재와 정관이 육합을 이루면 이번 달 계획 전체를 재정비하기 좋습니다. 장기 예산과 업무 루틴을 손보고, 월말에 다시 확인해 보세요.",
          advice:
            "월 단위 일정표를 새로 짜고, 쉬는 날과 집중해야 할 날을 함께 표시해 두면 도움이 됩니다.",
        },
      },
    },
    // 지지: 정관 ↔ 겁재 형
    {
      scope: "ji",
      relation: "형",
      partners: ["정관", "겁재"],
      summary:
        "정관·겁재 형살은 권한과 책임의 균형을 다시 점검하라는 신호입니다.",
      detail:
        "위에서 요구가 잦아져 압박이 느껴질 수 있습니다. 조급해지면 실수가 나올 수 있으니 기본 규칙을 재정비하세요.",
      advice: "중요한 결정은 서두르지 말고, 근거 자료를 먼저 정리해 두세요.",
      tone: "neutral",
      context: "일진",
      origin: "hour",
    },
  ],
  // TODO: 甲~癸 일간 전용 커스텀 해석을 여기에 추가 확장
};

/**
 * partners 배열 정렬 (["정재","정관"] -> "정관|정재")
 *  - 조합 순서에 상관없이 동일 키로 비교하기 위함
 */
const normalizePartners = (partners: TenGodType[]): string =>
  [...partners].sort().join("|");

/**
 * {PARTNERS} 플레이스홀더 치환
 */
const fillTemplate = (template: string, partnersLabel: string): string =>
  template.replace(/\{PARTNERS\}/g, partnersLabel);

/**
 * override > origin > context 순으로 가장 적합한 해석 찾기
 */
const isOriginMatch = (
  entryOrigin: ColumnOrigin | ColumnOrigin[] | undefined,
  targetOrigin: ColumnOrigin | undefined
): boolean => {
  if (targetOrigin == null) return true;
  if (entryOrigin == null) return true;
  if (Array.isArray(entryOrigin)) {
    return entryOrigin.includes(targetOrigin);
  }
  return entryOrigin === targetOrigin;
};

const findOverride = (
  entries: TenGodRelationOverrideEntry[] | undefined,
  scope: RelationScope,
  relation: GanRelationType | JiRelationType,
  partners: TenGodType[],
  context?: string,
  origin?: ColumnOrigin
): TenGodRelationOverrideEntry | undefined => {
  if (!entries || entries.length === 0) return undefined;

  const key = normalizePartners(partners);

  const scoped = entries.filter(
    (entry) =>
      entry.scope === scope &&
      entry.relation === relation &&
      normalizePartners(entry.partners) === key
  );
  if (scoped.length === 0) return undefined;

  const originFiltered = scoped.filter((entry) =>
    isOriginMatch(entry.origin, origin)
  );
  if (originFiltered.length === 0) return scoped[0];

  if (!context) return originFiltered[0];

  return (
    originFiltered.find((entry) => entry.context === context) ??
    originFiltered[0]
  );
};

const composeInterpretation = (
  entry: TenGodRelationOverrideEntry,
  origin?: ColumnOrigin
): TenGodRelationInterpretation => {
  const base: TenGodRelationInterpretation = {
    summary: entry.summary,
    detail: entry.detail,
    advice: entry.advice,
    tone: entry.tone,
  };

  if (!origin || !entry.originOverrides) {
    return base;
  }

  const override = entry.originOverrides[origin];
  if (!override) {
    return base;
  }

  return {
    summary: override.summary ?? base.summary,
    detail: override.detail ?? base.detail,
    advice: override.advice ?? base.advice,
    tone: override.tone ?? base.tone,
  };
};

/**
 * 기본 텍스트 생성 (override 없을 때 사용)
 */
const buildFallbackInterpretation = (
  scope: RelationScope,
  relation: GanRelationType | JiRelationType,
  partners: TenGodType[]
): TenGodRelationInterpretation => {
  const partnersLabel = partners.join(" · ");
  const base =
    scope === "gan"
      ? DEFAULT_GAN_RELATIONS[relation as GanRelationType]
      : DEFAULT_JI_RELATIONS[relation as JiRelationType];

  return {
    summary: fillTemplate(base.summary, partnersLabel),
    detail: fillTemplate(base.detail, partnersLabel),
    advice: fillTemplate(base.advice, partnersLabel),
    tone: base.tone,
  };
};

export interface TenGodRelationLookupArgs {
  scope: RelationScope;
  dayGan: DayGan;
  partners: TenGodType[];
  relation: GanRelationType | JiRelationType;
  context?: string;
  origin?: ColumnOrigin;
}

/**
 * 십성 관계 해석 조회
 * 사용 예)
 *  resolveTenGodRelationInterpretation({
 *    scope: "gan",
 *    dayGan: "甲",
 *    partners: ["비견", "편재"],
 *    relation: "극",
 *    origin: "year",
 *    context: "일진",
 *  });
 */
export const resolveTenGodRelationInterpretation = ({
  scope,
  dayGan,
  partners,
  relation,
  context,
  origin,
}: TenGodRelationLookupArgs): TenGodRelationInterpretation => {
  const overrides = TEN_GOD_RELATION_OVERRIDES[dayGan];
  const matched = findOverride(
    overrides,
    scope,
    relation,
    partners,
    context,
    origin
  );
  if (matched) {
    return composeInterpretation(matched, origin);
  }

  return buildFallbackInterpretation(scope, relation, partners);
};
