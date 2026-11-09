'use client';
import { useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { Identity, Participant, Session } from '@/types/fgd';
import { HandQueue } from './HandQueue';
import { SpeakingShare } from './SpeakingShare';
import { PaperNotes } from './PaperNotes';
import { TranscriptList } from './Conversations';
import { MediaPanel } from './MediaPanel';
import styles from './WorkbenchPage.module.css';

export function WorkbenchSidePanel({
  session,
  readonly,
  closed,
  onClosedChange,
  directions,
  onProfile,
  identity,
  selectedId,
  onQuestion,
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
  const [tab, setTab] = useState<'notes' | 'captions' | 'video'>('notes');
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
            <span>{readonly ? '旁听工作台' : '现场状态'}</span>
            <button
              className="icon-button"
              aria-label="收起右侧"
              onClick={() => onClosedChange(true)}
            >
              <PanelRightClose size={17} />
            </button>
          </div>
          {!readonly && (
            <HandQueue
              session={session}
              open={!!handQueueOpen}
              onClose={() => onHandQueueClose?.()}
            />
          )}
          <SpeakingShare session={session} readonly={readonly} onProfile={onProfile} />
          {
            <section className={styles.topicDirections}>
              <h3>✧ 话题追问</h3>
              {!directions.length && <p className="muted">等待本题形成讨论。</p>}
              {directions.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          }
          {readonly ? (
            <>
              <div className={styles.rightTabs}>
                <button
                  className={tab === 'notes' ? styles.activeTab : ''}
                  onClick={() => setTab('notes')}
                >
                  小纸条{' '}
                  <small>
                    {session.notes.filter((note) => note.observerId === identity?.id).length || ''}
                  </small>
                </button>
                <button
                  className={tab === 'captions' ? styles.activeTab : ''}
                  onClick={() => setTab('captions')}
                >
                  字幕
                </button>
                <button
                  className={tab === 'video' ? styles.activeTab : ''}
                  onClick={() => setTab('video')}
                >
                  {session.delivery === 'online' ? '视频' : '现场画面'}
                </button>
              </div>
              {tab === 'notes' && identity ? (
                <PaperNotes
                  session={session}
                  identity={identity}
                  selectedId={selectedId}
                  onQuestion={onQuestion}
                  now={now}
                />
              ) : tab === 'captions' ? (
                <TranscriptList session={session} readonly />
              ) : (
                <MediaPanel session={session} onProfile={onProfile} />
              )}
            </>
          ) : null}
        </>
      )}
    </aside>
  );
}
