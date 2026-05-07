// server/src/data/gyeokguk.data.ts
// 격국(格局) 정의 및 성패 조건

/**
 * 격국 유형 정의
 */
export interface GyeokgukType {
  name: string; // 격국명 (예: "정관격")
  code: string; // 격국 코드 (예: "JEONGGWAN")
  category: "정격" | "외잡격" | "응용격국"; // 격국 분류
  baseSipsin: string; // 기준 십성 (월지 십성)
  description: string; // 격국 설명
  // 용신 선정 (격국명에 대응하는 용신)
  yongsin: string[];
}

/**
 * 격국 데이터 정의
 */
export const GYEOKGUK_DATA: Record<string, GyeokgukType> = {
  // ========== 정격 (正格) ==========

  // 관성격 (官星格)
  JEONGGWAN: {
    name: "정관격",
    code: "JEONGGWAN",
    category: "정격",
    baseSipsin: "정관",
    description: "월지에 정관이 있어 관성을 위주로 하는 격국",
    yongsin: ["正官"], // 용신: 인성으로 생신, 재성으로 생관
  },

  PYEONGWAN: {
    name: "편관격",
    code: "PYEONGWAN",
    category: "정격",
    baseSipsin: "편관",
    description: "월지에 편관이 있어 편관을 제어하여 쓰는 격국",
    yongsin: ["偏官"], // 용신: 식신 제살, 인성 화살
  },

  // 재성격 (財星格)
  JEONGJAE: {
    name: "정재격",
    code: "JEONGJAE",
    category: "정격",
    baseSipsin: "정재",
    description: "월지에 정재가 있어 재성을 위주로 하는 격국",
    yongsin: ["正財"], // 용신: 관성 위재, 식상 생재
  },

  PYEONGJAE: {
    name: "편재격",
    code: "PYEONGJAE",
    category: "정격",
    baseSipsin: "편재",
    description: "월지에 편재가 있어 편재를 위주로 하는 격국",
    yongsin: ["偏財"], // 용신: 관성 위재, 식상 생재
  },

  // 식상격 (食傷格)
  SIKSIN: {
    name: "식신격",
    code: "SIKSIN",
    category: "정격",
    baseSipsin: "식신",
    description: "월지에 식신이 있어 식신을 위주로 하는 격국",
    yongsin: ["食神"],
  },

  SANGGWAN: {
    name: "상관격",
    code: "SANGGWAN",
    category: "정격",
    baseSipsin: "상관",
    description: "월지에 상관이 있어 상관을 위주로 하는 격국",
    yongsin: ["傷官"], // 용신: 재성으로 설기
  },

  // 인성격 (印星格)
  JEONGIN: {
    name: "정인격",
    code: "JEONGIN",
    category: "정격",
    baseSipsin: "정인",
    description: "월지에 정인이 있어 인성을 위주로 하는 격국",
    yongsin: ["正印"], // 용신: 인성
  },

  PYEONGIN: {
    name: "편인격",
    code: "PYEONGIN",
    category: "정격",
    baseSipsin: "편인",
    description: "월지에 편인이 있어 편인을 위주로 하는 격국",
    yongsin: ["偏印"], // 용신: 인성
  },

  // ========== 외잡격 (外雜格) ==========

  GEONROK: {
    name: "건록격",
    code: "GEONROK",
    category: "외잡격",
    baseSipsin: "비견",
    description: "월지에 일간의 록이 있어 일간이 건왕한 격국",
    yongsin: ["食", "財", "官"], // 용신: 식상, 재성, 관성 활용
  },

  YANGIN: {
    name: "양인격",
    code: "YANGIN",
    category: "외잡격",
    baseSipsin: "겁재",
    description: "월지에 양인이 있어 양인을 제어하여 쓰는 격국",
    yongsin: ["官", "食"], // 용신: 관성, 식상으로 제인
  },

  // ========== 응용격국 (應用格局) ==========
  // 응용격국은 여기에 추가됩니다.
};

/**
 * 월지 십성에 따른 격국 매핑
 */
export const SIPSIN_TO_GYEOKGUK: Record<string, string[]> = {
  정관: ["JEONGGWAN"],
  편관: ["PYEONGWAN"],
  정재: ["JEONGJAE"],
  편재: ["PYEONGJAE"],
  식신: ["SIKSIN"],
  상관: ["SANGGWAN"],
  정인: ["JEONGIN"],
  편인: ["PYEONGIN"],
  비견: ["GEONROK"],
  겁재: ["YANGIN"],
};

/**
 * 오행별 용신 매핑 (격국용신 → 실제 천간)
 */
export const GYEOKGUK_YONGSIN_MAP: Record<string, string[]> = {
  印: ["水", "木", "火", "土", "金"], // 인성: 일간을 생하는 오행
  財: ["水", "木", "火", "土", "金"], // 재성: 일간이 극하는 오행
  官: ["水", "木", "火", "土", "金"], // 관성: 일간을 극하는 오행
  食: ["水", "木", "火", "土", "金"], // 식상: 일간이 생하는 오행
  比: ["水", "木", "火", "土", "金"], // 비겁: 일간과 같은 오행
};
