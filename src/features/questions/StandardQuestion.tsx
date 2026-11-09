'use client';
import type { Question } from '@/types/fgd';
import styles from './questions.module.css';

export function StandardQuestion({ question }: { question: Question }) {
  return (
    <div className={styles.standardQuestion} aria-label="题目选项">
      {question.options && question.type !== '矩阵题' && (
        <div className={styles.standardOptions}>
          {question.options.map((option, index) => (
            <span key={option}>
              <small>{String.fromCharCode(65 + index)}</small>
              {option}
            </span>
          ))}
        </div>
      )}
      {question.type === '量表题' && question.scale && (
        <>
          <div className={styles.standardScale}>
            {Array.from(
              { length: question.scale.max - question.scale.min + 1 },
              (_, index) => index + question.scale!.min,
            ).map((n) => (
              <span key={n} title={question.scale?.labels?.[n] || `${n}分`}>
                {n}
              </span>
            ))}
          </div>
          <div className={styles.scaleEnds}>
            <span>{question.scale.minLabel}</span>
            <span>{question.scale.maxLabel}</span>
          </div>
        </>
      )}
      {question.type === '矩阵题' && (
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
              {question.matrixRows?.map((row) => (
                <tr key={row}>
                  <th>{row}</th>
                  {question.options?.map((option) => (
                    <td key={option}>
                      <span className={styles.emptyDot} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {question.items && (
        <div className={styles.standardOptions}>
          {question.items.map((item, index) => (
            <span key={item}>
              <small>{question.type === '排序题' ? index + 1 : '%'}</small>
              {item}
            </span>
          ))}
        </div>
      )}
      {question.type === '级联选择题' && (
        <div className={styles.cascadePreview}>
          渠道类别 <span>→</span> 平台或门店 <span>→</span> 具体购买渠道
        </div>
      )}
    </div>
  );
}
