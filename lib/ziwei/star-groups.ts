/**
 * 非主星的显示分组。引擎的 Star.type（lucky / sha / minor）把杂曜也归进 lucky / sha，
 * 盘面精简显示和「复制给 AI」都需要把六吉禄马、六煞与其余杂曜分开，统一在这里按星名判断。
 */
import type { Star } from './types';

/** 六吉 + 禄存、天马 */
export const AUX_STARS: ReadonlySet<string> = new Set(['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马']);
/** 六煞 */
export const SHA6_STARS: ReadonlySet<string> = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']);

/** 杂曜：主星、六吉禄马、六煞以外的全部 */
export function isMiscStar(star: Star): boolean {
  return star.type !== 'major' && !AUX_STARS.has(star.name) && !SHA6_STARS.has(star.name);
}
