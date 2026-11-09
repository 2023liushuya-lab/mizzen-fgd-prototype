'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { ParticipantGate } from './ParticipantGate';
import { ParticipantRoom } from './ParticipantRoom';
export default function ParticipantPage() {
  const params = useSearchParams(),
    pid = params.get('project'),
    sid = params.get('session');
  const ready = useFgdStore((s) => s.ready),
    session = useFgdStore((s) => s.data.sessions.find((x) => x.id === sid && x.projectId === pid));
  const join = useFgdStore((s) => s.joinParticipant),
    leave = useFgdStore((s) => s.leaveParticipant);
  const [identity, setIdentity] = useState<string | null>(null),
    [loaded, setLoaded] = useState(false),
    [departed, setDeparted] = useState(false);
  const key = `fgd-participant:${pid}/${sid}`;
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    setIdentity(saved);
    setLoaded(true);
    setDeparted(false);
  }, [key]);
  const person = session?.participants.find((p) => p.id === identity);
  const replaced =
    person?.connectionId &&
    typeof window !== 'undefined' &&
    person.connectionId !== sessionStorage.getItem('fgd-client:' + sid);
  useEffect(() => {
    if (!session || !identity || !person || person.removed || replaced || session.phase === 'ended')
      return;
    if (!person.online) join(session.id, identity);
    const onPageHide = () => leave(session.id, identity);
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [
    session?.id,
    session?.phase,
    identity,
    person?.online,
    person?.removed,
    replaced,
    join,
    leave,
  ]);
  if (!ready || !loaded) return <div className="loading">正在载入访谈…</div>;
  if (!session)
    return (
      <div className="empty-state">
        <h1>找不到对应场次</h1>
        <p>请使用研究人员发来的完整链接。</p>
      </div>
    );
  function joinAs(id: string) {
    if (!session) return;
    join(session.id, id);
    sessionStorage.setItem(key, id);
    setIdentity(id);
    setDeparted(false);
  }
  function leaveRoom() {
    if (session && identity) leave(session.id, identity);
    sessionStorage.removeItem(key);
    setIdentity(null);
    setDeparted(true);
  }
  if (person?.removed || replaced)
    return (
      <div className="empty-state">
        <h1>{person?.removed ? '你已离开本场访谈' : '此身份已在另一窗口加入'}</h1>
        <p>{person?.removed ? '如有疑问，请联系研究人员。' : '请返回原链接重新确认身份。'}</p>
        <button className="ui-button button-outline" onClick={leaveRoom}>
          返回入场页
        </button>
      </div>
    );
  if (identity && person && !departed)
    return <ParticipantRoom session={session} person={person} onLeave={leaveRoom} />;
  return (
    <ParticipantGate
      key={key}
      session={session}
      personalId={params.get('participant')}
      onJoin={joinAs}
    />
  );
}
