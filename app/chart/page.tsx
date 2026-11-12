'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import PatternsCard from '@/components/PatternsCard';
import StarDetailPanel from '@/components/StarDetailPanel';
import MingSummaryCard from '@/components/MingSummaryCard';
import FlowCard from '@/components/FlowCard';
import type { TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import { useLocale } from '@/components/LocaleProvider';
import LocaleMeta from '@/components/LocaleMeta';
import type { BirthInfo, ZiweiChart, Palace, Star } from '@/lib/ziwei/types';

/**
 * 命盘页 —— 开源版「排盘引擎 Demo」
 *
 * 这是一个最小可运行示例：用本仓库的排盘引擎 generateChart() 配合基础 UI
 * 组件，渲染一张完整紫微命盘 + 基础解读，并支持本命 / 大限 / 流年切换。
 *
 * 说明：线上商业版的完整交互界面（重设计的新 UI、AI 流式解读、合盘、分享
 * 卡片等）不在开源范围内；但排盘内核——安星算法、四化、格局识别、古籍库——
 * 完全开放（见 lib/ziwei/*），可自由二次开发出你自己的界面。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedStar, setSelectedStar] = useState<{ star: Star; palaceName: string } | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());
  const { m } = useLocale();

  // ── 未起盘：展示出生信息表单 ──
  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <LocaleMeta ko={{ title: '자미두수 배반 · 자미 명반' }} />
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{m.chartPage.title}</h1>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          {m.chartPage.intro}
          <br />
          {m.chartPage.introNote}
        </p>
        <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
      </main>
    );
  }

  // ── 已起盘：命盘 + 解读 ──
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <LocaleMeta ko={{ title: '자미두수 배반 · 자미 명반' }} />
      <button
        type="button"
        onClick={() => { setChart(null); setSelectedPalace(null); setSelectedStar(null); }}
        className="mb-4 px-3 py-1.5 rounded-lg text-[13px] transition-colors"
        style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)', background: 'transparent' }}
      >
        {m.chartPage.back}
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
          gap: 20, alignItems: 'start',
        }}
      >
        <div>
          {/* 先给结论：命宫类型 + 当前大限，看不懂盘面也有收获 */}
          <MingSummaryCard chart={chart} />
          <div className="card-glass rounded-xl p-3 sm:p-4">
            <ChartBoard
              chart={chart}
              timeView={view}
              liunianYear={liunianYear}
              onTimeViewChange={setView}
              onLiunianYearChange={setLiunianYear}
              onPalaceSelect={setSelectedPalace}
              onStarSelect={(star, palace) => setSelectedStar({ star, palaceName: palace.name })}
            />
          </div>
          {/* 大限时间轴 + 流年要点 + 流月：年份与盘头的流年切换共用 */}
          <div style={{ marginTop: 16 }}>
            <FlowCard chart={chart} year={liunianYear} onYearChange={setLiunianYear} />
          </div>
          {/* 规则格局识别：不依赖 AI 接口，开源版也能看到 */}
          <div style={{ marginTop: 16 }}><PatternsCard chart={chart} /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StarDetailPanel
            star={selectedStar?.star ?? null}
            palaceName={selectedStar?.palaceName}
            onClose={() => setSelectedStar(null)}
          />
          <InsightPanel chart={chart} selectedPalace={selectedPalace} liunianYear={liunianYear} />
        </div>
      </div>
    </main>
  );
}
