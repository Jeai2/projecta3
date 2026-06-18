/**
 * 천음 고유 "관계" 해석 씨앗.
 *
 * 카드 사이의 명리 관계(합/충/형/파/해/삼합 등)와 합화 오행 국(局), 그리고
 * 신패↔진패 결합 양태를, 천음의 시선으로 풀어둔 v0 콘텐츠다.
 *
 * - 관계 "탐지"는 앱 공용 데이터(../data/relationship.data.ts)로 하고,
 *   "그 관계가 천음에서 무슨 뜻인가"는 이 파일이 담당한다.
 * - 이 파일은 사용자가 직접 첨삭하기 위한 파일이다. 완성 문장이 아니라 의미 씨앗으로 쓴다.
 * - AI가 그대로 복붙하지 않도록, 의미가 분명한 짧은 씨앗으로 둔다.
 */

import type { RelationKind, CombinationKind } from "./cheoneum-relations";

export interface CheoneumRelationSeed {
  /** 사람이 읽는 이름 */
  label: string;
  /** 이 관계가 품은 중심 장면/본질 (한 문장) */
  coreImage: string;
  /** 점사에서 이 관계가 어떻게 작용하는지의 해석 씨앗 (한두 문장) */
  reading: string;
  /** 그대로 반복되면 어색한 표현 */
  avoid?: string[];
}

// ── 카드 사이 관계 11종 (천간/지지) ──
export const CHEONEUM_RELATION_MEANINGS: Record<RelationKind, CheoneumRelationSeed> = {
  천간합: {
    label: "천간합",
    coreImage: "두 기운이 서로에게 끌려 본래 색을 버리고 한 몸으로 화하는 자리.",
    reading:
      "협력·결합·정으로 읽는다. 다만 합은 묶이는 만큼 본래의 작용을 잃기도 하니(합거), 무엇을 내주고 하나가 되는지를 함께 본다.",
  },
  천간충: {
    label: "천간충",
    coreImage: "두 천간이 정면으로 부딪쳐 서로를 치고 누르는 자리.",
    reading:
      "대립·결단·압박. 한쪽이 다른 쪽을 눌러 흔든다. 깨고 새로 시작하는 추진력이자, 소모와 마찰의 자리이기도 하다.",
  },
  육합: {
    label: "육합",
    coreImage: "이웃한 두 지지가 가까이 손잡아 한 기운으로 모이는 자리.",
    reading: "친밀·결속·은근한 협력으로 읽는다. 빠르고 가깝게 묶이나, 그만큼 사사롭고 좁아질 수 있다.",
  },
  삼합: {
    label: "삼합",
    coreImage: "세 지지가 삼각으로 모여 하나의 큰 국(局)을 이루는 자리.",
    reading:
      "큰 흐름·사회적 결집·장기 목표로 읽는다. 개인을 넘어 판 전체가 한 방향으로 크게 움직인다. 합화한 오행이 그 판의 색이다.",
  },
  반합: {
    label: "반합",
    coreImage: "삼합 세 자리 중 둘만 만나 큰 흐름의 일부를 미리 끌어오는 자리.",
    reading: "아직 완성되지 않았으나 같은 물길로 끌린다. 잠재된 결집, 한 조각이 비어 있는 흐름으로 읽는다.",
  },
  방합: {
    label: "방합",
    coreImage: "같은 계절·방향의 지지가 한데 뭉쳐 한 기운으로 쏠리는 자리.",
    reading: "강한 편중·집중·추진. 한 방향으로 힘이 몰리니 밀어붙이는 힘은 크되 균형을 잃기 쉽다.",
  },
  암합: {
    label: "암합",
    coreImage: "겉으로 드러나지 않게 속에서 은밀히 손잡는 자리.",
    reading: "드러나지 않은 인연·속정·비밀스러운 연결로 읽는다. 표면 아래의 끌림이라 본인도 모르게 작동한다.",
  },
  충: {
    label: "충",
    coreImage: "마주 보는 두 지지가 정면으로 맞부딪쳐 자리를 뒤엎는 자리.",
    reading: "변동·이동·충돌·전환. 흔들어 깨우거나 무너뜨린다. 흐름의 큰 변곡점으로 읽는다.",
  },
  삼형: {
    label: "삼형",
    coreImage: "세 지지가 서로 물고 갈며 시비를 일으키는 자리.",
    reading: "갈등·시비·구설·갈림. 셋이 얽혀 서로를 찌르니, 무언가 풀리기 전에 먼저 휘저어지는 형국이다.",
  },
  파: {
    label: "파",
    coreImage: "두 지지가 서로의 짜임을 깨고 흩뜨리는 자리.",
    reading: "분리·해체·균열로 읽는다. 모인 것을 흩고 매듭을 풀어 헤친다. 큰 파국보다 구조의 어긋남에 가깝다.",
  },
  해: {
    label: "해",
    coreImage: "두 지지가 은근히 서로를 갉아 어긋나게 하는 자리.",
    reading: "소소한 손상·시기·어긋남. 크게 터지진 않으나 속에서 천천히 갉히는 자리로 읽는다.",
  },
};

// ── 합화 결과 오행 국(局) 5종 — 한자 오행 키 ──
export type GukOhaeng = "木" | "火" | "土" | "金" | "水";

export const CHEONEUM_GUK_MEANINGS: Record<GukOhaeng, CheoneumRelationSeed> = {
  木: {
    label: "목국(木局)",
    coreImage: "펼침 전체가 뻗고 자라는 목(木)의 기운으로 물든 자리.",
    reading: "성장·시작·확장·인정. 새로 뻗어 나가려는 흐름이 판을 지배한다.",
  },
  火: {
    label: "화국(火局)",
    coreImage: "펼침 전체가 타오르고 드러나는 화(火)의 기운으로 물든 자리.",
    reading: "열정·표출·확산·명예. 빠르게 타오르되 소진과 과열을 조심한다.",
  },
  土: {
    label: "토국(土局)",
    coreImage: "펼침 전체가 쌓이고 머무는 토(土)의 기운으로 물든 자리.",
    reading: "안정·중재·축적. 단단히 모이나 무거워 더디고 정체될 수 있다.",
  },
  金: {
    label: "금국(金局)",
    coreImage: "펼침 전체가 단단히 매듭짓고 거두는 금(金)의 기운으로 물든 자리.",
    reading: "결실·결단·정리·냉정. 맺고 끊는 힘이 강해진다.",
  },
  水: {
    label: "수국(水局)",
    coreImage: "펼침 전체가 흐르고 스며드는 수(水)의 기운으로 물든 자리.",
    reading: "지혜·유연·이동·잠복. 깊이 흐르나 방향을 잃으면 범람한다.",
  },
};

// ── 신패↔진패 결합 양태 5종 ──
export const CHEONEUM_COMBINATION_MEANINGS: Record<CombinationKind, CheoneumRelationSeed> = {
  신생진: {
    label: "신생진 (큰 흐름이 사건을 키움)",
    coreImage: "큰 흐름(신패)이 현실 사건(진패)에 기운을 흘려 북돋는 자리.",
    reading: "주제가 현실의 사건을 키워 일이 자란다. 흐름이 사건을 밀어주는 순방향이다.",
  },
  신극진: {
    label: "신극진 (큰 흐름이 사건을 누름)",
    coreImage: "큰 흐름이 현실 사건을 눌러 제어하는 자리.",
    reading: "주제가 사건을 억제·관리한다. 큰 틀이 현실을 다잡되, 지나치면 짓눌러 막는다.",
  },
  진생신: {
    label: "진생신 (사건이 큰 흐름을 떠받침)",
    coreImage: "현실 사건(진패)이 큰 흐름(신패)에 힘을 보태는 자리.",
    reading: "구체적인 사건이 주제를 떠받쳐 흐름이 두터워진다. 디테일이 판을 살린다.",
  },
  진극신: {
    label: "진극신 (사건이 큰 흐름을 거스름)",
    coreImage: "현실 사건이 큰 흐름을 거슬러 흔드는 자리.",
    reading: "구체 사건이 주제와 따로 놀거나 거스른다. 현실이 큰 그림을 흔들어 어긋나게 한다.",
  },
  비화: {
    label: "비화 (같은 기운으로 증폭)",
    coreImage: "큰 흐름과 현실 사건이 같은 기운이라 한 몸처럼 겹쳐 증폭되는 자리.",
    reading: "주제와 사건이 같은 색으로 커진다. 힘이 한데 모이나 편중과 과함을 조심한다.",
  },
};

export function getCheoneumRelationSeed(kind: RelationKind | CombinationKind): CheoneumRelationSeed | null {
  if (Object.prototype.hasOwnProperty.call(CHEONEUM_RELATION_MEANINGS, kind)) {
    return CHEONEUM_RELATION_MEANINGS[kind as RelationKind];
  }
  if (Object.prototype.hasOwnProperty.call(CHEONEUM_COMBINATION_MEANINGS, kind)) {
    return CHEONEUM_COMBINATION_MEANINGS[kind as CombinationKind];
  }
  return null;
}
