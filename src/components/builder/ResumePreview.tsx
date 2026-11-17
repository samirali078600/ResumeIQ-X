import type { ResumeBuilderData } from '../../types/resume';

interface ResumePreviewProps {
  data: ResumeBuilderData;
}

export function ResumePreview({ data }: ResumePreviewProps) {
  const accent = data.accentColor || '#4F46E5';
  const fontClass =
    data.fontFamily === 'serif'
      ? 'font-serif'
      : data.fontFamily === 'mono'
        ? 'font-mono'
        : 'font-sans';

  const padClass =
    data.pageMargin === 'compact'
      ? 'p-6 sm:p-7'
      : data.pageMargin === 'spacious'
        ? 'p-10 sm:p-12'
        : 'p-8 sm:p-10';

  const isClassic = data.templateId === 'classic-corporate';
  const isMinimal = data.templateId === 'minimal-ats';
  const isCreative = data.templateId === 'creative-professional';
  const isModern = data.templateId === 'modern-professional';
  const isTech = data.templateId === 'technical-developer';

  const contactParts = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.website,
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  const hasAnyContent =
    data.personal.fullName.trim() ||
    data.summary.trim() ||
    data.experience.length > 0 ||
    data.education.length > 0 ||
    data.projects.length > 0 ||
    data.skills.some((s) => s.items.length > 0);

  const renderSectionHeading = (title: string) => {
    if (isMinimal) {
      return (
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
          {title}
        </h3>
      );
    }
    if (isClassic) {
      return (
        <h3
          className="text-xs font-bold uppercase tracking-widest pb-1 mb-2.5 border-b"
          style={{ color: accent, borderColor: '#CBD5E1' }}
        >
          {title}
        </h3>
      );
    }
    return (
      <h3
        className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2.5 border-b-2"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
      </h3>
    );
  };

  const templateLabel = isClassic
    ? 'Classic Corporate'
    : isMinimal
      ? 'Minimal ATS'
      : isCreative
        ? 'Creative Professional'
        : isTech
          ? 'Technical Developer'
          : 'Modern Professional';

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-100/90 dark:bg-[#050811] p-3 sm:p-5 print:p-0 print:border-none print:bg-white">
      <div className="flex items-center justify-between gap-2 pb-3 px-1 text-[11px] text-slate-500 dark:text-slate-400 no-print">
        <span className="font-medium">
          Sheet Preview · {templateLabel}
        </span>
        <span className="font-mono tabular-nums">
          US Letter · {data.pageMargin} margin
        </span>
      </div>
      <div
        className={`bg-white text-slate-900 shadow-md border border-slate-200 dark:border-slate-700/80 rounded-lg overflow-hidden ${fontClass} print-only-container`}
      >
        {(isModern || isCreative) && (
          <div className="h-2 w-full" style={{ backgroundColor: accent }} />
        )}

        <div className={`${padClass} space-y-5 text-[12.5px] leading-relaxed`}>
        {/* Header */}
        <header
          className={`pb-4 border-b border-slate-200 ${
            isClassic ? 'text-center' : isCreative ? 'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3' : ''
          }`}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {data.personal.fullName.trim() || 'Your Full Name'}
            </h1>
            {data.personal.headline.trim() && (
              <p
                className="mt-0.5 text-sm font-medium"
                style={{ color: isMinimal ? '#334155' : accent }}
              >
                {data.personal.headline}
              </p>
            )}
          </div>
          {contactParts.length > 0 && (
            <p
              className={`mt-2 text-[11px] text-slate-600 ${
                isCreative ? 'sm:text-right sm:max-w-xs' : ''
              }`}
            >
              {contactParts.join('  ·  ')}
            </p>
          )}
        </header>

        {!hasAnyContent && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Start filling in your personal details, experience, skills, or projects on the left to see a live formatted preview here.
          </div>
        )}

        {/* Ordered sections */}
        {data.sectionOrder.map((secKey) => {
          if (secKey === 'summary' && data.summary.trim()) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Professional Summary')}
                <p className="text-slate-700 whitespace-pre-line">{data.summary}</p>
              </section>
            );
          }

          if (secKey === 'experience' && data.experience.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Work Experience')}
                <div className="space-y-3.5">
                  {data.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {exp.role || 'Role Title'}
                          {exp.company ? ` — ${exp.company}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {exp.startDate}
                          {exp.startDate ? ' – ' : ''}
                          {exp.current ? 'Present' : exp.endDate}
                        </p>
                      </div>
                      {exp.location && (
                        <p className="text-[11px] text-slate-500">{exp.location}</p>
                      )}
                      {exp.bullets.filter((b) => b.trim()).length > 0 && (
                        <ul className="mt-1.5 list-disc pl-4 space-y-1 text-slate-700">
                          {exp.bullets
                            .filter((b) => b.trim())
                            .map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (secKey === 'skills' && data.skills.some((s) => s.items.length > 0)) {
            return (
              <section key={secKey}>
                {renderSectionHeading(isTech ? 'Technical Stack & Skills' : 'Skills')}
                <div className={isTech ? 'grid grid-cols-1 sm:grid-cols-2 gap-1.5' : 'space-y-1'}>
                  {data.skills
                    .filter((g) => g.items.length > 0)
                    .map((grp) => (
                      <p key={grp.id} className="text-slate-700">
                        <span className="font-semibold text-slate-900">{grp.category}: </span>
                        <span>{grp.items.join(', ')}</span>
                      </p>
                    ))}
                </div>
              </section>
            );
          }

          if (secKey === 'projects' && data.projects.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Projects')}
                <div className="space-y-3">
                  {data.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {proj.name || 'Project Name'}
                          {proj.roleOrTech ? (
                            <span className="font-normal text-slate-600"> · {proj.roleOrTech}</span>
                          ) : null}
                        </p>
                        {proj.link && (
                          <span className="text-[11px] text-slate-500">{proj.link}</span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="mt-0.5 text-slate-700">{proj.description}</p>
                      )}
                      {proj.bullets.filter((b) => b.trim()).length > 0 && (
                        <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700">
                          {proj.bullets
                            .filter((b) => b.trim())
                            .map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (secKey === 'education' && data.education.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Education')}
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {edu.degree || 'Degree'}
                          {edu.institution ? ` — ${edu.institution}` : ''}
                        </p>
                        {(edu.location || edu.gpaOrHonors) && (
                          <p className="text-[11px] text-slate-600">
                            {[edu.location, edu.gpaOrHonors].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      {edu.graduationDate && (
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {edu.graduationDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (secKey === 'certifications' && data.certifications.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Certifications')}
                <ul className="space-y-1 text-slate-700">
                  {data.certifications.map((c) => (
                    <li key={c.id} className="flex flex-wrap justify-between gap-2">
                      <span>
                        <span className="font-medium text-slate-900">{c.name}</span>
                        {c.issuer ? ` — ${c.issuer}` : ''}
                      </span>
                      {c.date && <span className="text-[11px] text-slate-500 tabular-nums">{c.date}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (secKey === 'achievements' && data.achievements.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Achievements')}
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {data.achievements.map((a) => (
                    <li key={a.id}>
                      <span className="font-semibold text-slate-900">{a.title}</span>
                      {a.description ? `: ${a.description}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (secKey === 'languages' && data.languages.length > 0) {
            return (
              <section key={secKey}>
                {renderSectionHeading('Languages')}
                <p className="text-slate-700">
                  {data.languages
                    .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`)
                    .join('  ·  ')}
                </p>
              </section>
            );
          }

          if (secKey === 'custom' && data.customSections.length > 0) {
            return (
              <div key={secKey} className="space-y-4">
                {data.customSections.map((cs) => (
                  <section key={cs.id}>
                    {renderSectionHeading(cs.title || 'Additional Section')}
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {cs.items
                        .filter((it) => it.trim())
                        .map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                    </ul>
                  </section>
                ))}
              </div>
            );
          }

          return null;
        })}
        </div>
      </div>
    </div>
  );
}
