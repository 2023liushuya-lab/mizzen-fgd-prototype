'use client';
import { MessageSquareQuote, PanelRightClose, PanelRightOpen, Pin } from 'lucide-react';
import type { Identity, Participant, Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import { HandQueue } from './HandQueue';
import { SpeakingShare } from './SpeakingShare';
import { ObserverCommunication } from './ObserverCommunication';
import mjd from './MjdControls.module.css';
import { promptTags } from '@/lib/mjd-signals';
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
                  <div className={mjd.tags}>
                    {promptTags(session).map((tag) => (
                      <button
                        key={tag.label + tag.person}
                        title="查看主区详细追问"
                        onClick={() =>
                          document
                            .querySelector('[data-ai-detail]')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }
                      >
                        {tag.person ? `${tag.person} · ` : ''}
                        {tag.label}
                      </button>
                    ))}
                    {!promptTags(session).length && <small className="muted">暂无新提示</small>}
                  </div>
                </div>
              </section>
            </div>
            {readonly && identity && (
              <ObserverCommunication session={session} identity={identity} now={now} />
            )}
          </div>
        </>
      )}
    </aside>
  );
}
