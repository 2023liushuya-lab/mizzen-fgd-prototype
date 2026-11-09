import type { Identity, Session } from '@/types/fgd';
import { downloadText } from '@/lib/utils';

export function exportObserverNotes(session: Session, identity: Identity) {
  let draft = '';
  try {
    draft =
      JSON.parse(
        localStorage.getItem(
          `mizzen-fgd-react:draft:${session.projectId}:${session.id}:${identity.id}`,
        ) || '{}',
      ).text || '';
  } catch {}
  const notes = session.notes
    .filter((note) => note.observerId === identity.id)
    .map(
      (note, i) =>
        `## ${i + 1}. 小纸条\n\n${new Date(note.createdAt).toLocaleString('zh-CN')} · ${note.status === 'handled' ? '已处理' : note.status === 'failed' ? '发送失败' : '已送达'}\n\n${note.text}`,
    )
    .join('\n\n');
  downloadText(
    `${session.title}-我的小纸条与笔记.md`,
    `# ${session.title} · 我的小纸条与笔记\n\n${notes || '暂无已发送纸条'}\n\n## 未发送笔记／草稿\n\n${draft || '无未发送草稿'}`,
  );
}
