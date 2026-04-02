'use client';

type PageSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * Consistent card shell for main workflow steps (research → sources → facts → posts → history).
 */
export function PageSection({ title, description, children }: PageSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
