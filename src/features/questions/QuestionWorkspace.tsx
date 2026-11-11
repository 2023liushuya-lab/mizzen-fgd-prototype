'use client';
import { useEffect, useState } from 'react';
import { Play, MonitorUp, Clock } from 'lucide-react';
import { useClock } from '@/hooks/use-clock';
import { Button } from '@/components/ui/button';
import type { Participant, Question, Role, Session } from '@/types/fgd';
import { ConceptCanvas } from './ConceptCanvas';
import { StandardQuestion } from './StandardQuestion';
import { QuestionGuide } from './QuestionGuide';
import { RawResults } from './RawResults';
import { QuestionAnalysis } from './QuestionAnalysis';
import { ImageResults } from './ImageResults';
import { ResultDialogs, type LightboxData } from './ResultDialogs';
import styles from './questions.module.css';

export interface QuestionWorkspaceProps {
  session: Session;
  question: Question;
  role: Role;
  onStart?: () => void;
  onPriorAnswers?: () => void;
  onScreen?: () => void;
  onPlayback?: (seconds: number, playing: boolean) => void;
}

export function QuestionWorkspace({
  session,
  question,
  role,
  onStart,
  onPriorAnswers,
  onScreen,
  onPlayback,
}: QuestionWorkspaceProps) {
  const [profile, setProfile] = useState<Participant | null>(null);
  const [lightbox, setLightbox] = useState<LightboxData | null>(null);
  const run = session.runs[question.id];
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!run?.stimulusPlaying || session.phase !== 'live') return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [question.id, run?.stimulusPlaying, run?.stimulusUpdatedAt, session.phase]);
  const stimulusSeconds = Math.min(
    question.stimulus?.duration ?? 0,
    (run?.stimulusSeconds || 0) +
      (session.phase === 'live' && run?.stimulusPlaying && run.stimulusUpdatedAt && now
        ? Math.max(0, now - run.stimulusUpdatedAt) / 1000
        : 0),
  );
  const clock = useClock();
  const elapsed =
    run?.segments.reduce(
      (sum, seg) => sum + Math.max(0, (seg.endedAt || clock) - seg.startedAt),
      0,
    ) || 0;
  const overtime =
    session.phase === 'live' &&
    session.currentQuestionId === question.id &&
    elapsed > question.plannedMinutes * 60_000;
  const started = Boolean(run);
  const index = session.questions.findIndex((q) => q.id === question.id) + 1;
  const isStatement = question.type === '陈述题';
  const answers = Object.values(run?.answers || {});
  return (
    <div className={styles.workspace}>
      <header className={styles.questionHeader}>
        <div className={styles.questionMeta}>
          <span>Q{String(index).padStart(2, '0')}</span>
          <span className="badge">{question.type}</span>
          <span
            className={`${styles.status} ${session.currentQuestionId === question.id && session.phase === 'live' ? styles.liveStatus : ''}`}
          >
            {!started
              ? '未开始'
              : session.currentQuestionId === question.id && session.phase === 'live'
                ? '进行中'
                : '已讨论'}
          </span>
          {role === 'host' && session.phase !== 'ended' && (
            <div className={styles.questionAction}>
              {!started ? (
                <Button size="sm" onClick={onStart} disabled={!onStart}>
                  开始题目
                </Button>
              ) : (
                <>
                  {onScreen && (
                    <Button size="sm" variant="outline" onClick={onScreen}>
                      <MonitorUp size={14} />
                      投放大屏
                    </Button>
                  )}
                  {question.type === '标注题' && onPriorAnswers && (
                    <Button size="sm" variant="ghost" onClick={onPriorAnswers}>
                      投放前题答案
                    </Button>
                  )}
                </>
              )}
              {overtime && (
                <span
                  style={{
                    color: '#b07c2e',
                    display: 'inline-flex',
                    gap: 4,
                    alignItems: 'center',
                    fontSize: 11,
                  }}
                  role="status"
                >
                  <Clock size={13} />
                  已超时
                </span>
              )}
            </div>
          )}
        </div>
        <h1>{question.title}</h1>
      </header>
      {!isStatement && role !== 'participant' && <QuestionGuide question={question} />}
      {!isStatement && <StandardQuestion question={question} />}
      {question.stimulus && (
        <section className={styles.stimulus}>
          <div className={styles.stimulusStage}>
            <span>轻盈 · 随行 · 日常护理</span>
            <div className={styles.stimulusBottles}>
              <i />
              <i />
              <i />
            </div>
            <h2>{question.stimulus.label}</h2>
            <small>
              {Math.round(stimulusSeconds)} / {question.stimulus.duration} 秒
            </small>
          </div>
          <progress
            value={stimulusSeconds}
            max={question.stimulus.duration}
            aria-label="概念短片进度"
          />
          {role === 'host' && started && onPlayback && session.phase === 'live' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onPlayback(
                  stimulusSeconds >= question.stimulus!.duration ? 0 : stimulusSeconds,
                  stimulusSeconds >= question.stimulus!.duration || !run.stimulusPlaying,
                )
              }
            >
              <Play size={14} />
              {stimulusSeconds >= question.stimulus.duration
                ? '重播素材'
                : run.stimulusPlaying
                  ? '暂停素材'
                  : '播放素材'}
            </Button>
          )}
        </section>
      )}
      {!isStatement &&
        role !== 'participant' &&
        (started ? (
          question.type === '图片上传题' || question.type === '标注题' ? (
            <>
              <ImageResults session={session} question={question} onEnlarge={setLightbox} />
              {question.type === '标注题' && (
                <QuestionAnalysis session={session} question={question} onPerson={setProfile} />
              )}
            </>
          ) : (
            <>
              <RawResults
                session={session}
                question={question}
                answers={answers}
                onPerson={setProfile}
              />
              <QuestionAnalysis session={session} question={question} onPerson={setProfile} />
            </>
          )
        ) : (
          <div className={`card ${styles.preStart}`}>
            {question.type === '标注题' && <ConceptCanvas />}
            <h3>本题讨论</h3>
            <p>开始题目后接收受访者回答。</p>
          </div>
        ))}
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

export { AnswerResults } from './AnswerResults';
