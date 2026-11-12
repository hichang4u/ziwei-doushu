'use client';
import { SI_HUA_TABLE } from '@/lib/ziwei/constants';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { useLocale } from './LocaleProvider';

export type TimeView = 'mingpan' | 'daxian' | 'liunian';

interface TimeNavProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
}

/** 由年份计算天干索引 (0-9) */
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/** 根据天干索引返回四化映射：starName → SiHua */
export function buildSiHuaOverlay(stemIndex: number): Record<string, string> {
  const stars = SI_HUA_TABLE[stemIndex];
  if (!stars) return {};
  return {
    [stars[0]]: '禄',
    [stars[1]]: '权',
    [stars[2]]: '科',
    [stars[3]]: '忌',
  };
}

/**
 * 本命 / 大限 / 流年 切换（分段按钮）。叠加四化的说明行由 ChartBoard 在盘面上方显示。
 * 状态由 /chart 页持有：盘面叠加与「复制给 AI」的流年年份共用同一份。
 */
export default function TimeNav({
  chart,
  view,
  liunianYear,
  onViewChange,
  onYearChange,
}: TimeNavProps) {
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const { m } = useLocale();
  const shiftYear = (d: number) => { onYearChange(liunianYear + d); if (view !== 'liunian') onViewChange('liunian'); };

  return (
    <div
      role="tablist"
      className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
    >
      <TabButton active={view === 'mingpan'} onClick={() => onViewChange('mingpan')}>
        {m.timeNav.natal}
      </TabButton>
      <TabButton active={view === 'daxian'} onClick={() => onViewChange('daxian')}>
        {currentDx ? m.timeNav.daXianRange(currentDx.startAge, currentDx.endAge) : m.timeNav.daXian}
      </TabButton>
      {/* 流年 — 含年份切换 */}
      <div
        className="flex items-center rounded-md transition-colors"
        style={view === 'liunian' ? ACTIVE_STYLE : INACTIVE_STYLE}
      >
        <button
          type="button"
          aria-label="-1"
          onClick={() => shiftYear(-1)}
          className="min-w-[36px] min-h-[36px] text-[14px] leading-none"
          style={{ color: 'var(--t-faint)' }}
        >
          ‹
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'liunian'}
          onClick={() => onViewChange('liunian')}
          className="py-2 text-[12px] font-medium tabular-nums"
        >
          {m.timeNav.liuNian} {liunianYear}
        </button>
        <button
          type="button"
          aria-label="+1"
          onClick={() => shiftYear(1)}
          className="min-w-[36px] min-h-[36px] text-[14px] leading-none"
          style={{ color: 'var(--t-faint)' }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

const ACTIVE_STYLE = { background: 'var(--t-bg)', color: 'var(--t-gold)', boxShadow: 'var(--sh-xs)' };
const INACTIVE_STYLE = { background: 'transparent', color: 'var(--t-text2)' };

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="px-3 py-2 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap"
      style={active ? ACTIVE_STYLE : INACTIVE_STYLE}
    >
      {children}
    </button>
  );
}
