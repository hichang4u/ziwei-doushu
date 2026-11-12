/**
 * 回归：入门辅助 —— 命宫类型（lib/i18n/star-types.ts）、杂曜分组（lib/ziwei/star-groups.ts）、宫位白话。
 *
 * ① 14 主星在中韩两份表里齐全，韩文不漏简体、中文不出现韩文。
 * ② 命宫类型：单星 / 双星 / 空宫借对宫，各取一例；并遍历一批盘，保证每张盘都能起出类型。
 * ③ 杂曜分组：六吉禄马、六煞不算杂曜；主星不算杂曜。
 * ④ 十二宫白话：中韩两份都覆盖引擎的 12 个宫名。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { STAR_TYPES, getMingType } from '../../lib/i18n/star-types';
import { AUX_STARS, SHA6_STARS, isMiscStar } from '../../lib/ziwei/star-groups';
import { MAJOR_STARS_KO } from '../../lib/i18n/terms-ko';
import { MESSAGES } from '../../lib/i18n';

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

if (bad) { console.log(`\n❌ easy-view 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ easy-view 回归全部通过');
