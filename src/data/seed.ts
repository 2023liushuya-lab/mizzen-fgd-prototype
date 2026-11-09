import type { FgdData, Participant, Session } from '@/types/fgd';
import { questions, sections } from './questions';
export const participantColors = ['#234f7e', '#467d78', '#b38c51', '#74758f', '#6d7d9d', '#976b79'];
export function demoParticipants(): Participant[] {
  return [
    { id: 'p-1', name: '林女士', age: '25–30岁', skin: '干敏肌', notes: '换季时偏好清爽保湿' },
    {
      id: 'p-2',
      name: '周女士',
      age: '25–30岁',
      skin: '混合偏油',
      notes: '日常使用面霜，关注妆前贴合',
    },
    { id: 'p-3', name: '陈女士', age: '30–35岁', skin: '中性肌', notes: '关注护肤预算与耐用度' },
    { id: 'p-4', name: '赵女士', age: '25–30岁', skin: '敏感肌', notes: '重视温和与长期使用体验' },
  ].map((p, i) => ({
    ...p,
    color: participantColors[i],
    voiceEnabled: false,
    online: false,
    mic: false,
    camera: false,
  }));
}
const createdAt = new Date('2026-11-09T09:00:00+08:00').getTime();
function sampleSession(delivery: 'online' | 'offline'): Session {
  return {
    id: `session-${delivery}-1`,
    projectId: 'project-1',
    title: `${delivery === 'online' ? '线上' : '线下'} · 护肤产品体验讨论`,
    delivery,
    roomCode: delivery === 'online' ? '944803' : '944804',
    observerToken: `demo-${delivery}-observer-20261109`,
    phase: 'pending',
    participants: demoParticipants(),
    seatOrder: demoParticipants().map((p) => p.id),
    questions: structuredClone(questions),
    sections: structuredClone(sections),
    currentQuestionId: null,
    runs: {},
    notes: [],
    chats: [],
    mediaRequests: [],
    projection: null,
  };
}
export function createSeedData(): FgdData {
  return {
    schemaVersion: 1,
    projects: [
      {
        id: 'project-1',
        title: '护肤产品概念测试',
        objective: '了解消费者的真实护肤场景、产品偏好与使用体验。',
        published: true,
        questions: structuredClone(questions),
        sections: structuredClone(sections),
        createdAt,
      },
    ],
    sessions: [sampleSession('online'), sampleSession('offline')],
  };
}
