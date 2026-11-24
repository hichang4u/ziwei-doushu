/**
 * 咨询模式脚本：把命盘上已经算出来的东西，按固定顺序串成一张张卡片。
 *
 * 不调用 AI，也不新增任何判断规则 —— 每一句都来自现成的数据：
 *   本性      命宫类型（star-types.ts）+ 身宫
 *   事业/钱财/感情  命宫主星详解的对应栏目（star-detail）+ 官禄 / 财帛 / 夫妻宫的主星与生年四化
 *   格局      patterns.ts 的判定结果
 *   这十年    当前大限的宫位 + 大限宫干四化的落宫
 *   今年      流年命宫 + 流年、流月四化的落宫（flow.ts）
 * 同一张盘、同一天，得到的脚本完全相同。界面上也写明这是固定文句的拼接。
 *
 * 朗读稿（speech: true）与显示稿走同一套逻辑，只是术语一律用纯韩文读音、去掉括号里的汉字。
 */
import type { ZiweiChart, Palace, SiHua } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import { STAR_DETAIL } from '@/lib/ziwei/star-detail';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';
import { getDaXianSiHua } from '@/lib/ziwei/sihua';
import { getYearFlow, getMonthFlows, type SihuaHit } from '@/lib/ziwei/flow';
import { MESSAGES, formatTerm, formatGanzhi, formatKoTerm, termText, type Locale, type TermStyle } from './index';
import { STAR_DETAIL_KO } from './star-detail-ko';
import { translatePattern, patternNameKo } from './patterns-ko';
import { STAR_TYPES, getMingType } from './star-types';

export type SpeakerId = 'ming' | 'lu' | 'yun';

export interface ConsultLine {
  text: string;
  /** quote：照录现成的详解 / 格局说明，界面上用引文样式 */
  kind: 'say' | 'quote';
  /** 引文出处（星名、格局名） */
  label?: string;
}

export interface ConsultCard {
  id: 'hello' | 'nature' | 'career' | 'wealth' | 'love' | 'patterns' | 'daxian' | 'year' | 'closing';
  speaker: SpeakerId;
  title: string;
  lines: ConsultLine[];
  /** 小字附注，不朗读 */
  note?: string;
}

export interface ConsultScript {
  cards: ConsultCard[];
  /** 五行局数（2 水 / 3 木 / 4 金 / 5 土 / 6 火），界面配色用 */
  element: number;
}

export interface ConsultOptions {
  /** 农历流年 */
  year: number;
  /** 当前农历月 1-12；不给则不出「这个月」一句 */
  month?: number;
  termStyle: TermStyle;
  /** 朗读稿：术语用纯读音，去掉括号里的汉字与书名号式引号 */
  speech?: boolean;
}

const LEVEL_RANK: Record<Pattern['level'], number> = { excellent: 0, good: 1, caution: 2, neutral: 3 };
const MAX_PATTERNS = 2;

/** 朗读稿清理：去掉带汉字的括号注、「」，「A × B」读成「A, B」 */
function forSpeech(text: string, locale: Locale): string {
  let s = text.replace(/[「」]/g, '').replace(/\s*×\s*/g, ', ');
  if (locale === 'ko') s = s.replace(/\s*\([^()]*[㐀-鿿][^()]*\)/g, '');
  return s.replace(/\s+([,.])/g, '$1').trim();
}

export function buildConsultScript(chart: ZiweiChart, locale: Locale, opts: ConsultOptions): ConsultScript {
  const m = MESSAGES[locale];
  const c = m.consult;
  const style: TermStyle = opts.speech ? 'hangul' : opts.termStyle;
  const t = (name: string) => termText(formatTerm(name, locale, style));
  const gz = (stem: number, branch: number) => termText(formatGanzhi(STEMS[stem] + BRANCHES[branch], locale, style));
  /** 宫名带「宫」字：부처궁(夫妻宮) / 夫妻宫（术语表里除命宫外都不带） */
  const pal = (name: string) => {
    const d = formatTerm(name, locale, style);
    if (name === '命宫') return termText(d);
    if (locale === 'zh') return `${d.main}宫`;
    if (style === 'hanja') return `${d.main}宮`;
    return termText({ main: `${d.main}궁`, sub: d.sub && `${d.sub}宮` });
  };
  const role = (palaceName: string) => m.easy.palaceShort[palaceName] ?? pal(palaceName);
  const list = (items: string[]) => items.join(c.listJoin);
  const fin = (s: string) => (opts.speech ? forSpeech(s, locale) : s);
  const say = (text: string): ConsultLine => ({ kind: 'say', text: fin(text) });
  const quote = (text: string, label?: string): ConsultLine => ({ kind: 'quote', text: fin(text), label: label && fin(label) });

  const types = STAR_TYPES[locale];
  const details = locale === 'ko' ? STAR_DETAIL_KO : STAR_DETAIL;
  const { stars: mingStars, borrowedFrom, types: mingTypes } = getMingType(chart, locale);
  const mingStarNames = list(mingStars.map(t));
  const nick = mingTypes.length ? mingTypes.map((x) => x.nick).join(m.easy.typeJoiner) + m.easy.typeSuffix : '';
  const palaceByName = (name: string) => chart.palaces.find((p) => p.name === name);
  const starsWithKeywords = (stars: string[]) =>
    list(stars.map((s) => (types[s] ? c.starWithKeywords(t(s), list(types[s].keywords)) : t(s))));

  const cards: ConsultCard[] = [];

  /* ── 请坐 ── */
  cards.push({
    id: 'hello',
    speaker: 'ming',
    title: fin(c.hello.title),
    lines: [
      say(c.hello.open),
      say(borrowedFrom ? c.hello.borrowed(pal(borrowedFrom), mingStarNames) : c.hello.stars(mingStarNames)),
      say(c.hello.order),
    ],
    note: c.themeNote(t(chart.wuxingJuName), c.elements[chart.wuxingJu] ?? ''),
  });

  /* ── 本性 ── */
  {
    const lines: ConsultLine[] = [];
    if (nick) lines.push(say(c.nature.type(nick)));
    for (const x of mingTypes) lines.push(say(x.line));
    if (mingTypes.length) lines.push(say(c.nature.keywords(list(mingTypes.flatMap((x) => x.keywords)))));
    const shen = chart.palaces.find((p) => p.branch === chart.shenGongBranch);
    if (shen) lines.push(say(shen.branch === chart.mingGongBranch ? c.nature.shenSame : c.nature.shen(pal(shen.name), role(shen.name))));
    cards.push({ id: 'nature', speaker: 'ming', title: fin(c.nature.title), lines });
  }

  /* ── 事业 / 钱财 / 感情：命宫主星详解的对应栏目 + 该事项所在宫的主星、生年四化 ── */
  const topic = (id: 'career' | 'wealth' | 'love', speaker: SpeakerId, field: 'career' | 'wealth' | 'relationship', palaceName: string) => {
    const lines: ConsultLine[] = [say(c.topics[id].lead(mingStarNames))];
    for (const s of mingStars) {
      const text = details[s]?.[field];
      if (text) lines.push(quote(text, mingStars.length > 1 ? t(s) : undefined));
    }
    const palace = palaceByName(palaceName);
    if (palace) {
      const majors = palace.stars.filter((s) => s.type === 'major').map((s) => s.name);
      if (majors.length) lines.push(say(c.palaceStars(pal(palace.name), role(palace.name), starsWithKeywords(majors))));
      else if (palace.borrowedStars?.length && palace.borrowedFromName) {
        lines.push(say(c.palaceBorrowed(pal(palace.name), role(palace.name), pal(palace.borrowedFromName), starsWithKeywords(palace.borrowedStars))));
      }
      for (const s of palace.stars) {
        if (s.siHua) lines.push(say(c.natalSihua(t(s.name), t(`化${s.siHua}`), m.easy.flow.sihuaMeaning[s.siHua] ?? '')));
      }
    }
    cards.push({ id, speaker, title: fin(c.topics[id].title), lines });
  };
  topic('career', 'lu', 'career', '官禄');
  topic('wealth', 'lu', 'wealth', '财帛');
  topic('love', 'yun', 'relationship', '夫妻');

  /* ── 格局：上格在前，最多讲两个 ── */
  {
    const all = detectPatterns(chart);
    const shown = [...all].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]).slice(0, MAX_PATTERNS);
    if (shown.length) {
      const lines: ConsultLine[] = [say(c.patterns.count(all.length, shown.length))];
      for (const p of shown) {
        if (locale === 'ko') {
          const n = patternNameKo(p.name);
          const label = n ? `${n.star ? `${t(n.star)} ` : ''}${termText(formatKoTerm(n.term, style))}` : p.name;
          lines.push(quote(translatePattern(p).description, label));
        } else lines.push(quote(p.description, p.name));
      }
      lines.push(say(c.patterns.more));
      cards.push({ id: 'patterns', speaker: 'ming', title: fin(c.patterns.title), lines });
    }
  }

  /* ── 这十年 ── */
  const hitLine = (
    hit: SihuaHit | undefined,
    tpl: (star: string, palace: string, role: string) => string,
  ): ConsultLine | null => (hit?.palace ? say(tpl(t(hit.star), pal(hit.palace.name), role(hit.palace.name))) : null);
  const locate = (transforms: Record<SiHua, string>, siHua: SiHua): SihuaHit => ({
    siHua,
    star: transforms[siHua],
    palace: chart.palaces.find((p: Palace) => p.stars.some((s) => s.name === transforms[siHua])) ?? null,
  });

  const dxIndex = chart.currentDaXianIndex;
  const dx = chart.daXians[dxIndex];
  if (dx) {
    const lines: ConsultLine[] = [say(c.daXian.now(dx.startAge, dx.endAge, pal(dx.palaceName), role(dx.palaceName)))];
    const sihua = getDaXianSiHua(chart, dxIndex);
    if (sihua) {
      for (const [siHua, tpl] of [['禄', c.daXian.lu], ['忌', c.daXian.ji]] as const) {
        const line = hitLine(locate(sihua.transforms, siHua), tpl);
        if (line) lines.push(line);
      }
    }
    const next = chart.daXians[dxIndex + 1];
    if (next) lines.push(say(c.daXian.next(next.startAge, pal(next.palaceName), role(next.palaceName))));
    cards.push({ id: 'daxian', speaker: 'yun', title: fin(c.daXian.title), lines });
  } else if (chart.daXians[0] && chart.currentAge < chart.daXians[0].startAge) {
    cards.push({ id: 'daxian', speaker: 'yun', title: fin(c.daXian.title), lines: [say(c.daXian.before(chart.daXians[0].startAge))] });
  }

  /* ── 今年 ── */
  const yearFlow = getYearFlow(chart, opts.year);
  const yearLu = yearFlow.hits.find((h) => h.siHua === '禄');
  {
    const lines: ConsultLine[] = [];
    if (yearFlow.mingPalace) {
      lines.push(say(c.year.head(opts.year, gz(yearFlow.stemIndex, yearFlow.branchIndex), pal(yearFlow.mingPalace.name), role(yearFlow.mingPalace.name))));
    }
    for (const line of [hitLine(yearLu, c.year.lu), hitLine(yearFlow.hits.find((h) => h.siHua === '忌'), c.year.ji)]) {
      if (line) lines.push(line);
    }
    if (opts.month) {
      const mo = getMonthFlows(chart, opts.year)[opts.month - 1];
      const up = mo?.hits.find((h) => h.siHua === '禄')?.palace;
      const down = mo?.hits.find((h) => h.siHua === '忌')?.palace;
      if (up && down) lines.push(say(c.year.month(opts.month, role(up.name), role(down.name))));
    }
    lines.push(say(c.year.rule));
    cards.push({ id: 'year', speaker: 'yun', title: fin(c.year.title), lines });
  }

  /* ── 小结 ── */
  {
    const parts: string[] = [];
    if (nick) parts.push(c.closing.sumType(nick));
    if (dx) parts.push(c.closing.sumDaXian(role(dx.palaceName)));
    if (yearLu?.palace) parts.push(c.closing.sumYear(role(yearLu.palace.name)));
    const lines: ConsultLine[] = [];
    if (parts.length) lines.push(say(c.closing.sum(parts)));
    lines.push(say(c.closing.fixed), say(c.closing.evidence));
    cards.push({ id: 'closing', speaker: 'ming', title: fin(c.closing.title), lines });
  }

  return { cards, element: chart.wuxingJu };
}
