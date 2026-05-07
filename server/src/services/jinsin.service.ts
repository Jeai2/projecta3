// server/src/services/jinsin.service.ts
// 진신/가신 계산 로직 (일간 기준 매핑)

export interface JinsinResult {
  dayGan: string;
  jinsinList: string[]; // 사주원국에 존재하는 진신 후보 (최대 4개)
  gasinList: string[]; // 사주원국에 존재하는 가신 후보 (최대 4개)
  summary: string;
}

interface JinsinCalculationOptions {
  debugMode?: boolean;
}

type Pillars = {
  year: string;
  month: string;
  day: string;
  hour: string;
};

const JINSIN_GASIN_MAP: Record<
  string,
  {
    jinsin: string[];
    gasin: string[];
  }
> = {
  甲: { jinsin: ["丙", "癸", "庚", "丁"], gasin: ["戊", "辛"] },
  乙: { jinsin: ["癸", "丙", "己"], gasin: ["庚", "辛"] },
  丙: { jinsin: ["壬", "甲", "乙"], gasin: ["辛", "癸", "戊"] },
  丁: { jinsin: ["甲", "庚"], gasin: ["己", "辛", "癸"] },
  戊: { jinsin: ["甲", "丙", "癸"], gasin: ["庚", "乙"] },
  己: { jinsin: ["丙", "癸"], gasin: ["壬"] },
  庚: { jinsin: ["丁", "甲", "壬"], gasin: ["庚", "癸"] },
  辛: { jinsin: ["丙", "壬", "己"], gasin: ["丁", "乙", "戊"] },
  壬: { jinsin: ["戊", "甲", "丙", "庚"], gasin: ["己"] },
  癸: { jinsin: ["壬", "丙"], gasin: ["丁", "戊"] },
};

function getAllGansFromPillars(pillars: Pillars): string[] {
  return [pillars.year[0], pillars.month[0], pillars.day[0], pillars.hour[0]];
}

function selectMatches(
  candidates: string[],
  availableGans: string[],
  limit = 4
): string[] {
  const uniqueMatches: string[] = [];

  for (const gan of candidates) {
    if (availableGans.includes(gan) && !uniqueMatches.includes(gan)) {
      uniqueMatches.push(gan);
    }
    if (uniqueMatches.length >= limit) {
      break;
    }
  }

  return uniqueMatches;
}

export function calculateJinsin(
  pillars: Pillars,
  options: JinsinCalculationOptions = {}
): JinsinResult {
  const dayGan = pillars.day[0];
  const allGans = getAllGansFromPillars(pillars);
  const mapping = JINSIN_GASIN_MAP[dayGan] || { jinsin: [], gasin: [] };

  const jinsinList = selectMatches(mapping.jinsin, allGans);
  const gasinList = selectMatches(mapping.gasin, allGans);

  if (options.debugMode) {
    console.log("🔍 [진신] 일간:", dayGan);
    console.log("🔍 [진신] 사주원국 천간:", allGans.join(", "));
    console.log("🔍 [진신] 매핑 진신:", mapping.jinsin);
    console.log("🔍 [진신] 매핑 가신:", mapping.gasin);
    console.log("🔍 [진신] 확정 진신:", jinsinList);
    console.log("🔍 [진신] 확정 가신:", gasinList);
  }

  const summaryParts: string[] = [];
  if (jinsinList.length > 0) {
    summaryParts.push(`진신 ${jinsinList.join(", ")}`);
  }
  if (gasinList.length > 0) {
    summaryParts.push(`가신 ${gasinList.join(", ")}`);
  }

  return {
    dayGan,
    jinsinList,
    gasinList,
    summary:
      summaryParts.length > 0
        ? summaryParts.join(" / ")
        : "판별된 진신·가신이 없습니다.",
  };
}
