'use client';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { getMingType } from '@/lib/i18n/star-types';
import { getYearFlow } from '@/lib/ziwei/flow';
import { TERMS_KO } from '@/lib/i18n/terms-ko';
import { SITE_HOST } from '@/lib/site';
import { useLocale } from './LocaleProvider';
import { elementTheme, STAGE_TEXT, STAGE_TEXT_DIM } from './consult-theme';

export const STORY_SHARE_CARD_ID = 'story-share-card';
export const STORY_CARD_WIDTH = 288;
/** 288×512 × 3.75 = 1080×1920（3.75 可精确表示，截图尺寸不会差 1px） */
export const STORY_CARD_SCALE = 3.75;

interface StoryShareCardProps {
  chart: ZiweiChart;
  /** 农历流年：卡片上的「今年要点」 */
  year: number;
  /** 用户选的照片（已在本机裁成正方形的 dataURL）；不选则不显示 */
  photo?: string | null;
}

/**
 * 竖版卡片（9:16，发限时动态用）。版面 288×512（360px 宽的手机上弹窗也放得下），截图时放大到 1080×1920。
 *
 * 与类型卡一样不含出生日期、年龄、大限 —— 只有类型、关键词、命宫主星、身宫，以及今年化禄 / 化忌落在哪一类事情上。
 * 配色按五行局取，颜色写死（html2canvas 截图不跟随页面主题）。
 * 照片只在浏览器里合成进这张图，不上传。
 */
export default function StoryShareCard({ chart, year, photo }: StoryShareCardProps) {
  const { locale, m, termStr } = useLocale();
  const e = m.easy;
  const st = m.consult.story;
  const theme = elementTheme(chart.wuxingJu);
  const { stars, types } = getMingType(chart, locale);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const flow = getYearFlow(chart, year);
  const role = (siHua: '禄' | '忌') => {
    const palace = flow.hits.find(h => h.siHua === siHua)?.palace;
    return palace ? e.palaceShort[palace.name] ?? termStr(palace.name) : '';
  };
  const up = role('禄'), down = role('忌');
  const watermark = stars.map(s => (locale === 'ko' ? TERMS_KO[s]?.hanja ?? s : s)).join('');
  const showHost = !/^localhost(:\d+)?$/.test(SITE_HOST);
  // html2canvas 对行内元素的文字基线算得偏低：标签一律用定高块 + 等高行距
  const chip = {
    display: 'inline-block', height: 22, lineHeight: '20px', boxSizing: 'border-box', fontSize: 11, padding: '0 9px',
    borderRadius: 999, color: theme.accent, border: `1px solid ${theme.accent}`, background: 'rgba(0,0,0,0.28)',
  } as const;

  return (
    <div
      id={STORY_SHARE_CARD_ID}
      style={{
        width: STORY_CARD_WIDTH, height: 512, boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
        padding: '26px 22px 18px', borderRadius: 16,
        background: `linear-gradient(170deg, ${theme.to} 0%, ${theme.from} 62%, #07080c 100%)`,
        color: STAGE_TEXT,
        fontFamily: '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Microsoft YaHei", sans-serif',
        display: 'flex', flexDirection: 'column',
        wordBreak: 'keep-all',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute', right: -8, top: 196, fontSize: watermark.length > 2 ? 74 : 120, lineHeight: 1,
          fontWeight: 800, color: theme.accent, opacity: 0.07, whiteSpace: 'nowrap',
        }}
      >
        {watermark}
      </div>

      <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: theme.accent }}>✦ {st.cardHead}</div>

      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- 本机 dataURL，且要原样交给 html2canvas 截图
        <img
          src={photo}
          alt={st.photoAlt}
          width={72}
          height={72}
          // 右上角绝对定位：不占正文的高度，双主星 + 照片时内容也放得下
          style={{ position: 'absolute', top: 22, right: 22, width: 72, height: 72, borderRadius: '50%', border: `2px solid ${theme.accent}` }}
        />
      )}

      <div style={{ marginTop: photo ? 62 : 44, fontSize: types.length > 1 ? 25 : 36, lineHeight: 1.2, fontWeight: 800, color: theme.accent }}>
        {types.map(t => t.nick).join(e.typeJoiner)}{e.typeSuffix}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.65 }}>
        {types.map((t, i) => <div key={i}>{t.line}</div>)}
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {types.flatMap(t => t.keywords).map((k, i) => <span key={`${k}-${i}`} style={chip}>{k}</span>)}
      </div>

      <div style={{ marginTop: 'auto' }}>
        {(up || down) && (
          <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: 11, color: STAGE_TEXT_DIM }}>{st.yearHead(year)}</div>
            {up && (
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5 }}>
                <span style={{ color: theme.accent, fontWeight: 700, marginRight: 8 }}>{e.flow.up}</span>{up}
              </div>
            )}
            {down && (
              <div style={{ marginTop: 3, fontSize: 13.5, lineHeight: 1.5 }}>
                <span style={{ color: STAGE_TEXT_DIM, fontWeight: 700, marginRight: 8 }}>{e.flow.down}</span>{down}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.7, color: STAGE_TEXT_DIM }}>
          <div>
            {e.mingStars} <span style={{ color: STAGE_TEXT }}>{stars.map(termStr).join(' · ')}</span>
          </div>
          {shen && (
            <div>
              {e.shenGong} <span style={{ color: STAGE_TEXT }}>{termStr(shen.name)}</span>
              {e.palaceShort[shen.name] && ` · ${e.palaceShort[shen.name]}`}
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9, color: '#8794aa' }}>
          <span>{e.share.cardFoot}</span>
          {showHost && <span>{SITE_HOST}</span>}
        </div>
      </div>
    </div>
  );
}
