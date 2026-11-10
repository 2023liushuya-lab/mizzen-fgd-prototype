'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { ensureReviewDemo } from '@/features/workbench/review-demo';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, FilePenLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFgdStore } from '@/stores/fgd-store';
import { sessionLink } from '@/lib/utils';
import type { Project } from '@/types/fgd';
import { EntryHeader, Empty, outlineUrl, setupUrl, phaseName } from './shared';
import styles from './entry.module.css';
export default function ProjectPage({ project }: { project: Project }) {
  const router = useRouter();
  const params = useSearchParams();
  const sessions = useFgdStore((s) => s.data.sessions).filter((s) => s.projectId === project.id);
  const createSession = useFgdStore((s) => s.createSession);
  const records = params.get('tab') === 'records';
  useEffect(() => {
    if (project.id === 'project-1' && !records) {
      ensureReviewDemo('offline', project.id);
      ensureReviewDemo('online', project.id);
    }
  }, [project.id, records]);
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
                .slice()
                .sort((a, b) => Number(!!b.demoScenario) - Number(!!a.demoScenario))
                .filter((s) => !records || s.phase === 'ended')
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.title}</strong>
                      {s.demoScenario && (
                        <small className={styles.demoCaption}>完整示例 · 含各题型回答与总结</small>
                      )}
                    </td>
                    <td>
                      {s.delivery === 'online' ? '线上' : '线下'} ·{' '}
                      {s.testMode === 'blind' ? '盲测' : '普通测试'}
                    </td>
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
                        <a
                          href={sessionLink('observer', s)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          旁听室
                        </a>
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
    </div>
  );
}
