'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TrackerPage from '@/components/TrackerPage';
import { Skeleton } from '@/components/ui/skeleton';
import LoginPage from './login/page';
import { useSearchParams } from 'next/navigation';

function SearchHandler() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const busId = searchParams.get('busId');

  useEffect(() => {
    if (!loading && user && !busId) {
      router.push('/bus-selection');
    }
  }, [user, loading, busId, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-full h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!busId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-full h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return <TrackerPage busId={busId} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Skeleton className="h-full w-full" />
      </div>
    }>
      <SearchHandler />
    </Suspense>
  );
}
