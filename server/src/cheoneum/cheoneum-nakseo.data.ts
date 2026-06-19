/**
 * 낙서구궁 재설계 — 궁(宮) 9개 스펙 + 침로(배치 순서) + 중궁 관통 4축 + 사정/사간 + 지장간 본기.
 *
 * 운용(양=화선/낮, 음=화영/밤)에 따라 운기 엔진의 "원소"가 달라진다(엔진은 별도 파일):
 *  - 양: 진패=납음오행, 신패=천간 오행 → 오행 상생(폭발)/상극(하락)
 *  - 음: 진패=지지 지장간 본기(천간), 신패=지지 지장간 본기 → 천간합(폭발)/천간충(하락)
 *
 * 이 파일은 데이터 골격(자리 의미·배치·축·그룹·본기표)만 담는다. 운기 계산 로직은 엔진에서.
 */

export type GugungGroup = "center" | "sajeong" | "sagan";

export interface CheoneumGugung {
  key: string;          // reading position 키
  name: string;         // 궁 이름
  nakseoNumber: number; // 낙서 수리
  vectorFlow: string;   // 운기(에너지 성질)
  lens: string;         // 실전 리딩 렌즈(用의 관점) — 사장님 편집 영역
  group: GugungGroup;   // 중궁 / 사정방 / 사간방
  row: number;          // 낙서 마방진 좌표(3x3, 남쪽이 위)
  col: number;
}

// 낙서 마방진 배치(가로·세로·대각 합 15):
//   손4 리9 곤2
//   진3 중5 태7
//   간8 감1 건6
export const CHEONEUM_GUGUNG: Record<string, CheoneumGugung> = {
  junggung: { key: "junggung", name: "중궁(中宮)", nakseoNumber: 5, vectorFlow: "본기(本氣)", lens: "주체의 현재 중심 상태, 사건의 심장부 및 핵심 동력.", group: "center", row: 1, col: 1 },
  gamgung:  { key: "gamgung",  name: "감궁(坎宮)", nakseoNumber: 1, vectorFlow: "동결/침식", lens: "밑바닥 자본의 흐름, 리스크, 보이지 않는 지연 및 수면 아래의 인과.", group: "sajeong", row: 2, col: 1 },
  gongung:  { key: "gongung",  name: "곤궁(坤宮)", nakseoNumber: 2, vectorFlow: "포용/기반", lens: "현실적 생산 토대, 자양분, 내부 협력 및 리스크를 받아내는 복원력.", group: "sagan",   row: 0, col: 2 },
  jingung:  { key: "jingung",  name: "진궁(震宮)", nakseoNumber: 3, vectorFlow: "시발/도약", lens: "신규 프로젝트의 발단, 전격적 전진, 속도감 있는 필드 전개력.", group: "sajeong", row: 1, col: 0 },
  songung:  { key: "songung",  name: "손궁(巽宮)", nakseoNumber: 4, vectorFlow: "확산/융통", lens: "외부 계약의 성사 가능성, 자금의 유동성, 유연한 소통 체계.", group: "sagan",   row: 0, col: 0 },
  geongung: { key: "geongung", name: "건궁(乾宮)", nakseoNumber: 6, vectorFlow: "권제/상위", lens: "상위 의사결정권자의 개입, 법적 시스템의 비호, 거시적 통제력.", group: "sagan",   row: 2, col: 2 },
  taegung:  { key: "taegung",  name: "태궁(兌宮)", nakseoNumber: 7, vectorFlow: "수확/결착", lens: "가시적인 매출, 최종 성과물의 취득, 분배 및 실질적 ROI.", group: "sajeong", row: 1, col: 2 },
  gangung:  { key: "gangung",  name: "간궁(艮宮)", nakseoNumber: 8, vectorFlow: "전환/축적", lens: "정체 구간 속의 변곡점, 축적된 자산의 재투자, 방향 수정의 축.", group: "sagan",   row: 2, col: 0 },
  rigung:   { key: "rigung",   name: "리궁(離宮)", nakseoNumber: 9, vectorFlow: "광휘/발현", lens: "대외적 명예, 브랜드 가치, 정보의 확산 및 공식적인 공표성.", group: "sajeong", row: 0, col: 1 },
};

// 침로(針路): 중궁(신패) → 낙서수 6→7→8→9→1→2→3→4 순으로 앞면을 깐다.
// 배치 흐름 자체가 시간의 미시적 동선이자 에너지 유입 침로로 작동한다(해석에 반영).
export const CHEONEUM_NAKSEO_CHIMRO: string[] = [
  "junggung", "geongung", "taegung", "gangung", "rigung", "gamgung", "gongung", "jingung", "songung",
];

// 중궁을 관통하는 4개 축. 양끝 지패는 직접 부딪히지 않고 중궁 신패를 통관(중재) 거점으로 교류한다.
export const CHEONEUM_NAKSEO_AXES: Array<{ name: string; ends: [string, string] }> = [
  { name: "가로 진-중-태", ends: ["jingung", "taegung"] },
  { name: "세로 리-중-감", ends: ["rigung", "gamgung"] },
  { name: "대각 손-중-건", ends: ["songung", "geongung"] },
  { name: "대각 간-중-곤", ends: ["gangung", "gongung"] },
];

// 사정방(감·리·진·태 = 1·9·3·7) / 사간방(간·손·곤·건 = 8·4·2·6) — 스킬5(그룹 방사) 판정용.
export const CHEONEUM_SAJEONG: string[] = ["gamgung", "rigung", "jingung", "taegung"];
export const CHEONEUM_SAGAN: string[] = ["gangung", "songung", "gongung", "geongung"];

// 지지 → 지장간 본기(本氣) 천간(한글). 음의 천음 엔진에서 지패의 대표 기운으로 쓴다.
//   자癸 축己 인甲 묘乙 진戊 사丙 오丁 미己 신庚 유辛 술戊 해壬
export const JIJANGGAN_BONGI: Record<string, string> = {
  자: "계", 축: "기", 인: "갑", 묘: "을", 진: "무", 사: "병",
  오: "정", 미: "기", 신: "경", 유: "신", 술: "무", 해: "임",
};
