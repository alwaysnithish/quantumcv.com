import Link from 'next/link';
import { Fragment } from 'react';
import type { Block } from '@/lib/blog-types';
import { slugify } from '@/lib/blog';

const LINK_CLASS =
  'text-[var(--accent)] underline underline-offset-4 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)]';

// Supports [label](/path) links and **bold** inside any text string.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          return href.startsWith('/') ? (
            <Link key={i} href={href} className={LINK_CLASS}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              {label}
            </a>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i} className="font-semibold text-[var(--fg)]">{bold[1]}</strong>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="text-[1.0625rem] leading-8 text-[var(--fg)]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return (
              <p key={i} className="mt-5">
                <Inline text={b.text} />
              </p>
            );
          case 'h2':
            return (
              <h2
                key={i}
                id={slugify(b.text)}
                className="scroll-mt-24 mt-14 text-2xl sm:text-[1.7rem] font-extrabold tracking-tight leading-snug"
              >
                {b.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="mt-8 text-lg font-bold tracking-tight">
                {b.text}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="mt-5 space-y-2.5 pl-6 list-disc marker:text-[var(--accent)]">
                {b.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="mt-5 space-y-3 pl-6 list-decimal marker:font-bold marker:text-[var(--accent)]">
                {b.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          case 'tip':
            return (
              <aside
                key={i}
                className="mt-8 rounded-r-xl border-l-4 border-[var(--accent)] bg-[var(--bg-subtle)] px-5 py-4 text-[1rem] leading-7"
              >
                {b.title && <div className="font-bold mb-1">{b.title}</div>}
                <p className="whitespace-pre-line">
                  <Inline text={b.text} />
                </p>
              </aside>
            );
          case 'compare':
            return (
              <div key={i} className="mt-8">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <div className="text-sm font-bold text-[var(--fg-muted)] mb-1.5">Before</div>
                    <p className="text-[1rem] leading-7 text-[var(--fg-muted)]">{b.before}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--accent)] p-4">
                    <div className="text-sm font-bold text-[var(--accent)] mb-1.5">After</div>
                    <p className="text-[1rem] leading-7">{b.after}</p>
                  </div>
                </div>
                {b.note && (
                  <p className="mt-3 text-[0.95rem] leading-7 text-[var(--fg-muted)]">
                    <Inline text={b.note} />
                  </p>
                )}
              </div>
            );
        }
      })}
    </div>
  );
}
