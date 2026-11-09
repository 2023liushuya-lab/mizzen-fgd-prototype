'use client';
import { Video, VideoOff, Hand } from 'lucide-react';
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
              </g>
            );
          })}
        <g transform="translate(415, 392)">
          <rect x="-18" y="-32" width="36" height="12" rx="6" fill="#52606d" />
          <circle cx="0" cy="0" r="24" fill="#467d78" opacity=".85" />
          <text x="0" y="5" textAnchor="middle" fontSize="13" fill="#fffefa" fontWeight="600">
            主持人
          </text>
        </g>
        <rect x="12" y="12" width="142" height="26" rx="5" fill="#002554" fillOpacity=".55" />
        <text x="24" y="30" fill="white" fontSize="12">
          现场全景机位 · 实时画面
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
        {!person.online && <small>未到场</small>}
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
  const offline = session.delivery === 'offline';
  function mediaContent() {
    if (session.phase === 'ended')
      return (
        <div className={styles.mediaEnded}>
          <VideoOff size={24} />
          <p>会中视频已结束</p>
          <small>实时画面已关闭，题目、回答与分析仍可切换回「题目视图」完整回看。</small>
        </div>
      );
    if (offline)
      return (
        <div className={styles.panoramaWrap}>
          <Panorama session={session} />
        </div>
      );
    return (
      <div className={`${styles.videoList} ${large ? styles.videoGrid : ''}`}>
        {attendance !== 'absent' && (
          <div className={styles.videoTile}>
            <span className={styles.hostAvatar}>主</span>
            <div className={styles.videoTileLabel}>
              <span>主持人</span>
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
      {mediaContent()}
    </section>
  );
}
