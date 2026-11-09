export type Delivery = 'online' | 'offline';
export type Role = 'host' | 'participant' | 'observer';
export type Phase = 'pending' | 'live' | 'ended';
export type QuestionType =
  | '访谈题'
  | '单选题'
  | '多选题'
  | '量表题'
  | '矩阵题'
  | '标注题'
  | '陈述题'
  | '排序题'
  | '级联选择题'
  | '比重题'
  | '图片上传题';
export type AnswerValue = string | number | string[] | number[] | Record<string, string | number>;
export interface Section {
  id: string;
  name: string;
  minutes: number;
}
export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  guide: string;
  sectionId: string;
  plannedMinutes: number;
  options?: string[];
  items?: string[];
  matrixRows?: string[];
  scale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
    labels?: Record<string, string>;
  };
  stimulus?: { kind: 'video'; label: string; duration: number };
  sampleAnswers?: AnswerValue[];
  sampleSummaries: string[];
  summary: string;
}
export interface Participant {
  id: string;
  name: string;
  age: string;
  skin: string;
  notes: string;
  color: string;
  voiceEnabled: boolean;
  online: boolean;
  mic: boolean;
  camera: boolean;
  removed?: boolean;
  connectionId?: string;
  handRaisedAt?: number | null;
  handResponse?: { kind: 'called' | 'speaking' | 'declined' | 'cancelled' | 'lowered'; at: number };
  forceMutedAt?: number;
}
export type MarkColor = 'like' | 'dislike' | 'confused';
export interface Mark {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: MarkColor;
  participantId: string;
}
export interface Answer {
  participantId: string;
  value: AnswerValue;
  comment: string;
  submittedAt: number;
  marks?: Mark[];
  image?: string;
}
export interface Transcript {
  id: string;
  participantId: string;
  name: string;
  text: string;
  createdAt: number;
  duration: number;
  translation?: string;
}
export interface DiscussionSegment {
  sectionId: string;
  startedAt: number;
  endedAt?: number;
}
export interface QuestionRun {
  questionId: string;
  startedAt: number;
  endedAt?: number;
  answers: Record<string, Answer>;
  transcript: Transcript[];
  segments: DiscussionSegment[];
  stimulusSeconds: number;
  stimulusPlaying: boolean;
  stimulusUpdatedAt?: number;
}
export interface PaperNote {
  id: string;
  observerId: string;
  observerName: string;
  text: string;
  questionId: string | null;
  questionTitle: string;
  createdAt: number;
  status: 'pending' | 'handled' | 'failed';
  attempts: number;
}
export interface ChatMessage {
  id: string;
  senderId: string;
  name: string;
  text: string;
  createdAt: number;
  reaction?: boolean;
}
export interface MediaRequest {
  id: string;
  participantId: string;
  kind: 'mic' | 'camera';
  fromHand?: boolean;
  enabled: boolean;
  status: 'pending' | 'accepted' | 'declined';
}
export interface Project {
  id: string;
  title: string;
  objective: string;
  published: boolean;
  questions: Question[];
  sections: Section[];
  createdAt: number;
}
export interface Session {
  id: string;
  projectId: string;
  title: string;
  delivery: Delivery;
  roomCode: string;
  observerToken: string;
  phase: Phase;
  participants: Participant[];
  seatOrder: string[];
  questions: Question[];
  sections: Section[];
  currentQuestionId: string | null;
  runs: Record<string, QuestionRun>;
  notes: PaperNote[];
  chats: ChatMessage[];
  mediaRequests: MediaRequest[];
  startedAt?: number;
  endedAt?: number;
  hostVoiceEnabled?: boolean;
  hostMic?: boolean;
  hostCamera?: boolean;
  projection?: { questionId: string; displayedAt: number } | null;
}
export interface FgdData {
  schemaVersion: 1;
  projects: Project[];
  sessions: Session[];
}
export interface Identity {
  id: string;
  name: string;
}
export interface NoteResult {
  ok: boolean;
  error?: string;
  noteId?: string;
  retryAfter?: number;
}
export interface FgdActions {
  setHand: (id: string, participantId: string, raised: boolean) => void;
  inviteHand: (id: string, participantId: string) => void;
  clearHands: (id: string) => void;
  muteAll: (id: string) => void;
  setHostMedia: (id: string, kind: 'hostMic' | 'hostCamera', enabled: boolean) => void;
  hydrate: () => void;
  createProject: (title: string, objective: string) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  createSession: (projectId: string) => string;
  updateSession: (id: string, patch: Partial<Session>) => void;
  startSession: (id: string) => NoteResult;
  startQuestion: (id: string, questionId: string) => void;
  moveQuestion: (id: string, questionId: string, sectionId: string, beforeId?: string) => void;
  submitAnswer: (id: string, questionId: string, answer: Omit<Answer, 'submittedAt'>) => void;
  addTranscript: (
    id: string,
    questionId: string,
    participantId: string,
    text: string,
    duration?: number,
  ) => void;
  correctSpeaker: (
    id: string,
    questionId: string,
    transcriptId: string,
    participantId: string,
  ) => void;
  sendNote: (
    id: string,
    identity: Identity,
    text: string,
    questionId: string | null,
    retryId?: string,
  ) => NoteResult;
  handleNote: (id: string, noteId: string) => void;
  sendChat: (id: string, senderId: string, name: string, text: string, reaction?: boolean) => void;
  requestMedia: (
    id: string,
    participantId: string,
    kind: 'mic' | 'camera',
    enabled: boolean,
  ) => void;
  respondMedia: (id: string, requestId: string, accepted: boolean) => void;
  setParticipantMedia: (
    id: string,
    participantId: string,
    kind: 'mic' | 'camera',
    enabled: boolean,
  ) => void;
  joinParticipant: (id: string, participantId: string) => void;
  leaveParticipant: (id: string, participantId: string) => void;
  removeParticipant: (id: string, participantId: string) => void;
  setPlayback: (id: string, questionId: string, seconds: number, playing: boolean) => void;
  setProjection: (id: string, questionId: string | null) => void;
  endSession: (id: string) => void;
  fillDemoAnswers: (id: string, questionId: string) => void;
}
