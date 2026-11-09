'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFgdStore } from '@/stores/fgd-store';
import { Empty, projectUrl } from './shared';
import Home from './HomePage';
import ProjectPage from './ProjectPage';
import OutlineEditor from './OutlineEditor';
import Setup from './SessionSetup';
import styles from './entry.module.css';
export default function EntryPage({
  view = 'home',
}: {
  view?: 'home' | 'project' | 'setup' | 'outline';
}) {
  const data = useFgdStore((s) => s.data);
  const ready = useFgdStore((s) => s.ready);
  const params = useSearchParams();
  const projectId = params.get('project');
  const sessionId = params.get('session');
  const project = data.projects.find((p) => p.id === projectId);
  if (!ready) return <div className={styles.loading}>正在打开工作空间…</div>;
  if (view === 'home') return <Home />;
  if (!project)
    return (
      <Empty title="未找到对应研究">
        <p className="muted">请从焦点小组选择研究后继续。</p>
        <Button asChild>
          <Link href="/">返回工作空间</Link>
        </Button>
      </Empty>
    );
  if (view === 'outline') return <OutlineEditor key={project.id} project={project} />;
  if (view === 'setup') {
    const session = data.sessions.find((s) => s.id === sessionId && s.projectId === project.id);
    return session ? (
      <Setup key={session.id} project={project} session={session} />
    ) : (
      <Empty title="未找到对应场次">
        <p className="muted">这个链接缺少有效的场次信息。</p>
        <Button asChild>
          <Link href={projectUrl(project.id)}>返回场次</Link>
        </Button>
      </Empty>
    );
  }
  return <ProjectPage key={project.id} project={project} />;
}
