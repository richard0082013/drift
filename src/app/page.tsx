import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-800">
          Drift
        </h1>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Your personal stability early-warning system. Track energy, stress, and
          social connection in under 10 seconds a day.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-coral-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-coral-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center justify-center rounded-lg border border-cream-200 bg-cream-50 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-cream-100 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Check-in */}
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-card text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-slate-700">10-Second Check-in</h3>
          <p className="text-xs text-slate-400">Rate energy, stress, and social connection daily. Quick, private, and meaningful.</p>
        </div>

        {/* Card 2: Trends */}
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-card text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-sage-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v-5.5" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-slate-700">Visual Trends</h3>
          <p className="text-xs text-slate-400">See your patterns over 7 or 30 days with beautiful, intuitive charts.</p>
        </div>

        {/* Card 3: Alerts */}
        <div className="rounded-xl border border-cream-200 bg-white p-6 shadow-card text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-slate-700">Smart Alerts</h3>
          <p className="text-xs text-slate-400">Get notified when your patterns suggest you might need extra support.</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-4">
        <p className="text-sm text-slate-400">
          Drift is not a medical tool. It helps you notice patterns — not diagnose conditions.
        </p>
      </section>
    </main>
  );
}
