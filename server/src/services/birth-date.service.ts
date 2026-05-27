import type { CalendarType } from "../types/consultation";

export interface BirthDateCalculationInput {
  birthDate: string;
  calendarType: CalendarType;
  birthTime?: string;
  isLeapMonth?: boolean;
}

export interface ResolvedSolarBirthDate {
  date: Date;
  solarBirthDate: string;
  birthTime: string;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildBirthDate(date: string, time: string): Date {
  const result = new Date(`${date}T${time}:00`);
  if (Number.isNaN(result.getTime())) {
    throw new Error("유효하지 않은 생년월일입니다.");
  }
  return result;
}

function parseBirthDate(birthDate: string): [number, number, number] {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("유효하지 않은 음력 생년월일입니다.");
  }
  return [year, month, day];
}

function matchesLunarDate(
  lunar: { year: number; month: number; day: number; intercalation?: boolean },
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
): boolean {
  return (
    lunar.year === year &&
    lunar.month === month &&
    lunar.day === day &&
    lunar.intercalation === isLeapMonth
  );
}

/**
 * 입력된 음력 날짜가 실제 윤달 날짜로도 존재하는지 확인한다.
 * 평달과 윤달이 모두 성립하는 경우에만 사용자 확인이 필요하다.
 */
export async function isLunarLeapDateAvailable(birthDate: string): Promise<boolean> {
  const [year, month, day] = parseBirthDate(birthDate);
  const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
  const calendar = new KoreanLunarCalendar();
  const accepted = calendar.setLunarDate(year, month, day, true);
  return accepted && matchesLunarDate(calendar.getLunarCalendar(), year, month, day, true);
}

/**
 * 사용자가 입력한 양력/음력 생일을 기존 사주 엔진이 사용하는 양력 Date로 정규화한다.
 * 사주 엔진은 이 Date를 기준으로 입춘 이전/이후의 출생 연주를 산출한다.
 */
export async function resolveSolarBirthDate(
  input: BirthDateCalculationInput,
): Promise<ResolvedSolarBirthDate> {
  const birthTime = input.birthTime?.trim() || "12:00";
  let solarBirthDate = input.birthDate;

  if (input.calendarType === "lunar") {
    const [year, month, day] = parseBirthDate(input.birthDate);
    if (input.isLeapMonth === undefined && await isLunarLeapDateAvailable(input.birthDate)) {
      throw new Error("평달 또는 윤달 확인이 필요한 음력 생년월일입니다.");
    }
    const isLeapMonth = input.isLeapMonth === true;
    const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
    const calendar = new KoreanLunarCalendar();
    const accepted = calendar.setLunarDate(year, month, day, isLeapMonth);
    if (!accepted || !matchesLunarDate(calendar.getLunarCalendar(), year, month, day, isLeapMonth)) {
      throw new Error(isLeapMonth ? "존재하지 않는 음력 윤달 생년월일입니다." : "유효하지 않은 음력 생년월일입니다.");
    }
    const solar = calendar.getSolarCalendar();
    solarBirthDate = formatDate(solar.year, solar.month, solar.day);
  }

  return {
    date: buildBirthDate(solarBirthDate, birthTime),
    solarBirthDate,
    birthTime,
  };
}
