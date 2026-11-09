'use client';
import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import { formatTime } from '@/lib/utils';
import type { Session, Transcript } from '@/types/fgd';
import styles from './Conversations.module.css';

export function TranscriptList({
  session,
  readonly = false,
}: {
  session: Session;
  readonly?: boolean;
}) {
  const correct = useFgdStore((s) => s.correctSpeaker);
  const entries = Object.values(session.runs)
    .flatMap((run) => run.transcript.map((line) => ({ line, questionId: run.questionId })))
    .sort((a, b) => a.line.createdAt - b.line.createdAt);
  return (
    <div className={styles.transcriptList} aria-live="polite">
      {!entries.length && <p className={styles.noteEmpty}>发言后在此显示字幕</p>}
      {entries.map(({ line, questionId }) => (
        <article className={styles.utterance} key={line.id}>
          <div className={styles.utteranceMeta}>
            {readonly || session.phase === 'ended' ? (
              <span>{line.name}</span>
            ) : (
              <label>
                <span className="sr-only">修正说话人</span>
                <select
                  aria-label={`修正${line.name}的说话人`}
                  value={line.participantId}
                  onChange={(e) => correct(session.id, questionId, line.id, e.target.value)}
                >
                  {!session.participants.some((p) => p.id === line.participantId) && (
                    <option value={line.participantId}>{line.name}</option>
                  )}
                  {session.participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <time>{formatTime(line.createdAt - (session.startedAt || line.createdAt))}</time>
          </div>
          <p>{line.text}</p>
          {line.translation && <p className={styles.translation}>{line.translation}</p>}
        </article>
      ))}
    </div>
  );
}

export function ConversationPopover({
  session,
  type,
  onClose,
}: {
  session: Session;
  type: 'chat' | 'transcript';
  onClose: () => void;
}) {
  const sendChat = useFgdStore((s) => s.sendChat);
  const [text, setText] = useState('');
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim()) {
      sendChat(session.id, 'host', '主持人', text.trim());
      setText('');
    }
  }
  return (
    <section
      className={`${styles.conversationPopover} ${type === 'chat' ? styles.chatLeft : styles.captionRight}`}
      role="dialog"
      aria-label={type === 'chat' ? '聊天' : '字幕'}
    >
      <div className={styles.inboxHeading}>
        <strong>{type === 'chat' ? '聊天' : '字幕'}</strong>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={type === 'chat' ? '关闭聊天' : '关闭字幕'}
        >
          <X size={17} />
        </button>
      </div>
      {type === 'transcript' ? (
        <TranscriptList session={session} />
      ) : (
        <>
          <div className={styles.chatMessages} aria-live="polite">
            {!session.chats.length && (
              <div className={styles.noteEmpty}>
                <MessageSquare size={25} />
                <p>本场聊天消息在此显示</p>
              </div>
            )}
            {session.chats
              .filter((m) => !m.reaction)
              .map((message) => (
                <article className={styles.chatMessage} key={message.id}>
                  <div className={styles.noteMeta}>
                    <strong>{message.name}</strong>
                    <time>
                      {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
          </div>
          <form className={styles.chatComposer} onSubmit={submit}>
            <textarea
              placeholder="发送消息给大家…"
              aria-label="聊天内容"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={session.phase === 'ended'}
            />
            <button
              className="icon-button"
              aria-label="发送聊天消息"
              disabled={!text.trim() || session.phase === 'ended'}
            >
              <Send size={17} />
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export function ReactionBubbles({ session }: { session: Session }) {
  const now = Date.now();
  return (
    <div className={styles.reactionLayer} aria-live="polite">
      {session.chats
        .filter((m) => m.reaction && now - m.createdAt < 5000)
        .slice(-5)
        .map((m, i) => (
          <span key={m.id} className={styles.reactionBubble} style={{ left: `${20 + i * 15}%` }}>
            <b>{m.text}</b>
            <small>{m.name}</small>
          </span>
        ))}
    </div>
  );
}
