'use client';
import type { Participant } from '@/types/fgd';
import styles from './questions.module.css';

export function PersonName({
  person,
  onOpen,
}: {
  person: Participant;
  onOpen: (person: Participant) => void;
}) {
  return (
    <button
      className={styles.personName}
      onClick={() => onOpen(person)}
      aria-label={`查看${person.name}的背景信息`}
    >
      <span style={{ color: person.color, borderColor: `${person.color}66` }}>
        {person.name.slice(0, 1)}
      </span>
      <strong>{person.name}</strong>
    </button>
  );
}
