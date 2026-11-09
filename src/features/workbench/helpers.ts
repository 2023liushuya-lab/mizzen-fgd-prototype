import type { Question, Session } from '@/types/fgd';

export function questionNumber(session: Session, id: string) {
  return session.questions.findIndex((q) => q.id === id) + 1;
}

export function openedQuestions(session: Session) {
  return session.questions.filter((q) => session.runs[q.id]?.startedAt);
}

export function sectionMilliseconds(session: Session, sectionId: string, now: number) {
  return Object.values(session.runs).reduce(
    (total, run) =>
      total +
      run.segments
        .filter((segment) => segment.sectionId === sectionId)
        .reduce(
          (sum, segment) =>
            sum + Math.max(0, (segment.endedAt ?? (session.endedAt || now)) - segment.startedAt),
          0,
        ),
    0,
  );
}

export function topicDirections(session: Session, question?: Question) {
  if (!question || question.type === '陈述题') return [];
  const run = session.runs[question.id];
  if (!run || (!run.transcript.length && !Object.keys(run.answers).length)) return [];
  const comments = Object.values(run.answers)
    .map((a) => a.comment)
    .filter(Boolean);
  const hasVague = [...comments, ...run.transcript.map((t) => t.text)].some((x) =>
    /还行|挺好|一般|不错/.test(x),
  );
  const directions =
    question.type === '标注题'
      ? ['同一区域出现不同颜色时，哪些具体体验导致了不同判断？']
      : question.type === '图片上传题'
        ? ['这些图片分别对应什么使用场景？哪些细节最能说明实际体验？']
        : ['大家的判断各自基于什么具体经历？在哪些情境下会改变取舍？'];
  if (hasVague) directions.push('对“还行”等表述，请给一个具体例子，并说明判断标准。');
  return directions;
}

export function avatarColor(index: number) {
  return ['#234f7e', '#467d78', '#b38c51', '#74758f', '#6d7d9d', '#976b79'][index % 6];
}
