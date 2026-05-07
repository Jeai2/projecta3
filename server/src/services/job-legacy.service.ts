// server/src/services/job-legacy.service.ts
// 당사주 유산(직군) 계산: 년지 + 음력 생월(1–12) + 성별 → 직군 매칭

import type { Gan, Ji } from "../data/job-map.data";
import { JOB_MAP_BY_CATEGORY, moveJiByMonth } from "../data/job-map.data";
import { JI_OHENG } from "../data/saju.data";

export interface JobLegacyResult {
  label: string;
  careerTitle: string;
  careerDescription: string;
  resultJi: Ji;
  resultOheng: string;
  inheritedDNA?: string;
  corePowers?: string[];
  modernCareerDNA?: string;
}

export interface JobLegacyByGender {
  male: JobLegacyResult | null;
  female: JobLegacyResult | null;
}

const GAN_LIST: Gan[] = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
];
const JI_LIST: Ji[] = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

function isGan(s: string): s is Gan {
  return GAN_LIST.includes(s as Gan);
}
function isJi(s: string): s is Ji {
  return JI_LIST.includes(s as Ji);
}

/**
 * 당사주 유산(직군) 계산
 * @param yearGan 사주원국 년간
 * @param yearJi 사주원국 년지
 * @param lunarMonth 음력 생월 (1–12). 양력 입력 시 controller에서 양→음 변환 후 넘김
 * @returns 남자/여자 각각 매칭된 직군 (label, careerTitle, careerDescription)
 */
export function getJobLegacyByGender(
  yearGan: string,
  yearJi: string,
  lunarMonth: number
): JobLegacyByGender {
  const gan = isGan(yearGan) ? yearGan : null;
  const ji = isJi(yearJi) ? yearJi : null;
  if (!gan || !ji) {
    return { male: null, female: null };
  }

  const month = Math.max(1, Math.min(12, lunarMonth));
  const resultJiMale = moveJiByMonth(ji, month, "forward");
  const resultJiFemale = moveJiByMonth(ji, month, "backward");

  const findCategory = (targetJi: Ji): JobLegacyResult | null => {
    const cat = JOB_MAP_BY_CATEGORY.find(
      (c) => c.ganToJi[gan] === targetJi
    );
    if (!cat) return null;
    return {
      label: cat.label,
      careerTitle: cat.careerTitle ?? cat.label,
      careerDescription: cat.careerDescription ?? "",
      resultJi: targetJi,
      resultOheng: JI_OHENG[targetJi] ?? "",
      inheritedDNA: cat.inheritedDNA,
      corePowers: cat.corePowers,
      modernCareerDNA: cat.modernCareerDNA,
    };
  };

  return {
    male: findCategory(resultJiMale),
    female: findCategory(resultJiFemale),
  };
}
