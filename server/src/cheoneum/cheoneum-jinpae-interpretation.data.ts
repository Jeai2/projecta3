import type { CheoneumMeaningSeed } from "./cheoneum-interpretation.data";

/**
 * 천음 진패 60장 해석 씨앗.
 *
 * 이 파일은 사용자가 직접 편집하기 위한 진패 전용 데이터 파일입니다.
 * 현재 값은 모두 "작성 대기" 템플릿입니다.
 *
 * 작성 방법:
 * - coreImage: 이 진패가 보여주는 중심 장면을 한 문장으로 작성합니다.
 * - semanticField: 핵심 키워드를 짧은 명사/구로 3~7개 작성합니다.
 * - expressionSeeds: AI가 말투에 맞춰 변주할 수 있는 문장 재료를 3~5개 작성합니다.
 * - readingBias: 질문 맥락별 해석 방향입니다.
 * - spreadBias: 특정 스프레드에서만 강조할 내용입니다. 필요 없으면 비워둬도 됩니다.
 *
 * 주의:
 * - 이 파일은 "완성 답변"이 아니라 "해석 재료"입니다.
 * - AI가 그대로 복붙하지 않도록, 너무 긴 완성문보다 의미가 분명한 씨앗 문장이 좋습니다.
 */

type JinpaeMeta = {
  number: number;
  ganji: string;
  name: string;
};

function createEmptyJinpaeMeaning(meta: JinpaeMeta): CheoneumMeaningSeed {
  const label = `${meta.number}. ${meta.name}(${meta.ganji})`;

  return {
    coreImage: `${label} 중심 장면 작성 대기`,
    semanticField: [
      "작성 대기",
    ],
    expressionSeeds: [
      `${label} 표현 씨앗 작성 대기`,
    ],
    readingBias: {
      daily: [
        `${label} 일기/오늘 흐름 해석 작성 대기`,
      ],
      relationship: [
        `${label} 관계/연애 해석 작성 대기`,
      ],
      choice: [
        `${label} 선택/양의 해석 작성 대기`,
      ],
      flow: [
        `${label} 흐름/시기 해석 작성 대기`,
      ],
      caution: [
        `${label} 주의점 해석 작성 대기`,
      ],
    },
    spreadBias: {},
    avoidExactPhrases: [],
  };
}

export const CHEONEUM_JINPAE_MEANINGS: Record<string, CheoneumMeaningSeed> = {
  "jinpae-01-gapja-gimbyeon": {
  coreImage: "어둠 속 물가에서 첫 나무의 싹이 솟아오르듯, 아직 작지만 방향을 잃지 않고 새 흐름을 열어가는 장군의 기상",
  semanticField: [
    "새 출발",
    "초기 결심",
    "숨은 가능성",
    "조심스러운 진입",
    "말보다 준비",
    "흐름의 첫 문",
    "해중금(海中金)",
    "시공간의 첫 단추",
    "재정적 내실 설계",
    "막힌 물길의 준설",
    "이면을 꿰뚫는 신안(神眼)"
  ],
  expressionSeeds: [
    "아직 결과가 크게 드러난 단계는 아니지만, 안쪽에서는 이미 방향이 잡히기 시작한 흐름입니다.",
    "지금은 밀어붙이는 힘보다 첫 단추를 정확히 끼우는 감각이 중요합니다.",
    "작게 시작해도 흐름의 씨앗이 살아 있으니, 초반의 망설임만 잘 넘기면 다음 장면이 열립니다.",
    "겉으로는 조용해 보여도 속으로는 새 판을 열 준비가 진행되는 카드입니다.",
    "깊은 바닷속에 묻힌 순수한 금 속성처럼, 보이지 않는 영역에서 강력한 재정적 내실과 구조적 정렬이 실시간으로 가동되는 운기입니다.",
    "막혔던 운하의 모래를 도려내고 생명의 물길을 틔우듯, 현실의 매트릭스가 가장 밑바닥에서부터 소리 없이 소통하기 시작하는 국면입니다."
  ],
  readingBias: {
    daily: [
      "오늘은 크게 드러나는 성과보다, 앞으로 이어질 일을 조용히 시작하거나 마음속 결심을 정리하기 좋은 흐름입니다.",
      "처음부터 완벽하게 해내려 하기보다 작은 시작을 정확히 잡는 것이 하루의 핵심입니다.",
      "하루의 에너지가 음에서 양으로 전환되는 결정적 분기점이니, 눈앞의 소란에 흔들리지 말고 철저한 예산과 보이지 않는 내실을 다지는 편이 이롭습니다.",
      "막힌 물길을 뚫어 내듯 밀린 서류나 정체되었던 일상의 작은 축들을 소리 없이 준설해 나갈 때 운기가 가동됩니다."
    ],
    relationship: [
      "관계에서는 상대의 마음이 크게 표현되기보다, 조심스럽게 방향을 살피는 흐름으로 나타납니다.",
      "성급하게 확인하려 들기보다 자연스럽게 말을 열면, 아직 작지만 이어질 수 있는 반응이 생깁니다.",
      "겉으로 드러난 태도 뒤에 감춰진 상대의 진짜 속마음을 통찰해야 하며, 섣부른 오해보다 내면의 안목으로 이면의 결속 가능성을 묵묵히 조망해야 하는 시기입니다.",
      "음양이 한 몸에 묶인 전환기의 형상처럼 겉으로는 서늘해 보여도 수면 아래에서는 보이지 않는 깊은 정과 약속의 싹이 트고 있습니다."
    ],
    choice: [
      "선택 앞에서는 당장의 화려한 결과보다, 이 선택이 앞으로 어떤 첫 문을 여는지를 보는 것이 중요합니다.",
      "새로 시작하는 쪽은 가능성이 있지만 아직 여린 흐름이고, 유지하는 쪽은 안정적이지만 변화의 씨앗은 약할 수 있습니다.",
      "당장의 소모성 비용이나 화려한 외형적 조건에 현혹되지 말고, 장기적으로 재정적 안정을 지탱할 수 있는 긴축적이고 내실 있는 구조를 택해야 성공으로 연산됩니다.",
      "바닷속 깊이 감추어진 가치를 알아보는 안목이 요구되며, 첫 단추를 정확히 채우는 쪽으로 키를 잡아야 뒤로 갈수록 강력한 동력을 얻습니다."
    ],
    flow: [
      "앞으로의 흐름은 갑자기 폭발하기보다 작은 시작이 누적되며 서서히 모양을 갖추는 쪽에 가깝습니다.",
      "초반에는 불확실해 보여도 방향만 잃지 않으면 뒤로 갈수록 흐름이 살아납니다.",
      "초기의 엉킨 실타래와 사소한 제약을 극복하고, 닫혔던 댐의 수문이 열리며 거대한 물길이 사방으로 순환하기 시작하는 도미노 체인의 서막입니다.",
      "상위의 영적인 작용이 필드에 개입하기 전, 바꿀 수 없는 완벽한 현실의 물질계가 단단하게 조율되고 재편되는 역동적인 바탕의 자전 단계입니다."
    ],
    caution: [
      "아직 싹이 여린 시기라 성급한 공개, 과한 확신, 무리한 돌파는 흐름을 꺾을 수 있습니다.",
      "마음만 앞서고 준비가 부족하면 시작은 했지만 지속되지 않는 모양이 될 수 있으니, 작은 실행 계획이 필요합니다.",
      "준비되지 않은 상태에서 무모하게 지면을 파헤치거나 절대적인 권위에 함부로 도전하는 도발 행위는 상상할 수 없는 가혹한 재앙을 부르니 극도의 자성이 필요합니다.",
      "감정적인 요동이나 이성 간의 부적절하고 일방적인 오해로 인해, 공들여 구축해 온 신용과 재물이 한순간에 매몰되거나 훼손당할 리스크를 철저히 방어해야 합니다."
    ]
  },
  spreadBias: {
    yangeui: [
      "양의에서 나오면 한쪽 미래가 아직 완성된 길이라기보다, 이제 막 열리는 가능성의 문임을 강조합니다.",
      "겉보기의 강약보다 이 선택이 장기적으로 싹을 틔울 수 있는지 봐야 합니다.",
      "수동적인 내면의 자리에 놓일 때는 보이지 않는 가치와 자본의 내실 비축을 연산하고, 능동적인 외부의 자리에 놓일 때는 현실 시공간의 첫 물길을 트는 강력한 시발점으로 알고리즘이 전환됩니다."
    ],
    wonhyeongijeong: [
      "원형이정에서는 원(元)의 자리, 즉 시작과 발아의 단계에서 특히 강하게 작동합니다.",
      "초기의 발심 단계에서 현실의 가뭄을 극복하는 강력한 수리적 유통력과 치밀한 재무 긴축 설계를 물리적으로 발동시켜, 장기 국면 전체의 국고 붕괴를 전면 차단하는 코어 엔진의 기점으로 연산됩니다."
    ]
  },
  avoidExactPhrases: [
    "첫 나무의 싹",
    "장군의 기상",
    "갑자태세 김변장군",
    "태세성군",
    "시육",
    "양임",
    "은교",
    "김렴",
    "자미궁",
    "강림",
    "메이저",
    "마이너",
    "흉살",
    "규"
  ],
  },
 "jinpae-02-byeongja-gwakga": {
  coreImage: "차가운 바위틈을 뚫고 솟구친 맑은 샘물이 현실의 타오르는 불길과 맞부딪치며, 위장된 탁기를 정화하고 굳건한 방어선을 구축하는 장군의 기상",
  semanticField: [
    "내부적 조율",
    "위장의 간파",
    "간하수(澗下水)",
    "탁기의 정화",
    "자산의 유동화",
    "철저한 전열 정비",
    "호로(조롱박)의 벽사",
    "정면 돌파의 결단",
    "거짓 신호의 박리"
  ],
  expressionSeeds: [
    "겉으로 드러난 푸른 위장막을 벗겨내고, 수면 아래 감춰진 진짜 실체와 리스크를 칼같이 분리해 내는 흐름입니다.",
    "물과 불이 정면으로 교차하는 정점의 시기이므로, 내부의 불협화음을 잠재울 냉철한 정화 장치가 가동되기 시작합니다.",
    "막연한 낙관론이나 위장된 제안에 흔들리지 않고, 가용한 모든 자원을 코어 중심으로 집중시켜 방어선을 구축해야 하는 국면입니다.",
    "조롱박이 사악한 독기를 빨아들이듯, 필드 주변의 불필요한 구설과 유해한 기운을 소리 없이 수렴하여 소멸시키는 운기입니다."
  ],
  readingBias: {
    daily: [
      "오늘은 주변의 감정적 과열이나 복잡하게 얽힌 이해관계를 냉정하게 세척하고 원점부터 재정비하기에 가장 적합한 하루입니다.",
      "달콤한 말이나 겉보기에 안전해 보이는 제안 뒤에 숨은 의도를 한 번 더 검증할 때, 예기치 못한 손실을 완벽히 차단할 수 있습니다.",
      "보유한 에너지와 자원을 외부로 분산시키기보다, 가장 중요한 본진의 안녕과 내실을 사수하는 방향으로 기동하는 것이 이롭습니다.",
      "막혔던 골짜기에서 맑은 물이 터져 나오듯, 정체되었던 문제의 핵심을 찌르는 날카로운 해결책이 실시간으로 도출됩니다."
    ],
    relationship: [
      "관계에서는 상대방이 보여주는 겉모습이나 일시적인 태도에 현혹되지 말고, 그 이면에 자리 잡은 본심의 궤적을 읽어내야 합니다.",
      "갈등이나 오해가 불타오르더라도, 감정적으로 맞대응하기보다 차갑고 명확한 사실(Fact)을 제시하여 판을 정화하는 편이 훨씬 유리합니다.",
      "서로의 신뢰를 지키기 위해 필요하다면 사소한 자존심이나 불필요한 고집을 과감히 내려놓고, 관계의 본질적 결속을 사수해야 하는 시기입니다.",
      "위장된 호의나 양면성을 지닌 인물이 스크리닝되는 흐름이므로, 인간관계의 대대적인 수질 정화가 일어날 수 있습니다."
    ],
    choice: [
      "선택의 기로에서는 화려하게 포장된 외부의 조건(청의)을 과감히 배제하고, 리스크가 완전히 제거된 순수 자본과 실리를 택해야 성공으로 연산됩니다.",
      "지금은 공격적으로 영역을 확장할 때가 아니라, 가용한 예산과 자산을 콤팩트하게 재조정하여 리스크 방어벽을 세우는 쪽이 절대적으로 안전합니다.",
      "양극단의 조건이 팽팽하게 대치하는 형상이니, 어느 한쪽에 치우치지 않고 중심을 관통하는 제3의 정화된 대안을 도출해야 합니다.",
      "눈앞의 가벼운 이익을 탐하다가 대지의 평온을 깨뜨리는 악수(동토)를 두지 않도록, 철저한 내부 시뮬레이션을 거친 선택이 요구됩니다."
    ],
    flow: [
      "앞으로의 흐름은 숨겨져 있던 변수와 거짓 신호들이 수면 위로 강제 인양되며 전반적인 판짜기가 다시 일어나는 국면으로 진입합니다.",
      "초반의 극심한 마찰과 대립($水火未濟$)을 통과한 뒤, 간하수의 맑은 기운이 필드를 완전히 세척하며 극도로 투명하고 유리한 고지가 확보됩니다.",
      "불필요한 부채나 거품이 걷히고, 현실 매트릭스 내부의 가장 단단하고 정제된 핵심 골격만 남겨져 장기적인 생명력을 얻게 됩니다.",
      "인간의 통제 범위를 벗어난 방위적 살기가 차단되고, 본진을 사수하려는 의지가 구체적인 물질적 성과와 결속으로 실현되는 역동적 전개입니다."
    ],
    caution: [
      "자신의 한계를 망각하고 영험한 신성이나 절대적인 권위의 머리 위에 함부로 흙을 움직이는 무모한 도발(동토)은 가혹한 파멸을 초래할 수 있습니다.",
      "매사 아집에 사로잡혀 내부 자원의 재배치를 거부하거나 전열 정비의 타이밍을 놓치면, 외부의 파상공세에 무방비로 노출될 위험이 큽니다.",
      "감정의 과열로 인해 일간이 연운의 거대한 흐름과 정면 충돌할 경우, 가문의 신용이나 핵심 자본이 일시에 동결되거나 타격을 입을 수 있으니 언행을 각별히 자제해야 합니다.",
      "아군으로 위장한 사기적 요소를 알아채지 못하고 무비판적으로 수용할 시, 뒤늦게 붉은 실체를 드러낸 적에게 치명적인 배신을 당할 리스크를 극도 경계하십시오."
    ]
  },
  spreadBias: {
    yangeui: [
      "양의에서 작동할 때, 본 카드는 필드 위의 모든 위장막과 노이즈를 걷어내고 사태의 본질을 백일하에 드러내는 강력한 '폭로와 분별'의 렌즈로 기능합니다.",
      "동시에 위기 돌파를 위해 내부 자본을 과감하게 유동화하는 선제적이고 능동적인 구조조정의 트리거가 됩니다."
    ],
    wonhyeongijeong: [
      "원형이정 체계 내에서는 이(利)와 정(貞)의 길목, 즉 수확의 결실을 단단하게 단속하고 외부의 침탈로부터 방어 기지를 구축하는 단계에서 폭발적인 성능을 출력합니다.",
      "바위틈을 뚫고 솟구치는 샘물처럼 어떤 척박한 환경에서도 마르지 않는 영적 저력과 가문의 안전판을 실시간으로 확보해 줍니다."
    ]
  },
  avoidExactPhrases: [
    "바위틈을 뚫고",
    "조롱박",
    "병자태세 곽가대장군",
    "태세성군",
    "시육",
    "곽가 원례",
    "곽가 봉효",
    "홍건적",
    "청의",
    "자미궁",
    "강림",
    "메이저",
    "마이너",
    "흉살",
    "규"
  ],
  },
  "jinpae-03-muja-chudang": createEmptyJinpaeMeaning({
    number: 3,
    ganji: "무자",
    name: "추당장군",
  }),
  "jinpae-04-gyeongja-nobi": createEmptyJinpaeMeaning({
    number: 4,
    ganji: "경자",
    name: "노비장군",
  }),
  "jinpae-05-imja-gudeok": createEmptyJinpaeMeaning({
    number: 5,
    ganji: "임자",
    name: "구덕장군",
  }),
  "jinpae-06-eulchuk-jinjae": createEmptyJinpaeMeaning({
    number: 6,
    ganji: "을축",
    name: "진재장군",
  }),
  "jinpae-07-jeongchuk-tanggeum": createEmptyJinpaeMeaning({
    number: 7,
    ganji: "정축",
    name: "탕금장군",
  }),
  "jinpae-08-gichuk-buu": createEmptyJinpaeMeaning({
    number: 8,
    ganji: "기축",
    name: "부우장군",
  }),
  "jinpae-09-sinchuk-yangsin": createEmptyJinpaeMeaning({
    number: 9,
    ganji: "신축",
    name: "양신장군",
  }),
  "jinpae-10-gyechuk-judeuk": createEmptyJinpaeMeaning({
    number: 10,
    ganji: "계축",
    name: "주득장군",
  }),
  "jinpae-11-gabin-jangjo": createEmptyJinpaeMeaning({
    number: 11,
    ganji: "갑인",
    name: "장조장군",
  }),
  "jinpae-12-byeongin-hamjang": createEmptyJinpaeMeaning({
    number: 12,
    ganji: "병인",
    name: "함장장군",
  }),
  "jinpae-13-muin-noseon": createEmptyJinpaeMeaning({
    number: 13,
    ganji: "무인",
    name: "노선장군",
  }),
  "jinpae-14-gyeongin-uhwan": createEmptyJinpaeMeaning({
    number: 14,
    ganji: "경인",
    name: "우환장군",
  }),
  "jinpae-15-imin-haak": createEmptyJinpaeMeaning({
    number: 15,
    ganji: "임인",
    name: "하악장군",
  }),
  "jinpae-16-eulmyo-mancheong": createEmptyJinpaeMeaning({
    number: 16,
    ganji: "을묘",
    name: "만청장군",
  }),
  "jinpae-17-jeongmyo-simheung": createEmptyJinpaeMeaning({
    number: 17,
    ganji: "정묘",
    name: "심흥장군",
  }),
  "jinpae-18-gimyo-yongjung": createEmptyJinpaeMeaning({
    number: 18,
    ganji: "기묘",
    name: "용중장군",
  }),
  "jinpae-19-sinmyo-peomsu": createEmptyJinpaeMeaning({
    number: 19,
    ganji: "신묘",
    name: "펌수장군",
  }),
  "jinpae-20-gyemyo-pisi": createEmptyJinpaeMeaning({
    number: 20,
    ganji: "계묘",
    name: "피시장군",
  }),
  "jinpae-21-gapjin-iseong": createEmptyJinpaeMeaning({
    number: 21,
    ganji: "갑진",
    name: "이성장군",
  }),
  "jinpae-22-byeongjin-sina": createEmptyJinpaeMeaning({
    number: 22,
    ganji: "병진",
    name: "신아장군",
  }),
  "jinpae-23-mujin-jodal": createEmptyJinpaeMeaning({
    number: 23,
    ganji: "무진",
    name: "조달장군",
  }),
  "jinpae-24-gyeongjin-dongdeok": createEmptyJinpaeMeaning({
    number: 24,
    ganji: "경진",
    name: "동덕장군",
  }),
  "jinpae-25-imjin-paengtae": createEmptyJinpaeMeaning({
    number: 25,
    ganji: "임진",
    name: "팽태장군",
  }),
  "jinpae-26-eulsa-osu": createEmptyJinpaeMeaning({
    number: 26,
    ganji: "을사",
    name: "오수장군",
  }),
  "jinpae-27-jeongsa-yangeon": createEmptyJinpaeMeaning({
    number: 27,
    ganji: "정사",
    name: "양언장군",
  }),
  "jinpae-28-gisa-gwakchan": createEmptyJinpaeMeaning({
    number: 28,
    ganji: "기사",
    name: "곽찬장군",
  }),
  "jinpae-29-sinsa-jeongdan": createEmptyJinpaeMeaning({
    number: 29,
    ganji: "신사",
    name: "정단장군",
  }),
  "jinpae-30-gyesa-seodan": createEmptyJinpaeMeaning({
    number: 30,
    ganji: "계사",
    name: "서단장군",
  }),
  "jinpae-31-gabo-jangsa": createEmptyJinpaeMeaning({
    number: 31,
    ganji: "갑오",
    name: "장사장군",
  }),
  "jinpae-32-byeongo-muncheol": createEmptyJinpaeMeaning({
    number: 32,
    ganji: "병오",
    name: "문철장군",
  }),
  "jinpae-33-muo-igyeong": createEmptyJinpaeMeaning({
    number: 33,
    ganji: "무오",
    name: "이경장군",
  }),
  "jinpae-34-gyeongo-wangje": createEmptyJinpaeMeaning({
    number: 34,
    ganji: "경오",
    name: "왕제장군",
  }),
  "jinpae-35-imo-yukmyeong": createEmptyJinpaeMeaning({
    number: 35,
    ganji: "임오",
    name: "육명장군",
  }),
  "jinpae-36-eulmi-busang": createEmptyJinpaeMeaning({
    number: 36,
    ganji: "을미",
    name: "부상장군",
  }),
  "jinpae-37-jeongmi-mubyeong": createEmptyJinpaeMeaning({
    number: 37,
    ganji: "정미",
    name: "무병장군",
  }),
  "jinpae-38-gimi-yangseon": createEmptyJinpaeMeaning({
    number: 38,
    ganji: "기미",
    name: "양선장군",
  }),
  "jinpae-39-sinmi-iso": createEmptyJinpaeMeaning({
    number: 39,
    ganji: "신미",
    name: "이소장군",
  }),
  "jinpae-40-gyemi-wiin": createEmptyJinpaeMeaning({
    number: 40,
    ganji: "계미",
    name: "위인장군",
  }),
  "jinpae-41-gapsin-bangsa": createEmptyJinpaeMeaning({
    number: 41,
    ganji: "갑신",
    name: "방사장군",
  }),
  "jinpae-42-byeongsin-gwanjung": createEmptyJinpaeMeaning({
    number: 42,
    ganji: "병신",
    name: "관중장군",
  }),
  "jinpae-43-musin-seoho": createEmptyJinpaeMeaning({
    number: 43,
    ganji: "무신",
    name: "서호장군",
  }),
  "jinpae-44-gyeongsin-mojae": createEmptyJinpaeMeaning({
    number: 44,
    ganji: "경신",
    name: "모재장군",
  }),
  "jinpae-45-imsin-yuwang": createEmptyJinpaeMeaning({
    number: 45,
    ganji: "임신",
    name: "유왕장군",
  }),
  "jinpae-46-euryu-jangsung": createEmptyJinpaeMeaning({
    number: 46,
    ganji: "을유",
    name: "장숭장군",
  }),
  "jinpae-47-jeongyu-dangsa": createEmptyJinpaeMeaning({
    number: 47,
    ganji: "정유",
    name: "당사장군",
  }),
  "jinpae-48-giyu-jeongbo": createEmptyJinpaeMeaning({
    number: 48,
    ganji: "기유",
    name: "정보장군",
  }),
  "jinpae-49-sinyu-seokjeong": createEmptyJinpaeMeaning({
    number: 49,
    ganji: "신유",
    name: "석정장군",
  }),
  "jinpae-50-gyeyu-gangji": createEmptyJinpaeMeaning({
    number: 50,
    ganji: "계유",
    name: "강지장군",
  }),
  "jinpae-51-gapsul-sigwang": createEmptyJinpaeMeaning({
    number: 51,
    ganji: "갑술",
    name: "시광장군",
  }),
  "jinpae-52-byeongsul-baekmin": createEmptyJinpaeMeaning({
    number: 52,
    ganji: "병술",
    name: "백민장군",
  }),
  "jinpae-53-musul-gangmu": createEmptyJinpaeMeaning({
    number: 53,
    ganji: "무술",
    name: "강무장군",
  }),
  "jinpae-54-gyeongsul-yehwasim": createEmptyJinpaeMeaning({
    number: 54,
    ganji: "경술",
    name: "예화심장군",
  }),
  "jinpae-55-imsul-heungchung": createEmptyJinpaeMeaning({
    number: 55,
    ganji: "임술",
    name: "흥충장군",
  }),
  "jinpae-56-eulhae-imbo": createEmptyJinpaeMeaning({
    number: 56,
    ganji: "을해",
    name: "임보장군",
  }),
  "jinpae-57-jeonghae-bongje": createEmptyJinpaeMeaning({
    number: 57,
    ganji: "정해",
    name: "봉제장군",
  }),
  "jinpae-58-gihae-satae": createEmptyJinpaeMeaning({
    number: 58,
    ganji: "기해",
    name: "사태장군",
  }),
  "jinpae-59-sinhae-yeopgyeon": createEmptyJinpaeMeaning({
    number: 59,
    ganji: "신해",
    name: "엽견장군",
  }),
  "jinpae-60-gyehae-ujeong": createEmptyJinpaeMeaning({
    number: 60,
    ganji: "계해",
    name: "우정장군",
  }),
};
