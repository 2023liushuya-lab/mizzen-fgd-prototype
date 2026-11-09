'use client';
import { useRouter } from 'next/navigation';
import { useState, type DragEvent } from 'react';
import { ArrowRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useFgdStore } from '@/stores/fgd-store';
import { uid } from '@/lib/utils';
import type { Project, Question, QuestionType } from '@/types/fgd';
import { EntryHeader, Empty, Notice, projectUrl, questionTypes } from './shared';
import styles from './entry.module.css';
import QuestionFields from './QuestionFields';
export default function OutlineEditor({ project }: { project: Project }) {
  const router = useRouter();
  const update = useFgdStore((s) => s.updateProject);
  const [activeId, setActiveId] = useState(project.questions[0]?.id || '');
  const [message, setMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState(false);
  const [newType, setNewType] = useState<QuestionType>('访谈题');
  const [newTitle, setNewTitle] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(project.sections[0]?.id || '');
  const question = project.questions.find((q) => q.id === activeId);
  function patch(p: Partial<Project>) {
    update(project.id, { ...p, published: false });
  }
  function updateQuestion(changes: Partial<Question>) {
    if (!question) return;
    patch({
      questions: project.questions.map((q) => (q.id === question.id ? { ...q, ...changes } : q)),
    });
  }
  function drop(e: DragEvent, sectionId: string, beforeId?: string) {
    e.preventDefault();
    e.stopPropagation();
    const id = dragId || e.dataTransfer.getData('text/fgd-question');
    if (!id || id === beforeId) return;
    const q = project.questions.find((q) => q.id === id);
    if (!q) return;
    const rest = project.questions.filter((q) => q.id !== id);
    const index = beforeId
      ? rest.findIndex((q) => q.id === beforeId)
      : rest.reduce((n, item, i) => (item.sectionId === sectionId ? i + 1 : n), -1);
    const at = index >= 0 ? index : rest.length;
    rest.splice(at, 0, { ...q, sectionId });
    patch({ questions: rest });
    setDragId(null);
  }
  function addQuestion() {
    if (!newTitle.trim()) return;
    const id = uid('q');
    const q: Question = {
      id,
      type: newType,
      title: newTitle.trim(),
      sectionId: activeSection || project.sections[0]?.id || '',
      guide: '',
      plannedMinutes: 5,
      sampleSummaries: [],
      summary: '',
    };
    if (['单选题', '多选题', '矩阵题', '级联选择题'].includes(newType))
      q.options = ['选项一', '选项二', '选项三'];
    if (newType === '量表题')
      q.scale = {
        min: 1,
        max: 5,
        minLabel: '非常不喜欢',
        maxLabel: '非常喜欢',
      };
    if (['排序题', '比重题'].includes(newType)) q.items = ['项目一', '项目二', '项目三'];
    if (newType === '矩阵题') q.matrixRows = ['产品一', '产品二'];
    patch({ questions: [...project.questions, q] });
    setActiveId(id);
    setNewQuestion(false);
    setNewTitle('');
  }
  function publish() {
    if (
      !project.title.trim() ||
      !project.sections.length ||
      !project.questions.length ||
      project.questions.some((q) => !q.title.trim()) ||
      project.sections.some((s) => !(s.minutes > 0))
    ) {
      setMessage('请补全研究名称、题目和各环节预计用时。');
      return;
    }
    update(project.id, { published: true });
    router.push(projectUrl(project.id));
  }
  return (
    <div className={styles.outlinePage}>
      <EntryHeader project={project} active="outline">
        <Button size="sm" onClick={publish}>
          发布大纲
          <ArrowRight size={14} />
        </Button>
      </EntryHeader>
      <div className={styles.outlineShell}>
        <aside className={styles.outlineNav}>
          <div className={styles.outlineNavHead}>
            <strong>讨论大纲</strong>
            <span>{project.questions.length} 题</span>
          </div>
          {project.sections.map((section) => (
            <section
              key={section.id}
              className={styles.outlineSection}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(e, section.id)}
            >
              <div className={styles.sectionRow}>
                <input
                  aria-label="环节名称"
                  value={section.name}
                  onChange={(e) =>
                    patch({
                      sections: project.sections.map((s) =>
                        s.id === section.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
                <label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    aria-label={`${section.name}预计分钟`}
                    value={section.minutes}
                    onChange={(e) =>
                      patch({
                        sections: project.sections.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                minutes: Math.max(0, Number(e.target.value)),
                              }
                            : s,
                        ),
                      })
                    }
                  />
                  分
                </label>
              </div>
              {project.questions
                .filter((q) => q.sectionId === section.id)
                .map((q) => (
                  <button
                    key={q.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(q.id);
                      e.dataTransfer.setData('text/fgd-question', q.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, section.id, q.id)}
                    className={`${styles.outlineQuestion} ${activeId === q.id ? styles.selectedQuestion : ''}`}
                    onClick={() => {
                      setActiveId(q.id);
                      setActiveSection(section.id);
                    }}
                  >
                    <span className={styles.questionMeta}>
                      <GripVertical size={13} />
                      <small>Q{project.questions.indexOf(q) + 1}</small>
                      <span>{q.type}</span>
                    </span>
                    <strong>{q.title}</strong>
                  </button>
                ))}
              <button
                className={styles.addInSection}
                onClick={() => {
                  setActiveSection(section.id);
                  setNewQuestion(true);
                }}
              >
                <Plus size={13} />
                添加题目
              </button>
            </section>
          ))}
          <button
            className={styles.newSection}
            onClick={() =>
              patch({
                sections: [
                  ...project.sections,
                  { id: uid('section'), name: '新环节', minutes: 10 },
                ],
              })
            }
          >
            <Plus size={14} />
            新增环节
          </button>
        </aside>
        <main className={styles.outlineMain}>
          <div className={styles.outlineTop}>
            <span className={styles.eyebrow}>FGD DISCUSSION GUIDE</span>
            <span className={styles.draftLabel}>
              {project.published ? '已发布' : '草稿 · 自动保存'}
            </span>
          </div>
          <input
            className={styles.projectTitleInput}
            aria-label="研究名称"
            value={project.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          <div className={styles.objective}>
            <label>研究目标</label>
            <textarea
              value={project.objective}
              aria-label="研究目标说明"
              onChange={(e) => patch({ objective: e.target.value })}
            />
          </div>
          <Notice>{message}</Notice>
          {question ? (
            <section className={styles.questionEditor}>
              <div className={styles.sectionTitle}>
                <div className="row">
                  <span className={styles.questionIndex}>
                    Q{project.questions.indexOf(question) + 1}
                  </span>
                  <select
                    className={styles.typeSelect}
                    aria-label="题目类型"
                    value={question.type}
                    onChange={(e) => updateQuestion({ type: e.target.value as QuestionType })}
                  >
                    {questionTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="删除当前题目"
                  onClick={() => {
                    const rest = project.questions.filter((q) => q.id !== question.id);
                    patch({ questions: rest });
                    setActiveId(rest[0]?.id || '');
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <QuestionFields
                question={question}
                sections={project.sections}
                onChange={updateQuestion}
              />
            </section>
          ) : (
            <Empty title="选择或添加一道题目">
              <Button onClick={() => setNewQuestion(true)}>
                <Plus size={15} />
                添加题目
              </Button>
            </Empty>
          )}
        </main>
      </div>
      <Modal open={newQuestion} onOpenChange={setNewQuestion} title="添加题目">
        <div className={styles.editorField}>
          <label>题目类型</label>
          <select
            aria-label="新增题目类型"
            value={newType}
            onChange={(e) => setNewType(e.target.value as QuestionType)}
          >
            {questionTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className={styles.editorField}>
          <label>题目内容</label>
          <textarea
            autoFocus
            aria-label="新增题目内容"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="输入题目…"
          />
        </div>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={() => setNewQuestion(false)}>
            取消
          </Button>
          <Button disabled={!newTitle.trim()} onClick={addQuestion}>
            添加
          </Button>
        </div>
      </Modal>
    </div>
  );
}
