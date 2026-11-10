'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFgdStore } from '@/stores/fgd-store';
import { sessionLink } from '@/lib/utils';
import { createReviewDemo, ensureReviewDemo } from '@/features/workbench/review-demo';
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
    const session =
      params.get('fresh') === '1' ? createReviewDemo(delivery) : ensureReviewDemo(delivery);
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
