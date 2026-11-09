'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Mail, Send } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import type { Identity, PaperNote, Session } from '@/types/fgd';
import { exportObserverNotes } from './export-observer-notes';
import styles from './PaperNotes.module.css';

function noteTime(time: number) {
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaperNotes({
  session,
  identity,
  now,
}: {
  session: Session;
  identity: Identity;
  now: number;
}) {
  const send = useFgdStore((s) => s.sendNote);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const key = `mizzen-fgd-react:draft:${session.projectId}:${session.id}:${identity.id}`;
  const notes = session.notes.filter((n) => n.observerId === identity.id);
  const lastSent = notes
    .filter((n) => n.status !== 'failed')
    .reduce((t, n) => Math.max(t, n.createdAt), 0);
  const remaining = Math.max(0, Math.ceil((lastSent + 60_000 - now) / 1000));
  const readonly = session.phase === 'ended';
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(key) || 'null');
      setText(draft?.text || '');
    } catch {
      setText('');
    }
    setLoadedKey(key);
  }, [key]);
  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          text,
        }),
      );
      setDraftError('');
    } catch {
      setDraftError('草稿暂未保存到本地，内容仍保留在输入框中。');
    }
  }, [text, key, loadedKey]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [notes.length]);
  function submit(event?: React.FormEvent, retry?: PaperNote) {
    event?.preventDefault();
    const value = retry?.text || text.trim();
    if (!value) return;
    const result = send(session.id, identity, value, null, retry?.id);
    if (result.ok) {
      if (!retry) setText('');
      setError('');
    } else setError(result.error || '未发送成功，内容已保留。');
  }
  return (
    <section className={styles.notesCard}>
      <div className={styles.notesCardHead}>
        <strong>
          递小纸条 <span className={styles.notesPrivacy}>· 仅主持人可见</span>
        </strong>
        <span className="badge">{notes.length}</span>
      </div>
      <div ref={listRef} className={styles.noteList} aria-live="polite">
        {!notes.length && (
          <div className={styles.noteEmpty}>
            <Mail size={22} />
            <p>
              {readonly ? (
                '本场暂无你的小纸条记录'
              ) : (
                <>
                  发现值得深挖的细节？
                  <br />
                  随时给主持人递一张小纸条（仅你们两人可见）
                </>
              )}
            </p>
          </div>
        )}
        {notes.map((note) => (
          <article key={note.id} className={styles.noteMessage}>
            <div className={styles.noteMeta}>
              <strong>小纸条</strong>
              <time>{noteTime(note.createdAt)}</time>
            </div>
            <div className={styles.noteBubble}>
              <p>{note.text}</p>
            </div>
            <div className={styles.noteStatus}>
              {note.status === 'failed' ? (
                <>
                  <span>发送失败</span>
                  {!readonly && (
                    <button type="button" onClick={() => submit(undefined, note)}>
                      重新发送
                    </button>
                  )}
                </>
              ) : note.status === 'handled' ? (
                <span className={styles.handled}>✓ 主持人已处理</span>
              ) : (
                '已送达主持人'
              )}
            </div>
          </article>
        ))}
      </div>
      <form className={styles.noteComposer} onSubmit={submit}>
        <textarea
          aria-label="小纸条内容"
          placeholder={
            readonly
              ? '访谈已结束，纸条输入已关闭'
              : '给主持人递小纸条（Enter 直接发送，Shift+Enter 换行）…'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (!e.nativeEvent.isComposing && !e.shiftKey && e.key === 'Enter') {
              e.preventDefault();
              if (!readonly && text.trim() && remaining <= 0) submit();
            }
          }}
          maxLength={120}
          disabled={readonly}
        />
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        {draftError && (
          <p className={styles.formError} role="status">
            {draftError}
          </p>
        )}
        <div className={styles.composerFooter}>
          <small>{text.length} / 120</small>
          {readonly ? (
            <button
              type="button"
              className="ui-button button-outline button-small"
              onClick={() => exportObserverNotes(session, identity)}
            >
              <Download size={14} />
              导出笔记
            </button>
          ) : (
            <button
              className="ui-button button-primary button-small"
              disabled={!text.trim() || remaining > 0}
              aria-label="发送给主持人"
            >
              <Send size={13} />
              {remaining > 0 ? `${remaining}s` : '发送'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
