'use client';
import { useState, useEffect } from 'react';
import {
  Captions,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Grid2X2,
  MessageSquare,
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Hand,
  Users,
  Globe,
  Signal,
  Video,
  VideoOff,
} from 'lucide-react';
import type { Session } from '@/types/fgd';
import { copyText, formatTime, sessionLink } from '@/lib/utils';
import { raisedPeople } from './HandQueue';
import { useFgdStore } from '@/stores/fgd-store';
import styles from './WorkspaceHeader.module.css';

export function WorkspaceHeader({
  session,
  role,
  now,
  view,
  onView,
  onEnd,
  onTranslationChange,
}: {
  session: Session;
  role: 'host' | 'observer';
  now: number;
  view: 'question' | 'respondents';
  onView: (view: 'question' | 'respondents') => void;
  onEnd: () => void;
  onTranslationChange?: (enabled: boolean) => void;
}) {
  const [translated, setTranslated] = useState(false);
  useEffect(() => onTranslationChange?.(translated), [translated, onTranslationChange]);
  const [info, setInfo] = useState(false);
  const [copied, setCopied] = useState('');
  const questions = Object.keys(session.runs).length;
  const phase =
    session.phase === 'live'
      ? session.currentQuestionId
        ? '进行中'
        : '会议室备场中'
      : session.phase === 'ended'
        ? '已结束'
        : '待开始';
  const elapsed =
    session.startedAt && session.currentQuestionId
      ? (session.endedAt || now) - session.startedAt
      : 0;
  const link =
    typeof location !== 'undefined'
      ? `${location.origin}${sessionLink('participant', session)}`
      : '';
  const observerPath = sessionLink('observer', session);
  const observerUrl = typeof location !== 'undefined' ? `${location.origin}${observerPath}` : '';
  async function copy(value: string, key: string) {
    try {
      await copyText(value);
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('复制失败，请手动复制');
    }
  }
  return (
    <header className={styles.topbar} data-role={role} data-delivery={session.delivery}>
      <div className={styles.headerIdentity}>
        <a
          hidden={role === 'host' && session.delivery === 'online'}
          className={styles.brand}
          href="/"
          aria-label="Mizzen工作空间"
        >
          mizzen
        </a>
        <span
          className={styles.headerDivider}
          hidden={role === 'host' && session.delivery === 'online'}
        />
        {session.delivery === 'online' ? (
          <div className={styles.meetingWrap}>
            <button
              className={styles.meetingButton}
              onClick={() => setInfo(!info)}
              aria-expanded={info}
            >
              会议信息
              <ChevronDown size={12} />
            </button>
            {info && (
              <div className={styles.meetingInfo}>
                <strong>{session.title}</strong>
                <div>
                  <small>房间码</small>
                  <span>{session.roomCode}</span>
                  <button
                    className="icon-button"
                    aria-label="复制房间码"
                    onClick={() => copy(session.roomCode, 'code')}
                  >
                    {copied === 'code' ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <div>
                  <small>受访者链接</small>
                  <input readOnly value={link} aria-label="受访者链接" />
                  <button
                    className="icon-button"
                    aria-label="复制受访者链接"
                    onClick={() => copy(link, 'link')}
                  >
                    {copied === 'link' ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <div>
                  <small>旁听链接</small>
                  <input readOnly value={observerUrl} aria-label="旁听链接" />
                  <button
                    className="icon-button"
                    aria-label="复制旁听链接"
                    onClick={() => copy(observerUrl, 'observer')}
                  >
                    {copied === 'observer' ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <a
                    href={observerPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-button"
                    aria-label="打开旁听室"
                    title="在新标签页打开旁听室"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
                <div>
                  <small>当前状态</small>
                  <span className={styles.phaseTag}>{phase}</span>
                </div>
                {copied && !['code', 'link', 'observer'].includes(copied) && (
                  <small role="status">{copied}</small>
                )}
              </div>
            )}
          </div>
        ) : (
          <strong className={styles.headerSessionTitle}>{session.title}</strong>
        )}
        {session.delivery === 'online' && (
          <strong className={styles.headerSessionTitle}>{session.title}</strong>
        )}
        {role === 'observer' && <span className={styles.observerRolePill}>旁听视图 · 只读</span>}
      </div>
      <div className={styles.headerStatus}>
        <span className={`${styles.phaseTag} ${session.phase === 'live' ? styles.phaseLive : ''}`}>
          {phase}
        </span>
        {session.delivery === 'online' && (
          <span className={styles.recording}>
            {session.phase === 'ended'
              ? '已归档'
              : session.currentQuestionId
                ? '● 录制中'
                : '● 待录制'}
          </span>
        )}
        <Signal size={17} className={styles.network} aria-label="网络连接正常" role="img" />
        <time>{formatTime(elapsed)}</time>
      </div>
      <div className={styles.headerTools}>
        <div className={styles.headerProgress}>
          <span>
            {questions} / {session.questions.length}
          </span>
          <i>
            <b
              style={{
                width: `${(questions / Math.max(1, session.questions.length)) * 100}%`,
              }}
            />
          </i>
        </div>
        {session.delivery === 'online' && (
          <button
            className={styles.languageButton}
            aria-pressed={translated}
            onClick={() => setTranslated(!translated)}
            title="原文 / 双语对照"
          >
            <Globe size={13} />
            {translated ? '中英对照' : '原文'}
          </button>
        )}
        {(session.delivery === 'online' || role === 'observer') && (
          <>
            <div
              className={styles.viewSwitch}
              role="group"
              aria-label={role === 'observer' ? '旁听工作台视图' : '工作台视图'}
            >
              <button
                aria-label="题目视图"
                aria-pressed={view === 'question'}
                className={view === 'question' ? styles.activeView : ''}
                onClick={() => onView('question')}
              >
                <Monitor size={15} />
                <span>题目视图</span>
              </button>
              <button
                aria-label={session.delivery === 'offline' ? '现场画面' : '视频视图'}
                aria-pressed={view === 'respondents'}
                className={view === 'respondents' ? styles.activeView : ''}
                onClick={() => onView('respondents')}
              >
                <Grid2X2 size={15} />
                <span>{session.delivery === 'offline' ? '现场画面' : '视频视图'}</span>
              </button>
            </div>
          </>
        )}
        <div className={styles.headerActions}>
          {role === 'host' && (
            <>
              <button
                className="icon-button"
                title="全屏专注"
                aria-label="全屏专注"
                onClick={() => {
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void document.documentElement.requestFullscreen().catch(() => {});
                }}
              >
                <Maximize2 size={17} />
              </button>
              {session.delivery === 'offline' && session.phase !== 'ended' && (
                <button className={styles.endText} onClick={onEnd}>
                  结束场次
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MeetingToolbar({
  session,
  onEnd,
  onConversation,
  onHands,
}: {
  session: Session;
  onEnd: () => void;
  onHands: () => void;
  onConversation: (type: 'chat' | 'transcript') => void;
}) {
  const mic = !!session.hostMic,
    camera = !!session.hostCamera;
  const hostMedia = useFgdStore((s) => s.setHostMedia),
    muteAll = useFgdStore((s) => s.muteAll);
  const hands = raisedPeople(session);
  const send = useFgdStore((s) => s.sendChat);
  return (
    <div className={styles.meetingToolbar} role="toolbar" aria-label="主持人会控">
      <div className={styles.toolbarSocial}>
        <button
          className="icon-button"
          aria-label="会中聊天"
          onClick={() => onConversation('chat')}
        >
          <MessageSquare size={18} />
        </button>
        {hands.length > 0 && (
          <button
            className={styles.handSummary}
            aria-label={`${hands.length}人举手，查看举手请求`}
            onClick={onHands}
          >
            <Hand size={17} />
            {hands.length === 1 ? hands[0].name + ' 举手' : hands.length + ' 人举手'}
          </button>
        )}
      </div>
      <div className={styles.toolbarCenter}>
        <button
          className={`icon-button ${!mic ? styles.mediaOff : ''}`}
          aria-label={mic ? '麦克风' : '已静音'}
          title={mic ? '静音' : '打开麦克风'}
          aria-pressed={mic}
          disabled={session.phase === 'ended'}
          onClick={() => hostMedia(session.id, 'hostMic', !mic)}
        >
          {mic ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          className={`icon-button ${!camera ? styles.mediaOff : ''}`}
          aria-label={camera ? '关闭摄像头' : '已关视频'}
          title={camera ? '关闭摄像头' : '打开摄像头'}
          disabled={session.phase === 'ended'}
          aria-pressed={camera}
          onClick={() => hostMedia(session.id, 'hostCamera', !camera)}
        >
          {camera ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          className="icon-button"
          aria-label="全员静音"
          title="全员静音"
          disabled={
            session.phase !== 'live' || !session.participants.some((p) => p.online && !p.removed)
          }
          onClick={() => muteAll(session.id)}
        >
          <Users size={18} />
        </button>
        <span className={styles.toolbarDivider} />
        <button
          className={styles.hangup}
          aria-label="结束访谈"
          title="结束访谈"
          disabled={session.phase === 'ended'}
          onClick={onEnd}
        >
          <PhoneOff size={18} />
        </button>
      </div>
      <div className={styles.toolbarUtilities}>
        <button
          className="icon-button"
          aria-label="字幕"
          onClick={() => onConversation('transcript')}
        >
          <Captions size={18} />
        </button>
      </div>
    </div>
  );
}
