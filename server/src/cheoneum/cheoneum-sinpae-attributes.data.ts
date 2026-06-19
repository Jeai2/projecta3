/**
 * 낙서구궁 "중궁 신패 방사(팔방 버프/너프)" 스킬용 신패 12 속성. (사장님 편집 — v0 예시)
 *
 * 중궁에 놓인 신패의 고유 성질이 사방 지패에 주입된다. 그 성질을 코드가 읽을 수 있게 구조화한 표.
 * - centerOheng: 신패의 중심 오행. (양 간지 천간 기준 자동 도출값을 적어둠 — 표시·검수용. 엔진은 간지에서 직접 계산)
 * - fortune: 길 / 흉 / 중립 — 방사 성향(폭발 쪽이냐 하락 쪽이냐의 기본값)
 * - noClash: 상극(양)·충(음) 면제. 흉이 통하지 않는 최상위 길성. <<현재 천극만 true>>
 * - effect: 방사 효과 한 줄(짧은 씨앗). LLM이 그대로 베끼지 않고 변주한다.
 *
 * ※ 길흉/효과는 사장님 콘텐츠 영역입니다. 아래는 손쉽게 고치도록 깐 예시값(v0)이에요.
 */

export type SinpaeFortune = "길" | "흉" | "중립";

export interface CheoneumSinpaeAttribute {
  name: string;
  centerOheng: "木" | "火" | "土" | "金" | "水";
  fortune: SinpaeFortune;
  noClash: boolean;
  effect: string;
}

export const CHEONEUM_SINPAE_ATTRIBUTES: Record<string, CheoneumSinpaeAttribute> = {
  "sinpae-01-cheongeuk": { name: "천극", centerOheng: "土", fortune: "길",  noClash: true,  effect: "정렬과 구원 — 사방의 균열을 강제로 정상화한다." },
  "sinpae-02-yeompa":    { name: "염파", centerOheng: "火", fortune: "흉",  noClash: false, effect: "통제 불가능한 변수·요동으로 흐름을 뒤흔든다." },
  "sinpae-03-myeongjeon":{ name: "명전", centerOheng: "火", fortune: "길",  noClash: false, effect: "공식적 선고·결착 — 되돌릴 수 없는 확정을 내린다." },
  "sinpae-04-taehwa":    { name: "태화", centerOheng: "木", fortune: "길",  noClash: false, effect: "거대한 조화·결속으로 거래·관계를 성사시킨다." },
  "sinpae-05-jieom":     { name: "지엄", centerOheng: "土", fortune: "흉",  noClash: false, effect: "전면 동결·교착 — 흐름을 정지·제약시킨다." },
  "sinpae-06-bowon":     { name: "보원", centerOheng: "木", fortune: "길",  noClash: false, effect: "자본 순환·수직 상승으로 판을 번영·도약시킨다." },
  "sinpae-07-jaeun":     { name: "자은", centerOheng: "水", fortune: "길",  noClash: false, effect: "최상위 수용·감화 — 치유하고 끌어안는다." },
  "sinpae-08-wolyeong":  { name: "월령", centerOheng: "金", fortune: "중립", noClash: false, effect: "은밀한 차폐·사적 연대 — 드러나지 않게 작동한다." },
  "sinpae-09-amnyu":     { name: "암류", centerOheng: "水", fortune: "흉",  noClash: false, effect: "보이지 않는 잠식·유출 — 침식 리스크를 키운다." },
  "sinpae-10-gyeongyeon":{ name: "경연", centerOheng: "土", fortune: "길",  noClash: false, effect: "공식적 격상·풍요 — 성과의 향연을 연다." },
  "sinpae-11-hwaldo":    { name: "활도", centerOheng: "金", fortune: "길",  noClash: false, effect: "전격 절단·초고속 돌파로 혁신을 밀어붙인다." },
  "sinpae-12-taeheo":    { name: "태허", centerOheng: "土", fortune: "중립", noClash: false, effect: "영점 리셋·공백 — 판을 비워 다시 시작하게 한다." },
};
