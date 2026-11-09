'use client';
import { ChevronRight } from 'lucide-react';
import type { Session } from '@/types/fgd';
import { Modal } from '@/components/ui/modal';
import { openedQuestions, questionNumber } from './helpers';
import styles from './WorkbenchPage.module.css';

export function SessionDialogs({
  session,
  endOpen,
  onEndOpenChange,
  onEnd,
  projectionOpen,
  onProjectionOpenChange,
  onProjection,
}: {
  session: Session;
  endOpen: boolean;
  onEndOpenChange: (open: boolean) => void;
  onEnd: () => void;
  projectionOpen: boolean;
  onProjectionOpenChange: (open: boolean) => void;
  onProjection: (id: string | null) => void;
}) {
  const priorQuestions = openedQuestions(session).filter(
    (question) => question.id !== session.currentQuestionId,
  );
  return (
    <>
      <Modal open={endOpen} onOpenChange={onEndOpenChange} title="结束本场访谈？">
        <p>保存已发生的题目、字幕和分析。受访者将结束作答，旁听室转为只读复盘。</p>
        <div className={styles.modalFooter}>
          <button className="ui-button button-outline" onClick={() => onEndOpenChange(false)}>
            取消
          </button>
          <button
            className="ui-button button-danger"
            onClick={() => {
              onEnd();
              onEndOpenChange(false);
            }}
          >
            结束并回看
          </button>
        </div>
      </Modal>
      <Modal open={projectionOpen} onOpenChange={onProjectionOpenChange} title="投放前题答案">
        <p className="muted">选择前题后，受访者端展示该题全员汇总与当前题结果。</p>
        <div className={styles.projectionList}>
          {priorQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => {
                onProjection(question.id);
                onProjectionOpenChange(false);
              }}
            >
              <span>Q{questionNumber(session, question.id)}</span>
              {question.title}
              <ChevronRight size={16} />
            </button>
          ))}
          {priorQuestions.length === 0 && <p className={styles.noteEmpty}>尚无已讨论的前题答案</p>}
        </div>
        {session.projection && (
          <button
            className="ui-button button-outline"
            onClick={() => {
              onProjection(null);
              onProjectionOpenChange(false);
            }}
          >
            结束投放
          </button>
        )}
      </Modal>
    </>
  );
}
