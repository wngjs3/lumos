import { useState, useRef, useEffect, useCallback } from "react";
import "./lumos.css";
import Viewer from "./Viewer";
import {
  MODELS, getModel, hashFile, loadCachedData, saveData,
  estimateFullPdfCost, formatCost, callGemini,
  renderPageToImage, loadPdfJs, DEFAULT_PROMPTS, storageKey,
  cachePdfBuffer, getCachedPdfBuffer, deleteCachedPdf,
} from "./lib/gemini";

interface RecentFile {
  name: string;
  hash: string;
  numPages: number;
  date: string;
}

function getRecentFiles(): RecentFile[] {
  return JSON.parse(localStorage.getItem('recent_files') || '[]');
}

function addRecentFile(name: string, hash: string, numPages: number) {
  let recent = getRecentFiles().filter(r => r.hash !== hash);
  recent.unshift({ name, hash, numPages, date: new Date().toISOString() });
  if (recent.length > 10) recent = recent.slice(0, 10);
  localStorage.setItem('recent_files', JSON.stringify(recent));
}

function removeRecentFile(hash: string) {
  const recent = getRecentFiles().filter(r => r.hash !== hash);
  localStorage.setItem('recent_files', JSON.stringify(recent));
  localStorage.removeItem(storageKey(hash));
  deleteCachedPdf(hash);
}

/* ── ASCII particle canvas logo ── */
const CODE_CHARS = '.:+-=*#@&~<>{}[]|/\\';

interface Particle {
  x: number; y: number;
  tx: number; ty: number;
  vx: number; vy: number;
  char: string;
  a: number; ta: number;
  text: boolean;
  phase: number;
  delay: number;
}

function AsciiLogo({
  text = "Lumos", width = 420, height = 100, color = "#00ff88",
  fontSize = 80, charSize = 6, step = 4, repelRadius = 90, repelForce = 4,
}: {
  text?: string; width?: number; height?: number; color?: string;
  fontSize?: number; charSize?: number; step?: number;
  repelRadius?: number; repelForce?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cleanupRef.current?.();

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    const off = document.createElement("canvas");
    off.width = width; off.height = height;
    const oc = off.getContext("2d")!;
    oc.font = `900 ${fontSize}px "IBM Plex Mono", "Nanum Gothic", monospace`;
    oc.fillStyle = "#fff";
    oc.textBaseline = "middle";
    oc.textAlign = "center";
    oc.fillText(text, width / 2, height / 2);

    const imgData = oc.getImageData(0, 0, width, height);
    const particles: Particle[] = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        if (imgData.data[idx + 3] > 100) {
          particles.push({
            x: x + (Math.random() - 0.5) * width * 0.5,
            y: y + (Math.random() - 0.5) * height * 2.5,
            tx: x, ty: y, vx: 0, vy: 0,
            char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
            a: 0, ta: 0.92 + Math.random() * 0.08,
            text: true, phase: Math.random() * Math.PI * 2,
            delay: x / width * 1.2,
          });
        }
      }
    }

    const bgCount = Math.max(20, Math.floor(particles.length * 0.12));
    for (let i = 0; i < bgCount; i++) {
      const px = Math.random() * width, py = Math.random() * height;
      particles.push({
        x: px, y: py, tx: px, ty: py,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
        a: 0, ta: 0.04 + Math.random() * 0.07,
        text: false, phase: Math.random() * Math.PI * 2, delay: Math.random() * 0.6,
      });
    }

    let mouseX = -9999, mouseY = -9999;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };
    const onTouchMove = (e: TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.touches[0].clientX - r.left; mouseY = e.touches[0].clientY - r.top;
    };
    canvas.addEventListener("mousemove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchstart", onTouchMove as any, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove as any, { passive: true });
    canvas.addEventListener("touchend", onLeave);

    const startTime = performance.now();
    let raf = 0;

    function draw(now: number) {
      const t = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `500 ${charSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = color;

      for (const p of particles) {
        const elapsed = Math.max(0, t - p.delay);
        if (p.text && elapsed < 0.01) { ctx.globalAlpha = 0.02; ctx.fillText(p.char, p.x, p.y); continue; }
        p.vx += (p.tx - p.x) * 0.04; p.vy += (p.ty - p.y) * 0.04;
        const dx = p.x - mouseX, dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < repelRadius && dist > 0) {
          const force = ((1 - dist / repelRadius) ** 2) * repelForce;
          p.vx += (dx / dist) * force; p.vy += (dy / dist) * force;
        }
        p.vx *= 0.88; p.vy *= 0.88; p.x += p.vx; p.y += p.vy;
        p.a += (p.ta - p.a) * 0.04;
        if (p.text) {
          p.a = p.ta + Math.sin(t * 0.8 + p.phase) * 0.05;
          if (elapsed < 0.8 || Math.random() < 0.0008) p.char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        } else {
          p.tx += (Math.random() - 0.5) * 0.2; p.ty += (Math.random() - 0.5) * 0.2;
          if (p.x < -20) p.x = p.tx = width + 10; if (p.x > width + 20) p.x = p.tx = -10;
          if (p.y < -20) p.y = p.ty = height + 10; if (p.y > height + 20) p.y = p.ty = -10;
          if (Math.random() < 0.003) p.char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        }
        ctx.globalAlpha = Math.max(0, p.a); ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchstart", onTouchMove as any);
      canvas.removeEventListener("touchmove", onTouchMove as any);
      canvas.removeEventListener("touchend", onLeave);
    };
    return () => { cleanupRef.current?.(); };
  }, [text, width, height, color, fontSize, charSize, step, repelRadius, repelForce]);

  return <canvas ref={canvasRef} style={{ display: "block", cursor: "default" }} />;
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33
               1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33
               l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1
               0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65
               1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0
               0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51
               1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

// ─── i18n ───
const T = {
  en: {
    tagline: 'Explore knowledge to the end.',
    uploadText: 'Drag & drop or click to upload PDF',
    recentFiles: 'Recent Files',
    pages: 'pages',
    done: 'done',
    settings: 'Settings',
    apiKeyLabel: 'Gemini API Key',
    modelLabel: 'Model',
    save: 'Save',
    loading: 'Loading PDF...',
    fileAnalysis: 'Analyzing file',
    renderingSlide: (c: number, t: number) => `Rendering slide (${c}/${t})`,
    generatingSummary: 'Generating summary...',
    apiCall: (n: number) => `Gemini API call (${n} slides)`,
    summaryDone: 'Summary complete!',
    costTitle: 'Estimated API Cost',
    costModel: 'Model',
    costTotal: 'Estimated total',
    costCached: 'Cached (free)',
    costAllCached: 'All data is cached — no additional cost!',
    costDisclaimer: '* Estimate based on official Gemini API pricing. Actual cost may vary.',
    cancel: 'Cancel',
    proceed: 'Proceed',
    setApiKey: 'Please set your Gemini API Key first.',
    noCachedPdf: 'Cached PDF not found. Please re-upload the file.',
    error: 'Error',
    footer: 'Designed by Juheon Choi · Logo inspired by',
  },
  ko: {
    tagline: '지식을 끝까지 탐구하세요.',
    uploadText: 'PDF를 드래그하거나 클릭해 업로드',
    recentFiles: '최근 파일',
    pages: '장',
    done: '완료',
    settings: '설정',
    apiKeyLabel: 'Gemini API Key',
    modelLabel: '모델',
    save: '저장',
    loading: 'PDF 로드 중...',
    fileAnalysis: '파일 분석',
    renderingSlide: (c: number, t: number) => `슬라이드 렌더링 (${c}/${t})`,
    generatingSummary: '전체 요약 생성 중...',
    apiCall: (n: number) => `Gemini API 호출 (${n}장 분석)`,
    summaryDone: '요약 완료!',
    costTitle: '예상 API 비용',
    costModel: '모델',
    costTotal: '예상 총 비용',
    costCached: '캐시 (무료)',
    costAllCached: '모든 데이터가 캐시되어 있어 추가 비용이 없습니다!',
    costDisclaimer: '* Gemini API 공식 가격 기준 추정치입니다. 실제 비용은 다를 수 있습니다.',
    cancel: '취소',
    proceed: '진행',
    setApiKey: 'Gemini API Key를 먼저 설정해주세요.',
    noCachedPdf: '캐시된 PDF를 찾을 수 없습니다. 파일을 다시 업로드해주세요.',
    error: '오류',
    footer: 'Designed by Juheon Choi · Logo inspired by',
  },
} as const;

type Lang = keyof typeof T;

// ─── Main App ───
type AppView = "landing" | "loading" | "cost-confirm" | "viewer";

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('lang') as Lang) || 'en'
  );
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const toggleLang = () => setLang(l => l === 'en' ? 'ko' : 'en');
  const t = T[lang];

  // Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [modelKey, setModelKey] = useState<string>(() => localStorage.getItem('gemini_model') || 'flash');

  // Upload
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading state
  const [loadingText, setLoadingText] = useState("");
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Cost confirm state
  const [costEstimate, setCostEstimate] = useState<{ items: any[]; total: number } | null>(null);
  const costResolveRef = useRef<((v: boolean) => void) | null>(null);

  // Viewer state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [pdfName, setPdfName] = useState("");
  const [pdfHash, setPdfHash] = useState("");
  const [pdfData, setPdfData] = useState<any>(null);

  const model = getModel(modelKey);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', modelKey);
    setShowSettings(false);
  };

  // Core loader — works with an ArrayBuffer (from file or cache)
  const loadPdfFromBuffer = useCallback(async (arrayBuffer: ArrayBuffer, fileName: string, hash: string) => {
    setView("loading");
    setLoadingText(t.loading);
    setLoadingStep(t.fileAnalysis);
    setLoadingProgress(0);

    try {
      const pdfjsLib = await loadPdfJs();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setPdfDoc(doc);
      setPdfName(fileName);
      setPdfHash(hash);

      // Render all pages as images
      const images: string[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        setLoadingStep(t.renderingSlide(i + 1, doc.numPages));
        setLoadingProgress((i + 1) / doc.numPages * 0.4);
        const img = await renderPageToImage(doc, i + 1);
        images.push(img);
      }
      setSlideImages(images);

      addRecentFile(fileName, hash, doc.numPages);

      // Load cached data
      const cached = loadCachedData(hash);
      const data = cached || {
        summary: null,
        slides: Array(doc.numPages).fill(null).map(() => ({ explanation: null, chat: [] })),
      };
      setPdfData(data);

      // Show cost confirmation
      const cachedSlides = data.slides.filter((s: any) => s?.explanation).length;
      const hasCachedSummary = !!data.summary;
      const estimate = estimateFullPdfCost(model, doc.numPages, hasCachedSummary, cachedSlides);
      setCostEstimate(estimate);

      setView("cost-confirm");

      // Wait for user decision
      const proceed = await new Promise<boolean>(resolve => {
        costResolveRef.current = resolve;
      });

      if (!proceed) {
        setView("landing");
        return;
      }

      // Generate summary if not cached
      if (!data.summary) {
        setView("loading");
        setLoadingText(t.generatingSummary);
        setLoadingStep(t.apiCall(images.length));
        setLoadingProgress(0.5);

        const parts: any[] = [{ text: DEFAULT_PROMPTS.summary }];
        for (let i = 0; i < images.length; i++) {
          parts.push({ text: `\n--- 슬라이드 ${i + 1} ---` });
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: images[i].split(',')[1] } });
        }

        const res = await callGemini(apiKey, model.id, [{ role: 'user', parts }]);
        data.summary = res.text;
        saveData(hash, data);
        setPdfData({ ...data });

        setLoadingProgress(1);
        setLoadingText(t.summaryDone);
      }

      // Go to viewer
      setView("viewer");
    } catch (e: any) {
      alert(`${t.error}: ${e.message}`);
      setView("landing");
    }
  }, [apiKey, model]); // eslint-disable-line react-hooks/exhaustive-deps

  // File upload handler — reads file, caches buffer, then loads
  const handleFile = useCallback(async (file: File) => {
    if (!apiKey) {
      alert(t.setApiKey);
      setShowSettings(true);
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    const hash = await hashFile(file);
    // Cache PDF in IndexedDB
    await cachePdfBuffer(hash, arrayBuffer.slice(0));
    await loadPdfFromBuffer(arrayBuffer, file.name, hash);
  }, [apiKey, loadPdfFromBuffer]);

  // Load from recent file cache
  const loadFromRecent = useCallback(async (rf: RecentFile) => {
    if (!apiKey) {
      alert(t.setApiKey);
      setShowSettings(true);
      return;
    }
    const buffer = await getCachedPdfBuffer(rf.hash);
    if (!buffer) {
      alert(t.noCachedPdf);
      return;
    }
    await loadPdfFromBuffer(buffer, rf.name, rf.hash);
  }, [apiKey, loadPdfFromBuffer]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') handleFile(f);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // ── Landing view ──
  if (view === "landing") {
    const recentFiles = getRecentFiles();

    return (
      <div className="page">
        <header className="hdr">
          <div />
          <div className="hdr__actions">
            <button className="hdr__lang" onClick={toggleLang}>
              {lang === 'en' ? 'KO' : 'EN'}
            </button>
            <button className="hdr__theme" onClick={toggleTheme} aria-label="테마 전환">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button className="hdr__settings" onClick={() => setShowSettings(s => !s)} aria-label="설정">
              <SettingsIcon />
            </button>
          </div>
        </header>

        {showSettings && <div className="settings-scrim" onClick={() => setShowSettings(false)} />}
        {showSettings && (
          <div className="settings-panel">
            <h3 className="sp__title">{t.settings}</h3>
            <div className="sp__field">
              <label className="sp__label">{t.apiKeyLabel}</label>
              <input className="sp__input" type="password" placeholder="AIza..."
                value={apiKey} onChange={e => setApiKey(e.target.value)} />
            </div>
            <div className="sp__divider" />
            <div className="sp__field">
              <label className="sp__label">{t.modelLabel}</label>
              <select className="sp__select" value={modelKey} onChange={e => setModelKey(e.target.value)}>
                {Object.entries(MODELS).map(([k, m]) => (
                  <option key={k} value={k}>{m.label} — ${m.inputPerMToken} / ${m.outputPerMToken}</option>
                ))}
              </select>
            </div>
            <button className="sp__save" onClick={saveSettings}>{t.save}</button>
          </div>
        )}

        <main className="main">
          <AsciiLogo text="Lumos" width={700} height={180} fontSize={140}
            charSize={8} step={2} repelRadius={110} repelForce={5}
            color={theme === 'dark' ? '#00ff88' : '#1a1c2e'} />
          <p className="tagline">{t.tagline}</p>

          <div
            className={`upload ${isDragging ? "upload--drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={handleChange} />
            <svg className="upload__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="upload__text">{t.uploadText}</span>
          </div>

          {/* ── Recent files ── */}
          {recentFiles.length > 0 && (
            <div className="recent">
              <h3 className="recent__title">{t.recentFiles}</h3>
              {recentFiles.map(rf => {
                const cached = loadCachedData(rf.hash);
                const doneCount = cached ? cached.slides.filter((s: any) => s?.explanation).length : 0;
                return (
                  <div key={rf.hash} className="recent__item" onClick={() => loadFromRecent(rf)}>
                    <div className="recent__info">
                      <span className="recent__name">{rf.name}</span>
                      <span className="recent__meta">
                        {new Date(rf.date).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')} · {rf.numPages} {t.pages} · {doneCount}/{rf.numPages} {t.done}
                      </span>
                    </div>
                    <button className="recent__delete" onClick={e => {
                      e.stopPropagation();
                      removeRecentFile(rf.hash);
                      // Force re-render
                      setShowSettings(s => { setTimeout(() => setShowSettings(s), 0); return s; });
                    }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <footer className="landing-footer">
            <span className="landing-footer__credit">
              Designed by <a href="https://juheonchoi.com" target="_blank" rel="noopener noreferrer">Juheon Choi</a>
            </span>
            <span className="landing-footer__sub">
              Logo inspired by <a href="https://ukint-vs.github.io/" target="_blank" rel="noopener noreferrer">ukint-vs.github.io</a>
            </span>
          </footer>
        </main>
      </div>
    );
  }

  // ── Loading view ──
  if (view === "loading") {
    return (
      <div className="page">
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="upload__spinner" />
            <p className="loading__text">{loadingText}</p>
            <p className="loading__step">{loadingStep}</p>
            <div className="upload__bar" style={{ width: 240 }}>
              <div className="upload__fill" style={{ width: `${Math.round(loadingProgress * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cost confirmation view ──
  if (view === "cost-confirm" && costEstimate) {
    return (
      <div className="page">
        <div className="loading-overlay">
          <div className="cost-card">
            <h3 className="cost-card__title">{t.costTitle}</h3>
            <div className="cost-card__model">
              <span>{t.costModel}</span>
              <span className="cost-card__accent">{model.label}</span>
            </div>
            {costEstimate.items.map((item, i) => (
              <div key={i} className="cost-card__row">
                <span>{item.label}</span>
                <span className={item.cached ? "cost-card__cached" : ""}>
                  {item.cached ? t.costCached : formatCost(item.cost)}
                </span>
              </div>
            ))}
            <div className="cost-card__total">
              <span>{t.costTotal}</span>
              <span>{formatCost(costEstimate.total)}</span>
            </div>
            {costEstimate.total === 0 && (
              <p className="cost-card__cached" style={{ textAlign: 'center', marginTop: 8 }}>
                {t.costAllCached}
              </p>
            )}
            <p className="cost-card__disclaimer">
              {t.costDisclaimer}
            </p>
            <div className="cost-card__actions">
              <button className="btn-ghost" onClick={() => costResolveRef.current?.(false)}>{t.cancel}</button>
              <button className="btn-primary" onClick={() => costResolveRef.current?.(true)}>{t.proceed}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Viewer ──
  if (view === "viewer" && pdfDoc && pdfData) {
    return (
      <Viewer
        pdfDoc={pdfDoc}
        slideImages={slideImages}
        pdfName={pdfName}
        pdfHash={pdfHash}
        data={pdfData}
        apiKey={apiKey}
        modelId={model.id}
        modelPricing={{ inputPerMToken: model.inputPerMToken, outputPerMToken: model.outputPerMToken }}
        onBack={() => setView("landing")}
      />
    );
  }

  return null;
}
