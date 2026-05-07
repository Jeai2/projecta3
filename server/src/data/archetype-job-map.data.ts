// server/src/data/archetype-job-map.data.ts
// 아키타입6 (홀랜드 6유형) → 직업 추천 맵

import type { ArchetypeCode } from "./archetype-map.data";

type JobCategoryItem = { title: string; professions: string; icon: string };

/** 아키타입 코드 → 직업 추천 카테고리 (아키타입별 1개) */
export const ARCHETYPE_JOB_MAP: Record<ArchetypeCode, JobCategoryItem[]> = {
  R: [{ title: "기술·현장·제조", professions: "엔지니어, 기술자, 장인, 스포츠 코치, 생산 관리, 품질 관리, 메카닉", icon: "professional" }],
  I: [{ title: "연구·분석·탐구", professions: "연구원, 데이터 분석가, 학자, 과학자, 의료 연구, 기술 개발", icon: "professional" }],
  A: [{ title: "창작·예술·감성", professions: "디자이너, 작가, 영상 감독, 크리에이터, 음악가, 예술가", icon: "art" }],
  S: [{ title: "교육·양육·조화", professions: "교사, 상담사, 트레이너, HR, 복지사, 커뮤니티 리더", icon: "education" }],
  E: [{ title: "리더십·추진·전략", professions: "경영자, 사업 개발, 영업, 컨설턴트, 투자자, 창업가", icon: "startup" }],
  C: [{ title: "운영·시스템·관리", professions: "COO, 운영 전문가, 프로세스 설계, 회계사, 공무원, 품질 관리", icon: "professional" }],
};
