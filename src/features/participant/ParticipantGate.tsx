'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mic, ShieldCheck, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { Session } from '@/types/fgd';
import styles from './participant.module.css';
import { DeviceCheck } from './DeviceCheck';
export function ParticipantGate({
  session,
  personalId,
  onJoin,
}: {
  session: Session;
  personalId: string | null;
  onJoin: (id: string) => void;
}) {
  const [stage, setStage] = useState<'code' | 'identity' | 'consent'>(
    session.delivery === 'offline' && personalId ? 'consent' : 'code',
  );
  const [code, setCode] = useState(''),
    [selected, setSelected] = useState(personalId || ''),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(''),
    [replace, setReplace] = useState(false),
    [devices, setDevices] = useState(false),
    [tested, setTested] = useState(false);
  const people = session.participants.filter((p) => !p.removed),
    person = people.find((p) => p.id === selected);
  if (session.phase === 'ended')
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <span className={styles.wordmark}>mizzen</span>
          <h1>本场访谈已结束</h1>
          <p className="muted">入场链接已关闭，感谢你的参与。</p>
        </div>
      </div>
    );
  if (personalId && !people.some((p) => p.id === personalId))
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <h1>个人入场码已失效</h1>
          <p>请联系研究人员确认受访者身份。</p>
        </div>
      </div>
    );
  function enter() {
    if (!person || !consent) return;
    if (person.online) {
      setReplace(true);
      return;
    }
    setDevices(true);
  }
  if (devices && person)
    return (
      <DeviceCheck
        name={person.name}
        title={session.title}
        onBack={() => setDevices(false)}
        onJoin={() => consent && onJoin(person.id)}
      />
    );
  return (
    <div className={styles.gate}>
      <header className={styles.gateHeader}>
        <span className={styles.wordmark}>mizzen</span>
        <span>焦点小组访谈</span>
      </header>
      <section className={styles.gateCard}>
        <span className="badge">{session.phase === 'pending' ? '等待开始' : '进行中'}</span>
        <h1>{session.title}</h1>
        {stage === 'code' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.replace(/\s/g, '') === session.roomCode) {
                setError('');
                setStage('identity');
              } else setError('房间码不正确，请核对后重试。');
            }}
          >
            <p className="muted">请输入研究人员提供的房间码。</p>
            <input
              className={styles.roomCode}
              aria-label="房间码"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={code}
              placeholder="房间码"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <Button className={styles.fullButton} disabled={code.length < 4}>
              继续
              <ArrowRight size={16} />
            </Button>
          </form>
        ) : stage === 'identity' ? (
          <>
            <p className="muted">在本场名单中选择你的姓名。</p>
            <div className={styles.identityList}>
              {people.map((p) => (
                <button
                  key={p.id}
                  className={selected === p.id ? styles.identitySelected : ''}
                  onClick={() => setSelected(p.id)}
                >
                  <span className="avatar" style={{ background: p.color }}>
                    {p.name.slice(0, 1)}
                  </span>
                  <strong>{p.name}</strong>
                  <small>{p.online ? '已在场' : '未到场'}</small>
                  {selected === p.id && <Check size={17} />}
                </button>
              ))}
            </div>
            <Button
              className={styles.fullButton}
              disabled={!selected}
              onClick={() => setStage('consent')}
            >
              确认身份
              <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <div className={styles.consentIdentity}>
              <span className="avatar" style={{ background: person?.color }}>
                {person?.name[0]}
              </span>
              <strong>{person?.name}</strong>
              {!personalId && <button onClick={() => setStage('identity')}>更换</button>}
            </div>
            <div className={styles.consentCopy}>
              <ShieldCheck size={20} />
              <div>
                <strong>访谈知情说明</strong>
                <p>
                  本次访谈将录音并生成文字记录，仅用于用户研究。请按照真实感受分享，你的观点没有标准答案。
                </p>
              </div>
            </div>
            <label className={styles.consentCheck}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              我已阅读并同意参与本次研究与录制
            </label>
            <div className={styles.joinActions}>
              <Button variant="outline" disabled={!consent || !person} onClick={() => enter()}>
                检测设备
              </Button>
              <Button disabled={!consent || !person} onClick={enter}>
                加入访谈
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
        {stage !== 'code' && !personalId && (
          <button
            className={styles.back}
            onClick={() => setStage(stage === 'consent' ? 'identity' : 'code')}
          >
            <ArrowLeft size={13} />
            返回
          </button>
        )}
      </section>
      <Modal open={replace} onOpenChange={setReplace} title="替换已连接的设备？">
        <p className="confirm-copy">
          {person?.name}已在另一设备或窗口加入。继续后，原连接将退出本场访谈。
        </p>
        <div className="modal-footer">
          <Button variant="outline" onClick={() => setReplace(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              setReplace(false);
              setDevices(true);
            }}
          >
            替换并加入
          </Button>
        </div>
      </Modal>
    </div>
  );
}
