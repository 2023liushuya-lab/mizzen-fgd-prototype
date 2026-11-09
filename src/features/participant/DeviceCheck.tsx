'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Mic,
  RefreshCw,
  Signal,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './DeviceCheck.module.css';
export function DeviceCheck({
  name,
  title,
  onBack,
  onJoin,
}: {
  name: string;
  title: string;
  onBack: () => void;
  onJoin: () => void;
}) {
  const alive = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null),
    cameraStream = useRef<MediaStream | null>(null),
    audioStream = useRef<MediaStream | null>(null),
    audioContext = useRef<AudioContext | null>(null),
    frame = useRef(0);
  const [camera, setCamera] = useState(false),
    [mic, setMic] = useState(false),
    [level, setLevel] = useState(0),
    [error, setError] = useState(''),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [cameraId, setCameraId] = useState(''),
    [micId, setMicId] = useState(''),
    [online, setOnline] = useState(true);
  useEffect(() => {
    alive.current = true;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    navigator.mediaDevices
      ?.enumerateDevices()
      .then(setDevices)
      .catch(() => {});
    return () => {
      alive.current = false;
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      cameraStream.current?.getTracks().forEach((t) => t.stop());
      audioStream.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(frame.current);
      if (audioContext.current?.state !== 'closed')
        void audioContext.current?.close().catch(() => {});
    };
  }, []);
  async function refreshDevices() {
    try {
      setDevices(await navigator.mediaDevices.enumerateDevices());
    } catch {}
  }
  async function testCamera() {
    setError('');
    cameraStream.current?.getTracks().forEach((t) => t.stop());
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('当前浏览器无法使用摄像头，请在 Chrome 或 Edge 中打开。');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
      });
      if (!alive.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      cameraStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera(true);
      void refreshDevices();
    } catch (e) {
      setCamera(false);
      setError(
        (e as Error).name === 'NotAllowedError'
          ? '摄像头权限未开启，可以在地址栏允许后重试，也可先加入访谈。'
          : '摄像头暂不可用，请检查设备连接后重试。',
      );
    }
  }
  async function testMic() {
    setError('');
    cancelAnimationFrame(frame.current);
    audioStream.current?.getTracks().forEach((t) => t.stop());
    if (audioContext.current?.state !== 'closed') await audioContext.current?.close();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器不支持麦克风检测');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      if (!alive.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      audioStream.current = stream;
      const context = new AudioContext();
      audioContext.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const values = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        analyser.getByteFrequencyData(values);
        setLevel(Math.min(1, values.reduce((a, b) => a + b, 0) / values.length / 90));
        frame.current = requestAnimationFrame(draw);
      };
      draw();
      setMic(true);
      void refreshDevices();
    } catch (e) {
      setMic(false);
      setError(
        (e as Error).name === 'NotAllowedError'
          ? '麦克风权限未开启，可以在地址栏允许后重试，也可先加入访谈。'
          : '未检测到可用麦克风，请检查设备后重试。',
      );
    }
  }
  function testSpeaker() {
    const context = new AudioContext(),
      oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.frequency.value = 523;
    gain.gain.value = 0.12;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.stop(context.currentTime + 0.5);
    oscillator.onended = () => void context.close();
  }
  return (
    <main className={styles.page}>
      <header>
        <strong>mizzen</strong>
        <span>{title}</span>
      </header>
      <section className={styles.content}>
        <div className={styles.heading}>
          <div>
            <span>入场前检测</span>
            <h1>调整好设备，准备加入访谈</h1>
            <p>{name}，请确认画面与声音。检测异常也可先入场。</p>
          </div>
          <span className={styles.steps}>
            身份确认 <ChevronRight size={13} />
            设备检测
            <ChevronRight size={13} />
            加入访谈
          </span>
        </div>
        <div className={styles.layout}>
          <div className={styles.preview}>
            <video ref={videoRef} autoPlay playsInline muted hidden={!camera} />
            {!camera && (
              <div>
                <VideoOff size={38} />
                <strong>摄像头尚未开启</strong>
                <span>点击开启预览后，浏览器会询问设备权限</span>
                <Button variant="outline" onClick={() => void testCamera()}>
                  <Video size={15} />
                  开启预览
                </Button>
              </div>
            )}
            <span className={styles.name}>{name}</span>
          </div>
          <div className={styles.settings}>
            <section>
              <label htmlFor="device-camera">
                <Video size={17} />
                摄像头{' '}
                {camera && (
                  <small>
                    <Check size={12} />
                    已连接
                  </small>
                )}
              </label>
              <select
                id="device-camera"
                value={cameraId}
                onChange={(e) => {
                  setCameraId(e.target.value);
                  setCamera(false);
                  cameraStream.current?.getTracks().forEach((t) => t.stop());
                }}
              >
                <option value="">系统默认摄像头</option>
                {devices
                  .filter((d) => d.kind === 'videoinput' && d.deviceId)
                  .map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `摄像头 ${i + 1}`}
                    </option>
                  ))}
              </select>
              <button className={styles.textButton} onClick={() => void testCamera()}>
                <RefreshCw size={12} />
                {camera ? '重新检测' : '开启摄像头检测'}
              </button>
            </section>
            <section>
              <label htmlFor="device-mic">
                <Mic size={17} />
                麦克风{' '}
                {mic && (
                  <small>
                    <Check size={12} />
                    已连接
                  </small>
                )}
              </label>
              <select id="device-mic" value={micId} onChange={(e) => setMicId(e.target.value)}>
                <option value="">系统默认麦克风</option>
                {devices
                  .filter((d) => d.kind === 'audioinput' && d.deviceId)
                  .map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `麦克风 ${i + 1}`}
                    </option>
                  ))}
              </select>
              <div className={styles.meter} aria-label="麦克风输入音量">
                {Array.from({ length: 24 }, (_, i) => (
                  <i key={i} className={i < level * 24 ? styles.lit : ''} />
                ))}
              </div>
              <div className={styles.row}>
                <span>{mic ? '请说话，查看音量变化' : '尚未开启麦克风检测'}</span>
                <button className={styles.textButton} onClick={() => void testMic()}>
                  {mic ? '重新检测' : '开始检测'}
                </button>
              </div>
            </section>
            <section>
              <label>
                <Volume2 size={17} />
                扬声器
              </label>
              <div className={styles.row}>
                <span>系统默认扬声器</span>
                <button className={styles.textButton} onClick={testSpeaker}>
                  播放测试音
                </button>
              </div>
            </section>
            <div className={styles.network}>
              <Signal size={17} />
              <strong>{online ? '网络连接可用' : '网络已断开'}</strong>
              <small>浏览器连接状态</small>
            </div>
          </div>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <footer>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={15} />
            返回
          </Button>
          <span>入场后仍可调整麦克风与摄像头</span>
          <Button onClick={onJoin}>
            加入访谈
            <ChevronRight size={16} />
          </Button>
        </footer>
      </section>
    </main>
  );
}
