// server/src/data/today-fortune/phrases.ts
// 오늘의 운세 전용 짧은 문구 템플릿 모음

export type Tone = "pro" | "neutral" | "con";

// 십신 템플릿: 기준 기둥/상황별로 확장 가능
export const sipsinPhrases: Record<string, Partial<Record<Tone, string[]>>> = {
  정인: {
    pro: ["지원과 안정이 따릅니다.", "학습·연구에 좋은 흐름입니다."],
    neutral: ["조용히 내실을 다지기 좋습니다."],
  },
  편인: {
    neutral: ["직관과 탐구에 몰입할수 있습니다."],
  },
  비견: {
    neutral: ["동료와 보조를 맞추면 무난합니다."],
  },
  겁재: {
    con: ["경쟁·소모를 줄이는 지혜가 필요합니다."],
  },
  식신: {
    pro: [
      "생산성과 건강 관리에 유리합니다.",
      "꾸준한 실행이 성과로 이어집니다.",
    ],
  },
  상관: {
    con: ["표현 과함·말실수를 주의하세요."],
  },
  편재: {
    pro: ["기회 포착과 외연 확장에 용이합니다."],
  },
  정재: {
    pro: ["안정적 실익이 기대됩니다."],
  },
  편관: {
    con: ["압박·규율이 강해질 수 있습니다."],
  },
  정관: {
    neutral: ["규범과 신뢰를 지키면 무난합니다."],
  },
};

// 오행 상호작용
export const ohengPhrases: Record<string, { tone: Tone; lines: string[] }> = {
  생: { tone: "pro", lines: ["기운이 보강되는 상생의 흐름입니다."] },
  비: { tone: "neutral", lines: ["동기(같은 기운)로 무난합니다."] },
  극: { tone: "con", lines: ["상극으로 부하·갈등이 있을 수 있습니다."] },
  무: { tone: "neutral", lines: ["특이 신호가 약합니다."] },
};

// 지지 관계
export const relationPhrases: Record<string, { tone: Tone; lines: string[] }> =
  {
    합: { tone: "pro", lines: ["조화와 연대의 기회가 있습니다."] },
    충: { tone: "con", lines: ["변동·이동 이슈에 대비하세요."] },
    형: { tone: "con", lines: ["마찰·긴장에 유의하세요."] },
    파: { tone: "con", lines: ["흩어짐·이완을 관리하세요."] },
    해: { tone: "con", lines: ["은근한 지연·방해에 주의하세요."] },
  };

// 신살(예시 소수만, 필요시 확대)
export const sinsalPhrases: Record<string, { tone: Tone; lines: string[] }> = {
  천을귀인: { tone: "pro", lines: ["도움과 귀인의 손길이 닿습니다."] },
  재살: { tone: "con", lines: ["돌발 상황에 대비하세요."] },
  역마: { tone: "neutral", lines: ["이동·변화의 기미가 있습니다."] },
};

// 섹션별 기본 문구
export const sectionPhrases = {
  summary: {
    pro: ["기회가 열리는 하루."],
    neutral: ["무난하게 흐르는 하루."],
    con: ["신중함이 필요한 하루."],
  },
  general: {
    pro: ["새로운 시도가 자연스럽게 이어집니다."],
    neutral: ["기본에 충실하면 안정적입니다."],
    con: ["과도한 확장은 피하고 리스크를 줄이세요."],
  },
  health: {
    pro: ["가벼운 운동과 루틴이 큰 도움."],
    neutral: ["컨디션 유지에 무난."],
    con: ["과로·수면 부족 주의."],
  },
  money: {
    pro: ["계획된 지출·투자에 유리."],
    neutral: ["수입·지출 균형 유지."],
    con: ["충동 지출 경계."],
  },
  love: {
    pro: ["표현이 좋은 반응으로 이어질 수 있음."],
    neutral: ["소소한 대화가 도움이 됨."],
    con: ["감정적인 언행 자제."],
  },
  work: {
    pro: ["주도적 제안·실행이 성과로."],
    neutral: ["협업·정리로 무난한 진전."],
    con: ["과속 추진 지양."],
  },
  relations: {
    pro: ["연대·협력이 힘이 됩니다."],
    neutral: ["관계를 정돈하기에 적절."],
    con: ["불필요한 마찰을 피하세요."],
  },
  documents: {
    pro: ["문서·계약 진행에 순풍."],
    neutral: ["검토·정리 중심으로."],
    con: ["기한·조건을 재점검."],
  },
  advice: {
    pro: ["기회를 보되 기본 수칙을 지키세요."],
    neutral: ["오늘의 페이스를 유지하세요."],
    con: ["서두르지 말고 안전장치를 마련하세요."],
  },
};

// 문장 연결용 접속사
export const connectors = [
  "한편",
  "다만",
  "또한",
  "특히",
  "그래도",
  "무엇보다",
];
