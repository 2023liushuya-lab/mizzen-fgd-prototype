import { Suspense } from 'react';
import ParticipantPage from '@/features/participant/ParticipantPage';
export default function Page() {
  return (
    <Suspense>
      <ParticipantPage />
    </Suspense>
  );
}
