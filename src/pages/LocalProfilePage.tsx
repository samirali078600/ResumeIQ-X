import { useState } from 'react';
import { Info, Save, UserCheck } from 'lucide-react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';
import type { ExperienceLevel } from '../types/resume';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#080D1A] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors';

export default function LocalProfilePage() {
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const addToast = useAppStore((s) => s.addToast);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [careerTarget, setCareerTarget] = useState(profile.careerTarget);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [linkedin, setLinkedin] = useState(profile.linkedin);
  const [portfolio, setPortfolio] = useState(profile.portfolio);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      addToast({
        type: 'warning',
        title: 'Invalid email format',
        description: 'Enter a valid email address or leave the field blank.',
      });
      return;
    }
    await saveProfile({
      displayName: displayName.trim(),
      careerTarget: careerTarget.trim(),
      experienceLevel,
      email: trimmedEmail,
      phone: phone.trim(),
      location: location.trim(),
      linkedin: linkedin.trim(),
      portfolio: portfolio.trim(),
    });
    addToast({ type: 'success', title: 'Local profile updated' });
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-3xl space-y-6 animate-panel-in">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Local User Profile
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Personalize your local workspace defaults for the Resume Builder and Cover Letter Studio.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-[#0D1529] p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <strong>Local-Only Workspace Notice:</strong> ResumeIQ X does not use remote servers or cloud accounts. Your profile preferences and local sign-in credentials stay strictly inside this browser&apos;s IndexedDB.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Candidate Profile &amp; Career Preferences"
            subtitle="Used to pre-fill headers when starting a new resume draft or cover letter"
            action={
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                <UserCheck className="h-4 w-4" />
                <span>Browser-Local</span>
              </span>
            }
          />
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Role / Career Focus
                </label>
                <input
                  type="text"
                  value={careerTarget}
                  onChange={(e) => setCareerTarget(e.target.value)}
                  placeholder="e.g., Backend Engineer"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className={INPUT_CLASS}
                >
                  <option value="entry">Entry Level / Recent Graduate</option>
                  <option value="mid">Mid-Level Practitioner</option>
                  <option value="senior">Senior / Staff</option>
                  <option value="executive">Management / Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Country"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Portfolio / GitHub URL
                </label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="github.com/..."
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Local Profile</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
