'use client';
import type { Mark, Participant } from '@/types/fgd';
import styles from './questions.module.css';

export const markColors = { like: '#386db7', dislike: '#c75d57', confused: '#c7a343' };
export const markLabels = { like: '喜欢', dislike: '不喜欢', confused: '困惑' };

export function ConceptArtwork() {
  return (
    <g>
      <rect width="800" height="500" fill="#f5f4ef" />
      <text x="45" y="53" fontSize="14" fill="#7b8182">
        CONCEPT 01 / 概念示意
      </text>
      <text x="45" y="98" fontSize="30" fill="#002554" fontWeight="600">
        冰绽凝霜
      </text>
      <text x="45" y="130" fontSize="15" fill="#6e7881">
        轻盈的日常保湿体验
      </text>
      <rect x="63" y="211" width="182" height="177" rx="30" fill="#dce6e4" />
      <rect x="69" y="194" width="170" height="43" rx="10" fill="#fffefa" stroke="#c7cfcb" />
      <text x="101" y="293" fontSize="20" fill="#30565c">
        HYDRA
      </text>
      <text x="99" y="322" fontSize="11" fill="#587178">
        DAILY CREAM
      </text>
      <text x="322" y="230" fontSize="27" fill="#002554">
        清爽不黏
      </text>
      <text x="322" y="262" fontSize="14" fill="#6e7881">
        轻盈质地，贴近日常使用习惯
      </text>
      <text x="322" y="307" fontSize="27" fill="#002554">
        持续修护
      </text>
      <text x="322" y="339" fontSize="14" fill="#6e7881">
        为换季干燥肌肤提供保湿护理
      </text>
      <text x="322" y="389" fontSize="15" fill="#6e7881">
        建议使用量：每次约一粒珍珠大小
      </text>
      <path d="M45 433H755" stroke="#d7d8d1" />
      <text x="45" y="464" fontSize="12" fill="#7b8182">
        虚构概念素材 · 用于布局与标注演示
      </text>
    </g>
  );
}

export function MarkShapes({
  marks,
  people = [],
  onRemove,
}: {
  marks: Mark[];
  people?: Participant[];
  onRemove?: (id: string) => void;
}) {
  return (
    <>
      {marks.map((mark) => {
        const person = people.find((p) => p.id === mark.participantId);
        const label = `${person?.name || '我'} · ${markLabels[mark.color]}`;
        return (
          <g
            key={mark.id}
            className={styles.marker}
            tabIndex={0}
            aria-label={label}
            onDoubleClick={() => onRemove?.(mark.id)}
          >
            <rect
              x={mark.x * 8}
              y={mark.y * 5}
              width={mark.width * 8}
              height={mark.height * 5}
              fill={markColors[mark.color]}
              fillOpacity=".1"
              stroke={markColors[mark.color]}
              strokeWidth="3"
              rx="6"
            />
            <title>
              {label}
              {onRemove ? ' · 双击删除' : ''}
            </title>
            <g className={styles.markTooltip}>
              <rect
                x={Math.min(mark.x * 8, 620)}
                y={Math.max(0, mark.y * 5 - 32)}
                width="174"
                height="26"
                rx="5"
                fill="#002554"
              />
              <text
                x={Math.min(mark.x * 8, 620) + 9}
                y={Math.max(0, mark.y * 5 - 32) + 18}
                fill="#fffefa"
                fontSize="13"
              >
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}

export function ConceptCanvas({
  marks = [],
  people = [],
  image,
  onClick,
}: {
  marks?: Mark[];
  people?: Participant[];
  image?: string;
  onClick?: () => void;
}) {
  return (
    <svg
      className={styles.conceptCanvas}
      viewBox="0 0 800 500"
      role="img"
      aria-label={image ? '上传图片与圈选标记' : '统一概念底图与全员圈选标记'}
      onClick={onClick}
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
      <MarkShapes marks={marks} people={people} />
    </svg>
  );
}

export function MarkLegend() {
  return (
    <div className={styles.markLegend}>
      {(['like', 'dislike', 'confused'] as const).map((color) => (
        <span key={color}>
          <i style={{ background: markColors[color] }} />
          {markLabels[color]}
        </span>
      ))}
    </div>
  );
}
