import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Logo } from '@/app/components/Logo';
import { CURRENCIES } from '@/lib/validation';

// An example trip, drawn as a road with one expense at each stop.
const STOPS = [
  { what: 'Car rental', amount: '475', who: 'Anil', warm: true },
  { what: 'Fuel', amount: '280', who: 'Priya', warm: false },
  { what: 'Entry tickets', amount: '120', who: 'Preeti', warm: true },
  { what: 'Snacks', amount: '90', who: 'Suraj', warm: false },
  { what: 'Dinner', amount: '300', who: 'Priya', warm: true },
];
const STOP_X = [200, 380, 560, 720, 900];
const STOP_Y = [80, 90, 48, 90, 118];

const STEPS = [
  { title: 'Start the trip', body: 'Add the dates, currency and members. A member can be one person or a whole family.' },
  { title: 'Log it on the way', body: 'Send each member their own link. They add what they paid, with no app or account needed.' },
  { title: 'Settle at home', body: 'Share the summary in the group chat, then mark the trip completed once everyone has paid.' },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-sky text-navy">
      <header className="bg-white border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.5rem] flex items-center justify-between gap-4" aria-label="Main">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/sign-in" className="h-10 inline-flex items-center px-3 sm:px-4 rounded-full text-[0.9375rem] font-semibold text-navy hover:bg-sky">
              Sign in
            </Link>
            <Link href="/sign-up" className="h-10 inline-flex items-center px-4 sm:px-5 rounded-full bg-navy text-white text-[0.9375rem] font-bold hover:bg-navy-2">
              Create a trip
            </Link>
          </div>
        </nav>
      </header>

      <main className="grow">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 text-center">
          <h1 className="font-display mx-auto max-w-[15em] text-[2.5rem] leading-[1.04] sm:text-[3.5rem] lg:text-[3.875rem] font-extrabold tracking-[-0.02em] text-balance">
            Every stop on the trip, split fairly.
          </h1>
          <p className="mt-4 mx-auto max-w-[34em] text-[1.0625rem] sm:text-[1.1875rem] leading-relaxed text-ink-2">
            Fuel, the cabin, that dinner nobody planned. Members add what they paid along the way, and the trip ends
            with a short list of who pays whom.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up" className="h-12 inline-flex items-center px-6 rounded-full bg-teal text-white text-base font-bold hover:bg-teal-2">
              Plan a trip, it’s free
            </Link>
            <a href="#how-it-works" className="h-12 inline-flex items-center px-6 rounded-full bg-white text-navy text-base font-bold border border-line-2 hover:border-navy/40">
              See how it works
            </a>
          </div>
        </section>

        {/* The example trip as a road */}
        <section aria-label="Example trip" className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
          <div className="rounded-[28px] bg-white border border-line px-5 sm:px-8 pt-6 pb-6 overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl font-bold">Al Ain day trip</p>
              <p className="text-sm text-ink-2">6 members, 1,445 AED in 7 expenses</p>
            </div>
            <svg viewBox="0 0 1100 170" className="hidden sm:block w-full h-auto mt-3" aria-hidden="true">
              <path d="M20 120 C 160 30, 260 150, 380 90 S 600 20, 720 90 S 940 160, 1080 60" stroke="#e3ebf3" strokeWidth="12" fill="none" strokeLinecap="round" />
              <path d="M20 120 C 160 30, 260 150, 380 90 S 600 20, 720 90 S 940 160, 1080 60" stroke="#c9d6e3" strokeWidth="2" strokeDasharray="10 12" fill="none" />
              <circle cx="20" cy="120" r="9" fill="#13324a" />
              {STOPS.map((s, i) => (
                <circle key={s.what} cx={STOP_X[i]} cy={STOP_Y[i]} r="11" fill={s.warm ? '#ff9b5c' : '#7fd6cf'} />
              ))}
              <circle cx="1080" cy="60" r="14" fill="#0f6e68" />
              <path d="M1073 60l5 5 9-10" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <ol className="mt-4 sm:mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-left">
              {STOPS.map((s) => (
                <li key={s.what} className={`rounded-2xl p-3 ${s.warm ? 'bg-sunset-soft' : 'bg-teal-soft'}`}>
                  <p className={`text-sm font-semibold ${s.warm ? 'text-sunset-ink' : 'text-teal-2'}`}>{s.what}</p>
                  <p className="font-display text-lg font-bold">{s.amount} AED</p>
                  <p className="text-sm text-ink-2">{s.who} paid</p>
                </li>
              ))}
              <li className="rounded-2xl p-3 bg-navy text-white">
                <p className="text-sm font-semibold text-[#bfe9e5]">Home, settled</p>
                <p className="font-display text-lg font-bold">5 transfers</p>
                <p className="text-sm text-[#d7e2ec]">and everyone is even</p>
              </li>
            </ol>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 scroll-mt-4">
          <h2 className="font-display text-[1.75rem] sm:text-[2.125rem] font-extrabold tracking-[-0.01em]">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[20px] bg-white border border-line p-6">
                <span className="font-display text-3xl font-extrabold text-sunset" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1.5 text-ink-2 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] bg-teal-soft p-6">
              <h3 className="font-display text-xl font-bold">Split between exactly who was there</h3>
              <p className="mt-1.5 text-ink-2 leading-relaxed">
                Skipped the kayaks? Leave a member off that one cost and the shares adjust. Families count as one member, so
                the Sharmas pay as a household.
              </p>
            </div>
            <div className="rounded-[20px] bg-sunset-soft p-6">
              <h3 className="font-display text-xl font-bold">Works in your currency</h3>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Supported currencies">
                {CURRENCIES.map((c) => (
                  <li key={c.code} title={c.label} className="px-3 py-1 rounded-full bg-white text-sm font-bold">
                    {c.code}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy text-[#d7e2ec]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="font-display text-2xl font-bold text-white">Back from a trip? Settle it tonight.</p>
            <p className="mt-1 text-[0.9375rem]">Only the organiser needs an account. © {new Date().getFullYear()} TripSplit</p>
          </div>
          <Link href="/sign-up" className="self-start md:self-auto h-12 inline-flex items-center px-6 rounded-full bg-peach text-navy font-bold hover:bg-sunset">
            Create your first trip
          </Link>
        </div>
      </footer>
    </div>
  );
}
