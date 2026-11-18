import Link from 'next/link';
import { Logo } from '@/app/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-sky">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Logo />
        </div>
      </header>
      <main className="grow flex items-center justify-center px-4 pb-20">
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-navy">
            The link may be mistyped, or the trip may have been deleted. If someone sent you a personal link, ask them
            for a new one.
          </p>
          <Link href="/" className="inline-flex mt-6 h-11 px-5 items-center rounded-full bg-teal text-white font-bold hover:bg-teal-2">
            Go to TripSplit
          </Link>
        </div>
      </main>
    </div>
  );
}
