/**
 * 古籍原典查询库 · 主页
 *
 * 列出所有收录古籍 + 全局搜索入口
 */

import Link from 'next/link';
import { ALL_BOOKS, TOTAL_PARAGRAPHS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';
import LocaleMeta from '@/components/LocaleMeta';
import { Msg, Bi, KoTermText, OnlyIn } from '@/components/I18nText';
import { CLASSIC_BOOKS_KO } from '@/lib/i18n/classics-ko';

export const metadata = {
  title: '倪师方法论 · 古籍原典库 · 紫微斗数全集 / 全书 / 骨髓赋',
  description: '紫微斗数权威古籍全文检索：《紫微斗数全集》《紫微斗数全书》《骨髓赋》倪海厦《天纪》引证来源',
};

export default function LibraryHomePage() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <LocaleMeta ko={{ title: '니하이샤 방법론 · 고전 원문 서고 · 자미두수전집 / 전서 / 골수부', description: '자미두수 고전 전문 검색: 『자미두수전집』 『자미두수전서』 『골수부』, 니하이샤 『천기』의 인용 출처' }} />
      {/* 顶栏 */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          <Msg k="library.backHome" />
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
          <Msg k="library.headerTitle" />
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          <Msg k="library.toChart" />
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>NI HAI XIA · CURRICULUM</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          <Msg k="library.heroTitle" />
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.1em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          <Msg k="library.heroSub" /><br />
          <Msg k="library.countPre" /><strong style={{ color: 'var(--ac)' }}>{ALL_BOOKS.length}</strong><Msg k="library.countMid" /><strong style={{ color: 'var(--ac)' }}>{TOTAL_PARAGRAPHS}</strong><Msg k="library.countPost" />
          <OnlyIn locale="ko"><br /><span style={{ fontSize: '12px', color: 'var(--tx-3)' }}><Msg k="library.translationNote" /></span></OnlyIn>
        </p>
      </div>

      {/* 搜索 */}
      <div className="max-w-2xl mx-auto px-6 mb-12">
        <LibrarySearch />
      </div>

      {/* 古籍列表 */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_BOOKS.map(book => (
            <Link
              key={book.slug}
              href={`/library/${book.slug}`}
              style={{
                display: 'block',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '14px',
                padding: '24px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(184,146,42,0.06)',
              }}
              className="hover:shadow-lg"
            >
              <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '6px' }}>
                <Bi zh={book.dynasty} ko={CLASSIC_BOOKS_KO[book.slug]?.dynasty} /> · <Bi zh={book.author.split(' ')[0]} ko={CLASSIC_BOOKS_KO[book.slug]?.author} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--tx-0)', marginBottom: '10px', letterSpacing: '0.1em' }}>
                <Msg k="library.bookOpen" /><KoTermText zh={book.title} term={CLASSIC_BOOKS_KO[book.slug]?.title} /><Msg k="library.bookClose" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '14px' }}>
                <Bi zh={book.intro} ko={CLASSIC_BOOKS_KO[book.slug]?.intro} />
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--tx-3)' }}>
                <span><Msg k="library.chapterCount" args={[book.chapters.length]} /></span>
                <span style={{ color: 'rgba(184,146,42,0.4)' }}>·</span>
                <span><Msg k="library.paraCount" args={[book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)]} /></span>
              </div>
              <div style={{
                display: 'inline-flex',
                marginTop: '14px',
                fontSize: '11px',
                color: 'var(--ac)',
                letterSpacing: '0.15em',
                fontWeight: 500,
              }}>
                <Msg k="library.enter" />
              </div>
            </Link>
          ))}
        </div>

        {/* 底部说明 */}
        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(184,146,42,0.05)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ac-dim)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: '8px' }}>
            <Msg k="library.aboutTitle" />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>
            <Msg k="library.about1" /><br />
            <Msg k="library.about2" /><br />
            <Msg k="library.about3" />
          </div>
        </div>
      </div>
    </div>
  );
}
