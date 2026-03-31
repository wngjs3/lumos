import { useState, useRef, useEffect, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  callGemini, md, formatCost, MODELS, getModel,
  DEFAULT_PROMPTS, saveData as persistData,
} from "./lib/gemini";

// ── Render markdown + LaTeX to HTML string (no DOM mutation) ──
function renderContent(text: string): string {
  let html = md(text);
  // Block math: $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try { return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); }
    catch { return `$$${tex}$$`; }
  });
  // Inline math: $...$  (avoid matching already-rendered katex spans or dollar amounts)
  html = html.replace(/\$([^\$<\n]+?)\$/g, (_, tex) => {
    try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); }
    catch { return `$${tex}$`; }
  });
  return html;
}

interface SlideData {
  explanation: string | null;
  chat: { role: string; text: string }[];
}

interface ViewerProps {
  pdfDoc: any;
  slideImages: string[];
  pdfName: string;
  pdfHash: string;
  data: { summary: string | null; slides: SlideData[] };
  apiKey: string;
  modelId: string;
  modelPricing: { inputPerMToken: number; outputPerMToken: number };
  onBack: () => void;
}

export default function Viewer({
  pdfDoc, slideImages, pdfName, pdfHash,
  data, apiKey, modelId, modelPricing, onBack,
}: ViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideExplanations, setSlideExplanations] = useState<(string | null)[]>(
    () => data.slides.map(s => s?.explanation || null)
  );
  const [loadingSlides, setLoadingSlides] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatModelKey, setChatModelKey] = useState<string>(() => {
    // Find key matching the passed modelId
    const entry = Object.entries(MODELS).find(([, m]) => m.id === modelId);
    return entry ? entry[0] : 'flash';
  });
  const [sessionCost, setSessionCost] = useState(0);
  const [chatHeight, setChatHeight] = useState(280);
  const [rightWidth, setRightWidth] = useState(480);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const slideCanvasRef = useRef<HTMLCanvasElement>(null);
  const resizingRef = useRef<'chat' | 'width' | false>(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const save = useCallback(() => persistData(pdfHash, data), [pdfHash, data]);

  const addCost = useCallback((promptTokens: number, outputTokens: number) => {
    const ic = (promptTokens / 1_000_000) * modelPricing.inputPerMToken;
    const oc = (outputTokens / 1_000_000) * modelPricing.outputPerMToken;
    setSessionCost(prev => prev + ic + oc);
  }, [modelPricing]);

  // ── Generate ALL slide explanations in parallel on mount ──
  useEffect(() => {
    const generate = async (idx: number) => {
      if (data.slides[idx]?.explanation) return;
      setLoadingSlides(prev => new Set(prev).add(idx));

      const prompt = DEFAULT_PROMPTS.slide
        .replace('{summary}', data.summary || '')
        .replace('{slideNumber}', String(idx + 1))
        .replace('{totalSlides}', String(slideImages.length));

      const parts: any[] = [
        { text: '이 슬라이드를 설명해주세요.' },
        { inlineData: { mimeType: 'image/jpeg', data: slideImages[idx].split(',')[1] } },
      ];

      try {
        const res = await callGemini(apiKey, modelId, [{ role: 'user', parts }], prompt);
        data.slides[idx].explanation = res.text;
        save();
        setSlideExplanations(prev => { const n = [...prev]; n[idx] = res.text; return n; });
        addCost(res.promptTokens, res.outputTokens);
      } catch (e: any) {
        setSlideExplanations(prev => { const n = [...prev]; n[idx] = `오류: ${e.message}`; return n; });
      }
      setLoadingSlides(prev => { const n = new Set(prev); n.delete(idx); return n; });
    };

    const uncached = slideImages.map((_, i) => i).filter(i => !data.slides[i]?.explanation);
    const BATCH = 5;
    (async () => {
      for (let b = 0; b < uncached.length; b += BATCH) {
        await Promise.all(uncached.slice(b, b + BATCH).map(generate));
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render slide on canvas ──
  useEffect(() => {
    (async () => {
      if (!pdfDoc || !slideCanvasRef.current) return;
      const page = await pdfDoc.getPage(currentSlide + 1);
      const canvas = slideCanvasRef.current;
      const wrap = canvas.parentElement!;
      const baseVp = page.getViewport({ scale: 1 });
      const scale = Math.min(
        (wrap.clientWidth - 32) / baseVp.width,
        (wrap.clientHeight - 32) / baseVp.height,
        3,
      );
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    })();
  }, [pdfDoc, currentSlide]);

  // ── Sync chat when slide changes ──
  useEffect(() => {
    setChatMessages(data.slides[currentSlide]?.chat || []);
  }, [currentSlide, data.slides]);

  const currentExpl = slideExplanations[currentSlide];
  const isCurrentLoading = loadingSlides.has(currentSlide);

  // ── Scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // ── Resize handles (chat height + right panel width) ──
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;

      if (resizingRef.current === 'chat' && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const newHeight = panelRect.bottom - e.clientY;
        setChatHeight(Math.max(120, Math.min(newHeight, window.innerHeight * 0.7)));
      }

      if (resizingRef.current === 'width') {
        const newWidth = window.innerWidth - e.clientX;
        setRightWidth(Math.max(300, Math.min(newWidth, window.innerWidth * 0.65)));
      }
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startChatResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = 'chat';
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const startWidthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = 'width';
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // ── Refresh single explanation ──
  const refreshExplanation = async () => {
    setLoadingSlides(prev => new Set(prev).add(currentSlide));
    data.slides[currentSlide].explanation = null;
    setSlideExplanations(prev => { const n = [...prev]; n[currentSlide] = null; return n; });
    save();

    const prompt = DEFAULT_PROMPTS.slide
      .replace('{summary}', data.summary || '')
      .replace('{slideNumber}', String(currentSlide + 1))
      .replace('{totalSlides}', String(slideImages.length));

    const parts: any[] = [
      { text: '이 슬라이드를 설명해주세요.' },
      { inlineData: { mimeType: 'image/jpeg', data: slideImages[currentSlide].split(',')[1] } },
    ];

    try {
      const res = await callGemini(apiKey, modelId, [{ role: 'user', parts }], prompt);
      data.slides[currentSlide].explanation = res.text;
      save();
      setSlideExplanations(prev => { const n = [...prev]; n[currentSlide] = res.text; return n; });
      addCost(res.promptTokens, res.outputTokens);
    } catch (e: any) {
      setSlideExplanations(prev => { const n = [...prev]; n[currentSlide] = `오류: ${e.message}`; return n; });
    }
    setLoadingSlides(prev => { const n = new Set(prev); n.delete(currentSlide); return n; });
  };

  // ── Send chat ──
  const sendChat = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatLoading(true);

    const slide = data.slides[currentSlide];
    const sysPrompt = DEFAULT_PROMPTS.qa
      .replace('{summary}', data.summary || '')
      .replace('{slideNumber}', String(currentSlide + 1))
      .replace('{explanation}', slide.explanation || '');

    const recent = slide.chat.slice(-10);
    const contents = recent.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
    contents.push({ role: 'user', parts: [{ text: q }] });

    slide.chat.push({ role: 'user', text: q });
    setChatMessages([...slide.chat]);

    const chatModel = getModel(chatModelKey);
    try {
      const res = await callGemini(apiKey, chatModel.id, contents, sysPrompt);
      slide.chat.push({ role: 'ai', text: res.text });
      save();
      setChatMessages([...slide.chat]);
      addCost(res.promptTokens, res.outputTokens);
    } catch (e: any) {
      slide.chat.push({ role: 'ai', text: `오류: ${e.message}` });
      save();
      setChatMessages([...slide.chat]);
    }
    setChatLoading(false);
  };

  const doneCount = slideExplanations.filter(Boolean).length;

  return (
    <div className="viewer">
      {/* ── Left: slide + thumbnails ── */}
      <div className="v-left">
        <div className="v-left__header">
          <button className="v-back" onClick={onBack}>←</button>
          <span className="v-filename">{pdfName}</span>
          <span className="v-slide-num">({currentSlide + 1}/{slideImages.length})</span>
          {sessionCost > 0 && <span className="v-cost">{formatCost(sessionCost)}</span>}
        </div>

        <div className="v-slide-canvas-wrap">
          <canvas ref={slideCanvasRef} />
        </div>

        <div className="v-thumbs-bar">
          {slideImages.map((img, i) => (
            <div
              key={i}
              className={`v-thumb ${i === currentSlide ? 'v-thumb--active' : ''} ${slideExplanations[i] ? 'v-thumb--done' : ''}`}
              onClick={() => setCurrentSlide(i)}
            >
              <img src={img} alt={`${i + 1}`} />
              <span className="v-thumb__num">{i + 1}</span>
              {loadingSlides.has(i) && <span className="v-thumb__loading" />}
            </div>
          ))}
        </div>

        <div className="v-progress-bar">
          <div className="v-progress__fill" style={{ width: `${(doneCount / slideImages.length) * 100}%` }} />
        </div>
      </div>

      {/* ── Width resize handle ── */}
      <div className="v-resize-handle-x" onMouseDown={startWidthResize} />

      {/* ── Right: explanation (top) + resize handle + chat (bottom) ── */}
      <div className="v-right" ref={rightPanelRef} style={{ width: rightWidth }}>
        <div className="v-explanation" style={{ flex: 1, minHeight: 0 }}>
          <div className="v-explanation__header">
            <span>AI 설명</span>
            <button className="v-refresh" onClick={refreshExplanation} disabled={isCurrentLoading}>
              ↻ 새로고침
            </button>
          </div>
          <div className="v-explanation__body">
            {isCurrentLoading ? (
              <div className="v-loading">설명 생성 중<span className="dots" /></div>
            ) : currentExpl ? (
              <div dangerouslySetInnerHTML={{ __html: renderContent(currentExpl) }} />
            ) : (
              <div className="v-loading">슬라이드를 선택하세요.</div>
            )}
          </div>
        </div>

        {/* ── Chat resize handle (vertical) ── */}
        <div className="v-resize-handle" onMouseDown={startChatResize} />

        <div className="v-chat" style={{ height: chatHeight, flexShrink: 0 }}>
          <div className="v-chat__header">
            <span>질의응답</span>
            <button className="v-clear-chat" onClick={() => {
              data.slides[currentSlide].chat = [];
              save();
              setChatMessages([]);
            }}>초기화</button>
          </div>
          <div className="v-chat__messages">
            {chatMessages.length === 0 && (
              <p className="v-chat__hint">이 슬라이드에 대해 질문하세요.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`v-msg v-msg--${msg.role}`}>
                <div
                  className="v-msg__bubble"
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'ai' ? renderContent(msg.text) : msg.text.replace(/</g, '&lt;'),
                  }}
                />
              </div>
            ))}
            {chatLoading && (
              <div className="v-msg v-msg--ai">
                <div className="v-msg__bubble v-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="v-chat__input">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="질문을 입력하세요..."
              disabled={chatLoading}
            />
            <select
              className="v-chat__model"
              value={chatModelKey}
              onChange={e => setChatModelKey(e.target.value)}
              disabled={chatLoading}
            >
              {Object.entries(MODELS).map(([k, m]) => (
                <option key={k} value={k}>{m.label.replace('Gemini ', '')}</option>
              ))}
            </select>
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>전송</button>
          </div>
        </div>
      </div>
    </div>
  );
}
