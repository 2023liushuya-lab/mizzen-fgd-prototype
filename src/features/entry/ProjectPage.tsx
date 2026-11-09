'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, FilePenLine, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useFgdStore } from '@/stores/fgd-store';
import { sessionLink } from '@/lib/utils';
import type { Project, Session } from '@/types/fgd';
import { EntryHeader, Empty, Notice, LinkField, outlineUrl, setupUrl, phaseName } from './shared';
import styles from './entry.module.css';
export default function ProjectPage({ project }: { project: Project }) {
  const router = useRouter();
  const params = useSearchParams();
  const sessions = useFgdStore((s) => s.data.sessions).filter((s) => s.projectId === project.id);
  const createSession = useFgdStore((s) => s.createSession);
  const [message, setMessage] = useState('');
  const [observer, setObserver] = useState<Session | null>(null);
  const records = params.get('tab') === 'records';
  function addSession() {
    const id = createSession(project.id);
    router.push(setupUrl(project.id, id));
  }
  return (
    <div className={styles.projectPage}>
      <EntryHeader project={project} active={records ? 'records' : 'sessions'} />
      <main className={styles.projectMain}>
        <div className={styles.sectionTitle}>
          <div>
            <h1>{records ? '访谈记录' : '研究场次'}</h1>
            <p className="muted">{project.objective}</p>
          </div>
          <div className="row">
            <Button variant="outline" asChild>
              <Link href={outlineUrl(project.id)}>
                <FilePenLine size={15} />
                编辑大纲
              </Link>
            </Button>
            {!records && (
              <Button onClick={addSession}>
                <Plus size={16} />
                新建场次
              </Button>
            )}
          </div>
        </div>
        {!project.published && (
          <div className={styles.draftNotice}>
            <FilePenLine size={16} />
            <span>访谈大纲尚未发布。</span>
            <Link href={outlineUrl(project.id)}>
              去完善并发布 <ArrowRight size={14} />
            </Link>
          </div>
        )}
        <Notice>{message}</Notice>
        <div className={styles.sessionTable}>
          <table>
            <thead>
              <tr>
                <th>场次名称</th>
                <th>访谈模式</th>
                <th>受访者人数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .filter((s) => !records || s.phase === 'ended')
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.title}</strong>
                    </td>
                    <td>{s.delivery === 'online' ? '线上' : '线下'} · 常规访谈</td>
                    <td>{s.participants.filter((p) => !p.removed).length} 人</td>
                    <td>
                      <span className={`${styles.phase} ${styles[s.phase]}`}>
                        {phaseName[s.phase]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        {s.phase === 'pending' ? (
                          <Link href={setupUrl(project.id, s.id)}>配置场次</Link>
                        ) : (
                          <Link href={sessionLink('host', s)}>
                            {s.phase === 'ended' ? '查看记录' : '进入主持台'}
                          </Link>
                        )}
                        <button onClick={() => setObserver(s)}>
                          {s.phase === 'ended' ? '旁听复盘' : '旁听室链接'}
                        </button>
                        {s.phase !== 'pending' && (
                          <Link
                            href={setupUrl(project.id, s.id)}
                            aria-label={`查看${s.title}配置`}
                            className={styles.subtleAction}
                          >
                            <MoreHorizontal size={17} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {sessions.filter((s) => !records || s.phase === 'ended').length === 0 && (
            <Empty title={records ? '暂无已结束的场次' : '创建第一场访谈'}>
              {!records && (
                <Button variant="outline" onClick={addSession}>
                  <Plus size={15} />
                  新建场次
                </Button>
              )}
            </Empty>
          )}
        </div>
      </main>
      <Modal
        open={!!observer}
        onOpenChange={(open) => !open && setObserver(null)}
        title="旁听室链接"
      >
        {observer && (
          <>
            <p className="muted">
              {observer.title} · {phaseName[observer.phase]}
            </p>
            <p>独立旁听入口，仅查看研究内容，通过小纸条向主持人提问。</p>
            <LinkField session={observer} role="observer" onMessage={setMessage} />
            <div className={styles.modalFooter}>
              <Button onClick={() => setObserver(null)} variant="outline">
                关闭
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
