'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Captions,
  Hand,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Signal,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { AnswerForm, AnswerResults, QuestionWorkspace } from '@/features/questions';
import { ParticipantVideoDock } from './ParticipantVideoDock';
import { ParticipantHandStatus } from '@/features/workbench/HandQueue';
import { ReactionBubbles, TranscriptList } from '@/features/workbench/Conversations';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useFgdStore } from '@/stores/fgd-store';
import { useClock } from '@/hooks/use-clock';
import { formatTime } from '@/lib/utils';
import type { Participant, Session } from '@/types/fgd';
import styles from './participant.module.css';
export function ParticipantRoom({
  session,
  person,
  onLeave,
}: {
  session: Session;
  person: Participant;
  onLeave: () => void;
}) {
  const setHand = useFgdStore((s) => s.setHand);
  const [meetingInfo, setMeetingInfo] = useState(false);
  const setMedia = useFgdStore((s) => s.setParticipantMedia),
    respond = useFgdStore((s) => s.respondMedia),
    submit = useFgdStore((s) => s.submitAnswer),
    addTurn = useFgdStore((s) => s.addTranscript),
    chat = useFgdStore((s) => s.sendChat);
  const now = useClock(),
    [rightOpen, setRightOpen] = useState(true),
    [conversation, setConversation] = useState<'chat' | 'captions' | null>(null),
    [message, setMessage] = useState(''),
    [speech, setSpeech] = useState(''),
    [speaking, setSpeaking] = useState(false),
    [leaving, setLeaving] = useState(false),
    [projectionClosed, setProjectionClosed] = useState<number | null>(null),
    [videoPerson, setVideoPerson] = useState<Participant | null>(null);
  const projectionRef = useRef<HTMLElement>(null);
  const question = session.questions.find((q) => q.id === session.currentQuestionId),
    request = session.mediaRequests.find(
      (r) => r.participantId === person.id && r.status === 'pending' && !r.fromHand,
    );
  const opened = Object.keys(session.runs).length,
    ended = session.phase === 'ended';
  const projected =
    session.projection && session.projection.displayedAt !== projectionClosed
      ? session.questions.find((q) => q.id === session.projection?.questionId)
      : undefined;
  useEffect(() => {
    if (session.projection)
      projectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [session.projection?.displayedAt]);
  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim()) {
      chat(session.id, person.id, person.name, message.trim());
      setMessage('');
    }
  }
  return (
    <div className={styles.room}>
      <header className={styles.roomHeader}>
        <div className={styles.meetingInfoWrap}>
          <button
            className={styles.meetingInfoButton}
            aria-expanded={meetingInfo}
            onClick={() => setMeetingInfo(!meetingInfo)}
          >
            会议信息 <ChevronDown size={12} />
          </button>
          {meetingInfo && (
            <section className={styles.meetingInfo}>
              <h3>{session.title}</h3>
              <p>
                参会身份 <strong>{person.name}</strong>
              </p>
              <p>
                房间码 <strong>{session.roomCode}</strong>
                <button
                  className="icon-button"
                  aria-label="复制房间码"
                  onClick={() => navigator.clipboard.writeText(session.roomCode)}
                >
                  <Copy size={13} />
                </button>
              </p>
              <p>连接状态 {person.online ? '在线' : '连接中'}</p>
              <p>
                录制说明{' '}
                {session.currentQuestionId ? '正在录制，仅用于研究归档' : '首题开始后自动启动录制'}
              </p>
            </section>
          )}
        </div>
        <span className={styles.roomTitle}>{session.title}</span>
        <div className={styles.progress}>
          <span className={styles.recording}>
            {session.currentQuestionId && !ended ? '● 录制中' : '待开始'}
          </span>
          <span>
            {ended
              ? '访谈已结束'
              : session.phase === 'pending'
                ? '等待主持人开始'
                : `${opened} / ${session.questions.length}`}
          </span>
          <progress value={opened} max={session.questions.length} aria-label="访谈进度" />
        </div>
        <span title="网络连接正常 · 演示" aria-label="网络连接正常">
          <Signal size={18} color="#368070" />
        </span>
        <time>
          {formatTime(
            session.startedAt
              ? (session.endedAt || now || session.startedAt) - session.startedAt
              : 0,
          )}
        </time>
      </header>
      <div className={`${styles.roomBody} ${!rightOpen ? styles.rightClosed : ''}`}>
        <main className={styles.questionArea}>
          {ended ? (
            <div className={styles.waiting}>
              <span>✓</span>
              <h1>感谢你的分享</h1>
              <p>本次访谈已结束，你的回答已保存。</p>
              <Button variant="outline" onClick={onLeave}>
                离开访谈
              </Button>
            </div>
          ) : question ? (
            <>
              <QuestionWorkspace
                key={question.id}
                session={session}
                question={question}
                role="participant"
              />
              <AnswerForm
                key={`${question.id}-${person.id}`}
                session={session}
                question={question}
                participantId={person.id}
                onSubmit={(answer) => submit(session.id, question.id, answer)}
              />
            </>
          ) : (
            <div className={styles.waiting}>
              <span className="avatar" style={{ background: person.color }}>
                {person.name[0]}
              </span>
              <h1>欢迎，{person.name}</h1>
              <p>已加入访谈，等待主持人开始题目。</p>
            </div>
          )}
          {projected && !ended && (
            <section ref={projectionRef} className={styles.projection}>
              <div className="row between">
                <strong>主持人正在展示作答结果</strong>
                <button
                  className="icon-button"
                  aria-label="收起投放结果"
                  onClick={() => setProjectionClosed(session.projection!.displayedAt)}
                >
                  <X size={16} />
                </button>
              </div>
              <h3>{projected.title}</h3>
              <AnswerResults session={session} question={projected} />
              {question && question.id !== projected.id && (
                <>
                  <h3>当前题目 · {question.title}</h3>
                  <AnswerResults session={session} question={question} />
                </>
              )}
            </section>
          )}
          {!ended && question && (
            <details
              className={styles.speechDemo}
              open={speaking}
              onToggle={(e) => setSpeaking(e.currentTarget.open)}
            >
              <summary>补充发言</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (speech.trim()) {
                    addTurn(session.id, question.id, person.id, speech.trim());
                    setSpeech('');
                  }
                }}
              >
                <input
                  aria-label="补充发言"
                  placeholder="分享你的具体经历或补充说明…"
                  value={speech}
                  onChange={(e) => setSpeech(e.target.value)}
                />
                <Button size="sm" disabled={!speech.trim()}>
                  发送
                </Button>
              </form>
            </details>
          )}
        </main>
        <aside className={styles.videoRail}>
          {rightOpen ? (
            <>
              <div className={styles.railHeader}>
                <strong>参会视频</strong>
                <button
                  className="icon-button"
                  aria-label="收起视频区"
                  onClick={() => setRightOpen(false)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <ParticipantVideoDock session={session} onProfile={setVideoPerson} />
            </>
          ) : (
            <button
              className="icon-button"
              aria-label="展开视频区"
              onClick={() => setRightOpen(true)}
            >
              <ChevronLeft size={17} />
            </button>
          )}
        </aside>
      </div>
      <footer className={styles.roomFooter} aria-label="参会控制栏">
        <div className={styles.socialControls}>
          <button
            className="icon-button"
            aria-label="聊天"
            onClick={() => setConversation(conversation === 'chat' ? null : 'chat')}
          >
            <MessageSquare size={19} />
          </button>
          <button
            className={`${styles.handControl} ${person.handRaisedAt ? styles.raised : ''}`}
            aria-label={person.handRaisedAt ? '取消举手' : '举手'}
            aria-pressed={!!person.handRaisedAt}
            disabled={session.phase !== 'live'}
            onClick={() => setHand(session.id, person.id, !person.handRaisedAt)}
          >
            <Hand size={18} />
            <span>{person.handRaisedAt ? '已举手' : '举手'}</span>
          </button>
        </div>
        <div className={styles.controls}>
          <button
            className={`${styles.mediaControl} ${!person.mic ? styles.off : ''}`}
            onClick={() => setMedia(session.id, person.id, 'mic', !person.mic)}
            disabled={ended}
            aria-label={person.mic ? '静音' : '开启麦克风'}
            aria-pressed={person.mic}
          >
            {person.mic ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            className={`${styles.mediaControl} ${!person.camera ? styles.off : ''}`}
            onClick={() => setMedia(session.id, person.id, 'camera', !person.camera)}
            disabled={ended}
            aria-label={person.camera ? '关闭摄像头' : '开启摄像头'}
            aria-pressed={person.camera}
          >
            {person.camera ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
        <div className={styles.tools}>
          <button
            className={styles.hangup}
            aria-label="离开访谈"
            title="离开访谈"
            onClick={() => setLeaving(true)}
          >
            <PhoneOff size={19} />
          </button>
        </div>
      </footer>
      <ParticipantHandStatus session={session} person={person} />
      {person.forceMutedAt && now - person.forceMutedAt < 6500 && (
        <div className={styles.forceMuted} role="status">
          主持人已将你静音
        </div>
      )}

      {conversation && (
        <section
          className={`${styles.conversation} ${conversation === 'chat' ? styles.chatLeft : ''}`}
          role="dialog"
          aria-label={conversation === 'chat' ? '聊天' : '字幕'}
        >
          <div className={styles.railHeader}>
            <strong>{conversation === 'chat' ? '聊天' : '字幕'}</strong>
            <button
              className="icon-button"
              aria-label="关闭对话框"
              onClick={() => setConversation(null)}
            >
              <X size={17} />
            </button>
          </div>
          {conversation === 'captions' ? (
            <TranscriptList session={session} readonly />
          ) : (
            <>
              <div className={styles.messages}>
                {session.chats
                  .filter((m) => !m.reaction)
                  .map((m) => (
                    <article
                      key={m.id}
                      className={m.senderId === person.id ? styles.myMessage : ''}
                    >
                      <small>{m.name}</small>
                      <p>{m.text}</p>
                    </article>
                  ))}
                {!session.chats.filter((m) => !m.reaction).length && (
                  <p className="muted">在这里与大家交流。</p>
                )}
              </div>
              <form className={styles.chatInput} onSubmit={sendMessage}>
                <textarea
                  aria-label="聊天内容"
                  placeholder="发送消息给大家…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={ended}
                />
                <button
                  className="icon-button"
                  aria-label="发送聊天消息"
                  disabled={ended || !message.trim()}
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          )}
        </section>
      )}
      <ReactionBubbles session={session} />
      <Modal
        open={!!request && !ended}
        onOpenChange={(open) => {
          if (!open && request) respond(session.id, request.id, false);
        }}
        title={
          request
            ? `主持人请求${request.enabled ? '开启' : '关闭'}${request.kind === 'mic' ? '麦克风' : '摄像头'}`
            : '设备请求'
        }
      >
        <p className="confirm-copy">你可以选择是否响应本次设备请求。</p>
        <div className="modal-footer">
          <Button
            variant="outline"
            onClick={() => request && respond(session.id, request.id, false)}
          >
            拒绝
          </Button>
          <Button onClick={() => request && respond(session.id, request.id, true)}>同意</Button>
        </div>
      </Modal>
      <Modal open={leaving} onOpenChange={setLeaving} title="离开本场访谈？">
        <p className="confirm-copy">离开后可通过原链接与房间码重新加入。</p>
        <div className="modal-footer">
          <Button variant="outline" onClick={() => setLeaving(false)}>
            继续参与
          </Button>
          <Button variant="destructive" onClick={onLeave}>
            离开访谈
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!videoPerson}
        onOpenChange={(open) => !open && setVideoPerson(null)}
        title="参会信息"
      >
        {videoPerson && (
          <div className="stack">
            <strong>{videoPerson.name}</strong>
            <span className="muted">
              {videoPerson.online ? '在线' : '未到场'} · 麦克风
              {videoPerson.mic ? '已开启' : '已关闭'} · 摄像头
              {videoPerson.camera ? '已开启' : '已关闭'}
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
}
