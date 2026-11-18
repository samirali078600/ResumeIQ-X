import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/ToastContainer';
import { LoadingSkeleton } from './components/ui/StateViews';
import { RequireAuth } from './components/auth/RequireAuth';
import { applyThemeToDom, useAppStore } from './store/useAppStore';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const WorkspaceDashboard = lazy(() => import('./pages/WorkspaceDashboard'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const ATSIntelligence = lazy(() => import('./pages/ATSIntelligence'));
const NLPLaboratory = lazy(() => import('./pages/NLPLaboratory'));
const JobMatching = lazy(() => import('./pages/JobMatching'));
const CareerIntelligence = lazy(() => import('./pages/CareerIntelligence'));
const SkillsGap = lazy(() => import('./pages/SkillsGap'));
const ResumeComparison = lazy(() => import('./pages/ResumeComparison'));
const AnalysisHistory = lazy(() => import('./pages/AnalysisHistory'));
const ReportsCenter = lazy(() => import('./pages/ReportsCenter'));
const LocalProfilePage = lazy(() => import('./pages/LocalProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteLoader() {
  return (
    <div className="min-h-screen p-6 sm:p-10 bg-slate-50 dark:bg-[#060A13]">
      <div className="mx-auto max-w-6xl">
        <LoadingSkeleton variant="dashboard" rows={5} />
      </div>
    </div>
  );
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const hydrateFromIndexedDb = useAppStore((s) => s.hydrateFromIndexedDb);

  useEffect(() => {
    applyThemeToDom(theme);
    hydrateFromIndexedDb();

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (useAppStore.getState().theme === 'system') {
          applyThemeToDom('system');
        }
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [theme, hydrateFromIndexedDb]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Public Home, Auth, About, and Contact routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Protected Workspace & Analysis Routes (require login) */}
            <Route
              path="/workspace"
              element={
                <RequireAuth>
                  <WorkspaceDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/analyzer"
              element={
                <RequireAuth>
                  <ResumeAnalyzer />
                </RequireAuth>
              }
            />
            <Route
              path="/ats-intelligence"
              element={
                <RequireAuth>
                  <ATSIntelligence />
                </RequireAuth>
              }
            />
            <Route
              path="/nlp-laboratory"
              element={
                <RequireAuth>
                  <NLPLaboratory />
                </RequireAuth>
              }
            />
            <Route
              path="/job-matching"
              element={
                <RequireAuth>
                  <JobMatching />
                </RequireAuth>
              }
            />
            <Route
              path="/career-intelligence"
              element={
                <RequireAuth>
                  <CareerIntelligence />
                </RequireAuth>
              }
            />
            <Route
              path="/skills-gap"
              element={
                <RequireAuth>
                  <SkillsGap />
                </RequireAuth>
              }
            />
            <Route
              path="/resume-comparison"
              element={
                <RequireAuth>
                  <ResumeComparison />
                </RequireAuth>
              }
            />
            <Route
              path="/analysis-history"
              element={
                <RequireAuth>
                  <AnalysisHistory />
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth>
                  <ReportsCenter />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <LocalProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
