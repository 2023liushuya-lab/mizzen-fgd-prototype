'use client';
import { useState } from 'react';
import type { Participant, Session } from '@/types/fgd';
import { MediaPanel } from './MediaPanel';
import styles from './WorkbenchPage.module.css';

export function RespondentView({
  session,
  readonly,
  onProfile,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
  onQuestion?: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'arrived' | 'absent'>('arrived');
  const people = session.participants.filter((person) => !person.removed);
  const isOffline = session.delivery === 'offline';
  return (
    <div className={styles.respondentView}>
      <div className={styles.respondentHeading}>
        <h1>{isOffline ? '现场画面' : '视频视图'}</h1>
        {!isOffline && <small>{people.length} 位受访者</small>}
      </div>
      {!readonly && !isOffline && (
        <div className={styles.attendanceFilter}>
          <button aria-pressed={filter === 'arrived'} onClick={() => setFilter('arrived')}>
            已到 {people.filter((p) => p.online).length}
          </button>
          <button aria-pressed={filter === 'absent'} onClick={() => setFilter('absent')}>
            未到 {people.filter((p) => !p.online).length}
          </button>
        </div>
      )}
      <MediaPanel
        session={session}
        onProfile={onProfile}
        large
        attendance={readonly || isOffline ? undefined : filter}
      />
    </div>
  );
}
