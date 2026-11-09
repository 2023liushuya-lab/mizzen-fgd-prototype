'use client';
import { useState } from 'react';
import type { Participant, Question, Session } from '@/types/fgd';
import { ImageResults } from './ImageResults';
import { RawResults } from './RawResults';
import { ResultDialogs, type LightboxData } from './ResultDialogs';
import styles from './questions.module.css';

export function AnswerResults({ session, question }: { session: Session; question: Question }) {
  const [profile, setProfile] = useState<Participant | null>(null);
  const [lightbox, setLightbox] = useState<LightboxData | null>(null);
  if (question.type === '陈述题') return null;
  if (!session.runs[question.id])
    return (
      <div className={`card ${styles.results}`}>
        <p className={styles.waiting}>本题尚未开始，暂无作答结果。</p>
      </div>
    );
  return (
    <div className={styles.workspace}>
      {question.type === '图片上传题' || question.type === '标注题' ? (
        <ImageResults
          session={session}
          question={question}
          onEnlarge={setLightbox}
          showFollowups={false}
        />
      ) : (
        <RawResults
          session={session}
          question={question}
          answers={Object.values(session.runs[question.id].answers)}
          onPerson={setProfile}
        />
      )}
      <ResultDialogs
        session={session}
        profile={profile}
        onProfileChange={setProfile}
        lightbox={lightbox}
        onImageChange={setLightbox}
      />
    </div>
  );
}
