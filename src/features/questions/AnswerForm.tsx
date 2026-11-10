'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Answer, AnswerValue, Mark, Question, Session } from '@/types/fgd';
import { MarkLegend } from './ConceptCanvas';
import { AnnotationEditor } from './AnnotationEditor';
import { participantMaterialText } from '@/lib/participant-materials';
import { compactImage } from './image-upload';
import { StructuredFields } from './StructuredFields';
import styles from './questions.module.css';

export interface AnswerFormProps {
  session: Session;
  question: Question;
  participantId: string;
  onSubmit: (answer: Omit<Answer, 'submittedAt'>) => void;
}

export function AnswerForm({ session, question, participantId, onSubmit }: AnswerFormProps) {
  const existing = session.runs[question.id]?.answers[participantId];
  const [value, setValue] = useState<AnswerValue>('');
  const [comment, setComment] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const uploadAttempt = useRef(0);
  const [touched, setTouched] = useState(false),
    [draftReady, setDraftReady] = useState('');
  const draftKey = `fgd-answer-draft:${session.projectId}/${session.id}/${question.id}/${participantId}`;
  const [cascade, setCascade] = useState(['', '', '']);
  useEffect(() => {
    const answer = session.runs[question.id]?.answers[participantId];
    let draft;
    try {
      draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
    } catch {}
    if (draft?.touched) {
      setValue(draft.value);
      setComment(draft.comment || '');
      setMarks(draft.marks || []);
      setImage(draft.image);
      setFilename(draft.filename || '');
      setCascade(draft.cascade || ['', '', '']);
      setTouched(true);
      setSaved(false);
      setTouched(true);
      setDraftReady(draftKey);
      return;
    }
    setValue(
      answer?.value ??
        (question.type === '排序题'
          ? [...(question.items || [])]
          : question.type === '比重题'
            ? (question.items || []).map(() => 0)
            : question.type === '矩阵题'
              ? (question.matrixRows || []).map(() => -1)
              : question.type === '多选题'
                ? []
                : ''),
    );
    uploadAttempt.current++;
    setPreparingImage(false);
    setComment(answer?.comment || '');
    setMarks(answer?.marks || []);
    setImage(answer?.image);
    setFilename(typeof answer?.value === 'string' ? answer.value : '');
    setCascade(typeof answer?.value === 'string' ? answer.value.split(' → ') : ['', '', '']);
    setSaved(Boolean(answer));
    setError('');
    setTouched(false);
    setDraftReady(draftKey);
    // A question/person switch starts the corresponding draft; live store updates must not erase typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, participantId, session.id]);
  useEffect(() => {
    if (draftReady !== draftKey) return;
    try {
      if (saved || !touched) sessionStorage.removeItem(draftKey);
      else
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ touched, value, comment, marks, image, filename, cascade }),
        );
    } catch {
      setError('草稿暂未保存到本地，输入内容仍保留。');
    }
  }, [draftReady, draftKey, saved, touched, value, comment, marks, image, filename, cascade]);
  if (question.type === '陈述题') return null;
  const active = session.phase === 'live' && session.currentQuestionId === question.id;
  const values = Array.isArray(value) ? value : [];
  const sum =
    question.type === '比重题' ? values.reduce<number>((total, v) => total + Number(v), 0) : 0;
  function edit(next: AnswerValue) {
    setValue(next);
    setSaved(false);
    setTouched(true);
    setError('');
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件。');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片请小于 5 MB。');
      return;
    }
    const attempt = ++uploadAttempt.current;
    setPreparingImage(true);
    setError('');
    try {
      const result = await compactImage(file);
      if (attempt !== uploadAttempt.current) return;
      setImage(result);
      setFilename(file.name);
      edit(file.name);
      setMarks([]);
    } catch (reason) {
      if (attempt === uploadAttempt.current)
        setError(reason instanceof Error ? reason.message : '图片处理失败，请重试。');
    } finally {
      if (attempt === uploadAttempt.current) setPreparingImage(false);
    }
  }
  function submit() {
    if (!active) {
      setError('当前题目尚未开放或已结束。');
      return;
    }
    if (question.type === '访谈题' && !String(value).trim()) {
      setError('请填写你的回答。');
      return;
    }
    if (['单选题', '量表题'].includes(question.type) && value === '') {
      setError('请选择一个答案。');
      return;
    }
    if (question.type === '多选题' && !values.length) {
      setError('请至少选择一项。');
      return;
    }
    if (question.type === '矩阵题' && values.some((v) => Number(v) < 0)) {
      setError('请完成每一行的选择；无符合项也可提交。');
      return;
    }
    if (question.type === '级联选择题' && cascade.some((v) => !v)) {
      setError('请选择完整的购买渠道。');
      return;
    }
    if (question.type === '比重题' && sum !== 100) {
      setError('各项比重合计需要为 100%。');
      return;
    }
    if (question.type === '标注题' && !marks.length) {
      setError('请先在图片上圈选一处。');
      return;
    }
    if (question.type === '图片上传题' && !image) {
      setError('请先上传图片。');
      return;
    }
    try {
      onSubmit({
        participantId,
        value: question.type === '级联选择题' ? cascade.join(' → ') : value,
        comment: comment.trim(),
        ...(marks.length ? { marks } : {}),
        ...(image ? { image } : {}),
      });
      setSaved(true);
      setError('');
    } catch (reason) {
      setSaved(false);
      setTouched(true);
      setError(reason instanceof Error ? reason.message : '回答保存失败，已保留输入，请重试。');
    }
  }
  return (
    <section className={`card ${styles.answerForm}`} aria-label="当前题目作答">
      <div className={styles.formTitle}>
        <strong>你的回答</strong>
        {existing && (
          <span className={styles.submitted}>
            <Check size={13} />
            已提交
          </span>
        )}
      </div>
      <fieldset disabled={!active} className={styles.formFields}>
        {question.type === '访谈题' && (
          <textarea
            aria-label="填写你的回答"
            placeholder="请结合自己的真实经历分享…"
            value={String(value)}
            onChange={(e) => edit(e.target.value)}
            rows={5}
          />
        )}
        <StructuredFields
          question={question}
          value={value}
          onChange={edit}
          active={active}
          cascade={cascade}
          onCascadeChange={(next) => {
            setCascade(next);
            setSaved(false);
            setTouched(true);
          }}
        />
        {question.type === '图片上传题' && (
          <div className={styles.uploadArea}>
            <label className={styles.uploadLabel}>
              <ImagePlus size={23} />
              <span>{preparingImage ? '正在处理图片…' : image ? '更换图片' : '上传你的图片'}</span>
              <small>JPG、PNG、WEBP · 最大 5 MB</small>
              <input
                aria-label="上传你的图片"
                type="file"
                accept="image/*"
                disabled={preparingImage}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            {image && (
              <>
                <div className={styles.imageFilename}>{filename}</div>
                <AnnotationEditor
                  blind={session.testMode === 'blind'}
                  sampleLabel={
                    participantMaterialText(session, '冰绽凝霜') === '冰绽凝霜'
                      ? '样品 A'
                      : participantMaterialText(session, '冰绽凝霜')
                  }
                  participantId={participantId}
                  marks={marks}
                  onChange={(next) => {
                    setMarks(next);
                    setSaved(false);
                    setTouched(true);
                  }}
                  image={image}
                />
              </>
            )}
          </div>
        )}
        {question.type === '标注题' && (
          <>
            <MarkLegend />
            <AnnotationEditor
              blind={session.testMode === 'blind'}
              sampleLabel={
                participantMaterialText(session, '冰绽凝霜') === '冰绽凝霜'
                  ? '样品 A'
                  : participantMaterialText(session, '冰绽凝霜')
              }
              participantId={participantId}
              marks={marks}
              onChange={(next) => {
                setMarks(next);
                setSaved(false);
                setTouched(true);
              }}
            />
          </>
        )}
        {question.type !== '访谈题' && (
          <label className={styles.commentField}>
            <span>
              补充说明 <small>选填</small>
            </span>
            <textarea
              aria-label="补充说明"
              placeholder="说说你的选择原因…"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setSaved(false);
                setTouched(true);
              }}
            />
          </label>
        )}
      </fieldset>
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
      <div className={styles.formFooter}>
        <span className="muted">
          {!active ? '等待主持人开放题目' : saved ? '已同步给主持人' : '提交后同步给主持人'}
        </span>
        <Button onClick={submit} disabled={!active || saved || preparingImage}>
          {saved ? (
            <>
              <Check size={15} />
              已提交
            </>
          ) : existing ? (
            '更新回答'
          ) : (
            '提交回答'
          )}
        </Button>
      </div>
    </section>
  );
}
