'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sessionLink, copyText } from '@/lib/utils';
import type { Project, Session, QuestionType } from '@/types/fgd';
import styles from './entry.module.css';
export const questionTypes: QuestionType[] = [
  '访谈题',
  '单选题',
  '多选题',
  '量表题',
  '矩阵题',
  '标注题',
  '陈述题',
  '排序题',
  '级联选择题',
  '比重题',
  '图片上传题',
];
export const colors = ['#234f7e', '#467d78', '#b38c51', '#74758f', '#6d7d9d', '#976b79'];
export const phaseName = { pending: '待开始', live: '进行中', ended: '已完成' };
export const projectUrl = (id: string) => `/project?${new URLSearchParams({ project: id })}`;
export const outlineUrl = (id: string) => `/outline?${new URLSearchParams({ project: id })}`;
export const setupUrl = (p: string, s: string) =>
  `/setup?${new URLSearchParams({ project: p, session: s })}`;

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <LayoutGrid size={27} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return children ? (
    <div className={styles.notice} role="status">
      {children}
    </div>
  ) : null;
}
export function EntryHeader({
  project,
  active = 'sessions',
  children,
}: {
  project: Project;
  active?: 'outline' | 'sessions' | 'records';
  children?: ReactNode;
}) {
  return (
    <header className={styles.projectHeader}>
      <div className={styles.headerIdentity}>
        <Link href="/?area=fgd" className="icon-button" aria-label="返回焦点小组">
          <ArrowLeft size={18} />
        </Link>
        <Link href={projectUrl(project.id)} className={styles.projectName}>
          {project.title}
        </Link>
        <span className={styles.fgdBadge}>FGD</span>
      </div>
      <nav aria-label="研究工作流程">
        <Link className={active === 'outline' ? styles.current : ''} href={outlineUrl(project.id)}>
          创建
        </Link>
        <span>›</span>
        <Link className={active === 'sessions' ? styles.current : ''} href={projectUrl(project.id)}>
          场次
        </Link>
        <span>›</span>
        <Link
          className={active === 'records' ? styles.current : ''}
          href={`${projectUrl(project.id)}&tab=records`}
        >
          记录
        </Link>
      </nav>
      <div className={styles.headerActions}>
        <span className={styles.saved}>
          <Check size={14} />
          已保存
        </span>
        {children}
      </div>
    </header>
  );
}

export function LinkField({
  session,
  role,
  onMessage,
}: {
  session: Session;
  role: 'participant' | 'observer';
  onMessage: (message: string) => void;
}) {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const link = sessionLink(role, session);
  return (
    <div className={styles.linkField}>
      <input
        readOnly
        aria-label={role === 'observer' ? '旁听室链接' : '受访者链接'}
        value={origin + link}
      />
      <Button
        variant="outline"
        size="sm"
        aria-label="复制链接"
        onClick={async () => {
          try {
            await copyText(window.location.origin + link);
            onMessage('链接已复制');
          } catch {
            onMessage('复制失败，请选中链接后复制。');
          }
        }}
      >
        <Copy size={14} />
        复制
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} />
          打开
        </a>
      </Button>
    </div>
  );
}
