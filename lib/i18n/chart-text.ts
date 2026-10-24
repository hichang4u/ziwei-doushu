/**
 * 命盘 → 纯文本：「复制给 AI 解读」用。开源版没有 /api/interpret，用户可把这段文本
 * 连同提问粘贴到任意 AI 对话里自行解读。
 *
 * 韩文固定用「한글(漢字)」写法（不跟随界面的 TermStyle）：同音星名（천상 天相 / 天傷）
 * 靠汉字区分，AI 也更容易对上古籍术语。中文直接用引擎简体名。
 */
import type { ZiweiChart, Palace, Star, SiHua } from '@/lib/ziwei/types';
import { STEMS, BRANCHES, SI_HUA_TABLE } from '@/lib/ziwei/constants';
import { formatTerm, formatGanzhi, termText, type Locale } from './index';
import { BRIGHTNESS_KO, BRANCHES_KO } from './terms-ko';

/** 传统宫序：从命宫逆排 */
const PALACE_ORDER = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const SIHUA_ORDER: SiHua[] = ['禄', '权', '科', '忌'];
/** 引擎的 Star.type 把杂曜也归进 lucky / sha，这里按星名重新分组 */
const LUCKY_STARS = new Set(['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马']);
const SHA_STARS = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']);

const YIN_YANG_KO: Record<string, string> = {
  阳男: '양남(陽男)', 阴男: '음남(陰男)', 阳女: '양녀(陽女)', 阴女: '음녀(陰女)',
};

interface Labels {
  header: string;
  solar: string;
  clockTime: (y: number, mo: number, d: number, h: number, mi: number) => string;
  date: (y: number, mo: number, d: number) => string;
  hourBranch: string;
  hour: (branch: string) => string;
  lunar: string;
  lunarDate: (y: number, mo: number, d: number, leap: boolean) => string;
  fourPillars: string;
  gender: string;
  male: string;
  female: string;
  mingGong: string;
  shenGong: string;
  wuxingJu: string;
  mingZhu: string;
  shenZhu: string;
  currentAge: string;
  age: (age: number) => string;
  currentDaXian: string;
  palacesHeader: string;
  daXianAge: (a: number, b: number) => string;
  shenMark: string;
  major: string;
  aux: string;
  sha: string;
  minor: string;
  empty: (from: string, stars: string) => string;
  natalSihua: string;
  daXianSihua: (range: string, stem: string) => string;
  liuNianHeader: (year: number, gz: string) => string;
  liuNianMing: (branch: string, palace: string) => string;
  liuNianSihua: string;
  daXianList: string;
  current: string;
  ageRange: (a: number, b: number) => string;
  joiner: string;
  /** 宫名后缀（命宫本身已带「宫」） */
  palaceSuffix: (name: string, label: string) => string;
}

const LABELS: Record<Locale, Labels> = {
  zh: {
    header: '【紫微斗数命盘】',
    solar: '公历（出生时刻）',
    clockTime: (y, mo, d, h, mi) => `${y}年${mo}月${d}日 ${h}时${String(mi).padStart(2, '0')}分`,
    date: (y, mo, d) => `${y}年${mo}月${d}日`,
    hourBranch: '排盘时辰',
    hour: (b) => `${b}时`,
    lunar: '农历',
    lunarDate: (y, mo, d, leap) => `${y}年${leap ? '闰' : ''}${mo}月${d}日`,
    fourPillars: '四柱',
    gender: '性别',
    male: '男',
    female: '女',
    mingGong: '命宫',
    shenGong: '身宫',
    wuxingJu: '五行局',
    mingZhu: '命主',
    shenZhu: '身主',
    currentAge: '当前年龄',
    age: (age) => `${age}岁（虚岁）`,
    currentDaXian: '当前大限',
    palacesHeader: '【十二宫】',
    daXianAge: (a, b) => `大限 ${a}–${b}岁`,
    shenMark: '身宫',
    major: '主星',
    aux: '六吉禄马',
    sha: '六煞',
    minor: '杂曜',
    empty: (from, stars) => `无（空宫，借对宫${from}的${stars}）`,
    natalSihua: '【生年四化】',
    daXianSihua: (range, stem) => `【当前大限四化】${range}，宫干${stem}`,
    liuNianHeader: (year, gz) => `【${year}年 ${gz} 流年】`,
    liuNianMing: (branch, palace) => `流年命宫：${branch}位 = 本命${palace}`,
    liuNianSihua: '流年四化',
    daXianList: '【大限顺序】',
    current: '← 当前',
    ageRange: (a, b) => `${a}–${b}岁`,
    joiner: '、',
    palaceSuffix: (name, label) => (name === '命宫' ? label : `${label}宫`),
  },
  ko: {
    header: '[자미두수 명반]',
    solar: '양력(출생 시각)',
    clockTime: (y, mo, d, h, mi) => `${y}년 ${mo}월 ${d}일 ${h}시 ${String(mi).padStart(2, '0')}분`,
    date: (y, mo, d) => `${y}년 ${mo}월 ${d}일`,
    hourBranch: '배반 시진',
    hour: (b) => { const t = BRANCHES_KO[b]; return t ? `${t.ko}시(${t.hanja}時)` : b; },
    lunar: '음력',
    lunarDate: (y, mo, d, leap) => `${y}년 ${leap ? '윤' : ''}${mo}월 ${d}일`,
    fourPillars: '사주',
    gender: '성별',
    male: '남',
    female: '여',
    mingGong: '명궁',
    shenGong: '신궁',
    wuxingJu: '오행국',
    mingZhu: '명주',
    shenZhu: '신주',
    currentAge: '현재 나이',
    age: (age) => `${age}세(세는나이)`,
    currentDaXian: '현재 대한',
    palacesHeader: '[12궁]',
    daXianAge: (a, b) => `대한 ${a}–${b}세`,
    shenMark: '신궁',
    major: '주성',
    aux: '육길·녹마',
    sha: '육살',
    minor: '잡성',
    empty: (from, stars) => `없음(공궁) — 대궁 ${from}의 ${stars}을(를) 빌려 봄`,
    natalSihua: '[생년사화]',
    daXianSihua: (range, stem) => `[현재 대한 사화] ${range}, 궁간 ${stem}`,
    liuNianHeader: (year, gz) => `[${year}년 ${gz} 유년]`,
    liuNianMing: (branch, palace) => `유년 명궁: ${branch} 자리 = 본명 ${palace}`,
    liuNianSihua: '유년사화',
    daXianList: '[대한 순서]',
    current: '← 현재',
    ageRange: (a, b) => `${a}–${b}세`,
    joiner: ', ',
    palaceSuffix: (name, label) => {
      if (name === '命宫') return label;
      // 「부처(夫妻)」→「부처궁(夫妻宮)」
      const m = label.match(/^(.+)\((.+)\)$/);
      return m ? `${m[1]}궁(${m[2]}宮)` : `${label}궁`;
    },
  },
};

export interface ChartTextOptions {
  /** 流年年份；省略则不输出流年段 */
  liunianYear?: number;
}

export function chartToText(chart: ZiweiChart, locale: Locale, opts: ChartTextOptions = {}): string {
  const L = LABELS[locale];
  const term = (zh: string) => termText(formatTerm(zh, locale, 'hangul-hanja'));
  const gz = (text: string) => termText(formatGanzhi(text, locale, 'hangul-hanja'));
  const palaceLabel = (name: string) => L.palaceSuffix(name, term(name));
  const brightness = (b: string) => (locale === 'ko' && BRIGHTNESS_KO[b] ? termText({ main: BRIGHTNESS_KO[b].ko, sub: BRIGHTNESS_KO[b].hanja }) : b);
  const sihuaName = (s: SiHua) => term(`化${s}`);
  const starText = (s: Star) => [term(s.name), s.brightnessRaw ? brightness(s.brightnessRaw) : '', s.siHua ? sihuaName(s.siHua) : '']
    .filter(Boolean).join(' ');
  const byBranch = (b: number) => chart.palaces.find((p) => p.branch === b);
  const palaceOfStar = (star: string) => chart.palaces.find((p) => p.stars.some((s) => s.name === star));
  const sihuaLine = (s: SiHua, star: string) => {
    const p = palaceOfStar(star);
    return `${sihuaName(s)}: ${term(star)} → ${p ? palaceLabel(p.name) : '—'}`;
  };

  const { birthInfo: bi, lunarInfo: li } = chart;
  const lines: string[] = [L.header];

  const o = bi.origInput;
  lines.push(`${L.solar}: ${o ? L.clockTime(o.year, o.month, o.day, o.clockHour, o.clockMinute) : L.date(bi.year, bi.month, bi.day)}`);
  lines.push(`${L.hourBranch}: ${L.hour(BRANCHES[bi.hour])}`);
  lines.push(`${L.lunar}: ${L.lunarDate(li.lunarYear, Math.abs(li.lunarMonth), li.lunarDay, li.isLeapMonth)}`);
  if (li.fourPillars) lines.push(`${L.fourPillars}: ${li.fourPillars.map(gz).join(' ')}`);
  const yy = chart.yinYangGender ? (locale === 'ko' ? YIN_YANG_KO[chart.yinYangGender] ?? chart.yinYangGender : chart.yinYangGender) : '';
  lines.push(`${L.gender}: ${bi.gender === 'male' ? L.male : L.female}${yy ? `, ${yy}` : ''}`);

  const shen = byBranch(chart.shenGongBranch);
  lines.push(`${L.mingGong}: ${gz(BRANCHES[chart.mingGongBranch])}`);
  if (shen) lines.push(`${L.shenGong}: ${gz(BRANCHES[shen.branch])}, ${palaceLabel(shen.name)}`);
  lines.push(`${L.wuxingJu}: ${term(chart.wuxingJuName)}`);
  if (chart.mingZhu) lines.push(`${L.mingZhu}: ${term(chart.mingZhu)}`);
  if (chart.shenZhu) lines.push(`${L.shenZhu}: ${term(chart.shenZhu)}`);
  lines.push(`${L.currentAge}: ${L.age(chart.currentAge)}`);
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (dx) lines.push(`${L.currentDaXian}: ${L.ageRange(dx.startAge, dx.endAge)} ${palaceLabel(dx.palaceName)}`);

  // ── 十二宫 ──
  lines.push('', L.palacesHeader);
  const ordered = PALACE_ORDER.map((n) => chart.palaces.find((p) => p.name === n)).filter((p): p is Palace => !!p);
  for (const p of ordered) {
    const head = [palaceLabel(p.name), gz(STEMS[p.stem] + BRANCHES[p.branch])];
    if (p.daXianAge) head.push(L.daXianAge(p.daXianAge[0], p.daXianAge[1]));
    if (p.isShenGong) head.push(L.shenMark);
    lines.push(head.join(' · '));
    const group = (pick: (s: Star) => boolean) => p.stars.filter(pick).map(starText).join(L.joiner);
    const major = group((s) => s.type === 'major');
    if (major) lines.push(`  ${L.major}: ${major}`);
    else if (p.borrowedFromName && p.borrowedStars?.length) {
      lines.push(`  ${L.major}: ${L.empty(palaceLabel(p.borrowedFromName), p.borrowedStars.map(term).join(L.joiner))}`);
    }
    const groups: [string, (s: Star) => boolean][] = [
      [L.aux, (s) => LUCKY_STARS.has(s.name)],
      [L.sha, (s) => SHA_STARS.has(s.name)],
      [L.minor, (s) => s.type !== 'major' && !LUCKY_STARS.has(s.name) && !SHA_STARS.has(s.name)],
    ];
    for (const [label, pick] of groups) {
      const s = group(pick);
      if (s) lines.push(`  ${label}: ${s}`);
    }
  }

  // ── 四化 ──
  lines.push('', L.natalSihua);
  for (const s of SIHUA_ORDER) {
    const p = chart.palaces.find((pp) => pp.stars.some((st) => st.siHua === s));
    const star = p?.stars.find((st) => st.siHua === s);
    if (star) lines.push(sihuaLine(s, star.name));
  }
  // 大限四化取大限宫的宫干（与 TimeNav 的叠加一致）
  const dxPalace = dx && byBranch(dx.palaceBranch);
  if (dx && dxPalace) {
    lines.push('', L.daXianSihua(L.ageRange(dx.startAge, dx.endAge), gz(STEMS[dxPalace.stem])));
    SI_HUA_TABLE[dxPalace.stem]?.forEach((star, i) => lines.push(sihuaLine(SIHUA_ORDER[i], star)));
  }

  // ── 流年 ──
  if (opts.liunianYear) {
    const y = opts.liunianYear;
    const stem = ((y - 4) % 10 + 10) % 10;
    const branch = ((y - 4) % 12 + 12) % 12;
    lines.push('', L.liuNianHeader(y, gz(STEMS[stem] + BRANCHES[branch])));
    const lp = byBranch(branch);
    if (lp) lines.push(L.liuNianMing(gz(BRANCHES[branch]), palaceLabel(lp.name)));
    lines.push(`${L.liuNianSihua}:`);
    SI_HUA_TABLE[stem]?.forEach((star, i) => lines.push(`  ${sihuaLine(SIHUA_ORDER[i], star)}`));
  }

  // ── 大限顺序 ──
  lines.push('', L.daXianList);
  chart.daXians.forEach((d, i) => {
    lines.push(`${L.ageRange(d.startAge, d.endAge)} ${palaceLabel(d.palaceName)}${i === chart.currentDaXianIndex ? ` ${L.current}` : ''}`);
  });

  return lines.join('\n');
}

/** 复制用：提问在前、命盘在后，粘贴一次即可提问 */
export function withChartData(question: string, chartText: string): string {
  return `${question.trim()}\n\n${chartText}`;
}
