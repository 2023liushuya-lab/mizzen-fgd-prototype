import type { Session } from '@/types/fgd';
export function promptTags(session: Session) {
  const q = session.questions.find((q) => q.id === session.currentQuestionId);
  const run = q && session.runs[q.id];
  if (!q || !run) return [];
  const tags: { label: string; person?: string }[] = [];
  const people = session.participants.filter((p) => !p.removed);
  if (
    q.type !== '陈述题' &&
    people.some((p) => !run.answers[p.id] && !run.transcript.some((t) => t.participantId === p.id))
  )
    tags.push({ label: '覆盖不足' });
  for (const p of people) {
    const texts = [
      run.answers[p.id]?.comment || '',
      ...run.transcript.filter((t) => t.participantId === p.id).map((t) => t.text),
    ];
    if (texts.some((t) => /尚未说明|不确定|还行|一般|说不清/.test(t)))
      tags.push({ label: '表达含糊', person: p.name });
  }
  return tags;
}
