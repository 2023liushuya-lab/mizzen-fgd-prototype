import type { Command } from '@/types/commands';
import type { FgdData, Session } from '@/types/fgd';
function closeCurrent(session: Session, at: number) {
  const run = session.currentQuestionId ? session.runs[session.currentQuestionId] : undefined;
  if (!run) return;
  run.endedAt = at;
  const duration =
    session.questions.find((q) => q.id === run.questionId)?.stimulus?.duration ?? Infinity;
  if (run.stimulusPlaying && run.stimulusUpdatedAt)
    run.stimulusSeconds = Math.min(
      duration,
      run.stimulusSeconds + Math.max(0, (at - run.stimulusUpdatedAt) / 1000),
    );
  run.stimulusUpdatedAt = at;
  run.stimulusPlaying = false;
  run.segments.forEach((segment) => {
    if (!segment.endedAt) segment.endedAt = at;
  });
}
/** Pure domain reducer. The same commands drive all three roles. */
export function applyCommand(current: FgdData, command: Command): FgdData {
  const data = structuredClone(current);
  if (command.type === 'create-project') {
    if (!data.projects.some((p) => p.id === command.project.id))
      data.projects.push(command.project);
    return data;
  }
  if (command.type === 'update-project') {
    const p = data.projects.find((p) => p.id === command.id);
    if (p) Object.assign(p, command.patch, { id: p.id });
    return data;
  }
  if (command.type === 'create-session') {
    if (!data.sessions.some((s) => s.id === command.session.id))
      data.sessions.push(command.session);
    return data;
  }
  const s = data.sessions.find((s) => s.id === command.id);
  if (!s) return current;
  switch (command.type) {
    case 'hand': {
      const p = s.participants.find((p) => p.id === command.participantId && !p.removed);
      if (
        s.phase !== 'live' ||
        s.delivery !== 'online' ||
        !s.currentQuestionId ||
        !p ||
        (command.raised && !p.online)
      )
        break;
      p.handRaisedAt = command.raised ? p.handRaisedAt || command.at : null;
      p.handResponse = command.raised ? undefined : { kind: 'cancelled', at: command.at };
      if (!command.raised)
        s.mediaRequests.forEach((r) => {
          if (r.participantId === p.id && r.fromHand && r.status === 'pending')
            r.status = 'declined';
        });
      break;
    }
    case 'invite-hand': {
      const p = s.participants.find((p) => p.id === command.participantId && !p.removed);
      if (s.phase !== 'live' || !p?.online || !p.handRaisedAt) break;
      if (p.mic) {
        p.handRaisedAt = null;
        p.handResponse = { kind: 'speaking', at: command.at };
        break;
      }
      if (
        s.mediaRequests.some(
          (r) => r.participantId === p.id && r.fromHand && r.status === 'pending',
        )
      )
        break;
      p.handResponse = { kind: 'called', at: command.at };
      s.mediaRequests.push({
        id: command.requestId,
        participantId: p.id,
        kind: 'mic',
        enabled: true,
        fromHand: true,
        status: 'pending',
      });
      break;
    }
    case 'clear-hands':
      if (s.phase === 'live') {
        s.participants.forEach((p) => {
          if (p.handRaisedAt) {
            p.handRaisedAt = null;
            p.handResponse = { kind: 'lowered', at: command.at };
          }
        });
        s.mediaRequests.forEach((r) => {
          if (r.fromHand && r.status === 'pending') r.status = 'declined';
        });
      }
      break;
    case 'mute-all':
      if (s.phase === 'live') {
        s.participants.forEach((p) => {
          if (p.online && !p.removed) {
            p.mic = false;
            p.forceMutedAt = command.at;
          }
        });
        s.mediaRequests.forEach((r) => {
          if (r.kind === 'mic' && r.status === 'pending') r.status = 'declined';
        });
      }
      break;
    case 'host-media':
      if (s.phase !== 'ended') s[command.kind] = command.enabled;
      break;

    case 'update-session':
      Object.assign(s, command.patch, { id: s.id, projectId: s.projectId });
      break;
    case 'start-session':
      if (s.phase === 'pending') {
        s.phase = 'live';
        s.startedAt = command.at;
      }
      break;
    case 'start-question': {
      if (
        s.phase !== 'live' ||
        !s.questions.some((q) => q.id === command.questionId) ||
        s.currentQuestionId === command.questionId
      )
        break;
      if (!Object.keys(s.runs).length) s.startedAt = command.at;
      closeCurrent(s, command.at);
      s.currentQuestionId = command.questionId;
      const q = s.questions.find((q) => q.id === command.questionId)!;
      const run = s.runs[q.id] ?? {
        questionId: q.id,
        startedAt: command.at,
        answers: {},
        transcript: [],
        segments: [],
        stimulusSeconds: 0,
        stimulusPlaying: false,
      };
      run.endedAt = undefined;
      run.segments.push({ sectionId: q.sectionId, startedAt: command.at });
      s.runs[q.id] = run;
      s.projection = null;
      break;
    }
    case 'move-question': {
      const q = s.questions.find((q) => q.id === command.questionId);
      if (
        !q ||
        !s.sections.some((sec) => sec.id === command.sectionId) ||
        command.beforeId === q.id
      )
        break;
      const oldSection = q.sectionId;
      q.sectionId = command.sectionId;
      s.questions = s.questions.filter((item) => item.id !== q.id);
      const before = s.questions.findIndex((item) => item.id === command.beforeId);
      if (before >= 0) s.questions.splice(before, 0, q);
      else {
        const after = s.questions.map((item) => item.sectionId).lastIndexOf(command.sectionId);
        s.questions.splice(after < 0 ? s.questions.length : after + 1, 0, q);
      }
      if (s.phase === 'live' && s.currentQuestionId === q.id && oldSection !== q.sectionId) {
        const run = s.runs[q.id];
        run?.segments.forEach((seg) => {
          if (!seg.endedAt) seg.endedAt = command.at;
        });
        run?.segments.push({ sectionId: q.sectionId, startedAt: command.at });
      }
      break;
    }
    case 'submit-answer': {
      if (
        s.phase !== 'live' ||
        s.currentQuestionId !== command.questionId ||
        !s.participants.some((p) => p.id === command.answer.participantId && !p.removed)
      )
        break;
      const run = s.runs[command.questionId];
      if (run) run.answers[command.answer.participantId] = command.answer;
      break;
    }
    case 'add-transcript':
      if (s.phase === 'live' && s.currentQuestionId === command.questionId)
        s.runs[command.questionId]?.transcript.push(command.turn);
      break;
    case 'correct-speaker': {
      const turn = s.runs[command.questionId]?.transcript.find(
          (t) => t.id === command.transcriptId,
        ),
        p = s.participants.find((p) => p.id === command.participantId);
      if (turn && p) {
        turn.participantId = p.id;
        turn.name = p.name;
      }
      break;
    }
    case 'send-note': {
      if (s.phase !== 'live') break;
      const existing = s.notes.find((n) => n.id === command.note.id);
      if (existing) {
        if (existing.status === 'failed') Object.assign(existing, command.note);
      } else s.notes.push(command.note);
      break;
    }
    case 'handle-note': {
      const note = s.notes.find((n) => n.id === command.noteId);
      if (note && note.status !== 'failed') note.status = 'handled';
      break;
    }
    case 'send-chat':
      if (s.phase === 'live') s.chats.push(command.message);
      break;
    case 'request-media':
      if (
        s.phase === 'live' &&
        s.participants.some((p) => p.id === command.request.participantId && !p.removed)
      )
        s.mediaRequests.push(command.request);
      break;
    case 'respond-media': {
      const request = s.mediaRequests.find((r) => r.id === command.requestId);
      if (s.phase !== 'ended' && request && request.status === 'pending') {
        request.status = command.accepted ? 'accepted' : 'declined';
        const p = s.participants.find((p) => p.id === request.participantId && !p.removed);
        if (command.accepted && p) p[request.kind] = request.enabled;
        if (p && request.fromHand) {
          p.handResponse = { kind: command.accepted ? 'speaking' : 'declined', at: command.at };
          if (command.accepted) p.handRaisedAt = null;
        }
      }
      break;
    }
    case 'set-media': {
      if (s.phase === 'ended') break;
      const p = s.participants.find((p) => p.id === command.participantId && !p.removed);
      if (p) {
        p[command.kind] = command.enabled;
        if (command.kind === 'mic' && command.enabled && p.handRaisedAt) {
          p.handRaisedAt = null;
          p.handResponse = { kind: 'speaking', at: command.at };
        }
      }
      break;
    }
    case 'presence': {
      if (s.phase === 'ended' && command.online) break;
      const p = s.participants.find((p) => p.id === command.participantId && !p.removed);
      if (
        p &&
        (command.online || !command.connectionId || p.connectionId === command.connectionId)
      ) {
        p.online = command.online;
        if (command.online && command.connectionId) p.connectionId = command.connectionId;
      }
      break;
    }
    case 'remove-person': {
      const p = s.participants.find((p) => p.id === command.participantId);
      if (p) {
        p.handRaisedAt = null;
        p.removed = true;
        p.online = false;
        p.mic = false;
        p.camera = false;
        s.seatOrder = s.seatOrder.filter((id) => id !== p.id);
      }
      break;
    }
    case 'playback': {
      const run = s.runs[command.questionId];
      if (run && s.phase === 'live') {
        run.stimulusSeconds = Math.max(0, command.seconds);
        run.stimulusPlaying = command.playing;
        run.stimulusUpdatedAt = command.at;
      }
      break;
    }
    case 'projection':
      if (s.phase === 'live' && (!command.questionId || s.runs[command.questionId]))
        s.projection = command.questionId
          ? { questionId: command.questionId, displayedAt: command.at }
          : null;
      break;
    case 'end-session':
      if (s.phase !== 'ended') {
        closeCurrent(s, command.at);
        s.phase = 'ended';
        s.participants.forEach((p) => {
          p.handRaisedAt = null;
        });
        s.mediaRequests.forEach((r) => {
          if (r.status === 'pending') r.status = 'declined';
        });
        s.endedAt = command.at;
        s.projection = null;
        s.participants.forEach((p) => {
          p.online = false;
          p.mic = false;
          p.camera = false;
        });
      }
      break;
  }
  return data;
}
