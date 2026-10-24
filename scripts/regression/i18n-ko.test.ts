/**
 * 回归：韩文界面（lib/i18n）。
 *
 * ① 覆盖：随机排盘实际输出的全部星曜 / 宫名 / 五行局 / 亮度，以及四化表、干支，都有韩文条目
 *    —— 引擎加了新星而对照表没跟上时，这里先报错，而不是盘面上冒出一个简体字。
 * ② 写法：韩文只含韩文音节、汉字只含汉字；星曜宫名遵守두음법칙（词首不出现 ㄹ 声母）。
 * ③ 同音：纯韩文模式下 천월（天鉞/天月）、천상（天相/天傷）仍附汉字。
 * ④ 中文界面：所有术语原样返回，与加 i18n 之前逐字一致。
 * ⑤ 文案：ko.ts 与 zh.ts 键结构、函数参数个数逐一对应。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { STEMS, BRANCHES, SI_HUA_TABLE } from '../../lib/ziwei/constants';
import { formatTerm, formatGanzhi, termText } from '../../lib/i18n';
import {
  TERMS_KO, BRIGHTNESS_KO, MAJOR_STARS_KO, OTHER_STARS_KO, PALACES_KO, HANGUL_COLLISIONS,
} from '../../lib/i18n/terms-ko';
import { zh } from '../../lib/i18n/messages/zh';
import { ko } from '../../lib/i18n/messages/ko';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

/* ── ① 覆盖 ─────────────────────────────────────────────────── */
{
  const stars = new Set<string>(), palaces = new Set<string>(), ju = new Set<string>(), bright = new Set<string>();
  let seed = 3;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const c = generateChart({
      year: 1930 + Math.floor(rnd() * 97), month: 1 + Math.floor(rnd() * 12), day: 1 + Math.floor(rnd() * 28),
      hour: Math.floor(rnd() * 12), gender: rnd() < 0.5 ? 'male' : 'female',
    });
    ju.add(c.wuxingJuName);
    for (const p of c.palaces) {
      palaces.add(p.name);
      for (const s of p.stars) { stars.add(s.name); if (s.brightnessRaw) bright.add(s.brightnessRaw); }
    }
  }
  for (const row of Object.values(SI_HUA_TABLE)) row.forEach((s) => stars.add(s));
  const missing = [
    ...[...stars, ...palaces, ...ju].filter((n) => !TERMS_KO[n]),
    ...[...bright].filter((b) => !BRIGHTNESS_KO[b]),
    ...[...STEMS, ...BRANCHES].filter((g) => formatGanzhi(g, 'ko', 'hangul').main === g),
  ];
  if (missing.length) fail(`缺韩文条目：${missing.join(' ')}`);
  else ok(`覆盖：${N} 张盘的 ${stars.size} 星 / ${palaces.size} 宫 / ${ju.size} 局 / ${bright.size} 档亮度 + 干支全有韩文`);
}

/* ── ② 写法 ─────────────────────────────────────────────────── */
{
  const issues: string[] = [];
  for (const [zhName, t] of Object.entries({ ...TERMS_KO, ...BRIGHTNESS_KO })) {
    if (!/^[가-힣]+$/.test(t.ko)) issues.push(`${zhName} 韩文「${t.ko}」含非韩文音节`);
    if (!/^[一-鿿]+$/.test(t.hanja)) issues.push(`${zhName} 汉字「${t.hanja}」含非汉字`);
  }
  // 두음법칙：星曜 / 宫名词首不出现 ㄹ 声母（라 U+B77C ~ 맇 U+B9C7）
  for (const [zhName, t] of Object.entries({ ...MAJOR_STARS_KO, ...OTHER_STARS_KO, ...PALACES_KO })) {
    const c = t.ko.charCodeAt(0);
    if (c >= 0xb77c && c <= 0xb9c7) issues.push(`${zhName}「${t.ko}」词首 ㄹ，违反두음법칙`);
  }
  const spot: [string, string][] = [['禄存', '녹존'], ['铃星', '영성'], ['年解', '연해'], ['龙池', '용지'], ['龙德', '용덕'], ['化禄', '화록']];
  for (const [zhName, want] of spot) if (TERMS_KO[zhName]?.ko !== want) issues.push(`${zhName} 应为「${want}」，实为「${TERMS_KO[zhName]?.ko}」`);
  if (issues.length) fail(`写法：${issues.join('; ')}`);
  else ok('写法：韩文 / 汉字字符集正确，두음법칙抽检 6 项通过');
}

/* ── ③ 同音术语 ─────────────────────────────────────────────── */
{
  const want = ['天钺', '天月', '天相', '天伤'];
  const missingCollide = want.filter((n) => !HANGUL_COLLISIONS.has(n));
  const shown = want.map((n) => termText(formatTerm(n, 'ko', 'hangul')));
  const plain = termText(formatTerm('紫微', 'ko', 'hangul'));
  if (missingCollide.length || shown.some((s) => !s.includes('(')) || plain !== '자미') {
    fail(`同音：未识别 ${missingCollide.join(' ')}；纯韩文显示 ${shown.join(' ')} / 紫微→${plain}`);
  } else ok(`同音：纯韩文模式 ${shown.join(' ')}，非同音如 紫微→${plain}`);
}

/* ── ④ 中文界面原样 ─────────────────────────────────────────── */
{
  const changed = [...Object.keys(TERMS_KO), ...STEMS, ...BRANCHES, '甲子']
    .filter((n) => formatTerm(n, 'zh', 'hangul-hanja').main !== n || formatGanzhi(n, 'zh', 'hanja').main !== n);
  if (changed.length) fail(`中文界面被改动：${changed.join(' ')}`);
  else ok('中文界面：全部术语与干支原样返回');
}

/* ── ⑤ 文案键结构 ───────────────────────────────────────────── */
{
  const diffs: string[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (typeof a === 'function') {
      if (typeof b !== 'function') diffs.push(`${path} 应为函数`);
      else if (a.length !== b.length) diffs.push(`${path} 参数个数 ${b.length} ≠ ${a.length}`);
      return;
    }
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || b.length !== a.length) diffs.push(`${path} 数组长度不同`);
      return;
    }
    if (a && typeof a === 'object') {
      const ka = Object.keys(a), kb = Object.keys((b ?? {}) as object);
      for (const k of ka) if (!kb.includes(k)) diffs.push(`${path}.${k} 缺失`);
      for (const k of kb) if (!ka.includes(k)) diffs.push(`${path}.${k} 多余`);
      for (const k of ka) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)?.[k], `${path}.${k}`);
      return;
    }
    if (typeof b !== 'string' || b === '') diffs.push(`${path} 应为非空字符串`);
  };
  walk(zh, ko, 'ko');
  if (diffs.length) fail(`文案：${diffs.join('; ')}`);
  else ok('文案：ko.ts 与 zh.ts 键结构、函数参数个数一致');
}

if (bad) { console.log(`\n❌ i18n-ko 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ i18n-ko 回归全部通过');
