'use client';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { Session } from '@/types/fgd';
import { useFgdStore } from '@/stores/fgd-store';
import { formatTime } from '@/lib/utils';
import { questionNumber, sectionMilliseconds } from './helpers';
import styles from './OutlinePanel.module.css';

export function OutlinePanel({
  session,
  selectedId,
  onSelect,
  folded,
  onFold,
  readonly,
  now,
}: {
  session: Session;
  selectedId: string | null;
  onSelect: (id: string) => void;
  folded: boolean;
  onFold: () => void;
  readonly: boolean;
  now: number;
}) {
  const move = useFgdStore((s) => s.moveQuestion);
  const questions = session.questions;
  function drop(event: React.DragEvent, sectionId: string, beforeId?: string) {
    event.preventDefault();
    event.stopPropagation();
    const id = event.dataTransfer.getData('application/x-fgd-question');
    if (id && !readonly && session.phase !== 'ended') move(session.id, id, sectionId, beforeId);
  }
  return (
    <aside className={`${styles.outline} ${folded ? styles.outlineFolded : ''}`}>
      <div className={styles.outlineHeader}>
        {!folded && (
          <strong>
            讨论大纲{' '}
            <small>
              {questions.filter((q) => session.runs[q.id]).length}/{session.questions.length}
            </small>
          </strong>
        )}
        <button
          className="icon-button"
          onClick={onFold}
          aria-label={folded ? '展开讨论大纲' : '收起讨论大纲'}
        >
          {folded ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
      <nav className={styles.outlineScroll} aria-label="题目导航">
        {!questions.length && <p className={styles.emptyOutline}>题目开始后在此显示</p>}
        {session.sections.map((section) => {
          const items = questions.filter((q) => q.sectionId === section.id);
          if (readonly && !items.length) return null;
          return (
            <section
              key={section.id}
              className={styles.outlineSection}
              onDragOver={(e) => !readonly && e.preventDefault()}
              onDrop={(e) => drop(e, section.id)}
            >
              {!folded && (
                <div className={styles.chapterLabel}>
                  <span>
                    {section.name}
                    <small>（{formatTime(sectionMilliseconds(session, section.id, now))}）</small>
                  </span>
                  <small>计划 {section.minutes}分</small>
                </div>
              )}
              {items.map((q) => {
                const run = session.runs[q.id];
                const live = session.currentQuestionId === q.id && session.phase === 'live';
                return (
                  <div
                    key={q.id}
                    className={`${styles.questionNav} ${selectedId === q.id ? styles.selectedQuestion : ''}`}
                    draggable={!readonly && session.phase !== 'ended'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-fgd-question', q.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => !readonly && e.preventDefault()}
                    onDrop={(e) => drop(e, section.id, q.id)}
                  >
                    <button
                      onClick={() => onSelect(q.id)}
                      title={`Q${questionNumber(session, q.id)} ${q.title}`}
                      aria-current={selectedId === q.id ? 'true' : undefined}
                    >
                      <span className={styles.questionMeta}>
                        <span>Q{String(questionNumber(session, q.id)).padStart(2, '0')}</span>
                        {!folded && (
                          <>
                            <span className={styles.type}>{q.type}</span>
                            <span className={live ? styles.running : ''}>
                              {live ? '● 进行中' : run ? '已讨论' : '未开始'}
                            </span>
                          </>
                        )}
                      </span>
                      {!folded && <span className={styles.questionNavTitle}>{q.title}</span>}
                    </button>
                    {!readonly && !folded && session.phase !== 'ended' && (
                      <GripVertical className={styles.dragHandle} size={13} aria-hidden />
                    )}
                  </div>
                );
              })}
              {!readonly && !items.length && !folded && (
                <div className={styles.emptyChapter}>拖动题目至此</div>
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
