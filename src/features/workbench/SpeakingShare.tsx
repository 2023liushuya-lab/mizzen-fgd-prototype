'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Participant, Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import { Avatar } from './Profile';
import styles from './SpeakingShare.module.css';

export function SpeakingShare({
  session,
  readonly,
  onProfile,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
}) {
  const [open, setOpen] = useState(!readonly);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const compact = window.matchMedia('(max-height: 749px)');
    const collapseForShortViewport = () => {
      if (readonly && compact.matches) setOpen(false);
    };
    compact.addEventListener('change', collapseForShortViewport);
    return () => compact.removeEventListener('change', collapseForShortViewport);
  }, [readonly]);
  const update = useFgdStore((s) => s.updateSession);
  const people = session.seatOrder
    .map((id) => session.participants.find((p) => p.id === id))
    .filter((p): p is Participant => !!p && !p.removed);
  const speaking = useMemo(() => {
    const map: Record<string, number> = {};
    Object.values(session.runs).forEach((run) =>
      run.transcript.forEach((t) => {
        map[t.participantId] = (map[t.participantId] || 0) + t.duration;
      }),
    );
    return map;
  }, [session.runs]);
  const total = people.reduce((n, p) => n + (speaking[p.id] || 0), 0);
  let angle = -90;
  return (
    <section className={styles.speakingCard}>
      <button
        className={styles.speakingHeading}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? '收起发言占比' : '展开发言占比'}
      >
        <strong>发言占比</strong>
        {!open && (
          <small>
            {total
              ? people
                  .map(
                    (p) =>
                      `${p.name.slice(0, 1)}${Math.round(((speaking[p.id] || 0) / total) * 100)}%`,
                  )
                  .join(' · ')
              : '等待发言'}
          </small>
        )}
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && (
        <>
          <div className={styles.seatChart}>
            <svg viewBox="0 0 280 228" role="img" aria-label="发言占比与座位图">
              <g transform="translate(140 104)">
                {total ? (
                  people.map((person) => {
                    const share = (speaking[person.id] || 0) / total;
                    if (!share) return null;
                    const end = angle + share * 360;
                    const startXY = [
                      64 * Math.cos((angle * Math.PI) / 180),
                      64 * Math.sin((angle * Math.PI) / 180),
                    ];
                    const endXY = [
                      64 * Math.cos((end * Math.PI) / 180),
                      64 * Math.sin((end * Math.PI) / 180),
                    ];
                    const path =
                      share > 0.999
                        ? 'M-64 0a64 64 0 1 0 128 0a64 64 0 1 0 -128 0'
                        : `M0 0L${startXY.join(' ')}A64 64 0 ${share > 0.5 ? 1 : 0} 1 ${endXY.join(' ')}Z`;
                    const mid = (angle + end) / 2;
                    angle = end;
                    return (
                      <g key={person.id} opacity={active && active !== person.id ? 0.16 : 1}>
                        <path
                          d={path}
                          fill={person.color}
                          stroke="var(--paper)"
                          strokeWidth={2}
                          tabIndex={0}
                          onMouseEnter={() => setActive(person.id)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => setActive(person.id)}
                          onBlur={() => setActive(null)}
                          aria-label={`${person.name}发言占比${Math.round(share * 100)}%`}
                        >
                          <title>
                            {person.name} · {Math.round(share * 100)}%
                          </title>
                        </path>
                        {share > 0.08 && (
                          <text
                            x={40 * Math.cos((mid * Math.PI) / 180)}
                            y={40 * Math.sin((mid * Math.PI) / 180) + 4}
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            pointerEvents="none"
                          >
                            {Math.round(share * 100)}%
                          </text>
                        )}
                      </g>
                    );
                  })
                ) : (
                  <>
                    <circle r="64" fill="#e5e4dc" />
                    <text textAnchor="middle" fill="#879198" fontSize="11" y="4">
                      暂无发言
                    </text>
                  </>
                )}
              </g>
            </svg>
            {people.map((person, index) => {
              const radians = ((-135 + (index / people.length) * 360) * Math.PI) / 180;
              return (
                <button
                  key={person.id}
                  draggable={!readonly && session.phase !== 'ended'}
                  onDragStart={(e) => e.dataTransfer.setData('application/x-fgd-seat', person.id)}
                  onDragOver={(e) => !readonly && e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const other = e.dataTransfer.getData('application/x-fgd-seat');
                    const seats = [...session.seatOrder];
                    const a = seats.indexOf(other);
                    const b = seats.indexOf(person.id);
                    if (!readonly && a >= 0 && b >= 0) {
                      [seats[a], seats[b]] = [seats[b], seats[a]];
                      update(session.id, { seatOrder: seats });
                    }
                  }}
                  className={styles.seat}
                  style={{
                    left: `${(140 + 100 * Math.cos(radians)) / 2.8}%`,
                    top: `${(104 + 87 * Math.sin(radians)) / 2.28}%`,
                    opacity: active && active !== person.id ? 0.22 : 1,
                    outline: active === person.id ? `2px solid ${person.color}` : undefined,
                  }}
                  onMouseEnter={() => setActive(person.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(person.id)}
                  onBlur={() => setActive(null)}
                  onClick={() => onProfile(person)}
                  aria-label={`${person.name}的座位与背景`}
                >
                  <Avatar person={person} size={31} />
                  <span>{person.name}</span>
                </button>
              );
            })}
            <div className={styles.hostSeat}>
              <span>主</span>
              <small>主持人</small>
            </div>
          </div>
          <p className={styles.chartCaption}>整场累计 · 不含主持人与未知发言</p>
        </>
      )}
    </section>
  );
}
