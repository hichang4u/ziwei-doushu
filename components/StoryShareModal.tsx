'use client';
import { useRef, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { ImageShareModal } from './TypeShareModal';
import StoryShareCard, { STORY_SHARE_CARD_ID, STORY_CARD_WIDTH, STORY_CARD_SCALE } from './StoryShareCard';
import { useLocale } from './LocaleProvider';

interface StoryShareModalProps {
  chart: ZiweiChart;
  /** 农历流年 */
  year: number;
  open: boolean;
  onClose: () => void;
}

/**
 * 把选中的图片在本机居中裁成正方形、缩到 size 像素，返回 dataURL。
 * 不经过任何网络请求；缩小是为了让截图快、内存占用小。
 */
async function fileToSquareDataUrl(file: File, size = 480): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error('empty image');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 竖版卡片（9:16）：预览 + 可选放一张自己的照片 + 保存 / 分享 */
export default function StoryShareModal({ chart, year, open, onClose }: StoryShareModalProps) {
  const { m } = useLocale();
  const st = m.consult.story;
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = ''; // 允许再次选同一张
    if (!file) return;
    try {
      setPhoto(await fileToSquareDataUrl(file));
      setPhotoFailed(false);
    } catch {
      setPhotoFailed(true);
    }
  };

  const small = 'px-3 py-2 rounded-lg text-[13px]';
  return (
    <ImageShareModal
      open={open}
      onClose={onClose}
      cardId={STORY_SHARE_CARD_ID}
      title={st.title}
      fileName={st.fileName}
      note={`${m.easy.share.privacy} ${st.photoNote}`}
      width={STORY_CARD_WIDTH}
      scale={STORY_CARD_SCALE}
      extra={
        <div className="mt-3 flex items-center gap-2 flex-wrap" style={{ maxWidth: STORY_CARD_WIDTH }}>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} aria-label={st.addPhoto} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={small}
            style={{ border: '1px solid var(--t-border)', color: 'var(--t-text)' }}
          >
            {st.addPhoto}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className={small}
              style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}
            >
              {st.removePhoto}
            </button>
          )}
          {photoFailed && <span className="text-[12px]" style={{ color: 'var(--ji)' }}>{st.photoFailed}</span>}
        </div>
      }
    >
      <StoryShareCard chart={chart} year={year} photo={photo} />
    </ImageShareModal>
  );
}
