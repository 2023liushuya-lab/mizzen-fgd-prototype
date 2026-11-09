'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Headphones,
  List,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFgdStore } from '@/stores/fgd-store';
import { sessionLink } from '@/lib/utils';
import type { Participant, Project, Session } from '@/types/fgd';
import { Notice, LinkField, projectUrl, outlineUrl, phaseName } from './shared';
import RosterEditor from './RosterEditor';
import SeatSetup from './SeatSetup';
import styles from './entry.module.css';
export default function Setup({ project, session }: { project: Project; session: Session }) {
  const router = useRouter();
  const update = useFgdStore((s) => s.updateSession);
  const start = useFgdStore((s) => s.startSession);
  const [message, setMessage] = useState('');
  const [qrPerson, setQrPerson] = useState<Participant | null>(null);
  const people = session.participants.filter((p) => !p.removed);
  const pending = session.phase === 'pending';
  function patch(p: Partial<Session>) {
    update(session.id, p);
  }
  function enterHost() {
    if (session.phase === 'pending') {
      const result = start(session.id);
      if (!result.ok) {
        setMessage(result.error || '请先完成场次配置。');
        return;
      }
    }
    router.push(sessionLink('host', session));
  }
  return (
    <div className={styles.setupPage}>
      <header className={styles.setupHeader}>
        <div>
          <Link href={projectUrl(project.id)} className={styles.backLink}>
            <ArrowLeft size={16} />
            返回场次
          </Link>
          <h1>配置场次</h1>
        </div>
        <div className="row">
          <span className={styles.saved}>
            <Check size={14} />
            已保存
          </span>
          <Button variant="outline" size="sm" asChild>
            <a href={sessionLink('observer', session)} target="_blank" rel="noopener noreferrer">
              <Headphones size={15} />
              旁听室
              <ExternalLink size={13} />
            </a>
          </Button>
        </div>
      </header>
      <main className={styles.setupMain}>
        <Notice>{message}</Notice>
        <section className={styles.setupCard}>
          <div className={styles.sectionTitle}>
            <h2>场次信息</h2>
            <span className={`${styles.phase} ${styles[session.phase]}`}>
              {phaseName[session.phase]}
            </span>
          </div>
          <div className={styles.editorField}>
            <label htmlFor="session-name">场次名称</label>
            <input
              id="session-name"
              value={session.title}
              disabled={!pending}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div className={styles.editorGrid}>
            <div className={styles.editorField}>
              <label>内容语言</label>
              <input value="简体中文" readOnly />
            </div>
            <div className={styles.editorField}>
              <label>开展方式</label>
              <div className={styles.deliverySwitch}>
                <button
                  disabled={!pending}
                  aria-pressed={session.delivery === 'online'}
                  className={session.delivery === 'online' ? styles.deliveryActive : ''}
                  onClick={() => patch({ delivery: 'online' })}
                >
                  <Video size={16} />
                  线上
                </button>
                <button
                  disabled={!pending}
                  aria-pressed={session.delivery === 'offline'}
                  className={session.delivery === 'offline' ? styles.deliveryActive : ''}
                  onClick={() => patch({ delivery: 'offline' })}
                >
                  <Users size={16} />
                  线下
                </button>
              </div>
            </div>
          </div>
        </section>
        <div
          className={`${styles.setupColumns} ${session.delivery === 'online' ? styles.setupSingle : ''}`}
        >
          <div className={styles.setupLeft}>
            <section className={styles.setupCard}>
              <div className={styles.sectionTitle}>
                <div>
                  <h2>{session.delivery === 'online' ? '线上入场' : '线下房间'}</h2>
                  <p className="muted">
                    {session.delivery === 'online'
                      ? '受访者打开链接，输入房间码后认领名单中的身份。'
                      : '受访者使用个人二维码入场，按现场座位完成配置。'}
                  </p>
                </div>
                <span className={styles.roomCode}>
                  {session.roomCode}
                  <small>房间码</small>
                </span>
              </div>
              {session.delivery === 'online' ? (
                <LinkField session={session} role="participant" onMessage={setMessage} />
              ) : (
                <div className={styles.offlineRoom}>
                  <Users size={25} />
                  <div>
                    <strong>现场访谈房间</strong>
                    <span>{people.length} 位受访者 · 1 张圆桌</span>
                  </div>
                  <span className={styles.roomCheck}>
                    <CheckCircle2 size={15} />
                    房间已创建
                  </span>
                </div>
              )}
            </section>
            <RosterEditor
              session={session}
              onChange={patch}
              onShowQr={setQrPerson}
              onMessage={setMessage}
            />
          </div>
          {session.delivery === 'offline' && (
            <aside className={styles.setupRight}>
              <SeatSetup
                session={session}
                qrPerson={qrPerson}
                onCloseQr={() => setQrPerson(null)}
                onChange={patch}
                onMessage={setMessage}
              />
            </aside>
          )}
        </div>
        <div className={styles.setupBottom}>
          <Link href={projectUrl(project.id)}>返回场次</Link>
          <div>
            <span className="muted">
              {session.delivery === 'offline' && pending
                ? `声纹已启用 ${people.filter((p) => p.voiceEnabled).length + (session.hostVoiceEnabled ? 1 : 0)} / ${people.length + 1}（含主持人）`
                : '场次配置自动保存'}
            </span>
            <Button onClick={enterHost}>
              {session.phase === 'ended' ? '查看访谈记录' : '进入主持台'}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
