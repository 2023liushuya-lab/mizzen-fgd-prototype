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
}: {
  session: Session;
  readonly: boolean;
  onProfile: (person: Participant) => void;
  question?: Question;
  visibleQuestions: Question[];
  onQuestion: (id: string) => void;
}) {
  const index = question ? visibleQuestions.indexOf(question) : -1;
  return (
    <div className={styles.leftFooter}>
      <ParticipantStrip session={session} readonly={readonly} onProfile={onProfile} />
      <div className={styles.questionPager}>
        <button
          className="icon-button"
          aria-label="上一题"
          disabled={index < 1}
          onClick={() => question && onQuestion(visibleQuestions[index - 1].id)}
        >
          <ChevronLeft size={23} />
        </button>
        <button
          className="icon-button"
          aria-label="下一题"
          disabled={!question || index >= visibleQuestions.length - 1}
          onClick={() => question && onQuestion(visibleQuestions[index + 1].id)}
        >
          <ChevronRight size={23} />
        </button>
      </div>
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
