'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { participantMaterials } from '@/lib/participant-materials';
import { StandardQuestion } from '@/features/questions/StandardQuestion';
import { AnswerResults } from '@/features/questions';
function Screen() {
  const params = useSearchParams();
  const session = useFgdStore((s) =>
    s.data.sessions.find(
      (x) => x.id === params.get('session') && x.projectId === params.get('project'),
    ),
  );
  if (!session) return <main className="empty-state">等待主持人投放题目</main>;
  const material = participantMaterials(session);
  const question = material.questions.find((q) => q.id === session.screenQuestionId);
  return (
    <main style={{ maxWidth: 1300, padding: 48, margin: '0 auto' }}>
      <small className="muted">{session.title} · 大屏</small>
      {question ? (
        <>
          <h1 style={{ fontSize: 32, lineHeight: 1.6 }}>{question.title}</h1>
          <StandardQuestion question={question} />
          {session.runs[question.id] && <AnswerResults session={material} question={question} />}
        </>
      ) : (
        <h1>等待主持人投放题目</h1>
      )}
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Screen />
    </Suspense>
  );
}
