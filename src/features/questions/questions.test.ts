import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Answer, Participant, Question, Session } from '@/types/fgd';
import { questions } from '@/data/questions';
import { answerLabel, currentText, priorText } from './analysis';
import { AnswerResults, QuestionWorkspace } from './QuestionWorkspace';

const person: Participant = {
  id: 'p-9',
  name: '实际受访者',
  age: '28岁',
  skin: '干敏肌',
  notes: '',
  color: '#234f7e',
  voiceEnabled: true,
  online: true,
  mic: true,
  camera: false,
};
function sessionFor(question: Question, answers: Answer[] = [], started = true): Session {
  return {
    id: 's-a',
    projectId: 'project-a',
    title: '测试场次',
    delivery: 'online',
    observerToken: 'test',
    roomCode: '123456',
    phase: 'live',
    participants: [person],
    seatOrder: [person.id],
    questions: [question],
    sections: [{ id: question.sectionId, name: '测试章节', minutes: 5 }],
    currentQuestionId: question.id,
    notes: [],
    chats: [],
    mediaRequests: [],
    runs: started
      ? {
          [question.id]: {
            questionId: question.id,
            startedAt: 100,
            answers: Object.fromEntries(answers.map((a) => [a.participantId, a])),
            transcript: [],
            segments: [{ sectionId: question.sectionId, startedAt: 100 }],
            stimulusSeconds: 0,
            stimulusPlaying: false,
          },
        }
      : {},
  };
}
function answer(value: Answer['value'], comment = ''): Answer {
  return { participantId: person.id, value, comment, submittedAt: 120 };
}

describe('shared question workspace migration contracts', () => {
  it('uses actual zero scores instead of fixture scores', () => {
    const q = questions.find((q) => q.type === '量表题')!;
    const html = renderToStaticMarkup(
      createElement(QuestionWorkspace, {
        question: q,
        session: sessionFor(q, [answer(0, '实际零分原因')]),
        role: 'observer',
      }),
    );
    expect(html).toContain('0.0');
    expect(html).toContain('实际零分原因');
    expect(html).not.toContain(q.sampleSummaries[0]);
  });
  it('retains a valid none-of-the-above matrix response', () => {
    const q = questions.find((q) => q.type === '矩阵题')!;
    const a = answer([3, 3, 3]);
    expect(answerLabel(q, a)).toContain('冰绽凝霜：无符合项');
    const html = renderToStaticMarkup(
      createElement(QuestionWorkspace, {
        question: q,
        session: sessionFor(q, [a]),
        role: 'observer',
      }),
    );
    expect(html).toContain('无符合项');
    expect((html.match(/1 票/g) || []).length).toBe(3);
  });
  it('does not leak individual results into the participant question view', () => {
    const q = questions[0];
    const s = sessionFor(q, [answer('私密当前回答')]);
    const html = renderToStaticMarkup(
      createElement(QuestionWorkspace, { question: q, session: s, role: 'participant' }),
    );
    expect(html).not.toContain('私密当前回答');
    expect(html).not.toContain('整体回答');
    expect(html).not.toContain('原始作答结果');
  });
  it('does not expose host operations to an observer before or after start', () => {
    const q = questions[0];
    for (const started of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(QuestionWorkspace, {
          question: q,
          session: sessionFor(q, [], started),
          role: 'observer',
          onStart: () => {},
          onPriorAnswers: () => {},
        }),
      );
      expect(html).not.toContain('开始题目</button>');
      expect(html).not.toContain('投放前题答案');
    }
  });
  it('statement questions have no interview guide or AI/result sections', () => {
    const q = questions.find((q) => q.type === '陈述题')!;
    const html = renderToStaticMarkup(
      createElement(QuestionWorkspace, { question: q, session: sessionFor(q), role: 'observer' }),
    );
    expect(html).toContain(q.title);
    expect(html).not.toContain('访谈指引');
    expect(html).not.toContain('按人回答');
    expect(html).not.toContain('原始作答结果');
  });
  it('keeps actual narrative and omits unrelated earlier channel answers', () => {
    const q = questions.find((q) => q.type === '排序题')!;
    const previous = questions.find((q) => q.type === '级联选择题')!;
    const s = sessionFor(q, [answer(['功效', '价格', '肤感'], '当前在意价格')]);
    s.questions.unshift(previous);
    s.runs[previous.id] = {
      ...s.runs[q.id],
      startedAt: 50,
      answers: { [person.id]: answer('线上 → 品牌官方 → 小程序', '从小程序购买') },
    };
    expect(priorText(s, q, person)).toBe('');
    expect(currentText(s, q, person.id)).toBe('当前在意价格');
  });
  it('keeps submitted answers when a participant is removed from the live room', () => {
    const q = questions[0];
    const s = sessionFor(q, [answer('已移除前的真实回答')]);
    s.participants[0].removed = true;
    const html = renderToStaticMarkup(
      createElement(QuestionWorkspace, { question: q, session: s, role: 'observer' }),
    );
    expect(html).toContain('已移除前的真实回答');
    expect(html).toContain(person.name);
  });
  it('projects actual results without private AI summaries or followups', () => {
    const q = questions.find((q) => q.type === '图片上传题')!;
    const s = sessionFor(q, [answer('文件名.jpg', '图片使用说明')]);
    const html = renderToStaticMarkup(createElement(AnswerResults, { question: q, session: s }));
    expect(html).toContain('受访者上传');
    expect(html).not.toContain('追问方向');
    expect(html).not.toContain('按人回答');
    expect(html).not.toContain('整体回答');
  });
});
