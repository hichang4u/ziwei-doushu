'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';
import { STAR_DETAIL } from '@/lib/ziwei/star-detail';
import { STAR_DETAIL_KO, STAR_DESCRIPTIONS_KO, AUX_STAR_NOTES_KO } from '@/lib/i18n/star-detail-ko';
import { Term, useLocale } from './LocaleProvider';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// 辅星 / 煞星简述（原 JSX 内联文案，逐字迁出；韩文见 lib/i18n/star-detail-ko.ts AUX_STAR_NOTES_KO）
const AUX_STAR_NOTES: Record<string, string> = {
  '文昌': '文昌入宫，主学业考试顺利，文书印鉴有利，宜从事文字相关工作。古诀：「文昌科甲，主文章显达，逢考必第。」',
  '文曲': '文曲入宫，主才艺出众，口才佳，善于表达，艺术天赋强。古诀：「文曲为才艺之星，能文能武，口才胜人。」',
  '左辅': '左辅入宫，主贵人相助，有人提携，该宫位事项受到善意支持。古诀：「左辅为助力之星，坐命则贵人多，逢凶化吉。」',
  '右弼': '右弼入宫，主贵人相助，多出女性贵人，该宫位事项有人协助。古诀：「右弼为阴助之星，多女性贵人，化险为夷。」',
  '天魁': '天魁入宫，主白天出生的贵人，男性贵人多，逢凶化吉之力。古诀：「天魁为天乙贵人，逢之必有贵人扶持。」',
  '天钺': '天钺入宫，主夜晚出生的贵人，女性贵人多，增添吉祥之气。古诀：「天钺为玉堂贵人，主阴助，女贵人多。」',
  '禄存': '禄存入宫，主财禄守成，该宫位有财气，但属于保守型财运。古诀：「禄存为财禄之星，主守财有余，进财稳健。」',
  '天马': '天马入宫，主奔波动荡，动中求财，宜主动出击，不宜守株待兔。古诀：「天马主动，逢禄则财禄双全，动中生财。」',
  '地空': '地空入宫，主该宫位事项有落空感，精神耗散，宜注意心理健康。古诀：「地空主虚耗，入命宫者多精神迷茫，须防空想。」',
  '地劫': '地劫入宫，主该宫位事项有意外损失，财物需谨慎，防小人。古诀：「地劫主劫财，入命宫者财运受损，防意外之失。」',
  '火星': '火星入宫，主该宫位事项急躁冲动，情绪波动，但若遇贪狼则反吉。古诀：「火星主急燥，然遇贪狼同宫，反为火贪格，主暴发。」',
  '铃星': '铃星入宫，主该宫位事项有暗中阻碍，防背后小人，凡事宜低调。古诀：「铃星主暗煞，入命者多暗中受敌，须防背后是非。」',
  '擎羊': '擎羊入宫，主刑克，该宫位事项多波折，有血光之灾或意外。古诀：「擎羊为刑克之星，入命宫者多刑克，须防意外血光。」',
  '陀罗': '陀罗入宫，主是非缠身，该宫位事项拖延不决，凡事宜早做准备。古诀：「陀罗主是非拖延，入命宫者做事迟缓，须防纠缠不清。」',
};

const levelConfig = {
  major: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const { locale, m, termStr } = useLocale();
  const t = m.starDetail;
  const ko = locale === 'ko';
  const desc = star ? (ko ? STAR_DESCRIPTIONS_KO : STAR_DESCRIPTIONS)[star.name] : null;
  const detail = star ? (ko ? STAR_DETAIL_KO : STAR_DETAIL)[star.name] : null;
  const auxNote = star ? (ko ? AUX_STAR_NOTES_KO : AUX_STAR_NOTES)[star.name] : undefined;
  const typeConfig = star ? levelConfig[star.type] : null;
  // 标签按亮度着色，不再靠匹配中文字样
  const tags: { text: string; tone?: 'bright' | 'dim' }[] = star && desc ? [
    { text: t.element(desc.element) },
    { text: t.nature(desc.nature) },
    ...(palaceName ? [{ text: t.position(termStr(palaceName)) }] : []),
    ...(star.brightness ? [star.brightness === 'bright' ? { text: t.bright, tone: 'bright' as const }
      : star.brightness === 'dim' ? { text: t.dim, tone: 'dim' as const } : { text: t.normal }] : []),
  ] : [];

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}><Term name={star.name} /></span>
              {typeConfig && (
                <span className={`text-[12px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {t.types[star.type]}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[12px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  {termStr(`化${star.siHua}`)}
                </span>
              )}
            </div>
            <button onClick={onClose} aria-label={t.close} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本信息 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <div key={tag.text} className="text-[12px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.tone === 'bright' ? '#eab308' : tag.tone === 'dim' ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag.text}
                  </div>
                ))}
              </div>
            )}

            {/* 关键词 */}
            {desc && (
              <div>
                <div className="text-[12px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>{t.traits}</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[13px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 古书原文 */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[12px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)' }}>
                  {t.classical}
                </div>
                <p className="text-[13px] leading-relaxed italic" style={{ color: 'var(--t-gold)' }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海厦解读 */}
            {detail && (
              <>
                <div>
                  <div className="text-[12px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    {t.niHaixia}
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: t.career, value: detail.career, icon: '◈' },
                    { label: t.relationship, value: detail.relationship, icon: '♡' },
                    { label: t.wealth, value: detail.wealth, icon: '◆' },
                    { label: t.health, value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[12px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[12px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">{t.bestPalace}</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[12px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">{t.worstPalace}</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 辅星/煞星说明 */}
            {!detail && star.type !== 'major' && auxNote && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {auxNote}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
