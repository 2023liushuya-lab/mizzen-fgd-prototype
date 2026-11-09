'use client';
import { useEffect, useState } from 'react';
import { Hand, Maximize2, MicOff, Video, VideoOff } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { Participant, Session } from '@/types/fgd';
import styles from './ParticipantVideoDock.module.css';
export function ParticipantVideoDock({
  session,
  onProfile,
}: {
  session: Session;
  onProfile: (p: Participant) => void;
}) {
  const people = session.participants.filter((p) => !p.removed),
    [active, setActive] = useState('host'),
    [full, setFull] = useState(false);
  const last = Object.values(session.runs)
    .flatMap((r) => r.transcript)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  useEffect(() => {
    if (last) setActive(last.participantId);
  }, [last?.id]);
  const selected = people.find((p) => p.id === active),
    name = selected?.name || '主持人',
    camera = selected ? selected.camera : !!session.hostCamera;
  const picture = (
    <div className={styles.feature}>
      <span className={styles.initial} style={{ background: selected?.color || '#467d78' }}>
        {name[0]}
      </span>
      <div className={styles.label}>
        {camera ? <Video size={13} /> : <VideoOff size={13} />} {name}
        {selected?.handRaisedAt && <Hand size={13} />}
      </div>
      <small>示例画面</small>
    </div>
  );
  return (
    <div className={styles.dock}>
      <div className={styles.featureWrap}>
        {picture}
        <button className="icon-button" aria-label="放大当前视频" onClick={() => setFull(true)}>
          <Maximize2 size={14} />
        </button>
      </div>
      <div className={styles.list}>
        <button
          className={active === 'host' ? styles.active : ''}
          onClick={() => setActive('host')}
        >
          <span style={{ background: '#467d78' }}>主</span>
          <strong>主持人</strong>
          {!session.hostMic && <MicOff size={13} />}
        </button>
        {people.map((p) => (
          <button
            key={p.id}
            className={active === p.id ? styles.active : ''}
            onClick={() => setActive(p.id)}
            onDoubleClick={() => onProfile(p)}
          >
            <span style={{ background: p.color }}>{p.name[0]}</span>
            <strong>{p.name}</strong>
            {p.handRaisedAt ? <Hand size={13} /> : !p.mic ? <MicOff size={13} /> : null}
            <small>{!p.online ? '未到场' : ''}</small>
          </button>
        ))}
      </div>
      <Modal open={full} onOpenChange={setFull} title={name} wide>
        {picture}
      </Modal>
    </div>
  );
}
