'use client';
import { useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/modal';
import { backgroundOf, sessionLink } from '@/lib/utils';
import type { Participant, Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import styles from './Profile.module.css';

export function Avatar({ person, size = 30 }: { person: Participant; size?: number }) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: person.color }}
      aria-hidden
    >
      {person.name.slice(0, 1)}
    </span>
  );
}

export function ProfileModal({
  session,
  person,
  onClose,
}: {
  session: Session;
  person: Participant | null;
  onClose: () => void;
}) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let active = true;
    if (person && session.delivery === 'offline') {
      const url = `${location.origin}${sessionLink('participant', session)}&participant=${encodeURIComponent(person.id)}`;
      QRCode.toDataURL(url, { margin: 1, width: 180 }).then((value) => {
        if (active) setQr(value);
      });
    }
    return () => {
      active = false;
    };
  }, [person, session]);
  return (
    <Modal open={!!person} onOpenChange={(open) => !open && onClose()} title="受访者背景">
      {person && (
        <>
          <div className={styles.profileHeading}>
            <Avatar person={person} size={46} />
            <div>
              <strong>{person.name}</strong>
              <p>
                {session.delivery === 'offline' ? '现场受访者' : person.online ? '在线' : '未到场'}
              </p>
            </div>
          </div>
          <div className={styles.profileDetails}>
            <label>背景信息</label>
            <p>{backgroundOf(person)}</p>
          </div>
          {session.delivery === 'offline' && qr && (
            <div className={styles.profileQr}>
              <img src={qr} alt={`${person.name}个人入场二维码`} />
              <small>个人入场码</small>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export function ParticipantStrip({
  session,
  readonly,
  onProfile,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
}) {
  const request = useFgdStore((s) => s.requestMedia);
  const remove = useFgdStore((s) => s.removeParticipant);
  const [removePerson, setRemovePerson] = useState<Participant | null>(null);
  const [feedback, setFeedback] = useState('');
  const [cardLeft, setCardLeft] = useState(12);
  const people = session.participants.filter((p) => !p.removed);
  function media(person: Participant, kind: 'mic' | 'camera') {
    const enabled = !person[kind];
    request(session.id, person.id, kind, enabled);
    setFeedback(
      `已请求${person.name}${enabled ? '开启' : '关闭'}${kind === 'mic' ? '麦克风' : '摄像头'}`,
    );
    setTimeout(() => setFeedback(''), 2500);
  }
  return (
    <div className={styles.peopleStrip} aria-label="受访者背景速览">
      <span className={styles.peopleCount}>{people.length}</span>
      {people.map((person) => {
        const pending = (kind: 'mic' | 'camera') =>
          session.mediaRequests.some(
            (r) => r.participantId === person.id && r.kind === kind && r.status === 'pending',
          );
        return (
          <div
            key={person.id}
            className={styles.personHover}
            onMouseEnter={(e) =>
              setCardLeft(
                Math.max(
                  12,
                  Math.min(
                    e.currentTarget.getBoundingClientRect().left - 8,
                    window.innerWidth - 272,
                  ),
                ),
              )
            }
            onFocusCapture={(e) =>
              setCardLeft(
                Math.max(
                  12,
                  Math.min(
                    e.currentTarget.getBoundingClientRect().left - 8,
                    window.innerWidth - 272,
                  ),
                ),
              )
            }
          >
            <button
              className={styles.personAvatarButton}
              aria-label={`查看${person.name}的背景信息`}
              onClick={() => onProfile(person)}
            >
              <Avatar person={person} />
              <i
                className={
                  person.online || session.delivery === 'offline'
                    ? styles.onlineDot
                    : styles.offlineDot
                }
              />
            </button>
            <div
              className={styles.personHoverCard}
              style={{ left: cardLeft }}
              role="group"
              aria-label={`${person.name}资料与操作`}
            >
              <div className={styles.profileHeading}>
                <Avatar person={person} size={34} />
                <div>
                  <strong>{person.name}</strong>
                  <small>
                    {session.delivery === 'offline' ? '现场' : person.online ? '在线' : '未到场'}
                  </small>
                </div>
              </div>
              <p>{backgroundOf(person)}</p>
              {!readonly && session.delivery === 'online' && session.phase !== 'ended' && (
                <div className={styles.personActions}>
                  <button
                    className={`icon-button ${!person.mic ? styles.mediaOff : ''} ${pending('mic') ? styles.requestPending : ''}`}
                    aria-pressed={person.mic}
                    aria-busy={pending('mic')}
                    disabled={pending('mic')}
                    aria-label={`${person.mic ? '请求静音' : '请求开麦'}：${person.name}`}
                    title={person.mic ? '请求静音' : '请求开麦'}
                    onClick={() => media(person, 'mic')}
                  >
                    {person.mic ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button
                    className={`icon-button ${!person.camera ? styles.mediaOff : ''} ${pending('camera') ? styles.requestPending : ''}`}
                    aria-pressed={person.camera}
                    aria-busy={pending('camera')}
                    disabled={pending('camera')}
                    aria-label={`${person.camera ? '请求关闭视频' : '请求开启视频'}：${person.name}`}
                    title={person.camera ? '请求关闭视频' : '请求开启视频'}
                    onClick={() => media(person, 'camera')}
                  >
                    {person.camera ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>
                  <button className={styles.removeButton} onClick={() => setRemovePerson(person)}>
                    移除
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {feedback && (
        <span role="status" className={styles.floatingFeedback}>
          {feedback}
        </span>
      )}
      <Modal
        open={!!removePerson}
        onOpenChange={(open) => !open && setRemovePerson(null)}
        title="移除受访者？"
      >
        <p>移除 {removePerson?.name} 后，对方将离开本场访谈；已发生的回答和发言会保留。</p>
        <div className={styles.modalFooter}>
          <button className="ui-button button-outline" onClick={() => setRemovePerson(null)}>
            取消
          </button>
          <button
            className="ui-button button-danger"
            onClick={() => {
              if (removePerson) remove(session.id, removePerson.id);
              setRemovePerson(null);
            }}
          >
            确认移除
          </button>
        </div>
      </Modal>
    </div>
  );
}
