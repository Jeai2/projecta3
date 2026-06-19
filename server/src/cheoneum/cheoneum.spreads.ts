import type { CheoneumArcana, CheoneumOrientation, CheoneumPolarity, CheoneumSpreadId } from "./cheoneum.types";
import { CHEONEUM_GUGUNG, CHEONEUM_NAKSEO_CHIMRO } from "./cheoneum-nakseo.data";

export interface CheoneumPositionRule {
  position: string;
  label: string;
  arcana: CheoneumArcana;
  orientation: CheoneumOrientation;
  row?: number;
  col?: number;
}

export interface CheoneumSpreadDefinition {
  id: CheoneumSpreadId;
  name: string;
  positions: CheoneumPositionRule[];
}

function jinpae(position: string, label: string, orientation: CheoneumOrientation = "vertical", row?: number, col?: number): CheoneumPositionRule {
  return { position, label, arcana: "jinpae", orientation, row, col };
}

function sinpae(position: string, label: string, orientation: CheoneumOrientation = "vertical", row?: number, col?: number): CheoneumPositionRule {
  return { position, label, arcana: "sinpae", orientation, row, col };
}

export function getCheoneumPolarityForAspect(aspect: "hwaseon" | "hwayeong"): CheoneumPolarity {
  return aspect === "hwayeong" ? "yin" : "yang";
}

export function getCheoneumSpreadDefinition(
  spread: CheoneumSpreadId,
  polarity: CheoneumPolarity,
): CheoneumSpreadDefinition {
  switch (spread) {
    case "ilgi":
      return {
        id: spread,
        name: "일기",
        positions: [sinpae("one-energy", "한 기운")],
      };
    case "yangeui":
      return {
        id: spread,
        name: "양의",
        positions:
          polarity === "yin"
            ? [jinpae("right-yang", "오른쪽/양"), jinpae("left-yin", "왼쪽/음")]
            : [jinpae("left-yin", "왼쪽/음"), jinpae("right-yang", "오른쪽/양")],
      };
    case "tonggwan":
      return {
        id: spread,
        name: "통관",
        positions: [
          jinpae("subject-a", "주체 A"),
          jinpae("subject-b", "주체 B"),
          sinpae("tonggwan-key", "통관패", "horizontal"),
        ],
      };
    case "cheonjiin":
      return {
        id: spread,
        name: "천지인",
        positions:
          polarity === "yin"
            ? [sinpae("top-earth", "위/지"), jinpae("middle-human", "중간/인"), sinpae("bottom-heaven", "아래/천")]
            : [sinpae("top-heaven", "위/천"), jinpae("middle-human", "중간/인"), sinpae("bottom-earth", "아래/지")],
      };
    case "wonhyeongijeong":
      return {
        id: spread,
        name: "원형이정",
        positions:
          polarity === "yin"
            ? [
                jinpae("jeong", "정"),
                jinpae("i", "이"),
                jinpae("hyeong", "형"),
                jinpae("won", "원"),
                sinpae("hidden-under-won", "원 아래 신패", "hidden"),
              ]
            : [
                jinpae("won", "원"),
                jinpae("hyeong", "형"),
                jinpae("i", "이"),
                jinpae("jeong", "정"),
                sinpae("hidden-under-jeong", "정 아래 신패", "hidden"),
              ],
      };
    case "sunhwan":
      return {
        id: spread,
        name: "순환",
        positions:
          polarity === "yin"
            ? [
                sinpae("center", "중앙"),
                jinpae("north", "북"),
                jinpae("east", "동"),
                jinpae("south", "남"),
                jinpae("west", "서"),
              ]
            : [
                jinpae("center", "중앙"),
                sinpae("north", "북"),
                sinpae("east", "동"),
                sinpae("south", "남"),
                sinpae("west", "서"),
              ],
      };
    case "nakseo-gugung": {
      // 침로(針路): 중궁(신패) → 낙서수 6→7→8→9→1→2→3→4 순. 배치 좌표는 낙서 마방진(궁 스펙).
      // 운용(양/음)은 배치를 바꾸지 않는다 — 운기 엔진(cheoneum-nakseo-engine)에서 양/음을 가른다.
      return {
        id: spread,
        name: "낙서구궁",
        positions: CHEONEUM_NAKSEO_CHIMRO.map((key) => {
          const g = CHEONEUM_GUGUNG[key];
          const place = g.key === "junggung" ? sinpae : jinpae;
          return place(g.key, g.name, "vertical", g.row, g.col);
        }),
      };
    }
    default: {
      const exhaustive: never = spread;
      throw new Error(`지원하지 않는 천음 스프레드입니다: ${exhaustive}`);
    }
  }
}

