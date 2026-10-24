/**
 * 韩国出生时间口径 —— 历史 UTC 偏移 + 两种换算规则。
 *
 * 背景：韩国标准时并非一直是 UTC+9。IANA tzdata（Asia/Seoul）记录：
 *   · 1908-04-01 ~ 1911-12-31  UTC+8:30（此前为地方平时 +8:27:52）
 *   · 1948 ~ 1951 夏季          UTC+10（夏令时）
 *   · 1954-03-21 ~ 1961-08-09  UTC+8:30 标准时；其中 1955 ~ 1960 夏季 UTC+9:30（夏令时）
 *   · 1987、1988 夏季           UTC+10（夏令时）
 * 时辰两小时一档，30 分钟 / 1 小时的偏移足以让落在边界附近的人整盘换掉。
 *
 * 偏移一律取运行时 Intl（ICU 内置 tzdata），不手抄表：ICU 随 Node / 浏览器更新，
 * tzdata 本身是 public domain。
 *
 * 两种换算规则（韩国民间两种都有人用，由调用方选）：
 *   · KST 钟表口径 toKstWallClock     —— 把当年钟表读数折算成「UTC+9 钟表」读数，不做经度修正
 *   · 真太阳时口径 koreaTrueSolarTime —— 当年实际 UTC 偏移 + 经度修正 + 均时差
 *
 * 不存在 / 重复的钟表时刻：
 *   · 夏令时开始拨快时跳过的那一段（如 1987-05-10 02:00~02:59）不存在 → 返回 { ok: false, reason: 'gap' }，
 *     不悄悄挪到相邻时刻：多半是用户记录有误，应让界面提示。
 *   · 夏令时结束拨回时重复的那一段（如 1987-10-11 02:00~02:59）出现两次 → 取较早的那一刻
 *     （仍在夏令时内），并标 ambiguous: true 供界面提示。
 *
 * 夏令时读数还是标准时读数（clock 选项）：
 *   与 dst-cn.ts 同一立场 —— 我们无法知道用户报的是当年夏令时钟表读数，还是已换算过的标准时。
 *   · 'standard'（默认）：所填视为标准时，夏令时期间按去掉那一小时的偏移解析（UTC+10→+9、UTC+9:30→+8:30）
 *   · 'actual'：所填视为当年实际钟表读数，按 IANA 实际偏移解析
 *   +8:30 时期是当年的法定标准时，不是夏令时，两种选项下都会自动折算。
 */

import { calculateTrueSolarTime, type TrueSolarTimeInput, type TrueSolarTimeResult } from './true-solar-time';

export const SEOUL_TIME_ZONE = 'Asia/Seoul';
export const KST_OFFSET_MINUTES = 540;

/** 首尔市厅经度，未提供出生地经度时的真太阳时兜底 */
export const SEOUL_LONGITUDE = 126.978;

export interface LocalClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** 所填钟表读数的含义，见文件头注 */
export type SeoulClockReading = 'standard' | 'actual';

export interface SeoulResolveOptions {
  clock?: SeoulClockReading;
}

export type SeoulTimeResolution =
  | {
      ok: true;
      /** 该钟表时刻对应的 UTC 毫秒 */
      utcMs: number;
      /** 解析所用的 UTC 偏移（分钟，地方平时时期带小数）；clock='standard' 时已去掉夏令时那一小时 */
      offsetMinutes: number;
      /** 该时刻韩国是否正实行夏令时（UTC+10 / UTC+9:30），与 clock 选项无关，供界面提示 */
      isDst: boolean;
      /** 夏令时结束日重复出现的钟表时刻 */
      ambiguous: boolean;
    }
  | { ok: false; reason: 'gap' };

export type KstWallClockResult =
  | (LocalClock & {
      ok: true;
      offsetMinutes: number;
      isDst: boolean;
      ambiguous: boolean;
      /** 折算后相对输入钟表的平移量（分钟）：+8:30 时期 +30，clock='actual' 时夏令时 -60 / -30 */
      shiftMinutes: number;
    })
  | { ok: false; reason: 'gap' };

export type KoreaTrueSolarResult =
  | (TrueSolarTimeResult & { ok: true; offsetMinutes: number; isDst: boolean; ambiguous: boolean })
  | { ok: false; reason: 'gap' };

// 夏令时的两档偏移；+8:30 与 +9 是标准时，+8:27:52 是 1908 年前的地方平时
const DST_OFFSET_SECONDS = new Set([600 * 60, 570 * 60]);

let offsetFormatter: Intl.DateTimeFormat | undefined;

/** 某一 UTC 时刻首尔的 UTC 偏移（秒）。用秒是为了让 1908 年前的 +8:27:52 也是整数。 */
function seoulOffsetSecondsAt(utcMs: number): number {
  offsetFormatter ??= new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    timeZoneName: 'longOffset',
  });
  const name = offsetFormatter.formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName')?.value ?? '';
  // 形如 GMT+09:00 / GMT+08:27:52 / GMT
  const m = /^GMT(?:([+-])(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(name);
  if (!m) throw new Error(`unexpected Asia/Seoul offset format: ${name}`);
  if (!m[1]) return 0;
  const seconds = Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] ?? 0);
  return m[1] === '-' ? -seconds : seconds;
}

/** 去掉夏令时那一小时后的「标准时」偏移（秒）：标准时偏移只在 1908/1912/1954/1961 换制时变化 */
function seoulStandardOffsetSecondsAt(utcMs: number): number {
  const offset = seoulOffsetSecondsAt(utcMs);
  return DST_OFFSET_SECONDS.has(offset) ? offset - 3600 : offset;
}

/**
 * 把首尔当地钟表时刻还原成 UTC。
 *
 * 做法：钟表读数当成 UTC 得到 naive；真实时刻 = naive - 偏移，而偏移只可能是 naive 前后
 * 半天内出现过的值（首尔一天内至多一次切换）。逐个候选回代验证「候选 + 候选时刻的偏移 = naive」，
 * 0 个成立即钟表空档，2 个成立即重复时刻。clock='standard' 时把偏移函数换成标准时偏移，算法不变。
 */
export function resolveSeoulLocalTime(clock: LocalClock, opts: SeoulResolveOptions = {}): SeoulTimeResolution {
  const offsetAt = opts.clock === 'actual' ? seoulOffsetSecondsAt : seoulStandardOffsetSecondsAt;
  const naive = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  const HALF_DAY = 12 * 3600_000;
  const offsets = new Set([offsetAt(naive - HALF_DAY), offsetAt(naive + HALF_DAY)]);

  const hits: { utcMs: number; offset: number }[] = [];
  for (const offset of offsets) {
    const utcMs = naive - offset * 1000;
    if (offsetAt(utcMs) === offset) hits.push({ utcMs, offset });
  }
  if (hits.length === 0) return { ok: false, reason: 'gap' };

  hits.sort((a, b) => a.utcMs - b.utcMs);
  const { utcMs, offset } = hits[0];
  return {
    ok: true,
    utcMs,
    offsetMinutes: offset / 60,
    isDst: DST_OFFSET_SECONDS.has(seoulOffsetSecondsAt(utcMs)),
    ambiguous: hits.length > 1,
  };
}

/** KST 钟表口径：钟表读数 → 同一时刻的 UTC+9 钟表读数（不做经度修正）。 */
export function toKstWallClock(clock: LocalClock, opts: SeoulResolveOptions = {}): KstWallClockResult {
  const r = resolveSeoulLocalTime(clock, opts);
  if (!r.ok) return r;
  const kst = new Date(r.utcMs + KST_OFFSET_MINUTES * 60_000);
  return {
    ok: true,
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    offsetMinutes: r.offsetMinutes,
    isDst: r.isDst,
    ambiguous: r.ambiguous,
    shiftMinutes: KST_OFFSET_MINUTES - r.offsetMinutes,
  };
}

/**
 * 真太阳时口径：按出生当时的实际 UTC 偏移做经度修正 + 均时差。
 * 未给经度时按首尔市厅经度（与中国路径「无经度不校正」不同：韩国路径的意义就在于校正）。
 */
export function koreaTrueSolarTime(
  input: Omit<TrueSolarTimeInput, 'utcOffsetMinutes'>,
  opts: SeoulResolveOptions = {},
): KoreaTrueSolarResult {
  const r = resolveSeoulLocalTime({
    year: input.year, month: input.month, day: input.day,
    hour: input.clockHour, minute: input.clockMinute,
  }, opts);
  if (!r.ok) return r;
  const solar = calculateTrueSolarTime({
    ...input,
    longitude: input.longitude ?? SEOUL_LONGITUDE,
    utcOffsetMinutes: r.offsetMinutes,
  });
  return { ...solar, ok: true, offsetMinutes: r.offsetMinutes, isDst: r.isDst, ambiguous: r.ambiguous };
}
