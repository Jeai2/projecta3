// server/src/data/saryeong-job-map.data.ts
// 사령(월지 기반 천간) → 직업 추천 맵

export type JobCategoryItem = {
  title: string;
  professions: string;
  icon: string;
};

type GanHangul = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";

/** 사령 천간(한글) → 직업 추천 카테고리 (실무 미션, 사령별 1개) */
export const SARYEONG_JOB_MAP: Record<GanHangul, JobCategoryItem[]> = {
  갑: [{ title: "연구·개발·교육", professions: "연구원, 개발자, 기술 기획자, 교사, 컨설턴트, NPO 리더", icon: "professional" }],
  을: [{ title: "사회·조화·시스템", professions: "HR, 사회 복지사, 커뮤니티 매니저, 시스템 설계자, 프로세스 전문가", icon: "education" }],
  병: [{ title: "사회·교육·소통", professions: "강사, 트레이너, 교육 기획자, 마케터, 브랜드 매니저", icon: "education" }],
  정: [{ title: "회계·운영·창작", professions: "회계사, CFO, 운영 전문가, 디자이너, 크리에이터", icon: "professional" }],
  무: [{ title: "추진·조직·운영", professions: "사업 개발, 사업 기획자, 경영진, 팀 리더", icon: "startup" }],
  기: [{ title: "운영·관리·서비스", professions: "COO, 운영 매니저, 컨시어지, 서비스 디자이너", icon: "professional" }],
  경: [{ title: "실천·기술·제조", professions: "엔지니어, 기술 감독, 생산 관리, 품질 관리", icon: "professional" }],
  신: [{ title: "회계·실천·기술", professions: "재무 분석가, 감사, 프로세스 혁신, QC", icon: "professional" }],
  임: [{ title: "실천·연구·유통", professions: "R&D, 기술 사업화, 무역 전문가, 해외 영업", icon: "professional" }],
  계: [{ title: "연구·예술·상담", professions: "연구원, 예술가, 작가, 심리 상담사, 코치", icon: "education" }],
};
