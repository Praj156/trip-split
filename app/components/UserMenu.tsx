'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function UserMenu({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-peach hover:bg-sunset text-navy font-bold text-[0.9375rem] transition-colors"
      >
        {email?.[0]?.toUpperCase() || 'U'}
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-white border border-line rounded-2xl shadow-xl z-50 overflow-hidden p-1.5">
          <div className="px-3 py-2.5 mb-1 border-b border-line">
            <p className="text-xs text-ink-2">Signed in as</p>
            <p className="text-sm font-semibold text-navy truncate">{email}</p>
          </div>
          <Link
            role="menuitem"
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-[0.9375rem] text-navy hover:bg-sky sm:hidden"
          >
            My trips
          </Link>
          <Link
            role="menuitem"
            href="/wizard"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-[0.9375rem] text-navy hover:bg-sky sm:hidden"
          >
            New trip
          </Link>
          <Link
            role="menuitem"
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-[0.9375rem] text-navy hover:bg-sky"
          >
            Profile & settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2.5 rounded-xl text-[0.9375rem] text-navy hover:bg-sky"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
