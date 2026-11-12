'use client';
import { useEffect, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { captureShareCard, downloadDataURL } from './ShareCardCanvas';
import TypeShareCard, { TYPE_SHARE_CARD_ID } from './TypeShareCard';
import { useLocale } from './LocaleProvider';

interface TypeShareModalProps {
  chart: ZiweiChart;
  open: boolean;
  onClose: () => void;
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: 'image/png' });
}

/** 命宫类型卡：预览 + 保存图片；设备支持时可直接调起系统分享 */
export default function TypeShareModal({ chart, open, onClose }: TypeShareModalProps) {
  const { m } = useLocale();
  const s = m.easy.share;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const fileName = `${s.fileName}.png`;

  // 系统分享（带文件）只有部分浏览器支持：挂载后探测，避免预渲染时访问 navigator
  useEffect(() => {
    try {
      const probe = new File([new Blob()], 'x.png', { type: 'image/png' });
      setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] }));
    } catch { setCanShare(false); }
  }, []);

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const run = async (then: (dataUrl: string) => void | Promise<void>) => {
    setBusy(true);
    setFailed(false);
    try {
      const dataUrl = await captureShareCard(TYPE_SHARE_CARD_ID, 3);
      if (!dataUrl) { setFailed(true); return; }
      await then(dataUrl);
    } catch (err) {
      // 用户在系统分享面板里取消不算失败
      if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(dataUrl => downloadDataURL(dataUrl, fileName));
  const share = () => run(async dataUrl => {
    await navigator.share({ files: [await dataUrlToFile(dataUrl, fileName)], title: s.title });
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-4 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--t-border)' }}
        onClick={ev => ev.stopPropagation()}
      >
        <TypeShareCard chart={chart} />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50"
            style={{ background: 'var(--ac-bg)', border: '1px solid var(--t-border-acc)', color: 'var(--t-gold)' }}
          >
            {busy ? s.saving : s.save}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              disabled={busy}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50"
              style={{ border: '1px solid var(--t-border)', color: 'var(--t-text)' }}
            >
              {s.share}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-[13px]"
            style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}
          >
            {s.close}
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-snug" style={{ color: failed ? 'var(--ji)' : 'var(--t-faint)', maxWidth: 320 }}>
          {failed ? s.failed : s.privacy}
        </p>
      </div>
    </div>
  );
}
