import { describe, it, expect } from 'vitest';
import { createSeedData } from '@/data/seed';
import { applyCommand } from '@/lib/fgd-reducer';
import type { Command, CommandPayload } from '@/types/commands';
let tick = 1000;
function apply(data: ReturnType<typeof createSeedData>, payload: CommandPayload) {
  return applyCommand(data, { ...payload, at: ++tick, commandId: String(tick) } as Command);
}
const id = 'session-online-1';
function live() {
  let d = createSeedData();
  d = apply(d, { type: 'start-session', id });
  d = apply(d, { type: 'start-question', id, questionId: 'q-1' });
  for (const participantId of ['p-1', 'p-2'])
    d = apply(d, { type: 'presence', id, participantId, online: true });
  return d;
}
describe('original HTML interaction parity', () => {
  it('keeps hand FIFO order and a declined invitation in the queue, then only opens mic after consent', () => {
    let d = live();
    d = apply(d, { type: 'hand', id, participantId: 'p-1', raised: true });
    d = apply(d, { type: 'hand', id, participantId: 'p-2', raised: true });
    let s = d.sessions[0];
    expect(s.participants[0].handRaisedAt).toBeLessThan(s.participants[1].handRaisedAt!);
    d = apply(d, { type: 'invite-hand', id, participantId: 'p-1', requestId: 'invite-1' });
    expect(d.sessions[0].participants[0].mic).toBe(false);
    d = apply(d, { type: 'respond-media', id, requestId: 'invite-1', accepted: false });
    expect(d.sessions[0].participants[0].handRaisedAt).toBeTruthy();
    expect(d.sessions[0].participants[0].handResponse?.kind).toBe('declined');
    d = apply(d, { type: 'invite-hand', id, participantId: 'p-1', requestId: 'invite-2' });
    d = apply(d, { type: 'respond-media', id, requestId: 'invite-2', accepted: true });
    s = d.sessions[0];
    expect(s.participants[0].mic).toBe(true);
    expect(s.participants[0].handRaisedAt).toBeNull();
    expect(s.participants[1].handRaisedAt).toBeTruthy();
  });
  it('cancel and lower-all also revoke outstanding hand invitations', () => {
    let d = live();
    d = apply(d, { type: 'hand', id, participantId: 'p-1', raised: true });
    d = apply(d, { type: 'invite-hand', id, participantId: 'p-1', requestId: 'invite' });
    d = apply(d, { type: 'hand', id, participantId: 'p-1', raised: false });
    d = apply(d, { type: 'respond-media', id, requestId: 'invite', accepted: true });
    expect(d.sessions[0].participants[0].mic).toBe(false);
    d = apply(d, { type: 'hand', id, participantId: 'p-2', raised: true });
    d = apply(d, { type: 'clear-hands', id });
    expect(d.sessions[0].participants.every((p) => !p.handRaisedAt)).toBe(true);
  });
  it('can lower a disconnected person and clears hands when ending; mute-all never opens audio', () => {
    let d = live();
    d = apply(d, { type: 'hand', id, participantId: 'p-1', raised: true });
    d = apply(d, { type: 'presence', id, participantId: 'p-1', online: false });
    d = apply(d, { type: 'hand', id, participantId: 'p-1', raised: false });
    expect(d.sessions[0].participants[0].handRaisedAt).toBeNull();
    d = apply(d, { type: 'set-media', id, participantId: 'p-2', kind: 'mic', enabled: true });
    d = apply(d, { type: 'mute-all', id });
    expect(d.sessions[0].participants[1].mic).toBe(false);
    expect(d.sessions[0].participants[1].forceMutedAt).toBeTruthy();
    d = apply(d, { type: 'hand', id, participantId: 'p-2', raised: true });
    d = apply(d, { type: 'end-session', id });
    d = apply(d, { type: 'hand', id, participantId: 'p-2', raised: true });
    expect(d.sessions[0].participants.every((p) => !p.handRaisedAt)).toBe(true);
  });
});
