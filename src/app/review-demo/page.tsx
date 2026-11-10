'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { sessionLink } from '@/lib/utils';
import { createReviewDemo } from '@/features/workbench/review-demo';
function ReviewDemo() {
  const ready = useFgdStore((s) => s.ready),
    params = useSearchParams(),
    router = useRouter(),
    started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const delivery = params.get('delivery') === 'online' ? 'online' : 'offline';
    const role = params.get('role') === 'host' ? 'host' : 'observer';
    const key = `fgd-review-demo-v1:${delivery}`;
    const stored = localStorage.getItem(key);
    let session = useFgdStore
      .getState()
      .data.sessions.find((s) => s.id === stored && s.phase === 'live');
    if (!session || params.get('fresh') === '1') {
      session = createReviewDemo(delivery);
      localStorage.setItem(key, session.id);
    }
    router.replace(sessionLink(role, session));
  }, [ready, params, router]);
  return <main style={{ padding: 40, color: '#002554' }}>正在打开进行中的全题演示…</main>;
}
export default function Page() {
  return (
    <Suspense>
      <ReviewDemo />
    </Suspense>
  );
}
