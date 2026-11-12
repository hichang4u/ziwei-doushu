'use client';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { getMingType } from '@/lib/i18n/star-types';
import { TERMS_KO } from '@/lib/i18n/terms-ko';
import { SITE_HOST } from '@/lib/site';
import { useLocale } from './LocaleProvider';

export const TYPE_SHARE_CARD_ID = 'type-share-card';

/**
 * 命宫类型分享卡（保存成图片用）。
 *
 * 不含出生日期、年龄、大限 —— 发出去的图里不带个人信息，只有类型昵称、关键词、命宫主星、身宫。
 * 颜色一律写死：html2canvas 截图不跟随页面主题，卡片在明暗主题下长得一样。
 * 版面 320×400，截图时按 3 倍输出 960×1200。
 */
export default function TypeShareCard({ chart }: { chart: ZiweiChart }) {
  const { locale, m, termStr } = useLocale();
  const e = m.easy;
  const { stars, types } = getMingType(chart, locale);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  // 背景大字：命宫主星的汉字（韩文界面取正体）
  const watermark = stars.map(s => (locale === 'ko' ? TERMS_KO[s]?.hanja ?? s : s)).join('');
  const showHost = !/^localhost(:\d+)?$/.test(SITE_HOST);

  return (
    <div
      id={TYPE_SHARE_CARD_ID}
      style={{
        width: 320, height: 400, boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
        padding: '22px 22px 18px', borderRadius: 16,
        background: 'linear-gradient(160deg, #0b1224 0%, #141e30 58%, #1f1833 100%)',
        border: '1px solid #5a4a22',
        color: '#e8eef6',
        fontFamily: '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Microsoft YaHei", sans-serif',
        display: 'flex', flexDirection: 'column',
        // 韩文按词换行，不在词中间断开
        wordBreak: 'keep-all',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -6, bottom: 44, fontSize: watermark.length > 2 ? 64 : 104, lineHeight: 1,
          fontWeight: 800, color: '#d4a843', opacity: 0.08, whiteSpace: 'nowrap',
        }}
      >
        {watermark}
      </div>

      <div style={{ fontSize: 11, letterSpacing: 2, color: '#b79a55' }}>✦ {e.share.cardHead}</div>

      <div style={{ marginTop: 26, fontSize: types.length > 1 ? 27 : 38, lineHeight: 1.2, fontWeight: 800, color: '#e6bd5a' }}>
        {types.map(t => t.nick).join(e.typeJoiner)}{e.typeSuffix}
      </div>

      <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.65, color: '#dce4f0' }}>
        {types.map((t, i) => <div key={i}>{t.line}</div>)}
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {types.flatMap(t => t.keywords).map((k, i) => (
          <span
            key={`${k}-${i}`}
            // html2canvas 对行内元素的文字基线算得偏低：改成定高块 + 等高行距，截图里文字才居中
            style={{
              display: 'inline-block', height: 22, lineHeight: '20px', boxSizing: 'border-box', fontSize: 11.5, padding: '0 9px',
              borderRadius: 999, color: '#e6bd5a', border: '1px solid #5a4a22', background: '#1a1f33',
            }}
          >
            {k}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #2a3350', fontSize: 12, lineHeight: 1.7, color: '#9db0d0' }}>
        <div>
          {e.mingStars} <span style={{ color: '#e8eef6' }}>{stars.map(termStr).join(' · ')}</span>
        </div>
        {shen && (
          <div>
            {e.shenGong} <span style={{ color: '#e8eef6' }}>{termStr(shen.name)}</span>
            {e.palaceShort[shen.name] && ` · ${e.palaceShort[shen.name]}`}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9.5, color: '#6a7a96' }}>
        <span>{e.share.cardFoot}</span>
        {showHost && <span>{SITE_HOST}</span>}
      </div>
    </div>
  );
}
