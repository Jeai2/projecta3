// server/src/data/relationship.data.ts
// 지지 간 관계 데이터 (형충파해합)

// 천간합 (5개 조합) - 천간 간의 조화로운 관계
export const CHEONGANHAP: { [key: string]: string } = {
  甲: "己",
  己: "甲",
  乙: "庚",
  庚: "乙",
  丙: "辛",
  辛: "丙",
  丁: "壬",
  壬: "丁",
  戊: "癸",
  癸: "戊",
};

// 천간합화 (5개 조합) - 천간합이 일어날 때 변화하는 오행
export const CHEONGANHAPHWA: {
  [key: string]: { partner: string; result: string; resultName: string };
} = {
  甲: { partner: "己", result: "土", resultName: "갑기합화토" },
  己: { partner: "甲", result: "土", resultName: "갑기합화토" },
  乙: { partner: "庚", result: "金", resultName: "을경합화금" },
  庚: { partner: "乙", result: "金", resultName: "을경합화금" },
  丙: { partner: "辛", result: "水", resultName: "병신합화수" },
  辛: { partner: "丙", result: "水", resultName: "병신합화수" },
  丁: { partner: "壬", result: "木", resultName: "정임합화목" },
  壬: { partner: "丁", result: "木", resultName: "정임합화목" },
  戊: { partner: "癸", result: "火", resultName: "무계합화화" },
  癸: { partner: "戊", result: "火", resultName: "무계합화화" },
};

// 천간충
export const CHEONGANCHUNG: { [key: string]: string } = {
  甲: "戊", // 갑무극
  戊: "壬", // 무임극
  壬: "丙", // 임병극
  丙: "庚", // 병경극
  庚: "甲", // 경갑극
  乙: "己", // 을기극
  己: "癸", // 기계극
  癸: "丁", // 계정극
  丁: "辛", // 정신극
  辛: "乙", // 신을극
};

// 육합 (6개 조합) - 서로 조화로운 관계
export const YUKHAP: { [key: string]: string } = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午",
};

// 육합화 (6개 조합) - 육합이 일어날 때 변화하는 오행
export const YUKHAPHWA: {
  [key: string]: { partner: string; result: string; resultName: string };
} = {
  子: { partner: "丑", result: "土", resultName: "자축합화토" },
  丑: { partner: "子", result: "土", resultName: "자축합화토" },
  寅: { partner: "亥", result: "木", resultName: "인해합화목" },
  亥: { partner: "寅", result: "木", resultName: "인해합화목" },
  卯: { partner: "戌", result: "火", resultName: "묘술합화화" },
  戌: { partner: "卯", result: "火", resultName: "묘술합화화" },
  辰: { partner: "酉", result: "金", resultName: "진유합화금" },
  酉: { partner: "辰", result: "金", resultName: "진유합화금" },
  巳: { partner: "申", result: "水", resultName: "사신합화수" },
  申: { partner: "巳", result: "水", resultName: "사신합화수" },
  午: { partner: "未", result: "火", resultName: "오미합화화" },
  未: { partner: "午", result: "火", resultName: "오미합화화" },
};

// 삼합 (3개 조합) - 삼각형 관계
export const SAMHAP: { [key: string]: string[] } = {
  寅: ["午", "戌"],
  午: ["寅", "戌"],
  戌: ["寅", "午"],
  亥: ["卯", "未"],
  卯: ["亥", "未"],
  未: ["亥", "卯"],
  巳: ["酉", "丑"],
  酉: ["巳", "丑"],
  丑: ["巳", "酉"],
  申: ["子", "辰"],
  子: ["申", "辰"],
  辰: ["申", "子"],
};

// 삼합화 (4개 조합) - 삼합이 일어날 때 변화하는 오행
export const SAMHAPHWA: {
  [key: string]: { partners: string[]; result: string; resultName: string };
} = {
  寅: { partners: ["午", "戌"], result: "火", resultName: "인오술삼합화화" },
  午: { partners: ["寅", "戌"], result: "火", resultName: "인오술삼합화화" },
  戌: { partners: ["寅", "午"], result: "火", resultName: "인오술삼합화화" },
  亥: { partners: ["卯", "未"], result: "木", resultName: "해묘미삼합화목" },
  卯: { partners: ["亥", "未"], result: "木", resultName: "해묘미삼합화목" },
  未: { partners: ["亥", "卯"], result: "木", resultName: "해묘미삼합화목" },
  巳: { partners: ["酉", "丑"], result: "金", resultName: "사유축삼합화금" },
  酉: { partners: ["巳", "丑"], result: "金", resultName: "사유축삼합화금" },
  丑: { partners: ["巳", "酉"], result: "金", resultName: "사유축삼합화금" },
  申: { partners: ["子", "辰"], result: "水", resultName: "신자진삼합화수" },
  子: { partners: ["申", "辰"], result: "水", resultName: "신자진삼합화수" },
  辰: { partners: ["申", "子"], result: "水", resultName: "신자진삼합화수" },
};

// 방합 (4개 조합) - 동일한 방향의 지지들 간의 조화로운 관계
export const BANGHAP: { [key: string]: string[] } = {
  寅: ["卯", "辰"], // 봄 방향
  卯: ["寅", "辰"],
  辰: ["寅", "卯"],
  巳: ["午", "未"], // 여름 방향
  午: ["巳", "未"],
  未: ["巳", "午"],
  申: ["酉", "戌"], // 가을 방향
  酉: ["申", "戌"],
  戌: ["申", "酉"],
  亥: ["子", "丑"], // 겨울 방향
  子: ["亥", "丑"],
  丑: ["亥", "子"],
};

// 방합화 (4개 조합) - 방합이 일어날 때 변화하는 오행 (계절별)
export const BANGHAPHWA: {
  [key: string]: { partners: string[]; result: string; resultName: string };
} = {
  寅: { partners: ["卯", "辰"], result: "木", resultName: "인묘진방합화목" },
  卯: { partners: ["寅", "辰"], result: "木", resultName: "인묘진방합화목" },
  辰: { partners: ["寅", "卯"], result: "木", resultName: "인묘진방합화목" },
  巳: { partners: ["午", "未"], result: "火", resultName: "사오미방합화화" },
  午: { partners: ["巳", "未"], result: "火", resultName: "사오미방합화화" },
  未: { partners: ["巳", "午"], result: "火", resultName: "사오미방합화화" },
  申: { partners: ["酉", "戌"], result: "金", resultName: "신유술방합화금" },
  酉: { partners: ["申", "戌"], result: "金", resultName: "신유술방합화금" },
  戌: { partners: ["申", "酉"], result: "金", resultName: "신유술방합화금" },
  亥: { partners: ["子", "丑"], result: "水", resultName: "해자축방합화수" },
  子: { partners: ["亥", "丑"], result: "水", resultName: "해자축방합화수" },
  丑: { partners: ["亥", "子"], result: "水", resultName: "해자축방합화수" },
};

// 암합 (6개 조합) - 은밀한 합 관계
export const AMHAP: { [key: string]: string[] } = {
  子: ["戌", "戊"],
  戌: ["子"],
  丑: ["寅"],
  寅: ["亥", "未"],
  卯: ["申"],
  申: ["卯"],
  未: ["寅"],
  午: ["亥", "壬"],
  亥: ["午", "丁"],
  丁: ["亥"],
  戊: ["子"],
  辛: ["巳"],
  巳: ["辛"],
  壬: ["午"],
};

// 육충 (6개 조합) - 서로 대립하는 관계
export const YUKCHUNG: { [key: string]: string } = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳",
};

// 육형 (6개 조합) - 서로 다투는 관계
export const YUKHYUNG: { [key: string]: string[] } = {
  寅: ["巳", "申"],
  巳: ["寅", "申"],
  申: ["寅", "巳"],
  丑: ["戌", "未"],
  戌: ["丑", "未"],
  未: ["丑", "戌"],
};

// 육파 (6개 조합) - 서로 파괴하는 관계
export const YUKPA: { [key: string]: string } = {
  子: "酉",
  酉: "子",
  丑: "辰",
  辰: "丑",
  寅: "亥",
  亥: "寅",
  卯: "午",
  午: "卯",
  巳: "申",
  申: "巳",
  未: "戌",
  戌: "未",
};

// 육해 (6개 조합) - 서로 해치는 관계
export const YUKAE: { [key: string]: string } = {
  子: "未",
  未: "子",
  丑: "午",
  午: "丑",
  寅: "巳",
  巳: "寅",
  卯: "辰",
  辰: "卯",
  申: "亥",
  亥: "申",
  酉: "戌",
  戌: "酉",
};

// 통합 관계 데이터
export const JIJI_RELATIONSHIPS = {
  cheonganhap: CHEONGANHAP, // 천간합
  cheonganhaphwa: CHEONGANHAPHWA, // 천간합화
  cheonganchung: CHEONGANCHUNG, // 천간충
  yukhap: YUKHAP, // 육합
  yukhaphwa: YUKHAPHWA, // 육합화
  samhap: SAMHAP, // 삼합
  samhaphwa: SAMHAPHWA, // 삼합화
  amhap: AMHAP, // 암합
  banghap: BANGHAP, // 방합
  banghaphwa: BANGHAPHWA, // 방합화
  yukchung: YUKCHUNG, // 육충
  yukhyung: YUKHYUNG, // 육형
  yukpa: YUKPA, // 육파
  yukae: YUKAE, // 육해
};
