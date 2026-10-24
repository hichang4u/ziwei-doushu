/**
 * 回归：韩国出生时间口径（lib/ziwei/tz-kr.ts）+ 真太阳时时区参数化（lib/ziwei/true-solar-time.ts）。
 *
 * 方法沿用本仓的「神谕差分」：把 IANA tzdata（Asia/Seoul）1900-2026 的偏移切换点**独立誊写一遍**
 * 作为 oracle，在每个切换点前后逐分钟、外加全区间随机抽样，与被测实现比对。
 * oracle 不调用 Intl，所以运行时 ICU 的 tzdata 若改了历史记录，这里也会报出来。
 *
 * 为什么值得较真：韩国历史上有 UTC+8:30、UTC+9:30、UTC+10 三种非 +9 偏移，
 * 时辰两小时一档，差 30 分钟就可能整盘换掉。
 */
import {
  resolveSeoulLocalTime, toKstWallClock, koreaTrueSolarTime, SEOUL_LONGITUDE,
} from '../../lib/ziwei/tz-kr';
import { calculateTrueSolarTime } from '../../lib/ziwei/true-solar-time';

/* ── oracle：IANA Asia/Seoul 切换点 [UTC 时刻, 切换后偏移(秒)] ───────────── */
const LMT = 8 * 3600 + 27 * 60 + 52;
const H = (h: number, m = 0) => h * 3600 + m * 60;
// 依据 tzdata asia 文件 Zone Asia/Seoul（1908-04-01 / 1912-01-01 / 1954-03-21 / 1961-08-10 当地零点换制）
// 与 Rule ROK 夏令时，换算成 UTC 时刻
const ORACLE_TRANSITIONS: [string, number][] = [
  ['1908-03-31T15:32:08Z', H(8, 30)], ['1911-12-31T15:30Z', H(9)],
  ['1948-05-31T15:00Z', H(10)], ['1948-09-12T14:00Z', H(9)],
  ['1949-04-02T15:00Z', H(10)], ['1949-09-10T14:00Z', H(9)],
  ['1950-03-31T15:00Z', H(10)], ['1950-09-09T14:00Z', H(9)],
  ['1951-05-05T15:00Z', H(10)], ['1951-09-08T14:00Z', H(9)],
  ['1954-03-20T15:00Z', H(8, 30)],
  ['1955-05-04T15:30Z', H(9, 30)], ['1955-09-08T14:30Z', H(8, 30)],
  ['1956-05-19T15:30Z', H(9, 30)], ['1956-09-29T14:30Z', H(8, 30)],
  ['1957-05-04T15:30Z', H(9, 30)], ['1957-09-21T14:30Z', H(8, 30)],
  ['1958-05-03T15:30Z', H(9, 30)], ['1958-09-20T14:30Z', H(8, 30)],
  ['1959-05-02T15:30Z', H(9, 30)], ['1959-09-19T14:30Z', H(8, 30)],
  ['1960-04-30T15:30Z', H(9, 30)], ['1960-09-17T14:30Z', H(8, 30)],
  ['1961-08-09T15:30Z', H(9)],
  ['1987-05-09T17:00Z', H(10)], ['1987-10-10T17:00Z', H(9)],
  ['1988-05-07T17:00Z', H(10)], ['1988-10-08T17:00Z', H(9)],
];
const T = ORACLE_TRANSITIONS.map(([iso, off]) => [Date.parse(iso), off] as const);
const ORACLE_OFFSETS = [...new Set([LMT, ...T.map(([, o]) => o)])];

function oracleOffsetAt(utcMs: number): number {
  let off = LMT;
  for (const [at, o] of T) if (utcMs >= at) off = o;
  return off;
}

/** 钟表时刻 → 所有合法 UTC 时刻（升序）。空 = 空档，两个 = 重复。 */
function oracleResolve(y: number, mo: number, d: number, h: number, mi: number): number[] {
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  return ORACLE_OFFSETS
    .map((o) => naive - o * 1000)
    .filter((utc) => oracleOffsetAt(utc) * 1000 === naive - utc)
    .sort((a, b) => a - b);
}

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

function compareAt(localMs: number, mismatches: string[]): void {
  const t = new Date(localMs);
  const c = { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate(), hour: t.getUTCHours(), minute: t.getUTCMinutes() };
  const want = oracleResolve(c.year, c.month, c.day, c.hour, c.minute);
  const got = resolveSeoulLocalTime(c);
  const tag = `${c.year}-${c.month}-${c.day} ${c.hour}:${String(c.minute).padStart(2, '0')}`;
  if (want.length === 0) {
    if (got.ok) mismatches.push(`${tag} 应为空档，实得 utc=${new Date(got.utcMs).toISOString()}`);
    return;
  }
  if (!got.ok) { mismatches.push(`${tag} 实得空档，应为 ${new Date(want[0]).toISOString()}`); return; }
  const wantOffMin = (Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute) - want[0]) / 60_000;
  if (got.utcMs !== want[0]) mismatches.push(`${tag} utc 实得 ${new Date(got.utcMs).toISOString()} 应为 ${new Date(want[0]).toISOString()}`);
  if (got.offsetMinutes !== wantOffMin) mismatches.push(`${tag} 偏移 实得 ${got.offsetMinutes} 应为 ${wantOffMin}`);
  if (got.ambiguous !== (want.length > 1)) mismatches.push(`${tag} ambiguous 实得 ${got.ambiguous}`);
  const wantDst = wantOffMin === 600 || wantOffMin === 570;
  if (got.isDst !== wantDst) mismatches.push(`${tag} isDst 实得 ${got.isDst} 应为 ${wantDst}`);
}

/* ── ① 切换点前后 ±3 小时逐分钟差分 ─────────────────────────────── */
{
  const mismatches: string[] = []; let checked = 0;
  for (const [at, off] of T) {
    const localAt = at + off * 1000; // 切换后偏移下的当地钟表
    for (let dm = -240; dm <= 240; dm++) { compareAt(localAt + dm * 60_000, mismatches); checked++; }
  }
  if (mismatches.length) fail(`切换点逐分钟：${mismatches.length} 处不符，前 5 条 → ${mismatches.slice(0, 5).join('; ')}`);
  else ok(`${T.length} 个切换点 ±4h 逐分钟差分全一致（比对 ${checked} 个钟表时刻）`);
}

/* ── ② 1900-2026 随机抽样差分 ──────────────────────────────────── */
{
  const mismatches: string[] = []; let seed = 20261024;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const from = Date.UTC(1900, 0, 1), to = Date.UTC(2026, 11, 31, 23, 59);
  const N = 20000;
  for (let i = 0; i < N; i++) compareAt(from + Math.floor(rnd() * ((to - from) / 60_000)) * 60_000, mismatches);
  if (mismatches.length) fail(`随机抽样：${mismatches.length}/${N} 不符，前 5 条 → ${mismatches.slice(0, 5).join('; ')}`);
  else ok(`1900-2026 随机 ${N} 个钟表时刻差分全一致`);
}

/* ── ③ 具体案例：KST 钟表口径 ─────────────────────────────────── */
{
  const cases: [string, Parameters<typeof toKstWallClock>[0], string][] = [
    ['现代 +9 不变', { year: 2000, month: 1, day: 1, hour: 12, minute: 0 }, '2000-1-1 12:00 shift=0 dst=false'],
    ['1955 冬 +8:30 标准时', { year: 1955, month: 1, day: 10, hour: 12, minute: 0 }, '1955-1-10 12:30 shift=30 dst=false'],
    ['1956 夏 +9:30 夏令时', { year: 1956, month: 7, day: 15, hour: 11, minute: 0 }, '1956-7-15 10:30 shift=-30 dst=true'],
    ['1988 夏令时（奥运）', { year: 1988, month: 7, day: 1, hour: 0, minute: 30 }, '1988-6-30 23:30 shift=-60 dst=true'],
    ['1950 夏令时', { year: 1950, month: 6, day: 1, hour: 13, minute: 15 }, '1950-6-1 12:15 shift=-60 dst=true'],
    ['1987 结束日重复时刻取较早', { year: 1987, month: 10, day: 11, hour: 2, minute: 30 }, '1987-10-11 1:30 shift=-60 dst=true ambiguous'],
    ['1961-08-09 换制前一刻（折算跨日）', { year: 1961, month: 8, day: 9, hour: 23, minute: 50 }, '1961-8-10 0:20 shift=30 dst=false'],
    ['1961-08-10 换制后', { year: 1961, month: 8, day: 10, hour: 0, minute: 40 }, '1961-8-10 0:40 shift=0 dst=false'],
  ];
  for (const [name, input, want] of cases) {
    const r = toKstWallClock(input);
    const got = r.ok
      ? `${r.year}-${r.month}-${r.day} ${r.hour}:${String(r.minute).padStart(2, '0')} shift=${r.shiftMinutes} dst=${r.isDst}${r.ambiguous ? ' ambiguous' : ''}`
      : `gap`;
    if (got !== want) fail(`${name}：实得「${got}」应为「${want}」`); else ok(`${name}：${got}`);
  }
  for (const [name, input] of [
    ['1987-05-10 02:30 拨快空档', { year: 1987, month: 5, day: 10, hour: 2, minute: 30 }],
    ['1961-08-10 00:15 换制空档', { year: 1961, month: 8, day: 10, hour: 0, minute: 15 }],
    ['1908-04-01 00:01 换制空档', { year: 1908, month: 4, day: 1, hour: 0, minute: 1 }],
  ] as const) {
    const r = toKstWallClock(input);
    if (r.ok) fail(`${name}：应返回 gap，实得 ${r.hour}:${r.minute}`); else ok(`${name}：gap`);
  }
}

/* ── ④ 真太阳时：中国路径不变 + 韩国路径按当年偏移 ──────────────────── */
{
  // 中国路径：不传 utcOffsetMinutes 必须与旧式 (longitude - 120) * 4 逐位相同
  let seed = 7; let diffs = 0;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 5000; i++) {
    const input = {
      year: 1900 + Math.floor(rnd() * 127), month: 1 + Math.floor(rnd() * 12), day: 1 + Math.floor(rnd() * 28),
      clockHour: Math.floor(rnd() * 24), clockMinute: Math.floor(rnd() * 60), longitude: 73 + rnd() * 62,
    };
    const r = calculateTrueSolarTime(input);
    if (r.longitudeCorrectionMinutes !== (input.longitude - 120) * 4) diffs++;
    const r480 = calculateTrueSolarTime({ ...input, utcOffsetMinutes: 480 });
    if (JSON.stringify(r) !== JSON.stringify(r480)) diffs++;
  }
  if (diffs) fail(`中国路径：${diffs} 处与旧式不同`); else ok('中国路径：5000 例与旧式经度修正逐位相同');

  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const k1 = koreaTrueSolarTime({ year: 2000, month: 6, day: 1, clockHour: 12, clockMinute: 0, longitude: SEOUL_LONGITUDE });
  if (!k1.ok || !near(k1.longitudeCorrectionMinutes, (SEOUL_LONGITUDE - 135) * 4)) fail(`韩国 2000：经度修正应按 135°E，实得 ${k1.ok && k1.longitudeCorrectionMinutes}`);
  else ok(`韩国 2000 首尔：经度修正 ${k1.longitudeCorrectionMinutes.toFixed(2)} 分（中央经线 135°E）`);

  const k2 = koreaTrueSolarTime({ year: 1956, month: 7, day: 15, clockHour: 12, clockMinute: 0 });
  if (!k2.ok || !near(k2.longitudeCorrectionMinutes, (SEOUL_LONGITUDE - 142.5) * 4) || !k2.isDst) fail(`韩国 1956 夏令时：应按 142.5°E 且 isDst，实得 ${JSON.stringify(k2)}`);
  else ok(`韩国 1956 夏令时：未给经度按首尔兜底，经度修正 ${k2.longitudeCorrectionMinutes.toFixed(2)} 分（中央经线 142.5°E）`);

  const k3 = koreaTrueSolarTime({ year: 1955, month: 1, day: 10, clockHour: 12, clockMinute: 0, longitude: SEOUL_LONGITUDE });
  if (!k3.ok || !near(k3.longitudeCorrectionMinutes, (SEOUL_LONGITUDE - 127.5) * 4)) fail(`韩国 1955 +8:30：应按 127.5°E，实得 ${k3.ok && k3.longitudeCorrectionMinutes}`);
  else ok(`韩国 1955 +8:30：经度修正 ${k3.longitudeCorrectionMinutes.toFixed(2)} 分（中央经线 127.5°E）`);

  const k4 = koreaTrueSolarTime({ year: 1987, month: 5, day: 10, clockHour: 2, clockMinute: 30 });
  if (k4.ok) fail('韩国 1987 空档：应返回 gap'); else ok('韩国 1987-05-10 02:30：gap 透传');
}

/* ── ⑤ 变异测试：oracle 若被改动一处，差分必须报错（证明 ① 抓得住错）──── */
{
  const saved = T[T.length - 1];
  (T as unknown as (readonly [number, number])[])[T.length - 1] = [saved[0] + 3600_000, saved[1]]; // 1988 夏令时结束晚 1 小时
  const mismatches: string[] = [];
  const localAt = saved[0] + saved[1] * 1000;
  for (let dm = -240; dm <= 240; dm++) compareAt(localAt + dm * 60_000, mismatches);
  (T as unknown as (readonly [number, number])[])[T.length - 1] = saved;
  if (mismatches.length === 0) fail('变异测试：篡改 oracle 后差分仍全一致，差分无效');
  else ok(`变异测试：篡改 1988 结束时刻后差分报出 ${mismatches.length} 处`);
}

if (bad) { console.log(`\n❌ tz-kr 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ tz-kr 回归全部通过');
