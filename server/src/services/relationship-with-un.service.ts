// server/src/services/relationship-with-un.service.ts
// 대운/세운과 사주팔자 간의 합형충파해 관계 계산 서비스

import { JIJI_RELATIONSHIPS } from "../data/relationship.data";
import { RelationshipResult } from "./relationship.service";
import { getAllSinsals } from "./sinsal.service.new";

/**
 * 대운과 사주팔자 간의 합형충파해 관계를 계산
 * @param sajuPillars 사주팔자 기둥들
 * @param daewoonGanji 대운 간지
 * @returns 대운과 사주팔자 간의 관계
 */
export const getDaewoonRelationships = (
  sajuPillars: { year: string; month: string; day: string; hour: string },
  daewoonGanji: string,
  gender: "M" | "W" = "M"
): { relationships: RelationshipResult; sinsal: any } => {
  const result: RelationshipResult = {
    cheonganhap: [],
    cheonganchung: [],
    yukhap: [],
    samhap: [],
    amhap: [],
    banghap: [],
    yukchung: [],
    yukhyung: [],
    yukpa: [],
    yukae: [],
  };

  // 대운 간지와 사주팔자 각 기둥과의 관계 계산
  const daewoonGan = daewoonGanji[0];
  const daewoonJi = daewoonGanji[1];

  // 사주팔자 기둥들
  const sajuPillarsList = [
    { gan: sajuPillars.year[0], ji: sajuPillars.year[1], name: "year" },
    { gan: sajuPillars.month[0], ji: sajuPillars.month[1], name: "month" },
    { gan: sajuPillars.day[0], ji: sajuPillars.day[1], name: "day" },
    { gan: sajuPillars.hour[0], ji: sajuPillars.hour[1], name: "hour" },
  ];

  // 대운 천간과 사주팔자 천간들의 관계
  sajuPillarsList.forEach((pillar) => {
    // 천간합
    if (JIJI_RELATIONSHIPS.cheonganhap[daewoonGan] === pillar.gan) {
      result.cheonganhap.push(
        `${daewoonGan}${pillar.gan}(daewoon-${pillar.name})`
      );
    }
    // 천간충
    if (JIJI_RELATIONSHIPS.cheonganchung[daewoonGan] === pillar.gan) {
      result.cheonganchung.push(
        `${daewoonGan}${pillar.gan}(daewoon-${pillar.name})`
      );
    }
  });

  // 대운 지지와 사주팔자 지지들의 관계
  sajuPillarsList.forEach((pillar) => {
    // 육합
    if (JIJI_RELATIONSHIPS.yukhap[daewoonJi] === pillar.ji) {
      result.yukhap.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 삼합
    if (JIJI_RELATIONSHIPS.samhap[daewoonJi]?.includes(pillar.ji)) {
      result.samhap.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 암합
    if (JIJI_RELATIONSHIPS.amhap[daewoonJi]?.includes(pillar.ji)) {
      result.amhap.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 방합
    if (JIJI_RELATIONSHIPS.banghap[daewoonJi]?.includes(pillar.ji)) {
      result.banghap.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 육충
    if (JIJI_RELATIONSHIPS.yukchung[daewoonJi] === pillar.ji) {
      result.yukchung.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 육형
    if (JIJI_RELATIONSHIPS.yukhyung[daewoonJi]?.includes(pillar.ji)) {
      result.yukhyung.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 육파
    if (JIJI_RELATIONSHIPS.yukpa[daewoonJi] === pillar.ji) {
      result.yukpa.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
    // 육해
    if (JIJI_RELATIONSHIPS.yukae[daewoonJi] === pillar.ji) {
      result.yukae.push(`${daewoonJi}${pillar.ji}(daewoon-${pillar.name})`);
    }
  });

  // 대운과 사주팔자 간의 신살 계산
  const sinsal = getAllSinsals(sajuPillars, gender, [
    { name: "daewoon", gan: daewoonGanji[0], ji: daewoonGanji[1] }
  ]);

  return { relationships: result, sinsal };
};

/**
 * 세운과 사주팔자+대운 간의 합형충파해 관계를 계산
 * @param sajuPillars 사주팔자 기둥들
 * @param daewoonGanji 대운 간지
 * @param sewoonGanji 세운 간지
 * @returns 세운과 사주팔자+대운 간의 관계
 */
export const getSewoonRelationships = (
  sajuPillars: { year: string; month: string; day: string; hour: string },
  daewoonGanji: string,
  sewoonGanji: string,
  gender: "M" | "W" = "M"
): { relationships: RelationshipResult; sinsal: any } => {
  const result: RelationshipResult = {
    cheonganhap: [],
    cheonganchung: [],
    yukhap: [],
    samhap: [],
    amhap: [],
    banghap: [],
    yukchung: [],
    yukhyung: [],
    yukpa: [],
    yukae: [],
  };

  // 세운 간지와 사주팔자+대운 각 기둥과의 관계 계산
  const sewoonGan = sewoonGanji[0];
  const sewoonJi = sewoonGanji[1];

  // 사주팔자+대운 기둥들
  const allPillars = [
    { gan: sajuPillars.year[0], ji: sajuPillars.year[1], name: "year" },
    { gan: sajuPillars.month[0], ji: sajuPillars.month[1], name: "month" },
    { gan: sajuPillars.day[0], ji: sajuPillars.day[1], name: "day" },
    { gan: sajuPillars.hour[0], ji: sajuPillars.hour[1], name: "hour" },
    { gan: daewoonGanji[0], ji: daewoonGanji[1], name: "daewoon" },
  ];

  // 세운 천간과 사주팔자+대운 천간들의 관계
  allPillars.forEach((pillar) => {
    // 천간합
    if (JIJI_RELATIONSHIPS.cheonganhap[sewoonGan] === pillar.gan) {
      result.cheonganhap.push(
        `${sewoonGan}${pillar.gan}(sewoon-${pillar.name})`
      );
    }
    // 천간충
    if (JIJI_RELATIONSHIPS.cheonganchung[sewoonGan] === pillar.gan) {
      result.cheonganchung.push(
        `${sewoonGan}${pillar.gan}(sewoon-${pillar.name})`
      );
    }
  });

  // 세운 지지와 사주팔자+대운 지지들의 관계
  allPillars.forEach((pillar) => {
    // 육합
    if (JIJI_RELATIONSHIPS.yukhap[sewoonJi] === pillar.ji) {
      result.yukhap.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 삼합
    if (JIJI_RELATIONSHIPS.samhap[sewoonJi]?.includes(pillar.ji)) {
      result.samhap.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 암합
    if (JIJI_RELATIONSHIPS.amhap[sewoonJi]?.includes(pillar.ji)) {
      result.amhap.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 방합
    if (JIJI_RELATIONSHIPS.banghap[sewoonJi]?.includes(pillar.ji)) {
      result.banghap.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 육충
    if (JIJI_RELATIONSHIPS.yukchung[sewoonJi] === pillar.ji) {
      result.yukchung.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 육형
    if (JIJI_RELATIONSHIPS.yukhyung[sewoonJi]?.includes(pillar.ji)) {
      result.yukhyung.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 육파
    if (JIJI_RELATIONSHIPS.yukpa[sewoonJi] === pillar.ji) {
      result.yukpa.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
    // 육해
    if (JIJI_RELATIONSHIPS.yukae[sewoonJi] === pillar.ji) {
      result.yukae.push(`${sewoonJi}${pillar.ji}(sewoon-${pillar.name})`);
    }
  });

  // 세운과 사주팔자+대운 간의 신살 계산
  const sinsal = getAllSinsals(sajuPillars, gender, [
    { name: "daewoon", gan: daewoonGanji[0], ji: daewoonGanji[1] },
    { name: "sewoon", gan: sewoonGanji[0], ji: sewoonGanji[1] }
  ]);

  return { relationships: result, sinsal };
};
