'use client';
import type { Question, Section } from '@/types/fgd';
import styles from './entry.module.css';
export default function QuestionFields({
  question,
  sections,
  onChange,
}: {
  question: Question;
  sections: Section[];
  onChange: (patch: Partial<Question>) => void;
}) {
  return (
    <>
      <label className={styles.editorLabel}>题目</label>
      <textarea
        className={styles.questionTitleInput}
        aria-label="题目内容"
        value={question.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <div className={styles.editorField}>
        <label htmlFor="q-guide">访谈指引</label>
        <textarea
          id="q-guide"
          value={question.guide}
          placeholder="补充主持人需要关注的内容、澄清点和讨论线索…"
          onChange={(e) => onChange({ guide: e.target.value })}
        />
      </div>
      <div className={styles.editorGrid}>
        <div className={styles.editorField}>
          <label>所属环节</label>
          <select
            aria-label="所属环节"
            value={question.sectionId}
            onChange={(e) => onChange({ sectionId: e.target.value })}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.editorField}>
          <label>计划讨论用时（分钟）</label>
          <input
            aria-label="计划讨论用时"
            type="number"
            min="1"
            value={question.plannedMinutes}
            onChange={(e) =>
              onChange({
                plannedMinutes: Math.max(1, Number(e.target.value)),
              })
            }
          />
        </div>
      </div>
      {['单选题', '多选题', '矩阵题', '级联选择题'].includes(question.type) && (
        <div className={styles.editorField}>
          <label>选项（每行一项）</label>
          <textarea
            aria-label="题目选项"
            value={(question.options || []).join('\n')}
            onChange={(e) => onChange({ options: e.target.value.split('\n') })}
          />
        </div>
      )}
      {['排序题', '比重题'].includes(question.type) && (
        <div className={styles.editorField}>
          <label>比较项目（每行一项）</label>
          <textarea
            aria-label="比较项目"
            value={(question.items || []).join('\n')}
            onChange={(e) => onChange({ items: e.target.value.split('\n') })}
          />
        </div>
      )}
      {question.type === '矩阵题' && (
        <div className={styles.editorField}>
          <label>矩阵行（每行一项）</label>
          <textarea
            aria-label="矩阵行"
            value={(question.matrixRows || []).join('\n')}
            onChange={(e) => onChange({ matrixRows: e.target.value.split('\n') })}
          />
        </div>
      )}
      {question.type === '量表题' && <ScaleEditor question={question} onChange={onChange} />}
      {question.type === '标注题' && (
        <div className={styles.annotationHint}>
          <span style={{ color: '#488bc9' }}>● 喜欢</span>
          <span style={{ color: '#c77f72' }}>● 不喜欢</span>
          <span style={{ color: '#a88b41' }}>● 困惑</span>
          <small>统一底图，所有受访者在同一材料上分别标注。</small>
        </div>
      )}
      {question.type === '图片上传题' && (
        <p className="muted">每人上传自己的图片，与统一底图标注题分开。</p>
      )}
    </>
  );
}

function ScaleEditor({
  question,
  onChange,
}: {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  const scale = question.scale || {
    min: 1,
    max: 5,
    minLabel: '',
    maxLabel: '',
  };
  const values = Array.from(
    { length: Math.min(11, Math.max(1, scale.max - scale.min + 1)) },
    (_, i) => scale.min + i,
  );
  return (
    <div className={styles.scaleEditor}>
      <div className={styles.editorGrid}>
        <div className={styles.editorField}>
          <label>最低分</label>
          <input
            aria-label="量表最低分"
            type="number"
            min="0"
            max={scale.max - 1}
            value={scale.min}
            onChange={(e) =>
              onChange({
                scale: {
                  ...scale,
                  min: Math.max(0, Math.min(scale.max - 1, Math.floor(Number(e.target.value)))),
                },
              })
            }
          />
        </div>
        <div className={styles.editorField}>
          <label>最高分</label>
          <input
            aria-label="量表最高分"
            type="number"
            min={scale.min + 1}
            max={scale.min + 10}
            value={scale.max}
            onChange={(e) =>
              onChange({
                scale: {
                  ...scale,
                  max: Math.min(
                    scale.min + 10,
                    Math.max(scale.min + 1, Math.floor(Number(e.target.value))),
                  ),
                },
              })
            }
          />
        </div>
      </div>
      <label className={styles.editorLabel}>逐分描述</label>
      <div className={styles.scoreLabels}>
        {values.map((value) => (
          <label key={value}>
            <b>{value}</b>
            <input
              aria-label={`${value}分描述`}
              placeholder="填写描述"
              value={
                scale.labels?.[String(value)] ??
                (value === scale.min ? scale.minLabel : value === scale.max ? scale.maxLabel : '')
              }
              onChange={(e) =>
                onChange({
                  scale: {
                    ...scale,
                    ...(value === scale.min ? { minLabel: e.target.value } : {}),
                    ...(value === scale.max ? { maxLabel: e.target.value } : {}),
                    labels: {
                      ...scale.labels,
                      [String(value)]: e.target.value,
                    },
                  },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
