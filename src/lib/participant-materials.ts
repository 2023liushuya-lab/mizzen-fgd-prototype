import type { AnswerValue, Session } from '@/types/fgd';
export function blindTerms(session: Session) {
  return [
    ...new Set(
      (session.blindLabels ?? session.questions.flatMap((q) => q.matrixRows || []))
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}
function pairs(session: Session) {
  return blindTerms(session).map(
    (name, i) => [name, `样品 ${String.fromCharCode(65 + i)}`] as const,
  );
}
export function participantMaterialText(session: Session, text: string) {
  if (session.testMode !== 'blind') return text;
  return pairs(session)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((s, [name, label]) => s.split(name).join(label), text);
}
function mapStrings<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === 'string') return transform(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, transform)) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, mapStrings(v, transform)]),
    ) as T;
  return value;
}
export function participantMaterials(session: Session): Session {
  if (session.testMode !== 'blind') return session;
  const mask = (text: string) => participantMaterialText(session, text);
  return {
    ...session,
    blindLabels: blindTerms(session),
    title: mask(session.title),
    questions: session.questions.map((q) => mapStrings(q, mask)),
    runs: Object.fromEntries(
      Object.entries(session.runs).map(([id, run]) => [
        id,
        {
          ...run,
          answers: Object.fromEntries(
            Object.entries(run.answers).map(([pid, a]) => [
              pid,
              { ...a, value: mapStrings(a.value, mask), comment: mask(a.comment) },
            ]),
          ),
          transcript: run.transcript.map((t) => ({ ...t, text: mask(t.text) })),
        },
      ]),
    ),
  };
}
export function restoreParticipantValue(session: Session, value: AnswerValue): AnswerValue {
  return session.testMode === 'blind'
    ? mapStrings(value, (text) => pairs(session).find(([, label]) => label === text)?.[0] || text)
    : value;
}
