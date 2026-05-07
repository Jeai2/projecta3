// server/src/data/dangnyeong-job-map.data.ts
// 당령(절기 기반 천간) → 직업 추천 맵

export type JobCategoryItem = {
  title: string;
  professions: string;
  icon: string;
};

type GanHangul = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";

/** 당령 천간(한글) → 직업 추천 카테고리 (당령별 1개) */
export const DANGNYEONG_JOB_MAP: Record<GanHangul, JobCategoryItem[]> = {
  갑: [{ title: "교육·설계·연구", professions: "강사, 설계자, 기획자, 연구원, 분석가, 데이터 사이언티스트, 아키텍트", icon: "education" }],
  을: [{ title: "사회·시스템·협상", professions: "협상가, 인사 전문가, 커뮤니티 매니저, 프로세스 설계자, 컨설턴트", icon: "education" }],
  병: [{ title: "소통·행정·조사", professions: "PR, 마케터, 행정가, 리서처, 기자, 에디터", icon: "education" }],
  정: [{ title: "금융·회계·예술", professions: "회계사, 재무 분석가, 투자 전문가, 연구원, 창작자, 예술가", icon: "professional" }],
  무: [{ title: "조직·운영·전략", professions: "경영 기획, 인프라 아키텍트, 리스크 매니저, COO", icon: "professional" }],
  기: [{ title: "운영·실무·조율", professions: "PM, 운영 매니저, 서비스 기획, 실무 지원", icon: "professional" }],
  경: [{ title: "기술·제조·체계", professions: "엔지니어, 감독, 품질 관리, 설비 기술자, 표준화 전문가", icon: "professional" }],
  신: [{ title: "고도화·첨단·서비스", professions: "R&D, 신기술 전문가, UX 연구자, 과학 커뮤니케이터", icon: "professional" }],
  임: [{ title: "유통·무역·시장", professions: "무역 전문가, 해운, 글로벌 영업, 시장 분석가, 네트워크 기획", icon: "startup" }],
  계: [{ title: "철학·예술·양육", professions: "작가, 예술가, 철학 연구, 교육자, 상담사, 커리어 코치", icon: "education" }],
};
