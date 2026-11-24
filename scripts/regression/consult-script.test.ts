/**
 * 回归：咨询模式脚本（lib/i18n/consult-script.ts）与配色（components/consult-theme.ts）。
 *
 * ① 内容：1990-05-15 巳时 男、流年 2026、农历 10 月 —— 命宫 / 身宫 / 生年四化 / 流年四化的期望值
 *    与 chart-text 回归同源（rath/orrery 同盘对照）。当前大限随运行日期变化，只断言结构。
 * ② 结构：卡片顺序与讲述人固定；空宫借对宫、双主星各取一例。
 * ③ 遍历一批盘：每张卡片都有内容，韩文不漏简体、中文不出现韩文，不出现 undefined。
 * ④ 朗读稿：韩文朗读稿里不留汉字、「」、×；与显示稿卡片一一对应。
 * ⑤ 配色：五行局 2–6 各有一组，正文与强调色在底色上的对比度 ≥ 7:1。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { buildConsultScript, type ConsultScript } from '../../lib/i18n/consult-script';
import { ELEMENT_THEMES, STAGE_TEXT, STAGE_TEXT_DIM, SPEAKER_COLORS } from '../../components/consult-theme';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

const OPTS = { year: 2026, month: 10, termStyle: 'hangul-hanja' as const };
const chart = generateChart({ year: 1990, month: 5, day: 15, hour: 5, gender: 'male' });
const ko = buildConsultScript(chart, 'ko', OPTS);
const zh = buildConsultScript(chart, 'zh', OPTS);
const textOf = (s: ConsultScript, id: string) => s.cards.find((c) => c.id === id)?.lines.map((l) => l.text).join('\n') ?? '';
const allText = (s: ConsultScript) => s.cards.flatMap((c) => [c.title, c.note ?? '', ...c.lines.flatMap((l) => [l.label ?? '', l.text])]).join('\n');

/* ── ① 内容 ─────────────────────────────────────────────────────── */
{
  const want: [string, string, string][] = [
    ['命宫主星', 'hello', '명궁의 주성은 파군(破軍)입니다.'],
    ['类型', 'nature', '한마디로 「개척자형」입니다.'],
    ['身宫', 'nature', '신궁은 부처궁(夫妻宮)에 있습니다. 나이가 들수록 「연애·결혼」 쪽에 무게가 실린다고 읽습니다.'],
    ['官禄宫主星', 'career', '「일·직업」 자리인 관록궁(官祿宮)의 주성은 다음과 같습니다. 탐랑(貪狼) — 욕망, 매력, 다재다능.'],
    ['财帛宫主星', 'wealth', '「돈·수입」 자리인 재백궁(財帛宮)의 주성은 다음과 같습니다. 칠살(七殺) — 결단, 독립, 추진.'],
    ['夫妻宫生年化权', 'love', '이 자리의 무곡(武曲)에는 태어난 해의 화권(化權) 표시가 붙어 있습니다. 주도권과 추진력이 실리는 곳이라는 뜻입니다.'],
    ['流年命宫', 'year', '올해는 2026년 병오(丙午)년입니다. 올해의 중심 무대는 천이궁(遷移宮), 곧 「바깥 활동」입니다.'],
    ['流年化禄', 'year', '올해의 기회는 「자녀·아랫사람」 쪽입니다. 유년 화록이 천동(天同)에 붙어 자녀궁(子女宮)에 들어갑니다.'],
    ['流年化忌', 'year', '올해 조심할 곳은 「바깥 활동」 쪽입니다. 유년 화기가 염정(廉貞)에 붙어 천이궁(遷移宮)에 들어갑니다.'],
  ];
  for (const [name, id, line] of want) {
    if (textOf(ko, id).split('\n').includes(line)) ok(name); else fail(`${name}：${id} 卡缺少「${line}」`);
  }
  if (textOf(zh, 'year').includes('今年的机会在「子女·下属」：流年化禄跟着天同，进了子女宫。')) ok('中文流年化禄');
  else fail('中文 year 卡缺少流年化禄一句');
  const quotes = ko.cards.find((c) => c.id === 'career')?.lines.filter((l) => l.kind === 'quote') ?? [];
  if (quotes.length === 1 && !quotes[0].label && quotes[0].text.startsWith('개척형 사업')) ok('事业：照录命宫主星详解（单星不标星名）');
  else fail('事业卡的引文不对');
  if (ko.element === 6 && ko.cards[0].note?.includes('화육국(火六局)')) ok('五行局 → 配色与附注'); else fail('五行局附注不对');
}

/* ── ② 结构 ─────────────────────────────────────────────────────── */
{
  const order = ko.cards.map((c) => `${c.id}:${c.speaker}`).join(' ');
  const wantOrder = 'hello:ming nature:ming career:lu wealth:lu love:yun patterns:ming daxian:yun year:yun closing:ming';
  if (order === wantOrder) ok('卡片顺序与讲述人'); else fail(`卡片顺序：${order}`);

  // 空命宫（借对宫）：1990-05-15 寅时盘命宫无主星
  const empties = Array.from({ length: 12 }, (_, h) => generateChart({ year: 1990, month: 5, day: 15, hour: h, gender: 'male' }))
    .filter((c) => !c.palaces.find((p) => p.branch === c.mingGongBranch)?.stars.some((s) => s.type === 'major'));
  if (empties.length === 0) fail('这一天 12 个时辰里没有空命宫的盘，换一个日期');
  else {
    const hello = textOf(buildConsultScript(empties[0], 'ko', OPTS), 'hello');
    if (/명궁에 주성이 없어, 맞은편 \S+궁\(\S+宮\)의 주성을 빌려 봅니다\. 빌려 온 별은 /.test(hello)) ok('空命宫：借对宫主星');
    else fail(`空命宫 hello 卡：${hello.replace(/\n/g, '⏎')}`);
  }

  // 双主星：引文标出星名
  const doubles = Array.from({ length: 12 }, (_, h) => generateChart({ year: 1990, month: 5, day: 15, hour: h, gender: 'male' }))
    .filter((c) => (c.palaces.find((p) => p.branch === c.mingGongBranch)?.stars.filter((s) => s.type === 'major').length ?? 0) === 2);
  if (doubles.length === 0) fail('这一天 12 个时辰里没有双主星命宫的盘，换一个日期');
  else {
    const career = buildConsultScript(doubles[0], 'ko', OPTS).cards.find((c) => c.id === 'career');
    const q = career?.lines.filter((l) => l.kind === 'quote') ?? [];
    if (q.length === 2 && q.every((l) => !!l.label)) ok('双主星：两段引文各标星名'); else fail(`双主星事业卡引文 ${q.length} 段`);
  }
}

/* ── ③ ④ 遍历 ───────────────────────────────────────────────────── */
{
  const SIMPLIFIED_ONLY = /[机阳贞阴贪门杀军辅钺禄马罗铃诰贵凤龙鸾华伤虚厨宫财迁仆庙闲权时历岁]/g;
  const HAN = /[㐀-鿿]/g;
  const problems = new Set<string>();
  let n = 0;
  for (const year of [1968, 1984, 1990, 2001]) {
    for (let month = 1; month <= 12; month += 2) {
      for (let hour = 0; hour < 12; hour += 2) {
        for (const gender of ['male', 'female'] as const) {
          const c = generateChart({ year, month, day: 9, hour, gender });
          n++;
          for (const locale of ['ko', 'zh'] as const) {
            const s = buildConsultScript(c, locale, OPTS);
            const sp = buildConsultScript(c, locale, { ...OPTS, speech: true });
            const text = allText(s);
            if (s.cards.some((k) => k.lines.length === 0 || !k.title || k.lines.some((l) => !l.text.trim()))) problems.add(`${locale} 有空卡片 / 空行`);
            if (/undefined|null|NaN/.test(text + allText(sp))) problems.add(`${locale} 出现 undefined / null / NaN`);
            if (s.cards.length < 7 || s.cards[0].id !== 'hello' || s.cards[s.cards.length - 1].id !== 'closing') problems.add(`${locale} 卡片数 ${s.cards.length}`);
            if (sp.cards.map((k) => k.id).join() !== s.cards.map((k) => k.id).join()) problems.add(`${locale} 朗读稿与显示稿卡片不一致`);
            if (locale === 'ko') {
              for (const ch of text.match(SIMPLIFIED_ONLY) ?? []) problems.add(`ko 显示稿漏简体字 ${ch}`);
              const spoken = sp.cards.flatMap((k) => [k.title, ...k.lines.flatMap((l) => [l.label ?? '', l.text])]).join('\n');
              for (const ch of spoken.match(HAN) ?? []) problems.add(`ko 朗读稿留有汉字 ${ch}`);
              if (/[「」×]/.test(spoken)) problems.add('ko 朗读稿留有「」或 ×');
            } else if (/[가-힣]/.test(text)) problems.add('zh 出现韩文');
          }
        }
      }
    }
  }
  if (problems.size) for (const p of problems) fail(p);
  else ok(`${n} 张盘 × 中韩 × 显示稿 / 朗读稿：结构完整、语言不串、朗读稿无汉字`);
}

/* ── ⑤ 配色 ─────────────────────────────────────────────────────── */
{
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const low: string[] = [];
  for (const ju of [2, 3, 4, 5, 6]) {
    const th = ELEMENT_THEMES[ju];
    if (!th) { low.push(`五行局 ${ju} 没有配色`); continue; }
    for (const bg of [th.from, th.to]) {
      for (const [name, fg, min] of [['正文', STAGE_TEXT, 7], ['强调色', th.accent, 7], ['次要文字', STAGE_TEXT_DIM, 4.5], ...Object.entries(SPEAKER_COLORS).map(([k, v]) => [`讲述人 ${k}`, v, 4.5] as const)] as const) {
        const r = ratio(fg, bg);
        if (r < min) low.push(`五行局 ${ju} ${name} ${fg} / ${bg} = ${r.toFixed(2)}（需 ≥ ${min}）`);
      }
    }
  }
  if (low.length) for (const l of low) fail(l); else ok('五行局 2–6 配色齐全，对比度达标');
}

if (bad) { console.log(`\n❌ consult-script 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ consult-script 回归全部通过');
