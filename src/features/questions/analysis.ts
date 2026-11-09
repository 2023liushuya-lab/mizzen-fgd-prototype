import type { Answer, Participant, Question, Session } from '@/types/fgd';

export function questionParticipants(session: Session, question: Question): Participant[] {
  const run = session.runs[question.id];
  return session.participants.filter(
    (p) =>
      !p.removed ||
      Boolean(run?.answers[p.id]) ||
      Boolean(run?.transcript.some((t) => t.participantId === p.id)),
  );
}

export function answerLabel(question: Question, answer: Answer): string {
  const value = answer.value;
  if (question.type === '单选题') return question.options?.[Number(value)] ?? String(value);
  if (question.type === '多选题')
    return Array.isArray(value)
      ? value.map((v) => question.options?.[Number(v)] ?? String(v)).join('、')
      : String(value);
  if (question.type === '矩阵题' && Array.isArray(value))
    return (question.matrixRows || [])
      .map((row, i) => `${row}：${question.options?.[Number(value[i])] ?? '未填写'}`)
      .join('；');
  if (question.type === '比重题' && Array.isArray(value))
    return (question.items || []).map((item, i) => `${item} ${value[i] ?? 0}%`).join(' · ');
  if (question.type === '排序题' && Array.isArray(value)) return value.join(' → ');
  if (question.type === '量表题') return `${value} / ${question.scale?.max ?? 5}`;
  if (Array.isArray(value)) return value.join('、');
  if (value && typeof value === 'object')
    return Object.entries(value)
      .map(([k, v]) => `${k}：${v}`)
      .join('；');
  return String(value);
}

export function currentText(session: Session, question: Question, participantId: string): string {
  const run = session.runs[question.id];
  const answer = run?.answers[participantId];
  const spoken = (run?.transcript || [])
    .filter((t) => t.participantId === participantId)
    .map((t) => t.text.trim())
    .filter(Boolean);
  const parts = [answer?.comment?.trim(), ...spoken].filter((s): s is string => Boolean(s));
  if (!parts.length && question.type === '访谈题' && typeof answer?.value === 'string')
    parts.push(answer.value);
  return [...new Set(parts)].join(' ');
}

export function priorText(session: Session, question: Question, person: Participant): string {
  const currentStarted = session.runs[question.id]?.startedAt ?? Infinity;
  const earlier = session.questions.filter(
    (q) => q.id !== question.id && session.runs[q.id]?.startedAt < currentStarted,
  );
  const concepts = [
    ['保湿', '干燥', '换季', '修护'],
    ['清爽', '肤感', '厚重', '黏腻', '泛油', '妆前'],
    ['价格', '预算', '成本', '优惠'],
    ['功效', '效果', '配方', '温和'],
    ['渠道', '购买', '专柜', '旗舰店', '小程序'],
  ];
  const context = `${question.title} ${question.guide} ${currentText(session, question, person.id)}`;
  const relevantGroups = concepts.filter((words) => words.some((word) => context.includes(word)));
  const fragments = earlier
    .map((q) => ({
      text: currentText(session, q, person.id),
      startedAt: session.runs[q.id].startedAt,
    }))
    .filter((x) => x.text);
  const ranked = fragments
    .map((fragment) => ({
      ...fragment,
      score: relevantGroups.filter((words) => words.some((word) => fragment.text.includes(word)))
        .length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.startedAt - a.startedAt);
  // Local prototype: quote a relevant actual response, never invent a historical answer.
  return ranked[0]?.text || '';
}

export function questionFollowup(question: Question, current: string, prior: string): string {
  if (question.type === '图片上传题')
    return current
      ? '你能结合这张图片，说明它与你日常使用习惯的关系吗？'
      : '请介绍这张图片中的产品，以及最近一次使用它的具体经历。';
  if (question.type === '标注题')
    return prior
      ? '结合你之前提到的使用经历，为什么标记这些位置？其中最需要解释的是哪一处？'
      : '能说明你标记这些位置的具体原因吗？困惑的部分还需要哪些信息？';
  if (!current) return '这个选择背后的主要考虑是什么？请结合最近一次真实经历说明。';
  if (/还行|挺好|不错|一般|差不多/.test(current))
    return '你说的这个感受，具体是指哪些方面？能举一次实际使用的例子吗？';
  if (prior) return '结合之前的经历，哪些条件变化会让你调整这次判断？';
  if (question.type === '量表题') return '什么是影响这个分数的主要原因？哪些改变会让你的评分提高？';
  if (question.type === '排序题' || question.type === '比重题')
    return '当预算或使用场景改变时，你会怎样调整这个取舍？';
  return '能结合最近一次具体经历，说明这个判断的标准吗？';
}

export function wholeQuestionSummary(session: Session, question: Question): string {
  const run = session.runs[question.id];
  const people = questionParticipants(session, question);
  const comments = people
    .map((p) => ({ name: p.name, text: currentText(session, question, p.id) }))
    .filter((p) => p.text);
  if (comments.length) return comments.map((p) => `${p.name}：${p.text}`).join('；');
  const count = Object.keys(run?.answers || {}).length;
  return count
    ? `已收到 ${count} 位受访者的作答，尚未有补充的文字说明。可结合上方结果继续了解选择原因。`
    : '等待受访者作答或发言。';
}
