'use client';
/**
 * 服务端组件（SSG 页面）里的可切换文案 —— 页面本身保持服务端渲染，
 * 只把随语言变化的那几处包成这些小客户端组件。首帧按 zh 渲染，与静态 HTML 一致。
 *
 *  · <Msg k="library.title" />        界面文案（lib/i18n/messages/*）；函数型文案用 args 传参
 *  · <Bi zh="…" ko="…" />             数据自带的双语文本（ko 缺省时回落 zh）
 *  · <KoTermText zh="骨髓赋" term={…} /> 韩文按术语写法（한글 / 한글(漢字) / 漢字）显示
 *  · <OnlyIn locale="ko">…</OnlyIn>   仅在某语言下显示的块（如古籍译文）
 */
import type { ReactNode } from 'react';
import { useLocale } from './LocaleProvider';
import type { Locale } from '@/lib/i18n';
import type { Messages } from '@/lib/i18n/messages/zh';
import type { KoTerm } from '@/lib/i18n/terms-ko';

/** 文案键路径：只列字符串与函数叶子（数组型文案不走 <Msg>） */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends (...args: never[]) => string
    ? `${P}${K}`
    : T[K] extends string
      ? `${P}${K}`
      : T[K] extends readonly unknown[]
        ? never
        : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MsgKey = Leaves<Messages>;

export function Msg({ k, args = [] }: { k: MsgKey; args?: (string | number)[] }) {
  const { m } = useLocale();
  const v = k.split('.').reduce<unknown>((o, key) => (o as Record<string, unknown>)?.[key], m);
  if (typeof v === 'function') return <>{(v as (...a: (string | number)[]) => string)(...args)}</>;
  return <>{typeof v === 'string' ? v : k}</>;
}

export function Bi({ zh, ko }: { zh: string; ko?: string }) {
  const { locale } = useLocale();
  return <>{locale === 'ko' && ko ? ko : zh}</>;
}

export function KoTermText({ zh, term }: { zh: string; term?: KoTerm }) {
  const { locale, koTermStr } = useLocale();
  return <>{locale === 'ko' && term ? koTermStr(term) : zh}</>;
}

export function OnlyIn({ locale, children }: { locale: Locale; children: ReactNode }) {
  const ctx = useLocale();
  return ctx.locale === locale ? <>{children}</> : null;
}
