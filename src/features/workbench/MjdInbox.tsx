'use client';
import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import type { Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import styles from './MjdControls.module.css';
export function MjdInbox({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const read = useFgdStore((s) => s.readNote);
  const notes = session.notes
    .filter((n) => n.status !== 'failed')
    .slice()
    .sort(
      (a, b) =>
        Number(!!a.readAt) - Number(!!b.readAt) ||
        (a.readAt && b.readAt ? a.readAt - b.readAt : b.createdAt - a.createdAt),
    );
  const unread = notes.filter((n) => !n.readAt).length;
  return (
    <div className={styles.inboxWrap}>
      <button
        className="icon-button"
        aria-label={`小纸条信箱，${unread}条未读`}
        aria-expanded={open}
        title="小纸条"
        onClick={() => setOpen(!open)}
      >
        <Mail size={18} />
        {unread > 0 && <b className={styles.count}>{unread}</b>}
      </button>
      {open && (
        <section className={styles.inbox} aria-label="旁听席小纸条">
          <header>
            <strong>小纸条 {unread > 0 ? `· ${unread}条未读` : ''}</strong>
            <button className="icon-button" aria-label="关闭小纸条" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </header>
          <div className={styles.messages}>
            {notes.map((n) => (
              <button
                key={n.id}
                className={`${styles.message} ${n.readAt ? styles.read : ''}`}
                onClick={() => read(session.id, n.id)}
                aria-label={`${n.readAt ? '已读' : '阅读'}小纸条：${n.text}`}
              >
                <small>
                  {n.observerName} ·{' '}
                  {new Date(n.createdAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
                <p>{n.text}</p>
              </button>
            ))}
            {!notes.length && <p className="muted">暂无小纸条</p>}
          </div>
        </section>
      )}
    </div>
  );
}
