'use client';
import { useEffect, useState } from 'react';
import { Check, Mic, RotateCcw, Square } from 'lucide-react';
import { useFgdStore } from '@/stores/fgd-store';
import { voiceScript } from '@/lib/mjd-access';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import styles from './entry.module.css';
export function VoiceRecorder({
  target,
  sessionId,
  onClose,
  onSave,
}: {
  sessionId: string;
  target: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (id: string) => void;
}) {
  const update = useFgdStore((s) => s.updateSession);
  const [stage, setStage] = useState<'idle' | 'recording' | 'ready'>('idle');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setStage('idle');
    setSeconds(0);
  }, [target?.id]);
  useEffect(() => {
    if (stage !== 'recording') return;
    const timer = setInterval(
      () =>
        setSeconds((s) => {
          if (s >= 5) {
            setStage('ready');
            return 6;
          }
          return s + 1;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [stage]);
  useEffect(() => {
    if (target) update(sessionId, { voiceRecording: { participantId: target.id, stage, seconds } });
  }, [sessionId, target?.id, stage, seconds, update]);
  function close() {
    update(sessionId, { voiceRecording: null });
    onClose();
  }
  function start() {
    setSeconds(0);
    setStage('recording');
  }
  return (
    <Modal
      open={!!target}
      onOpenChange={(open) => !open && close()}
      title={`录制${target?.name || ''}声纹`}
    >
      <div className={styles.voiceRecorder}>
        <div className="avatar" style={{ background: '#467d78', width: 44, height: 44 }}>
          <Mic size={22} />
        </div>
        <h3>
          {stage === 'ready'
            ? '录制完成'
            : stage === 'recording'
              ? '请自然朗读下方文字'
              : '准备录制声纹'}
        </h3>
        <p className="muted">保持安静，按平时说话的音量朗读。</p>
        <blockquote>{voiceScript(target?.name || '受访者')}</blockquote>
        <div
          className={`${styles.voiceBars} ${stage === 'recording' ? styles.voiceBarsActive : ''}`}
          aria-hidden
        >
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <p role="status">
          {stage === 'recording'
            ? `录制中 · ${seconds} 秒`
            : stage === 'ready'
              ? `已录制 ${seconds} 秒，可保存或重新录制`
              : '建议录制约 6 秒'}
        </p>
        <div className={styles.voiceRecorderActions}>
          {stage === 'idle' ? (
            <Button onClick={start}>
              <Mic size={15} />
              开始录制
            </Button>
          ) : stage === 'recording' ? (
            <Button variant="outline" disabled={seconds < 2} onClick={() => setStage('ready')}>
              <Square size={13} />
              结束录制
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={start}>
                <RotateCcw size={14} />
                重新录制
              </Button>
              <Button
                onClick={() => {
                  update(sessionId, { voiceRecording: null });
                  if (target) onSave(target.id);
                }}
              >
                <Check size={15} />
                保存声纹
              </Button>
            </>
          )}
        </div>
        <p className="muted small" style={{ marginTop: 18 }}>
          原型模拟录制，未调用音频采集或声纹识别服务。
        </p>
      </div>
    </Modal>
  );
}
