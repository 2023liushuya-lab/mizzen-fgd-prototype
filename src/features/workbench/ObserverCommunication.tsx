'use client';
import { useState } from 'react';
import type { Identity, Session } from '@/types/fgd';
import { PaperNotes } from './PaperNotes';
import styles from './MjdControls.module.css';
function answerFromSession(session: Session, prompt: string) {
  const match = prompt.match(/(?:q|第)\s*(\d+)/i);
  const target = match ? session.questions[Number(match[1]) - 1] : null;
  if (match && !target) return '当前大纲里没有这道题。';
  if (target && !session.runs[target.id])
    return `Q${session.questions.indexOf(target) + 1}「${target.title}」尚未开始，当前没有已发生的讨论记录。`;
  const questions = target ? [target] : session.questions.filter((q) => session.runs[q.id]);
  const rows = questions.flatMap((q) => {
    const run = session.runs[q.id];
    const texts = run.transcript.slice(-2).map((t) => `${t.name}：“${t.text}”`);
    return texts.length
      ? [`Q${session.questions.indexOf(q) + 1} ${q.title}\n${texts.join('\n')}`]
      : [];
  });
  return rows.length
    ? `以下来自本场已发生的讨论记录：\n\n${rows.slice(-4).join('\n\n')}\n\n原型按记录摘取，尚未接入真实 AI 语义分析。`
    : '本场还没有可引用的发言记录，可以在开始讨论后再问。';
}
export function ObserverCommunication({
  session,
  identity,
  now,
}: {
  session: Session;
  identity: Identity;
  now: number;
}) {
  const [tab, setTab] = useState<'note' | 'ai'>('note'),
    [text, setText] = useState(''),
    [turns, setTurns] = useState<{ role: string; text: string }[]>([]);
  return (
    <div className={styles.comm}>
      <div className={styles.commTabs} role="group" aria-label="旁听沟通方式">
        <button aria-pressed={tab === 'ai'} onClick={() => setTab('ai')}>
          问 AI
        </button>
        <button aria-pressed={tab === 'note'} onClick={() => setTab('note')}>
          递小纸条
        </button>
      </div>
      {tab === 'note' ? (
        <PaperNotes session={session} identity={identity} now={now} />
      ) : (
        <section className={styles.chat}>
          <div className={styles.chatHead}>
            <strong>与 AI 聊天</strong>
            <small>原型演示</small>
          </div>
          <div className={styles.chatHistory} aria-live="polite">
            {!turns.length && (
              <p className="muted small">例如：总结前面发生了什么？Q3 是否问到？</p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={styles.chatTurn}>
                <small>{t.role === 'user' ? '你' : 'AI · 记录摘取'}</small>
                {t.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              setTurns((ts) => [
                ...ts,
                { role: 'user', text: text.trim() },
                { role: 'ai', text: answerFromSession(session, text) },
              ]);
              setText('');
            }}
          >
            <textarea
              aria-label="向AI提问"
              placeholder="问 AI，不会发给主持人"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
            />
            <div>
              <span>仅当前旁听者可见</span>
              <button className="ui-button button-primary button-small" disabled={!text.trim()}>
                发送给 AI
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
