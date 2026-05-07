//육임단시점

export interface LukimInterpretation {
  id: number;
  name: string;
  summary: string;
  keywords?: string[];
  notes?: string;
}

export const LUKIM_INTERPRETATIONS: Record<number, LukimInterpretation> = {
  13: {
    id: 13,
    name: "뱀괘",
    summary: "대반전의 하루! 꽉 막혔던 일들이 뜻밖의 도움으로 단숨에 뚫리는 사이다 같은 날입니다.",
  },
  14: {
    id: 14,
    name: "지렁이괘",
    summary: "소나기는 일단 피하고 보는 법! 새로운 결정은 내일로 미루고 오늘은 한 템포 푹 쉬어가세요.",
  },
  15: {
    id: 15,
    name: "거미괘",
    summary: "투머치(Too much) 액션은 금물! 오늘은 최소한의 움직임으로 에너지를 비축하는 것이 진짜 이득입니다.",
  },
  16: {
    id: 16,
    name: "비둘기괘",
    summary: "가만히 있어도 기분 좋은 소식이 넝쿨째 굴러오는 날! 만사형통의 운기를 마음껏 누리세요.",
  },
  17: {
    id: 17,
    name: "달팽이괘",
    summary: "마음은 급한데 발걸음은 천근만근. 억지로 속도를 내기보다는 한 템포 쉬어가는 여유가 필요해요.",
  },
  18: {
    id: 18,
    name: "산쥐괘",
    summary: "나의 부족함을 인정할 때 진짜 기적이 시작됩니다. 내밀어 주는 손을 잡으면 전화위복의 기회가 열려요.",
  },
  19: {
    id: 19,
    name: "묶인 원숭이괘",
    summary: "어떤 태클이 들어와도 '노 데미지(No Damage)'! 오늘은 당신의 무한한 가능성만 믿고 직진하세요",
  },
  20: {
    id: 20,
    name: "파리괘",
    summary: "승자 없는 뼈다귀 싸움에 에너지 낭비 금지! 오늘은 시시비비보다 내 갈 길을 가는 게 최고예요.",
  },
  21: {
    id: 21,
    name: "묶인 돼지괘",
    summary: "혼자 끙끙대던 고민 끝! 뜻밖의 이벤트가 마법처럼 문제를 가볍게 해결해 주는 날입니다.",
  },
  22: {
    id: 22,
    name: "재비괘",
    summary: "메마른 일상에 단비가 쫙! 끝난 줄 알았던 일에도 새싹이 돋는 기적의 하루입니다.",
  },
  23: {
    id: 23,
    name: "집쥐괘",
    summary: "스타트는 느려도 도착지는 해피엔딩! 늦게 피는 꽃이 더 아름다운 대기만성의 하루입니다.",
  },
  24: {
    id: 24,
    name: "박쥐괘",
    summary: "돌발 상황 발생! 오늘은 내 판단력을 믿기보다 주변의 도움을 전적으로 믿고 따라야 살 길입니다.",
  },
  25: {
    id: 25,
    name: "까치괘",
    summary: "망설임은 끝, 이제는 진격할 때! 장군처럼 당당하게 나서면 모든 장애물이 길을 비켜줍니다.",
  },
  26: {
    id: 26,
    name: "매미괘",
    summary: "억지로 애쓰지 마세요. 흐르는 물처럼 모든 것이 자연스럽고 매끄럽게 풀리는 마법 같은 하루!",
  },
  27: {
    id: 27,
    name: "용괘",
    summary: "치열했던 고민 끝, 마침내 만국 태평! 윗사람의 전폭적인 인정과 완벽한 평화가 찾아옵니다",
  },
};

export const getLukimInterpretation = (
  value: number
): LukimInterpretation | null => {
  return LUKIM_INTERPRETATIONS[value] ?? null;
};
