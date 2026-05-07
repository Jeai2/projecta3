// server/src/logic/rule-engine.ts
import {
  DAY_GAN_CHARACTER,
  DayGanDefinition,
} from "../data/interpretation/dgan-character"; //✅ 일간 기본 해석 //
import { SIPSIN_INTERPRETATION } from "../data/interpretation/sipsin";
import {
  DAY_PILLAR_DATA,
  DayPillarContent,
} from "../data/interpretation/day-pillar-data";
import { SIBIUNSEONG_INTERPRETATION } from "../data/interpretation/sibiunseong"; //✅ 십이운성 해석 //
import { SINSAL_INTERPRETATION } from "../data/interpretation/sinsal"; //✅ 신살 //
import type {
  SajuData,
  StarData,
  StarElement,
} from "../types/saju.d";
import { SinsalHit } from "../services/sinsal.service.new";
import { COMBINATION_INTERPRETATION } from "../data/interpretation/custom"; // ✅ 1. 조합 해석 데이터 import
import { NapeumResult } from "../hwa-eui/data/hwa-eui.data";
import { LANDSCAPE_PHRASES } from "../hwa-eui/data/landscape-phrases.data";

/**
 * 규칙 1: 일간(Day Master) 데이터를 기반으로 '기본 해석'과 '심화 해석'을 모두 반환합니다.
 */
export const interpretDayGan = (
  dayGan: string
): { base: string; custom: string } => {
  const dayGanInfo = DAY_GAN_CHARACTER[dayGan] as DayGanDefinition | undefined;

  if (!dayGanInfo) {
    return {
      base: "해당 일간에 대한 기본 해석을 찾을 수 없습니다.",
      custom: "해당 일간에 대한 심화 해석이 없습니다.",
    };
  }

  return {
    base: dayGanInfo.summary,
    custom: dayGanInfo.personality.description,
  };
};

/**
 * ★★★★★ 새로운 십성 해석 규칙 함수 ★★★★★
 * 규칙 2: 사주 원국에 드러난 십성들의 특징을 종합하여 설명합니다.
 * @param sipsinData 사주 원국의 십성 데이터 객체
 * @returns 십성 종합 분석 텍스트
 */
export const interpretSipsinPresence = (
  sipsinData: SajuData["sipsin"]
): string => {
  const pillarNames: { [key: string]: string } = {
    year: "연주(년주)",
    month: "월주",
    day: "일주",
    hour: "시주",
  };

  const ganjiNames: { [key: string]: string } = {
    gan: "천간",
    ji: "지지",
  };

  const foundSipsin: string[] = [];

  // 사주 원국 전체를 순회하며 십성을 찾습니다.
  for (const pillar of Object.keys(pillarNames)) {
    for (const ganji of Object.keys(ganjiNames)) {
      const sipsinName =
        sipsinData[pillar as keyof typeof sipsinData]?.[
          ganji as keyof typeof sipsinData.year
        ];

      // 십성 이름이 존재하고, 그에 대한 해석이 SIPSIN_INTERPRETATION에 있을 경우
      if (sipsinName && SIPSIN_INTERPRETATION[sipsinName]) {
        const description = `${pillarNames[pillar]} ${ganjiNames[ganji]}에서 \`${sipsinName}\`의 특징을 보입니다. 이는 ${SIPSIN_INTERPRETATION[sipsinName]}`;
        foundSipsin.push(description);
      }
    }
  }

  if (foundSipsin.length === 0) {
    return "사주 원국에서 특별히 드러나는 십성의 특징은 발견되지 않았습니다.";
  }

  // 찾은 십성 해석들을 하나의 문단으로 합칩니다.
  return foundSipsin.join("\n\n"); // 각 해석 사이에 한 줄을 띄워 가독성을 높입니다.
};

// ✅ 2. 여기에 새로운 십이운성 해석 규칙 함수를 추가합니다.
/**
 * 규칙 3: 사주 원국의 각 지지에 있는 십이운성의 기운을 설명합니다.
 * @param sibiwunseongData 사주 원국의 십이운성 데이터 객체
 * @returns 십이운성 종합 분석 텍스트
 */
export const interpretSibiwunseong = (
  sibiwunseongData: SajuData["sibiwunseong"]
): string => {
  const pillarNames: { [key: string]: string } = {
    year: "연지(초년운)",
    month: "월지(청년운)",
    day: "일지(장년운)",
    hour: "시지(말년운)",
  };

  const foundSibiwunseong: string[] = [];

  for (const pillar of Object.keys(pillarNames)) {
    const key = pillar as keyof typeof sibiwunseongData;
    const unseongName = sibiwunseongData[key];

    if (unseongName && SIBIUNSEONG_INTERPRETATION[unseongName]) {
      const description = `${pillarNames[key]}에서 \`${unseongName}\`의 기운을 보입니다. 이는 ${SIBIUNSEONG_INTERPRETATION[unseongName]}`;
      foundSibiwunseong.push(description);
    }
  }

  if (foundSibiwunseong.length === 0) {
    return "사주 원국에서 특별히 드러나는 십이운성의 기운은 발견되지 않았습니다.";
  }

  return foundSibiwunseong.join("\n\n");
};

// ✅ [전면 수정] interpretSinsal 함수를 아래 내용으로 교체합니다.
/**
 * 사주 데이터에서 모든 신살(길신, 흉살)을 찾아 구조화된 배열로 반환합니다.
 * @param sajuData 전체 사주 데이터
 * @returns StarData 객체의 배열
 */
export const interpretSinsal = (
  sinsalObject: SajuData["sinsal"]
): StarData[] => {
  // 기존 서비스의 SinsalHit를 새로운 형식으로 변환 (category 필드 추가)
  const convertToNewSinsalHit = (oldHit: {
    name: string;
    elements: StarElement[];
  }): SinsalHit => ({
    name: oldHit.name,
    elements: oldHit.elements,
    category: "neutral", // 기본값으로 neutral 설정
  });

  const allSinsalHits: SinsalHit[] = [
    ...sinsalObject.year.map(convertToNewSinsalHit),
    ...sinsalObject.month.map(convertToNewSinsalHit),
    ...sinsalObject.day.map(convertToNewSinsalHit),
    ...sinsalObject.hour.map(convertToNewSinsalHit),
  ];

  const uniqueSinsalMap = new Map<string, SinsalHit>();
  allSinsalHits.forEach((hit) => {
    if (!uniqueSinsalMap.has(hit.name)) {
      uniqueSinsalMap.set(hit.name, hit);
    }
  });

  const starDataArray: StarData[] = [];

  uniqueSinsalMap.forEach((hit) => {
    console.log(
      `[디버깅] 이름: "${hit.name}" | 해석 데이터에서 찾기:`,
      SINSAL_INTERPRETATION[hit.name] ? "✅ 성공" : "❌ 실패"
    );

    const definition = SINSAL_INTERPRETATION[hit.name];
    if (!definition) return;

    starDataArray.push({
      name: definition.name,
      type: definition.type,
      description: definition.description,
      details: definition.details,
      elements: hit.elements,
      illustration: `/images/illustrations/placeholder.png`,
    });
  });

  return starDataArray;
};

/**
 * 규칙 5: 여러 사주 데이터를 조합하여 특별한 의미를 해석합니다.
 * @param sajuData 전체 사주 데이터 객체
 * @returns 조합 해석 텍스트 배열
 */
export const interpretCombinations = (sajuData: SajuData): string[] => {
  const foundInterpretations: string[] = [];

  // ✅ [수정] 새로운 객체 구조에 맞게 .gan과 .ji를 사용하여 접근합니다.
  // 규칙 #001: 신(辛)일간이 술(戌)월에 태어났고, 월지가 정인일 경우
  if (
    sajuData.pillars.day.gan === "辛" && // 조건 1: 일간이 辛
    sajuData.pillars.month.ji === "戌" && // 조건 2: 월지가 戌
    sajuData.sipsin.month.ji === "정인" // 조건 3: 월지 십성이 정인
  ) {
    foundInterpretations.push(COMBINATION_INTERPRETATION["001"]);
  }

  // 앞으로 여기에 if 문으로 새로운 규칙들을 계속 추가하게 됩니다.
  // if (조건) { foundInterpretations.push(COMBINATION_INTERPRETATION['002']); }

  return foundInterpretations;
};

// ★★★★★ 새로운 '풍경 묘사 프롬프트' 생성 함수를 추가합니다. ★★★★★
/**
 * 화의론(畵意論)의 기반이 되는 풍경 묘사 프롬프트를 생성합니다.
 * @param napeumData 사주 네 기둥의 납음오행 데이터 객체
 * @returns 조합된 최종 프롬프트 텍스트
 */
export const createLandscapePrompt = (napeumData: NapeumResult): string => {
  const phrases: string[] = [];

  // 각 기둥의 납음오행에 해당하는 묘사 문장을 찾아 배열에 추가합니다.
  if (napeumData.year && LANDSCAPE_PHRASES[napeumData.year.name]) {
    phrases.push(LANDSCAPE_PHRASES[napeumData.year.name]);
  }
  if (napeumData.month && LANDSCAPE_PHRASES[napeumData.month.name]) {
    phrases.push(LANDSCAPE_PHRASES[napeumData.month.name]);
  }
  if (napeumData.day && LANDSCAPE_PHRASES[napeumData.day.name]) {
    phrases.push(LANDSCAPE_PHRASES[napeumData.day.name]);
  }
  if (napeumData.hour && LANDSCAPE_PHRASES[napeumData.hour.name]) {
    phrases.push(LANDSCAPE_PHRASES[napeumData.hour.name]);
  }

  if (phrases.length === 0) {
    return "이 사주의 고유한 풍경을 그리기 위한 정보가 부족합니다.";
  }

  // 최종 프롬프트: 기본 묘사 + 조합된 문장들 + 스타일 가이드
  const basePrompt =
    "A deep, sacred, and sublime landscape painting in a mystical oriental fantasy style. cinematic lighting, epic scale. ";
  const combinedPhrases = phrases.join(" ");

  return basePrompt + combinedPhrases;
};

// ✅ [추가] '일간 상세 성품'을 해석하는 새로운 함수를 추가합니다. ///중요 추가
export const interpretDayMasterCharacter = (dayGan: string): string => {
  const dayGanInfo = DAY_GAN_CHARACTER[dayGan] as DayGanDefinition | undefined;

  if (!dayGanInfo) {
    return "해당 일간에 대한 상세 성품 정보를 찾을 수 없습니다.";
  }

  return dayGanInfo.personality.description;
};

/**
 * [신규] 규칙 7: 일주론 데이터를 조회합니다. (정적 데이터 조회 방식)
 * @param sajuData 사용자의 전체 사주 데이터
 * @returns DayPillarContent 객체 또는 null
 */
export const interpretDayPillar = (
  sajuData: SajuData
): DayPillarContent | null => {
  const dayPillarKey = sajuData.pillars.day.gan + sajuData.pillars.day.ji; // "갑자" 등 키 생성
  const interpretation = DAY_PILLAR_DATA[dayPillarKey];
  return interpretation || null;
};
