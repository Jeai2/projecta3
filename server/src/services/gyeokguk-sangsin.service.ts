// server/src/services/gyeokguk-sangsin.service.ts
// 격국 상신(相神) 도출 로직
//
// TODO: 격국별 상신 로직 구현
// - 상신은 용신을 보좌하는 오행
// - 격국 성격/파격 여부에 따라 달라짐
// - gyeokguk.service.ts의 GyeokgukAnalysis 결과를 입력으로 받음
//
// 참고:
// - 성격(成格): 용신을 생(生)하거나 보호하는 오행이 상신
// - 파격(破格): 파격 요인을 제거하는 오행이 상신

export interface SangsinResult {
  ohaeng: string;   // 상신 오행 (木火土金水)
  sipsin: string;   // 상신 십성
  reason: string;   // 도출 근거
}

/**
 * 격국 상신 도출
 * @param _gyeokgukName 격국명 (예: "정관격")
 * @param _yongsinOhaeng 용신 오행
 * @param _isSuccess 성격 여부
 * @returns SangsinResult | null
 */
export const getSangsin = (
  _gyeokgukName: string,
  _yongsinOhaeng: string,
  _isSuccess: boolean,
): SangsinResult | null => {
  // TODO: 구현 예정
  return null;
};
