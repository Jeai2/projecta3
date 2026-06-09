import { randomInt } from "crypto";
import { CHEONEUM_JINPAE_CARDS, CHEONEUM_SINPAE_CARDS } from "./cheoneum.cards";
import { getCheoneumPolarityForAspect, getCheoneumSpreadDefinition } from "./cheoneum.spreads";
import type {
  CheoneumCard,
  CheoneumDrawInput,
  CheoneumPlacedCard,
  CheoneumReading,
  CheoneumSpreadId,
} from "./cheoneum.types";
import { resolveAspect } from "../aspects/aspect.config";

const DEFAULT_SPREAD: CheoneumSpreadId = "ilgi";

function drawUniqueCards(pool: CheoneumCard[], count: number): CheoneumCard[] {
  if (count > pool.length) {
    throw new Error(`카드 풀이 부족합니다. requested=${count}, available=${pool.length}`);
  }

  const remaining = [...pool];
  const picked: CheoneumCard[] = [];

  for (let i = 0; i < count; i += 1) {
    const index = randomInt(remaining.length);
    const [card] = remaining.splice(index, 1);
    picked.push(card);
  }

  return picked;
}

function getPool(arcana: "sinpae" | "jinpae"): CheoneumCard[] {
  return arcana === "sinpae" ? CHEONEUM_SINPAE_CARDS : CHEONEUM_JINPAE_CARDS;
}

function normalizeSpread(candidate: unknown): CheoneumSpreadId {
  const allowed: CheoneumSpreadId[] = [
    "ilgi",
    "yangeui",
    "tonggwan",
    "cheonjiin",
    "wonhyeongijeong",
    "sunhwan",
    "nakseo-gugung",
  ];

  return allowed.includes(candidate as CheoneumSpreadId)
    ? (candidate as CheoneumSpreadId)
    : DEFAULT_SPREAD;
}

export function createCheoneumReading(input: CheoneumDrawInput = {}): CheoneumReading {
  const aspect = resolveAspect(input.aspect);
  const polarity = getCheoneumPolarityForAspect(aspect);
  const spread = normalizeSpread(input.spread);
  const definition = getCheoneumSpreadDefinition(spread, polarity);

  const sinpaeDraws = drawUniqueCards(
    CHEONEUM_SINPAE_CARDS,
    definition.positions.filter((position) => position.arcana === "sinpae").length,
  );
  const jinpaeDraws = drawUniqueCards(
    CHEONEUM_JINPAE_CARDS,
    definition.positions.filter((position) => position.arcana === "jinpae").length,
  );

  const drawIndexes = { sinpae: 0, jinpae: 0 };
  const cards: CheoneumPlacedCard[] = definition.positions.map((position, index) => {
    const card =
      position.arcana === "sinpae"
        ? sinpaeDraws[drawIndexes.sinpae++]
        : jinpaeDraws[drawIndexes.jinpae++];

    return {
      card,
      position: position.position,
      label: position.label,
      drawIndex: index + 1,
      orientation: position.orientation,
      row: position.row,
      col: position.col,
    };
  });

  return {
    tool: "cheoneum",
    aspect,
    polarity,
    spread,
    spreadName: definition.name,
    cards,
    note: "카드 배치 결과입니다. 카드 상세 해석과 이미지 연결은 후속 단계입니다.",
  };
}

export function getCheoneumCardCounts(): { sinpae: number; jinpae: number; total: number } {
  return {
    sinpae: getPool("sinpae").length,
    jinpae: getPool("jinpae").length,
    total: CHEONEUM_SINPAE_CARDS.length + CHEONEUM_JINPAE_CARDS.length,
  };
}
