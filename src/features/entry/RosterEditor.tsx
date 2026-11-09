'use client';
import { useRef, useState } from 'react';
import { Check, CheckCircle2, Download, Pencil, Plus, QrCode, Trash2, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { backgroundOf, uid } from '@/lib/utils';
import type { Participant, Session } from '@/types/fgd';
import { Empty, Notice, colors } from './shared';
import styles from './entry.module.css';
interface PersonDraft {
  name: string;
  age: string;
  skin: string;
  notes: string;
}
const blankPerson: PersonDraft = { name: '', age: '', skin: '', notes: '' };
interface RosterEditorProps {
  session: Session;
  onChange: (patch: Partial<Session>) => void;
  onShowQr: (person: Participant) => void;
  onMessage: (message: string) => void;
}
export default function RosterEditor({
  session,
  onChange: patch,
  onShowQr,
  onMessage,
}: RosterEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Participant | 'new' | null>(null);
  const [personDraft, setPersonDraft] = useState<PersonDraft>(blankPerson);
  const [personError, setPersonError] = useState('');
  const [importRows, setImportRows] = useState<PersonDraft[] | null>(null);
  const [importError, setImportError] = useState('');
  const [remove, setRemove] = useState<Participant | null>(null);
  const people = session.participants.filter((p) => !p.removed);
  const pending = session.phase === 'pending';
  function edit(person: Participant | 'new') {
    setEditing(person);
    setPersonError('');
    setPersonDraft(
      person === 'new'
        ? { ...blankPerson }
        : {
            name: person.name,
            age: person.age,
            skin: person.skin,
            notes: person.notes,
          },
    );
  }
  function addPeople(rows: PersonDraft[]) {
    if (people.length + rows.length > 6) {
      onMessage('本场最多 6 位受访者，请调整名单后重试。');
      return;
    }
    const fresh: Participant[] = rows.map((p, i) => ({
      ...p,
      id: uid('person'),
      color: colors[(people.length + i) % colors.length],
      voiceEnabled: false,
      online: false,
      mic: false,
      camera: false,
    }));
    patch({
      participants: [...session.participants, ...fresh],
      seatOrder: [...session.seatOrder, ...fresh.map((p) => p.id)],
    });
  }
  function savePerson() {
    if (!personDraft.name.trim()) {
      setPersonError('请填写姓名。');
      return;
    }
    if (
      people.some(
        (p) => p.name === personDraft.name.trim() && (editing === 'new' || p.id !== editing?.id),
      )
    ) {
      setPersonError('名单中已有这个姓名，请添加可区分的称呼。');
      return;
    }
    const next = Object.fromEntries(
      Object.entries(personDraft).map(([key, val]) => [key, val.trim()]),
    ) as unknown as PersonDraft;
    if (editing === 'new') addPeople([next]);
    else if (editing)
      patch({
        participants: session.participants.map((p) =>
          p.id === editing.id ? { ...p, ...next } : p,
        ),
      });
    setEditing(null);
  }
  function readCsv(file: File) {
    setImportError('');
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      complete: (result) => {
        const headers = result.meta.fields || [];
        if (!headers.some((x) => ['姓名', 'name', 'Name', '称呼'].includes(x))) {
          setImportError('未找到“姓名”列，请使用模板导入。');
          setImportRows([]);
          return;
        }
        const seen = new Set(people.map((p) => p.name));
        const rows: PersonDraft[] = [];
        let duplicate = 0;
        for (const raw of result.data) {
          const name = (raw['姓名'] || raw.name || raw.Name || raw['称呼'] || '').trim();
          if (!name) continue;
          if (seen.has(name)) {
            duplicate++;
            continue;
          }
          seen.add(name);
          rows.push({
            name,
            age: raw['年龄'] || raw.age || '',
            skin: raw['肤质'] || raw.skin || '',
            notes: raw['背景信息'] || raw['背景'] || raw['备注'] || raw.notes || '',
          });
        }
        setImportRows(rows);
        if (result.errors.length) setImportError('部分行格式不完整，请核对预览后再导入。');
        else if (duplicate) setImportError(`已跳过 ${duplicate} 位重名受访者。`);
        else if (!rows.length) setImportError('文件中没有可导入的受访者。');
      },
      error: () => {
        setImportRows([]);
        setImportError('文件读取失败，请重新选择 CSV 文件。');
      },
    });
  }
  function downloadTemplate() {
    const text =
      '\uFEFF姓名,年龄,肤质,背景信息\n林女士,25–30岁,干敏肌,换季时偏好清爽保湿\n周女士,25–30岁,混合偏油,关注妆前贴合\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = '受访者导入模板.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  return (
    <>
      <section className={styles.setupCard}>
        <div className={styles.sectionTitle}>
          <div>
            <h2>
              受访者名单 <span className={styles.count}>{people.length}</span>
            </h2>
            <p className="muted">姓名与背景信息将在主持工作台中展示。</p>
          </div>
          <div className="row">
            {session.phase !== 'ended' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pending || people.some((p) => p.online) || people.length >= 6}
                  title={people.some((p) => p.online) ? '已有受访者到场，不能批量导入' : undefined}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={14} />
                  导入名单
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={people.length >= 6}
                  onClick={() => edit('new')}
                >
                  <Plus size={14} />
                  手动添加
                </Button>
              </>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readCsv(file);
            e.target.value = '';
          }}
        />
        <div className={styles.rosterTable}>
          <table>
            <thead>
              <tr>
                <th>受访者</th>
                <th>背景信息</th>
                {session.delivery === 'offline' && <th>声纹</th>}
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.personName}>
                      <span className={styles.personAvatar} style={{ background: p.color }}>
                        {p.name[0]}
                      </span>
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={styles.background}>{backgroundOf(p)}</span>
                  </td>
                  {session.delivery === 'offline' && (
                    <td>
                      <button
                        className={`${styles.voiceState} ${p.voiceEnabled ? styles.voiceEnabled : ''}`}
                        disabled={!pending}
                        onClick={() =>
                          patch({
                            participants: session.participants.map((item) =>
                              item.id === p.id
                                ? {
                                    ...item,
                                    voiceEnabled: !item.voiceEnabled,
                                  }
                                : item,
                            ),
                          })
                        }
                      >
                        {p.voiceEnabled ? (
                          <Check size={13} />
                        ) : (
                          <span className={styles.statusDot} />
                        )}
                        {p.voiceEnabled ? '已启用' : '待启用'}
                      </button>
                    </td>
                  )}
                  <td>
                    <div className={styles.rosterActions}>
                      {session.delivery === 'offline' && (
                        <button
                          className="icon-button"
                          aria-label={`${p.name}个人二维码`}
                          onClick={() => onShowQr(p)}
                        >
                          <QrCode size={17} />
                        </button>
                      )}
                      {pending && (
                        <>
                          <button
                            className="icon-button"
                            aria-label={`编辑${p.name}`}
                            onClick={() => edit(p)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`删除${p.name}`}
                            onClick={() => setRemove(p)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!people.length && (
            <Empty title="添加本场受访者">
              <p className="muted">导入 CSV 名单，或手动添加。</p>
            </Empty>
          )}
        </div>
        <div className={styles.rosterFooter}>
          <button onClick={downloadTemplate}>
            <Download size={13} />
            下载导入模板
          </button>
          {session.delivery === 'offline' && pending && (
            <button
              onClick={() =>
                patch({
                  hostVoiceEnabled: true,
                  participants: session.participants.map((p) => ({
                    ...p,
                    voiceEnabled: true,
                  })),
                })
              }
            >
              模拟全员声纹启用
              <CheckCircle2 size={13} />
            </button>
          )}
        </div>
      </section>
      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? '添加受访者' : '编辑受访者'}
      >
        <div className={styles.editorField}>
          <label>姓名</label>
          <input
            aria-label="受访者姓名"
            autoFocus
            value={personDraft.name}
            onChange={(e) => setPersonDraft({ ...personDraft, name: e.target.value })}
            placeholder="受访者称呼"
          />
        </div>
        <div className={styles.editorGrid}>
          <div className={styles.editorField}>
            <label>年龄</label>
            <input
              aria-label="受访者年龄"
              value={personDraft.age}
              onChange={(e) => setPersonDraft({ ...personDraft, age: e.target.value })}
              placeholder="例如 25–30岁"
            />
          </div>
          <div className={styles.editorField}>
            <label>肤质</label>
            <input
              aria-label="受访者肤质"
              value={personDraft.skin}
              onChange={(e) => setPersonDraft({ ...personDraft, skin: e.target.value })}
              placeholder="选填"
            />
          </div>
        </div>
        <div className={styles.editorField}>
          <label>背景信息</label>
          <textarea
            aria-label="受访者背景信息"
            value={personDraft.notes}
            onChange={(e) => setPersonDraft({ ...personDraft, notes: e.target.value })}
            placeholder="使用习惯、偏好等与研究相关的信息"
          />
        </div>
        <Notice>{personError}</Notice>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={() => setEditing(null)}>
            取消
          </Button>
          <Button onClick={savePerson}>保存</Button>
        </div>
      </Modal>
      <Modal
        open={importRows !== null}
        onOpenChange={(open) => !open && setImportRows(null)}
        title="导入受访者名单"
        wide
      >
        <Notice>{importError}</Notice>
        <p className="muted">确认后添加到本场已有名单，不覆盖已填写的信息。</p>
        <div className={styles.importPreview}>
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>年龄</th>
                <th>肤质</th>
                <th>背景信息</th>
              </tr>
            </thead>
            <tbody>
              {importRows?.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.age || '—'}</td>
                  <td>{p.skin || '—'}</td>
                  <td>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={() => setImportRows(null)}>
            取消
          </Button>
          <Button
            disabled={!importRows?.length}
            onClick={() => {
              if (importRows) {
                addPeople(importRows);
                onMessage(`已导入 ${importRows.length} 位受访者`);
                setImportRows(null);
              }
            }}
          >
            确认导入 {importRows?.length || 0} 人
          </Button>
        </div>
      </Modal>
      <Modal open={!!remove} onOpenChange={(open) => !open && setRemove(null)} title="删除受访者？">
        <p>将从本场名单中删除「{remove?.name}」，对应个人入场身份也会失效。</p>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={() => setRemove(null)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (remove)
                patch({
                  participants: session.participants.filter((p) => p.id !== remove.id),
                  seatOrder: session.seatOrder.filter((id) => id !== remove.id),
                });
              setRemove(null);
            }}
          >
            确认删除
          </Button>
        </div>
      </Modal>
    </>
  );
}
