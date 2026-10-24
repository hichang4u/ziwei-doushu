/**
 * 回归：出生钟表时间 → 排盘日 + 时辰支（lib/ziwei/birth-time.ts）。
 *
 * ① 中国路径、未选出生地：与旧 share.ts formToBirthInfo（钟表 23 点换日、时辰取钟表）逐例差分，
 *    证明 /heming 未选出生地的老盘不变。
 * ② 具体案例：真太阳时跨零点换日、晚子时、韩国两种口径、+8:30 时期、夏令时两种读数、空档。
 */
import { resolveBirthTime, type BirthClockInput } from '../../lib/ziwei/birth-time';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

/* ── ① 中国未选出生地：与旧实现差分 ─────────────────────────────── */
{
  /** 旧 share.ts formToBirthInfo 的口径，独立誊写 */
  function oldFormToBirth(y: number, m: number, d: number, h: number, mi: number) {
    if (h === 23) {
      const next = new Date(y, m - 1, d + 1);
      y = next.getFullYear(); m = next.getMonth() + 1; d = next.getDate();
    }
    const mins = h * 60 + mi;
    const branch = mins >= 1380 || mins < 60 ? 0 : Math.floor((mins - 60) / 120) + 1;
    return `${y}-${m}-${d} ${branch}`;
  }
  let seed = 11; const mismatches: string[] = [];
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const N = 5000;
  for (let i = 0; i < N; i++) {
    const t = new Date(Date.UTC(1900, 0, 1) + Math.floor(rnd() * 127 * 365.25) * 86400000);
    const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate();
    const h = Math.floor(rnd() * 24), mi = Math.floor(rnd() * 60);
    const r = resolveBirthTime({ year: y, month: m, day: d, clockHour: h, clockMinute: mi, country: 'CN' });
    const got = r.ok ? `${r.year}-${r.month}-${r.day} ${r.branch}` : r.reason;
    const want = oldFormToBirth(y, m, d, h, mi);
    if (got !== want) mismatches.push(`${y}-${m}-${d} ${h}:${mi} 实得 ${got} 应为 ${want}`);
  }
  if (mismatches.length) fail(`中国未选出生地差分：${mismatches.length}/${N} 不符，前 5 条 → ${mismatches.slice(0, 5).join('; ')}`);
  else ok(`中国未选出生地：${N} 例与旧 formToBirthInfo 逐例一致`);
}

/* ── ② 具体案例 ──────────────────────────────────────────────── */
{
  const SEOUL = undefined; // 韩国真太阳时未给经度 → 首尔兜底
  const cases: [string, BirthClockInput, string][] = [
    ['中国 未选出生地 晚子时换日', { year: 2000, month: 3, day: 15, clockHour: 23, clockMinute: 30, country: 'CN' }, '2000-3-16 子'],
    ['中国 未选出生地 早子时不换日', { year: 2000, month: 3, day: 15, clockHour: 0, clockMinute: 30, country: 'CN' }, '2000-3-15 子'],
    ['中国 北京 正午', { year: 2000, month: 6, day: 1, clockHour: 12, clockMinute: 0, country: 'CN', longitude: 116.4 }, '2000-6-1 午'],
    ['中国 乌鲁木齐 校正跨零点回前一日', { year: 2000, month: 1, day: 1, clockHour: 0, clockMinute: 30, country: 'CN', longitude: 87.6 }, '1999-12-31 亥'],
    ['中国 乌鲁木齐 回前一日晚子时→仍按本日', { year: 2000, month: 1, day: 1, clockHour: 1, clockMinute: 20, country: 'CN', longitude: 87.6 }, '2000-1-1 子'],
    ['韩国 真太阳时 首尔兜底 晚子时', { year: 2000, month: 6, day: 1, clockHour: 23, clockMinute: 40, country: 'KR', longitude: SEOUL }, '2000-6-2 子'],
    ['韩国 真太阳时 首尔 23:20 校正后仍属亥时', { year: 2000, month: 6, day: 1, clockHour: 23, clockMinute: 20, country: 'KR', longitude: 126.98 }, '2000-6-1 亥'],
    ['韩国 KST 钟表 23:20 属晚子时', { year: 2000, month: 6, day: 1, clockHour: 23, clockMinute: 20, country: 'KR', koreaTimeRule: 'kst-wall' }, '2000-6-2 子'],
    ['韩国 KST 钟表 1956 夏 标准时读数', { year: 1956, month: 7, day: 15, clockHour: 11, clockMinute: 0, country: 'KR', koreaTimeRule: 'kst-wall' }, '1956-7-15 午 dst 0830'],
    ['韩国 KST 钟表 1956 夏 夏令时读数', { year: 1956, month: 7, day: 15, clockHour: 11, clockMinute: 0, country: 'KR', koreaTimeRule: 'kst-wall', koreaDstClock: true }, '1956-7-15 巳 dst 0830'],
    ['韩国 KST 钟表 1955 冬 +8:30', { year: 1955, month: 1, day: 10, clockHour: 12, clockMinute: 45, country: 'KR', koreaTimeRule: 'kst-wall' }, '1955-1-10 未 0830'],
    ['韩国 真太阳时 1988 夏令时读数 跨零点回前一日', { year: 1988, month: 7, day: 1, clockHour: 0, clockMinute: 20, country: 'KR', longitude: 126.98, koreaDstClock: true }, '1988-6-30 亥 dst'],
    ['韩国 1987 拨快空档 标准时读数照常', { year: 1987, month: 5, day: 10, clockHour: 2, clockMinute: 30, country: 'KR' }, '1987-5-10 丑 dst'],
    ['韩国 1987 拨快空档 夏令时读数', { year: 1987, month: 5, day: 10, clockHour: 2, clockMinute: 30, country: 'KR', koreaDstClock: true }, 'gap'],
    ['时辰不详', { year: 2000, month: 3, day: 15, clockHour: 23, clockMinute: 30, unknownTime: true, country: 'KR' }, '2000-3-15 子'],
    ['日期不存在', { year: 2001, month: 2, day: 29, clockHour: 12, clockMinute: 0 }, 'invalid-date'],
  ];
  const BR = '子丑寅卯辰巳午未申酉戌亥';
  for (const [name, input, want] of cases) {
    const r = resolveBirthTime(input);
    const got = r.ok
      ? `${r.year}-${r.month}-${r.day} ${BR[r.branch]}${r.koreaDst ? ' dst' : ''}${r.korea0830 ? ' 0830' : ''}`
      : r.reason;
    if (got !== want) fail(`${name}：实得「${got}」应为「${want}」`); else ok(`${name}：${got}`);
  }
}

if (bad) { console.log(`\n❌ birth-time 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ birth-time 回归全部通过');
