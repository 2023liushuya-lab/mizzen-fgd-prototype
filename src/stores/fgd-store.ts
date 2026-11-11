'use client';
import { create } from 'zustand';
import type { CommandPayload } from '@/types/commands';
import type { FgdActions, FgdData, NoteResult, Session } from '@/types/fgd';
import { questions, sections } from '@/data/questions';
import { demoParticipants } from '@/data/seed';
import { appendCommand, JOURNAL_PREFIX, loadPrototype } from '@/lib/prototype-repository';
import { uid } from '@/lib/utils';
type Store = FgdActions & { data: FgdData; ready: boolean; error: string | null };
const empty: FgdData = { schemaVersion: 1, projects: [], sessions: [] };
let subscribed = false;
export const useFgdStore = create<Store>((set, get) => {
  const latest = () =>
    typeof window === 'undefined' ? get().data : loadPrototype(window.localStorage);
  const commit = (payload: CommandPayload) => {
    appendCommand(payload, window.localStorage);
    const data = latest();
    set({ data, error: null });
    return data;
  };
  const session = (id: string) => latest().sessions.find((s) => s.id === id);
  const safeCommit = (payload: CommandPayload) => {
    try {
      return commit(payload);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  };
  return {
    setHand(id, participantId, raised) {
      safeCommit({ type: 'hand', id, participantId, raised });
    },
    inviteHand(id, participantId) {
      safeCommit({ type: 'invite-hand', id, participantId, requestId: uid('request') });
    },
    clearHands(id) {
      safeCommit({ type: 'clear-hands', id });
    },
    muteAll(id) {
      safeCommit({ type: 'mute-all', id });
    },
    setHostMedia(id, kind, enabled) {
      safeCommit({ type: 'host-media', id, kind, enabled });
    },
    data: empty,
    ready: false,
    error: null,
    hydrate() {
      set({ data: latest(), ready: true });
      if (!subscribed) {
        subscribed = true;
        window.addEventListener('storage', (event) => {
          if (event.key?.startsWith(JOURNAL_PREFIX)) set({ data: latest() });
        });
      }
    },
    createProject(title, objective) {
      const id = uid('project');
      safeCommit({
        type: 'create-project',
        project: {
          id,
          title,
          objective,
          published: false,
          questions: structuredClone(questions),
          sections: structuredClone(sections),
          createdAt: Date.now(),
        },
      });
      return id;
    },
    updateProject(id, patch) {
      safeCommit({ type: 'update-project', id, patch });
    },
    createSession(projectId) {
      const p = latest().projects.find((p) => p.id === projectId);
      if (!p) throw new Error('找不到研究项目');
      const id = uid('session'),
        count = latest().sessions.filter((s) => s.projectId === projectId).length;
      const s: Session = {
        id,
        projectId,
        title: `${p.title} · 第 ${count + 1} 场`,
        delivery: 'online',
        roomCode: String(Math.floor(100000 + Math.random() * 900000)),
        observerToken: uid('observer'),
        phase: 'pending',
        participants: demoParticipants(),
        seatOrder: demoParticipants().map((p) => p.id),
        questions: structuredClone(p.questions),
        sections: structuredClone(p.sections),
        currentQuestionId: null,
        runs: {},
        notes: [],
        chats: [],
        mediaRequests: [],
        projection: null,
      };
      safeCommit({ type: 'create-session', session: s });
      return id;
    },
    updateSession(id, patch) {
      safeCommit({ type: 'update-session', id, patch });
    },
    startSession(id) {
      const s = session(id);
      if (!s) return { ok: false, error: '场次不存在' };
      if (s.phase === 'ended') return { ok: false, error: '本场已结束，请进入复盘' };
      if (s.phase === 'live') return { ok: true };
      const people = s.participants.filter((p) => !p.removed);
      if (!people.length) return { ok: false, error: '请先导入或添加受访者' };
      if (s.delivery === 'offline' && (!s.hostVoiceEnabled || people.some((p) => !p.voiceEnabled)))
        return { ok: false, error: '请先录制主持人与所有受访者的声纹' };
      safeCommit({ type: 'start-session', id });
      return { ok: true };
    },
    startQuestion(id, questionId) {
      safeCommit({ type: 'start-question', id, questionId });
    },
    moveQuestion(id, questionId, sectionId, beforeId) {
      safeCommit({ type: 'move-question', id, questionId, sectionId, beforeId });
    },
    submitAnswer(id, questionId, answer) {
      safeCommit({
        type: 'submit-answer',
        id,
        questionId,
        answer: { ...answer, submittedAt: Date.now() },
      });
    },
    addTranscript(id, questionId, participantId, text, duration = 8) {
      const s = session(id),
        p = s?.participants.find((p) => p.id === participantId);
      if (!p || !text.trim()) return;
      safeCommit({
        type: 'add-transcript',
        id,
        questionId,
        turn: {
          id: uid('turn'),
          participantId,
          name: p.name,
          text: text.trim(),
          createdAt: Date.now(),
          duration,
        },
      });
    },
    correctSpeaker(id, questionId, transcriptId, participantId) {
      safeCommit({ type: 'correct-speaker', id, questionId, transcriptId, participantId });
    },
    sendNote(id, identity, text, questionId = null, retryId) {
      const s = session(id);
      if (!s || s.phase === 'ended') return { ok: false, error: '当前无法发送小纸条' };
      if (!text.trim() || text.trim().length > 120)
        return { ok: false, error: '请填写 1–120 字的追问建议' };
      const success = s.notes
        .filter((n) => n.observerId === identity.id && n.status !== 'failed')
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      const remaining = success ? 60000 - (Date.now() - success.createdAt) : 0;
      if (remaining > 0)
        return {
          ok: false,
          error: `请在 ${Math.ceil(remaining / 1000)} 秒后再发`,
          retryAfter: Math.ceil(remaining / 1000),
        };
      const old = retryId
        ? s.notes.find((n) => n.id === retryId && n.observerId === identity.id)
        : undefined;
      const noteId = old?.id || uid('note'),
        failed = !navigator.onLine;
      try {
        safeCommit({
          type: 'send-note',
          id,
          note: {
            id: noteId,
            observerId: identity.id,
            observerName: identity.name,
            text: text.trim(),
            questionId,
            questionTitle: s.questions.find((q) => q.id === questionId)?.title || '整场访谈',
            createdAt: Date.now(),
            status: failed ? 'failed' : 'pending',
            attempts: (old?.attempts || 0) + 1,
          },
        });
      } catch (error) {
        return { ok: false, error: (error as Error).message, noteId };
      }
      return failed
        ? { ok: false, error: '网络已离线，草稿已保留，可恢复后重试。', noteId }
        : { ok: true, noteId };
    },
    pinNote(id, noteId, pinned) {
      safeCommit({ type: 'pin-note', id, noteId, pinned });
    },
    readNote(id, noteId) {
      safeCommit({ type: 'read-note', id, noteId });
    },
    handleNote(id, noteId) {
      safeCommit({ type: 'handle-note', id, noteId });
    },
    sendChat(id, senderId, name, text, reaction = false) {
      if (text.trim())
        safeCommit({
          type: 'send-chat',
          id,
          message: {
            id: uid('chat'),
            senderId,
            name,
            text: text.trim(),
            createdAt: Date.now(),
            reaction,
          },
        });
    },
    requestMedia(id, participantId, kind, enabled) {
      safeCommit({
        type: 'request-media',
        id,
        request: { id: uid('request'), participantId, kind, enabled, status: 'pending' },
      });
    },
    respondMedia(id, requestId, accepted) {
      safeCommit({ type: 'respond-media', id, requestId, accepted });
    },
    setParticipantMedia(id, participantId, kind, enabled) {
      safeCommit({ type: 'set-media', id, participantId, kind, enabled });
    },
    joinParticipant(id, participantId) {
      const key = 'fgd-client:' + id;
      let connectionId = sessionStorage.getItem(key);
      if (!connectionId) {
        connectionId = uid('connection');
        sessionStorage.setItem(key, connectionId);
      }
      safeCommit({ type: 'presence', id, participantId, online: true, connectionId });
    },
    leaveParticipant(id, participantId) {
      safeCommit({
        type: 'presence',
        id,
        participantId,
        online: false,
        connectionId: sessionStorage.getItem('fgd-client:' + id) || undefined,
      });
    },
    removeParticipant(id, participantId) {
      safeCommit({ type: 'remove-person', id, participantId });
    },
    setPlayback(id, questionId, seconds, playing) {
      safeCommit({ type: 'playback', id, questionId, seconds, playing });
    },
    setProjection(id, questionId) {
      safeCommit({ type: 'projection', id, questionId });
    },
    endSession(id) {
      safeCommit({ type: 'end-session', id });
    },
    fillDemoAnswers(id, questionId) {
      const s = session(id),
        q = s?.questions.find((q) => q.id === questionId);
      if (!s || !q || s.phase !== 'live') return;
      s.participants
        .filter((p) => !p.removed)
        .forEach((p, i) => {
          const comment = q.sampleSummaries[i % q.sampleSummaries.length] || '演示受访者回答';
          get().submitAnswer(id, questionId, {
            participantId: p.id,
            value: q.sampleAnswers?.[i % q.sampleAnswers.length] ?? comment,
            comment,
            marks:
              q.type === '标注题'
                ? [
                    {
                      id: uid('mark'),
                      x: 38 + i * 2.5,
                      y: 39 + i * 4,
                      width: 35,
                      height: 10,
                      color: i % 2 ? 'confused' : 'like',
                      participantId: p.id,
                    },
                  ]
                : undefined,
          });
          get().addTranscript(id, questionId, p.id, comment, 10 + i * 3);
        });
    },
  };
});
