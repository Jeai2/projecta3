// server/src/services/ilju.service.ts
// 일주론 서비스

import { getIljuData } from "../data/ilju.data";
import { getSajuDetails } from "./saju.service";

/**
 * 일주론 데이터를 가져옵니다
 * @param birthDate 생년월일
 * @param gender 성별
 * @param calendarType 양음력
 * @returns 일주론 데이터
 */
export async function getIljuAnalysis(
  birthDate: Date,
  gender: "M" | "W",
  // TODO: 추후 양/음력 변환 로직 연결 시 사용
  _calendarType: "solar" | "lunar"
) {
  void _calendarType;
  // 사주 데이터 가져오기 (일간, 일지 추출용)
  const sajuResult = await getSajuDetails(birthDate, gender);

  const dayGan = sajuResult.sajuData.pillars.day.gan;
  const dayJi = sajuResult.sajuData.pillars.day.ji;
  const dayGanji = `${dayGan}${dayJi}`;

  // 일주론 데이터 가져오기
  const raw = getIljuData(dayGan, dayJi);

  if (!raw) {
    throw new Error(`일주론 데이터를 찾을 수 없습니다: ${dayGanji}`);
  }

  // personality+tendency(legacy) → characteristic 통합
  const characteristic =
    raw.characteristic ||
    (raw.personality && raw.tendency
      ? `${raw.personality} ${raw.tendency}`
      : raw.personality || raw.tendency || "");

  const summary = raw.summary || characteristic;
  const traits = raw.traits || {
    base: characteristic,
    psychological: "",
    emotionPattern: "",
  };
  const careerDetail = raw.careerDetail || {
    features: raw.career || "",
    direction: "",
    recommendedJobs: "",
  };
  const spouseDetail = raw.spouseDetail || {
    male: {
      traits: raw.spouse || "",
      points: "",
    },
    female: {
      traits: raw.spouse || "",
      points: "",
    },
  };

  // 연애 성향: 없으면 spouse/characteristic 등을 기반으로 이후 확장 가능
  const loveDetail = raw.loveDetail;
  const overallSummary =
    raw.overallSummary ||
    [raw.wealth, raw.health].filter(Boolean).join(" ");

  const profileImageUrl =
    gender === "M"
      ? raw.profileImageUrlMale || raw.profileImageUrl
      : raw.profileImageUrlFemale || raw.profileImageUrl;

  const iljuData = {
    name: raw.name,
    profileImageUrl,
    summary,
    traits,
    careerDetail,
    spouseDetail,
    loveDetail,
    overallSummary,
    characteristic,
    career: raw.career,
    spouse: raw.spouse,
    wealth: raw.wealth,
    health: raw.health,
  };

  return {
    iljuData,
    dayGan,
    dayJi,
    dayGanji,
  };
}
