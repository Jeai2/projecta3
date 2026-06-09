import type { ConsultationAspect } from "../aspects/aspect.types";

export type CheoneumArcana = "sinpae" | "jinpae";
export type CheoneumPolarity = "yang" | "yin";

export type CheoneumSpreadId =
  | "ilgi"
  | "yangeui"
  | "tonggwan"
  | "cheonjiin"
  | "wonhyeongijeong"
  | "sunhwan"
  | "nakseo-gugung";

export type CheoneumOrientation = "vertical" | "horizontal" | "hidden";

export interface CheoneumCard {
  id: string;
  arcana: CheoneumArcana;
  number: number;
  name: string;
  hanja?: string;
  ganji?: string;
  image: string;
  keywords: string[];
  yangMeaning?: string;
  yinMeaning?: string;
}

export interface CheoneumPlacedCard {
  card: CheoneumCard;
  position: string;
  label: string;
  drawIndex: number;
  orientation: CheoneumOrientation;
  row?: number;
  col?: number;
}

export interface CheoneumReading {
  tool: "cheoneum";
  aspect: ConsultationAspect;
  polarity: CheoneumPolarity;
  spread: CheoneumSpreadId;
  spreadName: string;
  cards: CheoneumPlacedCard[];
  note: string;
}

export interface CheoneumDrawInput {
  aspect?: ConsultationAspect;
  spread?: CheoneumSpreadId;
}

