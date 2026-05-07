// server/src/data/career-energy.data.ts
// 진로 직업 찾기 - 천간별 에너지 타입 데이터

export interface EnergyTypeData {
  gan: string; // 천간 (한글, 예: "갑")
  ganHanja: string; // 천간 한자 (예: "甲")
  ohaeng: string; // 오행 (예: "木")
  modifier: string; // 수식어 (예: "청초한 나무")
  description: string; // 설명문
  keywords: string[]; // 해시태그 배열
  imageUrl: string; // 이미지 URL (임시)
}

/**
 * 천간별 에너지 타입 데이터 매핑
 */
export const CAREER_ENERGY_DATA: Record<string, EnergyTypeData> = {
  갑: {
    gan: "갑",
    ganHanja: "甲",
    ohaeng: "木",
    modifier: "곧은 나무",
    description: "미래에 대한 대비로 자신을 투자하고 호기심이 많은 지적 자질",
    keywords: ["논리", "기초교육", "학습", "설계", "강의"],
    imageUrl: "straight_tree.png",
  },
  을: {
    gan: "을",
    ganHanja: "乙",
    ohaeng: "木",
    modifier: "유연한 풀",
    description: "넓은 시야와 친화력으로 인사를 적재적소에 배치하는 지성 자질",
    keywords: ["기초 사회", "사회생활", "입법", "협상", "시스템 구축", "배치", "상대적 교육"],
    imageUrl: "flexible_grass.png",
  },
  병: {
    gan: "병",
    ganHanja: "丙",
    ohaeng: "火",
    modifier: "밝은 불빛",
    description: "소통을 통해 조직을 성장시키는 확장형 리더 자질",
    keywords: ["운용", "행정", "조사", "소통", "쓰임새", "정보수집"],
    imageUrl: "bright_light.png",
  },
  정: {
    gan: "정",
    ganHanja: "丁",
    ohaeng: "火",
    modifier: "잔잔한 온기",
    description: "탐구를 가치로 전환하는 통찰형 기획 자질",
    keywords: ["사물본질", "산업기초", "단련", "금융", "회계", "예술", "창작", "연구"],
    imageUrl: "calm_warmth.png",
  },
  무: {
    gan: "무",
    ganHanja: "戊",
    ohaeng: "土",
    modifier: "넓은 대지",
    description: "전체 구조를 떠받치며 중심을 잡고, 장기적 안정과 책임을 감당하는 기반 구축 자질",
    keywords: [
      "조직 안정",
      "시스템 구축",
      "장기 전략",
      "리스크 관리",
      "운영 책임",
      "의사결정 보조",
    ],
    imageUrl: "/large_area.png",
  },
  기: {
    gan: "기",
    ganHanja: "己",
    ohaeng: "土",
    modifier: "비옥한 흙",
    description: "현실의 세부를 살피고 조율하여, 사람과 시스템을 실무적으로 굴러가게 만드는 관리 자질",
    keywords: [
      "운영 관리",
      "프로세스 조정",
      "실무 지원",
      "조직 케어",
      "현장 대응",
      "서비스 최적화",
    ],
    imageUrl: "fertile_soil.png",
  },
  경: {
    gan: "경",
    ganHanja: "庚",
    ohaeng: "金",
    modifier: "단단한 암석",
    description: "기준을 세워 정점에 오르는 압도적 전문성과 승부형 전문 자질",
    keywords: ["산업기초", "감독", "관리자", "제조", "원재료", "체계", "기능 기술", "운동"],
    imageUrl: "hard_rock.png",
  },
  신: {
    gan: "신",
    ganHanja: "辛",
    ohaeng: "金",
    modifier: "섬세한 보석",
    description: "불편을 개선해 완성도를 높이는 정말 고도화 첨단 자질",
    keywords: ["상품", "최신", "최고", "신기술", "최첨단", "서비스", "과학", "조직가치"],
    imageUrl: "delicate_jewels.png",
  },
  임: {
    gan: "임",
    ganHanja: "壬",
    ohaeng: "水",
    modifier: "넓은 바다",
    description: "흐름을 만들고 확산시키는 네트워크 확장, 판을 키우는 자질",
    keywords: ["운영", "시장", "유통", "무역", "해외", "언어", "해운"],
    imageUrl: "wide_sea.png",
  },
  계: {
    gan: "계",
    ganHanja: "癸",
    ohaeng: "水",
    modifier: "깊은 샘물",
    description: "풍부한 감수성과 따뜻한 마음이 담긴 생각하는 자질",
    keywords: ["본성", "인성", "가정", "양육", "철학", "지식", "예술"],
    imageUrl: "deep_spring_water.png",
  },
};

/**
 * 천간 한자로 데이터 조회
 */
export function getEnergyDataByGan(gan: string): EnergyTypeData | null {
  // 한자로 입력된 경우 한글로 변환
  const ganMap: Record<string, string> = {
    甲: "갑",
    乙: "을",
    丙: "병",
    丁: "정",
    戊: "무",
    己: "기",
    庚: "경",
    辛: "신",
    壬: "임",
    癸: "계",
  };

  const hangulGan = ganMap[gan] || gan;
  return CAREER_ENERGY_DATA[hangulGan] || null;
}
