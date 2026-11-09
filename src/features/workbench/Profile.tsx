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
  const people = session.participants.filter((p) => !p.removed);
  const onlineCount =
    session.delivery === 'offline'
      ? people.length
      : people.filter((p) => p.online).length || people.length;
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
      <span className={styles.presenceLabel}>在场 {onlineCount} 人</span>
      {people.map((person, index) => {
        const seatIdx = session.seatOrder.indexOf(person.id);
        const seatNo = (seatIdx >= 0 ? seatIdx : index) + 1;
        const isOnline = person.online || session.delivery === 'offline';
        return (
          <div key={person.id} className={styles.personHover}>
            <button
              className={styles.personAvatarButton}
              aria-label={`查看${person.name}的背景信息`}
              onClick={() => onProfile(person)}
            >
              <span className={styles.presenceAvatar}>{person.name.slice(0, 1)}</span>
              <i className={isOnline ? styles.onlineDot : styles.offlineDot} />
            </button>
            <div
              className={styles.personHoverCard}
              role="group"
              aria-label={`${person.name}资料与操作`}
            >
              <div className={styles.participantCardHead}>
                <span className={styles.profileAvatar}>{person.name.slice(0, 1)}</span>
                <div>
                  <strong>{person.name}</strong>
                  <small className={styles.seatMeta}>
                    P{String(seatNo).padStart(2, '0')} · 座位 {seatNo}
                  </small>
                </div>
                <span className={styles.statusPill}>
                  <i className={isOnline ? styles.statusDotOnline : styles.statusDotOffline} />
                  {session.delivery === 'offline'
                    ? '现场已入座'
                    : person.online
                      ? '在线'
                      : '未到场'}
                </span>
              </div>
              <div className={styles.participantTags}>
                {person.skin && <span className={styles.infoTag}>{person.skin}</span>}
                {person.age && <span className={styles.infoTag}>{person.age}</span>}
              </div>
              <dl className={styles.participantFields}>
                <div>
                  <dt>年龄</dt>
                  <dd>{person.age || '未填写'}</dd>
                </div>
                <div>
                  <dt>肤质</dt>
                  <dd>{person.skin || '未填写'}</dd>
                </div>
                <div className={styles.fullRow}>
                  <dt>备注</dt>
                  <dd>{person.notes || backgroundOf(person)}</dd>
                </div>
              </dl>
              {!readonly && session.delivery === 'online' && session.phase !== 'ended' && (
                <div className={styles.personActions}>
                  <button
                    className={`icon-button ${!person.mic ? styles.mediaOff : ''}`}
                    aria-label={`${person.mic ? '请求静音' : '请求开麦'}：${person.name}`}
                    title={person.mic ? '请求静音' : '请求开麦'}
                    onClick={() => media(person, 'mic')}
                  >
                    {person.mic ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button
                    className={`icon-button ${!person.camera ? styles.mediaOff : ''}`}
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
