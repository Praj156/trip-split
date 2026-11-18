'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-sky">
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-navy">
          This page didn&apos;t load. Your data is safe. Try again, and if it keeps happening, reload the page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 h-11 px-5 rounded-full bg-teal text-white font-bold hover:bg-teal-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
