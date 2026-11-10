import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import { WorkspaceHeader } from '@/features/workbench/WorkspaceHeader';
import { ParticipantFooter } from '@/features/workbench/WorkbenchFooter';
it('offline host exposes meeting information and does not retain a stale online title prefix', () => {
  const session = createSeedData().sessions.find((s) => s.delivery === 'offline')!;
  session.title = '线上 · 护肤产品体验讨论';
  const html = renderToStaticMarkup(
    createElement(WorkspaceHeader, {
      session,
      role: 'host',
      now: 0,
      view: 'question',
      onView: () => {},
      onEnd: () => {},
    }),
  );
  expect(html).toContain('会议信息');
  expect(html).toContain('线下 · 护肤产品体验讨论');
  expect(html).not.toContain('线上 · 护肤产品体验讨论');
});
it('offline footer offers previous and next question navigation', () => {
  const session = createSeedData().sessions.find((s) => s.delivery === 'offline')!;
  const html = renderToStaticMarkup(
    createElement(ParticipantFooter, {
      session,
      readonly: false,
      onProfile: () => {},
      question: session.questions[1],
      visibleQuestions: session.questions,
      onQuestion: () => {},
    }),
  );
  expect(html).toContain('aria-label="上一题"');
  expect(html).toContain('aria-label="下一题"');
});
