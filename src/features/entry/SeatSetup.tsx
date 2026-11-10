'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { Check, Copy, UserRound, Users } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { copyText, sessionLink } from '@/lib/utils';
import type { Participant, Session } from '@/types/fgd';
import { Notice } from './shared';
import styles from './entry.module.css';
interface SeatSetupProps {
  session: Session;
  qrPerson: Participant | null;
  onCloseQr: () => void;
  onChange: (patch: Partial<Session>) => void;
  onMessage: (message: string) => void;
}
export default function SeatSetup({
  session,
  qrPerson,
  onCloseQr,
  onChange: patch,
  onMessage,
}: SeatSetupProps) {
  const people = session.participants.filter((p) => !p.removed);
  const pending = session.phase === 'pending';
  const [dragPerson, setDragPerson] = useState<string | null>(null);
  const [qr, setQr] = useState<{ name: string; url: string; link: string } | null>(null);
  const [qrError, setQrError] = useState('');
  const qrLink =
    qrPerson && typeof window !== 'undefined'
      ? window.location.origin +
        sessionLink('participant', session) +
        `&participant=${encodeURIComponent(qrPerson.id)}`
      : '';
  const qrName = qrPerson?.name || '';
  useEffect(() => {
    let cancelled = false;
    setQr(null);
    setQrError('');
    if (qrLink)
      QRCode.toDataURL(qrLink, {
        width: 240,
        margin: 2,
        color: { dark: '#002554', light: '#fffefa' },
      })
        .then((url) => {
          if (!cancelled) setQr({ name: qrName, url, link: qrLink });
        })
        .catch(() => {
          if (!cancelled) setQrError('二维码生成失败，请关闭后重新打开。');
        });
    return () => {
      cancelled = true;
    };
  }, [qrLink, qrName]);
  function swapSeat(target: string) {
    if (!dragPerson || dragPerson === target) return;
    const order = people
      .map((p) => p.id)
      .sort((a, b) => session.seatOrder.indexOf(a) - session.seatOrder.indexOf(b));
    const from = order.indexOf(dragPerson);
    const to = order.indexOf(target);
    if (from >= 0 && to >= 0) {
      [order[from], order[to]] = [order[to], order[from]];
      patch({ seatOrder: order });
    }
    setDragPerson(null);
  }
  return (
    <>
      <section className={styles.setupCard}>
        <div className={styles.sectionTitle}>
          <h2>圆桌座位</h2>
          <span className="muted">{people.length} 人</span>
        </div>
        <div className={styles.roundTable}>
          <div className={styles.tableSurface}>
            <Users size={27} />
            <span>圆桌</span>
          </div>
          {[...people]
            .sort((a, b) => session.seatOrder.indexOf(a.id) - session.seatOrder.indexOf(b.id))
            .map((p, index) => {
              const angle =
                ((120 + ((index + 0.5) / Math.max(1, people.length)) * 300) * Math.PI) / 180;
              return (
                <button
                  key={p.id}
                  draggable={pending}
                  onDragStart={(e) => {
                    setDragPerson(p.id);
                    e.dataTransfer.setData('text/plain', p.id);
                  }}
                  onDragEnd={() => setDragPerson(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    swapSeat(p.id);
                  }}
                  className={`${styles.seat} ${dragPerson === p.id ? styles.draggingSeat : ''}`}
                  style={
                    {
                      left: `${50 + 36 * Math.cos(angle)}%`,
                      top: `${43 + 31 * Math.sin(angle)}%`,
                      '--person-color': p.color,
                    } as CSSProperties
                  }
                  aria-label={`${p.name}，座位${index + 1}，可拖动调整`}
                >
                  <span>
                    <UserRound size={22} />
                    <b>{p.name[0]}</b>
                  </span>
                  <small>{p.name}</small>
                </button>
              );
            })}
          <div className={styles.hostSeat}>
            <span>
              <UserRound size={21} />
            </span>
            <small>主持人</small>
          </div>
        </div>
      </section>
      <Modal
        open={!!qrPerson}
        onOpenChange={(open) => !open && onCloseQr()}
        title={`${qrPerson?.name || ''}的个人码`}
      >
        <Notice>{qrError}</Notice>
        {qrPerson && !qr && !qrError && <p className="muted">正在生成个人码…</p>}
        {qr && (
          <div className={styles.qrPanel}>
            {/* QR codes are local prototype join links. */}
            <img src={qr.url} width={240} height={240} alt={`${qr.name}个人入场二维码`} />
            <strong>{qr.name}</strong>
            <p className="muted">房间码 {session.roomCode}</p>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await copyText(qr.link);
                  onMessage('个人入场链接已复制');
                } catch {
                  onMessage('复制失败，请重试。');
                }
              }}
            >
              <Copy size={14} />
              复制个人链接
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
