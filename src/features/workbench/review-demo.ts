import { useFgdStore } from '@/stores/fgd-store';
import { questions, sections } from '@/data/questions';
import type { Delivery } from '@/types/fgd';

export function createReviewDemo(delivery: Delivery) {
  const api = useFgdStore.getState();
  const project = api.data.projects[0];
  const id = api.createSession(project.id);
  let session = useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
  api.updateSession(id, {
    title: `演示 · ${delivery === 'offline' ? '线下' : '线上'} · 全题作答与总结`,
    delivery,
    hostVoiceEnabled: true,
    questions: structuredClone(questions),
    sections: structuredClone(sections),
    participants: session.participants.map((p) => ({ ...p, voiceEnabled: true, online: true })),
  });
  api.startSession(id);
  for (const q of questions) {
    api.startQuestion(id, q.id);
    if (q.type === '陈述题') continue;
    api.fillDemoAnswers(id, q.id);
    if (q.type === '图片上传题') {
      session = useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
      session.participants.forEach((p, i) => {
        const answer = session.runs[q.id].answers[p.id];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${['#e6ece8', '#f3ead9', '#e7eaf0', '#ede7ef'][i % 4]}"/><rect x="220" y="90" width="160" height="200" rx="22" fill="white"/><rect x="212" y="70" width="176" height="50" rx="12" fill="${p.color}"/><text x="300" y="200" text-anchor="middle" fill="${p.color}" font-size="24">样品 ${i + 1}</text><text x="300" y="350" text-anchor="middle" fill="#52606d" font-size="18">${p.name} · 示例上传图片</text></svg>`;
        api.submitAnswer(id, q.id, {
          ...answer,
          image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        });
      });
    }
  }
  // Revisit the weighting question while the other ten questions remain completed.
  api.startQuestion(id, 'q-10');
  session = useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
  const now = Date.now();
  const runs = structuredClone(session.runs);
  questions.forEach((q, i) => {
    const run = runs[q.id];
    const at = now - (questions.length - i) * 4 * 60_000;
    run.startedAt = at;
    run.endedAt = q.id === 'q-10' ? undefined : at + 4 * 60_000;
    run.segments = [{ sectionId: q.sectionId, startedAt: at, endedAt: at + 4 * 60_000 }];
    if (q.id === 'q-10') run.segments.push({ sectionId: q.sectionId, startedAt: now - 90_000 });
    run.transcript.forEach((t, n) => {
      t.createdAt = at + n * 30_000;
    });
    Object.values(run.answers).forEach((a) => {
      a.submittedAt = at + 60_000;
    });
  });
  api.updateSession(id, {
    runs,
    startedAt: now - 46 * 60_000,
    notes: [
      {
        id: `${id}-note-1`,
        observerId: 'observer-default',
        observerName: '旁听席',
        text: '周女士给功效和肤感相同权重，可以追问预算不变时会先放弃哪一个。',
        questionId: 'q-10',
        questionTitle: questions[9].title,
        createdAt: now - 180_000,
        status: 'pending',
        attempts: 1,
      },
      {
        id: `${id}-note-2`,
        observerId: 'observer-default',
        observerName: '旁听席',
        text: '陈女士此前提到预算有限，可以结合她上传的日常产品，了解可接受的单次使用成本。',
        questionId: 'q-11',
        questionTitle: questions[10].title,
        createdAt: now - 90_000,
        status: 'pending',
        attempts: 1,
      },
    ],
  });
  return useFgdStore.getState().data.sessions.find((s) => s.id === id)!;
}
