'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Session } from '@/types/fgd';
import { sessionLink } from '@/lib/utils';
export function SessionEntryQr({ session }: { session: Session }) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(`${location.origin}${sessionLink('participant', session)}`, {
      margin: 1,
      width: 160,
    }).then((value) => {
      if (active) setQr(value);
    });
    return () => {
      active = false;
    };
  }, [session.id, session.projectId]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
      {qr && <img src={qr} alt="场次受访者入场二维码" width={104} height={104} />}
      <div style={{ fontSize: 12, lineHeight: 1.8 }}>
        <strong>扫码进入本场访谈</strong>
        <p className="muted" style={{ margin: 0 }}>
          受访者输入个人数字码后入场
        </p>
      </div>
    </div>
  );
}
