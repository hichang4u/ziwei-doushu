import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import { resolveBirthTime, type ResolvedBirthTime } from './birth-time';

/** 表单状态 → 排盘日 + 时辰支（口径见 birth-time.ts） */
export function resolveFormBirthTime(form: BirthFormState): ResolvedBirthTime {
  return resolveBirthTime({
    year: parseInt(form.year) || 0,
    month: parseInt(form.month) || 0,
    day: parseInt(form.day) || 0,
    clockHour: parseInt(form.clockHour) || 0,
    clockMinute: parseInt(form.clockMinute) || 0,
    unknownTime: form.unknownTime,
    country: form.country ?? 'CN',
    longitude: form.province ? form.longitude : undefined,
    koreaTimeRule: form.koreaTimeRule,
    koreaDstClock: form.koreaDstClock,
  });
}

/** BirthFormState → BirthInfo
 *
 * 子时规则（倪海厦体系/三合派标准）：
 * · 23:00-23:59 = 晚子时，**按次日**排盘（日期 +1）
 * · 00:00-00:59 = 早子时，按本日排盘
 * 这与「时辰支同为子(0)」并不冲突——子时分早晚两段，需要在日期上区分。
 * 早晚子时按**校正后**的时刻判断（真太阳时 / 韩国历史偏移折算之后），见 birth-time.ts。
 *
 * 日期不存在、或韩国夏令时拨快的空档时刻 → 抛 RangeError（表单层应先拦下）。
 */
export function formToBirthInfo(form: BirthFormState): BirthInfo {
  const r = resolveFormBirthTime(form);
  if (!r.ok) throw new RangeError(`birth time unresolvable: ${r.reason}`);
  return {
    year: r.year, month: r.month, day: r.day,
    hour: r.branch,
    gender: form.gender,
    name: form.name || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    longitude: form.province ? form.longitude : undefined,
    origInput: form.unknownTime ? undefined : {
      year: parseInt(form.year) || 0,
      month: parseInt(form.month) || 0,
      day: parseInt(form.day) || 0,
      clockHour: parseInt(form.clockHour) || 0,
      clockMinute: parseInt(form.clockMinute) || 0,
    },
  };
}

/** BirthFormState → URLSearchParams（用于分享链接） */
export function formToSearchParams(form: BirthFormState): URLSearchParams {
  const p = new URLSearchParams();
  if (form.name) p.set('n', form.name);
  p.set('y', form.year);
  p.set('m', form.month);
  p.set('d', form.day);
  if (form.unknownTime) {
    p.set('u', '1');
  } else {
    p.set('h', form.clockHour);
    p.set('mi', form.clockMinute);
  }
  if (form.province) p.set('p', form.province);
  if (form.city) p.set('c', form.city);
  if (form.longitude && form.longitude !== 120) p.set('lo', String(form.longitude));
  // 韩国路径参数只在韩国出生时写入，老链接与中国出生链接保持原样
  if (form.country === 'KR') {
    p.set('co', 'kr');
    if (form.koreaTimeRule === 'kst-wall') p.set('kr', 'w');
    if (form.koreaDstClock) p.set('ds', '1');
  }
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整时返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
  return {
    name: params.get('n') || '',
    year,
    month,
    day,
    unknownTime: params.get('u') === '1',
    clockHour: params.get('h') || '8',
    clockMinute: params.get('mi') || '0',
    province: params.get('p') || '',
    city: params.get('c') || '',
    longitude: parseFloat(params.get('lo') || '120'),
    country: params.get('co') === 'kr' ? 'KR' : 'CN',
    koreaTimeRule: params.get('kr') === 'w' ? 'kst-wall' : 'true-solar',
    koreaDstClock: params.get('ds') === '1',
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
