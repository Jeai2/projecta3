/**
 * 육임정단 해석 — 이별 / 재회
 *
 * 방재이 스승님 실전 해석 flow 기반.
 * 문서 전달 후 내용 채울 예정.
 */

import type { Sagwa, Samjeon, CheonjibandoPair } from "../../services/lukim.service";

export interface BreakupInterpretationInput {
  sagwa: Sagwa;
  samjeon: Samjeon;
  cheonjibando: CheonjibandoPair[];
  ilgan: string;
  ilji: string;
  gender: "M" | "W";
}

export interface BreakupInterpretationResult {
  // TODO: 문서 전달 후 채움
}

export function interpretBreakup(_input: BreakupInterpretationInput): BreakupInterpretationResult {
  // TODO: 문서 전달 후 구현
  return {};
}
