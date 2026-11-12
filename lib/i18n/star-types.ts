/**
 * 命宫主星 → 「类型」昵称：盘面上方结论卡用的趣味摘要，不是古籍格局。
 *
 * 规则只有一条，并在界面上写明：按命宫主星起名（双星写成「A × B」）；命宫无主星时借对宫主星。
 * 关键词取自 lib/ziwei/patterns.ts getMingGongSummary 的 keywordMap / natureMap，昵称与一句话为本仓库自拟。
 * 键为引擎简体星名。
 */
import type { ZiweiChart } from '@/lib/ziwei/types';
import type { Locale } from './index';

export interface StarType {
  /** 昵称（名词），拼成「…型」 */
  nick: string;
  /** 一句话 */
  line: string;
  keywords: [string, string, string];
}

const T = (nick: string, line: string, keywords: [string, string, string]): StarType => ({ nick, line, keywords });

export const STAR_TYPES: Record<Locale, Record<string, StarType>> = {
  zh: {
    紫微: T('领袖', '站在中心定方向时最有力量。', ['尊贵', '独立', '领导']),
    天机: T('军师', '脑子先动，最早看出变化。', ['智慧', '机变', '善谋']),
    太阳: T('暖阳', '越付出、越站到台前越发光。', ['阳刚', '官贵', '慷慨']),
    武曲: T('实干家', '决断快，对钱和事都硬气。', ['财富', '刚毅', '果断']),
    天同: T('和事佬', '不爱争，擅长把日子过舒服。', ['温和', '享福', '随缘']),
    廉贞: T('多面手', '才艺多，好恶分明。', ['才艺', '桃花', '多变']),
    天府: T('守库人', '会攒也会守，稳字当头。', ['财库', '稳重', '保守']),
    太阴: T('月光', '细腻观察，安静地一点点积累。', ['柔美', '财富', '细腻']),
    贪狼: T('探险家', '想做的事很多，样样都能上手。', ['欲望', '桃花', '多才']),
    巨门: T('辩手', '想得深、问得细，靠一张嘴。', ['善辩', '多思', '口才']),
    天相: T('协调者', '在旁边把秤端平、把事办妥。', ['辅佐', '行政', '稳健']),
    天梁: T('长者', '像家里的老大，照看和庇护别人。', ['荫护', '医药', '长辈']),
    七杀: T('将军', '一个人也能往前冲的突破型。', ['将星', '果决', '孤克']),
    破军: T('开拓者', '拆掉旧的，另起一局。', ['开创', '变动', '破旧']),
  },
  ko: {
    紫微: T('리더', '중심에 서서 방향을 정할 때 가장 힘이 나는 사람입니다.', ['품위', '독립', '통솔']),
    天机: T('전략가', '머리가 먼저 움직이고, 변화를 누구보다 빨리 읽는 사람입니다.', ['지혜', '기민함', '계책']),
    太阳: T('햇살', '베풀고 앞에 나설수록 빛나는 사람입니다.', ['활력', '명예', '너그러움']),
    武曲: T('실행가', '결정이 빠르고, 돈과 일 앞에서 단단한 사람입니다.', ['재물', '강직', '결단']),
    天同: T('평화주의자', '다투기보다 편안한 자리를 만드는 사람입니다.', ['온화', '복', '여유']),
    廉贞: T('재주꾼', '재주가 많고, 좋고 싫음이 분명한 사람입니다.', ['재능', '매력', '변화']),
    天府: T('금고지기', '모으고 지키는 데 능한 안정형입니다.', ['곳간', '신중', '안정']),
    太阴: T('달빛', '섬세하게 살피고 조용히 쌓아 가는 사람입니다.', ['섬세함', '재물', '부드러움']),
    贪狼: T('탐험가', '하고 싶은 것이 많고, 무엇이든 곧잘 해내는 사람입니다.', ['욕망', '매력', '다재다능']),
    巨门: T('논객', '깊이 생각하고 따져 묻는, 말로 길을 여는 사람입니다.', ['언변', '탐구', '말솜씨']),
    天相: T('조율사', '곁에서 균형을 잡고 일을 매끄럽게 만드는 사람입니다.', ['보좌', '행정', '균형']),
    天梁: T('맏이', '집안의 어른처럼 살피고 지켜 주는 사람입니다.', ['보호', '의약', '연륜']),
    七杀: T('장수', '혼자서도 밀고 나가는 돌파형입니다.', ['결단', '독립', '추진']),
    破军: T('개척자', '낡은 것을 허물고 새 판을 여는 사람입니다.', ['개척', '변화', '파격']),
  },
};

export interface MingType {
  /** 用来起名的主星（引擎简体名）；命宫空宫时为借来的对宫主星 */
  stars: string[];
  /** 命宫无主星、借对宫时为对宫宫名，否则 undefined */
  borrowedFrom?: string;
  types: StarType[];
}

/** 命宫主星 → 类型。命宫空宫时借对宫主星（引擎已算好 borrowedStars）。 */
export function getMingType(chart: ZiweiChart, locale: Locale): MingType {
  const ming = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  const own = ming?.stars.filter((s) => s.type === 'major').map((s) => s.name) ?? [];
  const borrowed = own.length === 0;
  const stars = borrowed ? ming?.borrowedStars ?? [] : own;
  const table = STAR_TYPES[locale];
  return {
    stars,
    borrowedFrom: borrowed ? ming?.borrowedFromName : undefined,
    types: stars.map((s) => table[s]).filter((t): t is StarType => !!t),
  };
}
