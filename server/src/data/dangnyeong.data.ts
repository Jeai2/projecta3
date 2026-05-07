// src/data/dangnyeong.data.ts
// 당령(當令) 데이터: 절기별 사령 천간

/**
 * 절기별 당령 천간 매핑
 * 당령 = 해당 절기 구간에서 사령하는 천간
 */
export const DANGNYEONG_BY_JEOLGI: Record<string, string> = {
  // 동지 ~ 대한: 계수 (癸水)
  동지: "계",
  소한: "계",
  대한: "계",

  // 입춘 ~ 경칩: 갑목 (甲木)
  입춘: "갑",
  우수: "갑",
  경칩: "갑",

  // 춘분 ~ 곡우: 을목 (乙木)
  춘분: "을",
  청명: "을",
  곡우: "을",

  // 입하 ~ 망종: 병화 (丙火)
  입하: "병",
  소만: "병",
  망종: "병",

  // 하지 ~ 대서: 정화 (丁火)
  하지: "정",
  소서: "정",
  대서: "정",

  // 입추 ~ 백로: 경금 (庚金)
  입추: "경",
  처서: "경",
  백로: "경",

  // 추분 ~ 상강: 신금 (辛金)
  추분: "신",
  한로: "신",
  상강: "신",

  // 입동 ~ 대설: 임수 (壬水)
  입동: "임",
  소설: "임",
  대설: "임",
};

/**
 * 천간 한글 -> 한자 변환
 */
export const DANGNYEONG_HANGUL_TO_HANJA: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};

/**
 * 천간별 오행
 */
export const DANGNYEONG_GAN_TO_OHAENG: Record<string, string> = {
  갑: "木",
  을: "木",
  병: "火",
  정: "火",
  무: "土",
  기: "土",
  경: "金",
  신: "金",
  임: "水",
  계: "水",
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

/**
 * 절기 구간 정보 (참고용)
 */
export const DANGNYEONG_RANGES = [
  { start: "동지", end: "대한", gan: "계", hanja: "癸", ohaeng: "水" },
  { start: "입춘", end: "경칩", gan: "갑", hanja: "甲", ohaeng: "木" },
  { start: "춘분", end: "곡우", gan: "을", hanja: "乙", ohaeng: "木" },
  { start: "입하", end: "망종", gan: "병", hanja: "丙", ohaeng: "火" },
  { start: "하지", end: "대서", gan: "정", hanja: "丁", ohaeng: "火" },
  { start: "입추", end: "백로", gan: "경", hanja: "庚", ohaeng: "金" },
  { start: "추분", end: "상강", gan: "신", hanja: "辛", ohaeng: "金" },
  { start: "입동", end: "대설", gan: "임", hanja: "壬", ohaeng: "水" },
] as const;
