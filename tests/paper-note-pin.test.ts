import { expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import { applyCommand } from '@/lib/fgd-reducer';
import type { Command } from '@/types/commands';
it('pins a note without marking it handled, replaces the prior pin, and can unpin', () => {
  let data = createSeedData();
  const s = data.sessions[0];
  s.phase = 'live';
  s.notes = ['a', 'b'].map((id) => ({
    id,
    observerId: 'o',
    observerName: '旁听者',
    text: id,
    questionId: null,
    questionTitle: '',
    createdAt: 1,
    status: 'pending',
    attempts: 1,
  }));
  const pin = (noteId: string, pinned: boolean) => {
    data = applyCommand(data, {
      type: 'pin-note',
      id: s.id,
      noteId,
      pinned,
      at: 2,
      commandId: noteId + String(pinned),
    } as Command);
  };
  pin('a', true);
  expect(data.sessions[0].notes[0].pinned).toBe(true);
  expect(data.sessions[0].notes[0].status).toBe('pending');
  pin('b', true);
  expect(data.sessions[0].notes[0].pinned).toBe(false);
  expect(data.sessions[0].notes[1].pinned).toBe(true);
  pin('b', false);
  expect(data.sessions[0].notes.every((n) => !n.pinned)).toBe(true);
});
