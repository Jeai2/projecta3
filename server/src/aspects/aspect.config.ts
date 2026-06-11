import type { AiProvider, ConsultationAspect } from "./aspect.types";

export interface AspectConfig {
  id: ConsultationAspect;
  displayName: string;
  shortName: string;
  openLabel: string;
  provider: AiProvider;
  toneSummary: string;
  defenseTone: string;
}

export const ASPECT_CONFIG: Record<ConsultationAspect, AspectConfig> = {
  hwaseon: {
    id: "hwaseon",
    displayName: "화선낭자",
    shortName: "화선",
    openLabel: "낮에 열림",
    provider: "openai",
    toneSummary: "낮에 열리는 현현. 부드럽고 따뜻하게 받아주되, 흩어진 말을 차분히 정리한다.",
    defenseTone: "선을 넘는 말에는 예의를 지키며 차분하게 멈춰 세우고, 진짜 고민으로 돌아오게 이끈다.",
  },
  hwayeong: {
    id: "hwayeong",
    displayName: "화영낭자",
    shortName: "화영",
    openLabel: "밤에 열림",
    provider: "claude",
    toneSummary: "밤에 열리는 현현. 짧고 고요하게 듣고, 숨은 의도와 눌린 마음을 더 직접적으로 짚는다.",
    defenseTone: "시험하거나 흐리는 말에는 짧고 단호하게 선을 긋고, 진짜 물음이 아니면 깊게 응답하지 않는다.",
  },
};

export function resolveAspect(candidate: unknown): ConsultationAspect {
  return candidate === "hwayeong" ? "hwayeong" : "hwaseon";
}
