'use client';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import LocaleMeta from '@/components/LocaleMeta';

/** 404：默认的 Next 404 是英文且沿用中文站点标题，这里按界面语言给出文案 */
export default function NotFound() {
  const { m } = useLocale();
  const t = m.notFound;
  const linkStyle = {
    padding: '8px 16px', borderRadius: 8, fontSize: 14, textDecoration: 'none',
    border: '1px solid var(--bdr-med)', color: 'var(--tx-1)',
  } as const;

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '96px 20px', textAlign: 'center' }}>
      <LocaleMeta ko={{ title: '페이지를 찾을 수 없습니다 · 자미 명반' }} />
      <div style={{ fontSize: 13, letterSpacing: '0.3em', color: 'var(--tx-3)', marginBottom: 12 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--tx-0)' }}>{t.title}</h1>
      <p style={{ fontSize: 14, color: 'var(--tx-2)', marginBottom: 28, lineHeight: 1.7 }}>{t.body}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link href="/" style={linkStyle}>{t.toHome}</Link>
        <Link href="/chart" style={{ ...linkStyle, borderColor: 'var(--ac-bdr)', color: 'var(--ac)' }}>{t.toChart}</Link>
      </div>
    </main>
  );
}
