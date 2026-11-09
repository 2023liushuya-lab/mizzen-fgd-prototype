'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUp, Mail } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import { QuestionWorkspace } from '@/features/questions';
import { raisedPeople } from './HandQueue';
import type { Identity, Participant } from '@/types/fgd';
import { OutlinePanel } from './OutlinePanel';
import { ProfileModal } from './Profile';
import { WorkspaceHeader } from './WorkspaceHeader';
import { topicDirections } from './helpers';
import { SessionGate } from './WorkbenchGate';
import { RespondentView } from './RespondentView';
import { WorkbenchSidePanel } from './WorkbenchSidePanel';
import { ParticipantFooter, HostMeetingControls } from './WorkbenchFooter';
import { ConversationPopover } from './Conversations';
import { SessionDialogs } from './SessionDialogs';
import { exportObserverNotes } from './export-observer-notes';
import styles from './WorkbenchPage.module.css';

const DEFAULT_OBSERVER_IDENTITY: Identity = { id: 'observer-default', name: '旁听席' };

export default function WorkbenchPage({ role }: { role: 'host' | 'observer' }) {
  const params = useSearchParams();
  const sessionId = params.get('session');
  const projectId = params.get('project');
  const session = useFgdStore((s) =>
    s.data.sessions.find((item) => item.id === sessionId && item.projectId === projectId),
  );
  const ready = useFgdStore((s) => s.ready);
  const start = useFgdStore((s) => s.startQuestion);
  const startSession = useFgdStore((s) => s.startSession);
  const end = useFgdStore((s) => s.endSession);
  const setProjection = useFgdStore((s) => s.setProjection);
  const playback = useFgdStore((s) => s.setPlayback);
  const [now, setNow] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);
  const [outlineFolded, setOutlineFolded] = useState(false);
  const [rightClosed, setRightClosed] = useState(false);
  const [view, setView] = useState<'question' | 'respondents'>('question');
  const [profile, setProfile] = useState<Participant | null>(null);
  const [endModal, setEndModal] = useState(false);
  const [priorModal, setPriorModal] = useState(false);
  const [conversation, setConversation] = useState<'chat' | 'transcript' | null>(null);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState<Identity | null>(DEFAULT_OBSERVER_IDENTITY);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [bilingual, setBilingual] = useState(false);
  const [handQueueOpen, setHandQueueOpen] = useState(false);
  const handKey = session
    ? raisedPeople(session)
        .map((p) => p.id + ':' + p.handRaisedAt)
        .join(',')
    : '';
  useEffect(() => {
    if (role === 'host' && handKey) {
      setHandQueueOpen(true);
      setRightClosed(false);
    }
  }, [handKey, role]);
  const contentRef = useRef<HTMLDivElement>(null);
  const identityKey = `mizzen-fgd-react:observer:${projectId}:${sessionId}`;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setSelectedId(null);
    setFollow(true);
    setView('question');
    setEndModal(false);
    setPriorModal(false);
    setProfile(null);
    setConversation(null);
    setError('');
    if (role === 'observer') {
      try {
        const stored = JSON.parse(localStorage.getItem(identityKey) || 'null');
        if (stored?.id && stored?.name) {
          setIdentity(stored);
        } else {
          localStorage.setItem(identityKey, JSON.stringify(DEFAULT_OBSERVER_IDENTITY));
          setIdentity(DEFAULT_OBSERVER_IDENTITY);
        }
      } catch {
        setIdentity(DEFAULT_OBSERVER_IDENTITY);
      }
    }
    setIdentityLoaded(true);
  }, [identityKey, role]);
  useEffect(() => {
    if (follow && session?.currentQuestionId) setSelectedId(session.currentQuestionId);
  }, [follow, session?.currentQuestionId]);

  if (!ready || !identityLoaded) return <SessionGate state="loading" />;
  if (!session) return <SessionGate state="missing" />;
  const readonly = role === 'observer';
  const online = session.delivery === 'online';
  if (readonly && params.get('token') && params.get('token') !== session.observerToken)
    return <SessionGate state="expired" />;
  const activeIdentity = identity || DEFAULT_OBSERVER_IDENTITY;
  const visibleQuestions = session.questions;
  const question =
    visibleQuestions.find((q) => q.id === selectedId) ||
    visibleQuestions.find((q) => q.id === session.currentQuestionId) ||
    visibleQuestions[0];
  const directions = topicDirections(session, question);

  function select(id: string) {
    if (!session) return;
    setSelectedId(id);
    setFollow(id === session.currentQuestionId);
    setView('question');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function backToCurrent() {
    if (!session?.currentQuestionId) return;
    setSelectedId(session.currentQuestionId);
    setFollow(true);
    setView('question');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function startQuestion() {
    if (!session || !question || readonly) return;
    if (session.phase === 'pending') {
      const result = startSession(session.id);
      if (!result.ok) {
        setError(result.error || '请先完成场次配置');
        return;
      }
    }
    start(session.id, question.id);
    setFollow(true);
    setError('');
  }
  const header = (
    <WorkspaceHeader
      session={session}
      role={role}
      now={now}
      view={view}
      onView={setView}
      onEnd={() => setEndModal(true)}
      onTranslationChange={setBilingual}
    />
  );

  return (
    <div
      data-bilingual={bilingual}
      data-role={role}
      data-delivery={session.delivery}
      className={`${styles.workspace} ${online && !readonly ? styles.hasToolbar : ''} ${session.phase === 'ended' && readonly ? styles.hasReview : ''}`}
    >
      {header}
      {session.phase === 'ended' && readonly && (
        <div className={styles.reviewBanner}>
          <span>访谈已结束 · 只读复盘模式（完整复盘可前往项目「记录」页）</span>
          <button onClick={() => exportObserverNotes(session, activeIdentity)}>
            <Mail size={13} />
            导出我的小纸条
          </button>
        </div>
      )}
      <div
        className={`${styles.workspaceBody} ${outlineFolded ? styles.foldedLayout : ''} ${rightClosed ? styles.closedRight : ''}`}
      >
        <OutlinePanel
          session={session}
          selectedId={question?.id || null}
          onSelect={select}
          folded={outlineFolded}
          onFold={() => setOutlineFolded(!outlineFolded)}
          readonly={readonly}
          now={now}
        />
        <main
          className={styles.main}
          ref={contentRef}
          onScroll={(event) =>
            setShowReturn(
              event.currentTarget.scrollTop > 160 ||
                (!!session.currentQuestionId && question?.id !== session.currentQuestionId),
            )
          }
        >
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
              <button onClick={() => setError('')} aria-label="关闭提示">
                ×
              </button>
            </div>
          )}
          {readonly && session.phase === 'pending' && view === 'question' && (
            <div className={styles.browseBanner}>
              <span>
                💡 场次待开场 · 你可以提前浏览左侧全部大纲题目或受访者背景，或提前给主持人留小纸条
              </span>
            </div>
          )}
          {readonly &&
            session.phase === 'live' &&
            !follow &&
            session.currentQuestionId &&
            question?.id !== session.currentQuestionId &&
            view === 'question' && (
              <div className={styles.browseBanner}>
                <span>正在自由浏览大纲题目</span>
                <button type="button" onClick={backToCurrent}>
                  ↑ 回到主持人当前题
                </button>
              </div>
            )}
          {view === 'respondents' ? (
            <RespondentView
              session={session}
              readonly={readonly}
              onProfile={setProfile}
              onQuestion={select}
            />
          ) : question ? (
            <QuestionWorkspace
              session={session}
              question={question}
              role={role}
              onStart={startQuestion}
              onPriorAnswers={() => setPriorModal(true)}
              onPlayback={(seconds, playing) => playback(session.id, question.id, seconds, playing)}
            />
          ) : (
            <div className={styles.noQuestion}>
              <h2>等待主持人开始题目</h2>
              <p>可在左侧大纲提前浏览本场全部题目，或在右侧向主持人递小纸条。</p>
            </div>
          )}
          {(showReturn ||
            (session.currentQuestionId && question?.id !== session.currentQuestionId)) && (
            <button
              className={styles.returnCurrent}
              onClick={backToCurrent}
              aria-label="回到当前题"
              title="回到当前题"
            >
              <ArrowUp size={21} />
            </button>
          )}
        </main>
        <WorkbenchSidePanel
          session={session}
          readonly={readonly}
          closed={rightClosed}
          onClosedChange={setRightClosed}
          directions={directions}
          handQueueOpen={handQueueOpen}
          onHandQueueClose={() => setHandQueueOpen(false)}
          onProfile={setProfile}
          identity={activeIdentity}
          selectedId={question?.id || null}
          onQuestion={select}
          now={now}
        />
        <ParticipantFooter
          session={session}
          readonly={readonly}
          onProfile={setProfile}
          question={question}
          visibleQuestions={visibleQuestions}
          onQuestion={select}
          conversation={conversation}
          onConversation={setConversation}
        />
      </div>
      {!readonly && (
        <HostMeetingControls
          session={session}
          conversation={conversation}
          onConversation={setConversation}
          onEnd={() => setEndModal(true)}
          onHands={() => {
            setHandQueueOpen((v) => !v);
            setRightClosed(false);
          }}
        />
      )}
      {readonly && conversation === 'transcript' && (
        <ConversationPopover
          session={session}
          type="transcript"
          onClose={() => setConversation(null)}
        />
      )}
      <ProfileModal session={session} person={profile} onClose={() => setProfile(null)} />
      {!readonly && (
        <SessionDialogs
          session={session}
          endOpen={endModal}
          onEndOpenChange={setEndModal}
          onEnd={() => end(session.id)}
          projectionOpen={priorModal}
          onProjectionOpenChange={setPriorModal}
          onProjection={(id) => setProjection(session.id, id)}
        />
      )}
    </div>
  );
}
