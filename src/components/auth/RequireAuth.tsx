import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { LoadingSkeleton } from '../ui/StateViews';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const hydrated = useAppStore((s) => s.hydrated);
  const authSession = useAppStore((s) => s.authSession);
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="min-h-screen p-6 sm:p-10 bg-slate-50 dark:bg-[#090D16]">
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (!authSession) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        state={{ from: redirectTarget, authRequired: true }}
        replace
      />
    );
  }

  return <>{children}</>;
}
