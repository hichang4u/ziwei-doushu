'use client';
import { useEffect, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { captureShareCard, downloadDataURL } from './ShareCardCanvas';
import TypeShareCard, { TYPE_SHARE_CARD_ID } from './TypeShareCard';
import { useLocale } from './LocaleProvider';

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: 'image/png' });
}

interface ImageShareModalProps {
  open: boolean;
  onClose: () => void;
  /** 要截图的卡片元素 id */
  cardId: string;
  /** 弹窗标题（也用作系统分享的标题） */
  title: string;
  /** 保存的文件名，不含扩展名 */
  fileName: string;
  /** 卡片下方的说明文字 */
  note: string;
  /** 弹窗宽度上限 = 卡片宽度 */
  width: number;
  /** 截图放大倍数，默认 3 */
  scale?: number;
  /** 卡片本体 */
  children: React.ReactNode;
  /** 卡片与按钮之间的附加控件（如选照片） */
  extra?: React.ReactNode;
}

/** 卡片预览 + 保存成图片；设备支持时可直接调起系统分享。类型卡、竖版卡片共用。 */
export function ImageShareModal({ open, onClose, cardId, title, fileName, note, width, scale = 3, children, extra }: ImageShareModalProps) {
  const { m } = useLocale();
  const s = m.easy.share;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const file = `${fileName}.png`;

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
      const dataUrl = await captureShareCard(cardId, scale);
      if (!dataUrl) { setFailed(true); return; }
      await then(dataUrl);
    } catch (err) {
      // 用户在系统分享面板里取消不算失败
      if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(dataUrl => downloadDataURL(dataUrl, file));
  const share = () => run(async dataUrl => {
    await navigator.share({ files: [await dataUrlToFile(dataUrl, file)], title });
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-4 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--t-border)' }}
        onClick={ev => ev.stopPropagation()}
      >
        {children}
        {extra}

        <div className="mt-3 flex gap-2" style={{ maxWidth: width }}>
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

        <p className="mt-2 text-[11px] leading-snug" style={{ color: failed ? 'var(--ji)' : 'var(--t-faint)', maxWidth: width }}>
          {failed ? s.failed : note}
        </p>
      </div>
    </div>
  );
}

interface TypeShareModalProps {
  chart: ZiweiChart;
  open: boolean;
  onClose: () => void;
}

/** 命宫类型卡（4:5） */
export default function TypeShareModal({ chart, open, onClose }: TypeShareModalProps) {
  const { m } = useLocale();
  const s = m.easy.share;
  return (
    <ImageShareModal
      open={open}
      onClose={onClose}
      cardId={TYPE_SHARE_CARD_ID}
      title={s.title}
      fileName={s.fileName}
      note={s.privacy}
      width={320}
    >
      <TypeShareCard chart={chart} />
    </ImageShareModal>
  );
}
