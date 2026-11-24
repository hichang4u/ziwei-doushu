import type { SpeakerId } from '@/lib/i18n/consult-script';

/**
 * 咨询模式 / 竖版卡片的配色：按五行局（2 水 / 3 木 / 4 金 / 5 土 / 6 火）取一组深色底 + 强调色。
 * 颜色写死、不跟页面明暗主题走：咨询模式是盖满全屏的「舞台」，竖版卡片要截图成图片，两处都需要固定的样子。
 * 正文 #e8eef6、强调色在各自底色上的对比度均 ≥ 7:1（scripts/regression/consult-script.test.ts 里核对）。
 */
export interface ElementTheme {
  accent: string;
  from: string;
  to: string;
}

export const ELEMENT_THEMES: Record<number, ElementTheme> = {
  2: { accent: '#7cc0f5', from: '#071524', to: '#102a45' }, // 水
  3: { accent: '#86d394', from: '#08170f', to: '#143222' }, // 木
  4: { accent: '#e6dcc0', from: '#131419', to: '#2a2b36' }, // 金
  5: { accent: '#e0ad62', from: '#19120a', to: '#35250f' }, // 土
  6: { accent: '#f7937c', from: '#1d0c0b', to: '#341412' }, // 火
};

export const STAGE_TEXT = '#e8eef6';
export const STAGE_TEXT_DIM = '#aab6c8';

export function elementTheme(wuxingJu: number): ElementTheme {
  return ELEMENT_THEMES[wuxingJu] ?? ELEMENT_THEMES[5];
}

/** 三位先生各一种固定颜色（头像圈与名字），与五行配色无关 */
export const SPEAKER_COLORS: Record<SpeakerId, string> = {
  ming: '#e6bd5a',
  lu: '#6fd3c7',
  yun: '#b9a4f0',
};

/** 朗读时三位先生的音高 / 语速略有区别 */
export const SPEAKER_VOICE: Record<SpeakerId, { pitch: number; rate: number }> = {
  ming: { pitch: 1, rate: 0.95 },
  lu: { pitch: 0.8, rate: 1 },
  yun: { pitch: 1.2, rate: 1 },
};
