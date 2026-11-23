'use client';
import { BRANCHES } from '@/lib/ziwei/constants';
import { resolveFormBirthTime } from '@/lib/ziwei/share';
import { CN_PROVINCES_KO } from '@/lib/i18n/cn-provinces-ko';
import type { BirthFormState } from './BirthForm';
import { useLocale } from './LocaleProvider';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 排盘依据：这张盘是按哪个时刻、哪种口径排出来的。
 *
 * 同一个生日，各家软件常因晚子时、真太阳时、夏令时处理不同而排出不同的盘，却很少说明原因。
 * 表单里其实已经算出了校正结果，这里在结果页把它再写一遍：填的时刻 → 校正后时刻 → 时辰，
 * 以及换日、夏令时、UTC+8:30 时期等附注。
 */
export default function BasisNote({ form }: { form: BirthFormState }) {
  const { locale, m, ganzhi } = useLocale();
  const b = m.basis;
  const f = m.form;
  const r = resolveFormBirthTime(form);
  if (!r.ok) return null;

  const y = parseInt(form.year), mo = parseInt(form.month), d = parseInt(form.day);
  const isKorea = (form.country ?? 'CN') === 'KR';
  const kstWall = isKorea && form.koreaTimeRule === 'kst-wall';
  const provinceLabel = locale === 'ko' && !isKorea ? CN_PROVINCES_KO[form.province] ?? form.province : form.province;
  const place = form.city || provinceLabel || '';
  const shichen = f.shichen(ganzhi(BRANCHES[r.branch]).main);

  const steps: string[] = [];
  const notes: string[] = [];
  const date = f.summaryDate(y, mo, d);

  if (form.unknownTime || r.adjustedHour === null) {
    steps.push(date, b.unknown);
  } else {
    const clock = `${pad(parseInt(form.clockHour) || 0)}:${pad(parseInt(form.clockMinute) || 0)}`;
    const adjusted = `${pad(r.adjustedHour)}:${pad(r.adjustedMinute ?? 0)}`;
    steps.push(`${date} ${clock}${place ? ` · ${place}` : ''}`);
    if (kstWall) steps.push(b.kstWall(adjusted));
    else if (!isKorea && !form.province) steps.push(b.noCorrection);
    else {
      // 校正量带小数；校正后时刻是向下取整到分钟，这里同样向下取整，两个数才对得上
      const corr = Math.floor(r.correctionMinutes);
      steps.push(b.trueSolar(adjusted, `${corr > 0 ? '+' : ''}${corr}`));
    }
    steps.push(b.branch(shichen));

    if (isKorea && !kstWall && !form.province) notes.push(b.seoulFallback);
    if (r.year !== y || r.month !== mo || r.day !== d) notes.push(f.dayShifted(r.year, r.month, r.day));
    if (r.koreaDst) notes.push(form.koreaDstClock ? b.dstClock : b.dstStandard);
    if (r.korea0830) notes.push(f.korea0830.replace(/^\*\s*/, ''));
    if (r.ambiguous) notes.push(f.koreaAmbiguous.replace(/^\*\s*/, ''));
  }

  return (
    <section
      aria-label={b.title}
      className="mb-3 px-3 py-2 rounded-lg text-[12px] leading-relaxed"
      style={{ border: '1px solid var(--t-border)', color: 'var(--t-text2)' }}
    >
      <span className="font-medium mr-2" style={{ color: 'var(--t-faint)' }}>{b.title}</span>
      {steps.map((s, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: 'var(--t-faint)' }}> → </span>}
          <span style={i === steps.length - 1 ? { color: 'var(--t-gold)', fontWeight: 600 } : undefined}>{s}</span>
        </span>
      ))}
      {notes.length > 0 && (
        <ul className="mt-1 space-y-0.5" style={{ color: 'var(--t-faint)' }}>
          {notes.map((n, i) => <li key={i}>· {n}</li>)}
        </ul>
      )}
    </section>
  );
}
