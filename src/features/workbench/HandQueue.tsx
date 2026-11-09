'use client';
import { useClock } from '@/hooks/use-clock';
import { Hand, X } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import type { Participant, Session } from '@/types/fgd';
import styles from './HandQueue.module.css';
export function raisedPeople(session: Session) {
  return session.participants
    .filter((p) => !p.removed && p.handRaisedAt)
    .sort((a, b) => a.handRaisedAt! - b.handRaisedAt!);
}
export function HandQueue({
  session,
  open,
  onClose,
}: {
  session: Session;
  open: boolean;
  onClose: () => void;
}) {
  const invite = useFgdStore((s) => s.inviteHand),
    lower = useFgdStore((s) => s.setHand),
    clear = useFgdStore((s) => s.clearHands),
    people = raisedPeople(session);
  if (!open || !people.length || session.phase !== 'live') return null;
  return (
    <section className={styles.queue} aria-label="举手请求">
      <header>
        <Hand size={16} />
        <strong>举手请求</strong>
        <small>{people.length} 人</small>
        <button className="icon-button" aria-label="收起举手请求" onClick={onClose}>
          <X size={15} />
        </button>
      </header>
      <ol>
        {people.map((p, i) => {
          const pending = session.mediaRequests.some(
            (r) => r.participantId === p.id && r.fromHand && r.status === 'pending',
          );
          return (
            <li key={p.id}>
              <span className="avatar" style={{ background: p.color }}>
                {p.name[0]}
              </span>
              <div>
                <strong>{p.name}</strong>
                <small>
                  {!p.online
                    ? '重连中，等待恢复'
                    : pending
                      ? '已邀请，等待开麦回应'
                      : p.handResponse?.kind === 'declined'
                        ? '暂不开麦，继续等待'
                        : `第 ${i + 1} 位 · 等待回应`}
                </small>
              </div>
              <div className={styles.actions}>
                <button
                  className="ui-button button-primary button-small"
                  disabled={pending || !p.online}
                  onClick={() => invite(session.id, p.id)}
                >
                  {pending ? '等待回应' : '请 TA 发言'}
                </button>
                <button
                  className="ui-button button-outline button-small"
                  onClick={() => lower(session.id, p.id, false)}
                >
                  放下手
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {people.length > 1 && (
        <button className={styles.clear} onClick={() => clear(session.id)}>
          全部放下
        </button>
      )}
    </section>
  );
}
export function ParticipantHandStatus({
  session,
  person,
}: {
  session: Session;
  person: Participant;
}) {
  const now = useClock();
  const lower = useFgdStore((s) => s.setHand),
    respond = useFgdStore((s) => s.respondMedia),
    request = session.mediaRequests.find(
      (r) => r.participantId === person.id && r.fromHand && r.status === 'pending',
    );
  if (session.phase !== 'live') return null;
  if (!person.handRaisedAt && !request) {
    const response = person.handResponse;
    if (!response || now - response.at > 6000) return null;
    return (
      <div className={styles.feedback} role="status">
        {response.kind === 'speaking'
          ? '已开麦，可以发言'
          : response.kind === 'lowered'
            ? '主持人已放下你的手'
            : response.kind === 'cancelled'
              ? '已取消举手'
              : ''}
      </div>
    );
  }
  const rank = raisedPeople(session).findIndex((p) => p.id === person.id) + 1;
  return (
    <aside className={styles.participantStatus} role="status">
      <Hand size={21} />
      <div>
        <strong>{request ? '主持人请你发言' : '已举手'}</strong>
        <small>
          {request
            ? '确认后开启麦克风'
            : person.handResponse?.kind === 'declined'
              ? '暂不开麦，继续排队'
              : `第 ${rank} 位 · 等待主持人回应`}
        </small>
      </div>
      {request ? (
        <>
          <button
            className="ui-button button-outline button-small"
            onClick={() => respond(session.id, request.id, false)}
          >
            暂不开启
          </button>
          <button
            className="ui-button button-primary button-small"
            onClick={() => respond(session.id, request.id, true)}
          >
            立即开麦
          </button>
        </>
      ) : (
        <button
          className="ui-button button-outline button-small"
          onClick={() => lower(session.id, person.id, false)}
        >
          取消举手
        </button>
      )}
    </aside>
  );
}

export function HostHandFeedback({ session }: { session: Session }) {
  const now = useClock();
  const p = session.participants
    .filter(
      (p) =>
        p.handResponse &&
        ['speaking', 'declined', 'cancelled'].includes(p.handResponse.kind) &&
        now - p.handResponse.at < 6000,
    )
    .sort((a, b) => b.handResponse!.at - a.handResponse!.at)[0];
  if (!p || session.phase !== 'live') return null;
  return (
    <div className={styles.feedback} role="status">
      {p.name}
      {p.handResponse?.kind === 'speaking'
        ? ' 已开麦，可以请 TA 发言'
        : p.handResponse?.kind === 'declined'
          ? ' 暂不开麦，仍在排队'
          : ' 已取消举手'}
    </div>
  );
}
