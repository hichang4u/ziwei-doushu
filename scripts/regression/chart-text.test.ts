/**
 * 回归：命盘 → 「复制给 AI」纯文本（lib/i18n/chart-text.ts）。
 *
 * ① 内容：1990-05-15 巳时 男 —— 期望值取自 rath/orrery（sky.told.me）同一输入的盘面，独立对照。
 *    当前年龄 / 当前大限随运行日期变化，不断言。
 * ② 语言：韩文输出不得漏出简体字（应为「한글(漢字)」正体）；中文输出不得出现韩文。
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { chartToText, withChartData } from '../../lib/i18n/chart-text';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

const chart = generateChart({
  year: 1990, month: 5, day: 15, hour: 5, gender: 'male',
  origInput: { year: 1990, month: 5, day: 15, clockHour: 10, clockMinute: 30 },
});
const ko = chartToText(chart, 'ko', { liunianYear: 2026 });
const zh = chartToText(chart, 'zh', { liunianYear: 2026 });

/* ── ① 内容 ─────────────────────────────────────────────────────── */
{
  const want: [string, string][] = [
    ['出生时刻', '양력(출생 시각): 1990년 5월 15일 10시 30분'],
    ['时辰', '배반 시진: 사시(巳時)'],
    ['农历', '음력: 1990년 4월 21일'],
    ['命宫地支', '명궁: 자(子)'],
    ['身宫', '신궁: 술(戌), 부처궁(夫妻宮)'],
    ['五行局', '오행국: 화육국(火六局)'],
    ['命宫主星', '명궁(命宮) · 무자(戊子) · 대한 6–15세\n  주성: 파군(破軍)'],
    ['身宫标记', '부처궁(夫妻宮) · 병술(丙戌) · 대한 106–115세 · 신궁'],
    ['双主星', '천이궁(遷移宮) · 임오(壬午) · 대한 66–75세\n  주성: 염정(廉貞) 평(平), 천상(天相) 묘(廟)'],
    ['生年化禄', '화록(化祿): 태양(太陽) → 형제궁(兄弟宮)'],
    ['生年化权', '화권(化權): 무곡(武曲) → 부처궁(夫妻宮)'],
    ['生年化科', '화과(化科): 태음(太陰) → 전택궁(田宅宮)'],
    ['生年化忌', '화기(化忌): 천동(天同) → 자녀궁(子女宮)'],
    ['流年命宫', '유년 명궁: 오(午) 자리 = 본명 천이궁(遷移宮)'],
    ['流年化科', '  화과(化科): 문창(文昌) → 노복궁(奴僕宮)'],
    ['流年化忌', '  화기(化忌): 염정(廉貞) → 천이궁(遷移宮)'],
    ['六吉分组', '  육길·녹마: 좌보(左輔) 묘(廟), 우필(右弼) 묘(廟), 천월(天鉞) 왕(旺)'],
  ];
  for (const [name, line] of want) {
    if (ko.includes(line)) ok(name); else fail(`${name}：缺少「${line.replace(/\n/g, '⏎')}」`);
  }
  const palaceHeads = ko.split('\n').filter((l) => /^\S+궁\(.+宮\) · /.test(l));
  if (palaceHeads.length === 12) ok('十二宫齐全'); else fail(`宫数 ${palaceHeads.length}，应为 12`);
  if (zh.includes('命宫 · 戊子 · 大限 6–15岁') && zh.includes('化忌: 天同 → 子女宫')) ok('中文宫名 / 四化');
  else fail('中文输出缺少命宫或生年化忌行');
  const emptyChart = generateChart({ year: 1990, month: 5, day: 15, hour: 0, gender: 'male' });
  const emptyLine = '  주성: 없음(공궁) — 대궁 재백궁(財帛宮)의 태양(太陽), 태음(太陰)을(를) 빌려 봄';
  if (chartToText(emptyChart, 'ko').includes(emptyLine)) ok('空宫借对宫（子时盘福德宫）'); else fail(`空宫：缺少「${emptyLine}」`);
  const q = withChartData('  질문  ', ko);
  if (q.startsWith('질문\n\n[자미두수 명반]')) ok('提问在前、命盘在后'); else fail('withChartData 拼接顺序不对');
}

/* ── ② 语言 ─────────────────────────────────────────────────────── */
{
  const SIMPLIFIED_ONLY = /[机阳贞阴贪门杀军辅钺禄马罗铃诰贵凤龙鸾华伤虚厨宫财迁仆庙闲权时历岁]/g;
  const leaks = [...new Set(ko.match(SIMPLIFIED_ONLY) ?? [])];
  if (leaks.length) fail(`韩文输出漏出简体字：${leaks.join('')}`); else ok('韩文输出无简体字');
  if (/[가-힣]/.test(zh)) fail('中文输出出现韩文'); else ok('中文输出无韩文');
}

if (bad) { console.log(`\n❌ chart-text 回归失败 ${bad} 项`); process.exit(1); }
console.log('\n✅ chart-text 回归全部通过');
