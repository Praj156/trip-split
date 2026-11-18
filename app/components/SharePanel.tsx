'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { initialOf, ui } from './ui';
import { formatMoney } from '@/lib/settlement';
import { getMemberLinks, resetMemberLink, type MemberLink } from '@/app/actions/sharing';

export type MemberStats = Record<string, { count: number; total: number }>;

/**
 * Owner-only: one private link per member. Whoever opens a link can add and
 * edit only the expenses that member paid for, and view the summary.
 */
export default function SharePanel({
  tripId,
  tripName,
  currency,
  stats,
  defaultOpen = false,
}: {
  tripId: string;
  tripName: string;
  currency: string;
  stats: MemberStats;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [links, setLinks] = useState<MemberLink[] | null>(null);
  const [loading, setLoading] = useState(defaultOpen);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMemberLinks(tripId);
      if (res.ok) setLinks(res.data);
      else setError(res.error);
    } catch {
      setError('Could not load links. Try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!defaultOpen) return;
    getMemberLinks(tripId)
      .then((res) => (res.ok ? setLinks(res.data) : setError(res.error)))
      .catch(() => setError('Could not load links. Try again.'))
      .finally(() => setLoading(false));
  }, [defaultOpen, tripId]);

  const toggle = () => {
    if (!open && !links && !loading) void load();
    setOpen((o) => !o);
  };

  // Shared links use the public site address when it's set, so a link sent while
  // testing on localhost still opens for friends (WhatsApp won't link "localhost").
  // Otherwise use this page's address. Links only render after the client fetch,
  // so window is always available here.
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window === 'undefined' ? '' : window.location.origin)).replace(/\/+$/, '');
  const urlFor = (token: string) => `${origin}/m/${token}`;
  const shortUrl = (token: string) => `${origin.replace(/^https?:\/\//, '')}/m/${token.slice(0, 4)}…`;

  const messageFor = (l: MemberLink) =>
    `Hi ${l.name}! Add what you paid for on "${tripName}" so we can settle up.\n\nYour link:\n${urlFor(l.token)}`;

  const copy = async (l: MemberLink) => {
    try {
      await navigator.clipboard.writeText(urlFor(l.token));
      setCopied(l.memberId);
      setTimeout(() => setCopied((c) => (c === l.memberId ? null : c)), 2500);
    } catch {
      window.prompt('Copy this link', urlFor(l.token));
    }
  };

  const reset = async (l: MemberLink) => {
    setResetting(true);
    setError('');
    try {
      const res = await resetMemberLink(tripId, l.memberId);
      if (res.ok) {
        setLinks((prev) => prev?.map((x) => (x.memberId === l.memberId ? { ...x, token: res.data } : x)) ?? null);
        setConfirmReset(null);
      } else {
        setError(res.error);
      }
    } catch {
      setError('Could not make a new link. Try again.');
    }
    setResetting(false);
  };

  const statusOf = (memberId: string) => {
    const s = stats[memberId];
    if (!s || s.count === 0) return { done: false, text: 'Nothing added yet' };
    return {
      done: true,
      text: `${s.count} ${s.count === 1 ? 'expense' : 'expenses'}, ${formatMoney(s.total, currency)}`,
    };
  };

  const iconBtn =
    'group relative h-10 flex-1 min-w-0 px-1.5 md:px-0 md:flex-none md:w-10 inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-xl border bg-white text-[0.8125rem] font-semibold transition-colors';

  return (
    <section className={`${ui.card} no-print overflow-hidden`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 px-4 sm:px-6 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="block font-display text-lg sm:text-xl font-bold text-navy">Let members add their own expenses</span>
          <span className="block text-sm text-ink-2 mt-0.5 max-w-[38.75rem]">
            Each member gets their own link. It opens with their name already chosen, so they can only add their
            own expenses. No sign-in needed.
          </span>
        </span>
        <span className="shrink-0 h-9 px-4 inline-flex items-center rounded-full border border-line-2 text-sm font-semibold text-navy">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open && (
        <div>
          {loading && !links && <p className="px-4 sm:px-6 pb-4 text-sm text-ink-2">Preparing links…</p>}
          {error && (
            <p role="alert" className="px-4 sm:px-6 pb-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {copied ? 'Link copied' : ''}
          </p>

          {links && (
            <ul className="border-t border-line divide-y divide-line">
              {links.map((l) => {
                const status = statusOf(l.memberId);
                const isCopied = copied === l.memberId;
                const confirming = confirmReset === l.memberId;
                return (
                  <li
                    key={l.memberId}
                    className={`px-4 sm:px-6 py-3 ${confirming ? 'bg-sunset-soft' : isCopied ? 'bg-[#f7fbfa]' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2.5">
                      <div className="flex items-center gap-3 min-w-0 md:w-56 md:shrink-0">
                        <span
                          aria-hidden="true"
                          className="w-9 h-9 shrink-0 rounded-full bg-navy text-white inline-flex items-center justify-center font-bold text-sm"
                        >
                          {initialOf(l.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-navy [overflow-wrap:anywhere]">{l.name}</span>
                            {!confirming && (
                              <LinkPill
                                className="md:hidden shrink-0"
                                copied={isCopied}
                                text={`…/m/${l.token.slice(0, 4)}…`}
                                onClick={() => copy(l)}
                              />
                            )}
                          </div>
                          {!confirming && <Status {...status} className="md:hidden mt-0.5 text-[0.8125rem]" />}
                        </div>
                      </div>

                      {confirming ? (
                        <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-2.5 md:flex-1 min-w-0">
                          <p className="text-sm text-sunset-ink md:flex-1">
                            <b>Make a new link?</b> The old one will stop working.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => reset(l)}
                              disabled={resetting}
                              className="flex-1 md:flex-none h-10 md:h-9 px-4 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy-2 disabled:opacity-60"
                            >
                              {resetting ? 'Making link…' : 'Yes, new link'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmReset(null)}
                              className="flex-1 md:flex-none h-10 md:h-9 px-4 rounded-full border border-line-2 bg-white text-navy text-sm font-semibold hover:bg-sky"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="hidden md:block md:flex-1 min-w-0">
                            <LinkPill copied={isCopied} text={shortUrl(l.token)} onClick={() => copy(l)} />
                          </div>
                          <Status {...status} className="hidden md:block md:w-60 text-sm" />
                          <div className="flex gap-1.5 md:shrink-0">
                            <button
                              type="button"
                              onClick={() => copy(l)}
                              aria-label={isCopied ? 'Link copied' : `Copy ${l.name}'s link`}
                              className={`${iconBtn} ${
                                isCopied
                                  ? 'border-teal-mid text-teal'
                                  : 'border-line text-ink-2 hover:bg-sky hover:text-navy'
                              }`}
                            >
                              {isCopied ? <CheckIcon /> : <CopyIcon />}
                              <span className="md:hidden">{isCopied ? 'Copied' : 'Copy'}</span>
                              <Tip>{isCopied ? 'Copied' : 'Copy link'}</Tip>
                            </button>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(messageFor(l))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Send ${l.name}'s link on WhatsApp`}
                              className={`${iconBtn} border-line text-[#1f7a4d] hover:bg-[#e9f6ef]`}
                            >
                              <ChatIcon />
                              <span className="md:hidden">WhatsApp</span>
                              <Tip>Send on WhatsApp</Tip>
                            </a>
                            <button
                              type="button"
                              onClick={() => setConfirmReset(l.memberId)}
                              aria-label={`Make a new link for ${l.name}`}
                              className={`${iconBtn} border-line text-ink-2 hover:bg-sky hover:text-navy`}
                            >
                              <ResetIcon />
                              <span className="md:hidden">New link</span>
                              <Tip>New link</Tip>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="px-4 sm:px-6 py-3 bg-sky border-t border-line text-[0.8125rem] text-ink-3">
            Anyone with a link can add expenses as that member. If a link goes to the wrong person, make a new one.
          </p>
        </div>
      )}
    </section>
  );
}

function LinkPill({
  text,
  copied,
  onClick,
  className = '',
}: {
  text: string;
  copied: boolean;
  onClick: () => void;
  className?: string;
}) {
  // The copy icon button is the accessible control; the pill is a mouse shortcut.
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      title="Click to copy"
      className={`${className} max-w-full truncate rounded-full border px-3 py-1 font-mono text-[0.8125rem] md:text-sm transition-colors ${
        copied
          ? 'border-teal-mid bg-teal-soft text-teal-2'
          : 'border-line bg-sky text-ink-2 hover:border-teal-mid hover:text-teal-2'
      }`}
    >
      {copied ? 'Link copied' : text}
    </button>
  );
}

function Status({ done, text, className = '' }: { done: boolean; text: string; className?: string }) {
  return (
    <span className={`${className} ${done ? 'text-ink-2' : 'text-ink-3'}`}>
      <span
        aria-hidden="true"
        className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${done ? 'bg-teal' : 'bg-line-2'}`}
      />
      {text}
    </span>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="hidden md:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

const svgProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function CopyIcon() {
  return (
    <svg {...svgProps}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...svgProps} strokeWidth={2.4}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...svgProps}>
      <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg {...svgProps}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
