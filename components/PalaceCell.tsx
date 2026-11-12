'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import { isMiscStar } from '@/lib/ziwei/star-groups';
import clsx from 'clsx';
import { Term, useLocale } from './LocaleProvider';

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  delay?: number;
  /** 叠加四化：星名 → 四化类型（'禄'/'权'/'科'/'忌'） */
  overlayStarSiHua?: Record<string, string>;
  /** 叠加标签：'年'（流年）或 '限'（大限） */
  overlayLabel?: string;
  /** 点击叠加四化 badge 回调 */
  onSiHuaClick?: (starName: string, siHua: string) => void;
  /** 是否显示杂曜；false 时只留主星、六吉禄马、六煞 */
  showMisc?: boolean;
}

const SIHUA_STYLES: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

/** 回车 / 空格触发，与原生按钮一致 */
const onActivate = (fn?: () => void) => (e: React.KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  e.stopPropagation();
  fn?.();
};

const SiHuaBadge = ({
  siHua,
  overlay,
  label,
  onClick,
}: {
  siHua: string;
  overlay?: boolean;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const { term } = useLocale();
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[10px] px-1 rounded-full border leading-none py-0.5 font-bold ml-1 flex-shrink-0',
        SIHUA_STYLES[siHua],
        overlay && 'border-dashed',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      {overlay && label && <span className="mr-px opacity-80">{term(label).main}</span>}
      {term(siHua).main}
    </span>
  );
};

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick, showMisc = true,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const { m, term } = useLocale();
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;

  const majorStars = stars.filter(s => s.type === 'major');
  const shown = (s: Star) => showMisc || !isMiscStar(s);
  const luckyStars = stars.filter(s => s.type === 'lucky' && shown(s));
  const shaStars = stars.filter(s => s.type === 'sha' && shown(s));
  // 中性杂曜（劫煞、咸池等）原先盘面不显示，展开杂曜时一并列出
  const neutralStars = showMisc ? stars.filter(s => s.type === 'minor') : [];
  const role = m.easy.palaceShort[name];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      onClick={onClick}
      // 宫位可用键盘选中（Tab 聚焦，回车 / 空格切换三方四正）
      role="button"
      tabIndex={0}
      aria-pressed={!!isSelected}
      onKeyDown={onActivate(onClick)}
      className="zw-cell relative flex flex-col p-1.5 pb-[20px] sm:p-2 sm:pb-[20px] cursor-pointer transition-all duration-200 h-full"
      style={{
        minHeight: '104px',
        background: isCurrentDaXian
          ? 'rgba(147,51,234,0.08)'
          : isSelected
          ? 'rgba(37,99,235,0.18)'
          : isSanFang
          ? 'rgba(37,99,235,0.09)'
          : isMingGong
          ? 'rgba(212,168,67,0.04)'
          : 'var(--t-bg)',
        boxShadow: isCurrentDaXian
          ? 'inset 3px 0 0 rgba(147,51,234,0.5)'
          : isSelected
          ? 'inset 0 0 0 1.5px rgba(37,99,235,0.7)'
          : isSanFang
          ? 'inset 0 0 0 1px rgba(37,99,235,0.4)'
          : 'none',
      }}
    >
      {/* 右上角：大限年龄 */}
      {daXianAge && (
        <div
          className={clsx('absolute top-1.5 right-1.5 text-[10px] font-mono tabular-nums leading-tight', isCurrentDaXian && 'text-purple-400')}
          style={!isCurrentDaXian ? { color: 'var(--t-faint)' } : undefined}
        >
          {daXianAge[0]}–{daXianAge[1]}
        </div>
      )}
      {/* 右下角：宫干支 */}
      <div className="absolute bottom-1 right-1.5 text-[11px] leading-tight" style={{ color: 'var(--t-faint)' }}>
        <Term kind="ganzhi" name={ganzhi} />
      </div>

      {/* 宫名行（窄屏省略小字汉字，给右上角的年龄让位） */}
      <div className="flex items-center flex-wrap gap-x-1" style={{ paddingRight: daXianAge ? `${String(daXianAge[0]).length + String(daXianAge[1]).length + 1}ch` : 0 }}>
        <span
          className={clsx('text-[12px] font-medium whitespace-nowrap', isMingGong ? 'text-amber-500' : isShenGong ? 'text-sky-500' : '')}
          style={!isMingGong && !isShenGong ? { color: 'var(--t-text2)' } : undefined}
        >
          <Term name={name} subClassName="hidden sm:inline ml-px text-[0.7em] opacity-60 font-normal" />
        </span>
        {isMingGong && (
          <span className="text-[9px] text-amber-500 border border-amber-500/40 px-0.5 rounded leading-tight">{term('命').main}</span>
        )}
        {isShenGong && (
          <span className="text-[9px] text-sky-500 border border-sky-500/40 px-0.5 rounded leading-tight">{term('身').main}</span>
        )}
      </div>

      {/* 宫位白话：这一宫看什么 */}
      {role && (
        <div className="text-[11px] truncate mb-1" style={{ color: 'var(--t-faint)' }}>{role}</div>
      )}

      {/* 主星 */}
      <div className="flex flex-col gap-0.5 flex-1">
        {majorStars.length === 0 && (
          <span className="text-[11px] italic" style={{ color: 'var(--t-faint)' }}>{m.chart.emptyPalace}</span>
        )}
        {majorStars.map((star) => {
          const overlaySiHua = overlayStarSiHua?.[star.name];
          return (
            <div key={star.name} className="flex items-center flex-wrap">
              <span
                data-major-star
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onStarClick?.(star); }}
                onKeyDown={onActivate(() => onStarClick?.(star))}
                className="text-[15px] leading-tight font-bold tracking-tight cursor-pointer hover:brightness-125 transition-all"
                style={{ color: star.brightness === 'bright' ? 'var(--star-bright)' : star.brightness === 'dim' ? 'var(--star-dim)' : 'var(--star-normal)' }}
              >
                <Term name={star.name} />
              </span>
              {star.siHua && <SiHuaBadge siHua={star.siHua} />}
              {overlaySiHua && (
                <SiHuaBadge
                  siHua={overlaySiHua}
                  overlay
                  label={overlayLabel}
                  onClick={e => {
                    e.stopPropagation();
                    onSiHuaClick?.(star.name, overlaySiHua);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 吉星 */}
      {luckyStars.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 mt-1">
          {luckyStars.map(s => {
            const overlaySiHua = overlayStarSiHua?.[s.name];
            return (
              <span key={s.name} className="inline-flex items-center text-[11px] leading-snug" style={{ color: 'var(--star-lucky)' }}>
                <Term name={s.name} />
                {s.siHua && <SiHuaBadge siHua={s.siHua} />}
                {overlaySiHua && (
                  <SiHuaBadge
                    siHua={overlaySiHua}
                    overlay
                    label={overlayLabel}
                    onClick={e => {
                      e.stopPropagation();
                      onSiHuaClick?.(s.name, overlaySiHua);
                    }}
                  />
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* 煞星 */}
      {shaStars.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5">
          {shaStars.map(s => (
            <span key={s.name} className="text-[11px] leading-snug" style={{ color: 'var(--star-sha)' }}>
              <Term name={s.name} />{s.siHua && <SiHuaBadge siHua={s.siHua} />}
            </span>
          ))}
        </div>
      )}

      {/* 中性杂曜 */}
      {neutralStars.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5">
          {neutralStars.map(s => (
            <span key={s.name} className="text-[11px] leading-snug" style={{ color: 'var(--t-faint)' }}>
              <Term name={s.name} />
            </span>
          ))}
        </div>
      )}

    </motion.div>
  );
}
