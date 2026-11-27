'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Activity, Users, Eye, Clock, MousePointerClick, TrendingUp, TrendingDown, Globe2, Search, Smartphone } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { flag } from '@/lib/analytics/parse';

type Row = Record<string, any>;
interface Data {
  range: { key: string; label: string; start: string; end: string; tz: string; gran: 'hour' | 'day' };
  kpi: Row; summary: Row; prev: Row; series: Row[]; live: Row[]; liveCount: Row;
  pages: Row[]; landing: Row[]; exits: Row[]; sources: Row[]; hosts: Row[]; utm: Row[]; organic: Row[];
  countries: Row[]; cities: Row[]; tech: Row[]; visitorsMix: Row; heat: Row[]; clicks: Row[]; outbound: Row[];
  funnel: Row; signupSrc: Row[]; recent: Row[]; feed: Row[];
}

const RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']] as const;
const LEN: Record<string, number> = { today: 1, yesterday: 1, '7d': 7, '30d': 30, '90d': 90 };

const fmtN = (n: unknown) => Number(n ?? 0).toLocaleString();
const fmtDur = (s: unknown) => { const n = Math.round(Number(s ?? 0)); return n >= 3600 ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m` : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
const pct = (a: unknown, b: unknown) => (Number(b) > 0 ? Math.round((Number(a) / Number(b)) * 100) : 0);
const regionName = (() => { try { const d = new Intl.DisplayNames(['en'], { type: 'region' }); return (cc: string) => (cc === 'XX' || !cc ? 'Unknown' : d.of(cc) ?? cc); } catch { return (cc: string) => cc; } })();
const SRC_LABEL: Record<string, string> = { direct: 'Direct', organic: 'Organic search', social: 'Social', referral: 'Referral', email: 'Email', paid: 'Paid', campaign: 'Campaign' };

function Card({ title, icon, children, className = '', right }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <section className={`glass p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">{icon}{title}</h2>{right}
      </div>
      {children}
    </section>
  );
}

function Bars({ rows, label, value, sub, max }: { rows: Row[]; label: (r: Row) => React.ReactNode; value: (r: Row) => number; sub?: (r: Row) => React.ReactNode; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map(value));
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="text-xs">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-medium">{label(r)}</span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums">{sub?.(r)}<b>{fmtN(value(r))}</b></span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(2, (value(r) / m) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

const Empty = () => <p className="py-6 text-center text-xs text-[var(--fg-muted)]">No data for this period yet.</p>;

function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (!prev) return <span className="text-[10px] text-[var(--fg-muted)]">no prior data</span>;
  const d = ((cur - prev) / prev) * 100;
  const good = invert ? d <= 0 : d >= 0;
  const Icon = d >= 0 ? TrendingUp : TrendingDown;
  return <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${good ? 'text-emerald-500' : 'text-red-500'}`}><Icon size={11} />{Math.abs(d).toFixed(0)}% vs prev</span>;
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-left text-xs">
        <thead><tr className="text-[10px] uppercase text-[var(--fg-muted)]">{head.map((h, i) => <th key={i} className={`py-1.5 pr-3 font-bold ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-[var(--border)]">{r.map((c, j) => <td key={j} className={`py-2 pr-3 ${j > 0 ? 'text-right tabular-nums' : 'max-w-[260px] truncate font-medium'}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Area/line chart: pageviews (filled) + visitors (line). Hover for tooltip. */
function Chart({ points }: { points: { label: string; views: number; visitors: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800, H = 230, PL = 34, PB = 24, PT = 10;
  const max = Math.max(4, ...points.map((p) => p.views));
  const x = (i: number) => PL + (points.length <= 1 ? 0 : (i / (points.length - 1)) * (W - PL - 24));
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);
  const line = (k: 'views' | 'visitors') => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const step = Math.max(1, Math.ceil(points.length / 8));
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const rel = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(points.length - 1, Math.round(((rel - PL) / (W - PL - 24)) * (points.length - 1))))); }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (<g key={t}><line x1={PL} x2={W - 24} y1={y(max * t)} y2={y(max * t)} stroke="currentColor" opacity="0.08" /><text x={PL - 6} y={y(max * t) + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.5">{Math.round(max * t)}</text></g>))}
        {points.length > 0 && <path d={`${line('views')} L${x(points.length - 1)},${H - PB} L${x(0)},${H - PB} Z`} fill="var(--accent)" opacity="0.14" />}
        <path d={line('views')} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d={line('visitors')} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        {points.map((p, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55">{p.label}</text>)}
        {hover !== null && points[hover] && <g><line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="currentColor" opacity="0.25" /><circle cx={x(hover)} cy={y(points[hover].views)} r="4" fill="var(--accent)" /><circle cx={x(hover)} cy={y(points[hover].visitors)} r="3.5" fill="#a855f7" /></g>}
      </svg>
      {hover !== null && points[hover] && (
        <div className="glass pointer-events-none absolute right-2 top-0 px-3 py-2 text-xs">
          <div className="font-bold">{points[hover].label}</div>
          <div className="text-[var(--accent)]">{fmtN(points[hover].views)} views</div>
          <div className="text-purple-500">{fmtN(points[hover].visitors)} visitors</div>
        </div>
      )}
      <div className="mt-1 flex gap-4 text-[10px] text-[var(--fg-muted)]"><span><i className="mr-1 inline-block h-0.5 w-4 bg-[var(--accent)] align-middle" />Page views</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-purple-500 align-middle" />Visitors</span></div>
    </div>
  );
}

function Heatmap({ cells }: { cells: Row[] }) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 1;
  for (const c of cells) { grid[c.dow][c.hr] = c.n; max = Math.max(max, c.n); }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {grid.map((row, d) => (
          <div key={d} className="mb-[3px] flex items-center gap-[3px]">
            <span className="w-8 text-[10px] text-[var(--fg-muted)]">{days[d]}</span>
            {row.map((n, h) => <div key={h} title={`${days[d]} ${h}:00 — ${n} views`} className="h-5 flex-1 rounded-[3px]" style={{ background: n ? `color-mix(in srgb, var(--accent) ${Math.max(12, Math.round((n / max) * 100))}%, transparent)` : 'var(--bg-subtle)' }} />)}
          </div>
        ))}
        <div className="ml-8 flex justify-between pr-1 text-[9px] text-[var(--fg-muted)]">{[0, 3, 6, 9, 12, 15, 18, 21].map((h) => <span key={h}>{h}:00</span>)}</div>
      </div>
    </div>
  );
}

export default function AnalyticsClient() {
  const [range, setRange] = useState<string>('7d');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveBits, setLiveBits] = useState<{ live: Row[]; liveCount: Row; feed: Row[] } | null>(null);
  const tz = useMemo(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'Asia/Kolkata'; } }, []);

  // opt this browser out of tracking (in addition to the server-side staff exclusion)
  useEffect(() => { document.cookie = 'qcv_notrack=1; max-age=315360000; path=/; samesite=lax'; }, []);

  const load = useCallback(async (r: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}&tz=${encodeURIComponent(tz)}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed to load analytics.');
      setData(j); setLiveBits(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [tz]);

  useEffect(() => { load(range); }, [range, load]);

  // live panel: cheap poll every 15s
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try { const r = await fetch('/api/admin/analytics?live=1', { cache: 'no-store' }); const j = await r.json(); if (j.success) setLiveBits({ live: j.live, liveCount: j.liveCount, feed: j.feed }); } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const live = liveBits?.live ?? data?.live ?? [];
  const liveCount = liveBits?.liveCount ?? data?.liveCount ?? { now_users: 0, last30: 0 };
  const feed = liveBits?.feed ?? data?.feed ?? [];

  const points = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.series.map((r) => [r.b as string, r]));
    const key = data.range.key;
    const startLocal = new Intl.DateTimeFormat('en-CA', { timeZone: data.range.tz }).format(new Date(data.range.start));
    const out: { label: string; views: number; visitors: number }[] = [];
    if (data.range.gran === 'hour') {
      for (let h = 0; h < 24; h++) { const k = `${startLocal}T${String(h).padStart(2, '0')}:00`; const r = map.get(k); out.push({ label: `${String(h).padStart(2, '0')}:00`, views: r?.views ?? 0, visitors: r?.visitors ?? 0 }); }
    } else {
      const base = Date.parse(`${startLocal}T00:00:00Z`);
      for (let i = 0; i < LEN[key]; i++) { const d = new Date(base + i * 86400000).toISOString().slice(0, 10); const r = map.get(`${d}T00:00`); out.push({ label: d.slice(5), views: r?.views ?? 0, visitors: r?.visitors ?? 0 }); }
    }
    return out;
  }, [data]);

  const s = data?.summary ?? {}, p = data?.prev ?? {}, k = data?.kpi ?? {};
  const bounce = pct(s.bounces, s.sessions), pBounce = pct(p.bounces, p.sessions);
  const tech = (kind: string) => (data?.tech ?? []).filter((t) => t.k === kind);
  const funnel = data?.funnel ?? {};

  return (
    <div className="min-h-screen text-[var(--fg)]">
      <header className="mica sticky top-0 z-30 border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"><ArrowLeft size={14} /> Admin</Link>
          <h1 className="flex items-center gap-2 text-lg font-extrabold"><Activity size={18} className="text-[var(--accent)]" /> Analytics</h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[var(--border)] p-0.5">
              {RANGES.map(([id, label]) => <button key={id} onClick={() => setRange(id)} className={`rounded-full px-3 py-1 text-xs font-bold ${range === id ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>{label}</button>)}
            </div>
            <button onClick={() => load(range)} className="rounded-full border border-[var(--border)] p-2 hover:bg-[var(--bg-subtle)]" aria-label="Refresh"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
            <a href={`/api/admin/analytics/export?range=${range === '90d' ? '90d' : range === '30d' ? '30d' : '7d'}`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-subtle)]"><Download size={13} /> CSV</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {error && <div className="glass p-4 text-sm text-red-500">{error}</div>}
        {!data && !error && <div className="glass h-64 animate-pulse" />}

        {data && (
          <>
            <p className="text-[11px] text-[var(--fg-muted)]">Admin visits, bots and “Do Not Track” browsers are never counted. Times are shown in {data.range.tz}. IPs are masked, never stored in full.</p>

            {/* headline: live + today / yesterday / 7d / 30d */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="glass p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[var(--fg-muted)]"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>Live now</div>
                <div className="mt-1 text-3xl font-extrabold tabular-nums">{fmtN(liveCount.now_users)}</div>
                <div className="text-[11px] text-[var(--fg-muted)]">{fmtN(liveCount.last30)} in the last 30 min</div>
              </div>
              {[['Today', k.today_visitors, k.today_views], ['Yesterday', k.y_visitors, k.y_views], ['Last 7 days', k.d7_visitors, k.d7_views], ['Last 30 days', k.d30_visitors, k.d30_views]].map(([l, v, pv]) => (
                <div key={l as string} className="glass p-4">
                  <div className="text-[11px] font-bold uppercase text-[var(--fg-muted)]">{l as string}</div>
                  <div className="mt-1 text-3xl font-extrabold tabular-nums">{fmtN(v)}</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">visitors · {fmtN(pv)} views</div>
                </div>
              ))}
            </div>

            {/* selected range */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { l: 'Visitors', I: Users, v: fmtN(s.visitors), d: <Delta cur={s.visitors} prev={p.visitors} /> },
                { l: 'Page views', I: Eye, v: fmtN(s.views), d: <Delta cur={s.views} prev={p.views} /> },
                { l: 'Sessions', I: Activity, v: fmtN(s.sessions), d: <Delta cur={s.sessions} prev={p.sessions} /> },
                { l: 'Avg. time on site', I: Clock, v: fmtDur(s.avg_dur), d: <Delta cur={s.avg_dur} prev={p.avg_dur} /> },
                { l: 'Bounce rate', I: MousePointerClick, v: `${bounce}%`, d: <Delta cur={bounce} prev={pBounce} invert /> },
                { l: 'Pages / session', I: Eye, v: Number(s.avg_pvs ?? 0).toFixed(1), d: <Delta cur={s.avg_pvs} prev={p.avg_pvs} /> },
              ].map(({ l, I, v, d }) => (
                <div key={l} className="glass p-4"><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[var(--fg-muted)]"><I size={12} />{l}</div><div className="mt-1 text-2xl font-extrabold tabular-nums">{v}</div>{d}</div>
              ))}
            </div>

            <Card title={`Traffic — ${data.range.label}`} icon={<Activity size={15} className="text-[var(--accent)]" />}><Chart points={points} /></Card>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card title="Live visitors" icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} className="lg:col-span-2" right={<span className="text-[10px] text-[var(--fg-muted)]">refreshes every 15s</span>}>
                {!live.length ? <p className="py-6 text-center text-xs text-[var(--fg-muted)]">Nobody on the site right now.</p> : (
                  <Table head={['Page', 'From', 'Where', 'Device', 'Time on page']} rows={live.map((r) => [r.path, SRC_LABEL[r.ref_source] ?? r.ref_source, `${flag(r.country)} ${r.city || regionName(r.country)} · ${r.ip_masked}`, `${r.device} · ${r.browser}`, fmtDur(r.duration_s)])} />
                )}
              </Card>
              <Card title="Activity feed">
                <div className="max-h-72 space-y-1.5 overflow-auto text-xs">
                  {feed.map((f, i) => (
                    <div key={i} className="flex items-center gap-2"><span className="w-12 shrink-0 tabular-nums text-[var(--fg-muted)]">{new Date(f.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${f.kind === 'view' ? 'bg-sky-500/15 text-sky-500' : f.kind === 'click' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>{f.kind}</span>
                      <span className="truncate">{flag(f.country)} {f.detail}</span></div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Top pages" icon={<Eye size={15} className="text-[var(--accent)]" />}>
                <Table head={['Page', 'Views', 'Visitors', 'Avg time', 'Scroll']} rows={data.pages.map((r) => [r.path, fmtN(r.views), fmtN(r.visitors), fmtDur(r.avg_dur), `${Math.round(r.avg_scroll)}%`])} />
              </Card>
              <Card title="Landing pages (where visits start)">
                <Table head={['Page', 'Sessions', 'Bounce', 'Avg time', 'Pages']} rows={data.landing.map((r) => [r.path, fmtN(r.sessions), `${pct(r.bounces, r.sessions)}%`, fmtDur(r.avg_dur), Number(r.avg_pvs).toFixed(1)])} />
              </Card>
              <Card title="Exit pages (where visits end)"><Bars rows={data.exits} label={(r) => r.path} value={(r) => r.exits} /></Card>
              <Card title="Most clicked" icon={<MousePointerClick size={15} className="text-[var(--accent)]" />}>
                <Table head={['Element', 'Clicks', 'People', 'On page']} rows={data.clicks.map((r) => [<span key="l" title={r.href}>{r.outbound ? '↗ ' : ''}{r.label || r.href}</span>, fmtN(r.n), fmtN(r.visitors), r.path])} />
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card title="Traffic channels" icon={<Search size={15} className="text-[var(--accent)]" />}>
                <Bars rows={data.sources} label={(r) => SRC_LABEL[r.src] ?? r.src} value={(r) => r.sessions} sub={(r) => <span className="text-[10px] text-[var(--fg-muted)]">{pct(r.bounces, r.sessions)}% bounce</span>} />
              </Card>
              <Card title="Referring sites"><Bars rows={data.hosts} label={(r) => `${r.ref_host}`} value={(r) => r.sessions} sub={(r) => <span className="text-[10px] text-[var(--fg-muted)]">{SRC_LABEL[r.src] ?? r.src}</span>} /></Card>
              <Card title="Campaigns (UTM)"><Table head={['Source / medium / campaign', 'Sessions']} rows={data.utm.map((r) => [[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(' / ') || '—', fmtN(r.sessions)])} /></Card>
            </div>

            <Card title="SEO: landing pages from organic search" icon={<Search size={15} className="text-emerald-500" />} right={<span className="text-[10px] text-[var(--fg-muted)]">Google hides search queries — pair this with Search Console for keywords</span>}>
              <Table head={['Landing page', 'Search engine', 'Sessions', 'Bounce', 'Avg time']} rows={data.organic.map((r) => [r.path, r.engine, fmtN(r.sessions), `${pct(r.bounces, r.sessions)}%`, fmtDur(r.avg_dur)])} />
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
              <Card title="Countries" icon={<Globe2 size={15} className="text-[var(--accent)]" />} className="lg:col-span-2">
                <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  <Bars rows={data.countries.slice(0, 20)} label={(r) => `${flag(r.country)} ${regionName(r.country)}`} value={(r) => r.visitors} sub={(r) => <span className="text-[10px] text-[var(--fg-muted)]">{fmtN(r.views)} views</span>} />
                  <div><div className="mb-2 text-[10px] font-bold uppercase text-[var(--fg-muted)]">Top cities</div><Bars rows={data.cities} label={(r) => `${flag(r.country)} ${r.city}${r.region ? `, ${r.region}` : ''}`} value={(r) => r.visitors} /></div>
                </div>
              </Card>
              <Card title="Visitors" >
                {(() => { const tot = Number(data.visitorsMix.total ?? 0), ret = Number(data.visitorsMix.returning_v ?? 0); return (
                  <div className="space-y-3 text-xs"><div><div className="mb-1 flex justify-between"><span>New</span><b>{fmtN(tot - ret)}</b></div><div className="h-2 rounded-full bg-[var(--bg-subtle)]"><div className="h-full rounded-full bg-sky-500" style={{ width: `${pct(tot - ret, tot)}%` }} /></div></div>
                    <div><div className="mb-1 flex justify-between"><span>Returning</span><b>{fmtN(ret)}</b></div><div className="h-2 rounded-full bg-[var(--bg-subtle)]"><div className="h-full rounded-full bg-purple-500" style={{ width: `${pct(ret, tot)}%` }} /></div></div></div>); })()}
                <div className="mt-5 text-[10px] font-bold uppercase text-[var(--fg-muted)]">Conversion funnel</div>
                <div className="mt-2 space-y-2 text-xs">
                  {[['Visited', funnel.visitors], ['Signed up', funnel.signups], ['Ran an ATS scan', funnel.scans]].map(([l, v], i) => (
                    <div key={l as string}><div className="flex justify-between"><span>{l as string}</span><b>{fmtN(v)} <span className="font-normal text-[var(--fg-muted)]">{i ? `(${pct(v, funnel.visitors)}%)` : ''}</span></b></div><div className="mt-1 h-1.5 rounded-full bg-[var(--bg-subtle)]"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(2, pct(v, funnel.visitors))}%` }} /></div></div>
                  ))}
                  {data.signupSrc.length > 0 && <div className="pt-1 text-[10px] text-[var(--fg-muted)]">Signups by first source: {data.signupSrc.map((r) => `${SRC_LABEL[r.src] ?? r.src} ${r.signups}`).join(' · ')}</div>}
                </div>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-4">
              {[['Devices', 'device'], ['Browsers', 'browser'], ['Operating systems', 'os'], ['Screen widths', 'screen']].map(([title, kind]) => (
                <Card key={kind} title={title} icon={kind === 'device' ? <Smartphone size={15} className="text-[var(--accent)]" /> : undefined}><Bars rows={tech(kind)} label={(r) => r.name} value={(r) => r.n} /></Card>
              ))}
            </div>

            <Card title="When people visit — page views by weekday & hour"><Heatmap cells={data.heat} /></Card>

            <Card title="Recent sessions (visitor journeys)" icon={<Users size={15} className="text-[var(--accent)]" />}>
              <Table head={['When', 'Visitor', 'Source', 'Journey', 'Pages', 'Time']} rows={data.recent.map((r) => [
                r.at,
                <span key="v" className="whitespace-nowrap">{flag(r.country)} {r.city || regionName(r.country)} · {r.ip} · {r.device}/{r.browser}</span>,
                `${SRC_LABEL[r.src] ?? r.src}${r.ref_host ? ` · ${r.ref_host}` : ''}`,
                <span key="j" title={(r.journey ?? []).join(' → ')}>{(r.journey ?? []).join(' → ')}</span>,
                r.pvs, fmtDur(r.dur),
              ])} />
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
