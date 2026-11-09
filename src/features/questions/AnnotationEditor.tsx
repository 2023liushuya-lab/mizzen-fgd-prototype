'use client';
import { useRef, useState, type PointerEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Mark, MarkColor } from '@/types/fgd';
import { uid } from '@/lib/utils';
import { ConceptArtwork, MarkShapes, markColors, markLabels } from './ConceptCanvas';
import styles from './questions.module.css';

export function AnnotationEditor({
  participantId,
  marks,
  onChange,
  image,
}: {
  participantId: string;
  marks: Mark[];
  onChange: (marks: Mark[]) => void;
  image?: string;
}) {
  const [color, setColor] = useState<MarkColor>('like');
  const [draft, setDraft] = useState<Mark | null>(null);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const latest = useRef<Mark | null>(null);
  const coordinates = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };
  function down(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    anchor.current = coordinates(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    latest.current = null;
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!anchor.current) return;
    const pt = coordinates(event);
    const start = anchor.current;
    const mark: Mark = {
      id: 'draft',
      participantId,
      x: Math.min(start.x, pt.x),
      y: Math.min(start.y, pt.y),
      width: Math.abs(pt.x - start.x),
      height: Math.abs(pt.y - start.y),
      color,
    };
    latest.current = mark;
    setDraft(mark);
  }
  function up() {
    if (latest.current && latest.current.width > 1 && latest.current.height > 1)
      onChange([...marks, { ...latest.current, id: uid('mark') }]);
    anchor.current = null;
    latest.current = null;
    setDraft(null);
  }
  return (
    <div className={styles.annotationEditor}>
      <div className={styles.annotationToolbar} role="group" aria-label="选择标注颜色">
        {(['like', 'dislike', 'confused'] as const).map((item) => (
          <button
            type="button"
            key={item}
            className={color === item ? styles.colorActive : ''}
            onClick={() => setColor(item)}
            aria-pressed={color === item}
          >
            <i style={{ background: markColors[item] }} />
            {markLabels[item]}
          </button>
        ))}
        <span className="muted">拖动圈选</span>
        <button
          type="button"
          className={styles.clearMarks}
          onClick={() => onChange([])}
          disabled={!marks.length}
        >
          <Trash2 size={13} />
          清空
        </button>
      </div>
      <svg
        className={styles.drawCanvas}
        viewBox="0 0 800 500"
        aria-label="拖动圈选图片区域"
        role="img"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          anchor.current = null;
          setDraft(null);
          latest.current = null;
        }}
      >
        {image ? (
          <image
            href={image}
            x="0"
            y="0"
            width="800"
            height="500"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <ConceptArtwork />
        )}
        <MarkShapes
          marks={draft ? [...marks, draft] : marks}
          onRemove={(id) => onChange(marks.filter((m) => m.id !== id))}
        />
      </svg>
      {marks.length > 0 && (
        <div className={styles.markList}>
          {marks.map((m, i) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onChange(marks.filter((x) => x.id !== m.id))}
            >
              <i style={{ background: markColors[m.color] }} />
              {markLabels[m.color]} {i + 1}
              <Trash2 size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
