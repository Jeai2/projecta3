import type { ConsultationPersonProfile, IpchunBirthYearPillar } from "../types/consultation";
import { resolveSolarBirthDate } from "./birth-date.service";
import { analyzeCoupleOhaeng, type PillarsInput } from "./couple-ohaeng.service";
import { getSajuDetails } from "./saju.service";

interface RelationshipInsightInput {
  readingSubject: ConsultationPersonProfile;
  relationshipTarget: ConsultationPersonProfile;
  readingSubjectPillars: Awaited<ReturnType<typeof getSajuDetails>>["sajuData"]["pillars"];
}

export interface RelationshipInsightResult {
  insight: string;
  targetBirthYearPillar: IpchunBirthYearPillar;
}

function hasCalculationBirth(profile: ConsultationPersonProfile): boolean {
  return (
    !!profile.birth?.date &&
    !!profile.birth.calendarType &&
    !!profile.genderForCalculation
  );
}

function toPillarsInput(
  pillars: Awaited<ReturnType<typeof getSajuDetails>>["sajuData"]["pillars"],
): PillarsInput {
  return {
    year: {
      gan: pillars.year.gan,
      ji: pillars.year.ji,
      ganOhaeng: pillars.year.ganOhaeng,
      jiOhaeng: pillars.year.jiOhaeng,
    },
    month: {
      gan: pillars.month.gan,
      ji: pillars.month.ji,
      ganOhaeng: pillars.month.ganOhaeng,
      jiOhaeng: pillars.month.jiOhaeng,
    },
    day: {
      gan: pillars.day.gan,
      ji: pillars.day.ji,
      ganOhaeng: pillars.day.ganOhaeng,
      jiOhaeng: pillars.day.jiOhaeng,
    },
    hour: {
      gan: pillars.hour.gan,
      ji: pillars.hour.ji,
      ganOhaeng: pillars.hour.ganOhaeng,
      jiOhaeng: pillars.hour.jiOhaeng,
    },
  };
}

function attractionText(result: ReturnType<typeof analyzeCoupleOhaeng>["ilgan"]["result"]): string {
  switch (result) {
    case "쌍방인력":
      return "서로에게 끌리는 힘이 양쪽에서 비교적 분명하게 움직인다.";
    case "단방인력":
      return "끌림의 온도는 한쪽이 먼저 강하게 움직일 수 있다.";
    case "쌍방척력":
      return "끌림보다 부딪힘이 먼저 느껴지기 쉬운 조합이다.";
    case "단방척력":
      return "한쪽이 관계의 압박이나 거리감을 더 크게 느낄 수 있다.";
    case "인척혼재":
      return "끌림과 불편함이 함께 움직여 관계의 온도 차가 반복될 수 있다.";
    default:
      return "강하게 당기거나 밀어내는 힘보다 관계를 만들어 가는 태도가 중요하다.";
  }
}

export async function buildRelationshipConsultationInsight(
  input: RelationshipInsightInput,
): Promise<RelationshipInsightResult | null> {
  if (!hasCalculationBirth(input.readingSubject) || !hasCalculationBirth(input.relationshipTarget)) {
    return null;
  }

  const targetBirth = await resolveSolarBirthDate({
    birthDate: input.relationshipTarget.birth!.date!,
    birthTime: input.relationshipTarget.birth!.time,
    calendarType: input.relationshipTarget.birth!.calendarType!,
    isLeapMonth: input.relationshipTarget.birth!.isLeapMonth,
  });
  const targetSaju = await getSajuDetails(
    targetBirth.date,
    input.relationshipTarget.genderForCalculation!,
  );
  const result = analyzeCoupleOhaeng({
    myPillars: toPillarsInput(input.readingSubjectPillars),
    partnerPillars: toPillarsInput(targetSaju.sajuData.pillars),
    myGender: input.readingSubject.genderForCalculation!,
    partnerGender: input.relationshipTarget.genderForCalculation!,
  });
  const targetName = input.relationshipTarget.displayName ?? "상대방";

  return {
    targetBirthYearPillar: {
      basis: "ipchun",
      gan: targetSaju.sajuData.pillars.year.gan,
      ji: targetSaju.sajuData.pillars.year.ji,
      solarBirthDate: targetBirth.solarBirthDate,
    },
    insight: `[관계 상담 - 두 사람의 출생 흐름 비교]
이 자료는 사용자와 ${targetName}의 생년정보를 함께 받은 뒤 보는 내부 관계 근거다.
- 관계의 끌림: ${attractionText(result.ilgan.result)}
- 생활 리듬의 맞물림: ${result.wolju.desc || "생활 방식의 조화는 대화 속에서 더 확인해야 한다."}
- 관계가 자리 잡는 바탕: ${result.nyeonju.final}

[관계 자료 사용 규칙]
- 오행, 사주 기둥, 궁합 점수, 신살, 계산 명칭을 사용자에게 그대로 말하지 마.
- 상대의 속마음이나 결혼·이별 결과를 이미 정해진 사실처럼 확정하지 마.
- 두 사람 사이에서 반복되기 쉬운 흐름과 사용자가 확인해야 할 행동을 중심으로 풀어.
- 두 사람의 출생 시간을 받지 않았으므로 시기, 자녀, 말년 생활처럼 시간 정보가 필요한 부분은 판단하지 마.`,
  };
}
