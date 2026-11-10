'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { Button } from '@/components/ui/button';
import { sessionLink } from '@/lib/utils';
const scenarios = [
  { name: '全部未开始', question: null, delivery: 'online' },
  { name: '单选题 · 部分作答', question: 1, delivery: 'online' },
  { name: '标注题 · 全员提交', question: 5, delivery: 'online' },
  { name: '图片上传前', question: 10, delivery: 'online' },
  { name: '线下旁听 · 讨论中', question: 2, delivery: 'offline' },
  { name: '结束后的只读复盘', question: 3, delivery: 'online' },
] as const;
export default function Scenarios() {
  const router = useRouter(),
    ready = useFgdStore((s) => s.ready),
    [busy, setBusy] = useState(false);
  function open(index: number) {
    setBusy(true);
    const api = useFgdStore.getState(),
      p = api.data.projects[0],
      preset = scenarios[index],
      id = api.createSession(p.id);
    let s = useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
    api.updateSession(id, {
      title: `演示 · ${preset.name}`,
      delivery: preset.delivery,
      hostVoiceEnabled: true,
      participants: s.participants.map((p) => ({
        ...p,
        voiceEnabled: true,
        online: preset.question !== null,
      })),
    });
    if (preset.question !== null) {
      api.startSession(id);
      for (let q = 0; q <= preset.question; q++) {
        api.startQuestion(id, s.questions[q].id);
        if (q !== 10) api.fillDemoAnswers(id, s.questions[q].id);
      }
      api.sendNote(
        id,
        { id: 'observer-default', name: '旁听席' },
        '追问一下林女士：换季停用面霜是因为泛红刺痛，还是单纯觉得闷痘？',
        null,
      );
      if (index === 5) api.endSession(id);
    }
    s = useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
    router.push(sessionLink(index === 4 || index === 5 ? 'observer' : 'host', s));
  }
  return (
    <main style={{ maxWidth: 1000, margin: '48px auto', padding: 24 }}>
      <div className="page-header">
        <div>
          <Link href="/" className="muted small">
            ← 返回 Mizzen
          </Link>
          <h1 style={{ marginTop: 18 }}>迭代场景</h1>
          <p className="muted">每次新建一场独立的演示，不覆盖已有场次。数据明确来自本地示例。</p>
        </div>
        <span className="badge">开发工具</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        {scenarios.map((s, i) => (
          <section className="card stack" key={s.name}>
            <span className="muted small">{s.delivery === 'online' ? '线上' : '线下'}</span>
            <h2>{s.name}</h2>
            <Button variant="outline" disabled={!ready || busy} onClick={() => open(i)}>
              打开场景
            </Button>
          </section>
        ))}
        {(['offline', 'online'] as const).map((delivery) => (
          <section className="card stack" key={`review-${delivery}`}>
            <span className="muted small">{delivery === 'offline' ? '线下' : '线上'} · 进行中</span>
            <h2>全题作答与总结</h2>
            <p className="muted small">10题已讨论，可查看各题型的按人回答与整体回答。</p>
            <Button asChild variant="outline">
              <Link href={`/review-demo?delivery=${delivery}&role=observer`}>打开旁听演示</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/review-demo?delivery=${delivery}&role=host`}>打开主持演示</Link>
            </Button>
          </section>
        ))}
      </div>
    </main>
  );
}
