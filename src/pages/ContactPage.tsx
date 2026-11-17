import { useState, type ReactNode } from 'react';
import { Copy, Info, Mail } from 'lucide-react';
import { LandingNavbar } from '../components/layout/Navbar';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <LandingNavbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}

export default function ContactPage() {
  const authSession = useAppStore((s) => s.authSession);
  const addToast = useAppStore((s) => s.addToast);
  const [name, setName] = useState(authSession?.fullName || '');
  const [email, setEmail] = useState(authSession?.email || '');
  const [subject, setSubject] = useState('ResumeIQ X Feedback');
  const [message, setMessage] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const validateAndCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast({
        type: 'warning',
        title: 'Complete all required fields',
        description: 'Enter your name, email, and message before composing.',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast({ type: 'error', title: 'Invalid email address format' });
      return;
    }

    const body = `From: ${name.trim()} (${email.trim()})\n\n${message.trim()}`;
    const mailtoUrl = `mailto:support@resumeiqx.local?subject=${encodeURIComponent(
      subject.trim()
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setSubmittedNotice(true);
    addToast({
      type: 'info',
      title: 'Email client draft triggered',
      description: 'No message was sent to a server; ResumeIQ X has no backend.',
    });
  };

  const handleCopyMessage = async () => {
    const formatted = `Subject: ${subject}\nFrom: ${name} <${email}>\n\n${message}`;
    try {
      await navigator.clipboard.writeText(formatted);
      addToast({ type: 'success', title: 'Message text copied to clipboard' });
    } catch {
      addToast({ type: 'error', title: 'Clipboard access blocked' });
    }
  };

  const content = (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contact &amp; Support
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Prepare an email draft or copy feedback locally.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <strong>No Backend Server:</strong> Because ResumeIQ X operates strictly inside your browser, submitting this form opens your local email client via a <code className="font-mono">mailto:</code> link rather than transmitting data to a remote server.
        </p>
      </div>

      <Card>
        <CardHeader title="Compose Support / Feedback Message" />
        <form onSubmit={validateAndCompose} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Your Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Message *
            </label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question, parsing issue, or suggestion..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-3"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCopyMessage}
              disabled={!message.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Draft Text</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-semibold text-white"
            >
              <Mail className="h-4 w-4" />
              <span>Open Email Client</span>
            </button>
          </div>

          {submittedNotice && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your browser&apos;s default email handler was invoked with the composed draft. If no email client opened, use &ldquo;Copy Draft Text&rdquo; above.
            </p>
          )}
        </form>
      </Card>
    </div>
  );

  return authSession ? <WorkspaceLayout>{content}</WorkspaceLayout> : <PublicShell>{content}</PublicShell>;
}
