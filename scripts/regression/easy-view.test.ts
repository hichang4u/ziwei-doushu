/**
 * 回归：入门辅助 —— 命宫类型（lib/i18n/star-types.ts）、杂曜分组（lib/ziwei/star-groups.ts）、宫位白话。
 *
 * ① 14 主星在中韩两份表里齐全，韩文不漏简体、中文不出现韩文。
 * ② 命宫类型：单星 / 双星 / 空宫借对宫，各取一例；并遍历一批盘，保证每张盘都能起出类型。
 * ③ 杂曜分组：六吉禄马、六煞不算杂曜；主星不算杂曜。
 * ④ 十二宫白话：中韩两份都覆盖引擎的 12 个宫名。
 * ⑤ 运限落点（lib/ziwei/flow.ts）：流年命宫与流年四化落宫对照 rath/orrery 同盘；
 *    流月月干按五虎遁手推（丙年正月起庚寅），月初公历日对照 2026 年春节 2 月 17 日。
 * ⑥ 中国省名韩文表（lib/i18n/cn-provinces-ko.ts）：与 cities.ts 的省一一对应、互不重名、不含简体字。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { STAR_TYPES, getMingType } from '../../lib/i18n/star-types';
import { AUX_STARS, SHA6_STARS, isMiscStar } from '../../lib/ziwei/star-groups';
import { MAJOR_STARS_KO } from '../../lib/i18n/terms-ko';
import { MESSAGES } from '../../lib/i18n';
import { getYearFlow, getMonthFlows, lunarYearMonthOf } from '../../lib/ziwei/flow';
import { STEMS, BRANCHES } from '../../lib/ziwei/constants';
import { PROVINCES } from '../../lib/ziwei/cities';
import { CN_PROVINCES_KO } from '../../lib/i18n/cn-provinces-ko';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

const MAJORS = Object.keys(MAJOR_STARS_KO);
const SIMPLIFIED_ONLY = /[机阳贞阴贪门杀军辅钺禄马罗铃诰贵凤龙鸾华伤虚厨宫财迁仆庙闲权时历岁]/;
const HANGUL = /[가-힣]/;

/* ── ① 类型表 ─────────────────────────────────────────────────── */
{
  for (const locale of ['zh', 'ko'] as const) {
    const table = STAR_TYPES[locale];
    const missing = MAJORS.filter((s) => !table[s]);
    const extra = Object.keys(table).filter((s) => !MAJORS.includes(s));
    if (missing.length || extra.length) fail(`${locale} 类型表：缺 ${missing.join('、') || '无'}，多 ${extra.join('、') || '无'}`);
    else ok(`${locale} 类型表覆盖 14 主星`);
    const texts = Object.values(table).flatMap((t) => [t.nick, t.line, ...t.keywords]);
    if (texts.some((t) => !t.trim())) fail(`${locale} 类型表有空文本`);
    const nicks = Object.values(table).map((t) => t.nick);
    if (new Set(nicks).size !== nicks.length) fail(`${locale} 昵称有重复`); else ok(`${locale} 14 个昵称互不相同`);
    const wrong = locale === 'ko' ? texts.filter((t) => SIMPLIFIED_ONLY.test(t) || !HANGUL.test(t)) : texts.filter((t) => HANGUL.test(t));
    if (wrong.length) fail(`${locale} 类型表文字语言不对：${wrong.slice(0, 3).join(' / ')}`); else ok(`${locale} 类型表文字语言正确`);
  }
}

/* ── ② 命宫类型 ───────────────────────────────────────────────── */
{
  // 1990-05-15 巳时：命宫子，破军独坐（与 chart-text 回归同盘，对照 rath/orrery）
  const single = getMingType(generateChart({ year: 1990, month: 5, day: 15, hour: 5, gender: 'male' }), 'ko');
  if (single.stars.join() === '破军' && !single.borrowedFrom && single.types[0]?.nick === '개척자') ok('单星：破军 → 개척자');
  else fail(`单星：实得 ${JSON.stringify(single)}`);

  let dual: string | null = null, empty: string | null = null, checked = 0;
  for (let month = 1; month <= 12; month++) {
    for (let hour = 0; hour < 12; hour++) {
      const chart = generateChart({ year: 1990, month, day: 15, hour, gender: 'female' });
      const ming = chart.palaces.find((p) => p.branch === chart.mingGongBranch)!;
      const own = ming.stars.filter((s) => s.type === 'major').map((s) => s.name);
      const t = getMingType(chart, 'zh');
      checked++;
      if (t.types.length === 0 || t.types.length !== t.stars.length) { fail(`${month} 月 ${hour} 时：起不出类型 ${JSON.stringify(t)}`); continue; }
      if (own.length === 0) {
        if (!t.borrowedFrom || t.borrowedFrom !== ming.borrowedFromName) fail(`${month} 月 ${hour} 时：空宫未标借宫`);
        else empty ??= `${t.borrowedFrom}：${t.stars.join('、')}`;
      } else {
        if (t.borrowedFrom || t.stars.join() !== own.join()) fail(`${month} 月 ${hour} 时：非空宫却借宫或星不符`);
        if (own.length === 2) dual ??= own.join(' × ');
      }
    }
  }
  if (dual) ok(`双星：${dual}`); else fail('遍历中未遇到双星命宫');
  if (empty) ok(`空宫借对宫：${empty}`); else fail('遍历中未遇到空宫命宫');
  ok(`遍历 ${checked} 张盘，全部能起出类型`);
}

/* ── ③ 杂曜分组 ───────────────────────────────────────────────── */
{
  const chart = generateChart({ year: 1990, month: 5, day: 15, hour: 5, gender: 'male' });
  const all = chart.palaces.flatMap((p) => p.stars);
  const wrong = all.filter((s) => isMiscStar(s) && (s.type === 'major' || AUX_STARS.has(s.name) || SHA6_STARS.has(s.name)));
  const kept = all.filter((s) => !isMiscStar(s));
  const want = 14 + AUX_STARS.size + SHA6_STARS.size;
  if (wrong.length) fail(`误判为杂曜：${wrong.map((s) => s.name).join('、')}`);
  else if (kept.length !== want) fail(`精简后应剩 ${want} 颗（14 主星 + 8 + 6），实得 ${kept.length}`);
  else ok(`精简显示保留 ${kept.length} 颗：14 主星 + 六吉禄马 8 + 六煞 6`);
}

/* ── ④ 宫位白话 ───────────────────────────────────────────────── */
{
  const palaces = generateChart({ year: 1990, month: 5, day: 15, hour: 5, gender: 'male' }).palaces.map((p) => p.name);
  for (const locale of ['zh', 'ko'] as const) {
    const short = MESSAGES[locale].easy.palaceShort;
    const missing = palaces.filter((n) => !short[n]);
    if (missing.length || Object.keys(short).length !== 12) fail(`${locale} 宫位白话：缺 ${missing.join('、') || '无'}，共 ${Object.keys(short).length} 项`);
    else ok(`${locale} 宫位白话覆盖 12 宫`);
  }
}

/* ── ⑤ 运限落点 ───────────────────────────────────────────────── */
{
  const chart = generateChart({ year: 1990, month: 5, day: 15, hour: 5, gender: 'male' });
  const show = (hits: { siHua: string; star: string; palace: { name: string } | null }[]) =>
    hits.map((h) => `${h.siHua}${h.star}→${h.palace?.name ?? '无'}`).join(' ');

  const yf = getYearFlow(chart, 2026);
  const yGot = `${STEMS[yf.stemIndex]}${BRANCHES[yf.branchIndex]} 命宫=${yf.mingPalace?.name} ${show(yf.hits)}`;
  const yWant = '丙午 命宫=迁移 禄天同→子女 权天机→父母 科文昌→仆役 忌廉贞→迁移';
  if (yGot === yWant) ok(`2026 流年：${yGot}`); else fail(`2026 流年：实得「${yGot}」应为「${yWant}」`);

  const mf = getMonthFlows(chart, 2026);
  const stems = mf.map((m) => STEMS[m.stemIndex]).join('');
  const branches = mf.map((m) => BRANCHES[m.branchIndex]).join('');
  if (stems === '庚辛壬癸甲乙丙丁戊己庚辛' && branches === '寅卯辰巳午未申酉戌亥子丑') ok(`2026 流月干支：${stems} / ${branches}`);
  else fail(`2026 流月干支：实得 ${stems} / ${branches}`);
  const m1 = mf[0];
  const m1Got = `${m1.solarStart.year}-${m1.solarStart.month}-${m1.solarStart.day} ${show(m1.hits)}`;
  const m1Want = '2026-2-17 禄太阳→兄弟 权武曲→夫妻 科太阴→田宅 忌天同→子女';
  if (m1Got === m1Want) ok(`2026 正月：${m1Got}`); else fail(`2026 正月：实得「${m1Got}」应为「${m1Want}」`);
  const m12 = mf[11].solarStart;
  if (m12.year === 2027 && m12.month === 1) ok(`2026 腊月初一落在次年公历 ${m12.year}-${m12.month}-${m12.day}`);
  else fail(`2026 腊月初一：实得 ${m12.year}-${m12.month}-${m12.day}`);
  if (mf.every((m) => m.hits.every((h) => h.palace))) ok('流月四化星全部能在盘上找到落宫'); else fail('流月四化有星找不到落宫');

  const before = lunarYearMonthOf(new Date(2026, 1, 16)), after = lunarYearMonthOf(new Date(2026, 1, 17));
  if (before.year === 2025 && before.month === 12 && after.year === 2026 && after.month === 1) ok('春节前后农历年月换算');
  else fail(`春节前后：${JSON.stringify(before)} / ${JSON.stringify(after)}`);
}

/* ── ⑥ 中国省名韩文表 ─────────────────────────────────────────── */
{
  const names = PROVINCES.map((p) => p.name);
  const missing = names.filter((n) => !CN_PROVINCES_KO[n]);
  const extra = Object.keys(CN_PROVINCES_KO).filter((k) => !names.includes(k));
  const labels = Object.values(CN_PROVINCES_KO);
  if (missing.length || extra.length) fail(`省名韩文表：缺 ${missing.join('、') || '无'}，多 ${extra.join('、') || '无'}`);
  else ok(`省名韩文表覆盖 ${names.length} 个省级行政区`);
  if (new Set(labels).size !== labels.length) fail('省名韩文有重名（山西 / 陕西 应附汉字区分）'); else ok('省名韩文互不重名');
  const bad = labels.filter((l) => !HANGUL.test(l) || SIMPLIFIED_ONLY.test(l));
  if (bad.length) fail(`省名韩文含简体或无韩文：${bad.join('、')}`); else ok('省名韩文不含简体字');
}

if (bad) { console.log(`\n❌ easy-view 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ easy-view 回归全部通过');
