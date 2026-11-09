import { Suspense } from 'react';
import EntryPage from '@/features/entry/EntryPage';
export default function Page() {
  return (
    <Suspense>
      <EntryPage view="home" />
    </Suspense>
  );
}
