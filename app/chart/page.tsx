'use client';
import { useEffect, useRef, useState } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import PatternsCard from '@/components/PatternsCard';
import StarDetailPanel from '@/components/StarDetailPanel';
import MingSummaryCard from '@/components/MingSummaryCard';
import FlowCard from '@/components/FlowCard';
import BasisNote from '@/components/BasisNote';
import type { TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { useLocale } from '@/components/LocaleProvider';
import LocaleMeta from '@/components/LocaleMeta';
import type { BirthInfo, ZiweiChart, Palace, Star } from '@/lib/ziwei/types';

/**
 * 出生信息只存在本标签页的 sessionStorage 里：刷新、点「重新排盘」后不用重填。
 * 不放进 URL —— 出生日期属于个人信息，URL 会进浏览器历史，也会被页面统计（Vercel Analytics）带走。
 * 结果页只在地址上加一个不含数据的 #result，让浏览器的后退键回到表单而不是离开本页。
 */
const FORM_STORAGE_KEY = 'ziwei-chart-form';
const RESULT_HASH = '#result';

function readSavedForm(): BirthFormState | null {
  try {
    const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' && typeof data.year === 'string' && data.year ? data as BirthFormState : null;
  } catch { return null; }
}

function chartFromForm(form: BirthFormState): ZiweiChart | null {
  try { return generateChart(formToBirthInfo(form)); } catch { return null; }
}

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
  const [savedForm, setSavedForm] = useState<BirthFormState | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedStar, setSelectedStar] = useState<{ star: Star; palaceName: string } | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());
  const { m } = useLocale();
  const formRef = useRef<BirthFormState | null>(null);
  // 本次会话里是否由我们 pushState 过 #result：是则「重新排盘」走 history.back()，保持历史栈一致
  const pushedResult = useRef(false);
  // 恢复完成前不写存储：表单（子组件）挂载时的首次同步先于本组件的恢复 effect，会用空表单盖掉上次的内容
  const restored = useRef(false);

  const showForm = () => { setChart(null); setSelectedPalace(null); setSelectedStar(null); };

  // 挂载：恢复上次填写的出生信息；地址带 #result 时直接恢复命盘
  useEffect(() => {
    const saved = readSavedForm();
    restored.current = true;
    if (saved) {
      formRef.current = saved;
      setSavedForm(saved);
      if (window.location.hash === RESULT_HASH) setChart(chartFromForm(saved));
    }
    const onPop = () => {
      const form = formRef.current;
      if (window.location.hash === RESULT_HASH && form) setChart(chartFromForm(form));
      else showForm();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleFormSave = (form: BirthFormState) => {
    formRef.current = form;
    if (!restored.current) return;
    try { sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form)); } catch { /* 隐私模式等：不保存也能用 */ }
  };

  const handleSubmit = (info: BirthInfo) => {
    setSavedForm(formRef.current);
    setChart(generateChart(info));
    if (window.location.hash !== RESULT_HASH) {
      window.history.pushState(null, '', RESULT_HASH);
      pushedResult.current = true;
    }
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (pushedResult.current && window.location.hash === RESULT_HASH) {
      window.history.back(); // popstate 里切回表单
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    showForm();
  };

  // ── 未起盘：展示出生信息表单 ──
  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 96px' }}>
        <LocaleMeta ko={{ title: '자미두수 배반 · 자미 명반' }} />
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{m.chartPage.title}</h1>
        <p style={{ color: 'var(--t-text2)', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          {m.chartPage.intro}
          <br />
          {m.chartPage.introNote}
        </p>
        {/* key：恢复出上次的填写内容后重新挂载表单，让 initialData 生效 */}
        <BirthForm
          key={savedForm ? 'restored' : 'empty'}
          initialData={savedForm ?? undefined}
          onFormSave={handleFormSave}
          onSubmit={handleSubmit}
        />
      </main>
    );
  }

  // ── 已起盘：命盘 + 解读 ──
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 96px' }}>
      <LocaleMeta ko={{ title: '자미두수 배반 · 자미 명반' }} />
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 px-3 py-2 rounded-lg text-[13px] transition-colors"
        style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)', background: 'transparent' }}
      >
        {m.chartPage.back}
      </button>

      {/* 窄屏单列（盘面在上、解读在下）；lg 起两列，右栏随滚动吸顶，点星后的详解始终在视野内 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div className="min-w-0">
          {/* 这张盘按哪个时刻、哪种口径排的 */}
          {savedForm && <BasisNote form={savedForm} />}
          {/* 先给结论：命宫类型 + 当前大限，看不懂盘面也有收获 */}
          <MingSummaryCard chart={chart} />
          <div className="card-glass rounded-xl p-2 sm:p-4">
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
          <div className="mt-4">
            <FlowCard chart={chart} year={liunianYear} onYearChange={setLiunianYear} />
          </div>
          {/* 规则格局识别：不依赖 AI 接口，开源版也能看到 */}
          <div className="mt-4"><PatternsCard chart={chart} /></div>
        </div>

        <aside className="min-w-0 flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          {selectedStar && (
            <>
              {/* 窄屏：星曜详解从底部弹出（右栏在页面最下方，原地显示用户看不到） */}
              <div
                className="fixed inset-0 z-40 lg:hidden"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                onClick={() => setSelectedStar(null)}
              />
              <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-[var(--bg-1)] p-2 lg:static lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0">
                <StarDetailPanel
                  star={selectedStar.star}
                  palaceName={selectedStar.palaceName}
                  onClose={() => setSelectedStar(null)}
                />
              </div>
            </>
          )}
          <InsightPanel chart={chart} selectedPalace={selectedPalace} liunianYear={liunianYear} />
        </aside>
      </div>
    </main>
  );
}
