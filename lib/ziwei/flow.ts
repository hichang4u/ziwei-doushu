/**
 * 运限落点：某年 / 某月的四化落在本命盘哪一宫。盘面下方「流年要点 / 流月」用。
 *
 * 只做「落点」这一步，不评分、不判吉凶大小：
 *   流年 —— 年干四化（sihua.getLiuNianSiHua）；流年命宫 = 年支所在宫。
 *   流月 —— 月干四化（五虎遁，sihua.getLiuYueSiHua）；月支 = 寅起正月。
 * 闰月不单列：流月按 12 个常规农历月给出，起始公历日取该月初一。
 */
import { Lunar, Solar } from 'lunar-javascript';
import type { ZiweiChart, Palace, SiHua } from './types';
import { getLiuNianSiHua, getLiuYueSiHua, getYearBranchIndex } from './sihua';

export const SIHUA_ORDER: readonly SiHua[] = ['禄', '权', '科', '忌'];

export interface SihuaHit {
  siHua: SiHua;
  star: string;
  /** 该星所在的本命宫；盘上找不到该星时为 null */
  palace: Palace | null;
}

function locate(chart: ZiweiChart, transforms: Record<SiHua, string>): SihuaHit[] {
  return SIHUA_ORDER.map((siHua) => {
    const star = transforms[siHua];
    return { siHua, star, palace: chart.palaces.find((p) => p.stars.some((s) => s.name === star)) ?? null };
  });
}

export interface YearFlow {
  year: number;
  stemIndex: number;
  branchIndex: number;
  /** 流年命宫：年支所在的本命宫 */
  mingPalace: Palace | null;
  hits: SihuaHit[];
}

/** year 为农历流年（正月初一换年） */
export function getYearFlow(chart: ZiweiChart, year: number): YearFlow {
  const { stemIndex, transforms } = getLiuNianSiHua(year);
  const branchIndex = getYearBranchIndex(year);
  return {
    year,
    stemIndex,
    branchIndex,
    mingPalace: chart.palaces.find((p) => p.branch === branchIndex) ?? null,
    hits: locate(chart, transforms),
  };
}

export interface MonthFlow {
  /** 农历月 1-12 */
  month: number;
  stemIndex: number;
  /** 月支：寅起正月 */
  branchIndex: number;
  /** 该农历月初一对应的公历日期 */
  solarStart: { year: number; month: number; day: number };
  hits: SihuaHit[];
}

export function getMonthFlows(chart: ZiweiChart, year: number): MonthFlow[] {
  const yearStem = getLiuNianSiHua(year).stemIndex;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const { stemIndex, transforms } = getLiuYueSiHua(yearStem, month);
    const solar = Lunar.fromYmd(year, month, 1).getSolar();
    return {
      month,
      stemIndex,
      branchIndex: (month + 1) % 12,
      solarStart: { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() },
      hits: locate(chart, transforms),
    };
  });
}

/** 公历日期所在的农历年、月（闰月并入本月） */
export function lunarYearMonthOf(date: Date): { year: number; month: number } {
  const lunar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  return { year: lunar.getYear(), month: Math.abs(lunar.getMonth()) };
}
