'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, LockKeyhole, Mail, Send, X } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import type { Identity, PaperNote, Session } from '@/types/fgd';
import { downloadText } from '@/lib/utils';
import { openedQuestions, questionNumber } from './helpers';
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
  selectedId,
  onQuestion,
  now,
}: {
  session: Session;
  identity: Identity;
  selectedId: string | null;
  onQuestion: (id: string) => void;
  now: number;
}) {
  const send = useFgdStore((s) => s.sendNote);
  const [text, setText] = useState('');
  const [target, setTarget] = useState(selectedId || '');
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const targetManual = useRef(false);
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
      targetManual.current = Boolean(draft?.targetManual || (draft?.text && draft?.questionId));
      setText(draft?.text || '');
      setTarget(draft?.questionId || selectedId || '');
    } catch {
      setText('');
    }
    setLoadedKey(key);
  }, [key]); // only switch drafts when scope/identity changes
  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          text,
          questionId: target,
          targetManual: targetManual.current,
        }),
      );
      setDraftError('');
    } catch {
      setDraftError('草稿暂未保存到本地，内容仍保留在输入框中。');
    }
  }, [text, target, key, loadedKey]);
  useEffect(() => {
    if (!targetManual.current && selectedId) setTarget(selectedId);
  }, [selectedId]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [notes.length]);
  function submit(event?: React.FormEvent, retry?: PaperNote) {
    event?.preventDefault();
    const value = retry?.text || text.trim();
    if (!value) return;
    const result = send(
      session.id,
      identity,
      value,
      retry ? retry.questionId : target || null,
      retry?.id,
    );
    if (result.ok) {
      if (!retry) setText('');
      setError('');
    } else setError(result.error || '未发送成功，内容已保留。');
  }
  function exportNotes() {
    const rows = notes
      .map(
        (n, i) =>
          `## ${i + 1}. ${n.questionTitle || '整场访谈'}\n\n${new Date(n.createdAt).toLocaleString('zh-CN')} · ${n.status === 'handled' ? '已处理' : n.status === 'failed' ? '发送失败' : '已送达'}\n\n${n.text}`,
      )
      .join('\n\n');
    downloadText(
      `${session.title}-我的小纸条与笔记.md`,
      `# ${session.title}\n\n称呼：${identity.name}\n\n${rows || '暂无已发送纸条'}\n\n## 未发送笔记／草稿\n\n${text || '无未发送草稿'}`,
    );
  }
  return (
    <section className={styles.notesPanel}>
      <div className={styles.privacy}>
        <LockKeyhole size={12} />
        仅你与主持人可见
      </div>
      <div ref={listRef} className={styles.noteList} aria-live="polite">
        {!notes.length && (
          <div className={styles.noteEmpty}>
            <Mail size={25} />
            <p>
              把想继续了解的问题
              <br />
              发给主持人
            </p>
          </div>
        )}
        {notes.map((note) => (
          <article key={note.id} className={styles.noteMessage}>
            <div className={styles.noteMeta}>
              <strong>{note.observerName}</strong>
              <time>{noteTime(note.createdAt)}</time>
            </div>
            <div className={styles.noteBubble}>
              {note.questionId ? (
                <button
                  className={styles.noteContext}
                  title={note.questionTitle}
                  onClick={() => onQuestion(note.questionId!)}
                >
                  Q{questionNumber(session, note.questionId)} · {note.questionTitle}
                </button>
              ) : (
                <span className={styles.noteContext}>整场访谈</span>
              )}
              <p>{note.text}</p>
            </div>
            <div className={styles.noteStatus}>
              {note.status === 'failed' ? (
                <>
                  <span>发送失败</span>
                  {!readonly && <button onClick={() => submit(undefined, note)}>重试</button>}
                </>
              ) : note.status === 'handled' ? (
                <span className={styles.handled}>已处理</span>
              ) : (
                '已送达'
              )}
            </div>
          </article>
        ))}
      </div>
      <form className={styles.noteComposer} onSubmit={submit}>
        <label className={styles.noteTarget}>
          关联题目
          <select
            aria-label="小纸条关联题目"
            value={target}
            onChange={(e) => {
              targetManual.current = true;
              setTarget(e.target.value);
            }}
            disabled={readonly}
          >
            <option value="">整场访谈</option>
            {openedQuestions(session).map((q) => (
              <option key={q.id} value={q.id}>
                Q{questionNumber(session, q.id)} · {q.type}
                {q.id === session.currentQuestionId ? '（当前）' : ''}
              </option>
            ))}
          </select>
        </label>
        <textarea
          aria-label="小纸条内容"
          placeholder={readonly ? '访谈已结束，可导出你的笔记' : '给主持人一个追问建议…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
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
              onClick={exportNotes}
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
        {remaining > 0 && !readonly && (
          <small className={styles.rateHint}>每分钟可发送一条，内容会自动保存</small>
        )}
      </form>
    </section>
  );
}

export function HostInbox({
  session,
  open,
  onClose,
  onQuestion,
}: {
  session: Session;
  open: boolean;
  onClose: () => void;
  onQuestion: (id: string) => void;
}) {
  const handle = useFgdStore((s) => s.handleNote);
  if (!open) return null;
  const pending = session.notes.filter((n) => n.status === 'pending');
  const handled = session.notes.filter((n) => n.status === 'handled');
  const renderNote = (note: PaperNote) => (
    <article className={styles.inboxNote} key={note.id}>
      <div className={styles.noteMeta}>
        <strong>{note.observerName}</strong>
        <time>{noteTime(note.createdAt)}</time>
      </div>
      {note.questionId && (
        <button className={styles.inboxContext} onClick={() => onQuestion(note.questionId!)}>
          Q{questionNumber(session, note.questionId)} · {note.questionTitle}
        </button>
      )}
      <p>{note.text}</p>
      {note.status === 'handled' ? (
        <small className={styles.handled}>已处理</small>
      ) : (
        <button
          className="ui-button button-outline button-small"
          onClick={() => handle(session.id, note.id)}
        >
          标记已处理
        </button>
      )}
    </article>
  );
  return (
    <aside className={styles.inboxDrawer} role="dialog" aria-label="旁听小纸条收件箱">
      <div className={styles.inboxHeading}>
        <strong>旁听小纸条</strong>
        <button className="icon-button" aria-label="关闭小纸条" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className={styles.inboxScroll}>
        {!pending.length && <p className={styles.noteEmpty}>暂无待处理的小纸条</p>}
        {pending.map(renderNote)}
        {!!handled.length && (
          <details>
            <summary>已处理（{handled.length}）</summary>
            {handled.map(renderNote)}
          </details>
        )}
      </div>
      <small className={styles.privacy}>
        <LockKeyhole size={12} />
        仅主持人与发送者可见
      </small>
    </aside>
  );
}
