'use client';
import { useEffect, useRef, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import { getYearFlow, getMonthFlows, lunarYearMonthOf, type SihuaHit } from '@/lib/ziwei/flow';
import { getDaXianStartYear } from '@/lib/ziwei/yunxian-context';
import { termText } from '@/lib/i18n';
import { Term, useLocale } from './LocaleProvider';

interface FlowCardProps {
  chart: ZiweiChart;
  /** 农历流年，与盘头的流年切换共用 */
  year: number;
  onYearChange: (year: number) => void;
}

const SIHUA_COLORS: Record<string, string> = {
  禄: 'var(--lu)', 权: 'var(--quan)', 科: 'var(--ke)', 忌: 'var(--ji)',
};

/**
 * 运势走向：大限时间轴、所选流年的四化落宫、十二个流月的化禄 / 化忌落宫。
 * 只标落点、不评分（规则写在卡片底部），计算见 lib/ziwei/flow.ts。
 */
export default function FlowCard({ chart, year, onYearChange }: FlowCardProps) {
  const { m, termStr, ganzhi } = useLocale();
  const f = m.easy.flow;
  const role = (name: string) => m.easy.palaceShort[name] ?? '';
  const gz = (stem: number, branch: number) => termText(ganzhi(STEMS[stem] + BRANCHES[branch]));

  const yearFlow = getYearFlow(chart, year);
  const months = getMonthFlows(chart, year);

  // 「现在」依赖当前日期：挂载后再取，避免预渲染与水合时刻不同
  const [today, setToday] = useState<{ year: number; month: number } | null>(null);
  useEffect(() => { setToday(lunarYearMonthOf(new Date())); }, []);

  // 大限时间轴横向滚动：把当前大限滚到中间。只动时间轴自身的 scrollLeft，
  // 不用 scrollIntoView（会连带把整页滚到这张卡片）
  const trackRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const track = trackRef.current, cur = currentRef.current;
    if (track && cur) track.scrollLeft = cur.offsetLeft - track.offsetLeft - (track.clientWidth - cur.clientWidth) / 2;
  }, []);

  return (
    <section className="card-glass rounded-xl p-4" aria-label={f.title}>
      <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--t-text)' }}>{f.title}</h2>

      {/* ── 大限时间轴 ── */}
      <h3 className="text-[12px] mb-1.5" style={{ color: 'var(--t-faint)' }}>{f.daXianTitle}</h3>
      <ol ref={trackRef} className="flex gap-1.5 overflow-x-auto pb-2">
        {chart.daXians.map((dx, i) => {
          const current = i === chart.currentDaXianIndex;
          const past = chart.currentDaXianIndex >= 0 && i < chart.currentDaXianIndex;
          const startYear = getDaXianStartYear(chart, i);
          return (
            <li
              key={dx.startAge}
              ref={current ? currentRef : undefined}
              aria-current={current ? 'true' : undefined}
              className="flex-shrink-0 w-[92px] rounded-lg px-2 py-1.5"
              style={{
                border: `1px solid ${current ? 'var(--t-gold)' : 'var(--t-border)'}`,
                background: current ? 'var(--ac-bg)' : 'transparent',
                opacity: past ? 0.7 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-1 text-[13px] tabular-nums" style={{ color: current ? 'var(--t-gold)' : 'var(--t-text2)' }}>
                <span>{m.chart.ageRange(dx.startAge, dx.endAge)}</span>
                {current && <span className="text-[11px] font-bold">{f.now}</span>}
              </div>
              <div className="text-[13px] font-medium truncate" style={{ color: 'var(--t-text)' }}><Term name={dx.palaceName} /></div>
              <div className="text-[12px] truncate" style={{ color: 'var(--t-text2)' }}>{role(dx.palaceName)}</div>
              {startYear !== null && (
                <div className="text-[11px] tabular-nums" style={{ color: 'var(--t-faint)' }}>{f.fromYear(startYear)}</div>
              )}
            </li>
          );
        })}
      </ol>

      {/* ── 流年要点 ── */}
      <div className="flex items-center justify-between gap-2 mt-3 mb-1.5">
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--t-text)' }}>
          {f.yearTitle(year, gz(yearFlow.stemIndex, yearFlow.branchIndex))}
        </h3>
        <div className="flex gap-1">
          {([[-1, '‹', f.prevYear], [1, '›', f.nextYear]] as const).map(([d, glyph, label]) => (
            <button
              key={d}
              type="button"
              aria-label={label}
              onClick={() => onYearChange(year + d)}
              className="w-9 h-9 rounded-md text-[15px] leading-none"
              style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-1 text-[12px]">
        {yearFlow.mingPalace && (
          <li className="flex gap-2 flex-wrap">
            <span className="font-medium flex-shrink-0" style={{ color: 'var(--t-gold)' }}>{f.yearMing}</span>
            <span style={{ color: 'var(--t-text)' }}>
              <Term name={yearFlow.mingPalace.name} /><Role text={role(yearFlow.mingPalace.name)} />
            </span>
            <span style={{ color: 'var(--t-faint)' }}>{f.yearMingNote}</span>
          </li>
        )}
        {yearFlow.hits.map(hit => (
          <li key={hit.siHua} className="flex gap-2 flex-wrap">
            <span className="font-medium flex-shrink-0" style={{ color: SIHUA_COLORS[hit.siHua] }}>
              {termStr(`化${hit.siHua}`)}
            </span>
            <span style={{ color: 'var(--t-text)' }}>
              <Term name={hit.star} />
              {hit.palace && <> → <Term name={hit.palace.name} /><Role text={role(hit.palace.name)} /></>}
            </span>
            <span style={{ color: 'var(--t-faint)' }}>{f.sihuaMeaning[hit.siHua]}</span>
          </li>
        ))}
      </ul>

      {/* ── 流月 ── */}
      <h3 className="text-[12px] mt-4 mb-1.5" style={{ color: 'var(--t-faint)' }}>{f.monthTitle}</h3>
      <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {months.map(mo => {
          const current = today?.year === year && today.month === mo.month;
          return (
            <li
              key={mo.month}
              aria-current={current ? 'true' : undefined}
              className="rounded-lg px-2 py-1.5 text-[13px]"
              style={{
                border: `1px solid ${current ? 'var(--t-gold)' : 'var(--t-border)'}`,
                background: current ? 'var(--ac-bg)' : 'transparent',
              }}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-medium" style={{ color: current ? 'var(--t-gold)' : 'var(--t-text)' }}>
                  {f.monthLabel(mo.month)}{current && ` · ${f.now}`}
                </span>
                <span className="text-[11px] tabular-nums" style={{ color: 'var(--t-faint)' }}>
                  {f.solarFrom(mo.solarStart.month, mo.solarStart.day)}
                </span>
              </div>
              <MonthLine label={f.up} hit={mo.hits.find(h => h.siHua === '禄')} role={role} />
              <MonthLine label={f.down} hit={mo.hits.find(h => h.siHua === '忌')} role={role} />
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[13px] leading-snug" style={{ color: 'var(--t-faint)' }}>{f.rule}</p>
    </section>
  );
}

function Role({ text }: { text: string }) {
  if (!text) return null;
  return <span style={{ color: 'var(--t-text2)' }}> · {text}</span>;
}

/** 流月一行：「机会 钱财·收入」，title 里给出是哪颗星化禄 / 化忌 */
function MonthLine({ label, hit, role }: { label: string; hit?: SihuaHit; role: (name: string) => string }) {
  const { termStr } = useLocale();
  if (!hit?.palace) return null;
  return (
    <div
      className="flex gap-1.5 truncate"
      title={`${termStr(hit.star)} ${termStr(`化${hit.siHua}`)} → ${termStr(hit.palace.name)}`}
    >
      <span className="flex-shrink-0 font-medium" style={{ color: SIHUA_COLORS[hit.siHua] }}>{label}</span>
      <span className="truncate" style={{ color: 'var(--t-text2)' }}>{role(hit.palace.name) || termStr(hit.palace.name)}</span>
    </div>
  );
}
