'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Coins,
  Palette,
  History,
  Save,
  Printer,
  Download,
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import './canvas.css';
import { AnyData } from '@/lib/resume-canvas/sections';
import { TEMPLATES } from '@/lib/resume-canvas/templates';
import { SECTION_TYPE_LABELS, PREVIEW_DATA } from '@/lib/resume-canvas/skeleton';
import {
  initEngine,
  destroyEngine,
  undo,
  redo,
  startFromTemplate,
  addSection,
  addDivider,
  applyColor,
  setFont,
  setFontScale,
  selectTemplate,
  generateResume,
  sendChat,
  saveResume,
  downloadPdf,
  handleExport,
  fetchVersionHistory,
  restoreVersion,
  scheduleAutoSave,
  rerenderResume,
  COLOR_PRESETS,
  FONTS,
  getCurrentResumeId,
} from '@/lib/resume-canvas/engine';

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Canada', 'Germany', 'Australia', 'Singapore'];
const DIVIDER_STYLES = ['solid', 'dashed', 'double', 'dotted', 'thick'];

interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  typing?: boolean;
}
interface Toast {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

export default function BuilderClient({
  resumeId,
  initialData,
  initialRaw,
  initialRole,
  initialCountry,
  initialJobDescription,
}: {
  resumeId: string | null;
  initialData: AnyData | null;
  initialRaw: string;
  initialRole: string;
  initialCountry: string;
  initialJobDescription: string;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasOuterRef = useRef<HTMLDivElement>(null);
  const [paperZoom, setPaperZoom] = useState(1);

  useEffect(() => {
    function computeZoom() {
      const outer = canvasOuterRef.current;
      if (!outer) return;
      const availableWidth = outer.clientWidth - 24; // account for padding
      const naturalWidthPx = 210 * 3.7795; // 210mm in CSS px at 96dpi
      const scale = Math.min(1, availableWidth / naturalWidthPx);
      setPaperZoom(scale);
    }
    computeZoom();
    window.addEventListener('resize', computeZoom);
    return () => window.removeEventListener('resize', computeZoom);
  }, []);

  const [tab, setTab] = useState<'generate' | 'elements' | 'style'>(initialData ? 'style' : 'generate');
  const [rawData, setRawData] = useState(initialRaw);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [role, setRole] = useState(initialRole);
  const [country, setCountry] = useState(initialCountry);
  const [generating, setGenerating] = useState(false);
  const [hasResume, setHasResume] = useState(!!initialData);
  const [credits, setCredits] = useState(0);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [genMessageIdx, setGenMessageIdx] = useState(0);

  const GEN_MESSAGES = [
    'Reading your career data…',
    'Structuring the right sections for you…',
    'Writing ATS-optimised bullet points…',
    'Aligning keywords with the job description…',
    'Polishing the final details…',
  ];

  useEffect(() => {
    if (!generating) {
      setGenMessageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setGenMessageIdx((i) => Math.min(i + 1, GEN_MESSAGES.length - 1));
    }, 2600);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generating]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) { setCredits(d.user.credits); setPremiumUnlocked(!!d.user.premiumUnlocked); } })
      .catch(() => {});

    const refresh = () => {
      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((d) => { if (d.user) { setCredits(d.user.credits); setPremiumUnlocked(!!d.user.premiumUnlocked); } })
        .catch(() => {});
    };
    window.addEventListener('qcv:credits-changed', refresh);
    return () => window.removeEventListener('qcv:credits-changed', refresh);
  }, []);

  const [accent, setAccent] = useState((initialData?.layout_config?.accent_color as string) || '#2058e8');
  const [customHex, setCustomHex] = useState(accent);
  const [activeTplId, setActiveTplId] = useState(TEMPLATES[0].id);
  const [photoOn, setPhotoOn] = useState(false);
  const [fontId, setFontId] = useState('dm-sans');
  const [fontScaleVal, setFontScaleVal] = useState(1);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [scores, setScores] = useState({ ats: 0, ai: 0 });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const [tplPanelOpen, setTplPanelOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: number; version_number: number; label: string; created_at: string }[]>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [headerVals, setHeaderVals] = useState({ name: '', target_role: '', email: '', phone: '', linkedin: '', github: '', location: '' });

  const showToast = useCallback((text: string, type: Toast['type']) => {
    const id = 't-' + Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    initEngine(
      {
        onResumeIdChange: (id) => {
          setHasResume(true);
          router.replace(`/builder/${id}`, { scroll: false });
        },
        onScoresChange: (ats, ai) => setScores({ ats, ai }),
        onSaveStatusChange: setSaveStatus,
        onUndoRedoChange: (u, r) => {
          setCanUndo(u);
          setCanRedo(r);
        },
        onChatMessage: (msg) => setChatMsgs((m) => [...m, msg]),
        onChatMessageRemove: (id) => setChatMsgs((m) => m.filter((x) => x.id !== id)),
        onToast: showToast,
        onHeaderSync: () => {
          const d = (window as any).currentData;
          if (d) {
            setHeaderVals({
              name: d.name || '',
              target_role: d.target_role || '',
              email: d.email || '',
              phone: d.phone || '',
              linkedin: d.linkedin || '',
              github: d.github || '',
              location: d.location || '',
            });
            setPhotoOn(!!d.layout_config?.show_photo);
          }
        },
        onTemplateChange: (tpl) => setActiveTplId(tpl.id),
        onColorChange: (hex) => {
          setAccent(hex);
          setCustomHex(hex);
        },
        onActionBtnsShow: () => setHasResume(true),
        onPreviewShow: () => setHasResume(true),
      },
      canvasRef.current,
      resumeId,
      initialData
    );

    return () => destroyEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGenerate() {
    setGenerating(true);
    setMobilePanelOpen(false);
    await generateResume({ rawData, jobDescription, country, role });
    setGenerating(false);
    setTab('style');
  }

  async function onPrint() {
    setPrinting(true);
    try {
      handleExport();
    } finally {
      // handleExport opens a new window synchronously; brief delay so the
      // spinner is visible rather than flashing for a single frame.
      setTimeout(() => setPrinting(false), 400);
    }
  }

  async function onDownloadPdf() {
    setDownloading(true);
    try {
      await downloadPdf();
    } finally {
      setDownloading(false);
    }
  }

  async function onSendChat() {
    if (!chatInput.trim() || chatSending) return;
    setChatSending(true);
    const msg = chatInput;
    setChatInput('');
    await sendChat(msg);
    setChatSending(false);
  }

  async function onOpenVersions() {
    if (!getCurrentResumeId()) {
      showToast('Save the resume first.', 'info');
      return;
    }
    setVersionModalOpen(true);
    const v = await fetchVersionHistory();
    setVersions(v);
  }

  async function onRestore(versionId: number) {
    const ok = await restoreVersion(versionId);
    if (ok) setVersionModalOpen(false);
  }

  function updateHeaderField(field: string, value: string) {
    const d = (window as any).currentData;
    if (!d) return;
    d[field] = value;
    setHeaderVals((h) => ({ ...h, [field]: value }));
    rerenderResume();
    scheduleAutoSave();
  }

  function togglePhoto(checked: boolean) {
    setPhotoOn(checked);
    const w = window as any;
    w.setShowPhoto?.(checked);
    if (checked && !((window as any).currentData?.layout_config?.photo_data_url)) {
      (document.getElementById('photo-file-input') as HTMLInputElement | null)?.click();
    }
  }

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] text-[var(--fg)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] flex-shrink-0 flex items-center gap-1">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button onClick={undo} disabled={!canUndo} title="Undo" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] disabled:opacity-30">
              <Undo2 size={14} />
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] disabled:opacity-30">
              <Redo2 size={14} />
            </button>
          </div>

          {hasResume && (
            <div className="hidden lg:flex items-center gap-4 text-xs text-[var(--fg-muted)] flex-1 justify-center">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : ''}
              </span>
              {scores.ats > 0 && (
                <span>
                  ATS: <b className="text-[var(--fg)]">{scores.ats}</b>/100
                </span>
              )}
              {scores.ai > 0 && (
                <span>
                  AI confidence: <b className="text-[var(--fg)]">{scores.ai}</b>/100
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Link
              href="/billing"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold rounded-full border border-[var(--border)] px-2.5 py-1.5 hover:bg-[var(--bg-subtle)]"
            >
              <Coins size={13} className="text-[var(--accent)]" /> {credits}
            </Link>
            {hasResume && (
              <>
                <button onClick={() => setTplPanelOpen((v) => !v)} title="Templates" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)]">
                  <Palette size={14} />
                </button>
                <button onClick={onOpenVersions} title="Version history" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)]">
                  <History size={14} />
                </button>
                <button onClick={() => saveResume(false)} title="Save" className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)]">
                  <Save size={14} />
                </button>
                <button
                  onClick={onPrint}
                  disabled={printing}
                  title="Print (alternate export)"
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                >
                  {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                </button>
                <button
                  onClick={onDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-[var(--accent)] text-white px-3 py-1.5 hover:bg-[var(--accent-hover)] disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span className="hidden sm:inline">{downloading ? 'Preparing…' : 'Download PDF'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile side-drawer backdrop */}
      {mobilePanelOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobilePanelOpen(false)} />
      )}

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 min-h-[calc(100vh-52px)]">
        {/* Left input panel — slide-in side drawer on mobile, static sidebar on desktop */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[86%] max-w-[340px] border-r shadow-2xl transition-transform duration-300 ease-out
            lg:static lg:z-auto lg:w-auto lg:max-w-none lg:shadow-none lg:translate-x-0
            border-[var(--border)] bg-[var(--bg)] overflow-y-auto
            ${mobilePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-3 py-3 lg:hidden border-b border-[var(--border)]">
            <span className="text-sm font-bold">Edit resume</span>
            <button onClick={() => setMobilePanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
              <X size={17} />
            </button>
          </div>
          <div className="flex gap-1 px-3 pt-3 pb-2 lg:px-0 lg:pt-0 lg:pb-0 lg:border-b border-[var(--border)]">
            {(['generate', 'elements', 'style'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-xs font-semibold py-2.5 capitalize rounded-full lg:rounded-none transition-colors ${
                  tab === t ? 'bg-[var(--accent)] text-white lg:bg-transparent lg:text-[var(--accent)] lg:border-b-2 lg:border-[var(--accent)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] lg:hover:bg-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* GENERATE TAB */}
          {tab === 'generate' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Career data</label>
                <textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  rows={9}
                  placeholder="Paste your education, projects, internships, skills, achievements…"
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Target role</label>
                <input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Job description (optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  placeholder="Paste the job description to tailor keywords…"
                  className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <button onClick={onGenerate} disabled={generating} className="w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center justify-center gap-2">
                {generating && <Loader2 size={15} className="animate-spin" />}
                {generating ? 'Generating…' : hasResume ? 'Regenerate with AI' : 'Generate resume with AI'}
              </button>
              <div className="text-center text-xs text-[var(--fg-muted)]">or</div>
              <button onClick={startFromTemplate} className="w-full rounded-lg border border-[var(--border)] text-[var(--fg-muted)] font-semibold py-2.5 text-sm hover:bg-[var(--bg-subtle)]">
                Start from blank template
              </button>
            </div>
          )}

          {/* ELEMENTS TAB */}
          {tab === 'elements' && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Add section</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SECTION_TYPE_LABELS.map((s) => (
                    <button key={s.type} onClick={() => addSection(s.type)} className="text-xs rounded-lg border border-[var(--border)] px-2 py-2 hover:border-blue-400 hover:bg-[var(--accent)]/10 text-left flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Add divider</div>
                <div className="flex gap-1.5 flex-wrap">
                  {DIVIDER_STYLES.map((s) => (
                    <button key={s} onClick={() => addDivider(s)} className="text-xs rounded-lg border border-[var(--border)] px-2.5 py-1.5 hover:border-blue-400 hover:bg-[var(--accent)]/10 capitalize">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed">Sections appear at the bottom of your resume — drag the ⣿ handle (hover a section) to reorder, or use the ▲▼ buttons.</p>
            </div>
          )}

          {/* STYLE TAB */}
          {tab === 'style' && (
            <div className="p-4 space-y-5">
              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Header fields</div>
                <div className="space-y-2">
                  {(['name', 'target_role', 'email', 'phone', 'linkedin', 'github', 'location'] as const).map((f) => (
                    <input
                      key={f}
                      value={(headerVals as any)[f]}
                      onChange={(e) => updateHeaderField(f, e.target.value)}
                      placeholder={f.replace('_', ' ')}
                      className="w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Accent color</div>
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => applyColor(hex)}
                      className={`w-8 h-8 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-[var(--bg)] transition-transform active:scale-90 ${
                        accent === hex ? 'ring-[var(--fg)]' : 'ring-transparent'
                      }`}
                      style={{ background: hex }}
                      title={hex}
                    />
                  ))}
                </div>
                <input
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  onBlur={() => /^#[0-9a-f]{6}$/i.test(customHex) && applyColor(customHex)}
                  className="w-full rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-mono"
                  placeholder="#2058e8"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Font</div>
                <div className="space-y-1">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFont(f.id);
                        setFontId(f.id);
                      }}
                      className={`w-full text-left text-sm rounded-lg px-2.5 py-1.5 ${fontId === f.id ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold' : 'hover:bg-[var(--bg-subtle)]'}`}
                      style={{ fontFamily: f.css }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-2">Text size</div>
                <div className="flex gap-1.5">
                  {[0.9, 1, 1.1, 1.2].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setFontScale(s);
                        setFontScaleVal(s);
                      }}
                      className={`flex-1 text-xs rounded-lg border py-1.5 ${fontScaleVal === s ? 'border-blue-500 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)]'}`}
                    >
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input id="photo-toggle" type="checkbox" checked={photoOn} onChange={(e) => togglePhoto(e.target.checked)} />
                Show photo
              </label>
              <input
                id="photo-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const w = window as any;
                  w.handlePhotoUpload?.(e.target);
                }}
              />
            </div>
          )}
        </div>

        {/* Right: canvas */}
        <div ref={canvasOuterRef} className="relative overflow-auto p-3 sm:p-8 flex justify-center bg-[var(--bg-subtle)]">
          {generating && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-subtle)]/90 backdrop-blur-sm">
              <div className="text-center px-6">
                <div className="relative w-14 h-14 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-[var(--accent)]" />
                </div>
                <p className="text-sm font-semibold mb-1">Generating your resume…</p>
                <p className="text-xs text-[var(--fg-muted)] transition-opacity duration-300">{GEN_MESSAGES[genMessageIdx]}</p>
              </div>
            </div>
          )}
          <div
            className="bg-white text-black shadow-lg rounded-sm w-[210mm] min-h-[297mm] p-[15mm] relative shrink-0"
            style={{ fontFamily: FONTS.find((f) => f.id === fontId)?.css, zoom: paperZoom }}
          >
            {!hasResume && !generating && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-8 z-10">
                <p className="text-gray-400 text-sm max-w-sm">
                  Paste your career data on the left and hit &ldquo;Generate resume with AI,&rdquo; or start from a blank template.
                </p>
              </div>
            )}
            <div id="rp-content" ref={canvasRef} />
          </div>

          {/* Template gallery drawer */}
          {tplPanelOpen && hasResume && (
            <div className="fixed bottom-0 left-0 lg:left-[300px] right-0 h-[300px] bg-[var(--bg)] border-t border-[var(--border)] shadow-2xl z-30 flex flex-col">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--border)]">
                <span className="text-sm font-bold">Choose a template ({TEMPLATES.length})</span>
                <button onClick={() => setTplPanelOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-6 px-5 py-4 h-full">
                  {categories.map((cat) => (
                    <div key={cat} className="flex-shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">{cat}</div>
                      <div className="flex gap-2.5">
                        {TEMPLATES.filter((t) => t.category === cat).map((tpl) => {
                          const locked = tpl.premium && !premiumUnlocked;
                          return (
                            <button
                              key={tpl.id}
                              onClick={() => (locked ? setUpsellOpen(true) : selectTemplate(tpl.id))}
                              title={locked ? `${tpl.name} — Premium (unlock by buying any credit pack)` : tpl.desc}
                              className={`flex-shrink-0 w-[92px] flex flex-col items-center gap-1.5 rounded-lg p-1.5 ${activeTplId === tpl.id ? 'ring-2 ring-[var(--accent)]' : ''}`}
                            >
                              <div className="w-full h-[124px] rounded border border-[var(--border)] bg-white overflow-hidden relative">
                                {locked && (
                                  <div className="absolute inset-0 bg-black/55 z-10 flex items-center justify-center">
                                    <Lock size={16} className="text-white" />
                                  </div>
                                )}
                                <span className="absolute top-1 right-1 bg-[var(--accent)] text-white text-[8px] px-1 rounded z-10">{tpl.ats}%</span>
                                <div
                                  className="pointer-events-none origin-top-left"
                                  style={{ width: '210mm', transform: 'scale(0.0985)', fontFamily: 'DM Sans, sans-serif' }}
                                  dangerouslySetInnerHTML={{ __html: tpl.render(PREVIEW_DATA, '#2058e8') }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-center leading-tight">{tpl.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium template upsell modal */}
      {upsellOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setUpsellOpen(false)}>
          <div className="bg-[var(--bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Premium template</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-5">
              This template is part of the full 30-template library. Buy any credit pack to unlock all premium templates permanently.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setUpsellOpen(false)} className="flex-1 text-sm font-semibold rounded-full border border-[var(--border)] py-2.5">
                Not now
              </button>
              <Link href="/pricing" className="flex-1 text-sm font-semibold rounded-full bg-[var(--accent)] text-white py-2.5 hover:bg-[var(--accent-hover)]">
                View plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile floating "Edit" button — opens the bottom sheet */}
      <button
        onClick={() => setMobilePanelOpen(true)}
        className="lg:hidden fixed bottom-5 left-5 z-30 inline-flex items-center gap-2 rounded-full bg-[var(--fg)] text-[var(--bg)] shadow-lg px-4 py-3 text-sm font-semibold"
        style={{ opacity: mobilePanelOpen ? 0 : 1, pointerEvents: mobilePanelOpen ? 'none' : 'auto' }}
      >
        <SlidersHorizontal size={16} /> Edit
      </button>

      {/* Chat toggle + panel */}
      {hasResume && (
        <>
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center text-lg z-40 hover:bg-[var(--accent-hover)]"
            style={{ opacity: chatOpen ? 0 : 1, pointerEvents: chatOpen ? 'none' : 'auto' }}
          >
            <MessageCircle size={20} />
          </button>
          <div
            className="fixed bottom-5 right-5 w-[360px] max-h-[500px] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col z-40 transition-all"
            style={{ transform: chatOpen ? 'translateY(0)' : 'translateY(20px)', opacity: chatOpen ? 1 : 0, pointerEvents: chatOpen ? 'auto' : 'none' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> AI Resume Chat
              </span>
              <button onClick={() => setChatOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[200px]">
              {chatMsgs.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Add a Skills section with bars', 'Convert my skills to dots instead', 'Make the first bullet more impactful', 'Add certifications section'].map((q) => (
                    <button key={q} onClick={() => setChatInput(q)} className="text-[11px] rounded-full border border-[var(--border)] px-2.5 py-1 hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {chatMsgs.map((m) => (
                <div key={m.id} className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[92%] ${m.role === 'user' ? 'bg-[var(--accent)] text-white self-end rounded-br-sm' : 'bg-[var(--bg-subtle)] border border-[var(--border)] self-start rounded-bl-sm'}`}>
                  {m.typing ? (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-2.5 border-t border-[var(--border)]">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                placeholder="e.g. Add a Skills section with bars for Python at 90%"
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button onClick={onSendChat} disabled={chatSending} className="rounded-lg bg-[var(--accent)] text-white text-sm font-semibold px-3 disabled:opacity-50 flex items-center justify-center">
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Version history modal */}
      {versionModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setVersionModalOpen(false)}>
          <div className="bg-[var(--bg)] rounded-2xl shadow-2xl w-[420px] max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <span className="font-bold text-sm">Version History</span>
              <button onClick={() => setVersionModalOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {versions.length === 0 ? (
                <div className="p-4 text-sm text-[var(--fg-muted)]">No versions yet.</div>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--bg-subtle)]">
                    <div>
                      <div className="text-sm font-semibold">{v.label || `Version ${v.version_number}`}</div>
                      <div className="text-xs text-[var(--fg-muted)]">{new Date(v.created_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => onRestore(v.id)} className="text-xs font-semibold rounded-lg border border-[var(--border)] px-2.5 py-1.5 hover:bg-[var(--bg-subtle)]">
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
