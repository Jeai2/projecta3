declare module "korean-lunar-calendar" {
  interface LunarCalendar {
    year: number;
    month: number;
    day: number;
    intercalation?: boolean;
  }
  interface SolarCalendar {
    year: number;
    month: number;
    day: number;
  }
  class KoreanLunarCalendar {
    setSolarDate(year: number, month: number, day: number): void;
    getLunarCalendar(): LunarCalendar;
    setLunarDate(year: number, month: number, day: number, intercalation: boolean): void;
    getSolarCalendar(): SolarCalendar;
  }
  export default KoreanLunarCalendar;
}
