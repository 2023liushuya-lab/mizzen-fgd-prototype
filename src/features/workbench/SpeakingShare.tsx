'use client';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Participant, Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import styles from './SpeakingShare.module.css';

const SEAT_COORDS: [number, number][] = [
  [17, 23],
  [83, 23],
  [83, 72],
  [17, 72],
];

function PersonSilhouette() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="12" r="5.5" />
      <path d="M8 31v-3a10 10 0 0120 0v3" />
    </svg>
  );
}

export function SpeakingShare({
  session,
  readonly,
  onProfile,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
}) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const compact = window.matchMedia('(max-height: 749px)');
    const collapseForShortViewport = () => {
      if (compact.matches) setOpen(false);
    };
    compact.addEventListener('change', collapseForShortViewport);
    return () => compact.removeEventListener('change', collapseForShortViewport);
  }, []);
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
  const cx = 180;
  const cy = 170;
  const r = 94;
  const pt = (ang: number, rad = r): [number, number] => [
    cx + rad * Math.cos(ang),
    cy + rad * Math.sin(ang),
  ];
  let start = -Math.PI / 2;

  const activePerson = active ? people.find((p) => p.id === active) : null;
  const activeSeconds = activePerson ? Math.round(speaking[activePerson.id] || 0) : 0;
  const activePct = activePerson && total ? Math.round((activeSeconds / total) * 100) : 0;
  const mm = String(Math.floor(activeSeconds / 60)).padStart(2, '0');
  const ss = String(activeSeconds % 60).padStart(2, '0');

  return (
    <section className={`${styles.speakingCard} ${!open ? styles.speakingCollapsed : ''}`}>
      <div className={styles.speakingHead}>
        <h2>
          <button
            type="button"
            className={styles.speakingToggle}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? '收起发言占比' : '展开发言占比'}
            title={open ? '收起发言占比' : '展开发言占比'}
          >
            {open ? '▾' : '▸'}
          </button>
          发言占比 <small title="整场已识别受访者累计发言时长占比">ⓘ</small>
        </h2>
        {!open && (
          <span className={styles.compactSummary}>
            {total
              ? people
                  .map(
                    (p) =>
                      `${p.name.slice(0, 1)}${Math.round(((speaking[p.id] || 0) / total) * 100)}%`,
                  )
                  .join(' · ')
              : '等待发言'}
          </span>
        )}
      </div>
      {open && (
        <div className={styles.speechPie}>
          <div className={styles.seatPie}>
            <svg
              className={styles.shareGraphic}
              viewBox="0 0 360 360"
              role="img"
              aria-label="发言占比与座位图"
            >
              <ellipse className={styles.seatRing} cx="180" cy="173" rx="143" ry="139" />
              {total ? (
                people.map((person) => {
                  const share = (speaking[person.id] || 0) / total;
                  if (!share) return null;
                  const sweep = share * Math.PI * 2;
                  const end = start + sweep;
                  const mid = start + sweep / 2;
                  const [x1, y1] = pt(start);
                  const [x2, y2] = pt(end);
                  const [lx, ly] = pt(mid, r * 0.6);
                  const large = sweep > Math.PI ? 1 : 0;
                  const d =
                    sweep >= Math.PI * 1.999
                      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                      : `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
                  start = end;
                  const pct = Math.round(share * 100);
                  const dimmed = active !== null && active !== person.id;
                  const lit = active === person.id;
                  return (
                    <g key={person.id}>
                      <path
                        className={`${styles.pieSlice} ${dimmed ? styles.sliceDim : ''} ${lit ? styles.sliceLit : ''}`}
                        d={d}
                        fill={person.color}
                        tabIndex={0}
                        role="button"
                        onMouseEnter={() => setActive(person.id)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(person.id)}
                        onBlur={() => setActive(null)}
                        onClick={() => onProfile(person)}
                        aria-label={`${person.name}发言占比${pct}%`}
                      >
                        <title>
                          {person.name}：累计发言占比 {pct}%
                        </title>
                      </path>
                      {pct >= 7 && (
                        <text className={styles.pieLabel} x={lx.toFixed(1)} y={ly.toFixed(1)}>
                          {pct}%
                        </text>
                      )}
                    </g>
                  );
                })
              ) : (
                <>
                  <circle cx={cx} cy={cy} r={r} fill="#eeeae1" stroke="#dfddd4" strokeWidth="2" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#87939a" fontSize="13">
                    暂无发言统计
                  </text>
                </>
              )}
            </svg>
            {people.map((person, index) => {
              let left: number;
              let top: number;
              if (people.length <= 4) {
                [left, top] = SEAT_COORDS[index % SEAT_COORDS.length];
              } else {
                const rad = ((-135 + (index / people.length) * 360) * Math.PI) / 180;
                left = 50 + 36 * Math.cos(rad);
                top = 48 + 36 * Math.sin(rad);
              }
              const dimmed = active !== null && active !== person.id;
              const lit = active === person.id;
              return (
                <button
                  type="button"
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
                  className={`${styles.pieSeat} ${dimmed ? styles.seatDim : ''} ${lit ? styles.seatLit : ''}`}
                  style={
                    {
                      left: `${left}%`,
                      top: `${top}%`,
                      '--seat-color': person.color,
                    } as CSSProperties
                  }
                  onMouseEnter={() => setActive(person.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(person.id)}
                  onBlur={() => setActive(null)}
                  onClick={() => onProfile(person)}
                  aria-label={`${person.name}的座位与背景`}
                  title={`${person.name} · 点击查看受访者资料`}
                >
                  <span className={styles.seatAvatar}>
                    <PersonSilhouette />
                    <b>{person.name.slice(0, 1)}</b>
                  </span>
                  <span>{person.name}</span>
                </button>
              );
            })}
            <div
              className={`${styles.pieSeat} ${styles.hostPosition}`}
              style={{ left: '50%', top: '91%' }}
              aria-label="主持人位置"
            >
              <span className={styles.seatAvatar}>
                <PersonSilhouette />
              </span>
              <span>主持人</span>
            </div>
          </div>
          <div className={styles.shareHoverDetail}>
            {activePerson
              ? `${activePerson.name} · 累计发言 ${mm}:${ss}（${activePct}%）`
              : '悬停扇区或座位查看发言时长，点击查看资料'}
          </div>
          <p className={styles.chartCaption}>整场累计 · 不含主持人与未知发言</p>
        </div>
      )}
    </section>
  );
}
