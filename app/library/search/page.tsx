/**
 * /library/search?q=xxx — 搜索结果页
 */

import Link from 'next/link';
import { searchClassics, getParagraphById } from '@/lib/classics';
import { Msg, KoTermText } from '@/components/I18nText';
import LocaleMeta from '@/components/LocaleMeta';
import { CLASSIC_BOOKS_KO, CLASSIC_CHAPTERS_KO, CLASSIC_PARAGRAPHS_KO } from '@/lib/i18n/classics-ko';

export const metadata = {
  title: '搜索 · 古籍原典库',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  // 含韩文的检索词搜韩文译文（原文是简体古文，韩文 / 正体字搜不到），其余搜原文
  const searchKo = /[가-힣]/.test(q);
  const hits = q ? searchClassics(q, 50, searchKo ? p => CLASSIC_PARAGRAPHS_KO[p.id] : undefined) : [];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <LocaleMeta ko={{ title: '검색 · 고전 원문 서고' }} />
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          <Msg k="library.backLibrary" />
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          <Msg k="library.searchTitle" />
        </div>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          <Msg k="library.home" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div style={{ fontSize: '13px', color: 'var(--tx-3)', letterSpacing: '0.15em', marginBottom: '4px' }}>
            <Msg k="library.searchKeyword" />
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
            「{q || <Msg k="library.searchEmpty" />}」
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '8px' }}>
            <Msg k="library.foundPre" /><strong style={{ color: 'var(--ac)' }}>{hits.length}</strong><Msg k="library.foundPost" />
          </div>
        </div>

        {hits.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            padding: '40px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--tx-2)',
            border: '1px solid rgba(184,146,42,0.15)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>📜</div>
            {q ? (
              <>
                <div style={{ fontSize: '14px', marginBottom: '6px' }}><Msg k="library.notFound" /></div>
                <div style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.7 }}>
                  <Msg k="library.tryHint" /><br />
                  <span style={{ color: 'var(--ac)' }}><Msg k="library.trySamples" /></span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px' }}><Msg k="library.enterKeyword" /></div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hits.map((hit, i) => {
              const ctx = getParagraphById(hit.paragraphId);
              const chapterIdx = ctx?.chapterIdx ?? 0;
              return (
                <Link
                  key={i}
                  href={`/library/${hit.bookSlug}/${chapterIdx}#${hit.paragraphId}`}
                  style={{
                    display: 'block',
                    background: 'var(--bg-card)',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(184,146,42,0.18)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: 'var(--tx-3)',
                    marginBottom: '8px',
                    letterSpacing: '0.1em',
                  }}>
                    <span style={{ color: 'var(--ac)', fontWeight: 600 }}>
                      <Msg k="library.bookOpen" /><KoTermText zh={hit.bookTitle} term={CLASSIC_BOOKS_KO[hit.bookSlug]?.title} /><Msg k="library.bookClose" />
                    </span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span><KoTermText zh={hit.chapterTitle} term={CLASSIC_CHAPTERS_KO[`${hit.bookSlug}/${chapterIdx}`]?.title} /></span>
                    {searchKo && <span style={{ marginLeft: 'auto', color: 'var(--ac)' }}><Msg k="library.koHit" /></span>}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--tx-0)',
                      lineHeight: 1.9,
                      letterSpacing: '0.02em',
                    }}
                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        mark { background: rgba(184,146,42,0.3); color: #8b6a14; padding: 0 2px; border-radius: 2px; font-weight: 600; }
      `}</style>
    </div>
  );
}
