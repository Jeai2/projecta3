/**
 * 왕상휴수사(旺相休囚死) 데이터
 *
 * 각 천간별로 지지에서의 왕상휴수사 상태를 정의
 *
 * 旺(왕): 가장 강한 상태
 * 相(상): 왕을 돕는 상태
 * 休(휴): 휴식 상태
 * 囚(수): 갇힌 상태
 * 死(사): 죽은 상태
 */

export interface WangsanghyususaData {
  wang: string[]; // 旺
  sang: string[]; // 相
  hyu: string[]; // 休
  su: string[]; // 囚
  sa: string[]; // 死
}

export const WANGSANGHYUSUSA_DATA: Record<string, WangsanghyususaData> = {
  // 갑, 을
  甲: {
    wang: ["寅", "卯"], // 인묘(旺)
    sang: ["亥", "子"], // 해자(相)
    hyu: ["巳", "午"], // 사오(休)
    su: ["辰", "戌", "丑", "未"], // 진술축미(囚)
    sa: ["申", "酉"], // 신유(死)
  },
  乙: {
    wang: ["寅", "卯"], // 인묘(旺)
    sang: ["亥", "子"], // 해자(相)
    hyu: ["巳", "午"], // 사오(休)
    su: ["辰", "戌", "丑", "未"], // 진술축미(囚)
    sa: ["申", "酉"], // 신유(死)
  },

  // 병, 정
  丙: {
    wang: ["巳", "午"], // 사오(旺)
    sang: ["寅", "卯"], // 인묘(相)
    hyu: ["辰", "戌", "丑", "未"], // 진술축미(休)
    su: ["申", "酉"], // 신유(囚)
    sa: ["亥", "子"], // 해자(死)
  },
  丁: {
    wang: ["巳", "午"], // 사오(旺)
    sang: ["寅", "卯"], // 인묘(相)
    hyu: ["辰", "戌", "丑", "未"], // 진술축미(休)
    su: ["申", "酉"], // 신유(囚)
    sa: ["亥", "子"], // 해자(死)
  },

  // 무, 기
  戊: {
    wang: ["辰", "戌", "丑", "未"], // 진술축미(旺)
    sang: ["巳", "午"], // 사오(相)
    hyu: ["申", "酉"], // 신유(休)
    su: ["亥", "子"], // 해자(囚)
    sa: ["寅", "卯"], // 인묘(死)
  },
  己: {
    wang: ["辰", "戌", "丑", "未"], // 진술축미(旺)
    sang: ["巳", "午"], // 사오(相)
    hyu: ["申", "酉"], // 신유(休)
    su: ["亥", "子"], // 해자(囚)
    sa: ["寅", "卯"], // 인묘(死)
  },

  // 경, 신
  庚: {
    wang: ["申", "酉"], // 신유(旺)
    sang: ["辰", "戌", "丑", "未"], // 진술축미(相)
    hyu: ["亥", "子"], // 해자(休)
    su: ["寅", "卯"], // 인묘(囚)
    sa: ["巳", "午"], // 사오(死)
  },
  辛: {
    wang: ["申", "酉"], // 신유(旺)
    sang: ["辰", "戌", "丑", "未"], // 진술축미(相)
    hyu: ["亥", "子"], // 해자(休)
    su: ["寅", "卯"], // 인묘(囚)
    sa: ["巳", "午"], // 사오(死)
  },

  // 임, 계
  壬: {
    wang: ["亥", "子"], // 해자(旺)
    sang: ["申", "酉"], // 신유(相)
    hyu: ["寅", "卯"], // 인묘(休)
    su: ["巳", "午"], // 사오(囚)
    sa: ["辰", "戌", "丑", "未"], // 진술축미(死)
  },
  癸: {
    wang: ["亥", "子"], // 해자(旺)
    sang: ["申", "酉"], // 신유(相)
    hyu: ["寅", "卯"], // 인묘(休)
    su: ["巳", "午"], // 사오(囚)
    sa: ["辰", "戌", "丑", "未"], // 진술축미(死)
  },
};

/**
 * 천간의 특정 지지에서의 왕상휴수사 상태를 반환
 */
export function getWangsanghyususaStatus(
  gan: string,
  ji: string
): string | null {
  const data = WANGSANGHYUSUSA_DATA[gan];
  if (!data) return null;

  if (data.wang.includes(ji)) return "旺";
  if (data.sang.includes(ji)) return "相";
  if (data.hyu.includes(ji)) return "休";
  if (data.su.includes(ji)) return "囚";
  if (data.sa.includes(ji)) return "死";

  return null;
}

/**
 * 천간의 왕상휴수사 점수를 반환 (왕=5, 상=4, 휴=3, 수=2, 사=1)
 */
export function getWangsanghyususaScore(gan: string, ji: string): number {
  const status = getWangsanghyususaStatus(gan, ji);
  switch (status) {
    case "旺":
      return 5;
    case "相":
      return 4;
    case "休":
      return 3;
    case "囚":
      return 2;
    case "死":
      return 1;
    default:
      return 0;
  }
}
