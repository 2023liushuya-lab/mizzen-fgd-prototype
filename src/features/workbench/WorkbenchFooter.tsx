'use client';
import { Captions, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Participant, Question, Session } from '@/types/fgd';
import { ParticipantStrip } from './Profile';
import { MeetingToolbar } from './WorkspaceHeader';
import { ConversationPopover, ReactionBubbles } from './Conversations';
import { HostHandFeedback } from './HandQueue';
import styles from './WorkbenchPage.module.css';

export function ParticipantFooter({
  session,
  readonly,
  onProfile,
  question,
  visibleQuestions,
  onQuestion,
  conversation,
  onConversation,
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
  question?: Question;
  visibleQuestions: Question[];
  onQuestion: (id: string) => void;
  conversation?: 'chat' | 'transcript' | null;
  onConversation?: (type: 'chat' | 'transcript' | null) => void;
}) {
  const index = question ? visibleQuestions.indexOf(question) : -1;
  return (
    <div className={styles.leftFooter}>
      <ParticipantStrip session={session} readonly={readonly} onProfile={onProfile} />
      {session.delivery === 'online' && (
        <div className={styles.questionPager} role="group" aria-label="切换浏览题目">
          <button
            className="icon-button"
            aria-label="上一题"
            title="上一题"
            disabled={index < 1}
            onClick={() => question && onQuestion(visibleQuestions[index - 1].id)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="下一题"
            title="下一题"
            disabled={!question || index >= visibleQuestions.length - 1}
            onClick={() => question && onQuestion(visibleQuestions[index + 1].id)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      {readonly && onConversation && (
        <button
          type="button"
          className={styles.observerCaptionBtn}
          aria-expanded={conversation === 'transcript'}
          onClick={() => onConversation(conversation === 'transcript' ? null : 'transcript')}
        >
          <Captions size={16} />
          <span>字幕</span>
        </button>
      )}
    </div>
  );
}

export function HostMeetingControls({
  session,
  conversation,
  onConversation,
  onEnd,
  onHands,
}: {
  session: Session;
  conversation: 'chat' | 'transcript' | null;
  onConversation: (type: 'chat' | 'transcript' | null) => void;
  onEnd: () => void;
  onHands: () => void;
}) {
  return (
    <>
      {session.delivery === 'online' ? (
        <MeetingToolbar
          session={session}
          onHands={onHands}
          onEnd={onEnd}
          onConversation={(type) => onConversation(conversation === type ? null : type)}
        />
      ) : (
        <button
          className={styles.offlineCaptions}
          aria-label="字幕"
          onClick={() => onConversation(conversation === 'transcript' ? null : 'transcript')}
        >
          <Captions size={21} />
        </button>
      )}
      <HostHandFeedback session={session} />
      <ReactionBubbles session={session} />
      {conversation && (
        <ConversationPopover
          session={session}
          type={conversation}
          onClose={() => onConversation(null)}
        />
      )}
    </>
  );
}
