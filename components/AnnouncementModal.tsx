'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from './LocaleProvider';

// 公告版本号——以后想再弹新公告，改这里就行（旧版 key 失效，新版重新弹一次）
const ANNOUNCEMENT_VERSION = '2026-05-01';
const STORAGE_KEY = `announcement_seen_${ANNOUNCEMENT_VERSION}`;

// 公告文案：zh 由原 JSX 逐字迁出；ko 为韩文译文
const TEXT = {
  zh: {
    title: '致正在使用这个平台的你',
    close: '关闭',
    bannerTag: 'LIMITED TIME · 限时回馈',
    bannerDate: '5 月 1 日 — 5 月 8 日',
    bannerBody: '平台全部功能 + AI 提问 全部免费开放',
    p1: '说实话，我真的没想到会有这么大的流量。',
    p2: '最开始做这个平台，我的初心其实很简单：在 AI 时代，把倪师这套原本复杂、门槛很高的体系，尽量做得更简单、更高效、更容易理解。',
    p3: '不一定每个人都要先学很久、看很多书，才能接触这些内容。我们希望通过这个平台，让大家用更轻松的方式，获得一些对自我、人生阶段、选择方向的参考和启发。',
    quote: '倪师曾说过一句话：人怎么可能发明出完全没有用的东西呢？',
    p4: '我一直觉得，易经如此，紫微斗数也是如此。它们真正有价值的地方，不是让人被某个结果困住，而是让我们更早看见自己的性格惯性、人生课题和选择方向。看见之后，才有机会调整；理解之后，才有机会变得更好。',
    p5: '至于那些说\u201c你当下在看这些，其实也是命运的一部分\u201d之类的话，我就不多评价了。',
    p6: '这几天账号被小红书抬走了，',
    p6Strong: '5 月 3 号开始恢复正常更新。',
    p7: '最后，真心祝愿大家都能越来越了解自己，越来越爱自己，也越来越有能力爱身边的人。',
    sign: '——谢谢大家 🙏',
    ok: '我知道了',
  },
  ko: {
    title: '이 플랫폼을 쓰고 있는 당신에게',
    close: '닫기',
    bannerTag: 'LIMITED TIME · 기간 한정 혜택',
    bannerDate: '5월 1일 — 5월 8일',
    bannerBody: '플랫폼 전체 기능 + AI 질문 모두 무료 개방',
    p1: '솔직히 이렇게 많은 분이 찾아오실 줄은 정말 몰랐습니다.',
    p2: '처음 이 플랫폼을 만들 때 제 초심은 단순했습니다. AI 시대에, 원래 복잡하고 문턱이 높은 니하이샤(倪海厦) 선생의 체계를 최대한 더 쉽고, 더 효율적이고, 더 이해하기 쉽게 만드는 것이었습니다.',
    p3: '누구나 오래 공부하고 많은 책을 읽어야만 이런 내용을 접할 수 있는 것은 아닙니다. 이 플랫폼을 통해 더 가벼운 방식으로 자신과 인생의 단계, 선택의 방향에 대한 참고와 영감을 얻으시길 바랍니다.',
    quote: '니 선생은 이런 말을 한 적이 있습니다. 사람이 어떻게 완전히 쓸모없는 것을 발명할 수 있겠는가?',
    p4: '저는 늘 역경이 그렇고 자미두수도 그렇다고 생각해 왔습니다. 이것들의 진짜 가치는 사람을 어떤 결과에 가두는 데 있지 않고, 자신의 성격 습관, 인생 과제, 선택의 방향을 더 일찍 보게 하는 데 있습니다. 보고 나서야 고칠 기회가 생기고, 이해하고 나서야 더 나아질 기회가 생깁니다.',
    p5: '\u201c지금 이것을 보고 있는 것도 사실 운명의 일부\u201d라는 식의 말에 대해서는 따로 평하지 않겠습니다.',
    p6: '요 며칠 계정이 샤오훙수(小紅書)에서 정지되었습니다. ',
    p6Strong: '5월 3일부터 정상적으로 업데이트를 재개합니다.',
    p7: '끝으로, 모두가 자신을 점점 더 잘 알고, 점점 더 자신을 사랑하고, 곁에 있는 사람을 사랑할 힘도 점점 더 커지기를 진심으로 바랍니다.',
    sign: '——모두 감사합니다 🙏',
    ok: '확인했습니다',
  },
};

export default function AnnouncementModal() {
  // 默认不开，client 端 useEffect 检查 localStorage 后立即决定是否弹出。
  // 没看过 → 立即覆盖首页；看过 → 不再弹。
  const [open, setOpen] = useState(false);
  const [decided, setDecided] = useState(false); // hydration 完成标志
  const { locale } = useLocale();
  const t = TEXT[locale];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch { /* localStorage 可能被禁，忽略 */ }
    setDecided(true);
  }, []);

  // 公告打开时锁住 body 滚动，防止背后首页可滚（仪式感更强）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* skip */ }
  };

  if (!decided) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // 不点击外部关闭——强制用户按"我知道了"按钮才能进入首页
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(20,12,2,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #fefcf6 0%, #faf3e3 100%)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: 'min(85vh, 760px)',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(60,30,10,0.4), 0 4px 16px rgba(60,30,10,0.2)',
              border: '1px solid rgba(184,146,42,0.25)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            }}
          >
            {/* 顶部装饰 + 关闭按钮 */}
            <div style={{
              padding: '22px 28px 14px',
              borderBottom: '1px solid rgba(184,146,42,0.15)',
              background: 'linear-gradient(180deg, rgba(184,146,42,0.08) 0%, transparent 100%)',
              flexShrink: 0,
              position: 'relative',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#b8922a', opacity: 0.7, marginBottom: '6px' }}>
                A LETTER TO USERS
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#3d2f10', letterSpacing: '0.08em', margin: 0 }}>
                {t.title}
              </h2>
              <button
                onClick={close}
                aria-label={t.close}
                style={{
                  position: 'absolute', top: '14px', right: '16px',
                  width: '28px', height: '28px',
                  background: 'rgba(184,146,42,0.08)',
                  border: '1px solid rgba(184,146,42,0.2)',
                  borderRadius: '50%',
                  color: '#7a5e2a', fontSize: '14px',
                  cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* 限时免费 banner（最关键信息，置顶强调）*/}
            <div style={{
              margin: '14px 22px 0',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
              border: '1.5px dashed rgba(232,132,62,0.5)',
              borderRadius: '12px',
              flexShrink: 0,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#c45a2d', marginBottom: '4px', fontWeight: 600 }}>
                {t.bannerTag}
              </div>
              <div style={{ fontSize: '14px', color: '#8b3a1a', fontWeight: 600, lineHeight: 1.6 }}>
                <span style={{ fontSize: '16px', color: '#c45a2d', fontWeight: 700 }}>{t.bannerDate}</span>
                <br />
                {t.bannerBody}
              </div>
            </div>

            {/* 正文（可滚动）*/}
            <div style={{
              padding: '18px 28px 24px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: 1.85,
              color: '#5a4a30',
              flex: 1,
            }}>
              <p style={{ margin: '0 0 12px' }}>
                {t.p1}
              </p>
              <p style={{ margin: '0 0 12px' }}>
                {t.p2}
              </p>
              <p style={{ margin: '0 0 12px' }}>
                {t.p3}
              </p>
              <p style={{
                margin: '0 0 12px',
                padding: '10px 14px',
                background: 'rgba(184,146,42,0.07)',
                borderLeft: '3px solid rgba(184,146,42,0.45)',
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                color: '#7a5e2a',
              }}>
                {t.quote}
              </p>
              <p style={{ margin: '0 0 12px' }}>
                {t.p4}
              </p>
              <p style={{ margin: '0 0 12px' }}>
                {t.p5}
              </p>
              <p style={{ margin: '0 0 12px' }}>
                {t.p6}<strong style={{ color: '#c45a2d' }}>{t.p6Strong}</strong>
              </p>
              <p style={{ margin: '0 0 16px', color: '#3d2f10', fontWeight: 500 }}>
                {t.p7}
              </p>
              <p style={{ margin: 0, textAlign: 'right', fontSize: '13px', color: '#7a5e2a' }}>
                {t.sign}
              </p>
            </div>

            {/* 底部按钮 */}
            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(184,146,42,0.15)',
              background: 'rgba(184,146,42,0.04)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0,
            }}>
              <button
                onClick={close}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #b8922a 0%, #9a7a20 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(184,146,42,0.3)',
                }}
              >
                {t.ok}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
