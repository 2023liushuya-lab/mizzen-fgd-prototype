'use client';
import { UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { backgroundOf } from '@/lib/utils';
import type { Answer, Participant, Question, Session } from '@/types/fgd';
import { ConceptCanvas } from './ConceptCanvas';
import styles from './questions.module.css';

export type LightboxData = { title: string; image?: string; marks?: Answer['marks'] };

export function ResultDialogs({
  session,
  profile,
  onProfileChange,
  lightbox,
  onImageChange,
}: {
  session: Session;
  profile: Participant | null;
  onProfileChange: (person: Participant | null) => void;
  lightbox: LightboxData | null;
  onImageChange: (image: LightboxData | null) => void;
}) {
  return (
    <>
      <Modal
        open={Boolean(profile)}
        onOpenChange={(open) => !open && onProfileChange(null)}
        title="受访者背景"
      >
        {profile && (
          <div className={styles.profile}>
            <span className={styles.profileAvatar} style={{ background: profile.color }}>
              <UserRound size={28} />
            </span>
            <h3>{profile.name}</h3>
            <span className="badge">
              {session.delivery === 'offline'
                ? '现场'
                : profile.removed
                  ? '已离场'
                  : profile.online
                    ? '在线'
                    : '未到场'}
            </span>
            <p>{backgroundOf(profile)}</p>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(lightbox)}
        onOpenChange={(open) => !open && onImageChange(null)}
        title={lightbox?.title || '图片'}
        wide
      >
        {lightbox && (
          <ConceptCanvas
            image={lightbox.image}
            marks={lightbox.marks}
            people={session.participants}
          />
        )}
      </Modal>
    </>
  );
}
