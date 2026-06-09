import Link from "next/link";

const principles = [
  "Starts by asking what the student has already tried.",
  "Gives hints, strategy, and examples instead of finished answers.",
  "Moves one step at a time so the student does the real thinking.",
];

const guardrails = [
  "Math support focuses on method, setup, and checking work, not the final calculation.",
  "Essay help focuses on thesis, outline, and revision feedback, not writing the whole paper.",
  "Creative help gives inspiration, references, and process prompts, not finished submissions.",
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_30%,#fffaf5_62%,#f8fafc_100%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,rgba(251,191,36,0.22),rgba(249,115,22,0.14),transparent)] blur-3xl" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
              Scholaris
            </p>
            <p className="mt-2 text-sm text-slate-600">
              An AI tutor that teaches thinking, not copying.
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-full border border-slate-900/10 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-900/20 hover:bg-white"
          >
            Open tutor
          </Link>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
              First working version
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              A study partner that helps students build real understanding.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Scholaris guides students through homework, essays, and problem
              sets with questions, hints, and strategies. It protects learning
              by refusing to hand over final graded answers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start learning
              </Link>
              <a
                href="#principles"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900/20 hover:bg-white"
              >
                See the guardrails
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                Example coaching flow
              </p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="font-medium text-white">Student</p>
                  <p>
                    I need help with a quadratic equation. I tried factoring,
                    but I got stuck.
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-300/12 p-4">
                  <p className="font-medium text-amber-200">Scholaris</p>
                  <p>
                    Nice start. What expression are you trying to factor, and
                    which pair of numbers did you test first?
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="font-medium text-white">Student</p>
                  <p>I tested 2 and 3, but the middle term still looked off.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="principles"
          className="grid gap-6 rounded-[2rem] border border-slate-900/8 bg-white/72 p-8 shadow-[0_16px_60px_rgba(15,23,42,0.06)] lg:grid-cols-2"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Teaching principles
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Built for honest learning support.
            </h2>
            <div className="mt-6 space-y-3">
              {principles.map((principle) => (
                <div
                  key={principle}
                  className="rounded-2xl border border-slate-900/8 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  {principle}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Guardrails
            </p>
            <div className="mt-6 space-y-3">
              {guardrails.map((rule) => (
                <div
                  key={rule}
                  className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
