'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { lunarYearMonthOf } from '@/lib/ziwei/flow';
import { buildConsultScript } from '@/lib/i18n/consult-script';
import { HTML_LANG } from '@/lib/i18n';
import { useLocale } from './LocaleProvider';
import StoryShareModal from './StoryShareModal';
import { elementTheme, SPEAKER_COLORS, SPEAKER_VOICE, STAGE_TEXT, STAGE_TEXT_DIM } from './consult-theme';

interface ConsultModeProps {
  chart: ZiweiChart;
  onClose: () => void;
}

type VoiceState = 'unsupported' | 'pending' | 'ok' | 'none';

/**
 * 浏览器自带的语音合成：找一个与界面语言相符的语音。
 * unsupported 没有这个接口；pending 语音列表还没加载出来（有的浏览器一直是空表但照样能读，所以仍允许试读）；
 * none 列表里没有这种语言的语音。
 */
function useVoice(lang: string) {
  const [state, setState] = useState<VoiceState>('pending');
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { setState('unsupported'); return; }
    const synth = window.speechSynthesis;
    const pick = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return;
      const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();
      const want = lang.toLowerCase();
      const voice = voices.find(v => norm(v) === want) ?? voices.find(v => norm(v).startsWith(want.slice(0, 2)));
      voiceRef.current = voice ?? null;
      setState(voice ? 'ok' : 'none');
    };
    pick();
    synth.addEventListener('voiceschanged', pick);
    return () => { synth.removeEventListener('voiceschanged', pick); synth.cancel(); };
  }, [lang]);
  return { state, voiceRef };
}

/**
 * 咨询模式：盖满全屏，一张卡片讲一件事，三位「先生」分主题轮流讲。
 * 内容全部来自 buildConsultScript（固定规则 + 固定文句），最后一张卡片引回命盘核对依据。
 * 由父组件按需挂载（挂载即打开），所以这里可以直接读当前日期。
 */
export default function ConsultMode({ chart, onClose }: ConsultModeProps) {
  const { locale, m, termStyle } = useLocale();
  const c = m.consult;
  const [today] = useState(() => lunarYearMonthOf(new Date()));
  const [index, setIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const script = useMemo(
    () => buildConsultScript(chart, locale, { ...today, termStyle }),
    [chart, locale, today, termStyle],
  );
  const speech = useMemo(
    () => buildConsultScript(chart, locale, { ...today, termStyle, speech: true }),
    [chart, locale, today, termStyle],
  );
  const total = script.cards.length;
  const card = script.cards[Math.min(index, total - 1)];
  const speechCard = speech.cards[Math.min(index, total - 1)];
  const last = index >= total - 1;
  const theme = elementTheme(script.element);
  const speaker = c.speakers[card.speaker];
  const speakerColor = SPEAKER_COLORS[card.speaker];

  const lang = HTML_LANG[locale] === 'ko' ? 'ko-KR' : HTML_LANG[locale];
  const { state: voiceState, voiceRef } = useVoice(lang);

  const go = useCallback((delta: number) => {
    setIndex(i => Math.max(0, Math.min(total - 1, i + delta)));
  }, [total]);

  // 打开时：锁住页面滚动、把焦点移进来；关闭时还原
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  // 键盘：← → 翻页，Esc 关闭（竖版卡片弹窗开着时由弹窗自己处理 Esc）
  useEffect(() => {
    if (storyOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
      else if (ev.key === 'ArrowRight') go(1);
      else if (ev.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [storyOpen, onClose, go]);

  // 翻页后回到卡片顶部
  useEffect(() => { bodyRef.current?.scrollTo(0, 0); }, [index]);

  // 朗读：开着时，每翻到一张卡片就从头读这一张。一句一个 utterance —— 整段一次读，Chrome 的在线语音读到十几秒会自己停
  useEffect(() => {
    if (!voiceOn || voiceState === 'unsupported' || voiceState === 'none') return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const { pitch, rate } = SPEAKER_VOICE[speechCard.speaker];
    const texts = [speechCard.title, ...speechCard.lines.map(l => (l.label ? `${l.label}. ${l.text}` : l.text))];
    for (const text of texts) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      if (voiceRef.current) u.voice = voiceRef.current;
      u.pitch = pitch;
      u.rate = rate;
      synth.speak(u);
    }
    return () => synth.cancel();
  }, [voiceOn, voiceState, speechCard, lang, voiceRef]);

  // 触屏左右滑动翻页
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (ev: React.TouchEvent) => {
    const p = ev.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (ev: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const p = ev.changedTouches[0];
    const dx = p.clientX - start.x, dy = p.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const btn = 'min-h-[44px] px-4 rounded-xl text-[15px] font-medium disabled:opacity-35';
  const ghost = { border: '1px solid rgba(255,255,255,0.22)', color: STAGE_TEXT, background: 'rgba(255,255,255,0.04)' };
  const solid = { background: theme.accent, color: '#101319', border: `1px solid ${theme.accent}` };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
      className="fixed inset-0 z-[90] flex flex-col outline-none"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${theme.to} 0%, ${theme.from} 70%)`,
        color: STAGE_TEXT,
        // 韩文按词换行
        wordBreak: 'keep-all',
      }}
    >
      {/* ── 进度 + 关闭 ── */}
      <header className="flex-shrink-0 w-full max-w-[600px] mx-auto px-4 pt-3">
        <div className="flex gap-1" aria-hidden>
          {script.cards.map((k, i) => (
            <span
              key={k.id}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= index ? theme.accent : 'rgba(255,255,255,0.18)' }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[13px] tabular-nums" style={{ color: STAGE_TEXT_DIM }}>
            {c.title} · {c.progress(index + 1, total)}
          </span>
          <button type="button" onClick={onClose} className="min-h-[40px] px-3 rounded-lg text-[13px]" style={ghost}>
            {c.close}
          </button>
        </div>
      </header>

      {/* ── 卡片 ── */}
      <div
        ref={bodyRef}
        className="flex-1 min-h-0 overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div key={card.id} className="consult-card w-full max-w-[600px] mx-auto px-5 py-6" aria-live="polite">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-[26px] font-bold"
              style={{ color: speakerColor, border: `2px solid ${speakerColor}`, background: 'rgba(0,0,0,0.25)' }}
            >
              {speaker.glyph}
            </span>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold" style={{ color: speakerColor }}>{speaker.name}</div>
              <div className="text-[13px]" style={{ color: STAGE_TEXT_DIM }}>{speaker.role}</div>
            </div>
          </div>

          <h2 className="mt-5 text-[26px] leading-tight font-bold" style={{ color: theme.accent }}>{card.title}</h2>

          <div className="mt-4 space-y-3 text-[17px] leading-[1.75]">
            {card.lines.map((line, i) => line.kind === 'quote' ? (
              <blockquote
                key={i}
                className="pl-3 py-0.5 text-[16px]"
                style={{ borderLeft: `3px solid ${theme.accent}`, color: STAGE_TEXT }}
              >
                {line.label && (
                  <div className="text-[13px] font-semibold mb-0.5" style={{ color: theme.accent }}>{line.label}</div>
                )}
                {line.text}
              </blockquote>
            ) : (
              <p key={i}>{line.text}</p>
            ))}
          </div>

          {card.note && (
            <p className="mt-5 text-[13px] leading-snug" style={{ color: STAGE_TEXT_DIM }}>{card.note}</p>
          )}

          {last && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className={btn} style={solid}>{c.evidence}</button>
              <button type="button" onClick={() => setStoryOpen(true)} className={btn} style={ghost}>{c.story.open}</button>
            </div>
          )}
        </div>
      </div>

      {/* ── 翻页 / 朗读 ── */}
      <footer className="flex-shrink-0 w-full max-w-[600px] mx-auto px-4 pb-4 pt-2">
        {voiceState === 'none' && (
          <p className="mb-2 text-[13px]" style={{ color: STAGE_TEXT_DIM }}>{c.noVoice}</p>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={index === 0} className={btn} style={ghost}>
            {c.prev}
          </button>
          {voiceState !== 'unsupported' && (
            <button
              type="button"
              onClick={() => setVoiceOn(v => !v)}
              disabled={voiceState === 'none'}
              aria-pressed={voiceOn}
              className={`${btn} flex-1`}
              // 不与 border 简写混用 borderColor：React 在重渲染时会告警
              style={voiceOn ? { ...ghost, border: `1px solid ${theme.accent}`, color: theme.accent } : ghost}
            >
              {voiceOn ? c.stopListen : c.listen}
            </button>
          )}
          <button
            type="button"
            onClick={() => go(1)}
            disabled={last}
            className={`${btn} ${voiceState === 'unsupported' ? 'flex-1' : ''}`}
            style={solid}
          >
            {c.next}
          </button>
        </div>
      </footer>

      <StoryShareModal chart={chart} year={today.year} open={storyOpen} onClose={() => setStoryOpen(false)} />
    </div>
  );
}
