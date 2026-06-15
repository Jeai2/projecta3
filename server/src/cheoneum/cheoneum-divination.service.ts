import { GAN, JI, SIPSIN_TABLE } from "../data/saju.data";
import { getDayGanji } from "../services/saju.service";
import type { CheoneumCard, CheoneumReading } from "./cheoneum.types";
import {
  getIlgiSipsinPairKey,
  ILGI_BRANCH_DAY_BRANCH_PAIR_INTERPRETATION,
  ILGI_CHEONEUM_GAN_SIPSIN_INTERPRETATION,
  ILGI_INTERPRETATION_FLOW,
  SIPSIN_NAMES,
  type SipsinName,
} from "./cheoneum-ilgi-interpretation.logic";

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

function toSipsinName(value: string | null): SipsinName | null {
  if (!value) return null;
  return (SIPSIN_NAMES as readonly string[]).includes(value) ? (value as SipsinName) : null;
}

function buildIlgiInterpretationGuide(input: {
  activeGanSipsin: string | null;
  activeJiSipsin: string | null;
  compareJiSipsin: string | null;
  pairLabel: string;
}): string | null {
  const activeGanSipsin = toSipsinName(input.activeGanSipsin);
  const activeJiSipsin = toSipsinName(input.activeJiSipsin);
  const compareJiSipsin = toSipsinName(input.compareJiSipsin);

  if (!activeGanSipsin && (!activeJiSipsin || !compareJiSipsin)) return null;

  const ganInterpretation = activeGanSipsin
    ? ILGI_CHEONEUM_GAN_SIPSIN_INTERPRETATION[activeGanSipsin]
    : null;
  const pairKey =
    activeJiSipsin && compareJiSipsin ? getIlgiSipsinPairKey(activeJiSipsin, compareJiSipsin) : null;
  const pairInterpretation = pairKey ? ILGI_BRANCH_DAY_BRANCH_PAIR_INTERPRETATION[pairKey] : null;

  return [
    ganInterpretation
      ? `  · 천음 천간 해석(${activeGanSipsin}): ${ganInterpretation}`
      : null,
    pairKey && pairInterpretation
      ? `  · ${input.pairLabel} 조합(${pairKey}): ${pairInterpretation}`
      : pairKey
        ? `  · ${input.pairLabel} 조합(${pairKey}): 해석 미작성`
        : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function getDivinationHourGanji(referenceDate: Date, dayGan: string): string {
  const hour = referenceDate.getHours();
  const min = referenceDate.getMinutes();
  const totalMinutes = hour * 60 + min;
  const adjustedMinutes = (totalMinutes + 30) % 1440;
  const hourJiIndex = Math.floor(adjustedMinutes / 120);
  const hourJi = JI[hourJiIndex];

  const dayGanIndex = GAN.indexOf(dayGan);
  const startGanIndex = [0, 5].includes(dayGanIndex)
    ? 0
    : [1, 6].includes(dayGanIndex)
      ? 2
      : [2, 7].includes(dayGanIndex)
        ? 4
        : [3, 8].includes(dayGanIndex)
          ? 6
          : 8;

  const hourGan = GAN[(startGanIndex + hourJiIndex) % 10];
  return hourGan + hourJi;
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
  const divinationHourGanji = getDivinationHourGanji(referenceDate, dayGan);
  const hourJi = divinationHourGanji[1];

  const lines = reading.cards
    .map((placed) => {
      const activeGanjiHangul = getSinpaeGanji(placed.card, reading.polarity);
      if (!activeGanjiHangul) return null;

      const activeGanji = toHanjaGanji(activeGanjiHangul);
      const activeGan = activeGanji[0];
      const activeJi = activeGanji[1];
      const isYangeui = reading.spread === "yangeui";
      const isYangeuiRight = reading.spread === "yangeui" && placed.position === "right-yang";
      const activeGanSipsin = calcSipsin(dayGan, activeGan, "h");
      const activeJiSipsin = calcSipsin(dayGan, activeJi, "e");
      const dayJiSipsin = calcSipsin(dayGan, dayJi, "e");
      const ilgiGuide =
        reading.spread === "ilgi"
          ? buildIlgiInterpretationGuide({
              activeGanSipsin,
              activeJiSipsin,
              compareJiSipsin: dayJiSipsin,
              pairLabel: "천음 지지-점사일 일지",
            })
          : null;
      const yangeuiGuide =
        isYangeui
          ? (() => {
              const compareJi = hourJi;
              const compareGanji = divinationHourGanji;
              const compareLabel = "점사시간 지지";
              const yangeuiGanSipsin = calcSipsin(activeGan, activeGan, "h");
              const yangeuiJiSipsin = calcSipsin(activeGan, activeJi, "e");
              const compareJiSipsin = calcSipsin(activeGan, compareJi, "e");
              const guide = buildIlgiInterpretationGuide({
                activeGanSipsin: yangeuiGanSipsin,
                activeJiSipsin: yangeuiJiSipsin,
                compareJiSipsin,
                pairLabel: `천음 지지-${compareLabel}`,
              });
              const guideTitle = isYangeuiRight
                ? "양의 오른쪽 패 천간-점사시간 기준"
                : "양의 왼쪽 패 천간-점사시간 기준";

              return `- ${placed.card.name}(${placed.card.hanja ?? placed.card.name}) / ${placed.label}: ${reading.polarity === "yang" ? "양" : "음"}의 간지 ${activeGanjiHangul}(${activeGanji}) + 점사시간 ${compareGanji}
  · [${guideTitle}]
  · 해석 기준: 패의 천간 ${activeGan}를 이 흐름의 일간/나로 둠
  · 패 천간 ${activeGan} 기준 ${activeGan} = ${yangeuiGanSipsin ?? "미정"}
  · 패 천간 ${activeGan} 기준 패 지지 ${activeJi} = ${yangeuiJiSipsin ?? "미정"}
  · 패 천간 ${activeGan} 기준 ${compareLabel} ${compareJi} = ${compareJiSipsin ?? "미정"}${guide ? `\n${guide}` : ""}`;
            })()
          : null;

      if (yangeuiGuide) return yangeuiGuide;

      return `- ${placed.card.name}(${placed.card.hanja ?? placed.card.name}) / ${placed.label}: ${reading.polarity === "yang" ? "양" : "음"}의 간지 ${activeGanjiHangul}(${activeGanji}) + 점사일 ${ilju}
  · 일간 ${dayGan} 기준 ${activeGan} = ${activeGanSipsin ?? "미정"}
  · 일간 ${dayGan} 기준 ${activeJi} = ${activeJiSipsin ?? "미정"}
  · 일간 ${dayGan} 기준 점사일 일지 ${dayJi} = ${dayJiSipsin ?? "미정"}${ilgiGuide ? `\n${ilgiGuide}` : ""}`;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");

  if (!lines) return null;

  return `[천음 점사 계산]
- 점사일 일주: ${ilju}
- 점사시간 시주: ${divinationHourGanji}
- 해석 기준: 점사일의 천간 ${dayGan}
${reading.spread === "yangeui" ? `- 양의 해석 기준: 각 패의 천간을 해당 흐름의 일간/나로 둔다. 왼쪽과 오른쪽 모두 각 패 지지를 점사시간 지지와 비교한다.` : ""}
- 운용: ${reading.polarity === "yang" ? "양의 천음" : "음의 천음"}
- 계산식: ${reading.polarity === "yang" ? "천음 양간지 + 점사일 일주" : "천음 음간지 + 점사일 일주"}
${reading.spread === "ilgi" ? `- 일기 해석 흐름: ${ILGI_INTERPRETATION_FLOW.join(" -> ")}` : ""}
${lines}

[해석 골격 지침]
- 위 십성 결과를 이번 카드 해석의 1차 근거로 삼는다.
- 카드명만으로 상징을 창작하지 말고, 십성 조합과 사용자의 질문을 먼저 연결한다.
- 점사일 일주와 천음 간지는 내부 계산값이므로 사용자에게 길게 나열하지 않는다.
- 필요하면 십성 이름은 자연스럽게 풀어 말하되, 계산표처럼 설명하지 않는다.`;
}
