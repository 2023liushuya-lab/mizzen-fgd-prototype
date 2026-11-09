'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, LockKeyhole } from 'lucide-react';
import type { Session } from '@/types/fgd';
import styles from './WorkbenchPage.module.css';

export function SessionGate({ state }: { state: 'loading' | 'missing' | 'expired' }) {
  return (
    <div className={styles.entryPage}>
      {state === 'expired' ? (
        <LockKeyhole size={30} />
      ) : (
        <span className={styles.brand}>mizzen</span>
      )}
      {state === 'loading' ? (
        <p>正在载入工作台…</p>
      ) : (
        <>
          <h1>{state === 'missing' ? '未找到这个场次' : '旁听链接已失效'}</h1>
          <p>
            {state === 'missing' ? '请从场次页面打开对应链接。' : '请使用该场次的有效旁听室链接。'}
          </p>
          <Link className="ui-button button-outline" href="/">
            回到工作空间
          </Link>
        </>
      )}
    </div>
  );
}

export function ObserverIdentityGate({
  session,
  onJoin,
}: {
  session: Session;
  onJoin: (name: string) => void;
}) {
  const [nickname, setNickname] = useState('');
  return (
    <div className={styles.entryPage}>
      <span className={styles.brand}>mizzen</span>
      <form
        className={styles.identityCard}
        onSubmit={(event) => {
          event.preventDefault();
          if (nickname.trim()) onJoin(nickname.trim());
        }}
      >
        <small>旁听室 / {session.delivery === 'online' ? '线上访谈' : '线下访谈'}</small>
        <h1>{session.title}</h1>
        <p>以旁听者身份加入</p>
        <label className="field">
          你的称呼
          <input
            aria-label="旁听者称呼"
            placeholder="用于小纸条署名"
            maxLength={24}
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>
        <small className="muted">不认领受访者身份，不开启你的摄像头或麦克风。</small>
        <button className="ui-button button-primary">
          进入旁听室 <ChevronRight size={15} />
        </button>
      </form>
    </div>
  );
}

export function WaitingRoom({ session, header }: { session: Session; header: ReactNode }) {
  return (
    <div className={styles.workspace}>
      {header}
      <div className={styles.waitingRoom}>
        <div className={styles.waitingCard}>
          <span className={styles.waitingPulse} />
          <small>场次待开始</small>
          <h1>等待主持人开始访谈</h1>
          <p>
            {session.delivery === 'online'
              ? '访谈开始后，视频、题目与作答结果会同步到这里。'
              : '访谈开始后，可查看现场全景与收音、题目和作答结果。'}
          </p>
          <div className={styles.waitingOutline}>
            {session.sections.map((section) => (
              <div key={section.id}>
                <strong>{section.name}</strong>
                <small>{section.minutes} 分钟</small>
              </div>
            ))}
          </div>
          <small className="muted">
            计划约 {session.sections.reduce((sum, section) => sum + section.minutes, 0)} 分钟 ·
            旁听无需开启摄像头或麦克风
          </small>
        </div>
      </div>
    </div>
  );
}
