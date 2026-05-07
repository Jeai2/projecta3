// src/services/seasonal-data.loader.ts

// 로딩된 데이터를 메모리에 저장하여, 중복 로딩을 방지하는 캐시(Cache)
const loadedDataCache: { [year: number]: { name: string; date: Date }[] } = {};

/**
 * 특정 년도에 해당하는 절기 데이터 파일을 동적으로 불러온다.
 * @param year 필요한 데이터의 년도 (e.g., 1985)
 * @returns 로드된 전체 절기 데이터가 담긴 객체
 */
export const getSeasonalDataForYear = async (
  year: number
): Promise<{ [year: number]: { name: string; date: Date }[] }> => {
  // 1. 이미 데이터가 로딩되었는지 캐시에서 확인
  if (loadedDataCache[year]) {
    return loadedDataCache;
  }

  // 2. 어떤 10년 단위 파일을 불러올지 결정 (예: 1985 -> 1980)
  const decade = Math.floor(year / 10) * 10;

  // 3. 동적 import() 구문을 사용하여 해당 파일을 비동기적으로 불러온다.
  //    이 부분이 바로 '해석의 시간'을 만들어내는 핵심 로직입니다.
  try {
    // 중요: 프로젝트의 경로 구조에 따라 '../data/seasonal...' 부분을 수정해야 할 수 있습니다.
    const dataModule = await import(`../data/seasonal/${decade}`);
    const decadeDataKey = `SEASONAL_DATA_${decade}S`;
    const newData = dataModule[decadeDataKey];

    // 4. 불러온 데이터를 캐시에 저장하고, 전체 데이터를 반환
    Object.assign(loadedDataCache, newData);
    return loadedDataCache;
  } catch (error) {
    console.error(
      `${decade}년대 절기 데이터를 불러오는 데 실패했습니다.`,
      error
    );
    return loadedDataCache; // 오류 발생 시, 현재까지 로드된 데이터라도 반환
  }
};

/**
 * 현재 로드된 전체 절기 데이터를 반환하는 함수
 * @returns 로드된 전체 절기 데이터
 */
export const getLoadedSeasonalData = () => {
  return loadedDataCache;
};

/**
 * 특정 연도의 절기 데이터를 동기적으로 가져오는 함수
 * @param year 연도
 * @returns 해당 연도의 절기 배열
 */
export const getSeasonalData = (
  year: number
): { name: string; date: Date }[] => {
  // 캐시에 이미 있으면 반환
  if (loadedDataCache[year]) {
    return loadedDataCache[year];
  }

  // 캐시에 없으면 해당 10년 단위 데이터를 동기적으로 로드
  const decade = Math.floor(year / 10) * 10;

  try {
    // 동기 require 사용 (서버 시작 시 이미 로드됨)
    const dataModule = require(`../data/seasonal/${decade}`);
    const decadeDataKey = `SEASONAL_DATA_${decade}S`;
    const newData = dataModule[decadeDataKey];

    // 캐시에 저장
    Object.assign(loadedDataCache, newData);

    return loadedDataCache[year] || [];
  } catch (error) {
    console.error(
      `${decade}년대 절기 데이터를 불러오는 데 실패했습니다.`,
      error
    );
    return [];
  }
};
