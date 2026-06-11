import { SIPSIN_TABLE } from "../data/saju.data";
import { getDayGanji } from "../services/saju.service";
import type { CheoneumCard, CheoneumReading } from "./cheoneum.types";

type GanjiPair = {
  yang: string;
  yin: string;
};

type SipsinType = "h" | "e";

const SINPAE_GANJI: Record<string, GanjiPair> = {
  "sinpae-01-cheongeuk": { yang: "기축", yin: "기미" },
  "sinpae-02-yeompa": { yang: "정사", yin: "정해" },
  "sinpae-03-myeongjeon": { yang: "병오", yin: "병자" },
  "sinpae-04-taehwa": { yang: "을묘", yin: "을유" },
  "sinpae-05-jieom": { yang: "무진", yin: "무술" },
  "sinpae-06-bowon": { yang: "갑인", yin: "갑신" },
  "sinpae-07-jaeun": { yang: "임자", yin: "임오" },
  "sinpae-08-wolyeong": { yang: "신유", yin: "신묘" },
  "sinpae-09-amnyu": { yang: "계해", yin: "계사" },
  "sinpae-10-gyeongyeon": { yang: "기미", yin: "기축" },
  "sinpae-11-hwaldo": { yang: "경신", yin: "경인" },
  "sinpae-12-taeheo": { yang: "무술", yin: "무진" },
};

const HANGUL_TO_HANJA: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신지: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

const BRANCH_HANGUL_TO_HANJA: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

function toHanjaGanji(hangulGanji: string): string {
  const gan = hangulGanji[0];
  const ji = hangulGanji[1];
  return `${HANGUL_TO_HANJA[gan] ?? gan}${BRANCH_HANGUL_TO_HANJA[ji] ?? ji}`;
}

function calcSipsin(dayGan: string, target: string, type: SipsinType): string | null {
  const tableForType = SIPSIN_TABLE[type] as Record<string, Record<string, string>>;
  return tableForType[dayGan]?.[target] ?? null;
}

function getSinpaeGanji(card: CheoneumCard, polarity: CheoneumReading["polarity"]): string | null {
  if (card.arcana !== "sinpae") return card.ganji ?? null;

  const pair = SINPAE_GANJI[card.id];
  if (!pair) return null;

  return polarity === "yin" ? pair.yin : pair.yang;
}

export function buildCheoneumDivinationInsight(
  reading: CheoneumReading,
  referenceDate = new Date(),
): string | null {
  const ilju = getDayGanji(referenceDate);
  const dayGan = ilju[0];
  const dayJi = ilju[1];

  const lines = reading.cards
    .map((placed) => {
      const activeGanjiHangul = getSinpaeGanji(placed.card, reading.polarity);
      if (!activeGanjiHangul) return null;

      const activeGanji = toHanjaGanji(activeGanjiHangul);
      const activeGan = activeGanji[0];
      const activeJi = activeGanji[1];
      const activeGanSipsin = calcSipsin(dayGan, activeGan, "h");
      const activeJiSipsin = calcSipsin(dayGan, activeJi, "e");
      const dayJiSipsin = calcSipsin(dayGan, dayJi, "e");

      return `- ${placed.card.name}(${placed.card.hanja ?? placed.card.name}) / ${placed.label}: ${reading.polarity === "yang" ? "양" : "음"}의 간지 ${activeGanjiHangul}(${activeGanji}) + 점사일 ${ilju}
  · 일간 ${dayGan} 기준 ${activeGan} = ${activeGanSipsin ?? "미정"}
  · 일간 ${dayGan} 기준 ${activeJi} = ${activeJiSipsin ?? "미정"}
  · 일간 ${dayGan} 기준 점사일 일지 ${dayJi} = ${dayJiSipsin ?? "미정"}`;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");

  if (!lines) return null;

  return `[천음 점사 계산]
- 점사일 일주: ${ilju}
- 해석 기준: 점사일의 천간 ${dayGan}
- 운용: ${reading.polarity === "yang" ? "양의 천음" : "음의 천음"}
- 계산식: ${reading.polarity === "yang" ? "천음 양간지 + 점사일 일주" : "천음 음간지 + 점사일 일주"}
${lines}

[해석 골격 지침]
- 위 십성 결과를 이번 카드 해석의 1차 근거로 삼는다.
- 카드명만으로 상징을 창작하지 말고, 십성 조합과 사용자의 질문을 먼저 연결한다.
- 점사일 일주와 천음 간지는 내부 계산값이므로 사용자에게 길게 나열하지 않는다.
- 필요하면 십성 이름은 자연스럽게 풀어 말하되, 계산표처럼 설명하지 않는다.`;
}
