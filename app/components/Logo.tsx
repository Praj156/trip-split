import Link from 'next/link';

/** The TripSplit mark: a road between two stops. */
export function LogoMark({ className = 'w-8 h-8', onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill={onDark ? '#24506f' : '#13324a'} />
      <path d="M8 21c4-1 5-9 9-9s3 6 7 5" stroke="#ffc48c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="21" r="2.6" fill="#7fd6cf" />
      <circle cx="24" cy="17" r="2.6" fill="#ff9b5c" />
    </svg>
  );
}

export function Logo({ href = '/', size = 'md', tone = 'dark' }: { href?: string; size?: 'sm' | 'md'; tone?: 'dark' | 'light' }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-full" aria-label="TripSplit home">
      <LogoMark className={size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'} onDark={tone === 'light'} />
      <span className={`font-display font-extrabold tracking-tight ${tone === 'light' ? 'text-white' : 'text-navy'} ${size === 'sm' ? 'text-xl' : 'text-[1.375rem]'}`}>
        TripSplit
      </span>
    </Link>
  );
}
