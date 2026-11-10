import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import { ConversationPopover } from '@/features/workbench/Conversations';

function session() {
  const s = createSeedData().sessions[0];
  s.phase = 'live';
  const q = s.questions[0],
    p = s.participants[0];
  s.runs = {
    [q.id]: {
      questionId: q.id,
      startedAt: 100,
      answers: {},
      transcript: [
        {
          id: 'line-a',
          participantId: p.id,
          name: p.name,
          text: '用于核对说话人的实际发言',
          createdAt: 110,
          duration: 3,
        },
      ],
      segments: [{ sectionId: q.sectionId, startedAt: 100 }],
      stimulusSeconds: 0,
      stimulusPlaying: false,
    },
  };
  return s;
}
describe('subtitle permission boundary', () => {
  it('observer sees the same transcript without speaker correction controls', () => {
    const html = renderToStaticMarkup(
      createElement(ConversationPopover, {
        session: session(),
        type: 'transcript',
        readonly: true,
        onClose: () => {},
      }),
    );
    expect(html).toContain('用于核对说话人的实际发言');
    expect(html).not.toContain('<select');
  });
  it('host can still correct a speaker during a live session', () => {
    const html = renderToStaticMarkup(
      createElement(ConversationPopover, {
        session: session(),
        type: 'transcript',
        onClose: () => {},
      }),
    );
    expect(html).toContain('<select');
  });
  it('completed session is readonly even on the host', () => {
    const s = session();
    s.phase = 'ended';
    const html = renderToStaticMarkup(
      createElement(ConversationPopover, { session: s, type: 'transcript', onClose: () => {} }),
    );
    expect(html).not.toContain('<select');
  });
});
