import { Suspense } from 'react';
import WorkbenchPage from '@/features/workbench/WorkbenchPage';
export default function Page() {
  return (
    <Suspense>
      <WorkbenchPage role="observer" />
    </Suspense>
  );
}
