/**
 * 선봉법(先鋒法) 인사이트 빌더
 * getSeonbong() 결과를 묵설이 시스템 프롬프트에 주입할 수 있는 형태로 변환.
 */

import { getSeonbong } from "./lukim.service";
import {
  SEONBONG_BY_SIPSIN,
  SEONBONG_BY_SINSAL,
  SEONBONG_BY_HYUNGSAL,
  SEONBONG_BY_CHUNG,
} from "../data/seonbong-interpretations";

/** 한자 지지 → 한글 */
const JI_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘",
  辰: "진", 巳: "사", 午: "오", 未: "미",
  申: "신", 酉: "유", 戌: "술", 亥: "해",
};

/** 충 쌍(순서 무관) → 데이터 키 */
const CHUNG_PAIR: Record<string, string> = {
  "寅申": "인신충", "申寅": "인신충",
  "子午": "자오충", "午子": "자오충",
  "丑未": "축미충", "未丑": "축미충",
  "辰戌": "진술충", "戌辰": "진술충",
  "巳亥": "사해충", "亥巳": "사해충",
  "卯酉": "묘유충", "酉卯": "묘유충",
};

/** 형 쌍(순서 무관) → 데이터 키 */
const HYUNG_PAIR: Record<string, string> = {
  "寅巳": "인사형", "巳寅": "인사형",
  "巳申": "사신형", "申巳": "사신형",
  "丑未": "축미형", "未丑": "축미형",
  "戌未": "술미형", "未戌": "술미형",
  "辰辰": "진진형",
  "午午": "오오형",
  "酉酉": "유유형",
  "亥亥": "해해형",
  "子卯": "자묘형", "卯子": "자묘형",
};

/**
 * 현재 시각의 선봉법을 계산하고,
 * 묵설이 시스템 프롬프트에 삽입할 인사이트 블록 문자열을 반환한다.
 * 데이터가 충분하지 않으면 빈 문자열 반환.
 */
export function buildSeonbongInsight(date: Date): string {
  const sb = getSeonbong(date);

  // 1. 핵심: 십성(시지 기준)
  const sipsinData = SEONBONG_BY_SIPSIN[sb.sipsinOfJeomsi];
  const primary = sipsinData
    ? `${sipsinData.concernCategory} (${sb.sipsinOfJeomsi}) — ${sipsinData.summary}`
    : null;

  // 2. 보조: 12신살
  const sinsalData = sb.sinsalOfJeomsi
    ? SEONBONG_BY_SINSAL[sb.sinsalOfJeomsi]
    : null;
  const secondary = sinsalData
    ? `${sb.sinsalOfJeomsi} — ${sinsalData.summary}`
    : null;

  // 3. 지지관계: 충 또는 형이 있을 때 추가
  let relation: string | null = null;
  if (sb.jijiRelations.includes("육충")) {
    const key = CHUNG_PAIR[`${sb.ilji}${sb.jeomsiJi}`];
    const d = key ? SEONBONG_BY_CHUNG[key] : null;
    if (d) relation = `기운 충돌(충) — ${d.summary}`;
  }
  if (!relation && sb.jijiRelations.includes("육형")) {
    const key =
      HYUNG_PAIR[`${sb.ilji}${sb.jeomsiJi}`] ??
      HYUNG_PAIR[`${sb.jeomsiJi}${sb.ilji}`];
    const d = key ? SEONBONG_BY_HYUNGSAL[key] : null;
    if (d) relation = `긴장 관계(형) — ${d.summary}`;
  }

  const lines = [
    primary ? `핵심: ${primary}` : null,
    secondary ? `보조: ${secondary}` : null,
    relation ?? null,
  ].filter(Boolean);

  if (lines.length === 0) return "";

  return `[선봉 인사이트 — 지금 이 순간의 기운]
${lines.join("\n")}

[묵설 활용 지침]
- 지금은 이미 대화가 시작된 상태야. "오셨어요?" 같은 인사말 절대 반복하지 마.
- 먼저 위 선봉 인사이트를 바탕으로 지금 느껴지는 기운을 한두 문장으로 짧게 짚어줘.
- 그 직후, 반드시 질문을 하나 던져. 예: "혹시 요즘 결단해야 할 일이 있는 건 아닌가요?", "마음속에 뭔가 걸리는 게 있지 않아요?", "누군가와의 관계에서 고민이 있는 건 아닌지…?"
- 단정하지 말고 슬쩍 질문처럼 던져. 틀려도 "그렇군요." 하고 조용히 넘기면 돼.
- 사용자가 이미 명확한 고민을 꺼낸 경우엔 그 고민에 먼저 응답하되, 여지가 있으면 선봉 기운을 한 줄 얹고 질문으로 마무리해.`;
}
