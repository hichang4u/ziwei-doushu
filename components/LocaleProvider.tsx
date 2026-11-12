'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  MESSAGES, HTML_LANG, DEFAULT_TERM_STYLE, LOCALE_STORAGE_KEY, TERM_STYLE_STORAGE_KEY,
  formatTerm, formatGanzhi, formatKoTerm, termText,
  isLocale, isTermStyle, type Locale, type TermStyle, type TermDisplay,
} from '@/lib/i18n';
import type { Messages } from '@/lib/i18n/messages/zh';
import type { KoTerm } from '@/lib/i18n/terms-ko';

const LOCALE_KEY = LOCALE_STORAGE_KEY;
const TERM_STYLE_KEY = TERM_STYLE_STORAGE_KEY;

interface LocaleContextValue {
  locale: Locale;
  termStyle: TermStyle;
  setLocale: (l: Locale) => void;
  setTermStyle: (s: TermStyle) => void;
  m: Messages;
  /** 术语显示（星曜 / 宫名 / 五行局 / 四化） */
  term: (zhName: string) => TermDisplay;
  /** 干支显示 */
  ganzhi: (text: string) => TermDisplay;
  /** 术语串成纯文本 */
  termStr: (zhName: string) => string;
  /** 引擎术语表以外的韩文术语（格局名等）串成纯文本，仅韩文界面使用 */
  koTermStr: (t: KoTerm) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, initialLocale }: {
  children: React.ReactNode;
  /** 指定后以此为准、不读本地设置（服务端按路由渲染 / 测试用）；不传则首帧 zh，挂载后读本地设置 */
  initialLocale?: Locale;
}) {
  // 首帧固定 zh，与静态导出的 HTML 一致，挂载后再读本地设置（与 ThemeProvider 同一做法，避免水合不一致）
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? 'zh');
  const [termStyle, setTermStyleState] = useState<TermStyle>(DEFAULT_TERM_STYLE);

  useEffect(() => {
    if (initialLocale) return;
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
      else if (navigator.language?.toLowerCase().startsWith('ko')) setLocaleState('ko');
      const style = localStorage.getItem(TERM_STYLE_KEY);
      if (isTermStyle(style)) setTermStyleState(style);
    } catch { /* localStorage 不可用时保持默认 */ }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
    // LOCALE_BOOT_SCRIPT 判定为韩文时隐藏了 body，切到韩文并提交后再显示
    if (locale === 'ko') document.documentElement.classList.remove('locale-pending');
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LOCALE_KEY, l); } catch {}
  }, []);

  const setTermStyle = useCallback((s: TermStyle) => {
    setTermStyleState(s);
    try { localStorage.setItem(TERM_STYLE_KEY, s); } catch {}
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    termStyle,
    setLocale,
    setTermStyle,
    m: MESSAGES[locale],
    term: (zhName) => formatTerm(zhName, locale, termStyle),
    ganzhi: (text) => formatGanzhi(text, locale, termStyle),
    termStr: (zhName) => termText(formatTerm(zhName, locale, termStyle)),
    koTermStr: (t) => termText(formatKoTerm(t, termStyle)),
  }), [locale, termStyle, setLocale, setTermStyle]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

/** 术语：主文字 + 小号汉字附注（hangul-hanja 模式），盘面格子里用 */
export function Term({ name, kind = 'term', subClassName }: {
  name: string;
  kind?: 'term' | 'ganzhi';
  subClassName?: string;
}) {
  const { term, ganzhi } = useLocale();
  const d = kind === 'ganzhi' ? ganzhi(name) : term(name);
  return (
    <>
      {d.main}
      {d.sub && <span className={subClassName ?? 'ml-px text-[0.7em] opacity-60 font-normal'}>{d.sub}</span>}
    </>
  );
}

/**
 * 左下角的语言 / 术语显示切换。平时只是一个小圆钮（显示当前语言），点开才展开选项，
 * 免得常驻的长条盖住表单按钮和正文。右下角会盖住解读面板的发送按钮，所以放左下。
 */
export function LocaleSwitcher() {
  const { locale, setLocale, termStyle, setTermStyle, m } = useLocale();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(212,168,67,0.18)' : 'transparent',
    color: active ? 'var(--t-gold, #d4a843)' : 'var(--t-faint, #888)',
  });
  const surface: React.CSSProperties = {
    border: '1px solid var(--t-border, rgba(128,128,128,0.3))',
    background: 'var(--bg-1, rgba(20,20,30,0.92))',
    boxShadow: 'var(--sh-sm)',
  };
  return (
    <div
      style={{
        // 开发模式下 next dev 的指示徽标占着左下角，往上让开；正式环境贴底
        position: 'fixed', left: 16, bottom: process.env.NODE_ENV === 'development' ? 64 : 16, zIndex: 60,
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start', gap: 6,
      }}
    >
      <button
        type="button"
        aria-label={m.locale.switchLabel}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          ...surface, width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: 'var(--t-gold, #d4a843)',
        }}
      >
        {locale === 'ko' ? '한' : '中'}
      </button>
      {open && (
    <div
      role="group"
      aria-label={m.locale.switchLabel}
      style={{ ...surface, display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999 }}
    >
      <button type="button" style={pill(locale === 'zh')} onClick={() => setLocale('zh')} lang="zh-CN">中文</button>
      <button type="button" style={pill(locale === 'ko')} onClick={() => setLocale('ko')} lang="ko">한국어</button>
      {locale === 'ko' && (
        <select
          aria-label={m.locale.termStyleLabel}
          value={termStyle}
          onChange={(e) => setTermStyle(e.target.value as TermStyle)}
          style={{
            fontSize: '13px', padding: '7px 6px', borderRadius: 8,
            background: 'transparent', color: 'var(--t-faint, #888)',
            border: '1px solid var(--t-border, rgba(128,128,128,0.3))',
          }}
        >
          <option value="hangul-hanja">자미(紫微)</option>
          <option value="hangul">자미</option>
          <option value="hanja">紫微</option>
        </select>
      )}
    </div>
      )}
    </div>
  );
}
