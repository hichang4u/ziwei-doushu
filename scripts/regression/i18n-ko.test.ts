/**
 * 回归：韩文界面（lib/i18n）。
 *
 * ① 覆盖：随机排盘实际输出的全部星曜 / 宫名 / 五行局 / 亮度，以及四化表、干支，都有韩文条目
 *    —— 引擎加了新星而对照表没跟上时，这里先报错，而不是盘面上冒出一个简体字。
 * ② 写法：韩文只含韩文音节、汉字只含汉字；星曜宫名遵守두음법칙（词首不出现 ㄹ 声母）。
 * ③ 同音：纯韩文模式下 천월（天鉞/天月）、천상（天相/天傷）仍附汉字。
 * ④ 中文界面：所有术语原样返回，与加 i18n 之前逐字一致。
 * ⑤ 文案：ko.ts 与 zh.ts 键结构、函数参数个数逐一对应。
 * ⑥ AI 提示词：ko 与 zh 段落结构一致、ko 要求韩文作答、宫位主管表以引擎宫名为键。
 * ⑦ 格局译层：patterns.ts 固定字面量全有译文、实际排盘产出整条译完且动态规则全命中；星曜详解键齐全。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { STEMS, BRANCHES, SI_HUA_TABLE } from '../../lib/ziwei/constants';
import { formatTerm, formatGanzhi, termText } from '../../lib/i18n';
import {
  TERMS_KO, BRIGHTNESS_KO, MAJOR_STARS_KO, OTHER_STARS_KO, PALACES_KO, HANGUL_COLLISIONS,
} from '../../lib/i18n/terms-ko';
import { zh } from '../../lib/i18n/messages/zh';
import { ko } from '../../lib/i18n/messages/ko';
import { zhPrompts } from '../../lib/i18n/prompts/zh';
import { koPrompts } from '../../lib/i18n/prompts/ko';
import { readFileSync } from 'node:fs';
import { detectPatterns } from '../../lib/ziwei/patterns';
import {
  translatePatternText, translateSource, patternNameKo, PATTERN_NAMES_KO, TEXT_KO, DYNAMIC_RULES,
} from '../../lib/i18n/patterns-ko';
import { STAR_DETAIL_KO, STAR_DESCRIPTIONS_KO, AUX_STAR_NOTES_KO } from '../../lib/i18n/star-detail-ko';

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

/* ── ⑥ AI 提示词 ────────────────────────────────────────────── */
{
  const issues: string[] = [];
  const heads = (s: string) => (s.match(/\*\*【[^】]+】\*\*/g) ?? []).length;
  const pairs: [string, string, string][] = [
    ...(Object.keys(zhPrompts.topics) as (keyof typeof zhPrompts.topics)[])
      .map((k) => [`topic.${k}`, zhPrompts.topics[k], koPrompts.topics[k]] as [string, string, string]),
    ['palace', zhPrompts.palace('夫妻', 'r', 's'), koPrompts.palace('부처', 'r', 's')],
    ['sihua', zhPrompts.sihua('流年', '太阳', '化忌', '官禄'), koPrompts.sihua('유년', '태양', '화기', '관록')],
  ];
  for (const [name, z, k] of pairs) {
    if (heads(z) !== heads(k)) issues.push(`${name} 段落数 ko ${heads(k)} ≠ zh ${heads(z)}`);
    if (!k.startsWith('반드시 한국어로 답하세요')) issues.push(`${name} 缺韩文作答指令`);
  }
  // 宫位主管表须以引擎宫名为键（旧表写「兄弟宫」导致除命宫外全部查不到）
  for (const [label, roles] of [['zh', zhPrompts.palaceRoles], ['ko', koPrompts.palaceRoles]] as const) {
    const keys = Object.keys(roles).sort().join(' ');
    if (keys !== Object.keys(PALACES_KO).sort().join(' ')) issues.push(`${label} palaceRoles 键与引擎宫名不一致：${keys}`);
  }
  if (issues.length) fail(`提示词：${issues.join('; ')}`);
  else ok(`提示词：${pairs.length} 条 ko/zh 段落数一致、含韩文作答指令，宫位主管表键 = 引擎宫名`);
}

/* ── ⑦ 格局译层 ─────────────────────────────────────────────── */
{
  const issues: string[] = [];
  // (a) patterns.ts 识别器里的每条固定中文字面量都要有译文（键写错一个字这里就会报）
  const src = readFileSync('lib/ziwei/patterns.ts', 'utf8');
  const body = src.slice(src.indexOf('// ────────────────── 正格识别器'), src.indexOf('// ────────────────── 主入口'));
  // 反引号模板里的三目片段属于动态文本（由 DYNAMIC_RULES 整句处理），先剔掉再抽单引号字面量
  const literals = [...body.replace(/`[^`]*`/g, '').matchAll(/'([^'\n]*[一-鿿][^'\n]*)'/g)].map((m) => m[1]);
  const untranslated = [...new Set(literals)].filter((s) => {
    if (s.length <= 2) return false;                              // 星名 / 「命」「迁」等判定用短字面量
    if (/^《.+》$/.test(s)) return translateSource(s) === s;
    if (PATTERN_NAMES_KO[s]) return false;
    if (TERMS_KO[s]) return false;                                // 宫名等引擎术语
    return translatePatternText(s) === s;
  });
  if (untranslated.length) issues.push(`固定文本缺译 ${untranslated.length} 条：${untranslated.slice(0, 5).join(' | ')}`);

  // (b) 实际排盘产出的格局整条译完，动态规则全部命中
  let seed = 17;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const seenNames = new Set<string>(); const dynHit = new Set<number>(); let total = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const c = generateChart({
      year: 1930 + Math.floor(rnd() * 97), month: 1 + Math.floor(rnd() * 12), day: 1 + Math.floor(rnd() * 28),
      hour: Math.floor(rnd() * 12), gender: rnd() < 0.5 ? 'male' : 'female',
    });
    for (const p of detectPatterns(c)) {
      total++; seenNames.add(p.name);
      if (!patternNameKo(p.name)) issues.push(`格局名缺译：${p.name}`);
      const texts = [p.description, ...(p.conditions?.required ?? []), ...(p.conditions?.bonus ?? []), ...(p.conditions?.breaking ?? [])];
      for (const s of texts) {
        if (translatePatternText(s) === s) issues.push(`缺译：${s.slice(0, 30)}`);
        const idx = DYNAMIC_RULES.findIndex(([re]) => re.test(s));
        if (idx >= 0 && !TEXT_KO[s]) dynHit.add(idx);
      }
      if (p.source && translateSource(p.source) === p.source) issues.push(`出处缺译：${p.source}`);
    }
  }
  const dynMiss = DYNAMIC_RULES.map((_, i) => i).filter((i) => !dynHit.has(i));
  if (dynMiss.length) issues.push(`动态规则未被 ${N} 张盘命中（需补样本或规则已失配）：#${dynMiss.join(' #')}`);

  // (c) 星曜详解：14 主星齐全，辅煞简述覆盖 6 吉 + 禄马 + 6 煞
  const majors = Object.keys(MAJOR_STARS_KO).sort().join(' ');
  if (Object.keys(STAR_DETAIL_KO).sort().join(' ') !== majors) issues.push('STAR_DETAIL_KO 主星键不全');
  if (Object.keys(STAR_DESCRIPTIONS_KO).sort().join(' ') !== majors) issues.push('STAR_DESCRIPTIONS_KO 主星键不全');
  if (Object.keys(AUX_STAR_NOTES_KO).length !== 14) issues.push(`AUX_STAR_NOTES_KO 应 14 条，实 ${Object.keys(AUX_STAR_NOTES_KO).length}`);

  if (issues.length) fail(`格局 / 星曜：${[...new Set(issues)].slice(0, 8).join('; ')}`);
  else ok(`格局：源码固定文本 ${new Set(literals).size} 条全有译文；${N} 张盘 ${total} 条格局（${seenNames.size} 种）整条译完，动态规则 ${DYNAMIC_RULES.length} 条全命中；星曜详解键齐全`);
}

if (bad) { console.log(`\n❌ i18n-ko 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ i18n-ko 回归全部通过');
