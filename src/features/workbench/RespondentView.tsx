'use client';
import { useState } from 'react';
import type { Participant, Session } from '@/types/fgd';
import { backgroundOf } from '@/lib/utils';
import { MediaPanel } from './MediaPanel';
import { Avatar } from './Profile';
import { openedQuestions, questionNumber } from './helpers';
import styles from './WorkbenchPage.module.css';

export function RespondentView({
  session,
  readonly,
  onProfile,
  onQuestion,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
  onQuestion: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'arrived' | 'absent'>('arrived');
  const people = session.participants.filter((person) => !person.removed);
  return (
    <div className={styles.respondentView}>
      <div className={styles.respondentHeading}>
        <h1>{readonly ? '受访者视图' : '视频视图'}</h1>
        <small>{people.length} 位受访者</small>
      </div>
      {!readonly && (
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
        attendance={readonly ? undefined : filter}
      />
      {readonly && (
        <div className={styles.respondentDetails}>
          {people.map((person) => (
            <article key={person.id} className="card">
              <button className={styles.personTitle} onClick={() => onProfile(person)}>
                <Avatar person={person} />
                <strong>{person.name}</strong>
                <small>{person.online ? '在线' : '未到场'}</small>
              </button>
              <p className="muted">{backgroundOf(person)}</p>
              <details>
                <summary>已讨论题目的回答</summary>
                {openedQuestions(session).map((question) => (
                  <div className={styles.personHistory} key={question.id}>
                    <button onClick={() => onQuestion(question.id)}>
                      Q{questionNumber(session, question.id)} · {question.title}
                    </button>
                    <p>
                      {session.runs[question.id]?.answers[person.id]?.comment ||
                        session.runs[question.id]?.transcript
                          .filter((turn) => turn.participantId === person.id)
                          .map((turn) => turn.text)
                          .join(' ') ||
                        '暂无文字回答'}
                    </p>
                  </div>
                ))}
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
