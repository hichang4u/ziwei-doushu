'use client';
import { useRef, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { getMingType } from '@/lib/i18n/star-types';
import { Term, useLocale } from './LocaleProvider';
import TypeShareModal from './TypeShareModal';
import ConsultMode from './ConsultMode';

/**
 * 命宫结论卡：盘面上方先给一句话结论（类型昵称 + 关键词 + 当前大限 + 身宫）。
 * 「类型」只按命宫主星起名，属于入门用的趣味摘要，卡片上写明依据与局限。
 */
export default function MingSummaryCard({ chart }: { chart: ZiweiChart }) {
  const { locale, m, termStr } = useLocale();
  const e = m.easy;
  const { stars, borrowedFrom, types } = getMingType(chart, locale);
  const [shareOpen, setShareOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const consultBtn = useRef<HTMLButtonElement>(null);
  if (types.length === 0) return null;

  const dx = chart.daXians[chart.currentDaXianIndex];
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const role = (name: string) => e.palaceShort[name] ?? '';

  return (
    <section className="card-glass rounded-xl p-4 mb-4" aria-label={e.tag}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <span
            className="inline-block text-[12px] px-1.5 py-0.5 rounded-full mb-1.5"
            style={{ color: 'var(--t-faint)', border: '1px solid var(--t-border)' }}
          >
            {e.tag}
          </span>
          <h2 className="text-[22px] leading-tight font-bold" style={{ color: 'var(--t-gold)' }}>
            {types.map(t => t.nick).join(e.typeJoiner)}{e.typeSuffix}
          </h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.flatMap(t => t.keywords).map((k, i) => (
            <span
              key={`${k}-${i}`}
              className="text-[13px] px-2 py-0.5 rounded-full"
              style={{ color: 'var(--t-text2)', background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 space-y-0.5 text-[14px] leading-relaxed" style={{ color: 'var(--t-text)' }}>
        {types.map((t, i) => <p key={i}>{t.line}</p>)}
      </div>

      <dl
        className="mt-3 pt-3 grid gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-3"
        style={{ borderTop: '1px solid var(--t-border)' }}
      >
        <Fact label={e.mingStars}>
          {stars.map((s, i) => (
            <span key={s}>{i > 0 && ' · '}<Term name={s} /></span>
          ))}
        </Fact>
        {dx && (
          <Fact label={e.daXianNow}>
            {m.chart.ageRange(dx.startAge, dx.endAge)} <Term name={dx.palaceName} />
            <Role text={role(dx.palaceName)} />
          </Fact>
        )}
        {shen && (
          <Fact label={e.shenGong}>
            <Term name={shen.name} />
            <Role text={role(shen.name)} />
          </Fact>
        )}
      </dl>

      <div className="mt-2 flex items-end justify-between gap-3 flex-wrap">
        <p className="min-w-0 flex-1 basis-[220px] text-[13px] leading-snug" style={{ color: 'var(--t-faint)' }}>
          {borrowedFrom && <>{e.borrowed(termStr(borrowedFrom))} · </>}
          {e.note}
        </p>
        <div className="flex-shrink-0 flex gap-2">
          <button
            ref={consultBtn}
            type="button"
            onClick={() => setConsultOpen(true)}
            className="px-3 py-2 rounded-lg text-[13px] font-semibold"
            style={{ color: 'var(--t-gold)', background: 'var(--ac-bg)', border: '1px solid var(--t-gold)' }}
          >
            {m.consult.open}
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="px-3 py-2 rounded-lg text-[13px] font-medium"
            style={{ color: 'var(--t-gold)', border: '1px solid var(--t-border-acc)' }}
          >
            {e.share.open}
          </button>
        </div>
      </div>
      <TypeShareModal chart={chart} open={shareOpen} onClose={() => setShareOpen(false)} />
      {/* 咨询模式：按需挂载，关掉后把焦点还给按钮 */}
      {consultOpen && (
        <ConsultMode chart={chart} onClose={() => { setConsultOpen(false); consultBtn.current?.focus(); }} />
      )}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 min-w-0">
      <dt className="flex-shrink-0" style={{ color: 'var(--t-faint)' }}>{label}</dt>
      <dd className="min-w-0" style={{ color: 'var(--t-text)' }}>{children}</dd>
    </div>
  );
}

function Role({ text }: { text: string }) {
  if (!text) return null;
  return <span style={{ color: 'var(--t-text2)' }}> · {text}</span>;
}
