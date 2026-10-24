/**
 * /knowledge — 知识库主页
 * 列出 14 主星，每星可看其在 13 宫位的解读
 */

import Link from 'next/link';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import { TOPIC_LABEL } from '@/lib/ziwei/db-analysis';
import { Msg, Bi, KoTermText } from '@/components/I18nText';
import LocaleMeta from '@/components/LocaleMeta';
import { MAJOR_STARS_KO } from '@/lib/i18n/terms-ko';
import { STAR_BRIEF_SEO_KO } from '@/lib/i18n/knowledge-ko';

export const metadata = {
  title: '紫微斗数知识库 · 14 主星 × 13 宫位 · 倪海厦正宗体系',
  description: '基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》编纂的紫微斗数知识库。覆盖 14 主星在 13 个宫位的完整论断，含一句话定调、核心论断、命盘依据、经典出处。',
  keywords: ['紫微斗数', '倪海厦', '倪海厦紫微斗数', '紫微斗数全集', '紫微斗数全书', '14 主星', '12 宫位'],
};

export default function KnowledgeHomePage() {
  const STAR_DESCRIPTIONS_QUICK = STAR_BRIEF_SEO;

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <LocaleMeta ko={{ title: '자미두수 명리 백과 · 주성 14 × 궁 13 · 니하이샤 정통 체계', description: '니하이샤 『천기』 체계와 고전 『자미두수전집』 『골수부』를 바탕으로 엮은 자미두수 명리 백과입니다.' }} />
      {/* 顶栏 */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          <Msg k="knowledge.back" />
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          <Msg k="knowledge.headerTitle" />
        </div>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          <Msg k="knowledge.toLibrary" />
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>KNOWLEDGE BASE</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '12px' }}>
          <Msg k="knowledge.title" />
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.08em', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          <Msg k="knowledge.countPre" /><strong style={{ color: 'var(--ac)' }}>{ALL_STARS.length * ALL_TOPICS.length}</strong><Msg k="knowledge.countPost" /><br />
          <Msg k="knowledge.basis" />
        </p>
      </div>

      {/* 14 主星卡片 */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: '24px' }}>
          <Msg k="knowledge.fourteen" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_STARS.map(star => (
            <Link
              key={star}
              href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
              style={{
                display: 'block',
                padding: '14px 10px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(184,146,42,0.2)',
                borderRadius: '10px',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              className="hover:shadow-md hover:border-amber-400"
            >
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em' }}>
                <KoTermText zh={star} term={MAJOR_STARS_KO[star]} />
              </div>
            </Link>
          ))}
        </div>

        {/* 详细列表（每个主星 + 简介 + 进入按钮） */}
        <div className="mt-14 space-y-4">
          {ALL_STARS.map(star => (
            <div key={star} style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(184,146,42,0.18)',
              borderRadius: '12px',
              padding: '18px 22px',
            }}>
              <div className="flex items-baseline gap-3 mb-2">
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>
                  <KoTermText zh={`${star}星`} term={MAJOR_STARS_KO[star]} />
                </span>
                <span style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
                  ZI WEI · 14 STARS
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                <Bi zh={STAR_DESCRIPTIONS_QUICK[star] || ''} ko={STAR_BRIEF_SEO_KO[star]} />
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => {
                  const k = getKnowledge(star, t);
                  if (!k.exists) return null;
                  return (
                    <Link
                      key={t}
                      href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: 'rgba(184,146,42,0.06)',
                        border: '1px solid rgba(184,146,42,0.15)',
                        borderRadius: '999px',
                        color: 'var(--tx-2)',
                        textDecoration: 'none',
                      }}
                    >
                      入{k.palaceName} · {TOPIC_LABEL[t]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
