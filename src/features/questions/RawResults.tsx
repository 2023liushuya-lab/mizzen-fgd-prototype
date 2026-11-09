'use client';
import { Sparkles } from 'lucide-react';
import type { Answer, Participant, Question, Session } from '@/types/fgd';
import { answerLabel, questionParticipants } from './analysis';
import { PersonName } from './PersonName';
import styles from './questions.module.css';

export function RawResults({
  session,
  question,
  answers,
  onPerson,
}: {
  session: Session;
  question: Question;
  answers: Answer[];
  onPerson: (person: Participant) => void;
}) {
  const people = questionParticipants(session, question);
  const byId = (id: string) => people.find((p) => p.id === id);
  const hasOption = (answer: Answer, index: number) =>
    question.type === '多选题'
      ? Array.isArray(answer.value) && answer.value.includes(index as never)
      : Number(answer.value) === index;
  return (
    <section className={`card ${styles.results}`}>
      <div className={styles.cardHeading}>
        <h3>
          <Sparkles size={14} />
          原始作答结果
        </h3>
        <span className="muted">
          {answers.length} / {people.length} 已提交
        </span>
      </div>
      {!answers.length ? (
        <p className={styles.waiting}>等待受访者作答。</p>
      ) : (
        <>
          {['单选题', '多选题'].includes(question.type) && (
            <div className={styles.optionResults}>
              {question.options?.map((option, i) => {
                const selected = answers.filter((a) => hasOption(a, i));
                return (
                  <div key={option}>
                    <div className={styles.optionResultTop}>
                      <strong>{option}</strong>
                      <span>{selected.length} 人</span>
                    </div>
                    <div className={styles.resultTrack}>
                      <span
                        style={{
                          width: `${(selected.length / Math.max(1, answers.length)) * 100}%`,
                        }}
                      />
                    </div>
                    <small>
                      {selected
                        .map((a) => byId(a.participantId)?.name)
                        .filter(Boolean)
                        .join('、') || '暂无选择'}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
          {question.type === '量表题' && (
            <div className={styles.scaleResult}>
              <strong>
                平均分{' '}
                <em>
                  {(answers.reduce((n, a) => n + Number(a.value), 0) / answers.length).toFixed(1)}
                </em>
                <span> / {question.scale?.max}</span>
              </strong>
              <small>{answers.length} 位有效提交</small>
            </div>
          )}
          {question.type === '矩阵题' ? (
            <div className={styles.tableScroll}>
              <table className={styles.matrix}>
                <thead>
                  <tr>
                    <th>概念</th>
                    {question.options?.map((option) => (
                      <th key={option}>{option}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {question.matrixRows?.map((row, rowIndex) => (
                    <tr key={row}>
                      <th>{row}</th>
                      {question.options?.map((option, optionIndex) => {
                        const selected = answers.filter(
                          (a) =>
                            Array.isArray(a.value) && Number(a.value[rowIndex]) === optionIndex,
                        );
                        return (
                          <td key={option}>
                            <strong>{selected.length} 票</strong>
                            <small>
                              {selected
                                .map((a) => byId(a.participantId)?.name)
                                .filter(Boolean)
                                .join('、') || '—'}
                            </small>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.rawPeople}>
              {people.map((person) => {
                const answer = answers.find((a) => a.participantId === person.id);
                return (
                  <div key={person.id} className={styles.rawPerson}>
                    <PersonName person={person} onOpen={onPerson} />
                    <div>
                      {answer ? (
                        <>
                          <p>{answerLabel(question, answer)}</p>
                          {answer.comment && answer.comment !== String(answer.value) && (
                            <small>{answer.comment}</small>
                          )}
                        </>
                      ) : (
                        <span className="muted">未提交</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
