'use client';
import { ChevronDown, Expand, ImageIcon, Sparkles } from 'lucide-react';
import type { Answer, Participant, Question, Session } from '@/types/fgd';
import { priorText, questionFollowup, questionParticipants } from './analysis';
import { ConceptCanvas, MarkLegend } from './ConceptCanvas';
import styles from './questions.module.css';

export function ImageResults({
  session,
  question,
  onEnlarge,
  showFollowups = true,
  blind = false,
  sampleLabel,
}: {
  session: Session;
  question: Question;
  onEnlarge: (image: { title: string; image?: string; marks?: Answer['marks'] }) => void;
  showFollowups?: boolean;
  blind?: boolean;
  sampleLabel?: string;
}) {
  const answers = Object.values(session.runs[question.id]?.answers || {});
  const marks = answers.flatMap((a) => a.marks || []);
  const person = (id: string) => session.participants.find((p) => p.id === id);
  const people = questionParticipants(session, question);
  if (question.type === '标注题')
    return (
      <section className={`card ${styles.imageResults}`}>
        <div className={styles.cardHeading}>
          <h3>
            <ImageIcon size={14} />
            全员标注汇总
          </h3>
          <div className="row">
            <small className="muted">
              {answers.length} / {people.length} 已提交
            </small>
            <button
              className="icon-button"
              aria-label="放大全员标注汇总"
              onClick={() => onEnlarge({ title: '全员标注汇总', marks })}
            >
              <Expand size={16} />
            </button>
          </div>
        </div>
        <ConceptCanvas
          sampleLabel={sampleLabel}
          blind={blind}
          marks={marks}
          people={session.participants}
        />
        <MarkLegend />
        {!answers.length && (
          <p className={styles.waiting}>等待受访者提交标注，标记将叠加在此图。</p>
        )}
      </section>
    );
  return (
    <>
      <section className={`card ${styles.imageResults}`}>
        <div className={styles.cardHeading}>
          <h3>
            <ImageIcon size={14} />
            受访者上传
          </h3>
          <small className="muted">
            {answers.length} / {people.length} 已提交
          </small>
        </div>
        {!answers.length ? (
          <p className={styles.waiting}>等待受访者上传自己的图片。</p>
        ) : (
          <div className={styles.uploadGrid}>
            {answers.map((answer) => (
              <button
                className={styles.uploadCard}
                key={answer.participantId}
                disabled={!answer.image}
                onClick={() =>
                  onEnlarge({
                    title: `${person(answer.participantId)?.name || '受访者'}上传的图片`,
                    image: answer.image,
                    marks: answer.marks,
                  })
                }
              >
                {answer.image ? (
                  <ConceptCanvas
                    sampleLabel={sampleLabel}
                    blind={blind}
                    image={answer.image}
                    marks={answer.marks}
                    people={session.participants}
                  />
                ) : (
                  <div className={styles.missingImage}>
                    <ImageIcon size={20} />
                    <span>图片未附加</span>
                  </div>
                )}
                <strong>{person(answer.participantId)?.name}</strong>
                {answer.image && (
                  <span>
                    <Expand size={13} />
                    查看图片
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
      {answers.some((a) => a.image && a.marks?.length) && (
        <section className={`card ${styles.imageResults}`}>
          <div className={styles.cardHeading}>
            <h3>全部图片与标记</h3>
            <MarkLegend />
          </div>
          <div className={styles.contactSheet}>
            {answers
              .filter((a) => a.image)
              .map((answer) => (
                <div key={answer.participantId}>
                  <ConceptCanvas
                    sampleLabel={sampleLabel}
                    blind={blind}
                    image={answer.image}
                    marks={answer.marks}
                    people={session.participants}
                  />
                  <small>{person(answer.participantId)?.name}</small>
                </div>
              ))}
          </div>
        </section>
      )}
      {showFollowups && answers.length > 0 && (
        <details className={`card ${styles.imageFollowups}`} open>
          <summary>
            <Sparkles size={14} />
            追问方向
            <ChevronDown size={14} />
          </summary>
          {answers.map((answer) => {
            const p = person(answer.participantId);
            if (!p) return null;
            return (
              <div className={styles.analysisPerson} key={p.id}>
                <strong>{p.name}</strong>
                <blockquote>
                  {questionFollowup(question, answer.comment, priorText(session, question, p))}
                </blockquote>
              </div>
            );
          })}
        </details>
      )}
    </>
  );
}
