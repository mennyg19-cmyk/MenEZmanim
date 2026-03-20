import Link from 'next/link';

const features = [
  {
    title: 'Live zmanim boards',
    titleHe: 'לוחות זמנים חיים',
    desc: 'Full-screen displays with real-time zmanim, Jewish calendar, and dual-language tables.',
  },
  {
    title: 'WYSIWYG display editor',
    titleHe: 'עורך תצוגה',
    desc: 'Drag-and-drop canvas, themes, backgrounds, and widgets tuned for shul signage.',
  },
  {
    title: 'Minyan schedules',
    titleHe: 'זמני תפילה',
    desc: 'Groups, visibility rules, dynamic offsets from halachic times, and room labels.',
  },
  {
    title: 'Announcements & yahrzeiten',
    titleHe: 'הודעות ויארצייט',
    desc: 'Scrolling tickers, memorials, and priority announcements for the community.',
  },
  {
    title: 'Mobile view',
    titleHe: 'מובייל',
    desc: 'A phone-friendly view for zmanim, schedules, and shul news on the go.',
  },
  {
    title: 'Multi-screen',
    titleHe: 'מסכים מרובים',
    desc: 'Manage several displays and styles from one admin experience.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xl font-bold tracking-tight">Zmanim App</span>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/show/demo/1" className="text-sky-400 hover:text-sky-300 transition-colors">
              View demo
            </Link>
            <Link href="/mobile" className="text-sky-400 hover:text-sky-300 transition-colors">
              Mobile
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
          <p className="text-sky-400/90 text-sm font-semibold uppercase tracking-widest mb-3">
            Synagogue display &amp; zmanim
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Smart Zmanim &amp; Synagogue Display Management
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Build beautiful lobby boards, keep minyan times accurate, and share announcements — with
            Hebrew-friendly layouts and a full admin workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-sky-900/40 hover:bg-sky-500 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/show/demo/1"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3 text-lg font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
            >
              View live demo
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Features</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Everything you need to run a modern zmanim display — from calculation to the big screen.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20 hover:border-sky-900/60 transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-sky-300/90 mb-3 font-medium">{f.titleHe}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/40 py-16">
          <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">See the demo board</h2>
              <p className="text-slate-400 mb-6">
                The sample organization includes schedules, announcements, zmanim tables, and a ticker —
                ready to explore without signing in.
              </p>
              <Link
                href="/show/demo/1"
                className="inline-flex rounded-lg bg-sky-600 px-6 py-2.5 font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                Open display demo
              </Link>
            </div>
            <Link
              href="/show/demo/1"
              className="block rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video shadow-2xl shadow-black/50 hover:border-sky-700/50 transition-colors group"
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-950 min-h-[200px]">
                <div className="text-slate-500 text-sm mb-2">Preview</div>
                <div className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                  /show/demo/1
                </div>
                <div className="text-slate-500 text-sm mt-2">Main display · sample data</div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Zmanim App</span>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">
              Register
            </Link>
            <Link href="/show/demo/1" className="hover:text-slate-300 transition-colors">
              Demo
            </Link>
            <Link href="/mobile" className="hover:text-slate-300 transition-colors">
              Mobile
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
