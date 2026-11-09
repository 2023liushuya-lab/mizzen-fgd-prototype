'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, MicOff, Video, VideoOff, Hand } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { Participant, Session } from '@/types/fgd';
import { Avatar } from './Profile';
import styles from './MediaPanel.module.css';

function Panorama({ session }: { session: Session }) {
  return (
    <div className={styles.panorama}>
      <svg viewBox="0 0 800 450" role="img" aria-label="现场全景摄像头示意画面">
        <defs>
          <linearGradient id="room-wall" x2="0" y2="1">
            <stop stopColor="#dddcd3" />
            <stop offset="1" stopColor="#edeae2" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#room-wall)" />
        <path d="M0 325L800 325V450H0Z" fill="#c9c9bd" />
        <rect x="64" y="65" width="225" height="163" rx="4" fill="#f5f4ec" stroke="#c4c3b8" />
        <path d="M176 65V228M64 146H289" stroke="#d1d1c6" />
        <rect x="547" y="62" width="185" height="133" rx="4" fill="#d4d8d0" />
        <ellipse cx="415" cy="337" rx="231" ry="69" fill="#acb1a3" />
        <ellipse
          cx="415"
          cy="316"
          rx="231"
          ry="69"
          fill="#eeece3"
          stroke="#a2a99b"
          strokeWidth="3"
        />
        {session.participants
          .filter((p) => !p.removed)
          .slice(0, 6)
          .map((p, i, arr) => {
            const a = -Math.PI + (i / Math.max(1, arr.length - 1)) * Math.PI;
            const x = 415 + 220 * Math.cos(a);
            const y = 273 + 67 * Math.sin(a);
            return (
              <g key={p.id}>
                <ellipse cx={x} cy={y + 53} rx="39" ry="44" fill={p.color} opacity=".75" />
                <circle cx={x} cy={y} r="28" fill="#dac6b6" />
                <text x={x} y={y + 103} textAnchor="middle" fontSize="14" fill="#52606d">
                  {p.name}
                </text>
              </g>
            );
          })}
        <rect x="12" y="12" width="95" height="26" rx="5" fill="#002554" fillOpacity=".55" />
        <text x="24" y="30" fill="white" fontSize="12">
          现场全景 · 示例
        </text>
      </svg>
    </div>
  );
}

export function VideoTile({
  person,
  onProfile,
}: {
  person: Participant;
  onProfile: (person: Participant) => void;
}) {
  return (
    <button
      className={styles.videoTile}
      onClick={() => onProfile(person)}
      aria-label={`查看${person.name}的背景信息`}
    >
      <Avatar person={person} size={46} />
      {person.handRaisedAt && (
        <span className={styles.raisedBadge}>
          <Hand size={14} />
          举手
        </span>
      )}
      <div className={styles.videoTileLabel}>
        <span>{person.name}</span>
        {person.online ? (
          <>
            <span title={person.mic ? '麦克风开启' : '麦克风关闭'}>
              {!person.mic && <MicOff size={13} />}
            </span>
            {!person.camera && <VideoOff size={13} />}
          </>
        ) : (
          <small>未到场</small>
        )}
      </div>
    </button>
  );
}

export function MediaPanel({
  session,
  onProfile,
  large = false,
  attendance,
}: {
  session: Session;
  onProfile: (person: Participant) => void;
  large?: boolean;
  attendance?: 'arrived' | 'absent';
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [full, setFull] = useState(false);
  const offline = session.delivery === 'offline';
  function mediaContent(fullscreen = false) {
    if (session.phase === 'ended')
      return (
        <div className={styles.mediaEnded}>
          <VideoOff size={24} />
          <p>访谈已结束</p>
          <small>实时画面已关闭，题目与笔记可继续回看。</small>
        </div>
      );
    if (offline)
      return (
        <button
          className={styles.panoramaButton}
          aria-label="放大现场全景"
          onClick={() => !fullscreen && setFull(true)}
        >
          <Panorama session={session} />
        </button>
      );
    return (
      <div className={`${styles.videoList} ${large || fullscreen ? styles.videoGrid : ''}`}>
        {attendance !== 'absent' && (
          <div className={styles.videoTile}>
            <span className={styles.hostAvatar}>主</span>
            <div className={styles.videoTileLabel}>
              主持人
              <Video size={13} />
            </div>
          </div>
        )}
        {session.participants
          .filter(
            (p) => !p.removed && (!attendance || (attendance === 'arrived' ? p.online : !p.online)),
          )
          .map((p) => (
            <VideoTile key={p.id} person={p} onProfile={onProfile} />
          ))}
      </div>
    );
  }
  return (
    <section className={`${styles.mediaPanel} ${large ? styles.mediaPanelLarge : ''}`}>
      <div className={styles.mediaHeader}>
        <strong>{offline ? '现场画面' : '会议视频'}</strong>
        <small>示例</small>
        <div>
          <button className="icon-button" onClick={() => setFull(true)} aria-label="放大画面">
            <Maximize2 size={15} />
          </button>
          <button
            className="icon-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '展开画面' : '收起画面'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && mediaContent()}
      <Modal open={full} onOpenChange={setFull} title={offline ? '现场全景' : '会议视频'} wide>
        {mediaContent(true)}
      </Modal>
    </section>
  );
}
