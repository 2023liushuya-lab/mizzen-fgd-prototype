'use client';
import { MessageSquareQuote, PanelRightClose, PanelRightOpen, Check } from 'lucide-react';
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
  const handleNote = useFgdStore((s) => s.handleNote);
  const hostNotes = !readonly
    ? session.notes
        .filter((n) => n.status !== 'failed')
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
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
                  <small>
                    {hostNotes.length + directions.length > 0
                      ? `${hostNotes.length + directions.length} 条`
                      : '实时生成'}
                  </small>
                </div>
                <div className={styles.topicList}>
                  {hostNotes.map((note) => (
                    <div key={note.id} className={styles.observerNoteItem}>
                      <div className={styles.observerNoteHead}>
                        <span className={styles.observerNoteBadge}>
                          <MessageSquareQuote size={12} />
                          旁听小纸条
                        </span>
                        <time className={styles.observerNoteTime}>
                          {formatNoteTime(note.createdAt)}
                        </time>
                        {note.status === 'handled' ? (
                          <span className={styles.observerNoteHandled}>✓ 已处理</span>
                        ) : (
                          <button
                            type="button"
                            className={styles.observerNoteAction}
                            onClick={() => handleNote(session.id, note.id)}
                          >
                            <Check size={11} />
                            已读
                          </button>
                        )}
                      </div>
                      <p className={styles.observerNoteBody}>{note.text}</p>
                    </div>
                  ))}
                  {directions.map((text) => (
                    <div key={text} className={styles.topicQuestion}>
                      {!readonly && <span className={styles.topicAiTag}>✧ AI</span>}
                      <span>{text}</span>
                    </div>
                  ))}
                  {!hostNotes.length && !directions.length && (
                    <div className={`${styles.topicQuestion} muted`}>
                      等待本轮讨论生成新的话题追问…
                    </div>
                  )}
                </div>
              </section>
            </div>
            {readonly && identity && <PaperNotes session={session} identity={identity} now={now} />}
          </div>
        </>
      )}
    </aside>
  );
}
