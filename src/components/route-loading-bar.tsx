'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A slim animated bar at the top of the viewport that appears whenever the
 * route changes, and during any link click before Next.js finishes
 * navigating. This is the fix for "I clicked something and nothing seemed
 * to happen on slow internet" — the user gets immediate visual feedback
 * that their click registered, even if the actual page takes a few seconds
 * to arrive.
 */
export default function RouteLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      // Only show the bar for actual same-app navigations, not external
      // links, anchors, mailto, or modified clicks (new tab, etc.).
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        target.target === '_blank' ||
        e.metaKey ||
        e.ctrlKey
      ) {
        return;
      }
      setLoading(true);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-[var(--bg-subtle)] overflow-hidden">
      <div className="h-full bg-[var(--accent)] animate-[route-loading_1.1s_ease-in-out_infinite]" style={{ width: '40%' }} />
      <style jsx>{`
        @keyframes route-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
