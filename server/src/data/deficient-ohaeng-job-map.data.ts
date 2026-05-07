// server/src/data/deficient-ohaeng-job-map.data.ts
// 부족한 오행 → 직업 추천 맵 (해당 오행 환경에 맞는 직업)

export type Ohaeng = "木" | "火" | "土" | "金" | "水";

type JobCategoryItem = { title: string; professions: string; icon: string };

/** 부족한 오행 → 직업 추천 카테고리 (오행별 1개)
 *  해당 오행이 부족한 사람에게 추천: 그 환경을 보완·활용할 수 있는 직업 */
export const DEFICIENT_OHAENG_JOB_MAP: Record<Ohaeng, JobCategoryItem[]> = {
  木: [
    {
      title: "성장·육성·창업",
      professions:
        "교육자, 멘토, 스타트업 액셀러레이터, 창업가, VC, 그로스 전문가",
      icon: "education",
    },
  ],
  火: [
    {
      title: "표현·소통·활동",
      professions: "PR, 마케터, 연설가, 방송인, 영업, 이벤트 기획, 스포츠",
      icon: "startup",
    },
  ],
  土: [
    {
      title: "안정·운영·관리",
      professions: "경영 지원, 운영 매니저, 인프라, PM, 관리직, 품질 관리",
      icon: "professional",
    },
  ],
  金: [
    {
      title: "기준·판단·정확",
      professions: "감사, 품질 관리, 법률, 회계사, 분석가, 전략 기획",
      icon: "professional",
    },
  ],
  水: [
    {
      title: "유연·흐름·대응",
      professions: "무역, 유통, 글로벌 사업, 컨설턴트, 중개인, 전략가",
      icon: "startup",
    },
  ],
};
