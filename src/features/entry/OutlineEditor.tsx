'use client';
import { useRouter } from 'next/navigation';
import { useState, type DragEvent } from 'react';
import {
  ArrowRight,
  GripVertical,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useFgdStore } from '@/stores/fgd-store';
import { uid } from '@/lib/utils';
import type { Project, Question, QuestionType, Mark } from '@/types/fgd';
import { EntryHeader, Empty, Notice, projectUrl, questionTypes } from './shared';
import styles from './entry.module.css';
import QuestionFields from './QuestionFields';
import { questionTypePatch } from './question-defaults';
import { StandardQuestion } from '@/features/questions/StandardQuestion';
import { AnnotationEditor } from '@/features/questions/AnnotationEditor';
import layout from './OutlineEditor.module.css';
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
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
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
    Object.assign(q, questionTypePatch(newType));
    const questions = [...project.questions];
    const sectionIndex = project.sections.findIndex((s) => s.id === q.sectionId);
    const nextSectionQuestion = questions.findIndex(
      (item) => project.sections.findIndex((s) => s.id === item.sectionId) > sectionIndex,
    );
    questions.splice(nextSectionQuestion < 0 ? questions.length : nextSectionQuestion, 0, q);
    patch({ questions });
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
  const totalMinutes = project.sections.reduce((sum, section) => sum + section.minutes, 0);
  const index = question ? project.questions.indexOf(question) : -1;
  function selectQuestion(id: string) {
    const target = project.questions.find((q) => q.id === id);
    if (target) setCollapsed((ids) => ids.filter((sectionId) => sectionId !== target.sectionId));
    setActiveId(id);
    document
      .getElementById(`outline-${id}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  return (
    <div className={styles.outlinePage}>
      <EntryHeader project={project} active="outline">
        <Button size="sm" onClick={publish}>
          发布大纲
          <ArrowRight size={14} />
        </Button>
      </EntryHeader>
      <div className={layout.mobileTabs} role="group" aria-label="大纲工作区">
        <button aria-pressed={mobileView === 'edit'} onClick={() => setMobileView('edit')}>
          编辑大纲
        </button>
        <button aria-pressed={mobileView === 'preview'} onClick={() => setMobileView('preview')}>
          受访者预览
        </button>
      </div>
      <div className={layout.shell} data-mobile-view={mobileView}>
        <main className={layout.editor}>
          <div className={layout.heading}>
            <div>
              <h1>编辑访谈大纲</h1>
              <span>
                {project.questions.length} 道题 · {project.sections.length} 个章节
              </span>
            </div>
            <span className={layout.total}>
              <Clock size={14} />
              预计 {totalMinutes} 分钟
            </span>
          </div>
          <details className={layout.meta}>
            <summary>研究信息 · {project.title}</summary>
            <div>
              <div className={styles.editorField}>
                <label htmlFor="outline-title">研究名称</label>
                <input
                  id="outline-title"
                  value={project.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div className={styles.editorField}>
                <label htmlFor="outline-objective">研究目标</label>
                <textarea
                  id="outline-objective"
                  value={project.objective}
                  onChange={(e) => patch({ objective: e.target.value })}
                />
              </div>
            </div>
          </details>
          <Notice>{message}</Notice>
          {project.sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              className={layout.section}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(e, section.id)}
            >
              <div className={layout.sectionHead}>
                <button
                  className="icon-button"
                  aria-label={`${collapsed.includes(section.id) ? '展开' : '收起'}${section.name}`}
                  aria-expanded={!collapsed.includes(section.id)}
                  onClick={() =>
                    setCollapsed((ids) =>
                      ids.includes(section.id)
                        ? ids.filter((id) => id !== section.id)
                        : [...ids, section.id],
                    )
                  }
                >
                  <ChevronDown
                    size={15}
                    style={{
                      transform: collapsed.includes(section.id) ? 'rotate(-90deg)' : undefined,
                    }}
                  />
                </button>
                <input
                  aria-label={`章节${sectionIndex + 1}名称`}
                  value={section.name}
                  placeholder="章节名称"
                  onChange={(e) =>
                    patch({
                      sections: project.sections.map((s) =>
                        s.id === section.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
                <label className={layout.duration}>
                  <Clock size={13} />
                  <input
                    type="number"
                    min="1"
                    max="240"
                    step="1"
                    aria-label={`${section.name}预计分钟`}
                    value={section.minutes}
                    onChange={(e) =>
                      patch({
                        sections: project.sections.map((s) =>
                          s.id === section.id
                            ? { ...s, minutes: Math.max(0, Number(e.target.value)) }
                            : s,
                        ),
                      })
                    }
                  />
                  分钟
                </label>
              </div>
              {!collapsed.includes(section.id) && (
                <>
                  {project.questions
                    .filter((q) => q.sectionId === section.id)
                    .map((q) => (
                      <div
                        id={`outline-${q.id}`}
                        key={q.id}
                        className={`${layout.question} ${activeId === q.id ? layout.active : ''}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => drop(e, section.id, q.id)}
                      >
                        <div className={layout.questionHead}>
                          <button
                            className={layout.drag}
                            draggable
                            aria-label={`拖动Q${project.questions.indexOf(q) + 1}`}
                            title="拖动调整顺序"
                            onDragStart={(e) => {
                              setDragId(q.id);
                              e.dataTransfer.setData('text/fgd-question', q.id);
                            }}
                            onDragEnd={() => setDragId(null)}
                          >
                            <GripVertical size={15} />
                          </button>
                          <button
                            className={layout.select}
                            onClick={() => {
                              setActiveId(q.id);
                              setActiveSection(section.id);
                            }}
                            aria-expanded={activeId === q.id}
                          >
                            <ChevronDown
                              size={13}
                              style={{
                                transform: activeId !== q.id ? 'rotate(-90deg)' : undefined,
                              }}
                            />
                            <span>Q{project.questions.indexOf(q) + 1}</span>
                            <small>{q.type}</small>
                            <strong>{q.title || '未填写题目'}</strong>
                          </button>
                        </div>
                        {activeId === q.id && (
                          <div className={layout.questionBody}>
                            <div className={layout.questionTools}>
                              <select
                                aria-label="题目类型"
                                value={q.type}
                                onChange={(e) =>
                                  updateQuestion(questionTypePatch(e.target.value as QuestionType))
                                }
                              >
                                {questionTypes.map((type) => (
                                  <option key={type}>{type}</option>
                                ))}
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="删除当前题目"
                                onClick={() => {
                                  const rest = project.questions.filter((item) => item.id !== q.id);
                                  patch({ questions: rest });
                                  setActiveId(rest[0]?.id || '');
                                }}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                            <QuestionFields
                              question={q}
                              sections={project.sections}
                              onChange={updateQuestion}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  <button
                    className={layout.add}
                    onClick={() => {
                      setActiveSection(section.id);
                      setNewQuestion(true);
                    }}
                  >
                    <Plus size={14} />
                    添加题目
                  </button>
                </>
              )}
            </section>
          ))}
          <button
            className={layout.add}
            onClick={() =>
              patch({
                sections: [
                  ...project.sections,
                  { id: uid('section'), name: '新章节', minutes: 10 },
                ],
              })
            }
          >
            <Plus size={15} />
            新增章节
          </button>
        </main>
        <aside className={layout.preview} aria-label="受访者预览">
          <div className={layout.previewHeader}>
            <strong>受访者预览</strong>
            <small>与编辑内容实时同步</small>
          </div>
          {question ? (
            <div className={layout.previewBody}>
              <div className={layout.previewMeta}>
                Q{index + 1}
                <span>{question.type}</span>
              </div>
              <h2>{question.title || '请输入题目内容'}</h2>
              <StandardQuestion question={question} />
              {question.type === '标注题' && <AnnotationPreview key={question.id} />}
              {question.type === '访谈题' && (
                <textarea
                  key={question.id}
                  className={layout.reply}
                  aria-label="预览回答"
                  placeholder="请输入你的回答…"
                />
              )}
              {question.type === '图片上传题' && (
                <div className={styles.annotationHint}>
                  <ImagePlus size={22} />
                  <span>受访者上传自己的图片</span>
                </div>
              )}
            </div>
          ) : (
            <Empty title="添加题目后在这里预览" />
          )}
          <div className={layout.previewNav}>
            <span>{question ? `${index + 1} / ${project.questions.length}` : '暂无题目'}</span>
            <div>
              <button
                aria-label="预览上一题"
                disabled={index < 1}
                onClick={() => selectQuestion(project.questions[index - 1].id)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="预览下一题"
                disabled={index < 0 || index >= project.questions.length - 1}
                onClick={() => selectQuestion(project.questions[index + 1].id)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </aside>
      </div>
      <Modal open={newQuestion} onOpenChange={setNewQuestion} title="添加题目">
        <div className={styles.editorField}>
          <label htmlFor="new-type">题目类型</label>
          <select
            id="new-type"
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
          <label htmlFor="new-title">题目内容</label>
          <textarea
            id="new-title"
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
function AnnotationPreview() {
  const [marks, setMarks] = useState<Mark[]>([]);
  return <AnnotationEditor participantId="outline-preview" marks={marks} onChange={setMarks} />;
}
