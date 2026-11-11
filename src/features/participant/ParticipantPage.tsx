'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { ParticipantGate } from './ParticipantGate';
import { voiceScript } from '@/lib/mjd-access';
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
  if (
    identity &&
    person &&
    !departed &&
    session.delivery === 'offline' &&
    (!person.voiceEnabled || session.voiceRecording?.participantId === person.id)
  ) {
    const recording =
      session.voiceRecording?.participantId === person.id ? session.voiceRecording : null;
    return (
      <main className="empty-state">
        <span className="badge">声纹录制</span>
        <h1>
          {recording?.stage === 'recording'
            ? '正在录制，请自然朗读'
            : recording?.stage === 'ready'
              ? '录制完成，等待主持人确认'
              : '请等待主持人开始录制'}
        </h1>
        <p>{person.name}</p>
        <blockquote
          style={{
            maxWidth: 620,
            margin: '24px auto',
            padding: 28,
            background: '#fffefa',
            borderRadius: 12,
            fontSize: 24,
            lineHeight: 1.8,
          }}
        >
          {voiceScript(person.name)}
        </blockquote>
        <p role="status">
          {recording?.stage === 'recording'
            ? `录制中 · ${recording.seconds} 秒`
            : '录制由主持人操作，请保持安静并按正常音量朗读。'}
        </p>
        <small className="muted">原型演示</small>
      </main>
    );
  }
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
