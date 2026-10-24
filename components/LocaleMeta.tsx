'use client';
/**
 * 韩文界面下的页面标题 / 描述 —— 页面 metadata 是静态导出的中文（/ko 路由未做，搜索引擎仍收录中文），
 * 这里只在浏览器里按语言改 document.title 与 <meta name="description">，切回中文时恢复原值。
 *
 * Next 会在水合后再写一次 metadata 的 <title>，单次赋值会被覆盖；
 * 故韩文期间监听 <head>，标题被改回中文时重新套用（只在值不同时写，避免循环）。
 */
import { useEffect, useRef } from 'react';
import { useLocale } from './LocaleProvider';

export default function LocaleMeta({ ko }: { ko: { title: string; description?: string } }) {
  const { locale } = useLocale();
  const original = useRef<{ title: string; description: string | null } | null>(null);

  useEffect(() => {
    const descMeta = () => document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const remember = () => {
      // 记下 Next 写入的中文值（不是我们自己写的韩文值），切回中文时用
      const meta = descMeta();
      const title = document.title !== ko.title ? document.title : original.current?.title ?? document.title;
      const content = meta?.getAttribute('content') ?? null;
      const description = content !== ko.description ? content : original.current?.description ?? content;
      original.current = { title, description };
    };
    const applyKo = () => {
      remember();
      if (document.title !== ko.title) document.title = ko.title;
      const meta = descMeta();
      if (meta && ko.description && meta.getAttribute('content') !== ko.description) meta.setAttribute('content', ko.description);
    };

    if (locale !== 'ko') {
      if (original.current) {
        document.title = original.current.title;
        const meta = descMeta();
        if (meta && original.current.description !== null) meta.setAttribute('content', original.current.description);
      }
      return;
    }

    applyKo();
    const observer = new MutationObserver(applyKo);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['content'] });
    return () => observer.disconnect();
  }, [locale, ko.title, ko.description]);

  return null;
}
