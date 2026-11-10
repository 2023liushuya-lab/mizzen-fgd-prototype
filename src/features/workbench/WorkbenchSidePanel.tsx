'use client';
import { MessageSquareQuote, PanelRightClose, PanelRightOpen, Pin } from 'lucide-react';
import type { Identity, Participant, Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import { HandQueue } from './HandQueue';
import { SpeakingShare } from './SpeakingShare';
import { PaperNotes } from './PaperNotes';
import styles from './WorkbenchPage.module.css';

function formatNoteTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkbenchSidePanel({
  session,
  readonly,
  closed,
  onClosedChange,
  directions,
  onProfile,
  identity,
  now,
  handQueueOpen,
  onHandQueueClose,
}: {
  session: Session;
  readonly: boolean;
  closed: boolean;
  onClosedChange: (closed: boolean) => void;
  directions: string[];
  onProfile: (person: Participant) => void;
  identity: Identity | null;
  selectedId: string | null;
  onQuestion: (id: string) => void;
  now: number;
  handQueueOpen?: boolean;
  onHandQueueClose?: () => void;
}) {
  const pinNote = useFgdStore((s) => s.pinNote);
  const hostNotes = !readonly
    ? session.notes
        .filter((n) => n.status !== 'failed')
        .slice()
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt - a.createdAt)
    : [];

  return (
    <aside className={styles.rightPanel}>
      {closed ? (
        <button
          className={styles.expandRight}
          aria-label="展开右侧"
          onClick={() => onClosedChange(false)}
        >
          <PanelRightOpen size={18} />
        </button>
      ) : (
        <>
          <div className={styles.rightActions}>
            <span className={styles.stateTitle}>
              <span className={styles.spark} aria-hidden="true">
                ✦
              </span>
              <span>现场状态</span>
            </span>
            <button
              className="icon-button"
              aria-label="收起右侧"
              onClick={() => onClosedChange(true)}
            >
              <PanelRightClose size={17} />
            </button>
          </div>
          <div className={`${styles.statePane} ${readonly ? styles.observerPane : ''}`}>
            <div className={styles.stateOverview}>
              {!readonly && (
                <HandQueue
                  session={session}
                  open={!!handQueueOpen}
                  onClose={() => onHandQueueClose?.()}
                />
              )}
              <SpeakingShare session={session} readonly={readonly} onProfile={onProfile} />
              <section className={styles.topicDirections}>
                <div className={styles.topicHead}>
                  <h3>话题追问</h3>
                  <small>{directions.length > 0 ? `${directions.length} 条` : '实时生成'}</small>
                </div>
                <div className={styles.topicList}>
                  {directions.map((text) => (
                    <div key={text} className={styles.topicQuestion}>
                      <span className={styles.topicAiTag}>✧ AI</span>
                      <span>{text}</span>
                    </div>
                  ))}
                  {!directions.length && (
                    <div className={`${styles.topicQuestion} muted`}>
                      等待本轮讨论生成新的话题追问…
                    </div>
                  )}
                </div>
              </section>
            </div>
            {!readonly && (
              <section className={styles.hostNotes} aria-label="旁听小纸条">
                <div className={styles.topicHead}>
                  <h3>
                    <MessageSquareQuote size={14} />
                    小纸条
                  </h3>
                  <small>{hostNotes.length} 条</small>
                </div>
                <div className={styles.hostNoteList}>
                  {hostNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className={`${styles.observerNoteItem} ${note.pinned ? styles.pinnedNote : ''}`}
                      aria-pressed={!!note.pinned}
                      aria-label={`${note.pinned ? '取消置顶' : '置顶'}小纸条：${note.text}`}
                      disabled={session.phase === 'ended'}
                      title={note.pinned ? '取消置顶' : '点击置顶'}
                      onClick={() => pinNote(session.id, note.id, !note.pinned)}
                    >
                      <span className={styles.observerNoteHead}>
                        <span className={styles.observerNoteBadge}>
                          {note.observerName || '旁听者'}
                        </span>
                        <time className={styles.observerNoteTime}>
                          {formatNoteTime(note.createdAt)}
                        </time>
                        <Pin size={13} fill={note.pinned ? 'currentColor' : 'none'} />
                      </span>
                      <span className={styles.observerNoteBody}>{note.text}</span>
                    </button>
                  ))}
                  {!hostNotes.length && (
                    <p className="muted small">旁听者发来的小纸条会显示在这里</p>
                  )}
                </div>
              </section>
            )}
            {readonly && identity && <PaperNotes session={session} identity={identity} now={now} />}
          </div>
        </>
      )}
    </aside>
  );
}
