import type {
  Answer,
  ChatMessage,
  Identity,
  MediaRequest,
  PaperNote,
  Project,
  Session,
  Transcript,
} from './fgd';
export type CommandPayload =
  | { type: 'hand'; id: string; participantId: string; raised: boolean }
  | { type: 'invite-hand'; id: string; participantId: string; requestId: string }
  | { type: 'clear-hands'; id: string }
  | { type: 'mute-all'; id: string }
  | { type: 'host-media'; id: string; kind: 'hostMic' | 'hostCamera'; enabled: boolean }
  | { type: 'create-project'; project: Project }
  | { type: 'update-project'; id: string; patch: Partial<Project> }
  | { type: 'create-session'; session: Session }
  | { type: 'update-session'; id: string; patch: Partial<Session> }
  | { type: 'start-session'; id: string }
  | { type: 'start-question'; id: string; questionId: string }
  | { type: 'move-question'; id: string; questionId: string; sectionId: string; beforeId?: string }
  | { type: 'submit-answer'; id: string; questionId: string; answer: Answer }
  | { type: 'add-transcript'; id: string; questionId: string; turn: Transcript }
  | {
      type: 'correct-speaker';
      id: string;
      questionId: string;
      transcriptId: string;
      participantId: string;
    }
  | { type: 'send-note'; id: string; note: PaperNote }
  | { type: 'read-note'; id: string; noteId: string }
  | { type: 'handle-note'; id: string; noteId: string }
  | { type: 'pin-note'; id: string; noteId: string; pinned: boolean }
  | { type: 'send-chat'; id: string; message: ChatMessage }
  | { type: 'request-media'; id: string; request: MediaRequest }
  | { type: 'respond-media'; id: string; requestId: string; accepted: boolean }
  | {
      type: 'set-media';
      id: string;
      participantId: string;
      kind: 'mic' | 'camera';
      enabled: boolean;
    }
  | { type: 'presence'; id: string; participantId: string; online: boolean; connectionId?: string }
  | { type: 'remove-person'; id: string; participantId: string }
  | { type: 'playback'; id: string; questionId: string; seconds: number; playing: boolean }
  | { type: 'projection'; id: string; questionId: string | null }
  | { type: 'end-session'; id: string };
export type Command = CommandPayload & { commandId: string; at: number };
