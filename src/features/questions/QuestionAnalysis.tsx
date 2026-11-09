'use client';
import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { Answer, Participant, Question, Session } from '@/types/fgd';
import {
  currentText,
  priorText,
  questionFollowup,
  questionParticipants,
  wholeQuestionSummary,
} from './analysis';
import { PersonName } from './PersonName';
import styles from './questions.module.css';

export function QuestionAnalysis({
  session,
  question,
  onPerson,
}: {
  session: Session;
  question: Question;
  onPerson: (person: Participant) => void;
}) {
  const [tab, setTab] = useState<'people' | 'whole'>('people');
  const people = questionParticipants(session, question);
  const run = session.runs[question.id];
  const hasEvidence = Object.keys(run?.answers || {}).length > 0 || Boolean(run?.transcript.length);
  return (
    <div className={styles.analysisWrap}>
      <div className={styles.answerTabs} role="tablist" aria-label="回答总结视图">
        <button role="tab" aria-selected={tab === 'people'} onClick={() => setTab('people')}>
          按人回答
        </button>
        <button role="tab" aria-selected={tab === 'whole'} onClick={() => setTab('whole')}>
          整体回答
        </button>
      </div>
      <details className={`card ${styles.analysis}`} open>
        <summary>
          <Sparkles size={14} />
          {tab === 'people' ? '按人回答' : '整体回答'}
          <ChevronDown size={14} />
        </summary>
        {!hasEvidence ? (
          <p className={styles.waiting}>等待本题回答或发言，收到后展示总结与追问方向。</p>
        ) : tab === 'people' ? (
          <div role="tabpanel">
            {people.map((person) => {
              const current = currentText(session, question, person.id);
              const prior = priorText(session, question, person);
              const answer = run?.answers[person.id];
              return (
                <div className={styles.analysisPerson} key={person.id}>
                  <PersonName person={person} onOpen={onPerson} />
                  <div className={styles.analysisText}>
                    {prior && <span className={styles.prior}>{prior}</span>}
                    {current ? (
                      <span className={styles.current}>{current}</span>
                    ) : (
                      <span className="muted">
                        {answer ? '已提交选择，尚未补充文字说明。' : '暂无本题回答或发言。'}
                      </span>
                    )}
                    {(current || answer) && (
                      <blockquote>{questionFollowup(question, current, prior)}</blockquote>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div role="tabpanel" className={styles.wholeAnalysis}>
            <span className={styles.current}>{wholeQuestionSummary(session, question)}</span>
            <blockquote>
              {question.type === '标注题'
                ? '同一个位置为什么会出现不同感受？请分别结合标记和实际经历说明。'
                : '大家的判断在哪些条件下会改变？有哪些不同的考虑还没有展开？'}
            </blockquote>
          </div>
        )}
      </details>
    </div>
  );
}
