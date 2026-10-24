'use client';
import { motion } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';
import { translatePattern, patternNameKo } from '@/lib/i18n/patterns-ko';
import { useLocale } from './LocaleProvider';

const LevelStyle = {
  excellent: { dot: 'bg-amber-400', label: 'text-amber-500', badge: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
  good:      { dot: 'bg-sky-400',   label: 'text-sky-500',   badge: 'text-sky-500 bg-sky-500/10 border-sky-500/25' },
  neutral:   { dot: 'bg-slate-400', label: 'text-slate-400', badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  caution:   { dot: 'bg-orange-500', label: 'text-orange-500', badge: 'text-orange-500 bg-orange-500/10 border-orange-500/25' },
};

export default function PatternsCard({ chart }: { chart: ZiweiChart }) {
  const { locale, m, term, termStr, koTermStr } = useLocale();
  const t = m.patterns;
  const ko = locale === 'ko';
  // 判定永远走简体（patterns.ts 原样），韩文界面再整条译过来；格局名按术语写法单独格式化
  const patterns: (Pattern & { label: string })[] = detectPatterns(chart).map(p => {
    if (!ko) return { ...p, label: p.name };
    const n = patternNameKo(p.name);
    const label = n ? `${n.star ? `${termStr(n.star)} ` : ''}${koTermStr(n.term)}` : p.name;
    return { ...translatePattern(p), label };
  });
  if (patterns.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-glass rounded-xl p-4 mb-4"
    >
      <div className="text-[10px] tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--t-faint)' }}>
        <span style={{ color: 'var(--t-gold)', opacity: 0.6 }}>◉</span>
        {t.title}
        <span className="text-[9px] ml-auto" style={{ color: 'var(--t-faint)', opacity: 0.75 }}>{t.count(patterns.length)}</span>
      </div>
      <div className="space-y-2">
        {patterns.map((p, i) => {
          const st = LevelStyle[p.level];
          return (
            <motion.div
              key={`${p.name}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-inner rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                <span className={`text-[11px] font-medium ${st.label}`}>{p.label}</span>
                <div className="flex gap-1 ml-auto">
                  {p.palaces.slice(0, 2).map(pa => (
                    <span key={pa} className={`text-[8px] px-1.5 py-px rounded-full border ${st.badge}`}>
                      {ko ? term(pa).main : pa.replace('宫', '')}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[10px] leading-relaxed pl-3.5" style={{ color: 'var(--t-text2)' }}>
                {p.description}
              </p>

              {p.conditions && (
                <div className="mt-2 pl-3.5 space-y-0.5">
                  {p.conditions.required.length > 0 && (
                    <div className="text-[9px] leading-relaxed" style={{ color: 'var(--t-text2)', opacity: 0.85 }}>
                      <span className="font-medium" style={{ color: 'var(--t-gold)' }}>{t.required}</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.required.join(t.joiner)}
                    </div>
                  )}
                  {p.conditions.bonus && p.conditions.bonus.length > 0 && (
                    <div className="text-[9px] leading-relaxed" style={{ color: 'var(--t-text2)', opacity: 0.85 }}>
                      <span className="font-medium text-emerald-500">{t.bonus}</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.bonus.join(t.joiner)}
                    </div>
                  )}
                  {p.conditions.breaking && p.conditions.breaking.length > 0 && (
                    <div className="text-[9px] leading-relaxed" style={{ color: 'var(--t-text2)', opacity: 0.85 }}>
                      <span className="font-medium text-orange-500">{t.breaking}</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.breaking.join(t.joiner)}
                    </div>
                  )}
                </div>
              )}

              {p.source && (
                <div className="text-[9px] mt-1.5 pl-3.5" style={{ color: 'var(--t-faint)', opacity: 0.5 }}>
                  {t.source(p.source)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
