'use client';
import { useRef } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import type { AnswerValue, Question } from '@/types/fgd';
import styles from './questions.module.css';

const channels: Record<string, Record<string, string[]>> = {
  线上: { 综合电商: ['品牌旗舰店', '其他店铺'], 品牌官方: ['小程序', '官网'] },
  线下: { 商场: ['品牌专柜', '集合店'], 独立门店: ['品牌专卖店', '美妆店'] },
};

export function StructuredFields({
  question,
  value,
  onChange,
  active,
  cascade,
  onCascadeChange,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  active: boolean;
  cascade: string[];
  onCascadeChange: (value: string[]) => void;
}) {
  const values = Array.isArray(value) ? value : [];
  const items = question.items || [];
  const sum =
    question.type === '比重题' ? values.reduce<number>((total, v) => total + Number(v), 0) : 0;
  const dragIndex = useRef<number | null>(null);
  function moveRank(from: number, to: number) {
    if (to < 0 || to >= values.length) return;
    const next = [...values] as string[];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }
  return (
    <>
      {['单选题', '多选题'].includes(question.type) && (
        <div className={styles.choiceOptions}>
          {question.options?.map((option, i) => (
            <label key={option} className={styles.choiceOption}>
              <input
                type={question.type === '单选题' ? 'radio' : 'checkbox'}
                name={`answer-${question.id}`}
                checked={question.type === '单选题' ? value === i : values.includes(i as never)}
                onChange={() =>
                  onChange(
                    question.type === '单选题'
                      ? i
                      : values.includes(i as never)
                        ? (values.filter((v) => v !== i) as number[])
                        : ([...values, i] as number[]),
                  )
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
      {question.type === '量表题' && (
        <div className={styles.scaleOptions}>
          {Array.from(
            { length: (question.scale?.max ?? 5) - (question.scale?.min ?? 0) + 1 },
            (_, i) => i + (question.scale?.min ?? 0),
          ).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value === n}
              onClick={() => onChange(n)}
              className={value === n ? styles.scaleSelected : ''}
            >
              <strong>{n}</strong>
              <span>
                {question.scale?.labels?.[n] ||
                  (n === question.scale?.min
                    ? question.scale.minLabel
                    : n === question.scale?.max
                      ? question.scale.maxLabel
                      : `${n}分`)}
              </span>
            </button>
          ))}
        </div>
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
              {question.matrixRows?.map((row, rowIndex) => (
                <tr key={row}>
                  <th>{row}</th>
                  {question.options?.map((option, optionIndex) => (
                    <td key={option}>
                      <input
                        aria-label={`${row}：${option}`}
                        type="radio"
                        name={`matrix-${question.id}-${rowIndex}`}
                        checked={values[rowIndex] === optionIndex}
                        onChange={() => {
                          const next = [...values] as number[];
                          next[rowIndex] = optionIndex;
                          onChange(next);
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {question.type === '排序题' && (
        <ol className={styles.rankList}>
          {values.map((item, index) => (
            <li
              key={String(item)}
              draggable={active}
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex.current !== null) moveRank(dragIndex.current, index);
                dragIndex.current = null;
              }}
            >
              <GripVertical size={15} />
              <span className={styles.rankNumber}>{index + 1}</span>
              <strong>{item}</strong>
              <button
                type="button"
                aria-label={`${item}上移`}
                disabled={index === 0}
                onClick={() => moveRank(index, index - 1)}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label={`${item}下移`}
                disabled={index === values.length - 1}
                onClick={() => moveRank(index, index + 1)}
              >
                <ArrowDown size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}
      {question.type === '级联选择题' && (
        <div className={styles.cascade}>
          <select
            aria-label="渠道类别"
            value={cascade[0]}
            onChange={(e) => {
              onCascadeChange([e.target.value, '', '']);
            }}
          >
            <option value="">选择类别</option>
            {Object.keys(channels).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="渠道平台"
            value={cascade[1]}
            disabled={!cascade[0]}
            onChange={(e) => {
              onCascadeChange([cascade[0], e.target.value, '']);
            }}
          >
            <option value="">选择平台</option>
            {Object.keys(channels[cascade[0]] || {}).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="渠道详情"
            value={cascade[2]}
            disabled={!cascade[1]}
            onChange={(e) => {
              onCascadeChange([cascade[0], cascade[1], e.target.value]);
            }}
          >
            <option value="">选择详情</option>
            {(channels[cascade[0]]?.[cascade[1]] || []).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      )}
      {question.type === '比重题' && (
        <div className={styles.weightFields}>
          {items.map((item, index) => (
            <label key={item}>
              <span>{item}</span>
              <input
                type="number"
                min={0}
                max={100}
                aria-label={`${item}比重`}
                value={Number(values[index] ?? 0)}
                onChange={(e) => {
                  const next = [...values] as number[];
                  next[index] = Math.max(0, Math.min(100, Number(e.target.value)));
                  onChange(next);
                }}
              />
              <span>%</span>
            </label>
          ))}
          <p className={sum === 100 ? styles.submitted : styles.weightTotal}>合计 {sum}% / 100%</p>
        </div>
      )}
    </>
  );
}
