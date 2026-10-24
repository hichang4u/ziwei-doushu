/**
 * 出生钟表时间 → 排盘日 + 时辰支 —— 表单与分享链接共用的唯一入口。
 *
 * 之前 /chart（BirthForm.handleSubmit）与 /heming（share.ts formToBirthInfo）各写一套：
 * 前者晚子时不换日、真太阳时跨零点不换日；后者按钟表 23 点换日、不看真太阳时。
 * 同一生辰在两页排出不同的盘。现统一到这里，口径与 true-solar-time.ts 一致：
 *   · 中国：东八区钟表 + 经度修正 + 均时差（未选出生地则不校正）
 *   · 韩国：见 tz-kr.ts，真太阳时 / KST 钟表两种口径，所填按标准时还是当年夏令时读数由用户声明
 *   · 晚子时（校正后 23:00 起）按次日排盘；校正跨零点同样换日（resolveZiweiDayOffset）
 */

import {
  calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate, isValidGregorianDate,
  type LateZishiRule,
} from './true-solar-time';
import { koreaTrueSolarTime, toKstWallClock, type SeoulClockReading } from './tz-kr';

export type BirthCountry = 'CN' | 'KR';

/** 韩国路径口径：真太阳时（经度 + 均时差）/ KST 钟表（只折算历史偏移，不做经度修正） */
export type KoreaTimeRule = 'true-solar' | 'kst-wall';

export interface BirthClockInput {
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  unknownTime?: boolean;
  country?: BirthCountry;
  /** 未选出生地时不传：中国路径不校正，韩国真太阳时路径按首尔 */
  longitude?: number;
  koreaTimeRule?: KoreaTimeRule;
  /** 韩国：所填为当年夏令时钟表读数（默认按标准时） */
  koreaDstClock?: boolean;
  lateZishi?: LateZishiRule;
}

export type ResolvedBirthTime =
  | {
      ok: true;
      /** 排盘日（已含晚子时 / 跨零点换日） */
      year: number;
      month: number;
      day: number;
      /** 时辰支 0-11 */
      branch: number;
      /** 校正后的时刻（供界面展示）；unknownTime 时为 null */
      adjustedHour: number | null;
      adjustedMinute: number | null;
      /** 相对所填钟表的总校正量（分钟，含历史偏移折算 + 经度 + 均时差） */
      correctionMinutes: number;
      /** 韩国：出生时刻韩国正实行夏令时 */
      koreaDst: boolean;
      /** 韩国：出生日期处于 UTC+8:30 标准时时期（1908-1911 / 1954-1961），已自动折算 */
      korea0830: boolean;
      /** 韩国：夏令时结束日的重复钟表时刻，已取较早一刻 */
      ambiguous: boolean;
    }
  | { ok: false; reason: 'invalid-date' | 'gap' };

// +8:30 标准时时期：标准时读数解析为 510，按夏令时读数解析则为 570（1955-1960 夏季）
const is0830Era = (offsetMinutes: number) => offsetMinutes === 510 || offsetMinutes === 570;

export function resolveBirthTime(input: BirthClockInput): ResolvedBirthTime {
  const { year, month, day, clockHour, clockMinute } = input;
  if (!isValidGregorianDate(year, month, day)) return { ok: false, reason: 'invalid-date' };

  const base = { koreaDst: false, korea0830: false, ambiguous: false };
  if (input.unknownTime) {
    return { ok: true, year, month, day, branch: 0, adjustedHour: null, adjustedMinute: null, correctionMinutes: 0, ...base };
  }

  const lateZishi = input.lateZishi ?? 'next-day';
  const clockReading: SeoulClockReading = input.koreaDstClock ? 'actual' : 'standard';

  // 统一产出：以哪一天为基准日 + 该日的「校正后钟表」计算结果
  let baseDate = { year, month, day };
  let solar: ReturnType<typeof calculateTrueSolarTime>;
  let extraShift = 0; // KST 钟表口径下历史偏移折算的分钟数（真太阳时口径已含在 solar 里）

  if (input.country === 'KR' && input.koreaTimeRule === 'kst-wall') {
    const wall = toKstWallClock({ year, month, day, hour: clockHour, minute: clockMinute }, { clock: clockReading });
    if (!wall.ok) return wall;
    Object.assign(base, { koreaDst: wall.isDst, korea0830: is0830Era(wall.offsetMinutes), ambiguous: wall.ambiguous });
    baseDate = { year: wall.year, month: wall.month, day: wall.day };
    solar = calculateTrueSolarTime({ ...baseDate, clockHour: wall.hour, clockMinute: wall.minute });
    extraShift = wall.shiftMinutes;
  } else if (input.country === 'KR') {
    const k = koreaTrueSolarTime({ year, month, day, clockHour, clockMinute, longitude: input.longitude }, { clock: clockReading });
    if (!k.ok) return k;
    Object.assign(base, { koreaDst: k.isDst, korea0830: is0830Era(k.offsetMinutes), ambiguous: k.ambiguous });
    solar = k;
  } else {
    solar = calculateTrueSolarTime({ year, month, day, clockHour, clockMinute, longitude: input.longitude });
  }

  const date = shiftGregorianDate(baseDate, resolveZiweiDayOffset(solar, lateZishi));
  return {
    ok: true,
    ...date,
    branch: solar.branch,
    adjustedHour: solar.hour,
    adjustedMinute: solar.minute,
    correctionMinutes: extraShift + solar.totalCorrectionMinutes,
    ...base,
  };
}
