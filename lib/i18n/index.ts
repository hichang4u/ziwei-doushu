/**
 * 界面语言与命盘术语显示 —— 纯函数部分（React 绑定见 components/LocaleProvider.tsx）。
 *
 * 语言只影响显示：排盘引擎、格局判断、分享链接、历史记录一律仍用简体术语作键。
 */
import { zh, type Messages } from './messages/zh';
import { ko } from './messages/ko';
import {
  TERMS_KO, STEMS_KO, BRANCHES_KO, HANGUL_COLLISIONS, type KoTerm,
} from './terms-ko';

export type Locale = 'zh' | 'ko';

/** 韩文界面下术语的写法：纯韩文 / 韩文+汉字 / 纯汉字（正体） */
export type TermStyle = 'hangul' | 'hangul-hanja' | 'hanja';

export const LOCALES: Locale[] = ['zh', 'ko'];
export const DEFAULT_TERM_STYLE: TermStyle = 'hangul-hanja';

export const MESSAGES: Record<Locale, Messages> = { zh, ko };

export const HTML_LANG: Record<Locale, string> = { zh: 'zh-CN', ko: 'ko' };

/** 术语显示结果：main 为主文字，sub 为附注的汉字（UI 可用小字或括号呈现） */
export interface TermDisplay {
  main: string;
  sub?: string;
}

function display(zhName: string, t: KoTerm | undefined, locale: Locale, style: TermStyle, collide: boolean): TermDisplay {
  if (locale === 'zh' || !t) return { main: zhName };
  if (style === 'hanja') return { main: t.hanja };
  if (style === 'hangul-hanja') return { main: t.ko, sub: t.hanja };
  // 纯韩文：同音术语（천월 天鉞/天月 等）仍附汉字，否则无法区分
  return collide ? { main: t.ko, sub: t.hanja } : { main: t.ko };
}

/** 星曜 / 宫名 / 五行局 / 四化 / 盘面标记 */
export function formatTerm(zhName: string, locale: Locale, style: TermStyle): TermDisplay {
  return display(zhName, TERMS_KO[zhName], locale, style, HANGUL_COLLISIONS.has(zhName));
}

/** 干支（单字或两字组合，如「甲子」） */
export function formatGanzhi(text: string, locale: Locale, style: TermStyle): TermDisplay {
  if (locale === 'zh') return { main: text };
  const chars = [...text].map((c) => STEMS_KO[c] ?? BRANCHES_KO[c]);
  if (chars.some((c) => !c)) return { main: text };
  const joined: KoTerm = { ko: chars.map((c) => c!.ko).join(''), hanja: chars.map((c) => c!.hanja).join('') };
  return display(text, joined, locale, style, false);
}

/** 串成一段纯文本：「자미(紫微)」，用于不便拆两段排版的地方（标题、提示行） */
export function termText(d: TermDisplay): string {
  return d.sub ? `${d.main}(${d.sub})` : d.main;
}

export function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'ko';
}

export function isTermStyle(v: unknown): v is TermStyle {
  return v === 'hangul' || v === 'hangul-hanja' || v === 'hanja';
}
