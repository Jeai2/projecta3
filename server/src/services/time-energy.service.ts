// server/src/services/time-energy.service.ts
// 시간 에너지 기반 길흉 판단 서비스

// 시간대별 에너지 특성
export interface TimeEnergyProfile {
  period: string; // 시간대 (새벽, 오전, 오후, 저녁, 밤)
  energy: "양" | "음"; // 기본 에너지
  intensity: number; // 에너지 강도 (1-10)
  characteristics: string[]; // 시간대 특성
  favorableFor: string[]; // 유리한 활동
  unfavorableFor: string[]; // 불리한 활동
}

// 시간대별 에너지 데이터
const TIME_ENERGY_DATA: Record<string, TimeEnergyProfile> = {
  새벽: {
    period: "새벽",
    energy: "음",
    intensity: 3,
    characteristics: ["고요함", "명상적", "직관력", "내적 성찰"],
    favorableFor: ["명상", "계획 수립", "창작", "학습"],
    unfavorableFor: ["중요한 결정", "사교 활동", "계약"],
  },
  오전: {
    period: "오전",
    energy: "양",
    intensity: 8,
    characteristics: ["활력", "집중력", "추진력", "새로운 시작"],
    favorableFor: ["업무 시작", "중요한 미팅", "새 프로젝트", "운동"],
    unfavorableFor: ["휴식", "감정적 대화"],
  },
  오후: {
    period: "오후",
    energy: "양",
    intensity: 6,
    characteristics: ["안정성", "지속력", "협력", "소통"],
    favorableFor: ["팀워크", "협상", "사교 활동", "네트워킹"],
    unfavorableFor: ["혼자 하는 작업", "깊은 사고"],
  },
  저녁: {
    period: "저녁",
    energy: "음",
    intensity: 5,
    characteristics: ["온화함", "포용력", "감성", "화합"],
    favorableFor: ["가족 시간", "인간관계", "예술 활동", "휴식"],
    unfavorableFor: ["격렬한 운동", "논쟁", "스트레스 상황"],
  },
  밤: {
    period: "밤",
    energy: "음",
    intensity: 2,
    characteristics: ["수렴", "정리", "마무리", "휴식"],
    favorableFor: ["정리", "마무리 작업", "수면", "회복"],
    unfavorableFor: ["새로운 시작", "중요한 결정", "활발한 활동"],
  },
};

// 계절별 에너지 보정
const SEASONAL_ENERGY_MODIFIER: Record<number, number> = {
  12: 0.8,
  1: 0.8,
  2: 0.9, // 겨울 (수렴)
  3: 1.2,
  4: 1.3,
  5: 1.2, // 봄 (발산)
  6: 1.1,
  7: 1.0,
  8: 0.9, // 여름 (안정)
  9: 0.9,
  10: 0.8,
  11: 0.8, // 가을 (수렴)
};

// 요일별 에너지 보정
const WEEKDAY_ENERGY_MODIFIER: Record<number, number> = {
  1: 1.2, // 월요일 (시작)
  2: 1.1, // 화요일 (추진)
  3: 1.0, // 수요일 (중립)
  4: 0.9, // 목요일 (안정)
  5: 0.8, // 금요일 (마무리)
  6: 0.7, // 토요일 (휴식)
  0: 0.6, // 일요일 (회복)
};

/**
 * 현재 시간의 에너지 프로필을 분석합니다
 */
export function analyzeTimeEnergy(currentTime: Date): TimeEnergyProfile & {
  adjustedIntensity: number;
  seasonalFactor: number;
  weekdayFactor: number;
  overallScore: number;
} {
  const hour = currentTime.getHours();
  const month = currentTime.getMonth() + 1;
  const weekday = currentTime.getDay();

  // 시간대 결정
  let period: string;
  if (hour >= 4 && hour < 9) period = "새벽";
  else if (hour >= 9 && hour < 12) period = "오전";
  else if (hour >= 12 && hour < 18) period = "오후";
  else if (hour >= 18 && hour < 22) period = "저녁";
  else period = "밤";

  const baseProfile = TIME_ENERGY_DATA[period];
  const seasonalFactor = SEASONAL_ENERGY_MODIFIER[month];
  const weekdayFactor = WEEKDAY_ENERGY_MODIFIER[weekday];

  // 보정된 에너지 강도 계산
  const adjustedIntensity =
    baseProfile.intensity * seasonalFactor * weekdayFactor;

  // 전체 점수 (1-100)
  const overallScore = Math.round((adjustedIntensity / 10) * 100);

  return {
    ...baseProfile,
    adjustedIntensity,
    seasonalFactor,
    weekdayFactor,
    overallScore,
  };
}

/**
 * 시간 에너지와 사용자 특성의 조화도를 분석합니다
 */
export function analyzeTimeCompatibility(
  timeEnergy: ReturnType<typeof analyzeTimeEnergy>,
  userDayGan: string
): {
  harmonyScore: number; // 조화 점수 (-20 ~ +20)
  energyMatch: "조화" | "중립" | "충돌";
  recommendations: string[];
  warnings: string[];
} {
  // 일간별 선호 시간대 (간단한 매핑)
  const GAN_TIME_PREFERENCE: Record<
    string,
    {
      favoredPeriods: string[];
      favoredEnergy: "양" | "음";
      baseScore: number;
    }
  > = {
    갑: { favoredPeriods: ["새벽", "오전"], favoredEnergy: "양", baseScore: 5 },
    을: { favoredPeriods: ["오후", "저녁"], favoredEnergy: "음", baseScore: 3 },
    병: { favoredPeriods: ["오전", "오후"], favoredEnergy: "양", baseScore: 8 },
    정: { favoredPeriods: ["저녁", "밤"], favoredEnergy: "음", baseScore: 6 },
    무: {
      favoredPeriods: ["오전", "오후", "저녁"],
      favoredEnergy: "양",
      baseScore: 4,
    },
    기: {
      favoredPeriods: ["새벽", "저녁", "밤"],
      favoredEnergy: "음",
      baseScore: 4,
    },
    경: { favoredPeriods: ["오전", "오후"], favoredEnergy: "양", baseScore: 7 },
    신: { favoredPeriods: ["저녁", "밤"], favoredEnergy: "음", baseScore: 7 },
    임: { favoredPeriods: ["새벽", "밤"], favoredEnergy: "음", baseScore: 9 },
    계: { favoredPeriods: ["새벽", "저녁"], favoredEnergy: "음", baseScore: 5 },
  };

  const userPreference = GAN_TIME_PREFERENCE[userDayGan];
  if (!userPreference) {
    return {
      harmonyScore: 0,
      energyMatch: "중립",
      recommendations: ["시간 에너지 분석 불가"],
      warnings: [],
    };
  }

  let harmonyScore = userPreference.baseScore;

  // 시간대 선호도 매칭
  if (userPreference.favoredPeriods.includes(timeEnergy.period)) {
    harmonyScore += 8;
  } else {
    harmonyScore -= 3;
  }

  // 에너지 타입 매칭
  if (userPreference.favoredEnergy === timeEnergy.energy) {
    harmonyScore += 5;
  } else {
    harmonyScore -= 5;
  }

  // 에너지 강도 보정
  if (timeEnergy.adjustedIntensity > 7) {
    harmonyScore += 3; // 높은 에너지는 일반적으로 유리
  } else if (timeEnergy.adjustedIntensity < 4) {
    harmonyScore -= 2; // 낮은 에너지는 약간 불리
  }

  // 점수 범위 조정 (-20 ~ +20)
  harmonyScore = Math.max(-20, Math.min(20, harmonyScore));

  // 에너지 매칭 상태 결정
  let energyMatch: "조화" | "중립" | "충돌";
  if (harmonyScore >= 10) energyMatch = "조화";
  else if (harmonyScore >= -5) energyMatch = "중립";
  else energyMatch = "충돌";

  // 추천사항 및 경고사항 생성
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (energyMatch === "조화") {
    recommendations.push(
      ...timeEnergy.favorableFor.map(
        (activity) => `${activity}에 최적의 시간입니다`
      )
    );
    recommendations.push(
      `${timeEnergy.period} 시간대의 ${timeEnergy.energy} 에너지가 당신과 잘 맞습니다`
    );
  } else if (energyMatch === "충돌") {
    warnings.push(
      ...timeEnergy.unfavorableFor.map(
        (activity) => `${activity}은(는) 피하는 것이 좋습니다`
      )
    );
    warnings.push(`현재 시간의 에너지가 당신의 성향과 맞지 않습니다`);
  } else {
    recommendations.push("평상시처럼 무난하게 활동하세요");
  }

  return {
    harmonyScore,
    energyMatch,
    recommendations,
    warnings,
  };
}

/**
 * 시간 에너지 기반 길흉 점수를 계산합니다
 */
export function calculateTimeEnergyScore(
  currentTime: Date,
  userDayGan: string
): {
  timeEnergy: ReturnType<typeof analyzeTimeEnergy>;
  compatibility: ReturnType<typeof analyzeTimeCompatibility>;
  totalScore: number; // -30 ~ +30
  analysis: string;
} {
  const timeEnergy = analyzeTimeEnergy(currentTime);
  const compatibility = analyzeTimeCompatibility(timeEnergy, userDayGan);

  // 총 점수 계산 (시간 에너지 + 호환성)
  const energyScore = Math.round((timeEnergy.overallScore - 50) / 5); // -10 ~ +10
  const compatibilityScore = compatibility.harmonyScore; // -20 ~ +20
  const totalScore = energyScore + compatibilityScore; // -30 ~ +30

  // 분석 텍스트 생성
  let analysis = `현재 ${timeEnergy.period} 시간대는 ${timeEnergy.energy} 에너지가 지배적입니다. `;
  analysis += `에너지 강도는 ${timeEnergy.adjustedIntensity.toFixed(
    1
  )}/10으로 `;

  if (timeEnergy.adjustedIntensity > 7) analysis += "매우 활발한 상태입니다. ";
  else if (timeEnergy.adjustedIntensity > 5)
    analysis += "적당히 활발한 상태입니다. ";
  else if (timeEnergy.adjustedIntensity > 3) analysis += "온화한 상태입니다. ";
  else analysis += "조용하고 수렴적인 상태입니다. ";

  analysis += `당신의 일간 ${userDayGan}과의 궁합은 ${compatibility.energyMatch} 상태로, `;

  if (totalScore > 15) analysis += "매우 길한 시간입니다.";
  else if (totalScore > 5) analysis += "길한 시간입니다.";
  else if (totalScore > -5) analysis += "평온한 시간입니다.";
  else if (totalScore > -15) analysis += "조심스러운 시간입니다.";
  else analysis += "신중함이 필요한 시간입니다.";

  return {
    timeEnergy,
    compatibility,
    totalScore,
    analysis,
  };
}
