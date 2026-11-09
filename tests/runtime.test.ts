import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeedData } from '@/data/seed';
import { applyCommand } from '@/lib/fgd-reducer';
import {
  appendCommand,
  JOURNAL_PREFIX,
  loadPrototype,
  readCommands,
} from '@/lib/prototype-repository';
import { useFgdStore } from '@/stores/fgd-store';
import type { Command, CommandPayload } from '@/types/commands';
import type { FgdData, Transcript } from '@/types/fgd';
import { sectionMilliseconds } from '@/features/workbench/helpers';

const SESSION = 'session-online-1';
const OBSERVER = { id: 'observer-test', name: '研究同事' };

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  clear() {
    this.items.clear();
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
}

let sequence = 0;
function command(payload: CommandPayload, at: number): Command {
  return { ...payload, commandId: `command-${++sequence}`, at } as Command;
}
function run(data: FgdData, payload: CommandPayload, at: number) {
  return applyCommand(data, command(payload, at));
}
function started() {
  return run(
    run(createSeedData(), { type: 'start-session', id: SESSION }, 1000),
    { type: 'start-question', id: SESSION, questionId: 'q-1' },
    2000,
  );
}
function turn(id: string, participantId = 'p-1', createdAt = 3000): Transcript {
  return {
    id,
    participantId,
    name: participantId === 'p-1' ? '林女士' : '周女士',
    text: '换季时更重视保湿，白天又怕厚重。',
    duration: 12,
    createdAt,
  };
}

describe('FGD runtime history', () => {
  it('starting the current question twice preserves its answer, transcript and first start', () => {
    let data = started();
    data = run(
      data,
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: '保湿',
          comment: '换季更在意保湿',
          submittedAt: 3000,
        },
      },
      3000,
    );
    data = run(
      data,
      {
        type: 'add-transcript',
        id: SESSION,
        questionId: 'q-1',
        turn: turn('turn-before'),
      },
      3100,
    );
    const before = structuredClone(data.sessions[0].runs['q-1']);
    const next = run(data, { type: 'start-question', id: SESSION, questionId: 'q-1' }, 9000);
    expect(next.sessions[0].runs['q-1']).toEqual(before);
    expect(data.sessions[0].runs['q-1'].startedAt).toBe(2000);
    expect(next.sessions[0].runs['q-1'].segments).toHaveLength(1);
  });

  it('moving a live question keeps the five elapsed minutes in its original chapter', () => {
    let data = run(
      started(),
      {
        type: 'add-transcript',
        id: SESSION,
        questionId: 'q-1',
        turn: turn('original-turn'),
      },
      3000,
    );
    data = run(
      data,
      {
        type: 'move-question',
        id: SESSION,
        questionId: 'q-1',
        sectionId: 's-2',
        beforeId: 'q-2',
      },
      302000,
    );
    expect(data.sessions[0].questions.find((q) => q.id === 'q-1')?.sectionId).toBe('s-2');
    expect(data.sessions[0].runs['q-1'].segments).toEqual([
      { sectionId: 's-1', startedAt: 2000, endedAt: 302000 },
      { sectionId: 's-2', startedAt: 302000 },
    ]);
    expect(data.sessions[0].runs['q-1'].transcript).toEqual([turn('original-turn')]);
    data = run(
      data,
      {
        type: 'add-transcript',
        id: SESSION,
        questionId: 'q-1',
        turn: turn('new-chapter-turn', 'p-2', 303000),
      },
      303000,
    );
    data = run(data, { type: 'end-session', id: SESSION }, 362000);
    expect(sectionMilliseconds(data.sessions[0], 's-1', 999999)).toBe(300000);
    expect(sectionMilliseconds(data.sessions[0], 's-2', 999999)).toBe(60000);
    expect(data.sessions[0].runs['q-1'].transcript.map((t) => t.id)).toEqual([
      'original-turn',
      'new-chapter-turn',
    ]);
  });

  it('ending a session retains its history and blocks later answer submission', () => {
    let data = run(
      started(),
      {
        type: 'add-transcript',
        id: SESSION,
        questionId: 'q-1',
        turn: turn('keep-turn'),
      },
      3000,
    );
    data = run(
      data,
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: '保湿',
          comment: '白天怕厚重',
          submittedAt: 4000,
        },
      },
      4000,
    );
    data = run(data, { type: 'end-session', id: SESSION }, 12000);
    const ended = structuredClone(data.sessions[0]);
    data = run(
      data,
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: '覆盖旧答案',
          comment: '',
          submittedAt: 15000,
        },
      },
      15000,
    );
    data = run(data, { type: 'end-session', id: SESSION }, 17000);
    expect(data.sessions[0]).toEqual(ended);
    expect(ended.endedAt).toBe(12000);
    expect(ended.runs['q-1'].segments[0].endedAt).toBe(12000);
    expect(ended.runs['q-1'].transcript).toHaveLength(1);
  });

  it('removing someone disconnects them without erasing their answers or transcript', () => {
    let data = run(
      started(),
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: '保湿',
          comment: '已发生的答案',
          submittedAt: 3000,
        },
      },
      3000,
    );
    data = run(
      data,
      {
        type: 'add-transcript',
        id: SESSION,
        questionId: 'q-1',
        turn: turn('retain-turn'),
      },
      3100,
    );
    data = run(data, { type: 'presence', id: SESSION, participantId: 'p-1', online: true }, 3200);
    data = run(data, { type: 'remove-person', id: SESSION, participantId: 'p-1' }, 4000);
    expect(data.sessions[0].participants.find((p) => p.id === 'p-1')).toMatchObject({
      removed: true,
      online: false,
      mic: false,
      camera: false,
    });
    expect(data.sessions[0].seatOrder).not.toContain('p-1');
    expect(data.sessions[0].runs['q-1'].answers['p-1'].comment).toBe('已发生的答案');
    expect(data.sessions[0].runs['q-1'].transcript[0].id).toBe('retain-turn');
    data = run(
      data,
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: '移除后的作答',
          comment: '',
          submittedAt: 5000,
        },
      },
      5000,
    );
    expect(data.sessions[0].runs['q-1'].answers['p-1'].comment).toBe('已发生的答案');
  });

  it('media requests leave devices unchanged until the participant accepts', () => {
    let data = started();
    data = run(
      data,
      {
        type: 'request-media',
        id: SESSION,
        request: {
          id: 'request-mic',
          participantId: 'p-1',
          kind: 'mic',
          enabled: true,
          status: 'pending',
        },
      },
      3000,
    );
    expect(data.sessions[0].participants[0].mic).toBe(false);
    data = run(
      data,
      {
        type: 'respond-media',
        id: SESSION,
        requestId: 'request-mic',
        accepted: true,
      },
      4000,
    );
    expect(data.sessions[0].participants[0].mic).toBe(true);
    expect(data.sessions[0].mediaRequests[0].status).toBe('accepted');
    data = run(
      data,
      {
        type: 'request-media',
        id: SESSION,
        request: {
          id: 'request-mute',
          participantId: 'p-1',
          kind: 'mic',
          enabled: false,
          status: 'pending',
        },
      },
      5000,
    );
    data = run(
      data,
      {
        type: 'respond-media',
        id: SESSION,
        requestId: 'request-mute',
        accepted: false,
      },
      6000,
    );
    expect(data.sessions[0].participants[0].mic).toBe(true);
  });
  it('ignores late media acceptance, device activation and rejoin after the session ended', () => {
    let data = started();
    data = run(
      data,
      {
        type: 'request-media',
        id: SESSION,
        request: {
          id: 'late-mic',
          participantId: 'p-1',
          kind: 'mic',
          enabled: true,
          status: 'pending',
        },
      },
      3000,
    );
    data = run(
      data,
      {
        type: 'request-media',
        id: SESSION,
        request: {
          id: 'late-video',
          participantId: 'p-1',
          kind: 'camera',
          enabled: true,
          status: 'pending',
        },
      },
      3500,
    );
    data = run(data, { type: 'end-session', id: SESSION }, 4000);
    const ended = structuredClone(data.sessions[0]);
    data = run(
      data,
      { type: 'respond-media', id: SESSION, requestId: 'late-mic', accepted: true },
      5000,
    );
    data = run(
      data,
      { type: 'respond-media', id: SESSION, requestId: 'late-video', accepted: true },
      6000,
    );
    data = run(
      data,
      { type: 'set-media', id: SESSION, participantId: 'p-1', kind: 'mic', enabled: true },
      7000,
    );
    data = run(
      data,
      { type: 'set-media', id: SESSION, participantId: 'p-1', kind: 'camera', enabled: true },
      8000,
    );
    data = run(data, { type: 'presence', id: SESSION, participantId: 'p-1', online: true }, 9000);
    expect(data.sessions[0]).toEqual(ended);
    expect(data.sessions[0].participants[0]).toMatchObject({
      online: false,
      mic: false,
      camera: false,
    });
    expect(data.sessions[0].mediaRequests.every((request) => request.status === 'declined')).toBe(
      true,
    );
  });

  it('settles elapsed video playback on question change and clamps the final review position on end', () => {
    let data = run(started(), { type: 'start-question', id: SESSION, questionId: 'q-7' }, 3000);
    data = run(
      data,
      { type: 'playback', id: SESSION, questionId: 'q-7', seconds: 4, playing: true },
      4000,
    );
    data = run(data, { type: 'start-question', id: SESSION, questionId: 'q-8' }, 14000);
    expect(data.sessions[0].runs['q-7']).toMatchObject({
      stimulusSeconds: 14,
      stimulusUpdatedAt: 14000,
      stimulusPlaying: false,
      endedAt: 14000,
    });
    data = run(data, { type: 'start-question', id: SESSION, questionId: 'q-7' }, 16000);
    data = run(
      data,
      { type: 'playback', id: SESSION, questionId: 'q-7', seconds: 28, playing: true },
      17000,
    );
    data = run(data, { type: 'end-session', id: SESSION }, 22000);
    expect(data.sessions[0].runs['q-7']).toMatchObject({
      stimulusSeconds: 30,
      stimulusUpdatedAt: 22000,
      stimulusPlaying: false,
      endedAt: 22000,
    });
    const review = structuredClone(data.sessions[0].runs['q-7']);
    data = run(
      data,
      { type: 'playback', id: SESSION, questionId: 'q-7', seconds: 0, playing: true },
      23000,
    );
    expect(data.sessions[0].runs['q-7']).toEqual(review);
  });
});

describe('append-only prototype journal', () => {
  it('keeps updates from two role windows that loaded the same initial state', () => {
    const storage = new MemoryStorage();
    appendCommand({ type: 'start-session', id: SESSION }, storage);
    appendCommand({ type: 'start-question', id: SESSION, questionId: 'q-1' }, storage);
    const firstWindow = loadPrototype(storage),
      secondWindow = loadPrototype(storage);
    expect(firstWindow.sessions[0].runs['q-1'].answers).toEqual(
      secondWindow.sessions[0].runs['q-1'].answers,
    );
    appendCommand(
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-1',
          value: 'A',
          comment: '窗口甲',
          submittedAt: Date.now(),
        },
      },
      storage,
    );
    appendCommand(
      {
        type: 'submit-answer',
        id: SESSION,
        questionId: 'q-1',
        answer: {
          participantId: 'p-2',
          value: 'B',
          comment: '窗口乙',
          submittedAt: Date.now(),
        },
      },
      storage,
    );
    const merged = loadPrototype(storage).sessions[0].runs['q-1'].answers;
    expect(Object.keys(merged).sort()).toEqual(['p-1', 'p-2']);
    expect(merged['p-1'].comment).toBe('窗口甲');
    expect(merged['p-2'].comment).toBe('窗口乙');
    expect(readCommands(storage)).toHaveLength(4);
  });

  it('does not replay unrelated keys or malformed JSON and orders commands deterministically', () => {
    const storage = new MemoryStorage();
    storage.setItem('other-app-private-data', '{keep this untouched');
    storage.setItem(`${JOURNAL_PREFIX}bad-json`, '{');
    storage.setItem(`${JOURNAL_PREFIX}no-metadata`, '{}');
    storage.setItem(
      `${JOURNAL_PREFIX}later`,
      JSON.stringify(command({ type: 'start-question', id: SESSION, questionId: 'q-1' }, 2000)),
    );
    storage.setItem(
      `${JOURNAL_PREFIX}earlier`,
      JSON.stringify(command({ type: 'start-session', id: SESSION }, 1000)),
    );
    expect(readCommands(storage).map((c) => c.at)).toEqual([1000, 2000]);
    expect(loadPrototype(storage).sessions[0].currentQuestionId).toBe('q-1');
    expect(storage.getItem('other-app-private-data')).toBe('{keep this untouched');
  });
});

describe('store paper-note and session isolation', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T10:00:00+08:00'));
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    useFgdStore.getState().hydrate();
    useFgdStore.getState().startSession(SESSION);
    useFgdStore.getState().startQuestion(SESSION, 'q-1');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  afterAll(() => {
    if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage);
  });

  it('limits successful sends to one per minute and permits the next send after 60 seconds', () => {
    const first = useFgdStore.getState().sendNote(SESSION, OBSERVER, '请追问具体使用场景', 'q-1');
    const blocked = useFgdStore.getState().sendNote(SESSION, OBSERVER, '第二条提示', 'q-1');
    expect(first.ok).toBe(true);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(60);
    expect(useFgdStore.getState().data.sessions[0].notes).toHaveLength(1);
    vi.advanceTimersByTime(60000);
    expect(useFgdStore.getState().sendNote(SESSION, OBSERVER, '一分钟后的新提示', 'q-1').ok).toBe(
      true,
    );
    expect(useFgdStore.getState().data.sessions[0].notes).toHaveLength(2);
  });

  it('retries an offline note with the same ID and preserves its full question context', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const failed = useFgdStore.getState().sendNote(SESSION, OBSERVER, '离线时输入的建议', 'q-1');
    expect(failed.ok).toBe(false);
    expect(failed.noteId).toBeTruthy();
    expect(useFgdStore.getState().data.sessions[0].notes).toMatchObject([
      {
        id: failed.noteId,
        status: 'failed',
        attempts: 1,
        text: '离线时输入的建议',
      },
    ]);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const retried = useFgdStore
      .getState()
      .sendNote(SESSION, OBSERVER, '离线时输入的建议', 'q-1', failed.noteId);
    const notes = useFgdStore.getState().data.sessions[0].notes;
    expect(retried).toMatchObject({ ok: true, noteId: failed.noteId });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      id: failed.noteId,
      attempts: 2,
      status: 'pending',
      observerId: OBSERVER.id,
      questionId: 'q-1',
      questionTitle: '最近一次使用面霜时，哪些体验让你印象深刻？',
    });
  });

  it('keeps answers, paper-note cooldown and processed state scoped to one session', () => {
    const other = useFgdStore.getState().createSession('project-1');
    useFgdStore.getState().startSession(other);
    useFgdStore.getState().startQuestion(other, 'q-1');
    const first = useFgdStore.getState().sendNote(SESSION, OBSERVER, '只给第一场', 'q-1');
    expect(useFgdStore.getState().sendNote(other, OBSERVER, '给另一场的提示', 'q-1').ok).toBe(true);
    useFgdStore.getState().submitAnswer(SESSION, 'q-1', {
      participantId: 'p-1',
      value: '第一场答案',
      comment: '不应串场',
    });
    useFgdStore.getState().handleNote(SESSION, first.noteId!);
    const sessions = useFgdStore.getState().data.sessions;
    expect(sessions.find((s) => s.id === SESSION)?.notes[0].status).toBe('handled');
    expect(sessions.find((s) => s.id === other)?.notes[0]).toMatchObject({
      text: '给另一场的提示',
      status: 'pending',
    });
    expect(sessions.find((s) => s.id === other)?.runs['q-1'].answers).toEqual({});
    expect(useFgdStore.getState().sendNote('missing-session', OBSERVER, '无效场次', 'q-1').ok).toBe(
      false,
    );
  });

  it('rejects note sends after completion while preserving already delivered notes', () => {
    const sent = useFgdStore.getState().sendNote(SESSION, OBSERVER, '会中纸条', 'q-1');
    useFgdStore.getState().endSession(SESSION);
    vi.advanceTimersByTime(60000);
    expect(useFgdStore.getState().sendNote(SESSION, OBSERVER, '结束后不能上行', 'q-1').ok).toBe(
      false,
    );
    expect(useFgdStore.getState().data.sessions[0].notes).toMatchObject([
      { id: sent.noteId, text: '会中纸条', status: 'pending' },
    ]);
  });
});
