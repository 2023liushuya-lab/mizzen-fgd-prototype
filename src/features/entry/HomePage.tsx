'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, LayoutGrid, Users, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFgdStore } from '@/stores/fgd-store';
import { Empty, outlineUrl, projectUrl } from './shared';
import styles from './entry.module.css';
export default function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const projects = useFgdStore((s) => s.data.projects);
  const sessions = useFgdStore((s) => s.data.sessions);
  const createProject = useFgdStore((s) => s.createProject);
  const [area, setArea] = useState<'workspace' | 'fgd'>(
    params.get('area') === 'fgd' ? 'fgd' : 'workspace',
  );
  const [objective, setObjective] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const areaParam = params.get('area');
  useEffect(() => {
    setArea(areaParam === 'fgd' ? 'fgd' : 'workspace');
  }, [areaParam]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function generate() {
    if (!objective.trim() || creating) return;
    setCreating(true);
    timer.current = setTimeout(() => {
      const goal = objective.trim();
      const title = goal.length > 22 ? `${goal.slice(0, 22)}…` : goal;
      const id = createProject(title, goal);
      router.push(outlineUrl(id));
    }, 850);
  }
  function switchArea(next: 'workspace' | 'fgd') {
    setArea(next);
    router.replace(next === 'fgd' ? '/?area=fgd' : '/');
  }
  return (
    <div className={styles.home}>
      <aside className={styles.homeSidebar}>
        <Link href="/" className={styles.brand}>
          mizzen<span>研究工作空间</span>
        </Link>
        <div className={styles.workspaceName}>
          <span className={styles.workspaceIcon}>M</span>
          <div>
            产品研究空间<small>管理员</small>
          </div>
        </div>
        <nav>
          <button
            className={area === 'workspace' ? styles.activeNav : ''}
            onClick={() => switchArea('workspace')}
          >
            <LayoutGrid size={18} />
            研究项目
          </button>
          <button
            className={area === 'fgd' ? styles.activeNav : ''}
            onClick={() => switchArea('fgd')}
          >
            <Users size={18} />
            焦点小组
          </button>
        </nav>
        <div className={styles.account}>
          <span>书</span>
          <div>
            刘书雅<small>演示工作空间</small>
          </div>
        </div>
      </aside>
      <main className={styles.homeMain}>
        {area === 'workspace' ? (
          <>
            <div className={styles.workspaceHeading}>
              <span className={styles.eyebrow}>MIZZEN WORKSPACE</span>
              <h1>研究，从一个好问题开始</h1>
              <p>管理研究项目，和真实用户一起找到答案。</p>
            </div>
            <button className={styles.entryCard} onClick={() => switchArea('fgd')}>
              <span className={styles.entryIcon}>
                <Users size={27} />
              </span>
              <div>
                <span className={styles.eyebrow}>FGD</span>
                <h2>焦点小组</h2>
                <p>从访谈大纲、场次配置到多人实时讨论。</p>
              </div>
              <ArrowRight size={22} />
            </button>
          </>
        ) : (
          <>
            <section className={styles.creation}>
              <span className={styles.eyebrow}>焦点小组 · FGD</span>
              <h1>这次，你想了解什么？</h1>
              <p>描述研究目标，先生成一份可编辑的访谈大纲。</p>
              <div className={styles.prompt}>
                <textarea
                  aria-label="研究目标"
                  placeholder="例如：了解年轻消费者选择护肤品时的考虑因素，设计一场焦点小组访谈…"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                />
                <div>
                  <span>
                    {creating ? '正在整理环节与题目…' : 'Enter 开始创建 · Shift + Enter 换行'}
                  </span>
                  <Button
                    aria-label="开始创建大纲"
                    disabled={!objective.trim() || creating}
                    onClick={generate}
                  >
                    {creating ? (
                      <Sparkles size={17} className={styles.pulse} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </Button>
                </div>
              </div>
            </section>
            <section className={styles.projects}>
              <div className={styles.sectionTitle}>
                <h2>已创建的项目</h2>
                <div className={styles.search}>
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索项目名称"
                    aria-label="搜索研究"
                  />
                </div>
              </div>
              <div className={styles.projectGrid}>
                {projects
                  .filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase()))
                  .map((p) => {
                    const own = sessions.filter((s) => s.projectId === p.id);
                    return (
                      <Link className={styles.projectCard} key={p.id} href={projectUrl(p.id)}>
                        <span className={styles.fgdBadge}>FGD</span>
                        <h3>{p.title}</h3>
                        <p>{p.objective || '焦点小组研究'}</p>
                        <div>
                          {own.length} 个场次 · {own.filter((s) => s.phase === 'ended').length}{' '}
                          场已完成
                        </div>
                        <small>
                          {p.published ? '大纲已发布' : '大纲草稿'}
                          <ArrowRight size={14} />
                        </small>
                      </Link>
                    );
                  })}
              </div>
              {!projects.length && (
                <Empty title="还没有焦点小组研究">
                  <p className="muted">在上方输入研究目标开始。</p>
                </Empty>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
