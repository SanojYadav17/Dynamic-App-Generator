'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { AppConfig, FormField } from '@/lib/config';
import type { GeneratedRun } from '@/lib/storage';
import { CSVImportPanel } from './csv-import-panel';

type RuntimeProps = {
  initialConfig: AppConfig;
  issues: string[];
  runs: GeneratedRun[];
};

type FormState = Record<string, string | boolean>;

type NotificationEvent = {
  id: string;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  actor?: string;
  createdAt: string;
};

type FeedbackTone = 'info' | 'success' | 'error';

type FeedbackState = {
  text: string;
  tone: FeedbackTone;
  formId?: string;
};

export function AppRuntime({ initialConfig, issues, runs }: RuntimeProps) {
  const [config] = useState(initialConfig);
  const [runItems, setRunItems] = useState<GeneratedRun[]>(runs);
  const [selectedRun, setSelectedRun] = useState<GeneratedRun | null>(runs[0] ?? null);
  const [userId, setUserId] = useState('demo-user');
  const [userEmail, setUserEmail] = useState(config.auth.demoUser?.email ?? 'Not signed in');
  const [isLoading, setIsLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<Record<string, FormState>>({});
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(issues[0] ?? null);
  const [submittingFormId, setSubmittingFormId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      setNotifications(payload.events ?? []);
    } catch {
      // Keep runtime usable even if notifications API is temporarily unavailable.
    }
  };

  const pushFeedback = (text: string, tone: FeedbackTone = 'info', formId?: string) => {
    setFeedback({ text, tone, formId });
  };

  const handleFormSubmit = async (formId: string, nextValues: FormState) => {
    setSubmittingFormId(formId);
    pushFeedback(`Submitted ${formId} with ${Object.keys(nextValues).length} fields.`, 'info', formId);

    try {
      if (formId === 'auth-signin') {
        const email = String(nextValues.email ?? '').trim();
        const password = String(nextValues.password ?? '');

        if (!email || !password) {
          pushFeedback('Email and password are required for sign in.', 'error', formId);
          return;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const payload = await response.json();
        if (!response.ok) {
          pushFeedback(payload.error ?? 'Login failed', 'error', formId);
          return;
        }

        setUserId(payload.user.id);
        setUserEmail(payload.user.email);
        const runsResponse = await fetch('/api/runs', {
          headers: { 'x-user-id': payload.user.id }
        });
        const runsPayload = await runsResponse.json();
        setRunItems(runsPayload.runs ?? []);
        setSelectedRun((runsPayload.runs ?? [])[0] ?? null);
        await loadNotifications();
        pushFeedback(`Signed in as ${payload.user.email}`, 'success', formId);
        return;
      }

      if (formId === 'auth-signup') {
        const email = String(nextValues.email ?? '').trim();
        const password = String(nextValues.password ?? '');

        if (!email || !password) {
          pushFeedback('Email and password are required for sign up.', 'error', formId);
          return;
        }

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const payload = await response.json();
        if (!response.ok) {
          pushFeedback(payload.error ?? 'Signup failed', 'error', formId);
          return;
        }

        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: payload.user.email,
            subject: 'Welcome to Dynamic App Generator',
            body: 'Your account is now ready.'
          })
        });

        await loadNotifications();
        pushFeedback(`Account created for ${payload.user.email}`, 'success', formId);
        return;
      }

      if (formId === 'auth-otp') {
        const email = String(nextValues.email ?? '').trim();
        const otp = String(nextValues.otp ?? '').trim();

        if (!email) {
          pushFeedback('Email is required for OTP flow.', 'error', formId);
          return;
        }

        if (!otp) {
          const requestResponse = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const requestPayload = await requestResponse.json();
          if (!requestResponse.ok) {
            pushFeedback(requestPayload.error ?? 'Unable to request OTP', 'error', formId);
            return;
          }

          await loadNotifications();
          pushFeedback(`OTP requested for ${email}. Demo OTP: ${requestPayload.otp}`, 'success', formId);
          return;
        }

        const response = await fetch('/api/auth/login-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });

        const payload = await response.json();
        if (!response.ok) {
          pushFeedback(payload.error ?? 'OTP login failed', 'error', formId);
          return;
        }

        setUserId(payload.user.id);
        setUserEmail(payload.user.email);
        const runsResponse = await fetch('/api/runs', {
          headers: { 'x-user-id': payload.user.id }
        });
        const runsPayload = await runsResponse.json();
        setRunItems(runsPayload.runs ?? []);
        setSelectedRun((runsPayload.runs ?? [])[0] ?? null);
        await loadNotifications();
        pushFeedback(`Signed in with OTP as ${payload.user.email}`, 'success', formId);
        return;
      }

      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextValues.workspaceName || config.title,
          slug: String(nextValues.workspaceName || config.slug).toLowerCase().replace(/\s+/g, '-'),
          ownerId: userId,
          config
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        pushFeedback(payload.error ?? 'Unable to create app run.', 'error', formId);
        return;
      }

      const nextRun = payload.run as GeneratedRun;
      setRunItems((current) => [nextRun, ...current]);
      setSelectedRun(nextRun);
      await loadNotifications();
      pushFeedback(`New runtime generated: ${nextRun.slug}`, 'success', formId);
    } catch {
      pushFeedback('Something went wrong while processing this action.', 'error', formId);
    } finally {
      setSubmittingFormId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    const nextState: Record<string, FormState> = {};
    for (const form of config.forms) {
      nextState[form.id] = Object.fromEntries(
        form.fields.map((field) => [field.name, field.type === 'checkbox' ? false : ''])
      );
    }
    setActiveForm(nextState);
  }, [config]);

  const sections = useMemo(() => config.sections, [config.sections]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (runtimeError) {
    return <ErrorState message={runtimeError} onReset={() => setRuntimeError(null)} />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.97),rgba(247,244,238,0.92))] p-6 shadow-glow backdrop-blur md:p-8">
        <div className="pointer-events-none absolute" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper">
              Full-stack demo task
            </p>
            <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">{config.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">{config.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {config.auth.methods.map((method) => (
                <span
                  key={method}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-ink px-5 py-4 text-paper shadow-lg">
            <p className="text-xs uppercase tracking-[0.22em] text-paper/60">Runtime status</p>
            <p className="mt-2 text-lg font-semibold">{isPending || submittingFormId ? 'Updating' : 'Ready'}</p>
            <p className="text-sm text-paper/70">{config.slug}</p>
          </div>
        </div>
      </header>

      {sections.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {sections.map((section) => (
            <SectionCard key={section.title} section={section} config={config} />
          ))}
        </section>
      ) : null}

      <main className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <MetricsPanel metrics={config.metrics} />
          <FormsPanel
            forms={config.forms}
            values={activeForm}
            isPending={isPending}
            submittingFormId={submittingFormId}
            feedback={feedback}
            onSubmit={(formId, nextValues) => {
              startTransition(() => {
                void handleFormSubmit(formId, nextValues);
              });
            }}
            onChange={(formId, nextValues) => {
              setActiveForm((current) => ({ ...current, [formId]: nextValues }));
            }}
          />
          <TablesPanel tables={config.tables} onSelectRun={setSelectedRun} selectedRun={selectedRun} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Generated runs">
            <div className="space-y-3">
              {runItems.map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRun(run)}
                    className={clsx(
                      'w-full rounded-2xl border px-4 py-3 text-left transition duration-200 hover:shadow-md',
                      selectedRun?.id === run.id
                        ? 'border-ink bg-ink text-paper shadow-lg shadow-black/10'
                        : 'border-black/10 bg-white hover:-translate-y-0.5 hover:border-ink/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{run.title}</p>
                        <p className={clsx('text-sm', selectedRun?.id === run.id ? 'text-paper/70' : 'text-slate-500')}>
                          {run.slug}
                        </p>
                      </div>
                      <span className={clsx(
                        'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        run.status === 'live' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                      )}>
                        {run.status}
                      </span>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Auth preview">
            <div className="rounded-2xl border border-black/10 bg-[#f9fafb] p-4">
              <p className="text-sm text-slate-500">Mode</p>
              <p className="font-semibold text-ink">{config.auth.mode}</p>
              <p className="mt-3 text-sm text-slate-500">Demo user</p>
              <p className="font-semibold text-ink">{config.auth.demoUser?.email ?? 'Not configured'}</p>
              <p className="mt-3 text-sm text-slate-500">Enabled methods</p>
              <p className="font-semibold text-ink">{config.auth.methods.join(', ')}</p>
              <p className="mt-3 text-sm text-slate-500">Signed-in identity</p>
              <p className="font-semibold text-ink">{userEmail}</p>
            </div>
          </Panel>

          <Panel title="Notifications">
            <div className="space-y-2">
              {notifications.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-2xl border border-black/10 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{event.message}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        event.level === 'success' && 'bg-emerald-100 text-emerald-700',
                        event.level === 'info' && 'bg-sky-100 text-sky-700',
                        event.level === 'warning' && 'bg-amber-100 text-amber-700',
                        event.level === 'error' && 'bg-rose-100 text-rose-700'
                      )}
                    >
                      {event.level}
                    </span>
                    <span>{event.type}</span>
                    <span>•</span>
                    <span>{new Date(event.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : null}
            </div>
          </Panel>

          <CSVImportPanel />

          <Panel title="Validation">
            {feedback ? (
              <p
                className={clsx(
                  'mb-3 rounded-2xl px-4 py-3 text-sm',
                  feedback.tone === 'success' && 'bg-emerald-100 text-emerald-800',
                  feedback.tone === 'error' && 'bg-rose-100 text-rose-800',
                  feedback.tone === 'info' && 'bg-mint/20 text-ink'
                )}
              >
                {feedback.text}
              </p>
            ) : null}
            <p className="text-sm leading-6 text-slate-600">
              Missing fields, unknown config values, and unsupported sections are handled by defensive normalization
              instead of crashing the runtime.
            </p>
          </Panel>
        </aside>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f4ee_45%,_#e7e2d9_100%)] px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-black/10 bg-white/90 p-8 shadow-glow">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 h-12 w-4/5 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-xl rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-rose-950 shadow-glow">
        <h2 className="text-2xl font-black">Config error</h2>
        <p className="mt-3 text-sm leading-6">{message}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          Retry runtime
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-reveal rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-glow backdrop-blur">
      <h2 className="mb-4 text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function MetricsPanel({ metrics }: { metrics: AppConfig['metrics'] }) {
  return (
    <Panel title="Metrics">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff, #f7f4ee)] p-4">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{metric.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{metric.delta ?? 'stable'}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FormsPanel({
  forms,
  values,
  isPending,
  submittingFormId,
  feedback,
  onSubmit,
  onChange
}: {
  forms: AppConfig['forms'];
  values: Record<string, FormState>;
  isPending: boolean;
  submittingFormId: string | null;
  feedback: FeedbackState | null;
  onSubmit: (formId: string, nextValues: FormState) => void;
  onChange: (formId: string, nextValues: FormState) => void;
}) {
  return (
    <Panel title="Forms">
      <div className="space-y-5">
        {forms.map((form) => {
          const isSubmittingThisForm = submittingFormId === form.id;

          return (
            <form
            key={form.id}
            className="rounded-[24px] border border-black/10 bg-[#fffaf3] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(form.id, values[form.id] ?? {});
            }}
          >
            <div className="mb-4">
              <h3 className="text-base font-bold text-ink">{form.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{form.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {form.fields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[form.id]?.[field.name]}
                  onChange={(nextValue) => {
                    const current = values[form.id] ?? {};
                    const nextValues = { ...current, [field.name]: nextValue };
                    onChange(form.id, nextValues);
                  }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={isPending && isSubmittingThisForm}
              className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && isSubmittingThisForm ? 'Processing...' : form.submitLabel}
            </button>
            {form.id === 'auth-otp' ? (
              <button
                type="button"
                disabled={isPending && isSubmittingThisForm}
                onClick={() => onSubmit(form.id, { ...(values[form.id] ?? {}), otp: '' })}
                className="ml-2 mt-4 rounded-full border border-ink px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && isSubmittingThisForm ? 'Processing...' : 'Request OTP'}
              </button>
            ) : null}
            {feedback?.formId === form.id ? (
              <p
                className={clsx(
                  'mt-3 rounded-xl px-3 py-2 text-xs font-medium',
                  feedback.tone === 'success' && 'bg-emerald-100 text-emerald-800',
                  feedback.tone === 'error' && 'bg-rose-100 text-rose-800',
                  feedback.tone === 'info' && 'bg-sky-100 text-sky-800'
                )}
              >
                {feedback.text}
              </p>
            ) : null}
            </form>
          );
        })}
      </div>
    </Panel>
  );
}

function FieldControl({
  field,
  value,
  onChange
}: {
  field: FormField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  const baseClassName =
    'mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-sky/15';

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">{field.label}</span>
        <textarea
          className={clsx(baseClassName, 'min-h-28')}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      <input
        className={baseClassName}
        type={field.type}
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TablesPanel({
  tables,
  onSelectRun,
  selectedRun
}: {
  tables: AppConfig['tables'];
  onSelectRun: (run: GeneratedRun) => void;
  selectedRun: GeneratedRun | null;
}) {
  return (
    <Panel title="Tables">
      <div className="space-y-5 overflow-x-auto">
        {tables.map((table) => (
          <div key={table.id} className="min-w-[640px] rounded-[24px] border border-black/10 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-bold text-ink">{table.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {table.rows.length} rows
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-slate-500">
                  {table.columns.map((column) => (
                    <th key={column.key} className="pb-3 pr-4 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={index} className="border-b border-black/5 transition hover:bg-slate-50/70 last:border-none">
                    {table.columns.map((column) => (
                      <td key={column.key} className="py-3 pr-4 text-slate-700">
                        {String(row[column.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedRun) {
                    onSelectRun(selectedRun);
                  }
                }}
                className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink"
              >
                Focus selected run
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SectionCard({ section, config }: { section: AppConfig['sections'][number]; config: AppConfig }) {
  if (section.type === 'hero') {
    return (
      <article className="rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,.94),rgba(247,244,238,.94))] p-6 shadow-glow lg:col-span-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Hero</p>
        <h2 className="mt-3 text-2xl font-black text-ink">{section.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-600">{section.body}</p>
      </article>
    );
  }

  if (section.type === 'metrics') {
    return <article className="rounded-[28px] border border-black/10 bg-white p-6 shadow-glow lg:col-span-3"><p className="font-semibold text-ink">{section.title}</p><p className="mt-2 text-sm text-slate-500">{config.metrics.length} metrics available in the runtime.</p></article>;
  }

  if (section.type === 'forms') {
    return <article className="rounded-[28px] border border-black/10 bg-white p-6 shadow-glow lg:col-span-3"><p className="font-semibold text-ink">{section.title}</p><p className="mt-2 text-sm text-slate-500">Forms are rendered from JSON and tolerate missing fields.</p></article>;
  }

  if (section.type === 'tables') {
    return <article className="rounded-[28px] border border-black/10 bg-white p-6 shadow-glow lg:col-span-3"><p className="font-semibold text-ink">{section.title}</p><p className="mt-2 text-sm text-slate-500">Tables support empty-state and schema-driven columns.</p></article>;
  }

  return (
    <article className="rounded-[28px] border border-black/10 bg-white p-6 shadow-glow lg:col-span-3">
      <p className="font-semibold text-ink">{section.title}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {section.items.map((item) => (
          <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}