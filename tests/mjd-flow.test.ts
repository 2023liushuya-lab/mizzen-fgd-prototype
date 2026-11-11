import { expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import { personalCode, identifyByCode } from '@/lib/mjd-access';
import { applyCommand } from '@/lib/fgd-reducer';
it('each participant resolves only by their personal code and removed participants cannot enter', () => {
  const s = createSeedData().sessions[1];
  const codes = s.participants.map((p) => personalCode(s, p));
  expect(new Set(codes).size).toBe(s.participants.length);
  for (const p of s.participants) expect(identifyByCode(s, personalCode(s, p))?.id).toBe(p.id);
  s.participants[0].removed = true;
  expect(identifyByCode(s, codes[0])).toBeUndefined();
  expect(identifyByCode(s, '000000')).toBeUndefined();
  expect(s.testMode).toBe('blind');
});
it('reading a note preserves content and only records the first read time', () => {
  let d = createSeedData();
  const s = d.sessions[0];
  s.notes = [
    {
      id: 'n',
      observerId: 'o',
      observerName: '旁听',
      text: '请问使用场景',
      questionId: null,
      questionTitle: '',
      createdAt: 1,
      status: 'pending',
      attempts: 1,
    },
  ];
  d = applyCommand(d, { type: 'read-note', id: s.id, noteId: 'n', at: 10, commandId: '1' });
  expect(d.sessions[0].notes[0].readAt).toBe(10);
  expect(d.sessions[0].notes[0].text).toBe('请问使用场景');
  d = applyCommand(d, { type: 'read-note', id: s.id, noteId: 'n', at: 20, commandId: '2' });
  expect(d.sessions[0].notes[0].readAt).toBe(10);
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuestionWorkspace } from '@/features/questions/QuestionWorkspace';
it('only annotation has separate prior-answer projection after starting; all started questions can project to screen', () => {
  const s = createSeedData().sessions[0];
  s.phase = 'live';
  const render = (type: '访谈题' | '标注题') => {
    const q = s.questions.find((q) => q.type === type)!;
    s.currentQuestionId = q.id;
    s.runs[q.id] = {
      questionId: q.id,
      startedAt: 1,
      answers: {},
      transcript: [],
      segments: [],
      stimulusSeconds: 0,
      stimulusPlaying: false,
    };
    return renderToStaticMarkup(
      createElement(QuestionWorkspace, {
        session: s,
        question: q,
        role: 'host',
        onStart: () => {},
        onPriorAnswers: () => {},
        onScreen: () => {},
      }),
    );
  };
  const normal = render('访谈题');
  expect(normal).toContain('投放大屏');
  expect(normal).not.toContain('投放前题答案');
  const annotation = render('标注题');
  expect(annotation).toContain('投放大屏');
  expect(annotation).toContain('投放前题答案');
});
